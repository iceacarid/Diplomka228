"""Прямой тест GroqService.optimize_load"""
import sys
from pathlib import Path
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / '.env.local', override=True)

from logistics.services import GroqService

print("\n[1] Создание GroqService...")
gs = GroqService()
print(f"[INFO] Available: {gs.available}")
print(f"[INFO] Model: {gs.model_name if gs.available else 'N/A'}")

if not gs.available:
    print("[ERROR] Groq недоступен!")
    sys.exit(1)

print("\n[2] Тестовые данные...")
trucks = [
    {'id': 1, 'model': 'Volvo', 'capacity': 20000, 'plate': 'А123БВ'}
]
orders = [
    {'id': 1, 'origin': 'Москва', 'destination': 'Казань', 'weight': 5000}
]

print("\n[3] Вызов optimize_load...")
try:
    result = gs.optimize_load(trucks, orders, "Тест")
    if result:
        print("[SUCCESS] Groq вернул результат!")
        print(f"[RESULT] {result[:200]}...")
    else:
        print("[WARN] Groq вернул None")
except Exception as e:
    print(f"[ERROR] {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
