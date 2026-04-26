from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Driver, Truck, Order, FavoriteAddr, Tariff, AIRequest, EmailOTP


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'name', 'role', 'is_active', 'is_staff', 'created_at')
    list_filter = ('role', 'is_active', 'is_staff')
    search_fields = ('email', 'name', 'phone')
    ordering = ('-created_at',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Личная информация', {'fields': ('name', 'phone', 'role')}),
        ('Права доступа', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Безопасность', {'fields': ('failed_login_attempts', 'lockout_until')}),
        ('Важные даты', {'fields': ('last_login', 'created_at')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'phone', 'role', 'password1', 'password2', 'is_active', 'is_staff'),
        }),
    )

    readonly_fields = ('created_at', 'last_login', 'failed_login_attempts', 'lockout_until')


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'type', 'is_available', 'personal_car', 'created_at')
    list_filter = ('type', 'is_available')
    search_fields = ('name', 'phone', 'license_number')
    ordering = ('-created_at',)


@admin.register(Truck)
class TruckAdmin(admin.ModelAdmin):
    list_display = ('plate_number', 'brand', 'model', 'status', 'driver', 'capacity_weight', 'capacity_volume', 'created_at')
    list_filter = ('status', 'brand')
    search_fields = ('plate_number', 'brand', 'model')
    ordering = ('-created_at',)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('tracking_id', 'client', 'status', 'cargo_description', 'origin_address', 'dest_address', 'price', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('tracking_id', 'client__name', 'origin_address', 'dest_address', 'cargo_description')
    readonly_fields = ('tracking_id', 'created_at')
    ordering = ('-created_at',)


@admin.register(FavoriteAddr)
class FavoriteAddrAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'address', 'created_at')
    search_fields = ('title', 'address', 'user__name')
    ordering = ('-created_at',)


@admin.register(Tariff)
class TariffAdmin(admin.ModelAdmin):
    list_display = ('name', 'price_per_km', 'weight_coef', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name',)
    ordering = ('-created_at',)


@admin.register(AIRequest)
class AIRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'manager', 'created_at')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)


@admin.register(EmailOTP)
class EmailOTPAdmin(admin.ModelAdmin):
    list_display = ('user', 'purpose', 'code', 'is_used', 'created_at', 'expires_at')
    list_filter = ('purpose', 'is_used')
    search_fields = ('user__email', 'user__name')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
