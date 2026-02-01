# Подключение проекта к GitHub

## 📋 Шаг 1: Создайте репозиторий на GitHub

1. Перейдите на [GitHub.com](https://github.com) и войдите в аккаунт
2. Нажмите кнопку **"+"** в правом верхнем углу
3. Выберите **"New repository"**
4. Заполните форму:
   - **Repository name:** `FuraEdet_Diploma` (или другое название)
   - **Description:** "Система управления грузоперевозками - Дипломный проект"
   - **Visibility:** 
     - ✅ **Private** (рекомендуется для дипломной работы)
     - ⚠️ Public (если хотите открытый доступ)
   - **НЕ** добавляйте:
     - ❌ README (у нас уже есть)
     - ❌ .gitignore (у нас уже есть)
     - ❌ License (опционально)
5. Нажмите **"Create repository"**

---

## 🔗 Шаг 2: Подключите локальный репозиторий

После создания репозитория GitHub покажет инструкции. Выполните команды:

### Вариант A: HTTPS (проще для начала)

```powershell
cd E:\FuraEdet_Diploma

# Добавьте remote (ЗАМЕНИТЕ YOUR_USERNAME на ваш GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/FuraEdet_Diploma.git

# Переименуйте ветку в main (если нужно)
git branch -M main

# Отправьте код на GitHub
git push -u origin main
```

### Вариант B: SSH (если настроен SSH ключ)

```powershell
cd E:\FuraEdet_Diploma

# Добавьте remote (ЗАМЕНИТЕ YOUR_USERNAME на ваш GitHub username)
git remote add origin git@github.com:YOUR_USERNAME/FuraEdet_Diploma.git

# Переименуйте ветку в main
git branch -M main

# Отправьте код на GitHub
git push -u origin main
```

---

## 🔐 Шаг 3: Аутентификация

### Если используете HTTPS:

При первом `git push` GitHub попросит:
- **Username:** ваш GitHub username
- **Password:** используйте **Personal Access Token** (не пароль!)

#### Как создать Personal Access Token:

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Нажмите **"Generate new token (classic)"**
3. Название: `FuraEdet Project`
4. Выберите срок действия (например, 90 дней)
5. Отметьте scope: **`repo`** (полный доступ к репозиториям)
6. Нажмите **"Generate token"**
7. **Скопируйте токен** (показывается только один раз!)
8. Используйте этот токен как пароль при `git push`

### Если используете SSH:

Убедитесь, что SSH ключ добавлен в GitHub:
- Settings → SSH and GPG keys → New SSH key

---

## ✅ Шаг 4: Проверка

После успешного `git push`:

1. Обновите страницу репозитория на GitHub
2. Вы должны увидеть все файлы проекта
3. Проверьте, что все коммиты на месте

---

## 📤 Дальнейшая работа

### Отправка изменений:

```powershell
git add .
git commit -m "Описание изменений"
git push
```

### Получение изменений:

```powershell
git pull
```

---

## ⚠️ Важные замечания

1. **НЕ коммитьте** секретные данные:
   - Пароли БД
   - API ключи
   - Секретные ключи Django

2. **Используйте .env файл** для секретов:
   - Добавьте `.env` в `.gitignore`
   - Создайте `.env.example` с примерами

3. **Регулярно делайте коммиты** с понятными сообщениями

4. **Используйте ветки** для новых функций:
   ```powershell
   git checkout -b feature/название-функции
   git push -u origin feature/название-функции
   ```

---

## 🆘 Если что-то пошло не так

### Ошибка: "remote origin already exists"

```powershell
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/FuraEdet_Diploma.git
```

### Ошибка: "failed to push some refs"

```powershell
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### Изменить URL remote:

```powershell
git remote set-url origin https://github.com/YOUR_USERNAME/FuraEdet_Diploma.git
```

---

## 📝 Готовые команды (скопируйте и замените YOUR_USERNAME)

```powershell
cd E:\FuraEdet_Diploma
git remote add origin https://github.com/YOUR_USERNAME/FuraEdet_Diploma.git
git branch -M main
git push -u origin main
```
