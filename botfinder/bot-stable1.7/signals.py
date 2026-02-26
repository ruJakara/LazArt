"""Signal formatting for Telegram.

Per ТЗ Этап 2 — strict format:
🚨 СИГНАЛ | <тип события> | <срочность>/5
Регион: <регион>
Сфера: <ЖКХ / промышленность>
Суть: <1 строка, ≤200 символов>
Почему важно: <why, ≤300 символов>
Источник: <ссылка>
"""
import re
from typing import Optional
from llm import LLMResponse


# Event type mapping per ТЗ
EVENT_TYPE_RU = {
    "accident": "авария",
    "outage": "остановка",
    "repair": "ремонт",
    "other": "другое"
}


def map_object_to_sphere(object_type: str) -> str:
    """
    Map LLM object type to ТЗ sphere.
    
    ТЗ: "Сфера: ЖКХ / промышленность"
    - water, heat → ЖКХ
    - industrial → промышленность  
    - unknown → ЖКХ (default)
    """
    if object_type == "industrial":
        return "промышленность"
    return "ЖКХ"


def truncate_field(text: str, max_len: int) -> str:
    """Truncate and clean text to max length."""
    if not text:
        return ""
    # Collapse whitespace/newlines to single space
    text = re.sub(r'\s+', ' ', text).strip()
    if len(text) > max_len:
        return text[:max_len - 3] + "..."
    return text


def format_signal_message(
    event_type: str,
    urgency: int,
    region: Optional[str],
    object_type: str,
    title: str,
    why: str,
    url: str
) -> str:
    """
    Format signal message according to ТЗ (strict, no extras).
    
    Format:
    🚨 СИГНАЛ | <тип события> | <срочность>/5
    Регион: <регион>
    Сфера: <ЖКХ / промышленность>
    Суть: <1 строка>
    Почему важно: <why>
    Источник: <ссылка>
    
    No parse_mode (plain text), no extra lines.
    """
    # Translate event type to Russian
    event_type_ru = EVENT_TYPE_RU.get(event_type, event_type)
    
    # Map object to sphere (ТЗ requirement)
    sphere = map_object_to_sphere(object_type)
    
    # Truncate fields per spec
    title_clean = truncate_field(title, 200)  # Суть ≤ 200
    why_clean = truncate_field(why, 300)      # Почему важно ≤ 300
    
    # Format region
    region_display = region or "не определён"
    
    # Strict format — exactly 6 lines, no extras
    return (
        f"🚨 СИГНАЛ | {event_type_ru} | {urgency}/5\n"
        f"Регион: {region_display}\n"
        f"Сфера: {sphere}\n"
        f"Суть: {title_clean}\n"
        f"Почему важно: {why_clean}\n"
        f"Источник: {url}"
    )


def create_signal_from_llm(
    llm_response: LLMResponse,
    title: str,
    url: str,
    region: Optional[str] = None
) -> dict:
    """
    Create signal data from LLM response.
    
    Returns dict ready for DB insertion and message formatting.
    """
    sphere = map_object_to_sphere(llm_response.object)
    
    message = format_signal_message(
        event_type=llm_response.event_type,
        urgency=llm_response.urgency,
        region=region,
        object_type=llm_response.object,
        title=title,
        why=llm_response.why,
        url=url
    )
    
    return {
        "event_type": llm_response.event_type,
        "urgency": llm_response.urgency,
        "object_type": llm_response.object,
        "sphere": sphere,  # ЖКХ or промышленность
        "region": region,
        "why": truncate_field(llm_response.why, 300),
        "message_text": message,
    }
