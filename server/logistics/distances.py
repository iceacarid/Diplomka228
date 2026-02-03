# -*- coding: utf-8 -*-
"""
Справочник расстояний между городами России
Используется как fallback при недоступности Yandex Maps API
"""

# Расстояния в километрах (по автодорогам)
# Данные взяты из открытых источников
CITY_DISTANCES = {
    # Москва
    ('Москва', 'Санкт-Петербург'): 712,
    ('Москва', 'Казань'): 797,
    ('Москва', 'Нижний Новгород'): 441,
    ('Москва', 'Екатеринбург'): 1778,
    ('Москва', 'Новосибирск'): 3303,
    ('Москва', 'Владивосток'): 9077,
    ('Москва', 'Ростов-на-Дону'): 1076,
    ('Москва', 'Краснодар'): 1350,
    ('Москва', 'Воронеж'): 515,
    ('Москва', 'Ярославль'): 282,
    ('Москва', 'Тула'): 193,
    ('Москва', 'Рязань'): 196,
    
    # Санкт-Петербург
    ('Санкт-Петербург', 'Казань'): 1267,
    ('Санкт-Петербург', 'Нижний Новгород'): 1003,
    ('Санкт-Петербург', 'Екатеринбург'): 2415,
    ('Санкт-Петербург', 'Мурманск'): 1364,
    ('Санкт-Петербург', 'Калининград'): 940,
    
    # Казань
    ('Казань', 'Нижний Новгород'): 396,
    ('Казань', 'Екатеринбург'): 1046,
    ('Казань', 'Самара'): 362,
    ('Казань', 'Уфа'): 525,
    
    # Другие крупные города
    ('Нижний Новгород', 'Екатеринбург'): 1165,
    ('Екатеринбург', 'Новосибирск'): 1765,
    ('Новосибирск', 'Владивосток'): 5777,
    ('Ростов-на-Дону', 'Краснодар'): 286,
}


def get_distance(origin: str, destination: str) -> float:
    """
    Получить расстояние между городами из справочника
    
    Args:
        origin: Город отправления
        destination: Город назначения
        
    Returns:
        Расстояние в километрах
        
    Note:
        Если маршрут не найден в справочнике, возвращается 500 км
    """
    # Нормализуем названия городов (убираем лишние пробелы, приводим к единому виду)
    origin_clean = origin.strip()
    destination_clean = destination.strip()
    
    # Пробуем найти прямой маршрут
    key = (origin_clean, destination_clean)
    if key in CITY_DISTANCES:
        return float(CITY_DISTANCES[key])
    
    # Пробуем обратный маршрут
    reverse_key = (destination_clean, origin_clean)
    if reverse_key in CITY_DISTANCES:
        return float(CITY_DISTANCES[reverse_key])
    
    # Если не найдено - возвращаем среднее типичное расстояние
    return 500.0


def get_travel_time(distance_km: float, avg_speed_kmh: float = 70) -> float:
    """
    Рассчитать время в пути
    
    Args:
        distance_km: Расстояние в километрах
        avg_speed_kmh: Средняя скорость грузовика (по умолчанию 70 км/ч)
        
    Returns:
        Время в пути в часах
    """
    return distance_km / avg_speed_kmh


def calculate_eta(origin: str, destination: str, loading_points: int = 2) -> dict:
    """
    Рассчитать полное ETA с учётом погрузки/разгрузки
    
    Args:
        origin: Город отправления
        destination: Город назначения
        loading_points: Количество точек погрузки/разгрузки
        
    Returns:
        Словарь с данными о маршруте
    """
    distance = get_distance(origin, destination)
    travel_time = get_travel_time(distance)
    loading_time = loading_points * 3  # 3 часа на точку согласно ТЗ
    total_eta = travel_time + loading_time
    
    return {
        'distance_km': round(distance, 2),
        'travel_time_hours': round(travel_time, 2),
        'loading_time_hours': loading_time,
        'total_eta_hours': round(total_eta, 2),
        'source': 'distance_table',  # указываем источник данных
    }


# Примеры использования (для тестирования)
if __name__ == '__main__':
    import sys
    
    # Устанавливаем кодировку UTF-8 для Windows
    if sys.platform == "win32":
        sys.stdout.reconfigure(encoding='utf-8')
    
    # Тест 1: Известный маршрут
    print("Тест 1: Москва -> Санкт-Петербург")
    result = calculate_eta('Москва', 'Санкт-Петербург')
    print(f"  Расстояние: {result['distance_km']} км")
    print(f"  Время в пути: {result['travel_time_hours']} ч")
    print(f"  ETA: {result['total_eta_hours']} ч\n")
    
    # Тест 2: Обратный маршрут
    print("Тест 2: Казань -> Москва (обратный)")
    result = calculate_eta('Казань', 'Москва')
    print(f"  Расстояние: {result['distance_km']} км\n")
    
    # Тест 3: Неизвестный маршрут
    print("Тест 3: Тамбов -> Москва (неизвестный)")
    result = calculate_eta('Тамбов', 'Москва')
    print(f"  Расстояние (fallback): {result['distance_km']} км")
    print(f"  Источник: {result['source']}")
