import os
import requests
from typing import Dict, List, Optional
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()


class GeminiService:
    def __init__(self):
        api_key = os.getenv('GEMINI_API_KEY')
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-pro')
        else:
            self.model = None

    def optimize_load(self, trucks: List[Dict], orders: List[Dict], custom_prompt: str = "") -> str:
        if not self.model:
            return "AI-ассистент недоступен. Укажите GEMINI_API_KEY в .env файле."

        prompt = f"""
Ты — эксперт по логистике грузоперевозок. 

Данные о транспорте:
{self._format_trucks(trucks)}

Данные о заказах:
{self._format_orders(orders)}

Задача: {custom_prompt if custom_prompt else "Оптимально распредели грузы по машинам, учитывая направления, грузоподъёмность и объём."}

Дай краткую рекомендацию с конкретными действиями. Укажи, какие заказы загрузить в какие машины и почему это оптимально.
"""

        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Ошибка при обращении к AI: {str(e)}"

    def _format_trucks(self, trucks: List[Dict]) -> str:
        result = []
        for truck in trucks:
            result.append(
                f"- {truck.get('plate', 'N/A')}: {truck.get('brand', '')} {truck.get('model', '')}, "
                f"грузоподъёмность {truck.get('capacity_kg', 0)} кг, объём {truck.get('capacity_m3', 0)} м³"
            )
        return '\n'.join(result)

    def _format_orders(self, orders: List[Dict]) -> str:
        result = []
        for order in orders:
            result.append(
                f"- Заказ #{order.get('id', 'N/A')}: {order.get('weight', 0)} кг, "
                f"{order.get('volume', 0)} м³, направление: {order.get('destination', 'N/A')}"
            )
        return '\n'.join(result)


class YandexMapsService:
    def __init__(self):
        self.api_key = os.getenv('YANDEX_MAPS_API_KEY', '')
        self.geocode_url = 'https://geocode-maps.yandex.ru/1.x/'
        self.route_url = 'https://api.routing.yandex.net/v2/route'

    def geocode(self, address: str) -> Optional[Dict]:
        if not self.api_key:
            return None

        params = {
            'apikey': self.api_key,
            'geocode': address,
            'format': 'json',
            'lang': 'ru_RU'
        }

        try:
            response = requests.get(self.geocode_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            geo_object = data['response']['GeoObjectCollection']['featureMember']
            if geo_object:
                point = geo_object[0]['GeoObject']['Point']['pos']
                lng, lat = point.split()
                return {'lat': float(lat), 'lng': float(lng)}
        except Exception as e:
            print(f"Ошибка геокодирования: {e}")
            return None

    def calculate_route(self, points: List[str]) -> Optional[Dict]:
        if not self.api_key or len(points) < 2:
            return None

        coordinates = []
        for point in points:
            coords = self.geocode(point)
            if coords:
                coordinates.append(f"{coords['lng']},{coords['lat']}")

        if len(coordinates) < 2:
            return None

        try:
            waypoints = '|'.join(coordinates)
            params = {
                'apikey': self.api_key,
                'rll': waypoints,
                'mode': 'truck',
                'rtl': 'json'
            }

            response = requests.get(self.route_url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()

            if 'route' in data:
                route = data['route']
                distance_km = route['distance']['value'] / 1000
                duration_hours = route['duration']['value'] / 3600
                
                loading_time = len(points) * 3
                total_eta = duration_hours + loading_time

                return {
                    'distance_km': round(distance_km, 2),
                    'duration_hours': round(duration_hours, 2),
                    'loading_time_hours': loading_time,
                    'total_eta_hours': round(total_eta, 2),
                    'coordinates': coordinates
                }
        except Exception as e:
            print(f"Ошибка расчёта маршрута: {e}")
            return None

    def calculate_distance(self, origin: str, destination: str) -> Optional[float]:
        route = self.calculate_route([origin, destination])
        if route:
            return route['distance_km']
        return None
