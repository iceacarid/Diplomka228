# Скрипт для добавления DeepSeek API ключа в .env.local
# Использование: .\add_deepseek_key.ps1 "sk-ваш_ключ_здесь"

param(
    [Parameter(Mandatory=$true)]
    [string]$DeepSeekKey
)

$envFile = ".env.local"

# Проверяем существует ли файл
if (-not (Test-Path $envFile)) {
    Write-Host "Создаю файл .env.local..."
    New-Item -ItemType File -Path $envFile | Out-Null
}

# Читаем содержимое файла
$content = Get-Content $envFile -ErrorAction SilentlyContinue

# Проверяем есть ли уже DEEPSEEK_API_KEY
$hasKey = $false
$newContent = @()

foreach ($line in $content) {
    if ($line -match "^DEEPSEEK_API_KEY=") {
        # Заменяем существующий ключ
        $newContent += "DEEPSEEK_API_KEY=$DeepSeekKey"
        $hasKey = $true
    } else {
        $newContent += $line
    }
}

# Если ключа не было, добавляем в конец
if (-not $hasKey) {
    $newContent += ""
    $newContent += "# DeepSeek AI API"
    $newContent += "DEEPSEEK_API_KEY=$DeepSeekKey"
}

# Записываем обратно
$newContent | Set-Content $envFile -Encoding UTF8

Write-Host "✅ Ключ DeepSeek добавлен в .env.local!"
Write-Host "Перезапустите сервер: python manage.py runserver"
