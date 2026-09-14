from datetime import UTC, datetime, timedelta

import jwt
from config.settings import JWT_SECRET_KEY


class JWTService:
    SECRET_KEY = JWT_SECRET_KEY

    def create_access_token(self, user_id: str, numeric_id: int = None):
        now = datetime.now(UTC)

        payload = {
            "sub": user_id,
            # messaging-service-express читает req.user.id как числовой
            # sender_id/participant_id — кладём его же сюда, чтобы токен
            # auth-service подходил и для мессенджера без правок на его стороне.
            "id": numeric_id,
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

    def create_refresh_token(self, user_id: str, numeric_id: int = None) -> str:
        now = datetime.now(UTC)

        payload = {
            "sub": user_id,
            # нужен и тут, чтобы RefreshView могла пробросить его в новый
            # access-токен без похода в базу за пользователем
            "id": numeric_id,
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
