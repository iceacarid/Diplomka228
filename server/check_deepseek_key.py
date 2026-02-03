"""Проверка что DeepSeek API ключ загружается"""
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
env_local = BASE_DIR / '.env.local'

if env_local.exists():
    load_dotenv(env_local, override=True)
    print("[OK] Загружен .env.local")
else:
    print("[WARN] .env.local не найден")
    load_dotenv()

key = os.getenv('DEEPSEEK_API_KEY', '')

if key and key != 'your_deepseek_api_key_here':
    print(f"[SUCCESS] DeepSeek ключ найден!")
    print(f"[INFO] Длина ключа: {len(key)} символов")
    print(f"[INFO] Начинается с: {key[:7]}...")
    
    # Проверяем что это похоже на DeepSeek ключ
    if key.startswith('sk-'):
        print("[OK] Формат ключа правильный (начинается с sk-)")
    else:
        print("[WARN] Ключ не начинается с 'sk-', проверьте правильность")
else:
    print("[ERROR] DeepSeek ключ не найден или не настроен")
    print("[INFO] Добавьте в .env.local: DEEPSEEK_API_KEY=sk-ваш_ключ")
