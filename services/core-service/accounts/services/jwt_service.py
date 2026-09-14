from datetime import UTC, datetime, timedelta

import jwt
from config.settings import JWT_SECRET_KEY


class JWTService:
    SECRET_KEY = JWT_SECRET_KEY

    def create_access_token(self, user_id: str):
        now = datetime.now(UTC)

        payload = {
            "sub": user_id,
            "type": "access",
            "iat": now,
            "exp": now + timedelta(minutes=15),
            "iss": "auth-service",
        }

        return jwt.encode(payload, self.SECRET_KEY, "HS256")

    def decode_access_token(self, token: str) -> dict:
        try:
            payload = jwt.decode(
                token,
                self.SECRET_KEY,
                "HS256",
                issuer="auth-service",
            )

        except jwt.ExpiredSignatureError as exc:
            raise ValueError("Token expired") from exc

        except jwt.InvalidTokenError as exc:
            raise ValueError("Invalid token") from exc

        if payload.get("type") != "access":
            raise jwt.InvalidTokenError("Invalid token type")
        return payload

    def create_refresh_token(self, user_id: str) -> str:
        now = datetime.now(UTC)

        payload = {
            "sub": user_id,
            "type": "refresh",
            "iat": now,
            "exp": now + timedelta(days=7),
            "iss": "auth-service",
        }

        return jwt.encode(payload, self.SECRET_KEY, "HS256")

    def decode_refresh_token(self, token: str) -> dict:
        try:
            payload = jwt.decode(token, self.SECRET_KEY, "HS256")

        except jwt.ExpiredSignatureError as exc:
            raise ValueError("Token expired") from exc

        except jwt.InvalidTokenError as exc:
            raise ValueError("Invalid token") from exc

        if payload.get("type") != "refresh":
            raise jwt.InvalidTokenError("Invalid token type")
        return payload
