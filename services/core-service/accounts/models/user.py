import uuid

from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        if not password:
            raise ValueError("Password is required")
        norm_email = self.normalize_email(email)
        user = User(email=norm_email, username=username, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Super user must have is_staff=True")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Super user must have is_superuser=True")
        super_user = self.create_user(email, username, password, **extra_fields)
        return super_user


class UserStatus(models.TextChoices):
    ACTIVE = "Active", "active"
    BANNED = "Banned", "banned"
    IN_VERIFICATION = "In_verification", "in_verification"


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    email = models.EmailField(
        unique=True,
    )

    status = models.CharField(
        choices=UserStatus.choices,
        default=UserStatus.ACTIVE,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )
    username = models.CharField(
        unique=True,
        max_length=30,
    )

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []
