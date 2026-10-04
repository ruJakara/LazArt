METRICS = ("revenue", "material_cost", "ai_cost", "operating_cost", "penalties", "profit",
           "units_started", "units_completed", "units_sold", "defects", "reworks",
           "returns", "missed_orders", "rejected_orders", "waste", "idle_time")


def empty_metrics():
    return {key: 0 for key in METRICS}


def action_cost(worker, tool, content):
    b = content["balance"]
    return round(content["models"][worker["model"]]["cost"] *
                 (1 + worker["context"] * b["context_cost"] + len(worker["tools"]) * b["tool_overhead"])
                 + (content["tools"][tool]["cost"] if tool in worker["tools"] else 0), 2)


def profit(metrics):
    return round(metrics["revenue"] - sum(metrics[key] for key in
                 ("material_cost", "ai_cost", "operating_cost", "penalties")), 2)


def parts_cost(parts, product):
    return sum(amount * product["part_prices"][part] for part, amount in parts.items())
