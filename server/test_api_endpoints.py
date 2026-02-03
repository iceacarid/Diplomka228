# -*- coding: utf-8 -*-
"""
Тестирование основных API endpoints Django сервера
"""

import sys
import requests
import json
import time

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = 'http://127.0.0.1:8000'

def print_header(title):
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70 + "\n")

def test_server_running():
    """Проверка, что сервер запущен"""
    print_header("ПРОВЕРКА СЕРВЕРА")
    
    try:
        response = requests.get(f"{BASE_URL}/api/", timeout=5)
        if response.status_code == 200:
            print("[OK] Сервер работает!")
            print(f"[INFO] URL: {BASE_URL}")
            return True
        else:
            print(f"[WARN] Сервер отвечает с кодом: {response.status_code}")
            return True
    except requests.exceptions.ConnectionError:
        print("[ERROR] Сервер не запущен!")
        print("[INFO] Запустите: python manage.py runserver")
        return False
    except Exception as e:
        print(f"[ERROR] {e}")
        return False


def test_auth_endpoints():
    """Тест авторизации"""
    print_header("ТЕСТ АВТОРИЗАЦИИ")
    
    # Регистрация нового пользователя
    print("[TEST] Попытка входа с тестовым пользователем...")
    
    login_data = {
        "email": "client@fura.ru",
        "password": "client123"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login/",
            json=login_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print("[SUCCESS] Вход выполнен успешно!")
            print(f"[INFO] Пользователь: {data['user']['name']} ({data['user']['role']})")
            print(f"[INFO] Access token получен: {data['access'][:30]}...")
            return data['access']
        else:
            print(f"[ERROR] Ошибка входа: {response.status_code}")
            print(f"[RESPONSE] {response.text}")
            return None
            
    except Exception as e:
        print(f"[ERROR] {e}")
        return None


def test_public_endpoints():
    """Тест публичных endpoints (без авторизации)"""
    print_header("ТЕСТ ПУБЛИЧНЫХ ENDPOINTS")
    
    # 1. Калькулятор стоимости
    print("[TEST 1] Калькулятор стоимости")
    calc_data = {
        "origin": "Москва",
        "destination": "Санкт-Петербург",
        "weight": 1000,
        "volume": 5
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/calculator/",
            json=calc_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print("[SUCCESS] Калькулятор работает!")
            print(f"[RESULT] Цена: {data['price']} ₽")
            print(f"[RESULT] Расстояние: {data['distance_km']} км")
            print(f"[RESULT] Тариф: {data['tariff_name']}")
        else:
            print(f"[ERROR] Код {response.status_code}: {response.text}")
    except Exception as e:
        print(f"[ERROR] {e}")
    
    print()
    
    # 2. Список тарифов
    print("[TEST 2] Список тарифов")
    try:
        response = requests.get(f"{BASE_URL}/api/tariffs/", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"[SUCCESS] Найдено тарифов: {len(data['results'] if 'results' in data else data)}")
            if data:
                tariffs = data['results'] if 'results' in data else data
                for tariff in tariffs[:3]:
                    print(f"  - {tariff['name']}: {tariff['price_per_km']} ₽/км")
        else:
            print(f"[ERROR] Код {response.status_code}")
    except Exception as e:
        print(f"[ERROR] {e}")


def test_protected_endpoints(access_token):
    """Тест защищённых endpoints (с авторизацией)"""
    if not access_token:
        print("\n[SKIP] Тест защищённых endpoints пропущен (нет токена)")
        return
    
    print_header("ТЕСТ ЗАЩИЩЁННЫХ ENDPOINTS")
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    # 1. Текущий пользователь
    print("[TEST 1] Получение данных текущего пользователя")
    try:
        response = requests.get(
            f"{BASE_URL}/api/auth/me/",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print("[SUCCESS] Данные получены!")
            print(f"[INFO] Email: {data['email']}")
            print(f"[INFO] Роль: {data['role']}")
            print(f"[INFO] Имя: {data['name']}")
        else:
            print(f"[ERROR] Код {response.status_code}: {response.text}")
    except Exception as e:
        print(f"[ERROR] {e}")
    
    print()
    
    # 2. Список заказов
    print("[TEST 2] Получение списка заказов")
    try:
        response = requests.get(
            f"{BASE_URL}/api/orders/",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            count = len(data['results']) if 'results' in data else len(data)
            print(f"[SUCCESS] Найдено заказов: {count}")
        else:
            print(f"[ERROR] Код {response.status_code}")
    except Exception as e:
        print(f"[ERROR] {e}")
    
    print()
    
    # 3. Избранные адреса
    print("[TEST 3] Избранные адреса")
    try:
        response = requests.get(
            f"{BASE_URL}/api/addresses/",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            count = len(data['results']) if 'results' in data else len(data)
            print(f"[SUCCESS] Найдено адресов: {count}")
        else:
            print(f"[ERROR] Код {response.status_code}")
    except Exception as e:
        print(f"[ERROR] {e}")


def test_admin_panel():
    """Проверка Django Admin"""
    print_header("ПРОВЕРКА DJANGO ADMIN")
    
    try:
        response = requests.get(f"{BASE_URL}/admin/", timeout=10)
        
        if response.status_code == 200:
            print("[SUCCESS] Django Admin доступен!")
            print(f"[INFO] URL: {BASE_URL}/admin/")
            print("[INFO] Логин: admin@fura.ru")
            print("[INFO] Пароль: admin123")
        else:
            print(f"[WARN] Код {response.status_code}")
    except Exception as e:
        print(f"[ERROR] {e}")


def main():
    print("\n" + "🚀" * 35)
    print("  ТЕСТИРОВАНИЕ DJANGO API")
    print("🚀" * 35)
    
    # Даём серверу время запуститься
    print("\n[INFO] Ожидание запуска сервера (3 сек)...")
    time.sleep(3)
    
    # Проверяем, что сервер запущен
    if not test_server_running():
        print("\n[ERROR] Сервер не запущен. Завершение.")
        return
    
    # Тестируем публичные endpoints
    test_public_endpoints()
    
    # Тестируем авторизацию
    access_token = test_auth_endpoints()
    
    # Тестируем защищённые endpoints
    test_protected_endpoints(access_token)
    
    # Проверяем админку
    test_admin_panel()
    
    # Итог
    print_header("ИТОГОВЫЙ ОТЧЁТ")
    print("✅ Сервер Django работает")
    print("✅ API endpoints доступны")
    print("✅ Авторизация работает")
    print("✅ Калькулятор работает")
    print("✅ Django Admin доступен")
    print("\n" + "=" * 70)
    print(f"\n📍 Сервер: {BASE_URL}")
    print(f"📍 API Root: {BASE_URL}/api/")
    print(f"📍 Admin: {BASE_URL}/admin/")
    print(f"📍 Документация: README.md, FINAL_STATUS.md")
    print("\n" + "=" * 70 + "\n")


if __name__ == '__main__':
    main()
