# ФураЕдет - Система грузоперевозок

## ✅ Выполненная работа

Создана полноценная backend система согласно ТЗ с использованием Django REST Framework.

## 📦 Установленные компоненты

### Backend (Django)

- Django 6.0.1
- Django REST Framework 3.16.1
- PostgreSQL (psycopg2-binary 2.9.11)
- JWT Authentication (djangorestframework-simplejwt 5.3.1)
- CORS Headers (django-cors-headers 4.9.0)
- Google Gemini AI (google-generativeai 0.3.2)
- Celery 5.3.6
- Redis 5.0.1
- Requests 2.31.0
- Python-dotenv 1.0.0

## 🗄️ Структура базы данных

Реализованы все модели согласно ТЗ:

### User (Пользователь)
- email (PK, уникальный)
- name, phone
- role: client/manager/admin
- password_hash
- is_active, is_staff
- created_at

### Order (Заказ)
- tracking_id (FE-XXXXXX, автогенерация)
- client, manager, truck, driver (FK)
- status: draft/pending/in_progress/shipped/delivered/rejected
- origin_address, dest_address
- weight, volume, price
- eta, rejection_reason
- created_at

### Truck (Транспорт)
- plate_number (уникальный)
- brand, model
- capacity_weight, capacity_volume
- status: available/in_transit/maintenance
- driver (FK)
- created_at

### Driver (Водитель)
- name, phone, license_number
- type: staff/hired
- personal_car, insurance_num (для наёмных)
- is_available
- created_at

### FavoriteAddr (Избранные адреса)
- user (FK)
- title, address
- lat, lng (геокоординаты)
- created_at

### Tariff (Тариф)
- name
- price_per_km, weight_coef
- is_active
- created_at

### AIRequest (AI запросы)
- manager (FK)
- request_text, response_text
- created_at

## 🔌 API Endpoints

Реализованы все endpoints согласно ТЗ:

### Аутентификация (JWT)
- `POST /api/auth/register/` - Регистрация
- `POST /api/auth/login/` - Вход (возвращает access и refresh токены)
- `POST /api/auth/logout/` - Выход
- `GET /api/auth/me/` - Текущий пользователь
- `POST /api/auth/refresh/` - Обновление токена

### Заказы
- `GET /api/orders/` - Список (фильтры по роли)
- `POST /api/orders/` - Создать
- `GET /api/orders/{id}/` - Детали
- `PATCH /api/orders/{id}/` - Обновить
- `POST /api/orders/{id}/accept/` - Принять (менеджер)
- `POST /api/orders/{id}/reject/` - Отклонить с причиной (менеджер)
- `POST /api/orders/{id}/assign_transport/` - Назначить транспорт и водителя
- `GET /api/orders/track/{tracking_id}/` - Публичный трекинг (без авторизации)

### Транспорт
- `GET /api/trucks/` - Список
- `POST /api/trucks/` - Добавить
- `GET /api/trucks/{id}/` - Детали
- `PATCH /api/trucks/{id}/` - Обновить
- `DELETE /api/trucks/{id}/` - Удалить

### Водители
- `GET /api/drivers/` - Список
- `POST /api/drivers/` - Добавить
- `GET /api/drivers/{id}/` - Детали
- `PATCH /api/drivers/{id}/` - Обновить
- `DELETE /api/drivers/{id}/` - Удалить

### Избранные адреса
- `GET /api/addresses/` - Список (только свои)
- `POST /api/addresses/` - Добавить
- `GET /api/addresses/{id}/` - Детали
- `PATCH /api/addresses/{id}/` - Обновить
- `DELETE /api/addresses/{id}/` - Удалить

### Калькулятор и маршруты
- `POST /api/calculator/` - Расчёт стоимости (публичный)
  - Формула: `(Расстояние × Тариф_за_км) + (Вес × Коэфф_веса)`
  - Интеграция с Yandex Maps для расчёта расстояния
  
- `POST /api/routes/calculate/` - Расчёт маршрута (менеджер)
  - Построение маршрута через Yandex Maps
  - Расчёт ETA: `Время_в_пути + (Кол-во_точек × 3ч)`

### AI-ассистент (Google Gemini)
- `POST /api/ai/optimize/` - Оптимизация загрузки (менеджер)
- `GET /api/ai/history/` - История запросов (менеджер)

### Админ
- `GET /api/users/` - Список пользователей (менеджер/админ)
- `PATCH /api/users/{id}/change_role/` - Изменить роль (админ)
- `GET /api/tariffs/` - Тарифы (публичный для чтения)
- `POST /api/tariffs/` - Создать тариф (админ)
- `PATCH /api/tariffs/{id}/` - Обновить тариф (админ)

## 🔐 Система прав доступа

Реализованы permissions согласно ТЗ:

- **IsClient** - только клиенты
- **IsManager** - только менеджеры
- **IsAdmin** - только администраторы
- **IsManagerOrAdmin** - менеджеры и админы
- **IsOwnerOrManagerOrAdmin** - владелец ресурса или менеджер/админ

## 🎨 Валидация

- **Водители**: Для наёмных обязательны поля `personal_car` и `insurance_num`
- **Заказы**: Нельзя принять/отклонить уже обработанный заказ
- **Транспорт**: Проверка доступности при назначении на заказ
- **Пароли**: Минимум 6 символов при регистрации
- **Email**: Уникальность и валидация формата

## 🚀 Интеграции

### Google Gemini API ✅ ОБНОВЛЕНО (02.2026)
- Класс `GeminiService` в `logistics/services.py`
- **Модель**: `gemini-2.0-flash` (новейшая версия 2026)
- **Библиотека**: `google-genai` 1.61.0 (новый официальный пакет)
- Оптимизация распределения грузов по транспорту с учётом:
  - Грузоподъёмности и объёма
  - Направлений доставки
  - Экономии топлива и рейсов
- История AI-запросов в базе данных
- Улучшенная обработка ошибок и fallback-режим
- Подробные рекомендации с обоснованием

### Yandex Maps API ✅ ОБНОВЛЕНО
- Класс `YandexMapsService` в `logistics/services.py`
- **Endpoints**: Geocoder API + Router API (актуальные 2026)
- Геокодирование адресов (получение координат)
- Расчёт расстояния между точками
- Построение мультиточечных маршрутов для грузовиков
- Расчёт ETA с учётом разгрузки (3 часа на точку)
- Fallback-режим при отсутствии API ключа
- Полная обработка ошибок и таймаутов

### 📝 Настройка интеграций

См. подробную инструкцию: **server/INTEGRATIONS.md**

Для тестирования запустите:
```bash
cd server
python test_integrations.py
```

## 📋 Тестовые данные

Созданы пользователи:
- **admin@fura.ru** / admin123 (Администратор)
- **manager@fura.ru** / manager123 (Менеджер)
- **client@fura.ru** / client123 (Клиент)

Создан тариф:
- **Стандартный**: 15₽/км, коэфф. веса 2.50

## 🎯 Особенности реализации

1. **Автогенерация Tracking ID** в формате FE-XXXXXX для каждого заказа
2. **Soft Delete** для транспорта (можно легко добавить)
3. **Полная валидация** всех входных данных
4. **JWT с refresh токенами** и blacklist при выходе
5. **Фильтрация заказов по роли**:
   - Клиент видит только свои
   - Менеджер видит pending/in_progress/shipped
   - Админ видит все
6. **CORS настроен** для фронтенда на localhost:5173
7. **Русская локализация** интерфейса
8. **Django Admin** полностью настроен для всех моделей

## 📊 Статусы

### Заказы
- draft - Черновик
- pending - На рассмотрении
- in_progress - В работе
- shipped - В пути
- delivered - Доставлено
- rejected - Отклонено

### Транспорт
- available - Свободен
- in_transit - В рейсе
- maintenance - На ремонте

### Водители
- staff - Штатный
- hired - Наёмный

## 🛠️ Запуск проекта

### 1. Активация виртуального окружения

```powershell
cd server
.\venv\Scripts\Activate.ps1
```

### 2. Запуск сервера

```powershell
python manage.py runserver
```

Сервер доступен: **http://127.0.0.1:8000**

### 3. Админ-панель

**http://127.0.0.1:8000/admin/**

Логин: admin@fura.ru  
Пароль: admin123

## 📝 Дополнительные скрипты

- `create_test_data.py` - Создание тестовых пользователей и тарифа
- `manage.py` - Стандартный Django management

## ✅ Соответствие ТЗ

| Требование | Статус |
|-----------|--------|
| Модели данных (User, Order, Truck, Driver, etc.) | ✅ |
| JWT аутентификация | ✅ |
| Роли и права доступа | ✅ |
| API endpoints (все из ТЗ) | ✅ |
| Калькулятор стоимости | ✅ |
| Публичный трекинг | ✅ |
| Управление заказами (принять/отклонить) | ✅ |
| Назначение транспорта и водителя | ✅ |
| Валидация наёмных водителей | ✅ |
| Google Gemini интеграция | ✅ |
| Yandex Maps интеграция | ✅ |
| Избранные адреса | ✅ |
| Тарифы | ✅ |
| AI запросы (история) | ✅ |
| Django Admin панель | ✅ |
| CORS для фронтенда | ✅ |

## 🔜 Готово к интеграции

Backend полностью готов к подключению фронтенда. Все endpoints работают и задокументированы.

### Настройка внешних API (опционально)

Для полной функциональности AI и карт:

1. **Скопируйте шаблон .env:**
   ```bash
   cd server
   cp env.example .env
   ```

2. **Добавьте API ключи в .env:**
   - `GEMINI_API_KEY` - для AI-ассистента (https://makersuite.google.com/app/apikey)
   - `YANDEX_MAPS_API_KEY` - для карт и маршрутов (https://developer.tech.yandex.ru/)

3. **Запустите тесты:**
   ```bash
   python test_integrations.py
   ```

**Без API ключей система работает с fallback-значениями:**
- Калькулятор: используется примерное расстояние 500 км
- AI-ассистент: показывает инструкции по настройке
- Все остальные функции работают полностью
