from django.db import models

from ..models.user import User


class RefreshToken(models.Model):
    id = models.BigAutoField(
        primary_key=True,
    )
    session_id = models.UUIDField(
        unique=True,
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="refresh_tokens",
    )
    refresh_token = models.TextField(
        unique=True,
    )
    revoked = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )
    expires_at = models.DateTimeField()
