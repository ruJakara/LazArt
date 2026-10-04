"""Local HTTP server and commands. No packages or external services."""
import argparse
import json
import os
import secrets
import threading
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
from engine.content import ROOT
from engine.game import Game
from engine.student_runner import check_code


class WorkshopServer(ThreadingHTTPServer):
    def __init__(self, port=0, seed=None):
        super().__init__(("127.0.0.1", port), Handler)
        self.game = Game(seed)
        self.token = secrets.token_urlsafe(24)
        self.lock = threading.Lock()
        self.pending = None


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT / "web"), **kwargs)

    def log_message(self, format, *args):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def json_response(self, value, status=200):
        body = json.dumps(value, ensure_ascii=False, allow_nan=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def valid_host(self):
        return self.headers.get("Host") == f"127.0.0.1:{self.server.server_port}"

    def do_GET(self):
        if not self.valid_host():
            return self.json_response({"error": "Недопустимый адрес."}, 403)
        path = urlsplit(self.path).path
        if path == "/api/content":
            return self.json_response({"content": self.server.game.content, "token": self.server.token,
                                       "student_path": str(ROOT / "student" / "solution.py")})
        if path == "/api/state":
            with self.server.lock:
                return self.json_response(self.server.game.view())
        if path.startswith("/api/"):
            return self.json_response({"error": "Команда не найдена."}, 404)
        # Only frontend assets are served; no directory listings or source browsing.
        if path not in ("/", "/index.html", "/styles.css", "/app.js", "/map.js"):
            self.send_error(404)
            return
        super().do_GET()

    def do_POST(self):
        origin = self.headers.get("Origin")
        expected = f"http://127.0.0.1:{self.server.server_port}"
        if not self.valid_host() or (origin and origin != expected) or self.headers.get("X-Workshop-Token") != self.server.token:
            return self.json_response({"error": "Команда доступна только из локальной игры."}, 403)
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 <= length <= 2_000_000:
                raise ValueError("Команда слишком большая.")
            data = json.loads(self.rfile.read(length) or b"{}")
            if not isinstance(data, dict):
                raise ValueError("Ожидался JSON-объект.")
            with self.server.lock:
                result = self.dispatch_command(urlsplit(self.path).path, data)
            self.json_response(result)
        except (ValueError, TypeError, KeyError, OSError) as exc:
            self.json_response({"error": str(exc)}, 400)
        except Exception:
            self.json_response({"error": "Команда не выполнена. Игра продолжает работать."}, 500)

    def dispatch_command(self, path, data):
        game = self.server.game
        if path == "/api/day":
            game.run_day()
        elif path == "/api/day/start":
            game.start_day()
        elif path == "/api/day/step":
            expected = data.get("expected_step")
            if type(expected) is not int or expected < 0:
                raise ValueError("Нужен номер текущего шага.")
            game.step_day(expected)
        elif path == "/api/day/pause":
            game.pause_day(data.get("paused"))
        elif path == "/api/config":
            if game.state["mode"] != "auto":
                raise ValueError("В режиме PYTHON используйте solution.py.")
            game.configure(data["config"])
            self.server.pending = None
        elif path == "/api/mode":
            game.between_days()
            if data["mode"] not in ("auto", "python"):
                raise ValueError("Неизвестный режим.")
            game.state["mode"] = data["mode"]
            self.server.pending = None
        elif path == "/api/restart":
            kind = data.get("kind", "lesson")
            if kind not in ("lesson", "same", "new"):
                raise ValueError("Неизвестный вид перезапуска.")
            seed = game.state["seed"] if kind in ("same", "lesson") else None
            game.new(seed, keep_config=kind != "lesson")
            self.server.pending = None
        elif path == "/api/python/check":
            game.between_days()
            if game.state["mode"] != "python":
                raise ValueError("Включите режим PYTHON.")
            result = check_code(game.state["config"])
            self.server.pending = result.get("config") if result["ok"] else None
            return result
        elif path == "/api/python/apply":
            if game.state["mode"] != "python" or not self.server.pending:
                raise ValueError("Сначала успешно проверьте код в режиме PYTHON.")
            game.configure(self.server.pending)
            self.server.pending = None
        elif path == "/api/folder":
            if os.name == "nt":
                os.startfile(str(ROOT / "student"))
            else:
                raise ValueError(f'Откройте папку: {ROOT / "student"}')
        elif path == "/api/save":
            folder = ROOT / "saves"
            folder.mkdir(exist_ok=True)
            target = folder / "current.json"
            temp = folder / "current.json.tmp"
            temp.write_text(json.dumps(game.save(), ensure_ascii=False, indent=2), encoding="utf-8")
            temp.replace(target)
        elif path == "/api/load":
            target = ROOT / "saves" / "current.json"
            if not target.exists():
                raise ValueError("Сохранения пока нет. Нажмите «Сохранить».")
            game.load(json.loads(target.read_text(encoding="utf-8")))
            self.server.pending = None
        else:
            raise ValueError("Команда не найдена.")
        return game.view()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=0)
    parser.add_argument("--seed", type=int)
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()
    if args.seed is not None and not 0 <= args.seed <= 999_999:
        parser.error("seed: 0..999999")
    server = WorkshopServer(args.port, args.seed)
    url = f"http://127.0.0.1:{server.server_port}/"
    print(f"LazArt Robot Workshop: {url}", flush=True)
    print("Keep this window open while playing. Ctrl+C stops the game.", flush=True)
    if not args.no_browser:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
