from datetime import timedelta

import secrets

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404, render, redirect
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET
from django.core.mail import send_mail
from django.utils import timezone
from .models import User, Driver, Truck, Order, FavoriteAddr, Tariff, AIRequest, EmailOTP
from .serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer,
    OTPVerifySerializer, PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
    TwoFactorVerifySerializer,
    DriverSerializer, TruckSerializer, OrderListSerializer, OrderDetailSerializer, OrderCreateSerializer,
    FavoriteAddrSerializer, TariffSerializer, AIRequestSerializer,
    CalculatorSerializer, RouteCalculationSerializer
)
from .permissions import IsClient, IsManager, IsAdmin, IsManagerOrAdmin, IsOwnerOrManagerOrAdmin
from .services import AIService, YandexMapsService

# ---------- Вспомогательные функции для OTP (2FA) ----------

OTP_EXPIRY_MINUTES = 10
TWO_FACTOR_ACTION_EXPIRY_MINUTES = 30
LOGIN_MAX_ATTEMPTS = 5
LOGIN_LOCKOUT_MINUTES = 15
UNVERIFIED_USER_EXPIRY_MINUTES = 30  # неподтверждённые аккаунты удаляются через 30 минут


def _cleanup_expired_unverified_users():
    """Удаляет неподтверждённых пользователей (is_active=False) старше 30 минут.
    Вызывается автоматически при каждом запросе регистрации.
    """
    expiry_time = timezone.now() - timedelta(minutes=UNVERIFIED_USER_EXPIRY_MINUTES)
    deleted_count, _ = User.objects.filter(is_active=False, created_at__lt=expiry_time).delete()
    return deleted_count


def _send_otp(user, purpose):
    """Генерирует OTP-код, сохраняет в БД и отправляет на email пользователя.

    Коды генерируются через secrets.randbelow() — ГПСЧ, одобренный для
    криптографических целей (RFC 4226 / HOTP-подобный подход).
    Пароль пользователя хранится отдельно в виде хеша PBKDF2-SHA256.
    """
    # Удаляем старые неиспользованные коды для этого назначения
    EmailOTP.objects.filter(user=user, purpose=purpose, is_used=False).delete()

    code = EmailOTP.generate_code()
    expires_at = timezone.now() + timedelta(minutes=OTP_EXPIRY_MINUTES)
    EmailOTP.objects.create(user=user, code=code, purpose=purpose, expires_at=expires_at)

    if purpose == 'registration':
        subject = 'ФураЕдет — подтверждение регистрации'
        body = (
            f'Здравствуйте, {user.name}!\n\n'
            f'Ваш код подтверждения: {code}\n\n'
            f'Код действителен {OTP_EXPIRY_MINUTES} минут.\n'
            f'Если вы не регистрировались в ФураЕдет — проигнорируйте письмо.'
        )
    elif purpose == 'two_factor':
        subject = 'ФураЕдет — код для входа (2FA)'
        body = (
            f'Здравствуйте, {user.name}!\n\n'
            f'Ваш код для входа: {code}\n\n'
            f'Код действителен {OTP_EXPIRY_MINUTES} минут.\n'
            f'Если вы не входили в ФураЕдет — немедленно смените пароль.'
        )
    else:
        subject = 'ФураЕдет — восстановление пароля'
        body = (
            f'Здравствуйте, {user.name}!\n\n'
            f'Код для сброса пароля: {code}\n\n'
            f'Код действителен {OTP_EXPIRY_MINUTES} минут.\n'
            f'Если вы не запрашивали сброс — проигнорируйте письмо.'
        )

    send_mail(subject=subject, message=body, from_email=None,
              recipient_list=[user.email], fail_silently=False)
    return code


def _verify_otp(user, code, purpose):
    """Проверяет OTP: возвращает объект EmailOTP или None."""
    now = timezone.now()
    return EmailOTP.objects.filter(
        user=user, code=code, purpose=purpose,
        is_used=False, expires_at__gt=now,
    ).order_by('-created_at').first()


def index_view(request):
    return render(request, 'index.html')


def login_view(request):
    return render(request, 'login.html')


def register_view(request):
    return render(request, 'register.html')


def dashboard_view(request):
    return render(request, 'dashboard.html')


def forgot_password_view(request):
    return render(request, 'forgot_password.html')


@require_GET
def robots_txt_view(request):
    """Отдача robots.txt для поисковых роботов (SEO)."""
    base = request.build_absolute_uri('/').rstrip('/')
    lines = [
        '# robots.txt — ФураЕдет',
        '# https://furaedет.ru/robots.txt',
        '',
        'User-agent: *',
        'Allow: /',
        'Allow: /login',
        'Allow: /register',
        'Disallow: /admin/',
        'Disallow: /api/',
        'Disallow: /dashboard',
        'Disallow: /client/',
        'Disallow: /manager/',
        'Disallow: /admin-panel',
        'Disallow: /forgot-password',
        '',
        '# Яндекс-бот',
        'User-agent: Yandex',
        'Allow: /',
        'Disallow: /admin/',
        'Disallow: /api/',
        'Disallow: /dashboard',
        'Clean-param: utm_source&utm_medium&utm_campaign&utm_content&utm_term /',
        '',
        f'Sitemap: {base}/sitemap.xml',
    ]
    return HttpResponse('\n'.join(lines), content_type='text/plain; charset=utf-8')


@require_GET
def sitemap_xml_view(request):
    """Отдача sitemap.xml для поисковых систем (SEO)."""
    from django.utils import timezone as tz
    base = request.build_absolute_uri('/').rstrip('/')
    today = tz.now().strftime('%Y-%m-%d')
    # (path, changefreq, priority) — приватные страницы (dashboard и т.п.) не включаем
    pages = [
        ('', 'daily', '1.0'),
        ('login', 'monthly', '0.6'),
        ('register', 'monthly', '0.6'),
    ]
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for path, changefreq, priority in pages:
        url = f'{base}/{path}' if path else base
        lines.append('  <url>')
        lines.append(f'    <loc>{url}</loc>')
        lines.append(f'    <lastmod>{today}</lastmod>')
        lines.append(f'    <changefreq>{changefreq}</changefreq>')
        lines.append(f'    <priority>{priority}</priority>')
        lines.append('  </url>')
    lines.append('</urlset>')
    return HttpResponse('\n'.join(lines), content_type='application/xml; charset=utf-8')


class RegisterView(APIView):
    """Шаг 1 регистрации: сохраняет пользователя (is_active=False) и отправляет OTP на email."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Удаляем просроченных неподтверждённых пользователей (старше 30 мин)
        _cleanup_expired_unverified_users()

        # Если email занят неактивным (неподтверждённым) пользователем — даём возможность
        # зарегистрироваться повторно (например, код истёк и пользователь хочет новый)
        email = request.data.get('email', '').strip().lower()
        User.objects.filter(email__iexact=email, is_active=False).delete()

        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            try:
                _send_otp(user, 'registration')
            except Exception as e:
                # Если SMTP не настроен — удаляем только что созданного пользователя,
                # чтобы не оставлять "мёртвый" неактивный аккаунт
                user.delete()
                return Response(
                    {'error': f'Не удалось отправить письмо с кодом: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
            return Response({
                'message': 'Код подтверждения отправлен на вашу почту.',
                'email': user.email,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyEmailView(APIView):
    """Шаг 2 регистрации (2FA): проверяет OTP-код, активирует аккаунт и возвращает JWT."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        code = serializer.validated_data['code']
        purpose = serializer.validated_data['purpose']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Пользователь не найден.'}, status=status.HTTP_404_NOT_FOUND)

        otp = _verify_otp(user, code, purpose)
        if not otp:
            return Response({'error': 'Неверный или истёкший код.'}, status=status.HTTP_400_BAD_REQUEST)

        otp.is_used = True
        otp.save()

        if purpose == 'registration':
            user.is_active = True
            user.save(update_fields=['is_active'])
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'Email подтверждён. Регистрация завершена.',
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })

        # Для password_reset — просто подтверждаем факт проверки кода
        return Response({'message': 'Код подтверждён.', 'email': email})


class ResendOTPView(APIView):
    """Повторная отправка OTP-кода (регистрация или сброс пароля)."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        purpose = request.data.get('purpose', 'registration')

        if purpose not in ('registration', 'password_reset'):
            return Response({'error': 'Неверное назначение.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Не раскрываем, существует ли email
            return Response({'message': 'Если email зарегистрирован, на него отправлен код.'})

        if purpose == 'registration' and user.is_active:
            return Response({'error': 'Email уже подтверждён.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            _send_otp(user, purpose)
        except Exception:
            return Response({'error': 'Не удалось отправить письмо.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'message': 'Код отправлен повторно.'})


class LoginView(APIView):
    """Вход с защитой от перебора: блокировка после 5 неудачных попыток на 15 минут."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        now = timezone.now()

        # Проверяем блокировку до запуска сериализатора
        try:
            candidate = User.objects.get(email=email)
            if candidate.lockout_until and candidate.lockout_until > now:
                remaining = int((candidate.lockout_until - now).total_seconds() / 60) + 1
                return Response({
                    'error': f'Аккаунт временно заблокирован. Повторите через {remaining} мин.',
                    'locked': True,
                    'lockout_until': candidate.lockout_until,
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        except User.DoesNotExist:
            candidate = None

        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            # Успешный вход — сбрасываем счётчик неудачных попыток
            user.failed_login_attempts = 0
            user.lockout_until = None
            user.save(update_fields=['failed_login_attempts', 'lockout_until'])

            # Если 2FA включена — отправляем OTP и не выдаём JWT
            if user.two_factor_enabled:
                try:
                    _send_otp(user, 'two_factor')
                except Exception as e:
                    return Response(
                        {'error': f'Не удалось отправить код 2FA: {str(e)}'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    )
                return Response({
                    'two_factor_required': True,
                    'email': user.email,
                    'message': 'Код подтверждения отправлен на ваш email.',
                }, status=status.HTTP_200_OK)

            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })

        # Ошибка входа — проверяем, не из-за неактивного аккаунта
        if candidate and not candidate.is_active:
            # Не увеличиваем счётчик для неподтверждённых аккаунтов
            return Response(
                {'error': 'Email не подтверждён. Проверьте почту и введите код.', 'unverified': True},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Увеличиваем счётчик неудачных попыток
        if candidate:
            candidate.failed_login_attempts += 1
            if candidate.failed_login_attempts >= LOGIN_MAX_ATTEMPTS:
                candidate.lockout_until = now + timedelta(minutes=LOGIN_LOCKOUT_MINUTES)
                candidate.failed_login_attempts = 0
            candidate.save(update_fields=['failed_login_attempts', 'lockout_until'])

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(APIView):
    """Запрос сброса пароля: отправляет OTP-код на email."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
            _send_otp(user, 'password_reset')
        except User.DoesNotExist:
            pass  # Не раскрываем наличие email в системе
        except Exception:
            return Response({'error': 'Не удалось отправить письмо.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'message': 'Если этот email зарегистрирован, на него отправлен код сброса пароля.'})


class PasswordResetConfirmView(APIView):
    """Подтверждение нового пароля: проверяет OTP + устанавливает новый пароль."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        code = serializer.validated_data['code']
        new_password = serializer.validated_data['new_password']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Пользователь не найден.'}, status=status.HTTP_404_NOT_FOUND)

        otp = _verify_otp(user, code, 'password_reset')
        if not otp:
            return Response({'error': 'Неверный или истёкший код.'}, status=status.HTTP_400_BAD_REQUEST)

        otp.is_used = True
        otp.save()

        # Пароль хешируется через PBKDF2-SHA256 (AbstractBaseUser.set_password)
        user.set_password(new_password)
        user.failed_login_attempts = 0
        user.lockout_until = None
        user.save()

        return Response({'message': 'Пароль успешно изменён. Войдите с новым паролем.'})


class LogoutView(APIView):
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'message': 'Успешный выход'}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'error': 'Неверный токен'}, status=status.HTTP_400_BAD_REQUEST)


class TwoFactorLoginVerifyView(APIView):
    """Верификация 2FA-кода при входе: проверяет OTP и возвращает JWT."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = TwoFactorVerifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        code = serializer.validated_data['code']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Пользователь не найден.'}, status=status.HTTP_404_NOT_FOUND)

        if not user.two_factor_enabled:
            return Response({'error': '2FA не включена для этого аккаунта.'}, status=status.HTTP_400_BAD_REQUEST)

        otp = _verify_otp(user, code, 'two_factor')
        if not otp:
            return Response({'error': 'Неверный или истёкший код.'}, status=status.HTTP_400_BAD_REQUEST)

        otp.is_used = True
        otp.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })


class TwoFactorRequestView(APIView):
    """Запрос на включение/выключение 2FA: отправляет письмо со ссылкой-подтверждением."""

    def post(self, request):
        action_type = request.data.get('action')
        if action_type not in ('enable', 'disable'):
            return Response({'error': 'Укажите action: enable или disable.'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user

        if action_type == 'enable' and user.two_factor_enabled:
            return Response({'message': '2FA уже включена.'})
        if action_type == 'disable' and not user.two_factor_enabled:
            return Response({'message': '2FA уже выключена.'})

        # Генерируем токен подтверждения (64 символа)
        confirm_token = secrets.token_hex(32)
        user.two_factor_action_token = confirm_token
        user.two_factor_action = action_type
        user.two_factor_action_expires_at = timezone.now() + timedelta(minutes=TWO_FACTOR_ACTION_EXPIRY_MINUTES)
        user.save(update_fields=['two_factor_action_token', 'two_factor_action', 'two_factor_action_expires_at'])

        confirm_url = request.build_absolute_uri(
            f'/api/auth/2fa/confirm-link/?token={confirm_token}&action={action_type}'
        )
        action_label = 'включения' if action_type == 'enable' else 'отключения'
        subject = f'ФураЕдет — подтверждение {action_label} 2FA'
        body = (
            f'Здравствуйте, {user.name}!\n\n'
            f'Для подтверждения {action_label} двухфакторной аутентификации '
            f'перейдите по ссылке:\n\n'
            f'{confirm_url}\n\n'
            f'Ссылка действительна {TWO_FACTOR_ACTION_EXPIRY_MINUTES} минут.\n'
            f'Если вы не делали этот запрос — проигнорируйте письмо.'
        )
        try:
            send_mail(subject=subject, message=body, from_email=None,
                      recipient_list=[user.email], fail_silently=False)
        except Exception as e:
            return Response({'error': f'Не удалось отправить письмо: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'message': f'Письмо со ссылкой подтверждения отправлено на {user.email}.',
        })


class TwoFactorConfirmView(APIView):
    """Подтверждение включения/выключения 2FA по токену из письма."""

    def post(self, request):
        token = request.data.get('token', '').strip()
        action_type = request.data.get('action', '').strip()

        if not token or action_type not in ('enable', 'disable'):
            return Response({'error': 'Укажите token и action (enable/disable).'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        now = timezone.now()

        if (user.two_factor_action_token != token
                or user.two_factor_action != action_type
                or not user.two_factor_action_expires_at
                or user.two_factor_action_expires_at < now):
            return Response(
                {'error': 'Неверный или истёкший токен. Запросите подтверждение повторно.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.two_factor_enabled = (action_type == 'enable')
        user.two_factor_action_token = None
        user.two_factor_action = None
        user.two_factor_action_expires_at = None
        user.save(update_fields=['two_factor_enabled', 'two_factor_action_token', 'two_factor_action', 'two_factor_action_expires_at'])

        if action_type == 'enable':
            return Response({'message': '2FA успешно включена. Теперь при каждом входе вам будет отправляться код.'})
        return Response({'message': '2FA успешно отключена.'})


class TwoFactorConfirmLinkView(APIView):
    """Подтверждение включения/выключения 2FA по ссылке из письма (без авторизации).
    GET /api/auth/2fa/confirm-link/?token=xxx&action=enable
    После обработки перенаправляет на /dashboard?2fa_confirmed=enable (или 2fa_error=...).
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        token_val = request.query_params.get('token', '').strip()
        action_type = request.query_params.get('action', '').strip()

        if not token_val or action_type not in ('enable', 'disable'):
            return redirect('/dashboard?2fa_error=invalid')

        now = timezone.now()
        try:
            user = User.objects.get(
                two_factor_action_token=token_val,
                two_factor_action=action_type,
            )
        except User.DoesNotExist:
            return redirect('/dashboard?2fa_error=invalid')

        if not user.two_factor_action_expires_at or user.two_factor_action_expires_at < now:
            return redirect('/dashboard?2fa_error=expired')

        user.two_factor_enabled = (action_type == 'enable')
        user.two_factor_action_token = None
        user.two_factor_action = None
        user.two_factor_action_expires_at = None
        user.save(update_fields=[
            'two_factor_enabled', 'two_factor_action_token',
            'two_factor_action', 'two_factor_action_expires_at',
        ])

        return redirect(f'/dashboard?2fa_confirmed={action_type}')


class CurrentUserView(APIView):
    def get(self, request):
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data)
    
    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request):
        data = request.data.copy()
        # Смена пароля: требуем текущий пароль и новый (два раза проверяется на фронте)
        new_password = data.pop('new_password', None) or data.pop('password', None)
        old_password = data.pop('old_password', None)
        if new_password is not None:
            if not old_password:
                return Response(
                    {'old_password': ['Укажите текущий пароль']},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if not request.user.check_password(old_password):
                return Response(
                    {'old_password': ['Неверный текущий пароль']},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if len(new_password) < 6:
                return Response(
                    {'new_password': ['Пароль должен быть минимум 6 символов']},
                    status=status.HTTP_400_BAD_REQUEST
                )
            request.user.set_password(new_password)
            request.user.save()
        serializer = UserSerializer(request.user, data=data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsManagerOrAdmin]

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return User.objects.all()
        elif self.request.user.role == 'manager':
            return User.objects.filter(role='client')
        return User.objects.filter(id=self.request.user.id)

    @action(detail=True, methods=['post', 'patch'], permission_classes=[IsAdmin])
    def change_role(self, request, pk=None):
        user = self.get_object()
        new_role = request.data.get('role')
        if new_role not in ['client', 'manager', 'admin']:
            return Response({'error': 'Неверная роль'}, status=status.HTTP_400_BAD_REQUEST)
        user.role = new_role
        if new_role == 'admin':
            user.is_staff = True
        user.save()
        return Response(UserSerializer(user).data)


class DriverViewSet(viewsets.ModelViewSet):
    queryset = Driver.objects.all()
    serializer_class = DriverSerializer
    permission_classes = [IsManagerOrAdmin]

    def destroy(self, request, *args, **kwargs):
        driver = self.get_object()
        if driver.trucks.filter(status='in_transit').exists():
            return Response(
                {'error': 'Нельзя удалить водителя, который находится в рейсе'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)


class TruckViewSet(viewsets.ModelViewSet):
    queryset = Truck.objects.all()
    serializer_class = TruckSerializer
    permission_classes = [IsManagerOrAdmin]

    def get_queryset(self):
        queryset = Truck.objects.all()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    def perform_update(self, serializer):
        instance = serializer.save()
        # Один водитель — одна машина: снять его с других машин
        if instance.driver_id:
            Truck.objects.filter(driver_id=instance.driver_id).exclude(pk=instance.pk).update(driver_id=None)


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        elif self.action in ['retrieve']:
            return OrderDetailSerializer
        return OrderListSerializer

    def get_queryset(self):
        queryset = Order.objects.all()
        user = self.request.user

        if user.role == 'client':
            queryset = queryset.filter(client=user)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        tracking_id = self.request.query_params.get('tracking_id')
        if tracking_id:
            queryset = queryset.filter(tracking_id=tracking_id)

        return queryset.order_by('-created_at')

    @action(detail=True, methods=['post'], permission_classes=[IsManagerOrAdmin])
    def accept(self, request, pk=None):
        order = self.get_object()
        if order.status != 'pending':
            return Response({'error': 'Заказ уже обработан'}, status=status.HTTP_400_BAD_REQUEST)
        
        order.status = 'in_progress'
        order.manager = request.user
        order.save()
        serializer = OrderDetailSerializer(order, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsManagerOrAdmin])
    def reject(self, request, pk=None):
        order = self.get_object()
        if order.status != 'pending':
            return Response({'error': 'Заказ уже обработан'}, status=status.HTTP_400_BAD_REQUEST)
        
        rejection_reason = request.data.get('rejection_reason')
        if not rejection_reason:
            return Response({'error': 'Укажите причину отклонения'}, status=status.HTTP_400_BAD_REQUEST)
        
        order.status = 'rejected'
        order.rejection_reason = rejection_reason
        order.manager = request.user
        order.save()
        serializer = OrderDetailSerializer(order, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsManagerOrAdmin])
    def assign_transport(self, request, pk=None):
        order = self.get_object()
        truck_id = request.data.get('truck_id')
        driver_id = request.data.get('driver_id')

        if not truck_id or not driver_id:
            return Response({'error': 'Укажите транспорт и водителя'}, status=status.HTTP_400_BAD_REQUEST)

        truck = get_object_or_404(Truck, id=truck_id)
        driver = get_object_or_404(Driver, id=driver_id)

        if truck.status != 'available':
            return Response({'error': 'Транспорт недоступен'}, status=status.HTTP_400_BAD_REQUEST)

        if not driver.is_available:
            return Response({'error': 'Водитель недоступен'}, status=status.HTTP_400_BAD_REQUEST)

        order.truck = truck
        order.driver = driver
        order.status = 'shipped'
        order.save()

        truck.status = 'in_transit'
        truck.driver = driver
        truck.save()

        driver.is_available = False
        driver.save()

        return Response(OrderDetailSerializer(order).data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def track_order(request, tracking_id):
    try:
        order = Order.objects.get(tracking_id=tracking_id)
        serializer = OrderDetailSerializer(order)
        return Response(serializer.data)
    except Order.DoesNotExist:
        return Response({'error': 'Заказ не найден'}, status=status.HTTP_404_NOT_FOUND)


class FavoriteAddrViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteAddrSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FavoriteAddr.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TariffViewSet(viewsets.ModelViewSet):
    queryset = Tariff.objects.filter(is_active=True)
    serializer_class = TariffSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdmin()]


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def calculate_price(request):
    serializer = CalculatorSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    origin = serializer.validated_data['origin']
    destination = serializer.validated_data['destination']
    weight = serializer.validated_data['weight']
    volume = serializer.validated_data['volume']

    yandex_service = YandexMapsService()
    distance = yandex_service.calculate_distance(origin, destination)

    if not distance:
        distance = 500

    try:
        tariff = Tariff.objects.filter(is_active=True).first()
        if not tariff:
            # Пустая БД: используем значения по умолчанию, чтобы калькулятор работал
            price_per_km = 50.0
            weight_coef = 1.0
            tariff_name = 'По умолчанию (добавьте тариф в админке)'
        else:
            price_per_km = float(tariff.price_per_km)
            weight_coef = float(tariff.weight_coef)
            tariff_name = tariff.name

        price = (distance * price_per_km) + (weight * weight_coef)

        return Response({
            'price': round(price, 2),
            'distance_km': distance,
            'tariff_name': tariff_name,
            'estimated_delivery_days': max(1, int(distance / 500))
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsManagerOrAdmin])
def calculate_route(request):
    serializer = RouteCalculationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    points = serializer.validated_data['points']
    yandex_service = YandexMapsService()
    route_data = yandex_service.calculate_route(points)

    if not route_data:
        return Response({'error': 'Не удалось построить маршрут'}, status=status.HTTP_400_BAD_REQUEST)

    return Response(route_data)


@api_view(['POST'])
@permission_classes([IsManagerOrAdmin])
def ai_optimize(request):
    trucks_data = request.data.get('trucks', [])
    orders_data = request.data.get('orders', [])
    custom_prompt = request.data.get('prompt', '')

    if not trucks_data or not orders_data:
        return Response({'error': 'Укажите данные о транспорте и заказах'}, status=status.HTTP_400_BAD_REQUEST)

    # Используем AIService с GigaChat (российский AI от Сбера)
    ai_service = AIService()
    recommendation = ai_service.optimize_load(trucks_data, orders_data, custom_prompt)

    ai_request = AIRequest.objects.create(
        manager=request.user,
        request_text=f"Транспорт: {len(trucks_data)}, Заказы: {len(orders_data)}",
        response_text=recommendation
    )

    return Response({
        'recommendation': recommendation,
        'request_id': ai_request.id
    })


@api_view(['GET'])
@permission_classes([IsManagerOrAdmin])
def ai_history(request):
    history = AIRequest.objects.filter(manager=request.user)[:10]
    serializer = AIRequestSerializer(history, many=True)
    return Response(serializer.data)


@csrf_exempt
def test_api_view(request):
    return render(request, 'test_api.html')
