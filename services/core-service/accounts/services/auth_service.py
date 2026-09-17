from django.core.exceptions import ValidationError

from ..models import User
from ..services.jwt_service import (
    create_access_token,
    create_refresh_token,
)
from .refresh_token_service import save_refresh_token


def register(email: str, username: str, password: str) -> User:
    norm_email = User.objects.normalize_email(email)
    if User.objects.filter(email=norm_email).exists():
        msg = "Пользователь с таким email уже существует"
        raise ValidationError(msg)
    if User.objects.filter(username=username).exists():
        msg = "Пользователь с таким username уже существует"
        raise ValidationError(msg)
    user = User.objects.create_user(email, username, password)
    user.full_clean()
    return user


def login(email: str, password: str) -> dict:
    user = auth_user(email, password)

    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))

    save_refresh_token(user, refresh_token)

    return {
        "user_id": str(user.id),
        "access_token": access_token,
        "refresh_token": refresh_token,
    }


def auth_user(email: str, password: str) -> User:
    norm_email = User.objects.normalize_email(email)

    msg = "Invalid email or password"

    try:
        user: User = User.objects.get(email=norm_email)
    except User.DoesNotExist:
        raise ValidationError(msg)

    if not user.check_password(password):
        raise ValidationError(msg)

    if not user.is_active:
        raise ValidationError("User is inactive")

    return user
