# 🚀 Быстрый старт - ФураЕдет Backend

## За 5 минут до запуска

### 1️⃣ Активируйте виртуальное окружение

```powershell
cd server
.\venv\Scripts\Activate.ps1
```

### 2️⃣ Обновите зависимости (если обновлялись)

```powershell
pip install -r requirements.txt
```

### 3️⃣ (Опционально) Настройте API ключи

Если хотите полную функциональность AI и карт:

```powershell
# Скопируйте шаблон
cp env.example .env

# Откройте в редакторе
notepad .env
```

Добавьте ключи:
- **GEMINI_API_KEY** → https://makersuite.google.com/app/apikey
- **YANDEX_MAPS_API_KEY** → https://developer.tech.yandex.ru/

> 💡 **Без ключей система работает с примерными значениями!**

### 4️⃣ Протестируйте интеграции (опционально)

```powershell
python test_integrations.py
```

### 5️⃣ Запустите сервер

```powershell
python manage.py runserver
```

---

## ✅ Готово!

Сервер запущен на **http://127.0.0.1:8000**

### Тестовые аккаунты:

| Email | Пароль | Роль |
|-------|--------|------|
| admin@fura.ru | admin123 | Администратор |
| manager@fura.ru | manager123 | Менеджер |
| client@fura.ru | client123 | Клиент |

### Полезные ссылки:

- **Django Admin:** http://127.0.0.1:8000/admin/
- **API Root:** http://127.0.0.1:8000/api/
- **Документация API:** Смотрите README.md
- **Настройка интеграций:** Смотрите INTEGRATIONS.md

---

## 📚 Что дальше?

1. Ознакомьтесь с **INTEGRATIONS.md** для настройки API
2. Изучите **README.md** для полного списка endpoints
3. Запустите frontend (когда будет готов)
4. Начинайте разработку!

---

**Хорошей работы! 🚛💨**
