def outcome(state, content):
    m, b, lesson = state["totals"], content["balance"], content["lesson"]
    if state["balance"] <= 0:
        return "lost", "Закончились деньги. Мастерская закрылась."
    if state["idle_days"] >= b["max_idle_days"]:
        return "lost", "Несколько дней без производства. Мастерская остановилась."
    if state["day"] >= b["critical_rate_after_days"] and m["returns"] / max(1, m["units_started"]) > b["critical_return_rate"]:
        return "lost", "Слишком много неисправных изделий дошло до клиентов."
    if state["day"] >= lesson["days"]:
        if m["units_sold"] >= lesson["target_units"]:
            return "won", "Мастерская выжила. Производственный план выполнен!"
        return "lost", "Мастерская выжила, но производственный план не выполнен."
    return "playing", "Настрой работников и запусти следующий день."


def insights(state, content):
    report = state["reports"][-1] if state["reports"] else None
    if not report:
        return []
    events = [e for e in state["events"] if e["day"] == state["day"]]
    notes = []
    for code, text in (("overbuy", "Склад закупал лишние комплекты"),
                       ("missing_inspection", "Изделия проходили QC без осмотра"),
                       ("missing_test", "Сборщик передавал изделия без базового теста"),
                       ("missing_tool", "Работа останавливалась из-за отсутствующих инструментов")):
        count = sum(e["event"] == code for e in events)
        if count:
            notes.append(f"{text}: {count} раз.")
    costs = report["worker_costs"]
    costly = max(costs, key=costs.get)
    share = round(costs[costly] / max(1, report["ai_cost"]) * 100)
    notes.append(f'{content["workers"][costly]["name"]}: {share}% расходов на ИИ за день.')
    if report["idle_time"]:
        notes.append(f'Не использовано мест на линии: {report["idle_time"]}. Причины есть в журнале.')
    return notes


def summary(state, content):
    m, b = state["totals"], content["balance"]
    costs = state["worker_costs"]
    expensive = max(costs, key=costs.get)
    achievements = []
    if state["status"] == "won":
        if m["profit"] >= b["lean_profit"]:
            achievements.append("LEAN FACTORY")
        if m["defects"] == 0:
            achievements.append("ZERO DEFECTS")
        if m["ai_cost"] <= b["cheap_ai_cost"]:
            achievements.append("CHEAP BRAINS")
        if m["returns"] == 0 and m["profit"] > 0:
            achievements.append("BALANCED")
        if state["python_days"] == content["lesson"]["days"]:
            achievements.append("PYTHON ENGINEER")
    warnings = [e for e in state["events"] if e["level"] in ("warning", "error")]
    useful = {role: 0 for role in costs}
    wasted = {role: 0 for role in costs}
    for e in state["events"]:
        if e["actor"] not in useful:
            continue
        if e["event"] in ("product_defect", "problem_reported", "vacuum_assembled", "delivery_received", "workshop_checked", "order_accepted"):
            useful[e["actor"]] += 1
        if e["event"] == "missing_tool":
            wasted[e["actor"]] += e["data"].get("ai_cost", 0)
    best = max(useful, key=lambda r: useful[r] / max(1, costs[r]))
    worst = max(wasted, key=wasted.get)
    counts = {}
    for e in warnings:
        counts[e["message"]] = counts.get(e["message"], 0) + 1
    return {"expensive_worker": content["workers"][expensive]["name"],
            "useful_worker": content["workers"][best]["name"] if any(useful.values()) else "Ещё нет действий",
            "useless_expense": f'{content["workers"][worst]["name"]}: {round(wasted[worst], 2)} ₽ на попытки без Tool' if any(wasted.values()) else "Попыток без инструментов нет",
            "worker_costs": costs, "achievements": achievements,
            "unit_cost": round(sum(m[k] for k in ("material_cost", "ai_cost", "operating_cost", "penalties")) / max(1, m["units_sold"]), 2),
            "bottleneck": max(counts, key=counts.get) if counts else "Критических остановок нет",
            "unsold_stock_value": sum(state["inventory"][p] * content["products"][content["lesson"]["product"]]["part_prices"][p] for p in state["inventory"])}
