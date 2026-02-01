from django.db import models
from django.contrib.auth.models import AbstractUser
import random
import string


class User(AbstractUser):
    """Пользователь системы"""
    ROLE_CHOICES = [
        ('client', 'Клиент'),
        ('manager', 'Менеджер'),
        ('admin', 'Администратор'),
    ]
    
    role = models.CharField('Роль', max_length=20, choices=ROLE_CHOICES, default='client')
    phone = models.CharField('Телефон', max_length=20, blank=True)
    
    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'
    
    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"


class Driver(models.Model):
    """Водитель"""
    TYPE_CHOICES = [
        ('staff', 'Штатный'),
        ('hired', 'Наёмный'),
    ]
    
    name = models.CharField('ФИО', max_length=100)
    phone = models.CharField('Телефон', max_length=20)
    license_number = models.CharField('Номер водительского удостоверения', max_length=50)
    type = models.CharField('Тип', max_length=10, choices=TYPE_CHOICES, default='staff')
    
    # Только для наёмных
    personal_car = models.CharField('Госномер личного авто', max_length=20, blank=True)
    insurance_num = models.CharField('Номер страховки', max_length=50, blank=True)
    
    is_available = models.BooleanField('Доступен', default=True)
    created_at = models.DateTimeField('Дата добавления', auto_now_add=True)
    
    class Meta:
        verbose_name = 'Водитель'
        verbose_name_plural = 'Водители'
    
    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"


class Truck(models.Model):
    """Транспортное средство"""
    STATUS_CHOICES = [
        ('available', 'Свободен'),
        ('in_transit', 'В рейсе'),
        ('maintenance', 'На ремонте'),
    ]
    
    plate_number = models.CharField('Госномер', max_length=20, unique=True)
    brand = models.CharField('Марка', max_length=50)
    model = models.CharField('Модель', max_length=50)
    capacity_weight = models.IntegerField('Грузоподъёмность (кг)')
    capacity_volume = models.IntegerField('Объём кузова (м³)')
    status = models.CharField('Статус', max_length=20, choices=STATUS_CHOICES, default='available')
    driver = models.ForeignKey(Driver, on_delete=models.SET_NULL, null=True, blank=True, 
                               verbose_name='Водитель', related_name='trucks')
    location = models.CharField('Текущая локация', max_length=255, blank=True)
    created_at = models.DateTimeField('Дата добавления', auto_now_add=True)
    
    class Meta:
        verbose_name = 'Транспорт'
        verbose_name_plural = 'Транспорт'
    
    def __str__(self):
        return f"{self.brand} {self.model} ({self.plate_number})"
    
    @property
    def has_driver_issue(self):
        """Свободен, но без водителя - требует внимания"""
        return self.status == 'available' and self.driver is None


class Order(models.Model):
    """Заказ на перевозку"""
    STATUS_CHOICES = [
        ('draft', 'Черновик'),
        ('pending', 'На рассмотрении'),
        ('approved', 'Одобрен'),
        ('in_progress', 'В работе'),
        ('shipped', 'В пути'),
        ('delivered', 'Доставлен'),
        ('rejected', 'Отклонён'),
    ]
    
    tracking_id = models.CharField('Tracking ID', max_length=20, unique=True, editable=False)
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders', 
                              verbose_name='Клиент')
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                               related_name='managed_orders', verbose_name='Менеджер')
    
    # Маршрут
    origin_address = models.CharField('Адрес отправления', max_length=255)
    origin_lat = models.FloatField('Широта отправления', null=True, blank=True)
    origin_lng = models.FloatField('Долгота отправления', null=True, blank=True)
    
    dest_address = models.CharField('Адрес назначения', max_length=255)
    dest_lat = models.FloatField('Широта назначения', null=True, blank=True)
    dest_lng = models.FloatField('Долгота назначения', null=True, blank=True)
    
    # Груз
    cargo_description = models.TextField('Описание груза', blank=True)
    weight = models.DecimalField('Вес (кг)', max_digits=10, decimal_places=2)
    volume = models.DecimalField('Объём (м³)', max_digits=10, decimal_places=2)
    
    # Стоимость и сроки
    price = models.DecimalField('Стоимость (₽)', max_digits=10, decimal_places=2)
    distance = models.FloatField('Расстояние (км)', null=True, blank=True)
    estimated_delivery = models.DateTimeField('Ожидаемая дата доставки', null=True, blank=True)
    desired_date = models.DateField('Желаемая дата отправки', null=True, blank=True)
    
    # Статус и назначение
    status = models.CharField('Статус', max_length=20, choices=STATUS_CHOICES, default='pending')
    truck = models.ForeignKey(Truck, on_delete=models.SET_NULL, null=True, blank=True,
                             verbose_name='Транспорт', related_name='orders')
    driver = models.ForeignKey(Driver, on_delete=models.SET_NULL, null=True, blank=True,
                              verbose_name='Водитель', related_name='orders')
    
    # Причина отклонения
    rejection_reason = models.TextField('Причина отклонения', blank=True)
    
    # Временные метки
    created_at = models.DateTimeField('Дата создания', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)
    accepted_at = models.DateTimeField('Дата принятия', null=True, blank=True)
    shipped_at = models.DateTimeField('Дата отправки', null=True, blank=True)
    delivered_at = models.DateTimeField('Дата доставки', null=True, blank=True)
    
    class Meta:
        verbose_name = 'Заказ'
        verbose_name_plural = 'Заказы'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Заказ {self.tracking_id} - {self.get_status_display()}"
    
    def save(self, *args, **kwargs):
        if not self.tracking_id:
            self.tracking_id = self.generate_tracking_id()
        super().save(*args, **kwargs)
    
    @staticmethod
    def generate_tracking_id():
        """Генерация уникального Tracking ID"""
        prefix = 'FE'
        while True:
            random_part = ''.join(random.choices(string.digits, k=6))
            tracking_id = f"{prefix}-{random_part}"
            if not Order.objects.filter(tracking_id=tracking_id).exists():
                return tracking_id


class FavoriteAddress(models.Model):
    """Избранные адреса клиента"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorite_addresses',
                            verbose_name='Пользователь')
    title = models.CharField('Название', max_length=100)
    address = models.CharField('Адрес', max_length=255)
    lat = models.FloatField('Широта', null=True, blank=True)
    lng = models.FloatField('Долгота', null=True, blank=True)
    created_at = models.DateTimeField('Дата добавления', auto_now_add=True)
    
    class Meta:
        verbose_name = 'Избранный адрес'
        verbose_name_plural = 'Избранные адреса'
    
    def __str__(self):
        return f"{self.title} - {self.address}"


class Tariff(models.Model):
    """Тариф на перевозку"""
    name = models.CharField('Название', max_length=100)
    price_per_km = models.DecimalField('Цена за км (₽)', max_digits=10, decimal_places=2)
    weight_coefficient = models.DecimalField('Коэффициент веса', max_digits=10, decimal_places=4)
    is_active = models.BooleanField('Активен', default=True)
    created_at = models.DateTimeField('Дата создания', auto_now_add=True)
    
    class Meta:
        verbose_name = 'Тариф'
        verbose_name_plural = 'Тарифы'
    
    def __str__(self):
        return self.name


class AIRequest(models.Model):
    """История запросов к AI"""
    manager = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_requests',
                               verbose_name='Менеджер')
    request_text = models.TextField('Запрос')
    response_text = models.TextField('Ответ')
    created_at = models.DateTimeField('Дата запроса', auto_now_add=True)
    
    class Meta:
        verbose_name = 'AI запрос'
        verbose_name_plural = 'AI запросы'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Запрос от {self.manager.email} - {self.created_at.strftime('%d.%m.%Y %H:%M')}"


class OrderStatusHistory(models.Model):
    """История изменения статусов заказа"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history',
                             verbose_name='Заказ')
    old_status = models.CharField('Старый статус', max_length=20)
    new_status = models.CharField('Новый статус', max_length=20)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,
                                  verbose_name='Изменил')
    comment = models.TextField('Комментарий', blank=True)
    created_at = models.DateTimeField('Дата изменения', auto_now_add=True)
    
    class Meta:
        verbose_name = 'История статуса'
        verbose_name_plural = 'История статусов'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.order.tracking_id}: {self.old_status} → {self.new_status}"
