from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
import random
import string


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email обязателен')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser должен иметь is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser должен иметь is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('client', 'Клиент'),
        ('manager', 'Менеджер'),
        ('admin', 'Администратор'),
    )

    email = models.EmailField(unique=True, verbose_name='Email')
    name = models.CharField(max_length=255, verbose_name='Имя')
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name='Телефон')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name='Аватар')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='client', verbose_name='Роль')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    is_active = models.BooleanField(default=True, verbose_name='Активен')
    is_staff = models.BooleanField(default=False, verbose_name='Персонал')

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'
        db_table = 'users'

    def __str__(self):
        return f"{self.name} ({self.email})"


class Driver(models.Model):
    TYPE_CHOICES = (
        ('staff', 'Штатный'),
        ('hired', 'Наёмный'),
    )

    name = models.CharField(max_length=255, verbose_name='ФИО')
    phone = models.CharField(max_length=20, verbose_name='Телефон')
    license_number = models.CharField(max_length=50, verbose_name='Номер прав')
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='staff', verbose_name='Тип')
    personal_car = models.CharField(max_length=50, blank=True, null=True, verbose_name='Госномер личного авто')
    insurance_num = models.CharField(max_length=50, blank=True, null=True, verbose_name='Номер страховки')
    is_available = models.BooleanField(default=True, verbose_name='Доступен')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')

    class Meta:
        verbose_name = 'Водитель'
        verbose_name_plural = 'Водители'
        db_table = 'drivers'

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"


class Truck(models.Model):
    STATUS_CHOICES = (
        ('available', 'Свободен'),
        ('in_transit', 'В рейсе'),
        ('maintenance', 'На ремонте'),
    )

    plate_number = models.CharField(max_length=20, unique=True, verbose_name='Госномер')
    brand = models.CharField(max_length=100, verbose_name='Марка')
    model = models.CharField(max_length=100, verbose_name='Модель')
    capacity_weight = models.IntegerField(verbose_name='Грузоподъёмность (кг)')
    capacity_volume = models.FloatField(verbose_name='Объём кузова (м³)')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available', verbose_name='Статус')
    driver = models.ForeignKey(Driver, on_delete=models.SET_NULL, null=True, blank=True, related_name='trucks', verbose_name='Водитель')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')

    class Meta:
        verbose_name = 'Транспорт'
        verbose_name_plural = 'Транспорт'
        db_table = 'trucks'

    def __str__(self):
        return f"{self.brand} {self.model} ({self.plate_number})"


class Order(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Черновик'),
        ('pending', 'На рассмотрении'),
        ('in_progress', 'В работе'),
        ('shipped', 'В пути'),
        ('delivered', 'Доставлено'),
        ('rejected', 'Отклонено'),
    )

    CARGO_TYPE_CHOICES = (
        ('general', 'Обычный груз'),
        ('fragile', 'Хрупкое'),
        ('flammable', 'Огнеопасное'),
        ('perishable', 'Скоропортящееся'),
        ('hazardous', 'Опасное'),
        ('oversized', 'Негабаритное'),
        ('temperature_controlled', 'Температурный режим'),
        ('other', 'Другое'),
    )

    tracking_id = models.CharField(max_length=20, unique=True, editable=False, verbose_name='Tracking ID')
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders', verbose_name='Клиент')
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_orders', verbose_name='Менеджер')
    truck = models.ForeignKey(Truck, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders', verbose_name='Транспорт')
    driver = models.ForeignKey(Driver, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders', verbose_name='Водитель')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='Статус')
    origin_address = models.CharField(max_length=500, verbose_name='Адрес отправления')
    dest_address = models.CharField(max_length=500, verbose_name='Адрес доставки')
    weight = models.FloatField(verbose_name='Вес груза (кг)')
    volume = models.FloatField(verbose_name='Объём груза (м³)')
    cargo_type = models.CharField(max_length=30, choices=CARGO_TYPE_CHOICES, default='general', verbose_name='Тип груза')
    cargo_type_custom = models.CharField(max_length=255, blank=True, null=True, verbose_name='Тип груза (свой вариант)')
    cargo_description = models.TextField(blank=True, null=True, verbose_name='Описание товара (что везём)')
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Стоимость (₽)')
    eta = models.DateTimeField(null=True, blank=True, verbose_name='Примерное время прибытия')
    rejection_reason = models.TextField(blank=True, null=True, verbose_name='Причина отклонения')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')

    class Meta:
        verbose_name = 'Заказ'
        verbose_name_plural = 'Заказы'
        db_table = 'orders'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.tracking_id:
            self.tracking_id = self.generate_tracking_id()
        super().save(*args, **kwargs)

    def generate_tracking_id(self):
        while True:
            code = 'FE-' + ''.join(random.choices(string.digits, k=6))
            if not Order.objects.filter(tracking_id=code).exists():
                return code

    def __str__(self):
        return f"{self.tracking_id} - {self.client.name}"


class FavoriteAddr(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorite_addresses', verbose_name='Пользователь')
    title = models.CharField(max_length=100, verbose_name='Название')
    address = models.CharField(max_length=500, verbose_name='Адрес')
    lat = models.FloatField(null=True, blank=True, verbose_name='Широта')
    lng = models.FloatField(null=True, blank=True, verbose_name='Долгота')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')

    class Meta:
        verbose_name = 'Избранный адрес'
        verbose_name_plural = 'Избранные адреса'
        db_table = 'favorite_addresses'

    def __str__(self):
        return f"{self.title} - {self.user.name}"


class Tariff(models.Model):
    name = models.CharField(max_length=100, verbose_name='Название')
    price_per_km = models.DecimalField(max_digits=8, decimal_places=2, verbose_name='Цена за км (₽)')
    weight_coef = models.DecimalField(max_digits=6, decimal_places=2, verbose_name='Коэффициент веса')
    is_active = models.BooleanField(default=True, verbose_name='Активен')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')

    class Meta:
        verbose_name = 'Тариф'
        verbose_name_plural = 'Тарифы'
        db_table = 'tariffs'

    def __str__(self):
        return f"{self.name} - {self.price_per_km}₽/км"


class AIRequest(models.Model):
    manager = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_requests', verbose_name='Менеджер')
    request_text = models.TextField(verbose_name='Запрос')
    response_text = models.TextField(verbose_name='Ответ')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')

    class Meta:
        verbose_name = 'AI запрос'
        verbose_name_plural = 'AI запросы'
        db_table = 'ai_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f"AI запрос {self.id} - {self.manager.name}"
