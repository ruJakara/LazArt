"""Isolated student process, timeout and limited API; not a security sandbox."""
import ast
import contextlib
import io
import json
import subprocess
import sys
import traceback
from .content import ROOT, load_content
from .validator import validate_config
from .workers import Factory

METHODS = {"worker", "set_model", "set_context", "set_instructions", "enable_rule",
           "disable_rule", "add_tool", "remove_tool"}
BUILTINS = {"range": range, "len": len, "str": str, "int": int, "float": float,
            "min": min, "max": max, "enumerate": enumerate, "print": print}


class LimitedOutput(io.StringIO):
    def write(self, text):
        remaining = max(0, 4000 - self.tell())
        if remaining:
            super().write(text[:remaining])
        return len(text)


def execute(source, config):
    output = LimitedOutput()
    try:
        tree = ast.parse(source, filename="student/solution.py")
        for node in ast.walk(tree):
            if isinstance(node, (ast.Import, ast.ImportFrom, ast.ClassDef)):
                raise ValueError("Для этого урока доступны функции и API factory, без import и классов.")
            if isinstance(node, ast.Attribute) and node.attr not in METHODS:
                raise ValueError(f"Атрибут {node.attr} недоступен. Используйте API настройки работников.")
            if isinstance(node, ast.Name) and node.id.startswith("_"):
                raise ValueError("Имена, начинающиеся с _, недоступны в коде ученика.")
        namespace = {"__builtins__": BUILTINS}
        content = load_content()
        factory = Factory(config, content)
        with contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
            exec(compile(tree, "student/solution.py", "exec"), namespace)
            function = namespace.get("configure_factory")
            if not callable(function):
                raise ValueError("Добавьте функцию def configure_factory(factory):")
            function(factory)
        validate_config(factory._config, content)
        return {"ok": True, "config": factory._config, "stdout": output.getvalue()}
    except SyntaxError as exc:
        translations = {"was never closed": "Ожидалась закрывающая скобка.",
                        "unexpected indent": "Лишний отступ.",
                        "expected an indented block": "Ожидался блок с отступом после двоеточия.",
                        "invalid syntax": "Проверьте скобки, кавычки и двоеточия."}
        message = next((text for key, text in translations.items() if key in exc.msg), exc.msg)
        return {"ok": False, "error": "SyntaxError", "message": message,
                "line": exc.lineno, "column": exc.offset, "source": (exc.text or "").rstrip()}
    except Exception as exc:
        frames = traceback.extract_tb(exc.__traceback__)
        line = next((f.lineno for f in reversed(frames) if f.filename == "student/solution.py"), None)
        return {"ok": False, "error": type(exc).__name__, "message": str(exc),
                "line": line, "stdout": output.getvalue()}


def check_code(config, source=None, timeout=3):
    if source is None:
        source = (ROOT / "student" / "solution.py").read_text(encoding="utf-8-sig")
    if len(source) > 30_000:
        return {"ok": False, "error": "CodeTooLarge", "message": "Файл больше 30 000 символов."}
    try:
        result = subprocess.run([sys.executable, "-m", "engine.student_runner", "--child"],
                                cwd=ROOT, input=json.dumps({"source": source, "config": config}),
                                text=True, encoding="utf-8", capture_output=True, timeout=timeout)
        if result.returncode:
            return {"ok": False, "error": "StudentProcessError", "message": "Процесс ученика завершился с ошибкой."}
        return json.loads(result.stdout)
    except subprocess.TimeoutExpired:
        return {"ok": False, "error": "Timeout", "message": "Код выполнялся слишком долго. Проверьте циклы (лимит 3 секунды)."}
    except (ValueError, OSError):
        return {"ok": False, "error": "StudentProcessError", "message": "Не удалось проверить код ученика."}


if __name__ == "__main__":
    request = json.load(sys.stdin)
    print(json.dumps(execute(request["source"], request["config"]), ensure_ascii=True))
