FROM python:3.11-slim

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY apps/api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Shared packages (agents, connectors, ai, scoring)
COPY packages /packages

# API source
COPY apps/api /app

# Startup script
RUN chmod +x /app/startup.sh

# Make packages importable as top-level modules
ENV PYTHONPATH="/app:/packages"

EXPOSE 8000

CMD ["/app/startup.sh"]
