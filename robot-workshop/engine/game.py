import json
import secrets
from copy import deepcopy
from .content import load_content
from .economy import empty_metrics
from .scoring import outcome, insights, summary
from .simulation import DaySimulation
from .validator import validate_config
from .workers import initial_config


class Game:
    def __init__(self, seed=None, content=None):
        self.content = content or load_content()
        self.previous = None
        self.new(seed)

    def new(self, seed=None, keep_config=False):
        c = self.content
        config = deepcopy(self.state["config"]) if keep_config else initial_config(c)
        mode = self.state["mode"] if keep_config else "auto"
        if hasattr(self, "state") and self.state["reports"]:
            self.previous = {"seed": self.state["seed"], "days": self.state["day"],
                             "config": deepcopy(self.state["config"]), "reports": deepcopy(self.state["reports"])}
        recipe = c["products"][c["lesson"]["product"]]["parts"]
        self.state = {"version": 1, "lesson": c["lesson"]["id"],
                      "seed": seed if seed is not None else secrets.randbelow(1_000_000),
                      "day": 0, "balance": c["lesson"]["starting_money"], "config": config,
                      "inventory": {p: n * c["balance"]["initial_stock_units"] for p, n in recipe.items()},
                      "pending_delivery": {p: 0 for p in recipe}, "dirt": 0, "idle_days": 0,
                      "mode": mode, "python_days": 0, "totals": empty_metrics(),
                      "worker_costs": {role: 0 for role in config}, "memory": {role: [] for role in config},
                      "reports": [], "events": [], "status": "playing", "message": "Мастерская открыта. Посмотрим, как она работает."}
        self.active = None

    def between_days(self):
        if self.active:
            raise ValueError("Дождитесь конца смены. Настройки и сохранения доступны между днями.")

    def configure(self, config):
        self.between_days()
        if self.state["status"] != "playing":
            raise ValueError("Прогон завершён. Начните новый прогон.")
        validate_config(config, self.content)
        mechanics = self.content["lesson"]["mechanics"]
        fields = {"models": ("model",), "instructions": ("instructions", "rules"),
                  "tools": ("tools",), "context": ("context",)}
        for role, worker in config.items():
            for mechanic, keys in fields.items():
                if not mechanics.get(mechanic, False) and any(worker[key] != self.state["config"][role][key] for key in keys):
                    raise ValueError(f"Механика {mechanic} отключена в этом уроке.")
        self.state["config"] = deepcopy(config)

    def run_day(self):
        self.start_day()
        while self.active:
            self.step_day(include_view=False)
        return self.view()

    def start_day(self):
        self.between_days()
        if self.state["status"] != "playing":
            raise ValueError("Прогон завершён. Начните новый прогон.")
        candidate = deepcopy(self.state)
        candidate["day"] += 1
        simulation = DaySimulation(candidate, self.content)
        self.active = {"simulation": simulation, "steps": simulation.steps(), "paused": False, "scene": None}
        return self.view()

    def pause_day(self, paused):
        if not self.active or type(paused) is not bool:
            raise ValueError("Нет активной смены или неверное значение паузы.")
        self.active["paused"] = paused
        return self.view()

    def step_day(self, expected_step=None, include_view=True):
        if not self.active:
            return self.view()
        simulation = self.active["simulation"]
        # Idempotency: a retried request or another tab cannot advance the same scene twice.
        if self.active["paused"] or (expected_step is not None and expected_step != simulation.scene_index):
            return self.view()
        try:
            self.active["scene"] = next(self.active["steps"])
            return self.view() if include_view else None
        except StopIteration as done:
            report = done.value
        candidate = simulation.s
        candidate["reports"].append(report)
        if candidate["mode"] == "python":
            candidate["python_days"] += 1
        candidate["status"], candidate["message"] = outcome(candidate, self.content)
        report["observations"] = insights(candidate, self.content)
        self.state = candidate
        self.active = None
        return self.view() if include_view else None

    def comparison(self):
        if not self.previous:
            return {"available": False, "message": "Завершите хотя бы один день и повторите прогон с тем же seed."}
        if self.previous["seed"] != self.state["seed"]:
            return {"available": False, "message": "Seed различается. Для честного сравнения повторите предыдущий seed."}
        days = min(self.previous["days"], self.state["day"])
        if not days:
            return {"available": False, "message": "Запустите день, чтобы сравнить результаты."}
        rows = []
        for key in ("profit", "ai_cost", "units_sold", "defects", "waste", "idle_time"):
            old = round(sum(r[key] for r in self.previous["reports"][:days]), 2)
            new = round(sum(r[key] for r in self.state["reports"][:days]), 2)
            rows.append({"metric": key, "before": old, "after": new, "delta": round(new - old, 2)})
        return {"available": True, "days": days, "rows": rows}

    def view(self):
        live = None
        if self.active:
            live = {**self.active["simulation"].live_state(), "paused": self.active["paused"],
                    "scene": deepcopy(self.active["scene"])}
        return {"state": deepcopy(self.state), "summary": summary(self.state, self.content),
                "comparison": self.comparison(), "live": live}

    def save(self):
        self.between_days()
        return {"state": deepcopy(self.state), "previous": deepcopy(self.previous)}

    def load(self, data):
        self.between_days()
        # Saves are trusted local files, but reject corruption before changing the running game.
        if not isinstance(data, dict) or set(data) != {"state", "previous"}:
            raise ValueError("Неверный формат сохранения.")
        candidate = data["state"]
        if not isinstance(candidate, dict) or set(candidate) != set(self.state):
            raise ValueError("Сохранение неполное или от другой версии.")
        if candidate["version"] != 1 or candidate["lesson"] != self.content["lesson"]["id"]:
            raise ValueError("Версия или урок сохранения не поддерживается.")
        validate_config(candidate["config"], self.content)
        if type(candidate["seed"]) is not int or not 0 <= candidate["seed"] <= 999_999:
            raise ValueError("Неверный seed.")
        if type(candidate["day"]) is not int or not 0 <= candidate["day"] <= self.content["lesson"]["days"]:
            raise ValueError("Неверный день сохранения.")
        if candidate["mode"] not in ("auto", "python"):
            raise ValueError("Неверный режим.")
        if not isinstance(candidate["reports"], list) or len(candidate["reports"]) != candidate["day"]:
            raise ValueError("Повреждён журнал дней.")
        # Validate a round trip and all fields consumed by views/simulation before committing.
        probe = Game(candidate["seed"], self.content)
        probe.state = json.loads(json.dumps(candidate, allow_nan=False))
        probe.previous = deepcopy(data["previous"])
        try:
            if set(candidate["inventory"]) != set(self.state["inventory"]):
                raise ValueError("Неверный склад.")
            for key in ("inventory", "pending_delivery", "totals", "worker_costs"):
                if set(candidate[key]) != set(self.state[key]) or not all(type(v) in (int, float) and v >= 0 for k, v in candidate[key].items() if k != "profit"):
                    raise ValueError(f"Неверное поле: {key}.")
            if round(self.content["lesson"]["starting_money"] + candidate["totals"]["profit"], 2) != candidate["balance"]:
                raise ValueError("Баланс не совпадает с итогами.")
            if set(candidate["memory"]) != set(candidate["config"]):
                raise ValueError("Неверная память работников.")
            probe.view()
            if candidate["status"] == "playing":
                probe.run_day()
        except (TypeError, KeyError, AttributeError) as exc:
            raise ValueError("Сохранение повреждено.") from exc
        self.state, self.previous = deepcopy(candidate), deepcopy(data["previous"])
