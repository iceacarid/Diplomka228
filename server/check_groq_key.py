"""Проверка что Groq API ключ загружается и работает"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = Path(__file__).resolve().parent
env_local = BASE_DIR / '.env.local'

if env_local.exists():
    load_dotenv(env_local, override=True)
    print("[OK] Загружен .env.local")
else:
    load_dotenv()

key = os.getenv('GROQ_API_KEY', '')

print(f"\n[INFO] Ключ найден: {bool(key and key != 'your_groq_api_key_here')}")
print(f"[INFO] Длина ключа: {len(key)} символов")
print(f"[INFO] Начинается с: {key[:7] if key else 'N/A'}...")

if not key or key == 'your_groq_api_key_here':
    print("[ERROR] Groq ключ не настроен!")
    sys.exit(1)

# Проверяем формат
if not key.startswith('gsk_'):
    print("[WARN] Ключ не начинается с 'gsk_' - возможно это не Groq ключ")
else:
    print("[OK] Формат ключа правильный (начинается с gsk_)")

try:
    print("\n[1] Инициализация Groq клиента...")
    client = OpenAI(
        api_key=key,
        base_url='https://api.groq.com/openai/v1'
    )
    print("[OK] Клиент инициализирован")
    
    print("\n[2] Отправка тестового запроса...")
    response = client.chat.completions.create(
        model='llama-3.1-70b-versatile',
        messages=[
            {"role": "system", "content": "Ты эксперт по логистике. Отвечай на русском."},
            {"role": "user", "content": "Привет! Можешь ответить одним предложением?"}
        ],
        temperature=0.7,
        max_tokens=100
    )
    
    if response and response.choices:
        answer = response.choices[0].message.content
        print(f"[SUCCESS] Groq работает!")
        print(f"[RESPONSE] {answer}")
    else:
        print("[ERROR] Пустой ответ от Groq")
        
except Exception as e:
    print(f"[ERROR] Ошибка при работе с Groq: {e}")
    print(f"[ERROR TYPE] {type(e).__name__}")
    import traceback
    traceback.print_exc()
