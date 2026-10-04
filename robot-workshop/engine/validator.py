import difflib


class ConfigurationError(ValueError):
    pass


def known(value, options, label):
    if value not in options:
        match = difflib.get_close_matches(str(value), options, n=1)
        hint = f" Возможно, вы имели в виду: {match[0]}." if match else ""
        raise ConfigurationError(f"{label}: не найден {value}.{hint}")


def validate_config(config, content):
    roles = content["lesson"]["workers"]
    if not isinstance(config, dict) or set(config) != set(roles):
        raise ConfigurationError("Нужна конфигурация всех шести работников.")
    rules_by_role = {role: set() for role in roles}
    for preset in content["instructions"].values():
        for role in preset["roles"]:
            rules_by_role[role].update(preset["rules"])
    for role, worker in config.items():
        if not isinstance(worker, dict) or set(worker) != {"worker", "model", "context", "instructions", "rules", "tools"}:
            raise ConfigurationError(f"{role}: неверный формат конфигурации.")
        if worker["worker"] != role:
            raise ConfigurationError(f"{role}: идентификатор работника не совпадает.")
        known(worker["model"], content["lesson"]["models"], "ModelNotFound")
        if type(worker["context"]) is not int or worker["context"] not in content["balance"]["context_sizes"]:
            raise ConfigurationError("Context: допустимы только 0, 2, 5, 10, 20.")
        text = worker["instructions"]
        if not isinstance(text, str) or len(text) > content["balance"]["max_instruction_length"]:
            raise ConfigurationError("Instructions: текст не длиннее 1000 символов.")
        for field in ("tools", "rules"):
            values = worker[field]
            if not isinstance(values, list) or not all(isinstance(v, str) for v in values) or len(values) != len(set(values)):
                raise ConfigurationError(f"{role}: {field} должен быть списком без повторов.")
        for tool in worker["tools"]:
            known(tool, content["tools"], "ToolNotFound")
            if role not in content["tools"][tool]["allowed_roles"]:
                raise ConfigurationError(f"{tool}: инструмент недоступен для {role}.")
        for rule in worker["rules"]:
            known(rule, rules_by_role[role], "RuleNotFound")
        if {"prioritize_speed", "prioritize_quality"}.issubset(worker["rules"]):
            raise ConfigurationError("Выберите один приоритет: скорость или качество.")
    return config
