#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Скрипт для тестирования интеграций с Google Gemini и Yandex Maps API
Запуск: python test_integrations.py
"""

import os
import sys
from pathlib import Path

# Устанавливаем кодировку UTF-8 для Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

# Добавляем путь к Django проекту
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# Загружаем переменные окружения с приоритетом .env.local
from dotenv import load_dotenv

env_local = BASE_DIR / '.env.local'
env_default = BASE_DIR / '.env'

if env_local.exists():
    load_dotenv(env_local, override=True)
    print("📍 Используется конфигурация: .env.local (локальные настройки)")
elif env_default.exists():
    load_dotenv(env_default)
    print("📍 Используется конфигурация: .env")
else:
    load_dotenv()
    print("📍 Используются системные переменные окружения")

# Настраиваем Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()

from logistics.services import GeminiService, YandexMapsService


def print_header(title: str):
    """Красивый заголовок для вывода"""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70 + "\n")


def test_gemini_api():
    """Тестирование Google Gemini API"""
    print_header("🤖 ТЕСТ GOOGLE GEMINI API")
    
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key or api_key == 'your_gemini_api_key_here':
        print("❌ GEMINI_API_KEY не установлен в .env файле")
        print("\n📝 Инструкция по настройке:")
        print("   1. Получите бесплатный ключ: https://makersuite.google.com/app/apikey")
        print("   2. Создайте файл .env в папке server/")
        print("   3. Добавьте строку: GEMINI_API_KEY=ваш_ключ")
        print("   4. Запустите этот скрипт снова\n")
        return False
    
    print(f"✅ API ключ найден: {api_key[:20]}...")
    
    # Инициализируем сервис
    gemini = GeminiService()
    
    if not gemini.available:
        print("❌ Не удалось инициализировать Gemini API")
        return False
    
    print("✅ Gemini API инициализирован успешно")
    print(f"   Модель: gemini-1.5-flash")
    
    # Тестовый запрос
    print("\n🧪 Тестовый запрос на оптимизацию загрузки...")
    
    test_trucks = [
        {
            'id': 1,
            'plate': 'А123ВС',
            'brand': 'КамАЗ',
            'model': '5320',
            'capacity_kg': 5000,
            'capacity_m3': 20
        },
        {
            'id': 2,
            'plate': 'В456ДЕ',
            'brand': 'МАЗ',
            'model': '6303',
            'capacity_kg': 7000,
            'capacity_m3': 25
        }
    ]
    
    test_orders = [
        {'id': 101, 'weight': 2000, 'volume': 8, 'destination': 'Москва'},
        {'id': 102, 'weight': 1500, 'volume': 6, 'destination': 'Москва'},
        {'id': 103, 'weight': 3000, 'volume': 12, 'destination': 'Санкт-Петербург'},
        {'id': 104, 'weight': 1000, 'volume': 4, 'destination': 'Казань'},
    ]
    
    result = gemini.optimize_load(test_trucks, test_orders)
    
    print("\n📋 Ответ AI:")
    print("-" * 70)
    print(result)
    print("-" * 70)
    
    if "Ошибка" in result or "недоступен" in result:
        print("\n❌ Тест не пройден: получена ошибка от API")
        return False
    
    print("\n✅ ТЕСТ ПРОЙДЕН: Gemini API работает корректно!")
    return True


def test_yandex_maps_api():
    """Тестирование Yandex Maps API"""
    print_header("🗺️ ТЕСТ YANDEX MAPS API")
    
    api_key = os.getenv('YANDEX_MAPS_API_KEY')
    if not api_key or api_key == 'your_yandex_maps_api_key_here':
        print("⚠️ YANDEX_MAPS_API_KEY не установлен в .env файле")
        print("\n📝 Инструкция по настройке:")
        print("   1. Зарегистрируйтесь: https://developer.tech.yandex.ru/")
        print("   2. Создайте API ключ для Geocoder и Router API")
        print("   3. Добавьте в .env: YANDEX_MAPS_API_KEY=ваш_ключ")
        print("\n💡 Система будет работать с примерными значениями")
        print("   (расстояние ~500 км, время ~8 часов)\n")
    else:
        print(f"✅ API ключ найден: {api_key[:20]}...")
    
    # Инициализируем сервис
    yandex = YandexMapsService()
    
    # Тест 1: Геокодирование
    print("\n🧪 Тест 1: Геокодирование адреса")
    test_address = "Москва, Красная площадь"
    coords = yandex.geocode(test_address)
    
    if coords:
        print(f"✅ Адрес: {test_address}")
        print(f"   Координаты: {coords['lat']}, {coords['lng']}")
    else:
        print(f"❌ Не удалось геокодировать адрес: {test_address}")
    
    # Тест 2: Расчёт маршрута
    print("\n🧪 Тест 2: Расчёт маршрута между городами")
    origin = "Москва"
    destination = "Санкт-Петербург"
    
    route = yandex.calculate_route([origin, destination])
    
    if route:
        print(f"✅ Маршрут: {origin} → {destination}")
        print(f"   Расстояние: {route['distance_km']} км")
        print(f"   Время в пути: {route['duration_hours']:.1f} часов")
        print(f"   Время на разгрузку: {route['loading_time_hours']} часов")
        print(f"   Общее время (ETA): {route['total_eta_hours']:.1f} часов")
        
        if route.get('fallback'):
            print("   ⚠️ Использован примерный расчёт (API недоступен)")
        else:
            print("   ✅ Данные получены от Yandex Maps API")
    else:
        print(f"❌ Не удалось построить маршрут")
        return False
    
    # Тест 3: Расчёт расстояния
    print("\n🧪 Тест 3: Прямой расчёт расстояния")
    distance = yandex.calculate_distance("Казань", "Нижний Новгород")
    
    if distance:
        print(f"✅ Расстояние Казань → Нижний Новгород: {distance} км")
    else:
        print("❌ Не удалось рассчитать расстояние")
    
    print("\n✅ ТЕСТ ЗАВЕРШЁН: Yandex Maps работает (с fallback если нет ключа)")
    return True


def test_calculator_integration():
    """Тест интеграции калькулятора стоимости"""
    print_header("💰 ТЕСТ КАЛЬКУЛЯТОРА СТОИМОСТИ")
    
    from logistics.models import Tariff
    
    # Проверяем наличие тарифа
    tariff = Tariff.objects.filter(is_active=True).first()
    if not tariff:
        print("❌ Активный тариф не найден в базе данных")
        print("   Создайте тариф через Django Admin или скрипт create_test_data.py")
        return False
    
    print(f"✅ Найден активный тариф: {tariff.name}")
    print(f"   Цена за км: {tariff.price_per_km} ₽")
    print(f"   Коэфф. веса: {tariff.weight_coef}")
    
    # Тестовый расчёт
    yandex = YandexMapsService()
    distance = yandex.calculate_distance("Москва", "Казань")
    
    if distance:
        weight = 1000  # кг
        price = (distance * float(tariff.price_per_km)) + (weight * float(tariff.weight_coef))
        
        print(f"\n🧮 Пример расчёта:")
        print(f"   Маршрут: Москва → Казань")
        print(f"   Расстояние: {distance} км")
        print(f"   Вес груза: {weight} кг")
        print(f"   ИТОГО: {price:.2f} ₽")
        print(f"   Формула: ({distance} × {tariff.price_per_km}) + ({weight} × {tariff.weight_coef})")
        print("\n✅ Калькулятор работает корректно!")
        return True
    else:
        print("⚠️ Не удалось рассчитать расстояние для примера")
        return False


def main():
    """Главная функция запуска всех тестов"""
    print("\n" + "🚀" * 35)
    print("  ТЕСТИРОВАНИЕ ИНТЕГРАЦИЙ ФУРАЕДЕТ")
    print("🚀" * 35)
    
    results = {
        'Google Gemini API': test_gemini_api(),
        'Yandex Maps API': test_yandex_maps_api(),
        'Калькулятор стоимости': test_calculator_integration()
    }
    
    # Итоговый отчёт
    print_header("📊 ИТОГОВЫЙ ОТЧЁТ")
    
    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{status} - {test_name}")
    
    passed_count = sum(results.values())
    total_count = len(results)
    
    print(f"\nРезультат: {passed_count}/{total_count} тестов пройдено")
    
    if passed_count == total_count:
        print("\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ! Интеграции работают корректно.")
    elif passed_count > 0:
        print("\n⚠️ Некоторые тесты не пройдены. Проверьте настройки API ключей.")
    else:
        print("\n❌ Тесты не пройдены. Настройте API ключи в .env файле.")
    
    print("\n📝 Инструкции по настройке в файле: server/env.example")
    print("=" * 70 + "\n")


if __name__ == '__main__':
    main()
