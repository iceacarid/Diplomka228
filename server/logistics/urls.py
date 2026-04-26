from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, LogoutView, CurrentUserView,
    VerifyEmailView, ResendOTPView,
    PasswordResetRequestView, PasswordResetConfirmView,
    TwoFactorLoginVerifyView, TwoFactorRequestView, TwoFactorConfirmView, TwoFactorConfirmLinkView,
    UserViewSet, DriverViewSet, TruckViewSet, OrderViewSet,
    FavoriteAddrViewSet, TariffViewSet,
    track_order, calculate_price, calculate_route, ai_optimize, ai_history,
    test_api_view
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'drivers', DriverViewSet)
router.register(r'trucks', TruckViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'addresses', FavoriteAddrViewSet, basename='address')
router.register(r'tariffs', TariffViewSet)

urlpatterns = [
    path('test/', test_api_view, name='test-api'),
    
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('auth/resend-otp/', ResendOTPView.as_view(), name='resend-otp'),
    path('auth/password-reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    path('auth/password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/2fa/verify/', TwoFactorLoginVerifyView.as_view(), name='2fa-login-verify'),
    path('auth/2fa/request/', TwoFactorRequestView.as_view(), name='2fa-request'),
    path('auth/2fa/confirm/', TwoFactorConfirmView.as_view(), name='2fa-confirm'),
    path('auth/2fa/confirm-link/', TwoFactorConfirmLinkView.as_view(), name='2fa-confirm-link'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/me/', CurrentUserView.as_view(), name='current-user'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    
    path('orders/track/<str:tracking_id>/', track_order, name='track-order'),
    
    path('calculator/', calculate_price, name='calculator'),
    path('routes/calculate/', calculate_route, name='calculate-route'),
    
    path('ai/optimize/', ai_optimize, name='ai-optimize'),
    path('ai/history/', ai_history, name='ai-history'),
    
    path('', include(router.urls)),
]
