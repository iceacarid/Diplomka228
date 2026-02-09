from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404, render
from django.views.decorators.csrf import csrf_exempt
from .models import User, Driver, Truck, Order, FavoriteAddr, Tariff, AIRequest
from .serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer,
    DriverSerializer, TruckSerializer, OrderListSerializer, OrderDetailSerializer, OrderCreateSerializer,
    FavoriteAddrSerializer, TariffSerializer, AIRequestSerializer,
    CalculatorSerializer, RouteCalculationSerializer
)
from .permissions import IsClient, IsManager, IsAdmin, IsManagerOrAdmin, IsOwnerOrManagerOrAdmin
from .services import AIService, YandexMapsService


def index_view(request):
    return render(request, 'index.html')


def login_view(request):
    return render(request, 'login.html')


def register_view(request):
    return render(request, 'register.html')


def dashboard_view(request):
    return render(request, 'dashboard.html')


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
            return Response({'error': 'Тариф не найден'}, status=status.HTTP_404_NOT_FOUND)

        price = (distance * float(tariff.price_per_km)) + (weight * float(tariff.weight_coef))

        return Response({
            'price': round(price, 2),
            'distance_km': distance,
            'tariff_name': tariff.name,
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
