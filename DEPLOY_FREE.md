# Бесплатный деплой проекта (Render.com)

Пошаговая инструкция по выкладке Django-проекта на **Render** — бесплатный хостинг с поддержкой PostgreSQL.

---

## Почему Render

- **Бесплатно**: тариф Free для Web Service и PostgreSQL
- **PostgreSQL** входит в бесплатный план (с ограничениями)
- **Деплой из GitHub**: подключаете репозиторий — обновления выкатываются по `git push`
- **Ограничение Free**: сервис «засыпает» после ~15 минут без заходов (первый запрос после сна может идти 30–60 секунд)

Альтернативы: **PythonAnywhere** (проще, но на Free только MySQL или своя БД через API), **Railway** (есть бесплатные кредиты, потом платно).

---

## Что нужно сделать

### 1. Подготовить проект к production

В `server/core/settings.py` уже используются переменные окружения. Нужно только:

- На хосте выставить `DEBUG=False` и задать `ALLOWED_HOSTS` (на Render это делается через переменные окружения, см. ниже).

### 2. Добавить файлы для деплоя на Render

В корне репозитория (рядом с `server/`) создайте:

**Файл `render.yaml`** (опционально — «Blueprint» для создания сервиса и БД из конфига):

```yaml
services:
  - type: web
    name: furaedet-diploma
    runtime: python
    plan: free
    buildCommand: "pip install -r server/requirements.txt"
    startCommand: "cd server && gunicorn core.wsgi --bind 0.0.0.0:$PORT"
    envVars:
      - key: PYTHON_VERSION
        value: "3.11.2"
      - key: DEBUG
        value: "False"
      - key: DATABASE_URL
        fromDatabase:
          name: furaedet-db
          property: connectionString
      - key: SECRET_KEY
        generateValue: true
      - key: ALLOWED_HOSTS
        sync: false
    healthCheckPath: /

databases:
  - name: furaedet-db
    plan: free
```

Либо настраиваете всё вручную в панели Render (шаги ниже) без `render.yaml`.

**Файл `build.sh`** в корне проекта (для Build Command на Render):

```bash
#!/usr/bin/env bash
pip install -r server/requirements.txt
cd server && python manage.py collectstatic --noinput
```

**В `server/requirements.txt`** добавьте (если ещё нет):

```
gunicorn
dj-database-url
```

`dj-database-url` нужен, чтобы из одной переменной `DATABASE_URL` (её даёт Render для PostgreSQL) собрать настройки Django.

### 3. Настройка Django для Render

В `server/core/settings.py` в секции **DATABASES** добавьте поддержку `DATABASE_URL`:

```python
import dj_database_url

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'fura_db'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}

# Переопределение из DATABASE_URL (для Render, Heroku и т.п.)
if os.getenv('DATABASE_URL'):
    DATABASES['default'] = dj_database_url.config(conn_max_age=600, ssl_require=True)
```

И в конце файла для production:

```python
# ALLOWED_HOSTS для production
if not DEBUG:
    ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',') if os.getenv('ALLOWED_HOSTS') else []
    if not ALLOWED_HOSTS and os.getenv('RENDER_EXTERNAL_HOSTNAME'):
        ALLOWED_HOSTS.append(os.getenv('RENDER_EXTERNAL_HOSTNAME'))
```

Тогда на Render достаточно задать переменную `ALLOWED_HOSTS` (или использовать только `RENDER_EXTERNAL_HOSTNAME` — см. ниже).

### 4. Регистрация и создание сервиса на Render

1. Зайдите на **https://render.com** и зарегистрируйтесь (можно через GitHub).
2. **Dashboard** → **New** → **Web Service**.
3. Подключите репозиторий **GitHub** (`iceacarid/Diplomka228` или ваш форк).
   - Repository: выберите репозиторий.
   - Branch: `main`.
4. Настройки сервиса:
   - **Name**: например `furaedet-diploma`.
   - **Region**: выберите ближайший (например Frankfurt).
   - **Runtime**: Python.
   - **Build Command**:
     ```bash
     pip install -r server/requirements.txt && cd server && python manage.py collectstatic --noinput
     ```
   - **Start Command**:
     ```bash
     cd server && gunicorn core.wsgi --bind 0.0.0.0:$PORT
     ```
   - **Instance Type**: Free.

### 5. База данных PostgreSQL на Render

1. В Render: **New** → **PostgreSQL**.
2. **Name**: например `furaedet-db`, **Plan**: Free.
3. После создания откройте базу → **Info** → скопируйте **Internal Database URL** (или External, если будете подключаться снаружи; для веб-сервиса на Render лучше Internal).

### 6. Переменные окружения (Web Service)

В настройках вашего **Web Service** → **Environment** добавьте:

| Key             | Value |
|-----------------|--------|
| `DEBUG`         | `False` |
| `SECRET_KEY`    | Случайная строка (например сгенерируйте: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`) |
| `DATABASE_URL`  | Вставьте **Internal Database URL** из созданной PostgreSQL (Render подставит его автоматически, если связать сервис с БД через Dashboard). |
| `ALLOWED_HOSTS` | `.onrender.com` или ваш домен. Можно временно: `*` (только для проверки). |
| `PYTHON_VERSION`| `3.11.2` (или другая версия из списка Render). |

Опционально (если используете в проекте):

- `GIGACHAT_API_KEY`
- `YANDEX_MAPS_API_KEY`
- `GEMINI_API_KEY`

Если используете только JWT и не отдаёте статику с другого домена, CORS можно потом расширить для вашего фронта.

### 7. Привязка БД к Web Service

В карточке **Web Service** → **Environment** можно добавить переменную **Database** (Render предложит при создании БД или в разделе Connections). Тогда `DATABASE_URL` подставится автоматически — и в коде достаточно проверки `if os.getenv('DATABASE_URL')` как выше.

### 8. Миграции и суперпользователь

Миграции на Render нужно выполнять при деплое. Варианты:

**Вариант A — через Build Command (один раз или при каждом деплое):**

Измените **Build Command** на:

```bash
pip install -r server/requirements.txt && cd server && python manage.py migrate --noinput && python manage.py collectstatic --noinput
```

**Вариант B — вручную один раз через Shell (Render Dashboard):**

В карточке Web Service откройте **Shell** и выполните:

```bash
cd server
python manage.py migrate
python manage.py createsuperuser
```

После первого деплоя сайт будет доступен по адресу вида:  
`https://furaedet-diploma.onrender.com`

### 9. Статика и медиа

- **Статика**: `collectstatic` складывает файлы в `server/staticfiles/`. На Free-плане Render не раздаёт их отдельно; для демо можно оставить как есть (Django отдаст при `DEBUG=False` через `whitenoise` — добавьте в проект и в `MIDDLEWARE` для production).
- **Медиа (загрузки пользователей)**: на Free-плане диск эфемерный, после перезапуска загрузки пропадут. Для постоянного хранения позже можно подключить S3-совместимое хранилище.

Рекомендуется добавить **WhiteNoise** для раздачи статики:

В `requirements.txt`:

```
whitenoise
```

В `server/core/settings.py` в `MIDDLEWARE` (сразу после `SecurityMiddleware`):

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    ...
]
```

И в конце настроек:

```python
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

---

## Краткий чеклист

1. Репозиторий на GitHub готов.
2. В проект добавлены: `gunicorn`, `dj-database-url` (и по желанию `whitenoise`), правки в `settings.py` для `DATABASE_URL` и `ALLOWED_HOSTS`.
3. На Render созданы Web Service (Python) и PostgreSQL (Free).
4. В Web Service заданы переменные: `DEBUG`, `SECRET_KEY`, `DATABASE_URL`, `ALLOWED_HOSTS`.
5. Build Command и Start Command указаны как выше.
6. Выполнены миграции (через Build или Shell).
7. При необходимости создан суперпользователь через Shell.
8. Открыт URL вида `https://ваш-сервис.onrender.com` и проверена работа сайта/API.

После этого проект будет обновляться при каждом `git push` в ветку `main` (если в Render выбран деплой из этой ветки).

---

## Если что-то пошло не так

- **Логи**: в Render в карточке сервиса вкладка **Logs**.
- **502 Bad Gateway**: чаще всего приложение не стартует — проверьте Start Command и что в логах нет ошибок импорта/миграций.
- **Ошибки БД**: проверьте, что `DATABASE_URL` действительно подставлен и что миграции выполнялись (Shell или Build Command).

Дополнительно можно посмотреть официальную инструкцию: [Django on Render](https://render.com/docs/deploy-django).
