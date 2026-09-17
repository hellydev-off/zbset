from datetime import datetime
from datetime import timezone as dt_timezone

from django.core.exceptions import ValidationError

from ..models import RefreshToken, User
from ..services.jwt_service import create_access_token, decode_refresh_token


def save_refresh_token(user: User, refresh_token: str) -> None:
    payload = decode_refresh_token(refresh_token)

    expires_at = datetime.fromtimestamp(
        payload["exp"],
        tz=dt_timezone.utc,
    )

    RefreshToken.objects.create(
        user=user,
        refresh_token=refresh_token,
        expires_at=expires_at,
        session_id=payload["session_id"],
    )


def revoke_token(refresh_token: str):
    payload = decode_refresh_token(refresh_token)

    try:
        token: RefreshToken = RefreshToken.objects.get(
            session_id=payload["session_id"], refresh_token=refresh_token
        )
    except RefreshToken.DoesNotExist:
        raise ValidationError("Refresh token not found")

    token.revoked = True
    token.save(update_fields=["revoked"])


def refresh(refresh_token: str) -> str:
    payload = decode_refresh_token(refresh_token)

    session_id = payload["session_id"]

    try:
        token = RefreshToken.objects.get(
            refresh_token=refresh_token,
            session_id=session_id,
        )
    except RefreshToken.DoesNotExist:
        raise ValidationError("Refresh token not found")

    if token.revoked:
        raise ValidationError("Refresh token has been revoked")

    return create_access_token(
        user_id=str(token.user_id),
        session_id=str(token.session_id),
    )
