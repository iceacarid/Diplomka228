# ФураЕдет - Система управления грузоперевозками

Информационная система для автоматизации процессов расчета стоимости, распределения грузов и управления автопарком с использованием искусственного интеллекта.

## 🚀 Технологический стек

### Backend
- **Python 3.14**
- **Django 6.0.1**
- **Django Rest Framework (DRF)**
- **PostgreSQL** (база данных `fura_db`)
- **Google Gemini API** (AI-ассистент)

### Frontend (будет добавлен позже)
- React + Vite + TypeScript
- Tailwind CSS
- Yandex Maps API

## 📁 Структура проекта

```
FuraEdet_Diploma/
├── server/          # Django backend
│   ├── core/       # Настройки Django
│   ├── logistics/  # Приложение логистики
│   └── manage.py
└── client/         # React frontend (будет добавлен)
```

## 🛠️ Установка и запуск

### Требования
- Python 3.14+
- PostgreSQL
- Node.js 18+ (для frontend, позже)

### Backend

1. **Перейдите в папку server:**
```bash
cd server
```

2. **Создайте виртуальное окружение:**
```bash
python -m venv venv
```

3. **Активируйте виртуальное окружение:**
```bash
# Windows
.\venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

4. **Установите зависимости:**
```bash
pip install -r requirements.txt
```

5. **Настройте базу данных:**
   - Создайте базу данных PostgreSQL `fura_db`
   - Обновите настройки в `server/core/settings.py`:
     ```python
     DATABASES = {
         'default': {
             'ENGINE': 'django.db.backends.postgresql',
             'NAME': 'fura_db',
             'USER': 'postgres',
             'PASSWORD': 'ваш_пароль',
             'HOST': 'localhost',
             'PORT': '5432',
         }
     }
     ```

6. **Примените миграции:**
```bash
python manage.py migrate
```

7. **Создайте суперпользователя:**
```bash
python manage.py createsuperuser
```

8. **Запустите сервер:**
```bash
python manage.py runserver
```

Сервер будет доступен на `http://127.0.0.1:8000/`

## 📊 Модели данных

### User (Пользователь)
- Кастомная модель пользователя с ролями: `client`, `manager`, `admin`

### Order (Заказ)
- Заказы клиентов с маршрутом, весом, объемом, статусом

### Truck (Транспорт)
- Автопарк с характеристиками грузоподъемности

### Driver (Водитель)
- Водители (штатные/наемные) с документами

### Tariff (Тариф)
- Тарифы для расчета стоимости

### AIRequest (AI запросы)
- История запросов к Gemini API

## 🔐 Админ-панель

Доступна по адресу: `http://127.0.0.1:8000/admin/`

Логин: `admin` (или созданный суперпользователь)
Пароль: `admin` (или установленный при создании)

## 📝 API Endpoints

API будет добавлено позже с использованием DRF.

## 🧪 Разработка

### Применение миграций после изменения моделей:
```bash
python manage.py makemigrations
python manage.py migrate
```

### Запуск тестов:
```bash
python manage.py test
```

## 📄 Лицензия

Дипломный проект

## 👤 Автор

FuraEdet Team
