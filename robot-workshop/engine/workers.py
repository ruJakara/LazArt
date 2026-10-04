from copy import deepcopy
from .validator import known, validate_config


def initial_config(content):
    return {role: {"worker": role, **{key: deepcopy(worker[key]) for key in
            ("model", "context", "instructions", "rules", "tools")}}
            for role, worker in content["workers"].items() if role in content["lesson"]["workers"]}


class Worker:
    def __init__(self, role, config, content):
        self._role, self._config, self._content = role, config, content

    def _set(self, key, value):
        candidate = deepcopy(self._config)
        candidate[self._role][key] = value
        validate_config(candidate, self._content)
        self._config[self._role][key] = value

    def set_model(self, model_id):
        self._set("model", model_id)

    def set_context(self, size):
        self._set("context", size)

    def set_instructions(self, text):
        self._set("instructions", text)

    def enable_rule(self, rule_id):
        rules = self._config[self._role]["rules"]
        self._set("rules", rules + ([] if rule_id in rules else [rule_id]))

    def disable_rule(self, rule_id):
        self._set("rules", [r for r in self._config[self._role]["rules"] if r != rule_id])

    def add_tool(self, tool_id):
        tools = self._config[self._role]["tools"]
        self._set("tools", tools + ([] if tool_id in tools else [tool_id]))

    def remove_tool(self, tool_id):
        self._set("tools", [t for t in self._config[self._role]["tools"] if t != tool_id])


class Factory:
    def __init__(self, config, content):
        self._config = deepcopy(config)
        self._content = content

    def worker(self, worker_id):
        known(worker_id, self._config, "WorkerNotFound")
        return Worker(worker_id, self._config, self._content)
