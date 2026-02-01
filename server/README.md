# Backend ФураЕдет (FuraEdet)

Серверная часть системы грузоперевозок на Django + DRF.

## Стек технологий

- Python 3.12+
- Django 6.x
- Django REST Framework 3.x
- PostgreSQL 16.x
- JWT Authentication
- Google Gemini API
- Yandex Maps API
- Celery + Redis

## Установка и запуск

### 1. Создание виртуального окружения

```powershell
cd server
py -3.14 -m venv venv
.\venv\Scripts\Activate.ps1
```

### 2. Установка зависимостей

```powershell
pip install -r requirements.txt
```

### 3. Настройка базы данных

Убедитесь, что PostgreSQL запущен и создана база данных `fura_db`:

```sql
CREATE DATABASE fura_db;
```

### 4. Настройка переменных окружения

Создайте файл `.env` в папке `server`:

```env
DEBUG=True
SECRET_KEY=your-secret-key

DB_NAME=fura_db
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

GEMINI_API_KEY=your-gemini-api-key
YANDEX_MAPS_API_KEY=your-yandex-maps-api-key
```

### 5. Применение миграций

```powershell
python manage.py migrate
```

### 6. Создание тестовых данных

```powershell
python create_test_data.py
```

Будут созданы пользователи:
- **Администратор**: admin@fura.ru / admin123
- **Менеджер**: manager@fura.ru / manager123
- **Клиент**: client@fura.ru / client123

### 7. Запуск сервера

```powershell
python manage.py runserver
```

Сервер будет доступен по адресу: `http://127.0.0.1:8000`

## API Endpoints

### Аутентификация

- `POST /api/auth/register/` - Регистрация
- `POST /api/auth/login/` - Вход
- `POST /api/auth/logout/` - Выход
- `GET /api/auth/me/` - Текущий пользователь
- `POST /api/auth/refresh/` - Обновление токена

### Заказы

- `GET /api/orders/` - Список заказов
- `POST /api/orders/` - Создать заказ
- `GET /api/orders/{id}/` - Детали заказа
- `PATCH /api/orders/{id}/` - Обновить заказ
- `POST /api/orders/{id}/accept/` - Принять заказ (менеджер)
- `POST /api/orders/{id}/reject/` - Отклонить заказ (менеджер)
- `POST /api/orders/{id}/assign_transport/` - Назначить транспорт
- `GET /api/orders/track/{tracking_id}/` - Публичный трекинг

### Транспорт

- `GET /api/trucks/` - Список транспорта
- `POST /api/trucks/` - Добавить транспорт
- `GET /api/trucks/{id}/` - Детали транспорта
- `PATCH /api/trucks/{id}/` - Обновить транспорт
- `DELETE /api/trucks/{id}/` - Удалить транспорт

### Водители

- `GET /api/drivers/` - Список водителей
- `POST /api/drivers/` - Добавить водителя
- `GET /api/drivers/{id}/` - Детали водителя
- `PATCH /api/drivers/{id}/` - Обновить водителя
- `DELETE /api/drivers/{id}/` - Удалить водителя

### Калькулятор и маршруты

- `POST /api/calculator/` - Расчёт стоимости перевозки
- `POST /api/routes/calculate/` - Расчёт маршрута

### AI-ассистент

- `POST /api/ai/optimize/` - Оптимизация загрузки (Gemini)
- `GET /api/ai/history/` - История AI запросов

### Админ

- `GET /api/users/` - Список пользователей
- `PATCH /api/users/{id}/change_role/` - Изменить роль
- `GET /api/tariffs/` - Тарифы
- `POST /api/tariffs/` - Создать тариф
- `PATCH /api/tariffs/{id}/` - Обновить тариф

## Структура проекта

```
server/
├── core/                   # Настройки Django
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── logistics/              # Приложение логистики
│   ├── models.py          # Модели БД
│   ├── serializers.py     # DRF сериализаторы
│   ├── views.py           # API views
│   ├── urls.py            # Маршруты API
│   ├── permissions.py     # Права доступа
│   ├── services.py        # Внешние сервисы (Gemini, Yandex Maps)
│   └── admin.py           # Django admin
├── manage.py
├── requirements.txt
└── create_test_data.py    # Скрипт создания тестовых данных
```

## Модели

### User
- email (PK, username field)
- name
- phone
- role (client/manager/admin)
- password_hash
- created_at
- is_active

### Order
- tracking_id (FE-XXXXXX)
- client (FK User)
- manager (FK User)
- truck (FK Truck)
- driver (FK Driver)
- status (draft/pending/in_progress/shipped/delivered/rejected)
- origin_address
- dest_address
- weight, volume
- price
- eta
- rejection_reason
- created_at

### Truck
- plate_number
- brand, model
- capacity_weight, capacity_volume
- status (available/in_transit/maintenance)
- driver (FK Driver)
- created_at

### Driver
- name
- phone
- license_number
- type (staff/hired)
- personal_car (для наёмных)
- insurance_num (для наёмных)
- is_available
- created_at

### FavoriteAddr
- user (FK User)
- title
- address
- lat, lng
- created_at

### Tariff
- name
- price_per_km
- weight_coef
- is_active
- created_at

### AIRequest
- manager (FK User)
- request_text
- response_text
- created_at

## Права доступа

- **Гость**: калькулятор, трекинг
- **Клиент**: свои заказы, избранные адреса
- **Менеджер**: управление заказами, транспортом, водителями, AI-ассистент
- **Админ**: полный доступ, управление пользователями и тарифами

## Разработка

### Создание новых миграций

```powershell
python manage.py makemigrations
python manage.py migrate
```

### Доступ к админ-панели

http://127.0.0.1:8000/admin/

Используйте учётные данные администратора.

## Решение проблем

### Ошибка подключения к БД

Проверьте:
1. PostgreSQL запущен
2. База данных `fura_db` создана
3. Параметры подключения в `settings.py` или `.env`

### Ошибки с protobuf

```powershell
pip install protobuf==3.20.3 --force-reinstall
```

### Статические файлы

Создайте папку `static` если возникают предупреждения:

```powershell
mkdir static
```
