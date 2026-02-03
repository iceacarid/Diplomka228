"""Простой тест Groq API"""
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

print(f"\n[INFO] Ключ: {key[:10]}... (длина: {len(key)})")

if not key or not key.startswith('gsk_'):
    print("[ERROR] Groq ключ не найден или неправильный!")
    sys.exit(1)

try:
    print("\n[1] Инициализация Groq...")
    client = OpenAI(
        api_key=key,
        base_url='https://api.groq.com/openai/v1'
    )
    print("[OK] Клиент создан")
    
    print("\n[2] Тестовый запрос...")
    response = client.chat.completions.create(
        model='llama-3.1-70b-versatile',
        messages=[
            {"role": "user", "content": "Скажи 'Привет' одним словом"}
        ],
        max_tokens=10
    )
    
    if response and response.choices:
        answer = response.choices[0].message.content
        print(f"[SUCCESS] Groq работает!")
        print(f"[RESPONSE] {answer}")
    else:
        print("[ERROR] Пустой ответ")
        
except Exception as e:
    print(f"[ERROR] {type(e).__name__}: {e}")
