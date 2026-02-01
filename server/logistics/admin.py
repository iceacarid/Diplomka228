from django.contrib import admin
from .models import User, Driver, Truck, Order, FavoriteAddress, Tariff, AIRequest, OrderStatusHistory


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'username', 'role', 'phone', 'is_active')
    list_filter = ('role', 'is_active')
    search_fields = ('email', 'username', 'phone')


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'phone', 'license_number', 'is_available')
    list_filter = ('type', 'is_available')
    search_fields = ('name', 'phone', 'license_number')


@admin.register(Truck)
class TruckAdmin(admin.ModelAdmin):
    list_display = ('plate_number', 'brand', 'model', 'status', 'driver', 'capacity_weight')
    list_filter = ('status', 'brand')
    search_fields = ('plate_number', 'brand', 'model')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('tracking_id', 'client', 'status', 'price', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('tracking_id', 'client__email', 'origin_address', 'dest_address')
    readonly_fields = ('tracking_id', 'created_at', 'updated_at')


@admin.register(FavoriteAddress)
class FavoriteAddressAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'address')
    search_fields = ('user__email', 'title', 'address')


@admin.register(Tariff)
class TariffAdmin(admin.ModelAdmin):
    list_display = ('name', 'price_per_km', 'weight_coefficient', 'is_active')
    list_filter = ('is_active',)


@admin.register(AIRequest)
class AIRequestAdmin(admin.ModelAdmin):
    list_display = ('manager', 'created_at')
    list_filter = ('created_at',)
    readonly_fields = ('created_at',)


@admin.register(OrderStatusHistory)
class OrderStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ('order', 'old_status', 'new_status', 'changed_by', 'created_at')
    list_filter = ('created_at',)
    readonly_fields = ('created_at',)
