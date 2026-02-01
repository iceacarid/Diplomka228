# Инструкция по подключению к GitHub

## 📋 Шаги для подключения репозитория к GitHub

### 1. Создайте репозиторий на GitHub

1. Перейдите на [GitHub.com](https://github.com)
2. Нажмите кнопку **"+"** в правом верхнем углу
3. Выберите **"New repository"**
4. Заполните:
   - **Repository name:** `FuraEdet_Diploma` (или другое название)
   - **Description:** "Система управления грузоперевозками"
   - **Visibility:** Private (рекомендуется) или Public
   - **НЕ** добавляйте README, .gitignore или лицензию (они уже есть)
5. Нажмите **"Create repository"**

### 2. Подключите локальный репозиторий к GitHub

После создания репозитория GitHub покажет инструкции. Выполните команды:

```powershell
cd E:\FuraEdet_Diploma

# Добавьте remote (замените YOUR_USERNAME на ваш GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/FuraEdet_Diploma.git

# Переименуйте ветку в main (если нужно)
git branch -M main

# Отправьте код на GitHub
git push -u origin main
```

### 3. Альтернативный способ (через SSH)

Если у вас настроен SSH ключ:

```powershell
git remote add origin git@github.com:YOUR_USERNAME/FuraEdet_Diploma.git
git branch -M main
git push -u origin main
```

## 🔐 Настройка SSH ключа (опционально)

Если хотите использовать SSH вместо HTTPS:

1. **Проверьте, есть ли у вас SSH ключ:**
```powershell
ls ~/.ssh
```

2. **Если нет, создайте новый:**
```powershell
ssh-keygen -t ed25519 -C "your_email@example.com"
```

3. **Скопируйте публичный ключ:**
```powershell
cat ~/.ssh/id_ed25519.pub
```

4. **Добавьте ключ в GitHub:**
   - Перейдите в Settings → SSH and GPG keys
   - Нажмите "New SSH key"
   - Вставьте скопированный ключ

## 📤 Отправка изменений

После подключения, для отправки изменений:

```powershell
# Добавить изменения
git add .

# Создать коммит
git commit -m "Описание изменений"

# Отправить на GitHub
git push
```

## 📥 Получение изменений

```powershell
git pull
```

## 🌿 Работа с ветками

```powershell
# Создать новую ветку
git checkout -b feature/название-функции

# Переключиться на ветку
git checkout main

# Отправить ветку на GitHub
git push -u origin feature/название-функции
```

## ⚠️ Важные замечания

- **НЕ коммитьте** файлы с паролями и секретными ключами
- **НЕ коммитьте** `venv/`, `node_modules/`, `__pycache__/` (они в .gitignore)
- Регулярно делайте коммиты с понятными сообщениями
- Используйте `.env` файл для секретов (добавлен в .gitignore)

## 🔗 Полезные ссылки

- [GitHub Docs](https://docs.github.com)
- [Git Handbook](https://guides.github.com/introduction/git-handbook/)
