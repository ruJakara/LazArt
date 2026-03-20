import json
import os
import re
import time
from pathlib import Path
from typing import Any

import vk_api
from vk_api.exceptions import ApiError

# Config
VK_TOKEN = os.getenv("VK_TOKEN", "").strip()
KEYWORDS = [
    "удаленная работа",
    "работа на дому",
    "подработка",
    "фриланс",
    "вакансии удаленно",
]
MAX_GROUPS = 20
REQUEST_DELAY_SECONDS = 0.34
OUTPUT_FILE = os.getenv("OUTPUT_FILE", "live_groups.json").strip() or "live_groups.json"
GROUPS_PER_KEYWORD = 100
DISCOVERY_MODE = os.getenv("DISCOVERY_MODE", "auto").strip().lower()
SEED_FILE = os.getenv("SEED_FILE", "seed_groups.txt").strip()


class VkLiveParser:
    def __init__(self, token: str) -> None:
        self.session = vk_api.VkApi(token=token)

    def _call_api(self, method: str, **params: Any) -> dict[str, Any]:
        try:
            return self.session.method(method, params)
        finally:
            # VK public limit: up to 3 requests/sec
            time.sleep(REQUEST_DELAY_SECONDS)

    @staticmethod
    def _extract_error_code(exc: ApiError) -> int:
        return int(getattr(exc, "code", 0))

    @staticmethod
    def _normalize_group_identifier(raw: str) -> str | None:
        value = raw.strip()
        if not value or value.startswith("#"):
            return None

        if "vk.com/" in value:
            value = value.split("vk.com/", 1)[1]
        value = value.strip().strip("/")
        value = value.split("?", 1)[0].split("#", 1)[0]
        value = value.split("/", 1)[0]

        if value.startswith("@"):
            value = value[1:]
        if not value:
            return None

        if value.startswith("club") and value[4:].isdigit():
            return value[4:]
        if value.startswith("public") and value[6:].isdigit():
            return value[6:]
        if value.startswith("-") and value[1:].isdigit():
            return value[1:]
        if value.isdigit():
            return value

        if not re.fullmatch(r"[A-Za-z0-9_.-]+", value):
            return None
        return value

    def _fetch_group_by_identifier(self, group_id_or_name: str) -> dict[str, Any] | None:
        try:
            response = self._call_api(
                "groups.getById",
                group_id=group_id_or_name,
                fields="members_count,screen_name,is_closed",
            )
        except ApiError as exc:
            print(f"⚠️ Не удалось получить группу '{group_id_or_name}': {exc}")
            return None

        if isinstance(response, list) and response:
            first = response[0]
            if isinstance(first, dict):
                return first

        if isinstance(response, dict):
            groups = response.get("groups")
            if isinstance(groups, list) and groups:
                first = groups[0]
                if isinstance(first, dict):
                    return first
        return None

    def is_group_alive(self, group_id: int) -> bool:
        try:
            wall_response = self._call_api(
                "wall.get",
                owner_id=-group_id,
                count=3,
            )
        except ApiError:
            return False

        posts = wall_response.get("items", [])
        if not posts:
            return False

        for post in posts[:3]:
            comments = post.get("comments", {})
            comments_count = comments.get("count", 0) if isinstance(comments, dict) else 0
            if comments_count > 0:
                return True

            post_id = post.get("id")
            if post_id is None or comments_count != 0:
                continue

            try:
                comments_response = self._call_api(
                    "wall.getComments",
                    owner_id=-group_id,
                    post_id=post_id,
                    count=0,
                )
            except ApiError:
                continue

            if comments_response.get("count", 0) > 0:
                return True

        return False

    @staticmethod
    def to_output_item(group: dict[str, Any]) -> dict[str, Any]:
        group_id = int(group["id"])
        screen_name = group.get("screen_name") or f"club{group_id}"
        return {
            "id": group_id,
            "name": group.get("name", ""),
            "screen_name": screen_name,
            "members_count": int(group.get("members_count", 0)),
            "is_closed": bool(group.get("is_closed", 0)),
        }

    def find_groups_by_keywords(self) -> tuple[list[dict[str, Any]], bool]:
        alive_groups: list[dict[str, Any]] = []
        seen_ids: set[int] = set()
        search_attempts = 0
        blocked_attempts = 0

        for keyword in KEYWORDS:
            if len(alive_groups) >= MAX_GROUPS:
                break

            print(f"🔍 Ищем по: '{keyword}'")
            search_attempts += 1
            try:
                response = self._call_api(
                    "groups.search",
                    q=keyword,
                    type="group",
                    count=GROUPS_PER_KEYWORD,
                    fields="members_count,screen_name,is_closed",
                )
            except ApiError as exc:
                print(f"⚠️ Ошибка поиска по '{keyword}': {exc}")
                if self._extract_error_code(exc) in {28, 1051}:
                    blocked_attempts += 1
                continue

            for group in response.get("items", []):
                group_id = group.get("id")
                if group_id is None:
                    continue

                group_id = int(group_id)
                if group_id in seen_ids:
                    continue
                seen_ids.add(group_id)

                screen_name = group.get("screen_name") or f"club{group_id}"
                if self.is_group_alive(group_id):
                    item = self.to_output_item(group)
                    alive_groups.append(item)
                    print(
                        f"✅ Живая: vk.com/{item['screen_name']} "
                        f"({item['members_count']} чел)"
                    )
                else:
                    print(f"❌ Мёртвая: vk.com/{screen_name}")

                if len(alive_groups) >= MAX_GROUPS:
                    break

        keyword_api_unavailable = (
            search_attempts > 0 and blocked_attempts == search_attempts
        )
        return alive_groups, keyword_api_unavailable

    def find_groups_from_seed_file(self, seed_file: str) -> list[dict[str, Any]]:
        path = Path(seed_file)
        if not path.exists():
            print(f"⚠️ Файл со списком групп не найден: {path}")
            return []

        raw_lines = path.read_text(encoding="utf-8").splitlines()
        identifiers: list[str] = []
        seen_identifiers: set[str] = set()
        for line in raw_lines:
            normalized = self._normalize_group_identifier(line)
            if not normalized or normalized in seen_identifiers:
                continue
            seen_identifiers.add(normalized)
            identifiers.append(normalized)

        if not identifiers:
            print(f"⚠️ В файле {path} нет валидных group id/screen_name.")
            return []

        print(f"📄 Загружено кандидатов из {path}: {len(identifiers)}")

        alive_groups: list[dict[str, Any]] = []
        seen_group_ids: set[int] = set()
        for group_identifier in identifiers:
            if len(alive_groups) >= MAX_GROUPS:
                break

            group = self._fetch_group_by_identifier(group_identifier)
            if not group:
                continue

            group_id = int(group["id"])
            if group_id in seen_group_ids:
                continue
            seen_group_ids.add(group_id)

            item = self.to_output_item(group)
            if self.is_group_alive(group_id):
                alive_groups.append(item)
                print(
                    f"✅ Живая: vk.com/{item['screen_name']} "
                    f"({item['members_count']} чел)"
                )
            else:
                print(f"❌ Мёртвая: vk.com/{item['screen_name']}")

        return alive_groups


def save_output(groups: list[dict[str, Any]]) -> None:
    with open(OUTPUT_FILE, "w", encoding="utf-8") as file:
        json.dump(groups, file, ensure_ascii=False, indent=2)


def merge_unique_groups(
    primary: list[dict[str, Any]],
    secondary: list[dict[str, Any]],
    limit: int,
) -> list[dict[str, Any]]:
    result = list(primary)
    seen_ids = {int(group["id"]) for group in result}
    for group in secondary:
        group_id = int(group["id"])
        if group_id in seen_ids:
            continue
        seen_ids.add(group_id)
        result.append(group)
        if len(result) >= limit:
            break
    return result


def is_likely_service_key(token: str) -> bool:
    return bool(re.fullmatch(r"[0-9a-f]{64}", token))


def main() -> None:
    if not VK_TOKEN:
        raise SystemExit(
            "VK_TOKEN не найден. Установите токен в переменную окружения VK_TOKEN."
        )
    if DISCOVERY_MODE not in {"auto", "keywords", "seed"}:
        raise SystemExit(
            "Некорректный DISCOVERY_MODE. Используйте: auto, keywords или seed."
        )

    parser = VkLiveParser(VK_TOKEN)
    live_groups: list[dict[str, Any]] = []
    keyword_api_unavailable = False

    if is_likely_service_key(VK_TOKEN):
        print("ℹ️ Похоже, используется сервисный ключ VK.")

    if DISCOVERY_MODE in {"auto", "keywords"}:
        live_groups, keyword_api_unavailable = parser.find_groups_by_keywords()

    if DISCOVERY_MODE == "seed":
        live_groups = parser.find_groups_from_seed_file(SEED_FILE)
    elif DISCOVERY_MODE == "auto" and keyword_api_unavailable:
        print(
            "ℹ️ groups.search недоступен для текущего ключа. "
            f"Переключаюсь на список из {SEED_FILE}."
        )
        seed_groups = parser.find_groups_from_seed_file(SEED_FILE)
        live_groups = merge_unique_groups(live_groups, seed_groups, MAX_GROUPS)

    save_output(live_groups)
    print(f"🎉 Готово! {len(live_groups)} живых групп → {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
