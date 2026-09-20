import jwt
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import User
from .services.jwt_service import decode_access_token


class JWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return None

        if not auth_header.startswith("Bearer "):
            raise AuthenticationFailed("Invalid Authorization header format")

        token = auth_header.removeprefix("Bearer ")

        try:
            payload = decode_access_token(token)
        except (jwt.InvalidTokenError, ValueError) as e:
            raise AuthenticationFailed(str(e)) from e

        try:
            user = User.objects.get(id=payload["sub"])
        except User.DoesNotExist:
            raise AuthenticationFailed("User not found")

        return (user, token)
