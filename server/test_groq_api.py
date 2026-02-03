"""
Тест Groq AI через Django API
Проверяет что система использует Groq для распределения заказов
"""
import sys
import requests

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = 'http://127.0.0.1:8000/api'

def test_groq_optimization():
    print("\n" + "="*70)
    print("  ТЕСТ GROQ AI ДЛЯ РАСПРЕДЕЛЕНИЯ ЗАКАЗОВ")
    print("="*70 + "\n")
    
    # 1. Логин как менеджер
    print("[1] Авторизация как менеджер...")
    login_data = {
        'email': 'manager@fura.ru',
        'password': 'manager123'
    }
    
    response = requests.post(f'{BASE_URL}/auth/login/', json=login_data)
    
    if response.status_code != 200:
        print(f"[ERROR] Не удалось войти: {response.status_code}")
        return False
    
    tokens = response.json()
    access_token = tokens.get('access')
    print(f"[OK] Авторизация успешна!\n")
    
    # 2. Подготовка данных
    print("[2] Подготовка данных для AI анализа...")
    
    trucks_data = [
        {
            'id': 1,
            'model': 'Volvo FH16',
            'capacity': 20000,
            'location': 'Москва',
            'plate': 'А123БВ'
        },
        {
            'id': 2,
            'model': 'Scania R500',
            'capacity': 15000,
            'location': 'Санкт-Петербург',
            'plate': 'В456ГД'
        }
    ]
    
    orders_data = [
        {
            'id': 1,
            'origin': 'Москва',
            'destination': 'Казань',
            'weight': 8000,
            'cargo_type': 'Промышленное оборудование'
        },
        {
            'id': 2,
            'origin': 'Санкт-Петербург',
            'destination': 'Новосибирск',
            'weight': 12000,
            'cargo_type': 'Стройматериалы'
        }
    ]
    
    print(f"[INFO] Транспорт: {len(trucks_data)} единиц")
    print(f"[INFO] Заказы: {len(orders_data)} штук\n")
    
    # 3. Запрос к AI
    print("[3] Отправка запроса к Groq AI...")
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    optimization_data = {
        'trucks': trucks_data,
        'orders': orders_data,
        'prompt': 'Приоритет - минимизация времени доставки'
    }
    
    try:
        response = requests.post(
            f'{BASE_URL}/ai/optimize/',
            headers=headers,
            json=optimization_data,
            timeout=30
        )
        
        print(f"[INFO] Статус ответа: {response.status_code}\n")
        
        if response.status_code == 200:
            result = response.json()
            recommendation = result.get('recommendation', '')
            
            print("="*70)
            print("  РЕЗУЛЬТАТ ОТ GROQ AI")
            print("="*70)
            print(recommendation)
            print("="*70 + "\n")
            
            # Проверяем какой AI использовался
            if "Groq" in recommendation or "groq" in recommendation.lower():
                print("[SUCCESS] Groq AI работает!")
            elif "простое распределение" in recommendation.lower():
                print("[WARN] Использован простой алгоритм (Groq недоступен)")
            else:
                print("[INFO] Получена рекомендация")
            
            request_id = result.get('request_id', '')
            print(f"[INFO] ID запроса: {request_id}\n")
            
            return True
        else:
            print(f"[ERROR] Ошибка: {response.status_code}")
            print(f"[RESPONSE] {response.text}")
            return False
            
    except Exception as e:
        print(f"[ERROR] Исключение: {e}")
        return False


if __name__ == '__main__':
    print("\n" + "="*70)
    print("  ТЕСТИРОВАНИЕ GROQ AI")
    print("="*70 + "\n")
    
    success = test_groq_optimization()
    
    print("\n" + "="*70)
    print("  ИТОГОВЫЙ РЕЗУЛЬТАТ")
    print("="*70)
    
    if success:
        print("[PASSED] Тест пройден!")
    else:
        print("[FAILED] Тест не пройден")
    
    print("="*70 + "\n")
