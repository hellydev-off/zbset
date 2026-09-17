from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_alter_user_phone_number_alter_user_username"),
    ]

    operations = [
        # Django не даёт AutoField не-первичным ключом (fields.E100), поэтому
        # автоинкремент заводим сами через Postgres SEQUENCE — по сути то же
        # самое, что Django делает под капотом для SERIAL/AutoField, только
        # без ограничения "обязательно primary key".
        migrations.RunSQL(
            sql="""
                CREATE SEQUENCE accounts_user_numeric_id_seq;
                ALTER TABLE accounts_user
                    ADD COLUMN numeric_id integer UNIQUE
                    DEFAULT nextval('accounts_user_numeric_id_seq') NOT NULL;
                ALTER SEQUENCE accounts_user_numeric_id_seq OWNED BY accounts_user.numeric_id;
            """,
            reverse_sql="""
                ALTER TABLE accounts_user DROP COLUMN numeric_id;
                DROP SEQUENCE IF EXISTS accounts_user_numeric_id_seq;
            """,
            state_operations=[
                migrations.AddField(
                    model_name="user",
                    name="numeric_id",
                    field=models.PositiveIntegerField(unique=True, editable=False, default=0),
                    preserve_default=False,
                ),
            ],
        ),
    ]
