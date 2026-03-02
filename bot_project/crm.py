from __future__ import annotations

import logging
import time
from typing import Any, Dict, Optional, Union

import requests

from config import get_settings

logger = logging.getLogger(__name__)

_settings = get_settings()

# AlfaCRM v2 API uses a token directly (no email/password login required)
_ALFACRM_DOMAIN = _settings.alfacrm_domain or ""
_ALFACRM_TOKEN = _settings.alfacrm_token or ""

_REQUEST_TIMEOUT_SECONDS = 20


def _build_api_url(path: str) -> str:
    if not _ALFACRM_DOMAIN:
        raise RuntimeError("ALFACRM_DOMAIN is not configured")
    base = f"https://{_ALFACRM_DOMAIN}".rstrip("/")
    return f"{base}/{path.lstrip('/')}"


def _headers() -> dict:
    if not _ALFACRM_TOKEN:
        raise RuntimeError("ALFACRM_TOKEN is not configured")
    return {
        "X-ALFACRM-TOKEN": _ALFACRM_TOKEN,
        "Accept": "application/json",
        "Content-Type": "application/json",
    }


def api_request(method: str, path: str, json: Optional[Dict[str, Any]] = None) -> Any:
    url = _build_api_url(path)
    headers = _headers()

    logger.info("AlfaCRM request %s %s", method.upper(), url)
    response = requests.request(
        method,
        url,
        json=json,
        headers=headers,
        timeout=_REQUEST_TIMEOUT_SECONDS,
    )

    response.raise_for_status()

    if not response.content:
        return None
    try:
        return response.json()
    except ValueError:
        return response.text


def ping() -> bool:
    try:
        api_request("POST", "/v2api/branch/index", json={"is_active": 1, "page": 0})
        return True
    except Exception as exc:
        logger.error("AlfaCRM ping failed: %s", exc)
        return False


def list_branches() -> list[dict]:
    response = api_request("POST", "/v2api/branch/index", json={"is_active": 1, "page": 0})
    if isinstance(response, dict):
        items = response.get("items")
        if isinstance(items, list):
            return items
    return []


def create_lead(
    branch_id: int,
    name: str,
    phone: str,
    note: str | None = None,
    source: str = "telegram",
) -> int:
    lead_payload = {"name": name, "phone": phone}
    if note is not None:
        lead_payload["note"] = note

    def _extract_id(payload: Any) -> Optional[int]:
        if not isinstance(payload, dict):
            return None
        model = payload.get("model")
        if isinstance(model, dict) and "id" in model:
            try:
                return int(model["id"])
            except Exception:
                return None
        if "id" in payload:
            try:
                return int(payload["id"])
            except Exception:
                return None
        data = payload.get("data")
        if isinstance(data, dict) and "id" in data:
            try:
                return int(data["id"])
            except Exception:
                return None
        return None

    def _is_model_error(payload: Any) -> bool:
        if payload is None:
            return False
        if isinstance(payload, dict):
            if payload.get("model_error") or payload.get("errors") or payload.get("error"):
                return True
            message = payload.get("message")
            if isinstance(message, str) and "model" in message.lower():
                return True
        text = str(payload).lower()
        return "model" in text and "error" in text

    try:
        response = api_request("POST", f"/v2api/{branch_id}/lead/create", json=lead_payload)
        if _is_model_error(response):
            raise RuntimeError(f"Lead create model error: {response}")
        lead_id = _extract_id(response)
        if lead_id is not None:
            return lead_id
        raise RuntimeError(f"Lead create missing id: {response}")
    except requests.HTTPError as exc:
        resp = exc.response
        status = resp.status_code if resp is not None else None
        text = resp.text.lower() if resp is not None and resp.text else ""
        if status != 404 and "not found" not in text:
            raise RuntimeError(f"Lead create failed: {exc}") from exc

    customer_payload = {
        "name": name,
        "phone": [phone],
        "is_study": 0,
        "source": source,
    }
    if note is not None:
        customer_payload["note"] = note

    response = api_request("POST", f"/v2api/{branch_id}/customer/create", json=customer_payload)
    customer_id = _extract_id(response)
    if customer_id is not None:
        return customer_id
    raise RuntimeError(f"Customer create missing id: {response}")
