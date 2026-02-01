# Скрипт для подключения к GitHub
# ЗАМЕНИТЕ YOUR_USERNAME на ваш GitHub username перед выполнением!

$username = "YOUR_USERNAME"  # ← ЗАМЕНИТЕ НА ВАШ USERNAME!

cd E:\FuraEdet_Diploma

# Добавляем remote
git remote add origin "https://github.com/$username/FuraEdet_Diploma.git"

# Переименовываем ветку в main
git branch -M main

# Отправляем код
Write-Host "Отправка кода на GitHub..." -ForegroundColor Green
Write-Host "При запросе пароля используйте Personal Access Token (не пароль!)" -ForegroundColor Yellow
git push -u origin main

Write-Host "Готово! Проверьте репозиторий на GitHub." -ForegroundColor Green
