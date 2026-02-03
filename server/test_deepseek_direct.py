"""Прямой тест DeepSeek API"""
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

api_key = os.getenv('DEEPSEEK_API_KEY', '')

print(f"\n[INFO] Ключ найден: {bool(api_key and api_key != 'your_deepseek_api_key_here')}")
print(f"[INFO] Длина ключа: {len(api_key)} символов")

if not api_key or api_key == 'your_deepseek_api_key_here':
    print("[ERROR] DeepSeek ключ не настроен!")
    sys.exit(1)

try:
    print("\n[1] Инициализация DeepSeek клиента...")
    client = OpenAI(
        api_key=api_key,
        base_url='https://api.deepseek.com'
    )
    print("[OK] Клиент инициализирован")
    
    print("\n[2] Отправка тестового запроса...")
    response = client.chat.completions.create(
        model='deepseek-chat',
        messages=[
            {"role": "system", "content": "Ты эксперт по логистике. Отвечай на русском."},
            {"role": "user", "content": "Привет! Можешь ответить одним предложением?"}
        ],
        temperature=0.7,
        max_tokens=100
    )
    
    if response and response.choices:
        answer = response.choices[0].message.content
        print(f"[SUCCESS] ✅ DeepSeek работает!")
        print(f"[RESPONSE] {answer}")
    else:
        print("[ERROR] Пустой ответ от DeepSeek")
        
except Exception as e:
    print(f"[ERROR] Ошибка при работе с DeepSeek: {e}")
    print(f"[ERROR TYPE] {type(e).__name__}")
    import traceback
    traceback.print_exc()
