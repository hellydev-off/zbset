import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from phonenumber_field.modelfields import PhoneNumberField

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


        
class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(
    primary_key=True,
    default=uuid.uuid4,
    editable=False,
    )

    # messaging-service-express (Prisma) хранит sender_id/participant_ids как
    # Int — UUID туда не положить. numeric_id — отдельный автоинкрементный
    # id только для интеграции с ним, в самом Django ни на что не влияет.
    numeric_id = models.AutoField(unique=True, editable=False)

    email = models.EmailField(
    unique=True,
    )

    username = models.CharField(
    max_length=50,
    unique=True,
    )
    # blank=True без null=True писало '' всем, кому не задали номер — а '' с
    # unique=True сталкивались друг с другом на втором же пользователе
    # (IntegrityError). null=True даёт NULL, который unique не считает дублем.
    phone_number = PhoneNumberField(blank=True, null=True, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()
    
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]
