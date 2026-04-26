import re
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Driver, Truck, Order, FavoriteAddr, Tariff, AIRequest, EmailOTP


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'name', 'phone', 'avatar', 'avatar_url', 'role', 'password', 'created_at', 'is_active', 'two_factor_enabled')
        read_only_fields = ('id', 'created_at', 'avatar_url')

    def get_avatar_url(self, obj):
        """Возвращает URL аватара или дефолтную картинку котика"""
        request = self.context.get('request')
        
        if obj.avatar:
            # Пользовательская аватарка
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        else:
            # Дефолтная заглушка с котиком
            default_avatar = '/media/avatars/default.png'
            if request:
                return request.build_absolute_uri(default_avatar)
            return default_avatar

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        instance = super().update(instance, validated_data)
        if password:
            instance.set_password(password)
            instance.save()
        return instance

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


def validate_strong_password(value):
    """Серверная валидация пароля: регистры символов + спецсимволы.
    Требования:
      - минимум 8 символов
      - хотя бы одна ЗАГЛАВНАЯ буква (A-Z)
      - хотя бы одна строчная буква (a-z)
      - хотя бы одна цифра (0-9)
      - хотя бы один спецсимвол (!@#$%^&*()_+и др.)
    Пароль хранится в БД в виде хеша PBKDF2-SHA256 (Django set_password / AbstractBaseUser).
    """
    errors = []
    if len(value) < 8:
        errors.append('Минимум 8 символов.')
    if not re.search(r'[A-Z]', value):
        errors.append('Минимум одна заглавная буква (A-Z).')
    if not re.search(r'[a-z]', value):
        errors.append('Минимум одна строчная буква (a-z).')
    if not re.search(r'\d', value):
        errors.append('Минимум одна цифра (0-9).')
    if not re.search(r'[!@#$%^&*()\-_=+\[\]{}|;:,.<>?/\\\'"`~]', value):
        errors.append('Минимум один специальный символ (!@#$%^&* и др.).')
    if errors:
        raise serializers.ValidationError(errors)
    return value


class RegisterSerializer(serializers.ModelSerializer):
    # Валидация: регистры + спецсимволы (серверная сторона)
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('email', 'name', 'phone', 'password')

    def validate_password(self, value):
        return validate_strong_password(value)

    def create(self, validated_data):
        password = validated_data.pop('password')
        # is_active=False — аккаунт активируется после подтверждения email (2FA)
        user = User.objects.create_user(
            email=validated_data['email'],
            password=password,
            name=validated_data['name'],
            phone=validated_data.get('phone'),
            role='client',
            is_active=False,
        )
        return user


class OTPVerifySerializer(serializers.Serializer):
    """Подтверждение email через OTP-код (двухфакторная аутентификация)."""
    email = serializers.EmailField(required=True)
    code = serializers.CharField(required=True, min_length=6, max_length=6)
    purpose = serializers.ChoiceField(
        choices=['registration', 'password_reset'], required=True
    )


class PasswordResetRequestSerializer(serializers.Serializer):
    """Запрос на восстановление пароля — отправляет OTP на email."""
    email = serializers.EmailField(required=True)


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Подтверждение нового пароля через OTP-код."""
    email = serializers.EmailField(required=True)
    code = serializers.CharField(required=True, min_length=6, max_length=6)
    new_password = serializers.CharField(required=True, write_only=True)

    def validate_new_password(self, value):
        return validate_strong_password(value)


class TwoFactorVerifySerializer(serializers.Serializer):
    """Проверка OTP-кода двухфакторной аутентификации при входе."""
    email = serializers.EmailField(required=True)
    code = serializers.CharField(required=True, min_length=6, max_length=6)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(email=email, password=password)
            if not user:
                raise serializers.ValidationError('Неверный email или пароль')
            if not user.is_active:
                raise serializers.ValidationError('Аккаунт отключен')
        else:
            raise serializers.ValidationError('Необходимо указать email и пароль')

        attrs['user'] = user
        return attrs


class DriverSerializer(serializers.ModelSerializer):
    trucks = serializers.SerializerMethodField()

    class Meta:
        model = Driver
        fields = '__all__'

    def get_trucks(self, obj):
        from logistics.models import Truck
        trucks = Truck.objects.filter(driver=obj)
        return [{'id': t.id, 'plate_number': t.plate_number, 'brand': t.brand, 'model': t.model} for t in trucks]

    def validate(self, attrs):
        if attrs.get('personal_car') or attrs.get('insurance_num'):
            if not attrs.get('personal_car'):
                raise serializers.ValidationError({"personal_car": "Укажите госномер личного авто"})
            if not attrs.get('insurance_num'):
                raise serializers.ValidationError({"insurance_num": "Укажите номер страховки"})
        return attrs


class TruckSerializer(serializers.ModelSerializer):
    driver_name = serializers.SerializerMethodField()

    class Meta:
        model = Truck
        fields = '__all__'

    def get_driver_name(self, obj):
        if obj.driver_id and obj.driver:
            return obj.driver.name or ''
        return ''


class OrderListSerializer(serializers.ModelSerializer):
    """Данные заказов читаются из БД (Order), все поля — из модели."""
    client_name = serializers.CharField(source='client.name', read_only=True)
    manager_name = serializers.SerializerMethodField()
    truck_plate = serializers.SerializerMethodField()
    driver_name = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ('id', 'tracking_id', 'client', 'client_name', 'manager', 'manager_name', 
                  'truck', 'truck_plate', 'driver', 'driver_name', 'status', 
                  'origin_address', 'dest_address', 'weight', 'volume', 'cargo_type', 'cargo_type_custom', 'cargo_description', 'price', 
                  'eta', 'rejection_reason', 'created_at')
        read_only_fields = ('tracking_id', 'created_at')

    def get_manager_name(self, obj):
        return obj.manager.name if obj.manager else ''

    def get_truck_plate(self, obj):
        return obj.truck.plate_number if obj.truck else ''

    def get_driver_name(self, obj):
        return obj.driver.name if obj.driver else ''


class OrderDetailSerializer(serializers.ModelSerializer):
    client = UserSerializer(read_only=True)
    manager = UserSerializer(read_only=True, allow_null=True)
    truck = TruckSerializer(read_only=True, allow_null=True)
    driver = DriverSerializer(read_only=True, allow_null=True)

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ('tracking_id', 'created_at')


class OrderCreateSerializer(serializers.ModelSerializer):
    """Все переданные поля сохраняются в БД через Order.objects.create()."""
    class Meta:
        model = Order
        fields = ('origin_address', 'dest_address', 'weight', 'volume', 'cargo_type', 'cargo_type_custom', 'cargo_description', 'price')

    def create(self, validated_data):
        validated_data['client'] = self.context['request'].user
        validated_data['status'] = 'pending'
        return super().create(validated_data)  # сохраняет в БД все поля из validated_data


class FavoriteAddrSerializer(serializers.ModelSerializer):
    class Meta:
        model = FavoriteAddr
        fields = '__all__'
        read_only_fields = ('user', 'created_at')


class TariffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tariff
        fields = '__all__'


class AIRequestSerializer(serializers.ModelSerializer):
    manager_name = serializers.CharField(source='manager.name', read_only=True)

    class Meta:
        model = AIRequest
        fields = '__all__'
        read_only_fields = ('manager', 'created_at')


class CalculatorSerializer(serializers.Serializer):
    origin = serializers.CharField(required=True, label='Город отправления')
    destination = serializers.CharField(required=True, label='Город назначения')
    weight = serializers.FloatField(required=True, min_value=0, label='Вес (кг)')
    volume = serializers.FloatField(required=True, min_value=0, label='Объём (м³)')


class RouteCalculationSerializer(serializers.Serializer):
    points = serializers.ListField(
        child=serializers.CharField(),
        min_length=2,
        label='Точки маршрута'
    )
