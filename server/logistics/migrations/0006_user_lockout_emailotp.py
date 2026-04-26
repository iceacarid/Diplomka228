"""
Практическая работа №2:
- Поля блокировки аккаунта (failed_login_attempts, lockout_until) в модели User
- Таблица email_otps для двухфакторной аутентификации и восстановления пароля
"""
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('logistics', '0005_truck_is_company_owned'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='failed_login_attempts',
            field=models.IntegerField(default=0, verbose_name='Неудачных попыток входа'),
        ),
        migrations.AddField(
            model_name='user',
            name='lockout_until',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Заблокирован до'),
        ),
        migrations.CreateModel(
            name='EmailOTP',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(max_length=6, verbose_name='Код')),
                ('purpose', models.CharField(
                    choices=[
                        ('registration', 'Подтверждение регистрации'),
                        ('password_reset', 'Сброс пароля'),
                    ],
                    max_length=20,
                    verbose_name='Назначение',
                )),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Создан')),
                ('expires_at', models.DateTimeField(verbose_name='Истекает')),
                ('is_used', models.BooleanField(default=False, verbose_name='Использован')),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='otps',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Пользователь',
                )),
            ],
            options={
                'verbose_name': 'OTP код',
                'verbose_name_plural': 'OTP коды',
                'db_table': 'email_otps',
            },
        ),
    ]
