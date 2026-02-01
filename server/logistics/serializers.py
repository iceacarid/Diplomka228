from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Driver, Truck, Order, FavoriteAddr, Tariff, AIRequest


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ('id', 'email', 'name', 'phone', 'role', 'password', 'created_at', 'is_active')
        read_only_fields = ('id', 'created_at')

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


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=6)
    password2 = serializers.CharField(write_only=True, required=True, label='Подтвердите пароль')

    class Meta:
        model = User
        fields = ('email', 'name', 'phone', 'password', 'password2', 'role')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Пароли не совпадают"})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


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
    class Meta:
        model = Driver
        fields = '__all__'

    def validate(self, attrs):
        if attrs.get('type') == 'hired':
            if not attrs.get('personal_car'):
                raise serializers.ValidationError({"personal_car": "Обязательное поле для наёмных водителей"})
            if not attrs.get('insurance_num'):
                raise serializers.ValidationError({"insurance_num": "Обязательное поле для наёмных водителей"})
        return attrs


class TruckSerializer(serializers.ModelSerializer):
    driver_name = serializers.CharField(source='driver.name', read_only=True)

    class Meta:
        model = Truck
        fields = '__all__'


class OrderListSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    manager_name = serializers.CharField(source='manager.name', read_only=True)
    truck_plate = serializers.CharField(source='truck.plate_number', read_only=True)
    driver_name = serializers.CharField(source='driver.name', read_only=True)

    class Meta:
        model = Order
        fields = ('id', 'tracking_id', 'client', 'client_name', 'manager', 'manager_name', 
                  'truck', 'truck_plate', 'driver', 'driver_name', 'status', 
                  'origin_address', 'dest_address', 'weight', 'volume', 'price', 
                  'eta', 'created_at')
        read_only_fields = ('tracking_id', 'created_at')


class OrderDetailSerializer(serializers.ModelSerializer):
    client = UserSerializer(read_only=True)
    manager = UserSerializer(read_only=True)
    truck = TruckSerializer(read_only=True)
    driver = DriverSerializer(read_only=True)

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ('tracking_id', 'created_at')


class OrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ('origin_address', 'dest_address', 'weight', 'volume', 'price')

    def create(self, validated_data):
        validated_data['client'] = self.context['request'].user
        validated_data['status'] = 'pending'
        return super().create(validated_data)


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
