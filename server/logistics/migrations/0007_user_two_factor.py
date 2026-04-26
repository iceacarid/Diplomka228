from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('logistics', '0006_user_lockout_emailotp'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='two_factor_enabled',
            field=models.BooleanField(default=False, verbose_name='2FA включена'),
        ),
        migrations.AddField(
            model_name='user',
            name='two_factor_action_token',
            field=models.CharField(blank=True, max_length=64, null=True, verbose_name='Токен подтверждения 2FA'),
        ),
        migrations.AddField(
            model_name='user',
            name='two_factor_action',
            field=models.CharField(blank=True, max_length=10, null=True, verbose_name='Действие 2FA'),
        ),
        migrations.AddField(
            model_name='user',
            name='two_factor_action_expires_at',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Токен действия истекает'),
        ),
        migrations.AlterField(
            model_name='emailotp',
            name='purpose',
            field=models.CharField(
                choices=[
                    ('registration', 'Подтверждение регистрации'),
                    ('password_reset', 'Сброс пароля'),
                    ('two_factor', 'Двухфакторный вход'),
                ],
                max_length=20,
                verbose_name='Назначение',
            ),
        ),
    ]
