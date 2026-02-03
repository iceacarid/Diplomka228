# 🚀 Деплой проекта на Beget

Подробная инструкция по загрузке Django проекта на хостинг Beget.

## 📋 Подготовка проекта

### 1. Обновите настройки для production

Отредактируйте `server/core/settings.py`:

```python
# Измените эти настройки:
DEBUG = False  # ВАЖНО! Отключите DEBUG в production

ALLOWED_HOSTS = [
    'ваш-домен.ru',
    'www.ваш-домен.ru',
    'ваш-домен.beget.app',  # Если используете поддомен Beget
]

# Добавьте настройки для статических файлов:
STATIC_ROOT = BASE_DIR / 'staticfiles'  # Для collectstatic
STATIC_URL = '/static/'

# Media файлы
MEDIA_ROOT = BASE_DIR / 'media'
MEDIA_URL = '/media/'
```

### 2. Создайте файл `.env.local` для production

На сервере создайте файл `.env.local` с настройками:

```env
# База данных (данные из панели Beget)
DB_NAME=ваша_база_данных
DB_USER=ваш_пользователь_БД
DB_PASSWORD=ваш_пароль_БД
DB_HOST=localhost
DB_PORT=5432

# Django Secret Key (сгенерируйте новый!)
SECRET_KEY=ваш_новый_secret_key_для_production

# GigaChat API (если используете)
GIGACHAT_API_KEY=ваш_ключ_gigachat

# Yandex Maps API (если используете)
YANDEX_MAPS_API_KEY=ваш_ключ_yandex

# Debug режим
DEBUG=False
```

## 🔧 Настройка на Beget

### Шаг 1: Создание базы данных PostgreSQL

1. Войдите в панель управления Beget: https://cp.beget.com
2. Перейдите в раздел **"Базы данных"** → **"PostgreSQL"**
3. Нажмите **"Создать базу данных"**
4. Запишите данные:
   - Имя базы данных
   - Пользователь
   - Пароль
   - Хост (обычно `localhost`)

### Шаг 2: Создание Python приложения

1. В панели Beget перейдите в **"Сайты"** → **"Управление сайтами"**
2. Выберите ваш домен или создайте новый
3. В настройках сайта найдите **"Python"**
4. Выберите версию Python (рекомендуется Python 3.11+)
5. Укажите путь к WSGI файлу: `server/core/wsgi.py`
6. Укажите путь к приложению: `server/`

### Шаг 3: Загрузка файлов на сервер

#### Вариант 1: Через FTP/SFTP

1. В панели Beget найдите **FTP доступ**
2. Используйте FTP клиент (FileZilla, WinSCP) для загрузки:
   - Хост: `ваш-домен.ru` или IP адрес
   - Пользователь: ваш FTP пользователь
   - Пароль: ваш FTP пароль
   - Порт: 21 (FTP) или 22 (SFTP)

3. Загрузите файлы в корневую директорию сайта:
   ```
   /home/u/ваш_пользователь/ваш_домен.ru/public_html/
   ```

#### Вариант 2: Через Git (рекомендуется)

1. В панели Beget найдите **"Git"** в настройках сайта
2. Добавьте ваш репозиторий:
   ```
   https://github.com/iceacarid/Diplomka228.git
   ```
3. Укажите ветку: `main`
4. Beget автоматически загрузит файлы

### Шаг 4: Настройка виртуального окружения

Подключитесь к серверу через SSH:

```bash
ssh ваш_пользователь@ваш-домен.ru
```

Перейдите в директорию проекта:

```bash
cd ~/ваш_домен.ru/public_html/
```

Создайте виртуальное окружение:

```bash
python3 -m venv venv
source venv/bin/activate
```

Установите зависимости:

```bash
pip install --upgrade pip
pip install -r server/requirements.txt
```

### Шаг 5: Настройка базы данных

1. Создайте файл `.env.local` в директории `server/`:

```bash
cd server
nano .env.local
```

2. Вставьте настройки базы данных из панели Beget

3. Примените миграции:

```bash
python manage.py migrate
```

4. Создайте суперпользователя:

```bash
python manage.py createsuperuser
```

### Шаг 6: Сбор статических файлов

```bash
python manage.py collectstatic --noinput
```

### Шаг 7: Настройка WSGI в панели Beget

1. В панели Beget перейдите в настройки сайта
2. Найдите раздел **"Python"** или **"WSGI"**
3. Укажите:
   - **Путь к WSGI файлу**: `server/core/wsgi.py`
   - **Путь к приложению**: `server/`
   - **Виртуальное окружение**: `venv` (если нужно)

### Шаг 8: Настройка статических файлов

В панели Beget настройте обработку статических файлов:

1. Перейдите в **"Настройки сайта"** → **"Статические файлы"**
2. Добавьте правило:
   - URL: `/static/`
   - Путь: `/home/u/ваш_пользователь/ваш_домен.ru/public_html/staticfiles/`

3. Для media файлов:
   - URL: `/media/`
   - Путь: `/home/u/ваш_пользователь/ваш_домен.ru/public_html/media/`

## 🔒 Безопасность

### Генерация нового SECRET_KEY

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Скопируйте результат в `.env.local`:

```env
SECRET_KEY=сгенерированный_ключ
```

### Проверка настроек

```bash
python manage.py check --deploy
```

## 🧪 Тестирование

1. Откройте ваш сайт в браузере
2. Проверьте главную страницу
3. Проверьте API endpoints: `https://ваш-домен.ru/api/`
4. Проверьте админ-панель: `https://ваш-домен.ru/admin/`

## 📝 Полезные команды

### Обновление проекта

```bash
cd ~/ваш_домен.ru/public_html/
source venv/bin/activate
cd server
git pull  # Если используете Git
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
```

### Просмотр логов

```bash
tail -f ~/logs/error.log
```

### Перезапуск приложения

В панели Beget найдите кнопку **"Перезапустить Python приложение"**

## ⚠️ Частые проблемы

### Проблема: 500 Internal Server Error

**Решение:**
1. Проверьте логи: `~/logs/error.log`
2. Убедитесь, что `DEBUG = False` в settings.py
3. Проверьте, что `ALLOWED_HOSTS` содержит ваш домен
4. Проверьте права доступа к файлам: `chmod 755 server/`

### Проблема: Статические файлы не загружаются

**Решение:**
1. Выполните `python manage.py collectstatic`
2. Проверьте настройки статических файлов в панели Beget
3. Убедитесь, что путь к `staticfiles` правильный

### Проблема: Ошибка подключения к базе данных

**Решение:**
1. Проверьте данные в `.env.local`
2. Убедитесь, что база данных создана в панели Beget
3. Проверьте, что пользователь БД имеет права доступа

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте логи ошибок в панели Beget
2. Обратитесь в поддержку Beget: https://beget.com/ru/support
3. Проверьте документацию Django: https://docs.djangoproject.com/en/6.0/howto/deployment/

## ✅ Чеклист деплоя

- [ ] Обновлены настройки для production (DEBUG=False, ALLOWED_HOSTS)
- [ ] Создана база данных PostgreSQL в панели Beget
- [ ] Файлы загружены на сервер
- [ ] Создано виртуальное окружение
- [ ] Установлены зависимости
- [ ] Создан файл `.env.local` с настройками
- [ ] Применены миграции
- [ ] Создан суперпользователь
- [ ] Собран статические файлы (`collectstatic`)
- [ ] Настроен WSGI в панели Beget
- [ ] Настроены статические файлы в панели
- [ ] Сайт открывается и работает

---

**Успешного деплоя! 🚀**
