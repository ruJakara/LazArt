FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV BOT_HEARTBEAT_FILE=/tmp/night_hunger_bot_heartbeat.txt

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY src ./src

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD ["python", "src/healthcheck.py"]

CMD ["python", "src/main.py"]
