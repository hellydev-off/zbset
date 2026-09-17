import uuid
from datetime import UTC, datetime, timedelta

import jwt
from config.settings import (
    JWT_ALGORITHM,
    JWT_EXPOSE_ACCESS,
    JWT_EXPOSE_REFRESH,
    JWT_PRIVATE_KEY,
    JWT_PUBLIC_KEY,
)


def _create_token(user_id: str, now: datetime, type: str, expose: int) -> dict:
    payload = {
        "sub": user_id,
        "type": type,
        "exp": now + timedelta(minutes=expose),
        "session_id": str(uuid.uuid4()),
        "iss": "auth-service",
    }
    return payload


def _decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            JWT_PUBLIC_KEY,
            JWT_ALGORITHM,
        )

    except jwt.ExpiredSignatureError as exc:
        raise ValueError("Token expired") from exc

    except jwt.InvalidTokenError as exc:
        raise ValueError("Invalid token") from exc
    return payload


def create_access_token(user_id: str) -> str:
    now = datetime.now(UTC)
    payload = _create_token(user_id, now, type="access", expose=JWT_EXPOSE_ACCESS)

    return jwt.encode(payload, JWT_PRIVATE_KEY, JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    payload = _decode_token(token)

    if payload.get("type") != "access":
        raise jwt.InvalidTokenError("Invalid token type")
    return payload


def create_refresh_token(user_id: str) -> str:
    now = datetime.now(UTC)

    payload = _create_token(user_id, now, type="refresh", expose=JWT_EXPOSE_REFRESH)

    return jwt.encode(payload, JWT_PRIVATE_KEY, JWT_ALGORITHM)


def decode_refresh_token(token: str) -> dict:
    payload = _decode_token(token)

    if payload.get("type") != "refresh":
        raise jwt.InvalidTokenError("Invalid token type")
    return payload
