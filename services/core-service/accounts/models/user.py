import uuid
from django.db import connection, models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from phonenumber_field.modelfields import PhoneNumberField


def _next_numeric_id():
    # numeric_id не может опираться на Python-дефолт поля (Django всегда
    # шлёт значение явно в INSERT, поэтому дефолт колонки в Postgres сам по
    # себе не сработал бы) — достаём следующее значение из той же
    # SEQUENCE, что использует и сама колонка.
    with connection.cursor() as cursor:
        cursor.execute("SELECT nextval('accounts_user_numeric_id_seq')")
        return cursor.fetchone()[0]


class UserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        if not password:
            raise ValueError("Password is required")
        norm_email = self.normalize_email(email)
        user = User(
            email=norm_email,
            username=username,
            numeric_id=_next_numeric_id(),
            **extra_fields,
        )
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
    # AutoField нельзя не-PK (fields.E100), поэтому это обычное поле, а
    # автоинкремент даёт Postgres SEQUENCE, заведённая в миграции руками.
    numeric_id = models.PositiveIntegerField(unique=True, editable=False)

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
