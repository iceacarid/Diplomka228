"""
Удаляет неподтверждённых пользователей (is_active=False) старше 30 минут.

Запуск вручную:
    python manage.py cleanup_unverified_users

Для автозапуска (Windows Task Scheduler или Linux cron):
    # каждые 30 минут:
    */30 * * * * cd /path/to/server && python manage.py cleanup_unverified_users
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from logistics.models import User


class Command(BaseCommand):
    help = 'Удаляет неподтверждённых пользователей старше 30 минут'

    def add_arguments(self, parser):
        parser.add_argument(
            '--minutes', type=int, default=30,
            help='Удалять пользователей старше N минут (по умолчанию 30)'
        )

    def handle(self, *args, **options):
        minutes = options['minutes']
        expiry_time = timezone.now() - timedelta(minutes=minutes)
        qs = User.objects.filter(is_active=False, created_at__lt=expiry_time)
        count = qs.count()
        qs.delete()
        self.stdout.write(
            self.style.SUCCESS(f'Удалено {count} неподтверждённых пользователей старше {minutes} мин.')
        )
