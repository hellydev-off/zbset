from datetime import UTC, datetime, timedelta

import jwt
from config.settings import (
    JWT_ALGORITHM,
    JWT_EXPOSE_ACCESS,
    JWT_EXPOSE_REFRESH,
    JWT_PRIVATE_KEY,
    JWT_PUBLIC_KEY,
)
from django.core.exceptions import ValidationError


def _create_token(user_id: str, type: str, expose: int, session_id) -> dict:
    now = datetime.now(UTC)

    payload = {
        "sub": user_id,
        "type": type,
        "exp": now + timedelta(minutes=expose),
        "session_id": session_id,
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


def create_access_token(user_id: str, session_id) -> str:
    payload = _create_token(
        user_id, type="access", expose=JWT_EXPOSE_ACCESS, session_id=session_id
    )

    return jwt.encode(payload, JWT_PRIVATE_KEY, JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    payload = _decode_token(token)

    if payload.get("type") != "access":
        raise jwt.InvalidTokenError("Invalid token type")
    return payload


def create_refresh_token(user_id: str, session_id) -> str:
    payload = _create_token(
        user_id, type="refresh", expose=JWT_EXPOSE_REFRESH, session_id=session_id
    )

    return jwt.encode(payload, JWT_PRIVATE_KEY, JWT_ALGORITHM)


def decode_refresh_token(token: str) -> dict:
    payload = _decode_token(token)

    if payload.get("type") != "refresh":
        raise jwt.InvalidTokenError("Invalid token type")
    return payload


def update_access_token(refresh_token: str) -> str:
    try:
        payload = decode_refresh_token(refresh_token)
    except jwt.PyJWKError:
        msg = "Invalid Token"
        raise ValidationError(msg)
    return create_access_token(payload["sub"], session_id=payload["session_id"])
