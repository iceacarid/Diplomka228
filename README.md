# ФураЕдет - Система управления грузоперевозками

Информационная система для автоматизации процессов расчета стоимости, распределения грузов и управления автопарком с использованием искусственного интеллекта.

## 🚀 Быстрый старт

### Требования

- Python 3.14+
- PostgreSQL 14+
- Git

### Установка проекта

1. **Клонируйте репозиторий:**
   ```bash
   git clone https://github.com/iceacarid/Diplomka228.git
   cd Diplomka228
   ```

2. **Создайте виртуальное окружение:**
   ```bash
   cd server
   python -m venv venv
   ```

3. **Активируйте виртуальное окружение:**
   
   Windows (PowerShell):
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```
   
   Windows (CMD):
   ```cmd
   venv\Scripts\activate.bat
   ```
   
   Linux/Mac:
   ```bash
   source venv/bin/activate
   ```

4. **Установите зависимости:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Настройте базу данных:**
   
   Создайте базу данных PostgreSQL:
   ```sql
   CREATE DATABASE fura_db;
   CREATE USER postgres WITH PASSWORD '1234';
   GRANT ALL PRIVILEGES ON DATABASE fura_db TO postgres;
   ```

6. **Настройте переменные окружения:**
   
   Скопируйте пример файла:
   ```bash
   cp env.example .env.local
   ```
   
   Отредактируйте `.env.local` и укажите свои настройки:
   ```env
   DB_NAME=fura_db
   DB_USER=postgres
   DB_PASSWORD=ваш_пароль
   DB_HOST=localhost
   DB_PORT=5432
   
   SECRET_KEY=ваш_secret_key
   
   # GigaChat API (опционально)
   GIGACHAT_API_KEY=ваш_ключ_gigachat
   
   # Yandex Maps API (опционально)
   YANDEX_MAPS_API_KEY=ваш_ключ_yandex
   ```

7. **Примените миграции:**
   ```bash
   python manage.py migrate
   ```

8. **Создайте суперпользователя:**
   ```bash
   python manage.py createsuperuser
   ```

9. **Запустите сервер:**
   ```bash
   python manage.py runserver
   ```

   Сервер будет доступен по адресу: http://127.0.0.1:8000

## 📤 Загрузка проекта на GitHub

### Первоначальная загрузка

1. **Создайте репозиторий на GitHub:**
   - Перейдите на https://github.com
   - Нажмите "New repository"
   - Укажите имя репозитория
   - Не добавляйте README, .gitignore или лицензию (они уже есть)

2. **Инициализируйте Git (если еще не сделано):**
   ```bash
   git init
   ```

3. **Добавьте удаленный репозиторий:**
   ```bash
   git remote add origin https://github.com/ваш_username/ваш_репозиторий.git
   ```

4. **Добавьте файлы:**
   ```bash
   git add .
   ```

5. **Создайте коммит:**
   ```bash
   git commit -m "Initial commit"
   ```

6. **Загрузите на GitHub:**
   ```bash
   git push -u origin main
   ```

### Обновление проекта на GitHub

1. **Проверьте статус:**
   ```bash
   git status
   ```

2. **Добавьте изменения:**
   ```bash
   git add .
   ```

3. **Создайте коммит:**
   ```bash
   git commit -m "Описание изменений"
   ```

4. **Загрузите изменения:**
   ```bash
   git push origin main
   ```

## ⚠️ Важно

- **НЕ загружайте файл `.env.local`** в репозиторий - он содержит секретные ключи
- Файл `.env.local` уже добавлен в `.gitignore` и не будет загружен
- Используйте `env.example` как шаблон для настройки проекта

## 🛠️ Технологический стек

### Backend
- Python 3.14+
- Django 6.0+
- Django Rest Framework
- PostgreSQL
- GigaChat AI API

### Frontend
- React + Vite + TypeScript (планируется)
- Tailwind CSS (планируется)
- Yandex Maps API

## 📝 Лицензия

Дипломный проект
