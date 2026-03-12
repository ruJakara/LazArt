import os
import sys
import tempfile
import time
from pathlib import Path


def resolve_heartbeat_file() -> Path:
    configured = os.getenv("BOT_HEARTBEAT_FILE", "").strip()
    if configured:
        return Path(configured)
    return Path(tempfile.gettempdir()) / "night_hunger_bot_heartbeat.txt"


def main() -> int:
    heartbeat_file = resolve_heartbeat_file()
    stale_after_seconds = max(
        30,
        int(os.getenv("BOT_HEARTBEAT_STALE_AFTER_SECONDS", "90")),
    )
    grace_seconds = max(5, int(os.getenv("BOT_HEALTHCHECK_GRACE_SECONDS", "15")))
    max_age_seconds = stale_after_seconds + grace_seconds

    bot_token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    if not bot_token or bot_token == "your_bot_token_here":
        print("UNHEALTHY: TELEGRAM_BOT_TOKEN is missing or placeholder")
        return 1

    if not heartbeat_file.exists():
        print(f"UNHEALTHY: heartbeat file is missing: {heartbeat_file}")
        return 1

    heartbeat_age = time.time() - heartbeat_file.stat().st_mtime
    if heartbeat_age > max_age_seconds:
        print(
            "UNHEALTHY: heartbeat is stale "
            f"({heartbeat_age:.1f}s > {max_age_seconds}s): {heartbeat_file}"
        )
        return 1

    print(
        "OK: bot heartbeat is fresh "
        f"({heartbeat_age:.1f}s <= {max_age_seconds}s): {heartbeat_file}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
