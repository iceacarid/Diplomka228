"""
Тест функции распределения заказов через Gemini API
Проверяет endpoint /api/ai/optimize/
"""
import sys
import requests
import json

# Для корректного отображения Unicode в Windows PowerShell
sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = 'http://127.0.0.1:8000/api'

def test_gemini_optimization():
    print("\n" + "="*70)
    print("  ТЕСТ РАСПРЕДЕЛЕНИЯ ЗАКАЗОВ ЧЕРЕЗ GEMINI AI")
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
        print(f"[ERROR] {response.text}")
        return
    
    tokens = response.json()
    access_token = tokens.get('access')
    print(f"[OK] Авторизация успешна!")
    print(f"[INFO] Token: {access_token[:30]}...\n")
    
    # 2. Подготовка данных для AI оптимизации
    print("[2] Подготовка данных для AI анализа...")
    
    # Данные о транспорте
    trucks_data = [
        {
            'id': 1,
            'model': 'Volvo FH16',
            'capacity': 20000,
            'location': 'Москва'
        },
        {
            'id': 2,
            'model': 'Scania R500',
            'capacity': 15000,
            'location': 'Санкт-Петербург'
        }
    ]
    
    # Данные о заказах
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
        },
        {
            'id': 3,
            'origin': 'Москва',
            'destination': 'Екатеринбург',
            'weight': 5000,
            'cargo_type': 'Электроника'
        }
    ]
    
    # Дополнительный промпт от менеджера
    custom_prompt = "Приоритет - минимизация времени доставки"
    
    print(f"[INFO] Транспорт: {len(trucks_data)} единиц")
    print(f"[INFO] Заказы: {len(orders_data)} штук")
    print(f"[INFO] Промпт: {custom_prompt}\n")
    
    # 3. Запрос к AI для оптимизации
    print("[3] Отправка запроса к Gemini AI...")
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    optimization_data = {
        'trucks': trucks_data,
        'orders': orders_data,
        'prompt': custom_prompt
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
            request_id = result.get('request_id', '')
            
            print("="*70)
            print("  РЕКОМЕНДАЦИЯ ОТ GEMINI AI")
            print("="*70)
            print(recommendation)
            print("="*70)
            print(f"\n[INFO] ID запроса: {request_id}")
            print("[SUCCESS] Gemini AI работает корректно!\n")
            
            # 4. Проверка истории запросов
            print("[4] Проверка истории AI запросов...")
            history_response = requests.get(
                f'{BASE_URL}/ai/history/',
                headers=headers
            )
            
            if history_response.status_code == 200:
                history = history_response.json()
                print(f"[OK] Найдено записей в истории: {len(history)}")
                if history:
                    last_request = history[0]
                    print(f"[INFO] Последний запрос: {last_request.get('created_at')}")
                    print(f"[INFO] Текст запроса: {last_request.get('request_text')}")
            
            return True
            
        elif response.status_code == 429:
            print("[ERROR] Превышен лимит запросов к Gemini API (квота)")
            print("[INFO] Это нормально для бесплатного тарифа")
            print("[INFO] Подождите или активируйте биллинг в Google AI Studio")
            print(f"\n[RESPONSE] {response.text}")
            return False
            
        elif response.status_code == 401:
            print("[ERROR] Ошибка авторизации (401)")
            print(f"[RESPONSE] {response.text}")
            return False
            
        else:
            print(f"[ERROR] Неожиданная ошибка: {response.status_code}")
            print(f"[RESPONSE] {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("[ERROR] Превышено время ожидания (30 сек)")
        print("[INFO] Gemini API может быть медленным или недоступным")
        return False
        
    except Exception as e:
        print(f"[ERROR] Исключение при запросе: {e}")
        return False


if __name__ == '__main__':
    print("\n" + "="*70)
    print("  ТЕСТИРОВАНИЕ GEMINI API ДЛЯ РАСПРЕДЕЛЕНИЯ ЗАКАЗОВ")
    print("="*70 + "\n")
    
    success = test_gemini_optimization()
    
    print("\n" + "="*70)
    print("  ИТОГОВЫЙ РЕЗУЛЬТАТ")
    print("="*70)
    
    if success:
        print("[PASSED] Gemini AI успешно распределяет заказы")
    else:
        print("[FAILED] Проверьте настройки Gemini API")
    
    print("="*70 + "\n")
    
    print("Примечание:")
    print("   - API ключ загружается из .env.local")
    print("   - Распределение вызывается кнопкой в модальном окне")
    print("   - Endpoint: POST /api/ai/optimize/")
    print("   - Требуется роль: manager или admin\n")
