import json
import os
import queue
import subprocess
import sys
import threading
from pathlib import Path
from tkinter import END, DISABLED, NORMAL, StringVar, Tk, filedialog, messagebox
from tkinter import ttk


BASE_DIR = Path(__file__).resolve().parent
SETTINGS_FILE = BASE_DIR / "gui_settings.json"
DEFAULT_OUTPUT_FILE = BASE_DIR / "live_groups.json"


class ParserGUI:
    def __init__(self, root: Tk) -> None:
        self.root = root
        self.root.title("VK Live Group Parser")
        self.root.geometry("860x620")
        self.root.minsize(760, 520)

        self.log_queue: "queue.Queue[str]" = queue.Queue()
        self.running_process: subprocess.Popen[str] | None = None

        self.token_var = StringVar()
        self.mode_var = StringVar(value="auto")
        self.seed_file_var = StringVar(value="seed_groups.txt")

        self._build_ui()
        self._load_settings()
        self._poll_log_queue()

    def _build_ui(self) -> None:
        container = ttk.Frame(self.root, padding=12)
        container.pack(fill="both", expand=True)

        form = ttk.Frame(container)
        form.pack(fill="x")

        ttk.Label(form, text="VK_TOKEN:").grid(row=0, column=0, sticky="w", pady=(0, 8))
        token_entry = ttk.Entry(form, textvariable=self.token_var, show="*", width=70)
        token_entry.grid(row=0, column=1, sticky="ew", padx=(8, 8), pady=(0, 8))
        ttk.Button(form, text="Показать", command=self._toggle_token_visibility).grid(
            row=0, column=2, sticky="e", pady=(0, 8)
        )

        ttk.Label(form, text="Режим поиска:").grid(row=1, column=0, sticky="w", pady=(0, 8))
        mode_combo = ttk.Combobox(
            form,
            textvariable=self.mode_var,
            state="readonly",
            values=["auto", "seed", "keywords"],
            width=20,
        )
        mode_combo.grid(row=1, column=1, sticky="w", padx=(8, 8), pady=(0, 8))

        ttk.Label(form, text="Файл групп (seed):").grid(
            row=2, column=0, sticky="w", pady=(0, 8)
        )
        ttk.Entry(form, textvariable=self.seed_file_var, width=70).grid(
            row=2, column=1, sticky="ew", padx=(8, 8), pady=(0, 8)
        )
        ttk.Button(form, text="Выбрать", command=self._choose_seed_file).grid(
            row=2, column=2, sticky="e", pady=(0, 8)
        )

        form.columnconfigure(1, weight=1)

        actions = ttk.Frame(container)
        actions.pack(fill="x", pady=(4, 8))

        self.start_button = ttk.Button(actions, text="Запустить парсинг", command=self._start)
        self.start_button.pack(side="left")

        ttk.Button(actions, text="Открыть live_groups.json", command=self._open_output).pack(
            side="left", padx=(8, 0)
        )
        ttk.Button(actions, text="Сохранить настройки", command=self._save_settings).pack(
            side="left", padx=(8, 0)
        )

        log_frame = ttk.LabelFrame(container, text="Логи")
        log_frame.pack(fill="both", expand=True)

        self.log_text = ttk.Treeview(log_frame, show="tree", selectmode="none")
        self.log_text.pack(side="left", fill="both", expand=True)

        scroll = ttk.Scrollbar(log_frame, orient="vertical", command=self.log_text.yview)
        scroll.pack(side="right", fill="y")
        self.log_text.configure(yscrollcommand=scroll.set)

        self.status_var = StringVar(value="Готово к запуску.")
        status = ttk.Label(container, textvariable=self.status_var, anchor="w")
        status.pack(fill="x", pady=(8, 0))

    def _append_log(self, text: str) -> None:
        self.log_text.insert("", END, text=text.rstrip("\n"))
        children = self.log_text.get_children("")
        if children:
            self.log_text.see(children[-1])

    def _poll_log_queue(self) -> None:
        while True:
            try:
                line = self.log_queue.get_nowait()
            except queue.Empty:
                break
            self._append_log(line)
        self.root.after(120, self._poll_log_queue)

    def _toggle_token_visibility(self) -> None:
        entries = [child for child in self.root.winfo_children()]
        # Search the token entry by traversing all descendants.
        stack = entries[:]
        while stack:
            widget = stack.pop()
            if isinstance(widget, ttk.Entry) and widget.cget("textvariable") == str(
                self.token_var
            ):
                current = widget.cget("show")
                widget.configure(show="" if current else "*")
                break
            stack.extend(widget.winfo_children())

    def _choose_seed_file(self) -> None:
        selected = filedialog.askopenfilename(
            title="Выберите seed-файл",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")],
            initialdir=str(BASE_DIR),
        )
        if selected:
            self.seed_file_var.set(selected)

    def _save_settings(self) -> None:
        payload = {
            "token": self.token_var.get().strip(),
            "mode": self.mode_var.get().strip(),
            "seed_file": self.seed_file_var.get().strip(),
        }
        SETTINGS_FILE.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        self.status_var.set(f"Настройки сохранены: {SETTINGS_FILE.name}")

    def _load_settings(self) -> None:
        if not SETTINGS_FILE.exists():
            return
        try:
            payload = json.loads(SETTINGS_FILE.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return

        token = str(payload.get("token", "")).strip()
        mode = str(payload.get("mode", "auto")).strip().lower()
        seed_file = str(payload.get("seed_file", "seed_groups.txt")).strip()

        if token:
            self.token_var.set(token)
        if mode in {"auto", "seed", "keywords"}:
            self.mode_var.set(mode)
        if seed_file:
            self.seed_file_var.set(seed_file)

    def _start(self) -> None:
        if self.running_process is not None:
            messagebox.showinfo("Парсер уже запущен", "Дождитесь завершения текущего запуска.")
            return

        token = self.token_var.get().strip()
        if not token:
            messagebox.showwarning("Нужен токен", "Введите VK_TOKEN.")
            return

        mode = self.mode_var.get().strip().lower()
        if mode not in {"auto", "seed", "keywords"}:
            messagebox.showwarning("Режим", "Выберите корректный режим поиска.")
            return

        seed_file = self.seed_file_var.get().strip() or "seed_groups.txt"
        self._save_settings()

        env = os.environ.copy()
        env["VK_TOKEN"] = token
        env["DISCOVERY_MODE"] = mode
        env["SEED_FILE"] = seed_file
        env["PYTHONIOENCODING"] = "utf-8"

        script = BASE_DIR / "vk_live_parser.py"
        if not script.exists():
            messagebox.showerror("Ошибка", f"Не найден файл: {script}")
            return

        self.log_text.delete(*self.log_text.get_children(""))
        self._append_log("Запуск парсинга...")
        self.status_var.set("Выполняется...")
        self.start_button.configure(state=DISABLED)

        def worker() -> None:
            process: subprocess.Popen[str] | None = None
            try:
                process = subprocess.Popen(
                    [sys.executable, str(script)],
                    cwd=str(BASE_DIR),
                    env=env,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    encoding="utf-8",
                    errors="replace",
                )
                self.running_process = process
                assert process.stdout is not None
                for line in process.stdout:
                    self.log_queue.put(line.rstrip("\n"))
                return_code = process.wait()
                self.root.after(0, lambda: self._on_finish(return_code))
            except Exception as exc:  # noqa: BLE001
                self.root.after(0, lambda: self._on_error(str(exc)))
            finally:
                self.running_process = None
                if process and process.stdout:
                    process.stdout.close()

        threading.Thread(target=worker, daemon=True).start()

    def _on_finish(self, return_code: int) -> None:
        self.start_button.configure(state=NORMAL)
        if return_code != 0:
            self.status_var.set(f"Ошибка запуска (код {return_code})")
            messagebox.showerror(
                "Ошибка",
                f"Парсер завершился с кодом {return_code}. Смотрите логи в окне.",
            )
            return

        groups_count = self._read_output_count()
        self.status_var.set(f"Готово. Найдено групп: {groups_count}")
        messagebox.showinfo(
            "Готово",
            f"Парсинг завершен.\nНайдено живых групп: {groups_count}\nФайл: {DEFAULT_OUTPUT_FILE.name}",
        )

    def _on_error(self, message: str) -> None:
        self.start_button.configure(state=NORMAL)
        self.status_var.set("Ошибка запуска")
        messagebox.showerror("Ошибка", message)

    def _read_output_count(self) -> int:
        if not DEFAULT_OUTPUT_FILE.exists():
            return 0
        try:
            payload = json.loads(DEFAULT_OUTPUT_FILE.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return 0
        if isinstance(payload, list):
            return len(payload)
        return 0

    def _open_output(self) -> None:
        output_file = DEFAULT_OUTPUT_FILE
        if not output_file.exists():
            messagebox.showwarning("Файл не найден", f"Не найден {output_file.name}")
            return

        try:
            os.startfile(str(output_file))  # type: ignore[attr-defined]
        except Exception as exc:  # noqa: BLE001
            messagebox.showerror("Не удалось открыть файл", str(exc))


def main() -> None:
    root = Tk()
    ttk.Style().theme_use("clam")
    ParserGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()
