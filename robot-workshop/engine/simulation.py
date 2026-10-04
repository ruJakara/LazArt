import random
from copy import deepcopy
from .economy import action_cost, empty_metrics, parts_cost, profit


class DaySimulation:
    def __init__(self, state, content):
        self.s, self.c = state, content
        self.b = content["balance"]
        self.product = content["products"][content["lesson"]["product"]]
        self.rng = random.Random(f'{state["seed"]}:{state["day"]}')
        self.m = empty_metrics()
        self.costs = {role: 0 for role in state["config"]}
        self.tick = 0
        self.opening_balance = state["balance"]
        self.opening_totals = deepcopy(state["totals"])
        self.last_event = len(state["events"])
        self.scene_index = 0
        self.accepted = self.capacity = 0

    def scene(self, actor, kind, unit=None, duration=800):
        """A checkpoint after a real operation, never a precomputed replay."""
        events = self.s["events"][self.last_event:]
        self.last_event = len(self.s["events"])
        self.scene_index += 1
        return {"id": self.scene_index, "actor": actor, "kind": kind, "unit": unit,
                "duration_ms": duration, "events": deepcopy(events)}

    def live_state(self):
        totals = {key: round(self.opening_totals[key] + value, 2) for key, value in self.m.items()}
        totals["profit"] = round(self.opening_totals["profit"] + profit(self.m), 2)
        return {"day": self.s["day"], "balance": round(self.opening_balance + profit(self.m), 2),
                "totals": totals, "inventory": deepcopy(self.s["inventory"]),
                "pending_delivery": deepcopy(self.s["pending_delivery"]), "dirt": self.s["dirt"],
                "worker_costs": {role: round(cost, 2) for role, cost in self.costs.items()},
                "events": deepcopy(self.s["events"]), "capacity": self.capacity, "accepted": self.accepted}

    def event(self, actor, code, message, level="info", **data):
        self.tick += 1
        event = {"day": self.s["day"], "tick": self.tick, "actor": actor,
                 "event": code, "message": message, "level": level, "data": data}
        self.s["events"].append(event)
        if actor in self.s["memory"]:
            memory = self.s["memory"][actor]
            memory.append(event)
            del memory[:-max(self.b["context_sizes"])]

    def worker(self, role):
        return self.s["config"][role]

    def rule(self, role, rule):
        return rule in self.worker(role)["rules"]

    def memory(self, role):
        size = self.worker(role)["context"]
        return self.s["memory"][role][-size:] if size else []

    def quality(self, role):
        worker = self.worker(role)
        model = self.c["models"][worker["model"]]
        q = model["quality"]
        if self.rule(role, "prioritize_quality"):
            q += self.b["quality_bonus"] * model["instruction_following"]
        # Only relevant remembered events help, not arbitrary padding.
        useful = sum(e["event"] in ("product_defect", "problem_reported", "stock_checked", "workshop_checked", "rework_requested") for e in self.memory(role))
        q += min(5, useful) * self.b["context_bonus_per_event"]
        if worker["context"] == max(self.b["context_sizes"]):
            q -= self.b["excess_context_penalty"]
        return max(0, min(0.99, q))

    def action(self, role, tool, message=None, **data):
        cost = action_cost(self.worker(role), tool, self.c)
        self.m["ai_cost"] += cost
        self.costs[role] += cost
        if tool not in self.worker(role)["tools"]:
            self.event(role, "missing_tool", f'Нет инструмента {tool}: действие не выполнено.', "error", tool=tool, ai_cost=cost)
            return False
        definition = self.c["tools"][tool]
        self.event(role, definition["effect"], message or definition["name"], tool=tool, ai_cost=cost, **data)
        return True

    def reception(self, capacity):
        order = self.b["orders"][(self.s["day"] - 1) % len(self.b["orders"])]
        self.event("client", "order_received", f"Новый заказ: {order} пылесосов.", amount=order)
        yield self.scene("reception", "order_received", duration=1200)
        read = self.action("reception", "read_order")
        yield self.scene("reception", "read_order")
        if not read:
            return 0
        checked = False
        if self.rule("reception", "check_capacity_before_accept"):
            checked = self.action("reception", "check_capacity", f"Мощность линии: {capacity} изделий.")
            yield self.scene("reception", "check_capacity")
        accepted = min(order, capacity) if checked else order
        if order > accepted:
            if self.action("reception", "reject_order", f"Лишние заказы отклонены: {order - accepted}."):
                self.m["rejected_orders"] = order - accepted
            else:
                accepted = order
            yield self.scene("reception", "reject_order")
        if not checked:
            self.event("reception", "unchecked_order", "Заказ принят без проверки мощности.", "warning")
        success = self.action("reception", "accept_order", f"Принято: {accepted} изделий.")
        yield self.scene("reception", "accept_order")
        return accepted if success else 0

    def warehouse(self, target):
        if target == 0:
            return False
        stock = self.s["inventory"]
        checked = False
        if self.rule("warehouse", "check_before_order"):
            checked = self.action("warehouse", "check_stock", "Проверены остатки деталей.", inventory=dict(stock))
            yield self.scene("warehouse", "check_stock")
        remembered = any(e["event"] == "delivery_received" and e["day"] == self.s["day"] - 1 for e in self.memory("warehouse"))
        if checked:
            buy = {p: max(0, n * target - stock[p]) for p, n in self.product["parts"].items()}
            if not self.rule("warehouse", "do_not_overbuy"):
                buy = {p: n + self.product["parts"][p] for p, n in buy.items()}
        else:
            extra = self.b["overbuy_units"] - (1 if remembered else 0)
            buy = {p: n * (target + extra) for p, n in self.product["parts"].items()}
            self.event("warehouse", "overbuy", "Закупка без проверки склада: повторно заказаны полные комплекты.", "warning", extra_units=extra)
        cost = parts_cost(buy, self.product)
        available = self.s["balance"] + self.m["revenue"] - sum(self.m[k] for k in ("material_cost", "ai_cost", "operating_cost", "penalties"))
        if cost and cost <= available:
            if self.action("warehouse", "order_parts", f"Заказ деталей на {cost} ₽.", parts=buy, cost=cost):
                self.m["material_cost"] += cost
                # Paid deliveries are real state, including when receiving is unavailable.
                for p, n in buy.items():
                    self.s["pending_delivery"][p] += n
        elif cost:
            self.event("warehouse", "insufficient_funds", "На закупку не хватает денег; используются остатки.", "warning", cost=cost)
        if cost:
            yield self.scene("warehouse", "order_parts", duration=1000)
        if any(self.s["pending_delivery"].values()):
            if self.action("warehouse", "receive_delivery", "Поставка принята на склад.", parts=dict(self.s["pending_delivery"])):
                for p, n in self.s["pending_delivery"].items():
                    stock[p] += n
                    self.s["pending_delivery"][p] = 0
            yield self.scene("warehouse", "receive_delivery", duration=1500)
        issued = self.action("warehouse", "issue_parts")
        yield self.scene("warehouse", "issue_parts", duration=1200)
        return issued

    def engineer(self):
        read = self.action("engineer", "read_blueprint")
        yield self.scene("engineer", "read_blueprint")
        if not read:
            return None
        calculated = self.action("engineer", "calculate_parts")
        yield self.scene("engineer", "calculate_parts", duration=1100)
        if not calculated:
            return None
        error = (1 - self.quality("engineer")) * self.b["engineering_complexity"]
        if self.rng.random() < error:
            if self.rule("engineer", "report_errors") and self.action("engineer", "report_problem", "Обнаружена и исправлена ошибка схемы."):
                yield self.scene("engineer", "report_problem")
                return error / 2
            self.event("engineer", "blueprint_error", "Ошибка в расчёте увеличила риск брака.", "warning")
            yield self.scene("engineer", "report_problem")
            return error
        return 0

    def consume(self, parts):
        stock = self.s["inventory"]
        if any(stock[p] < n for p, n in parts.items()):
            return False
        for p, n in parts.items():
            stock[p] -= n
        return True

    def assemble(self, index, engineering_error):
        taken = self.action("assembler", "take_parts", unit=index)
        yield self.scene("assembler", "take_parts", index, 1600)
        if not taken:
            return
        if "assemble_vacuum" not in self.worker("assembler")["tools"]:
            self.action("assembler", "assemble_vacuum")
            yield self.scene("assembler", "assemble_vacuum", index)
            return
        if not self.consume(self.product["parts"]):
            self.event("assembler", "shortage", "Не хватает полного комплекта деталей.", "warning")
            yield self.scene("assembler", "shortage", index)
            return
        self.action("assembler", "assemble_vacuum", f"Собран пылесос #{index}.", unit=index)
        self.m["units_started"] += 1
        yield self.scene("assembler", "assemble_vacuum", index, 1200)
        rate = self.b["base_defect_rate"] + (1 - self.quality("assembler")) * self.b["assembly_complexity"]
        rate += engineering_error + self.s["dirt"] * self.b["dirty_defect_penalty"]
        if self.rule("assembler", "prioritize_speed"):
            rate += self.b["speed_defect_penalty"]
        if self.rule("assembler", "test_before_send"):
            tested = self.action("assembler", "basic_test")
            yield self.scene("assembler", "basic_test", index)
            if tested:
                rate -= self.b["test_bonus"] * self.c["models"][self.worker("assembler")["model"]]["instruction_following"]
        else:
            tested = False
        if not tested:
            self.event("assembler", "missing_test", "Изделие передано без базового теста.", "warning")
        defective = self.rng.random() < max(0.01, min(0.95, rate))
        if defective:
            self.m["defects"] += 1
            self.s["dirt"] += 1
            self.event("assembler", "product_defect", "При сборке возник дефект.", "warning", unit=index)
            if self.rule("assembler", "report_errors"):
                self.event("assembler", "problem_reported", "Дефект сохранён в рабочем журнале.", unit=index)
        sent = self.action("assembler", "send_to_qc", unit=index)
        yield self.scene("assembler", "send_to_qc", index, 1600)
        if not sent:
            self.m["waste"] += 1
            return
        yield from self.inspect(index, defective)

    def inspect(self, index, defective):
        inspected = self.action("qc", "inspect_product", f"Осмотр изделия #{index}.")
        detection = self.rng.random()  # Common random draw for each inspected unit.
        if not inspected:
            self.event("qc", "missing_inspection", "QC не смог осмотреть изделие.", "warning", unit=index)
        yield self.scene("qc", "inspect_product", index, 1100)
        detected = defective and inspected and detection < self.quality("qc")
        if detected:
            self.event("qc", "product_defect", "Контроль обнаружил дефект.", "warning", unit=index)
            repaired = False
            requested = self.action("qc", "request_rework", unit=index)
            yield self.scene("qc", "request_rework", index, 1300)
            if requested:
                repair_parts = {"sensor": 1}
                if self.consume(repair_parts) and self.action("assembler", "assemble_vacuum", "Переделка изделия."):
                    self.m["reworks"] += 1
                    repaired = self.rng.random() < self.b["rework_success"] * self.quality("assembler")
                    yield self.scene("assembler", "rework", index, 1400)
            if repaired:
                defective = False
                self.event("qc", "rework_completed", "Переделка устранила дефект.", unit=index)
            else:
                rejected = self.action("qc", "reject_product")
                if rejected:
                    self.m["waste"] += 1
                    self.m["penalties"] += self.b["scrap_cost"]
                    yield self.scene("qc", "reject_product", index)
                    return
        approved = self.action("qc", "approve_product", unit=index)
        yield self.scene("qc", "approve_product", index)
        if not approved:
            self.m["waste"] += 1
            return
        if defective:
            self.m["returns"] += 1
            self.m["penalties"] += self.b["return_penalty"]
            self.m["waste"] += 1
            self.event("client", "product_returned", "Клиент вернул неисправный пылесос. Выручка не начислена.", "warning", unit=index)
        else:
            self.m["units_completed"] += 1
            self.m["units_sold"] += 1
            self.m["revenue"] += self.product["sale_price"]
            self.event("shipping", "product_sold", f'Отгружено изделие #{index}: +{self.product["sale_price"]} ₽.', unit=index)
        yield self.scene("qc", "product_returned" if defective else "product_sold", index, 1600)

    def clean(self):
        checked = self.action("cleaner", "check_workshop", f'Отходы в цехе: {self.s["dirt"]}.', dirt=self.s["dirt"])
        yield self.scene("cleaner", "check_workshop", duration=1400)
        clean = self.action("cleaner", "clean_floor")
        yield self.scene("cleaner", "clean_floor", duration=1600)
        removed = self.action("cleaner", "remove_scrap")
        chance = 1 - (1 - self.quality("cleaner")) * self.b["cleaning_complexity"]
        if checked and clean and removed and self.rng.random() < chance:
            self.s["dirt"] = 0
        else:
            self.s["dirt"] += 1
            self.event("cleaner", "dirty_workshop", "Отходы остались в цехе: завтра линия будет работать хуже.", "warning")
            if self.rule("cleaner", "report_errors"):
                self.action("cleaner", "report_damage")
        yield self.scene("cleaner", "remove_scrap", duration=1200)

    def steps(self):
        capacity = self.b["capacity"] + (self.b["speed_capacity_bonus"] if self.rule("assembler", "prioritize_speed") else 0)
        capacity = max(0, capacity - self.s["dirt"] // self.b["dirty_capacity_threshold"])
        self.capacity = capacity
        accepted = yield from self.reception(capacity)
        self.accepted = accepted
        supplied = yield from self.warehouse(min(capacity, accepted))
        engineering_error = (yield from self.engineer()) if accepted else None
        if supplied and engineering_error is not None:
            for index in range(1, min(capacity, accepted) + 1):
                yield from self.assemble(index, engineering_error)
        self.m["idle_time"] = capacity - self.m["units_started"]
        self.m["missed_orders"] = max(0, accepted - self.m["units_sold"])
        self.m["penalties"] += self.m["missed_orders"] * self.b["missed_order_penalty"]
        yield from self.clean()
        self.m["operating_cost"] = self.b["operating_cost"]
        self.m["ai_cost"] = round(self.m["ai_cost"], 2)
        self.m["profit"] = profit(self.m)
        self.s["balance"] = round(self.s["balance"] + self.m["profit"], 2)
        self.s["idle_days"] = self.s["idle_days"] + 1 if not self.m["units_started"] else 0
        for key, value in self.m.items():
            self.s["totals"][key] = round(self.s["totals"][key] + value, 2)
        for role, cost in self.costs.items():
            self.costs[role] = round(cost, 2)
            self.s["worker_costs"][role] = round(self.s["worker_costs"][role] + cost, 2)
        self.event("accounting", "day_closed", f'День завершён. Прибыль: {self.m["profit"]} ₽.', balance=self.s["balance"])
        yield self.scene("accounting", "day_closed", duration=900)
        return {"day": self.s["day"], **self.m, "worker_costs": self.costs,
                "balance": self.s["balance"], "accepted": accepted, "capacity": capacity}

    def run(self):
        steps = self.steps()
        while True:
            try:
                next(steps)
            except StopIteration as done:
                return done.value
