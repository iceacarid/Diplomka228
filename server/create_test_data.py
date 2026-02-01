import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from logistics.models import User, Tariff

print("Создание базовых данных...")

if not User.objects.filter(email='admin@fura.ru').exists():
    admin = User.objects.create_superuser(
        email='admin@fura.ru',
        password='admin123',
        name='Администратор',
        phone='+79991234567',
        role='admin'
    )
    print(f"Создан администратор: {admin.email}")

if not User.objects.filter(email='manager@fura.ru').exists():
    manager = User.objects.create_user(
        email='manager@fura.ru',
        password='manager123',
        name='Менеджер Иван',
        phone='+79991234568',
        role='manager'
    )
    print(f"Создан менеджер: {manager.email}")

if not User.objects.filter(email='client@fura.ru').exists():
    client = User.objects.create_user(
        email='client@fura.ru',
        password='client123',
        name='Клиент Петр',
        phone='+79991234569',
        role='client'
    )
    print(f"Создан клиент: {client.email}")

if not Tariff.objects.filter(name='Стандартный').exists():
    tariff = Tariff.objects.create(
        name='Стандартный',
        price_per_km=15.00,
        weight_coef=2.50,
        is_active=True
    )
    print(f"Создан тариф: {tariff.name}")

print("\nГотово! Тестовые данные созданы.")
print("\nУчётные данные для входа:")
print("Администратор: admin@fura.ru / admin123")
print("Менеджер: manager@fura.ru / manager123")
print("Клиент: client@fura.ru / client123")
