# Промпты для Cursor - Разработка Backend

## 📝 Инструкция по использованию

Копируйте промпты по порядку в Cursor и выполняйте их последовательно. После выполнения каждого промпта проверяйте результат перед переходом к следующему.

---

## ПРОМПТ 1: Настройка Django проекта

```
Создай Django проект для системы управления грузоперевозками "ФураЕдет".

Требования:
1. Создай проект Django в папке server/
2. Название проекта: "core"
3. Настрой PostgreSQL базу данных (база: fura_db, пользователь: postgres, пароль: 1234, хост: localhost, порт: 5432)
4. Установи и настрой Django Rest Framework
5. Установи и настрой django-cors-headers для работы с frontend
6. Установи djangorestframework-simplejwt для JWT токенов
7. Создай приложение "users" для работы с пользователями
8. Настрой TIME_ZONE = 'Europe/Moscow' и LANGUAGE_CODE = 'ru-RU'
9. Создай requirements.txt с зависимостями: Django, djangorestframework, django-cors-headers, psycopg2-binary, djangorestframework-simplejwt

Структура должна быть:
server/
├── core/
│   ├── settings.py
│   ├── urls.py
│   └── ...
├── users/
│   ├── __init__.py
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── urls.py
│   └── apps.py
├── manage.py
└── requirements.txt

После создания проверь, что проект запускается командой: python manage.py runserver
```

---

## ПРОМПТ 2: Модель пользователя

```
Создай кастомную модель пользователя для приложения users в Django проекте.

Требования к модели User:
1. Наследуйся от AbstractUser
2. Добавь поля:
   - phone (CharField, max_length=20, уникальный, может быть пустым)
   - role (CharField, choices: 'client', 'manager', 'admin', по умолчанию 'client')
   - created_at (DateTimeField, auto_now_add=True)
   - updated_at (DateTimeField, auto_now=True)
3. В settings.py укажи AUTH_USER_MODEL = 'users.User'
4. Создай миграции: python manage.py makemigrations
5. Примени миграции: python manage.py migrate
6. Зарегистрируй модель в admin.py для управления через админ-панель

Модель должна быть в файле users/models.py
```

---

## ПРОМПТ 3: API регистрации

```
Создай API endpoint для регистрации пользователей в Django Rest Framework.

Требования:
1. Создай сериализатор RegisterSerializer в users/serializers.py:
   - Поля: username, email, password, password_confirm, phone, role (опционально)
   - Валидация: пароли должны совпадать, email должен быть уникальным
   - Метод create должен создавать пользователя с хешированным паролем

2. Создай ViewSet RegisterViewSet в users/views.py:
   - Метод POST для регистрации
   - Возвращает JWT токены после успешной регистрации
   - Возвращает статус 201 при успехе, 400 при ошибках валидации

3. Добавь маршрут в users/urls.py:
   - Путь: /api/users/register/
   - Метод: POST

4. Подключи users/urls.py в core/urls.py

5. Настрой JWT в settings.py:
   - Добавь 'rest_framework_simplejwt' в INSTALLED_APPS
   - Настрой REST_FRAMEWORK для использования JWT
   - Добавь SIMPLE_JWT настройки (время жизни токена: 1 день)

Тестирование: должен работать POST запрос на /api/users/register/ с данными:
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "testpass123",
  "password_confirm": "testpass123",
  "phone": "+79991234567"
}
```

---

## ПРОМПТ 4: API авторизации

```
Создай API endpoint для авторизации (логина) пользователей в Django Rest Framework.

Требования:
1. Создай сериализатор LoginSerializer в users/serializers.py:
   - Поля: username (или email), password
   - Валидация: проверка существования пользователя и правильности пароля

2. Создай ViewSet LoginViewSet в users/views.py:
   - Метод POST для авторизации
   - При успешной авторизации возвращает JWT токены (access и refresh)
   - Возвращает статус 200 при успехе, 401 при неверных данных

3. Добавь маршрут в users/urls.py:
   - Путь: /api/users/login/
   - Метод: POST

4. Создай также endpoint для обновления токена:
   - Путь: /api/users/token/refresh/
   - Используй стандартный TokenRefreshView из djangorestframework-simplejwt

Тестирование: должен работать POST запрос на /api/users/login/ с данными:
{
  "username": "testuser",
  "password": "testpass123"
}

Ответ должен содержать:
{
  "access": "jwt_token_here",
  "refresh": "refresh_token_here"
}
```

---

## ПРОМПТ 5: HTML страницы регистрации и авторизации

```
Создай HTML страницы для регистрации и авторизации (чистый HTML/CSS/JavaScript, без фреймворков).

Требования:

1. Создай папку templates/auth/ в корне server/

2. Страница регистрации (templates/auth/register.html):
   - Форма с полями: username, email, password, password_confirm, phone
   - Валидация на клиенте (пароли должны совпадать, email формат)
   - Кнопка "Зарегистрироваться"
   - Ссылка "Уже есть аккаунт? Войти"
   - При отправке формы делай POST запрос на /api/users/register/
   - При успехе сохрани JWT токен в localStorage и перенаправь на /dashboard/
   - При ошибке покажи сообщение об ошибке

3. Страница авторизации (templates/auth/login.html):
   - Форма с полями: username, password
   - Кнопка "Войти"
   - Ссылка "Нет аккаунта? Зарегистрироваться"
   - При отправке формы делай POST запрос на /api/users/login/
   - При успехе сохрани JWT токен в localStorage и перенаправь на /dashboard/
   - При ошибке покажи сообщение об ошибке

4. Создай базовый CSS стиль (можно inline или отдельный файл):
   - Современный дизайн
   - Центрированные формы
   - Красивые кнопки и поля ввода
   - Цветовая схема: темно-синий (#0D1B2A) и золотистый (#F7B500)

5. Добавь Django views для отображения HTML:
   - RegisterView в users/views.py (возвращает register.html)
   - LoginView в users/views.py (возвращает login.html)
   - Добавь маршруты в users/urls.py: /register/ и /login/

6. Настрой Django для работы с шаблонами в settings.py:
   - Добавь 'DIRS': [BASE_DIR / 'templates'] в TEMPLATES

Страницы должны быть полностью функциональными и красивыми.
```

---

## ПРОМПТ 6: Главная страница после авторизации

```
Создай главную страницу (dashboard) для авторизованных пользователей.

Требования:

1. Создай папку templates/dashboard/ в корне server/

2. Страница dashboard (templates/dashboard/index.html):
   - Проверка наличия JWT токена в localStorage
   - Если токена нет - перенаправь на /login/
   - Заголовок с информацией о пользователе (получи через API)
   - Кнопка "Выйти" (очищает localStorage и перенаправляет на /login/)
   - Базовая структура для будущего функционала:
     * Блок "Мои заказы" (пока заглушка)
     * Блок "Статистика" (пока заглушка)
     * Блок "Быстрые действия" (пока заглушка)

3. Создай API endpoint для получения информации о текущем пользователе:
   - Путь: /api/users/me/
   - Метод: GET
   - Требует JWT токен в заголовке Authorization: Bearer <token>
   - Возвращает данные пользователя: username, email, phone, role

4. Добавь Django view для отображения dashboard:
   - DashboardView в users/views.py (возвращает index.html)
   - Добавь маршрут в users/urls.py: /dashboard/

5. Создай middleware или декоратор для проверки JWT токена (опционально, для защиты Django views)

6. Стилизация:
   - Продолжи использовать цветовую схему из предыдущих страниц
   - Современный дизайн с карточками
   - Адаптивная верстка

Страница должна проверять авторизацию и показывать информацию пользователя.
```

---

## 📌 Важные замечания

1. **Выполняй промпты по порядку** - каждый следующий зависит от предыдущего
2. **Тестируй после каждого промпта** - проверяй, что всё работает
3. **Сохраняй токены правильно** - используй localStorage для JWT токенов
4. **Обрабатывай ошибки** - показывай понятные сообщения пользователю
5. **Используй CORS** - настрой django-cors-headers для работы с frontend

---

## 🔄 Следующие шаги (после выполнения всех промптов)

- Добавление валидации на сервере
- Обработка ошибок
- Защита endpoints
- Дополнительные функции (смена пароля, восстановление пароля)
