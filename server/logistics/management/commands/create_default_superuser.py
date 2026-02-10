"""
Временное решение: создаёт суперпользователя при старте, если в переменных
окружения заданы CREATE_ADMIN_EMAIL и CREATE_ADMIN_PASSWORD и в БД ещё нет админа.

На Render добавьте в Environment:
  CREATE_ADMIN_EMAIL=ваш@email.com
  CREATE_ADMIN_PASSWORD=надёжный_пароль

После первого входа смените пароль в админке и при желании удалите эти переменные.
"""
import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = 'Создаёт суперпользователя из переменных CREATE_ADMIN_EMAIL и CREATE_ADMIN_PASSWORD, если админов ещё нет.'

    def handle(self, *args, **options):
        User = get_user_model()
        if User.objects.filter(is_superuser=True).exists():
            self.stdout.write('Суперпользователь уже есть, пропуск.')
            return

        email = os.environ.get('CREATE_ADMIN_EMAIL', '').strip()
        password = os.environ.get('CREATE_ADMIN_PASSWORD', '').strip()

        if not email or not password:
            self.stdout.write('CREATE_ADMIN_EMAIL и CREATE_ADMIN_PASSWORD не заданы, пропуск.')
            return

        User.objects.create_superuser(email=email, password=password)
        self.stdout.write(self.style.SUCCESS(f'Создан суперпользователь: {email}'))
