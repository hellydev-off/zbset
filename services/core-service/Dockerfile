FROM python:3.13-slim

ENV PYTHONPATH=.
ENV PYTHONUNBUFFERED=1

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

COPY uv.lock . 

COPY pyproject.toml . 

COPY .python-version . 

RUN uv sync

COPY . . 

RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]