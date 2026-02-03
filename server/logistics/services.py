import os
import requests
from typing import Dict, List, Optional
from pathlib import Path
from google import genai
from google.genai import types
from openai import OpenAI
from dotenv import load_dotenv
from .distances import get_distance as get_table_distance, calculate_eta as calculate_table_eta
import urllib3

# Отключаем предупреждения о небезопасных SSL запросах (для GigaChat OAuth)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Загружаем .env.local с приоритетом (для безопасного хранения API ключей)
BASE_DIR = Path(__file__).resolve().parent.parent
env_local = BASE_DIR / '.env.local'
env_default = BASE_DIR / '.env'

if env_local.exists():
    load_dotenv(env_local, override=True)
elif env_default.exists():
    load_dotenv(env_default)
else:
    load_dotenv()  # Попытка найти .env в текущей директории


class GeminiService:
    """Сервис для работы с Google Gemini AI (новый API google-genai)"""
    
    def __init__(self):
        api_key = os.getenv('GEMINI_API_KEY')
        if api_key and api_key != 'your_gemini_api_key_here':
            try:
                # Новый API google-genai (версия 1.61.0)
                self.client = genai.Client(api_key=api_key)
                # Используем модель Gemini 2.0 Flash (2026)
                # Подтверждено работающей через тесты
                self.model_name = 'gemini-2.0-flash'
                self.available = True
            except Exception as e:
                print(f"Ошибка инициализации Gemini API: {e}")
                self.client = None
                self.available = False
        else:
            self.client = None
            self.available = False

    def optimize_load(self, trucks: List[Dict], orders: List[Dict], custom_prompt: str = "") -> str:
        """
        Оптимизация распределения грузов по транспорту с помощью AI
        
        Args:
            trucks: Список доступного транспорта
            orders: Список заказов для распределения
            custom_prompt: Дополнительные инструкции для AI
            
        Returns:
            Текстовая рекомендация по распределению грузов
        """
        if not self.available:
            return (
                "⚠️ AI-ассистент недоступен.\n\n"
                "Для активации Google Gemini API:\n"
                "1. Получите бесплатный API ключ на https://makersuite.google.com/app/apikey\n"
                "2. Добавьте в файл server/.env строку: GEMINI_API_KEY=ваш_ключ\n"
                "3. Перезапустите сервер Django\n\n"
                "До тех пор система работает в ручном режиме распределения грузов."
            )

        prompt = f"""
Ты — эксперт по логистике грузоперевозок с опытом работы в ФураЕдет. 

ДОСТУПНЫЙ ТРАНСПОРТ:
{self._format_trucks(trucks)}

ЗАКАЗЫ ДЛЯ РАСПРЕДЕЛЕНИЯ:
{self._format_orders(orders)}

ЗАДАЧА: {custom_prompt if custom_prompt else "Оптимально распредели грузы по машинам, учитывая направления доставки, грузоподъёмность и объём кузова."}

ТРЕБОВАНИЯ:
1. Максимально загрузи каждую машину (но не превышай лимиты)
2. Группируй заказы по направлениям для экономии топлива
3. Учитывай приоритет: сначала вес, потом объём
4. Укажи конкретные номера заказов для каждой машины

Формат ответа:
🚛 Машина [госномер]:
  - Загрузить заказы: #ID1, #ID2, #ID3
  - Общий вес: X кг (Y% загрузки)
  - Общий объём: X м³ (Y% загрузки)
  - Маршрут: Город1 → Город2 → Город3
  - Обоснование: почему эта комбинация оптимальна

💡 Экономия: укажи, сколько рейсов экономим, какие выгоды получаем
"""

        try:
            # Новый синтаксис google-genai
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7,  # Баланс между креативностью и точностью
                    top_p=0.9,
                    top_k=40,
                    max_output_tokens=2048,
                )
            )
            
            if response and response.text:
                return response.text
            else:
                return "⚠️ AI не смог сгенерировать ответ. Попробуйте упростить запрос."
                
        except Exception as e:
            error_msg = str(e)
            error_type = type(e).__name__
            
            # Детальная обработка ошибок квоты
            if 'RESOURCE_EXHAUSTED' in error_msg or '429' in error_msg or 'quota' in error_msg.lower():
                # Пробуем предложить простое распределение как fallback
                fallback_recommendation = self._simple_distribution_fallback(trucks, orders)
                
                return (
                    "⚠️ Превышен лимит запросов к Gemini API (квота исчерпана).\n\n"
                    "📊 Лимиты бесплатного тарифа:\n"
                    "   • 15 запросов в минуту\n"
                    "   • 1500 запросов в день\n\n"
                    "💡 Решения:\n"
                    "   1. Подождите 1 минуту и попробуйте снова\n"
                    "   2. Активируйте биллинг в Google AI Studio для увеличения лимитов\n"
                    "   3. Используйте простое распределение ниже\n\n"
                    "──────────────────────────────────────────────────\n"
                    "📋 ПРОСТОЕ РАСПРЕДЕЛЕНИЕ (без AI):\n"
                    "──────────────────────────────────────────────────\n\n"
                    f"{fallback_recommendation}\n\n"
                    "──────────────────────────────────────────────────\n"
                    "ℹ️ Это базовое распределение по весу и направлению.\n"
                    "Для оптимального распределения используйте AI (после восстановления квоты)."
                )
            elif 'API_KEY_INVALID' in error_msg or 'API key' in error_msg or '401' in error_msg:
                return (
                    "❌ Ошибка: Неверный API ключ Google Gemini.\n\n"
                    "Проверьте:\n"
                    "1. Файл server/.env.local содержит: GEMINI_API_KEY=ваш_ключ\n"
                    "2. Ключ активен на https://makersuite.google.com/app/apikey\n"
                    "3. Перезапустите сервер после добавления ключа"
                )
            elif '403' in error_msg or 'PERMISSION_DENIED' in error_msg:
                return (
                    "❌ Доступ запрещён к Gemini API.\n\n"
                    "Проверьте:\n"
                    "1. API ключ активен и не заблокирован\n"
                    "2. У ключа есть права на использование Gemini API\n"
                    "3. Модель gemini-2.0-flash доступна для вашего ключа"
                )
            else:
                # Для других ошибок показываем детали
                return (
                    f"❌ Ошибка при обращении к Gemini AI:\n\n"
                    f"Тип ошибки: {error_type}\n"
                    f"Сообщение: {error_msg[:300]}\n\n"
                    f"💡 Попробуйте:\n"
                    f"1. Проверить интернет-соединение\n"
                    f"2. Подождать несколько секунд и повторить\n"
                    f"3. Проверить статус Gemini API на https://status.cloud.google.com/"
                )

    def _simple_distribution_fallback(self, trucks: List[Dict], orders: List[Dict]) -> str:
        """
        Простое распределение заказов без AI (fallback при недоступности Gemini)
        Алгоритм: жадный - распределяем заказы по весу, учитывая грузоподъёмность
        """
        if not trucks or not orders:
            return "❌ Недостаточно данных для распределения"
        
        # Копируем данные для работы
        available_trucks = []
        for truck in trucks:
            available_trucks.append({
                'id': truck.get('id', 'N/A'),
                'plate': truck.get('plate', f"Грузовик #{truck.get('id', '?')}"),
                'model': truck.get('model', truck.get('brand', '') + ' ' + truck.get('model', '')),
                'capacity_kg': truck.get('capacity', truck.get('capacity_kg', 20000)),
                'capacity_m3': truck.get('capacity_m3', 50),
                'location': truck.get('location', 'Не указано'),
                'current_weight': 0,
                'current_volume': 0,
                'assigned_orders': []
            })
        
        unassigned_orders = []
        for order in orders:
            unassigned_orders.append({
                'id': order.get('id', 'N/A'),
                'weight': order.get('weight', 0),
                'volume': order.get('volume', order.get('cargo_volume', 0)),
                'origin': order.get('origin', 'Не указано'),
                'destination': order.get('destination', 'Не указано'),
                'cargo_type': order.get('cargo_type', 'Не указано')
            })
        
        # Сортируем заказы по весу (от большего к меньшему)
        unassigned_orders.sort(key=lambda x: x['weight'], reverse=True)
        
        # Распределяем заказы
        for order in unassigned_orders:
            assigned = False
            for truck in available_trucks:
                # Проверяем, поместится ли заказ
                new_weight = truck['current_weight'] + order['weight']
                new_volume = truck['current_volume'] + order['volume']
                
                if (new_weight <= truck['capacity_kg'] and 
                    new_volume <= truck['capacity_m3']):
                    truck['current_weight'] = new_weight
                    truck['current_volume'] = new_volume
                    truck['assigned_orders'].append(order)
                    assigned = True
                    break
            
            if not assigned:
                # Заказ не поместился ни в один грузовик
                pass
        
        # Формируем результат
        result_lines = []
        total_assigned = 0
        
        for truck in available_trucks:
            if truck['assigned_orders']:
                order_ids = ', '.join([f"#{o['id']}" for o in truck['assigned_orders']])
                weight_pct = (truck['current_weight'] / truck['capacity_kg'] * 100) if truck['capacity_kg'] > 0 else 0
                volume_pct = (truck['current_volume'] / truck['capacity_m3'] * 100) if truck['capacity_m3'] > 0 else 0
                
                destinations = list(set([o['destination'] for o in truck['assigned_orders']]))
                route = ' → '.join(destinations) if destinations else 'Не указано'
                
                result_lines.append(
                    f"🚛 {truck['plate']} ({truck['model']}):\n"
                    f"   • Заказы: {order_ids}\n"
                    f"   • Вес: {truck['current_weight']:.0f} кг ({weight_pct:.0f}% загрузки)\n"
                    f"   • Объём: {truck['current_volume']:.1f} м³ ({volume_pct:.0f}% загрузки)\n"
                    f"   • Маршрут: {route}\n"
                )
                total_assigned += len(truck['assigned_orders'])
        
        # Не распределённые заказы
        unassigned = []
        for truck in available_trucks:
            for order in truck['assigned_orders']:
                if order in unassigned_orders:
                    unassigned_orders.remove(order)
        
        if unassigned_orders:
            unassigned_ids = ', '.join([f"#{o['id']}" for o in unassigned_orders])
            result_lines.append(f"\n⚠️ Не распределены заказы: {unassigned_ids}")
            result_lines.append("   (превышают грузоподъёмность или объём доступного транспорта)")
        
        result_lines.append(f"\n📊 Итого: распределено {total_assigned} из {len(orders)} заказов")
        
        return '\n'.join(result_lines)
    
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


class DeepSeekService:
    """Сервис для работы с DeepSeek AI (бесплатный, без ограничений квоты)"""
    
    def __init__(self):
        api_key = os.getenv('DEEPSEEK_API_KEY')
        if api_key and api_key != 'your_deepseek_api_key_here':
            try:
                # DeepSeek использует OpenAI-совместимый API
                self.client = OpenAI(
                    api_key=api_key,
                    base_url='https://api.deepseek.com'  # DeepSeek endpoint
                )
                self.model_name = 'deepseek-chat'  # Основная модель DeepSeek
                self.available = True
            except Exception as e:
                print(f"Ошибка инициализации DeepSeek API: {e}")
                self.client = None
                self.available = False
        else:
            self.client = None
            self.available = False
    
    def optimize_load(self, trucks: List[Dict], orders: List[Dict], custom_prompt: str = "") -> str:
        """
        Оптимизация распределения грузов по транспорту с помощью DeepSeek AI
        """
        if not self.available:
            return None  # Возвращаем None чтобы вызвать fallback
        
        prompt = f"""
Ты — эксперт по логистике грузоперевозок с опытом работы в ФураЕдет. 

ДОСТУПНЫЙ ТРАНСПОРТ:
{self._format_trucks(trucks)}

ЗАКАЗЫ ДЛЯ РАСПРЕДЕЛЕНИЯ:
{self._format_orders(orders)}

ЗАДАЧА: {custom_prompt if custom_prompt else "Оптимально распредели грузы по машинам, учитывая направления доставки, грузоподъёмность и объём кузова."}

ТРЕБОВАНИЯ:
1. Максимально загрузи каждую машину (но не превышай лимиты)
2. Группируй заказы по направлениям для экономии топлива
3. Учитывай приоритет: сначала вес, потом объём
4. Укажи конкретные номера заказов для каждой машины

Формат ответа:
🚛 Машина [госномер]:
  - Загрузить заказы: #ID1, #ID2, #ID3
  - Общий вес: X кг (Y% загрузки)
  - Общий объём: X м³ (Y% загрузки)
  - Маршрут: Город1 → Город2 → Город3
  - Обоснование: почему эта комбинация оптимальна

💡 Экономия: укажи, сколько рейсов экономим, какие выгоды получаем
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "Ты эксперт по логистике грузоперевозок. Отвечай на русском языке."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2048
            )
            
            if response and response.choices and len(response.choices) > 0:
                return response.choices[0].message.content
            else:
                return None
                
        except Exception as e:
            error_msg = str(e)
            print(f"Ошибка DeepSeek API: {error_msg}")
            # Если ошибка - возвращаем None для fallback
            return None
    
    def _format_trucks(self, trucks: List[Dict]) -> str:
        result = []
        for truck in trucks:
            result.append(
                f"- {truck.get('plate', 'N/A')}: {truck.get('brand', '')} {truck.get('model', '')}, "
                f"грузоподъёмность {truck.get('capacity', truck.get('capacity_kg', 0))} кг, "
                f"объём {truck.get('capacity_m3', 0)} м³"
            )
        return '\n'.join(result)
    
    def _format_orders(self, orders: List[Dict]) -> str:
        result = []
        for order in orders:
            result.append(
                f"- Заказ #{order.get('id', 'N/A')}: {order.get('weight', 0)} кг, "
                f"{order.get('volume', order.get('cargo_volume', 0))} м³, "
                f"направление: {order.get('origin', 'N/A')} → {order.get('destination', 'N/A')}"
            )
        return '\n'.join(result)


class GroqService:
    """Сервис для работы с Groq AI (бесплатный, очень быстрый, щедрые лимиты)"""
    
    def __init__(self):
        api_key = os.getenv('GROQ_API_KEY')
        if api_key and api_key != 'your_groq_api_key_here':
            try:
                # Groq использует OpenAI-совместимый API
                self.client = OpenAI(
                    api_key=api_key,
                    base_url='https://api.groq.com/openai/v1'  # Groq endpoint
                )
                self.model_name = 'llama-3.1-70b-versatile'  # Быстрая и качественная модель
                self.available = True
            except Exception as e:
                print(f"Ошибка инициализации Groq API: {e}")
                self.client = None
                self.available = False
        else:
            self.client = None
            self.available = False
    
    def optimize_load(self, trucks: List[Dict], orders: List[Dict], custom_prompt: str = "") -> str:
        """
        Оптимизация распределения грузов по транспорту с помощью Groq AI
        """
        if not self.available:
            return None
        
        prompt = f"""
Ты — эксперт по логистике грузоперевозок с опытом работы в ФураЕдет. 

ДОСТУПНЫЙ ТРАНСПОРТ:
{self._format_trucks(trucks)}

ЗАКАЗЫ ДЛЯ РАСПРЕДЕЛЕНИЯ:
{self._format_orders(orders)}

ЗАДАЧА: {custom_prompt if custom_prompt else "Оптимально распредели грузы по машинам, учитывая направления доставки, грузоподъёмность и объём кузова."}

ТРЕБОВАНИЯ:
1. Максимально загрузи каждую машину (но не превышай лимиты)
2. Группируй заказы по направлениям для экономии топлива
3. Учитывай приоритет: сначала вес, потом объём
4. Укажи конкретные номера заказов для каждой машины

Формат ответа:
🚛 Машина [госномер]:
  - Загрузить заказы: #ID1, #ID2, #ID3
  - Общий вес: X кг (Y% загрузки)
  - Общий объём: X м³ (Y% загрузки)
  - Маршрут: Город1 → Город2 → Город3
  - Обоснование: почему эта комбинация оптимальна

💡 Экономия: укажи, сколько рейсов экономим, какие выгоды получаем
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "Ты эксперт по логистике грузоперевозок. Отвечай на русском языке."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2048
            )
            
            if response and response.choices and len(response.choices) > 0:
                return response.choices[0].message.content
            else:
                return None
                
        except Exception as e:
            error_msg = str(e)
            print(f"Ошибка Groq API: {error_msg}")
            return None
    
    def _format_trucks(self, trucks: List[Dict]) -> str:
        result = []
        for truck in trucks:
            result.append(
                f"- {truck.get('plate', 'N/A')}: {truck.get('brand', '')} {truck.get('model', '')}, "
                f"грузоподъёмность {truck.get('capacity', truck.get('capacity_kg', 0))} кг, "
                f"объём {truck.get('capacity_m3', 0)} м³"
            )
        return '\n'.join(result)
    
    def _format_orders(self, orders: List[Dict]) -> str:
        result = []
        for order in orders:
            result.append(
                f"- Заказ #{order.get('id', 'N/A')}: {order.get('weight', 0)} кг, "
                f"{order.get('volume', order.get('cargo_volume', 0))} м³, "
                f"направление: {order.get('origin', 'N/A')} → {order.get('destination', 'N/A')}"
            )
        return '\n'.join(result)


class GrokService:
    """Сервис для работы с Grok AI от xAI (модель Илона Маска, OpenAI-совместимый API)"""
    
    def __init__(self):
        api_key = os.getenv('GROK_API_KEY')
        if api_key and api_key != 'your_grok_api_key_here':
            try:
                # Grok (xAI) использует OpenAI-совместимый API
                # Официальный endpoint: https://api.x.ai/v1
                self.client = OpenAI(
                    api_key=api_key,
                    base_url='https://api.x.ai/v1'  # Grok (xAI) endpoint
                )
                self.model_name = 'grok-beta'  # Основная модель Grok
                self.available = True
            except Exception as e:
                print(f"Ошибка инициализации Grok API: {e}")
                self.client = None
                self.available = False
        else:
            self.client = None
            self.available = False
    
    def optimize_load(self, trucks: List[Dict], orders: List[Dict], custom_prompt: str = "") -> str:
        """
        Оптимизация распределения грузов по транспорту с помощью Grok AI
        """
        if not self.available:
            return None
        
        prompt = f"""
Ты — эксперт по логистике грузоперевозок с опытом работы в ФураЕдет. 

ДОСТУПНЫЙ ТРАНСПОРТ:
{self._format_trucks(trucks)}

ЗАКАЗЫ ДЛЯ РАСПРЕДЕЛЕНИЯ:
{self._format_orders(orders)}

ЗАДАЧА: {custom_prompt if custom_prompt else "Оптимально распредели грузы по машинам, учитывая направления доставки, грузоподъёмность и объём кузова."}

ТРЕБОВАНИЯ:
1. Максимально загрузи каждую машину (но не превышай лимиты)
2. Группируй заказы по направлениям для экономии топлива
3. Учитывай приоритет: сначала вес, потом объём
4. Укажи конкретные номера заказов для каждой машины

Формат ответа:
🚛 Машина [госномер]:
  - Загрузить заказы: #ID1, #ID2, #ID3
  - Общий вес: X кг (Y% загрузки)
  - Общий объём: X м³ (Y% загрузки)
  - Маршрут: Город1 → Город2 → Город3
  - Обоснование: почему эта комбинация оптимальна

💡 Экономия: укажи, сколько рейсов экономим, какие выгоды получаем
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "Ты эксперт по логистике грузоперевозок. Отвечай на русском языке."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2048
            )
            
            if response and response.choices and len(response.choices) > 0:
                return response.choices[0].message.content
            else:
                return None
                
        except Exception as e:
            error_msg = str(e)
            print(f"Ошибка Groq API: {error_msg}")
            return None
    
    def _format_trucks(self, trucks: List[Dict]) -> str:
        result = []
        for truck in trucks:
            result.append(
                f"- {truck.get('plate', 'N/A')}: {truck.get('brand', '')} {truck.get('model', '')}, "
                f"грузоподъёмность {truck.get('capacity', truck.get('capacity_kg', 0))} кг, "
                f"объём {truck.get('capacity_m3', 0)} м³"
            )
        return '\n'.join(result)
    
    def _format_orders(self, orders: List[Dict]) -> str:
        result = []
        for order in orders:
            result.append(
                f"- Заказ #{order.get('id', 'N/A')}: {order.get('weight', 0)} кг, "
                f"{order.get('volume', order.get('cargo_volume', 0))} м³, "
                f"направление: {order.get('origin', 'N/A')} → {order.get('destination', 'N/A')}"
            )
        return '\n'.join(result)


class YandexGPTService:
    """Сервис для работы с YandexGPT (российский AI, бесплатный тариф, работает в России)"""
    
    def __init__(self):
        api_key = os.getenv('YANDEXGPT_API_KEY')
        folder_id = os.getenv('YANDEX_FOLDER_ID', '')  # Folder ID в Yandex Cloud
        if api_key and api_key != 'your_yandexgpt_api_key_here' and folder_id:
            try:
                self.api_key = api_key
                self.folder_id = folder_id
                self.base_url = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion'
                self.model_name = 'yandexgpt-lite'  # Бесплатная модель
                self.available = True
            except Exception as e:
                print(f"Ошибка инициализации YandexGPT API: {e}")
                self.available = False
        else:
            self.available = False
    
    def optimize_load(self, trucks: List[Dict], orders: List[Dict], custom_prompt: str = "") -> str:
        """
        Оптимизация распределения грузов по транспорту с помощью YandexGPT
        """
        if not self.available:
            return None
        
        prompt = f"""
Ты — эксперт по логистике грузоперевозок с опытом работы в ФураЕдет. 

ДОСТУПНЫЙ ТРАНСПОРТ:
{self._format_trucks(trucks)}

ЗАКАЗЫ ДЛЯ РАСПРЕДЕЛЕНИЯ:
{self._format_orders(orders)}

ЗАДАЧА: {custom_prompt if custom_prompt else "Оптимально распредели грузы по машинам, учитывая направления доставки, грузоподъёмность и объём кузова."}

ТРЕБОВАНИЯ:
1. Максимально загрузи каждую машину (но не превышай лимиты)
2. Группируй заказы по направлениям для экономии топлива
3. Учитывай приоритет: сначала вес, потом объём
4. Укажи конкретные номера заказов для каждой машины

Формат ответа:
🚛 Машина [госномер]:
  - Загрузить заказы: #ID1, #ID2, #ID3
  - Общий вес: X кг (Y% загрузки)
  - Общий объём: X м³ (Y% загрузки)
  - Маршрут: Город1 → Город2 → Город3
  - Обоснование: почему эта комбинация оптимальна

💡 Экономия: укажи, сколько рейсов экономим, какие выгоды получаем
"""
        
        try:
            headers = {
                'Authorization': f'Api-Key {self.api_key}',
                'Content-Type': 'application/json'
            }
            data = {
                'modelUri': f'gpt://{self.folder_id}/{self.model_name}',
                'completionOptions': {
                    'stream': False,
                    'temperature': 0.7,
                    'maxTokens': 2048
                },
                'messages': [
                    {
                        'role': 'system',
                        'text': 'Ты эксперт по логистике грузоперевозок. Отвечай на русском языке.'
                    },
                    {
                        'role': 'user',
                        'text': prompt
                    }
                ]
            }
            
            response = requests.post(self.base_url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            result = response.json()
            
            if result and 'result' in result and 'alternatives' in result['result']:
                if len(result['result']['alternatives']) > 0:
                    return result['result']['alternatives'][0]['message']['text']
            
            return None
                
        except Exception as e:
            error_msg = str(e)
            print(f"Ошибка YandexGPT API: {error_msg}")
            return None
    
    def _format_trucks(self, trucks: List[Dict]) -> str:
        result = []
        for truck in trucks:
            result.append(
                f"- {truck.get('plate', 'N/A')}: {truck.get('brand', '')} {truck.get('model', '')}, "
                f"грузоподъёмность {truck.get('capacity', truck.get('capacity_kg', 0))} кг, "
                f"объём {truck.get('capacity_m3', 0)} м³"
            )
        return '\n'.join(result)
    
    def _format_orders(self, orders: List[Dict]) -> str:
        result = []
        for order in orders:
            result.append(
                f"- Заказ #{order.get('id', 'N/A')}: {order.get('weight', 0)} кг, "
                f"{order.get('volume', order.get('cargo_volume', 0))} м³, "
                f"направление: {order.get('origin', 'N/A')} → {order.get('destination', 'N/A')}"
            )
        return '\n'.join(result)


class GigaChatService:
    """Сервис для работы с GigaChat (Сбер, российский AI, бесплатный тариф)"""
    
    def __init__(self):
        api_key = os.getenv('GIGACHAT_API_KEY')
        if api_key and api_key != 'your_gigachat_api_key_here':
            try:
                self.api_key = api_key  # Base64-кодированный client_id:client_secret
                self.auth_url = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth'
                self.base_url = 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions'
                self.model_name = 'GigaChat-Pro'  # Основная модель
                self.access_token = None
                self.available = True
            except Exception as e:
                print(f"Ошибка инициализации GigaChat API: {e}")
                self.available = False
        else:
            self.available = False
    
    def _get_access_token(self) -> Optional[str]:
        """
        Получает OAuth2 access token используя Base64-кодированный ключ
        Согласно официальной документации GigaChat API
        """
        if self.access_token:
            return self.access_token
        
        try:
            import uuid
            # Генерируем уникальный RqUID для каждого запроса
            rquid = str(uuid.uuid4())
            
            headers = {
                'Authorization': f'Basic {self.api_key}',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'RqUID': rquid  # Обязательное поле согласно документации
            }
            data = {
                'scope': 'GIGACHAT_API_PERS'
            }
            
            # GigaChat использует самоподписанный SSL сертификат, отключаем проверку для OAuth
            response = requests.post(
                self.auth_url,
                headers=headers,
                data=data,
                timeout=10,
                verify=False  # Отключаем проверку SSL для OAuth endpoint
            )
            response.raise_for_status()
            result = response.json()
            
            if 'access_token' in result:
                self.access_token = result['access_token']
                return self.access_token
            else:
                print(f"GigaChat: не получен access_token. Ответ: {result}")
                return None
                
        except requests.exceptions.RequestException as e:
            error_msg = str(e)
            print(f"Ошибка получения GigaChat access token: {error_msg}")
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_detail = e.response.json()
                    print(f"Детали ошибки: {error_detail}")
                except:
                    print(f"HTTP статус: {e.response.status_code}, текст: {e.response.text[:200]}")
            return None
        except Exception as e:
            error_msg = str(e)
            print(f"Неожиданная ошибка получения GigaChat access token: {error_msg}")
            return None
    
    def optimize_load(self, trucks: List[Dict], orders: List[Dict], custom_prompt: str = "") -> str:
        """
        Оптимизация распределения грузов по транспорту с помощью GigaChat
        """
        if not self.available:
            return None
        
        prompt = f"""
Ты — эксперт по логистике грузоперевозок с опытом работы в ФураЕдет. 

ДОСТУПНЫЙ ТРАНСПОРТ:
{self._format_trucks(trucks)}

ЗАКАЗЫ ДЛЯ РАСПРЕДЕЛЕНИЯ:
{self._format_orders(orders)}

ЗАДАЧА: {custom_prompt if custom_prompt else "Оптимально распредели грузы по машинам, учитывая направления доставки, грузоподъёмность и объём кузова."}

ТРЕБОВАНИЯ:
1. Максимально загрузи каждую машину (но не превышай лимиты)
2. Группируй заказы по направлениям для экономии топлива
3. Учитывай приоритет: сначала вес, потом объём
4. Укажи конкретные номера заказов для каждой машины

Формат ответа:
🚛 Машина [госномер]:
  - Загрузить заказы: #ID1, #ID2, #ID3
  - Общий вес: X кг (Y% загрузки)
  - Общий объём: X м³ (Y% загрузки)
  - Маршрут: Город1 → Город2 → Город3
  - Обоснование: почему эта комбинация оптимальна

💡 Экономия: укажи, сколько рейсов экономим, какие выгоды получаем
"""
        
        try:
            # Получаем access token
            access_token = self._get_access_token()
            if not access_token:
                print("GigaChat: не удалось получить access token")
                return None
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            data = {
                'model': self.model_name,
                'messages': [
                    {
                        'role': 'system',
                        'content': 'Ты эксперт по логистике грузоперевозок. Отвечай на русском языке.'
                    },
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ],
                'temperature': 0.7,
                'max_tokens': 2048
            }
            
            # GigaChat использует самоподписанный SSL сертификат, отключаем проверку
            response = requests.post(
                self.base_url, 
                headers=headers, 
                json=data, 
                timeout=30,
                verify=False  # Отключаем проверку SSL для GigaChat API
            )
            response.raise_for_status()
            result = response.json()
            
            if result and 'choices' in result and len(result['choices']) > 0:
                return result['choices'][0]['message']['content']
            
            print(f"GigaChat: неожиданный формат ответа: {result}")
            return None
                
        except requests.exceptions.HTTPError as e:
            error_msg = str(e)
            print(f"Ошибка HTTP GigaChat API: {error_msg}")
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_detail = e.response.json()
                    print(f"Детали ошибки: {error_detail}")
                except:
                    print(f"HTTP статус: {e.response.status_code}, текст: {e.response.text[:200]}")
            # Сбрасываем токен при ошибке, чтобы получить новый при следующем запросе
            self.access_token = None
            return None
        except requests.exceptions.RequestException as e:
            error_msg = str(e)
            print(f"Ошибка соединения с GigaChat API: {error_msg}")
            self.access_token = None
            return None
        except Exception as e:
            error_msg = str(e)
            print(f"Неожиданная ошибка GigaChat API: {error_msg}")
            self.access_token = None
            return None
    
    def _format_trucks(self, trucks: List[Dict]) -> str:
        result = []
        for truck in trucks:
            result.append(
                f"- {truck.get('plate', 'N/A')}: {truck.get('brand', '')} {truck.get('model', '')}, "
                f"грузоподъёмность {truck.get('capacity', truck.get('capacity_kg', 0))} кг, "
                f"объём {truck.get('capacity_m3', 0)} м³"
            )
        return '\n'.join(result)
    
    def _format_orders(self, orders: List[Dict]) -> str:
        result = []
        for order in orders:
            result.append(
                f"- Заказ #{order.get('id', 'N/A')}: {order.get('weight', 0)} кг, "
                f"{order.get('volume', order.get('cargo_volume', 0))} м³, "
                f"направление: {order.get('origin', 'N/A')} → {order.get('destination', 'N/A')}"
            )
        return '\n'.join(result)


class AIService:
    """Универсальный сервис AI - использует только GigaChat"""
    
    def __init__(self):
        self.gigachat = GigaChatService()  # Единственный AI сервис
        self._simple_distribution = GeminiService._simple_distribution_fallback
    
    def optimize_load(self, trucks: List[Dict], orders: List[Dict], custom_prompt: str = "") -> str:
        """
        Пробует распределить заказы через GigaChat AI, если недоступен - использует простой алгоритм
        """
        # Пробуем GigaChat
        if self.gigachat.available:
            try:
                result = self.gigachat.optimize_load(trucks, orders, custom_prompt)
                if result:
                    return (
                        "🤖 Рекомендация от GigaChat AI:\n\n"
                        f"{result}\n\n"
                        "──────────────────────────────────────────────────\n"
                        "ℹ️ Использован GigaChat (российский AI от Сбера)"
                    )
            except Exception as e:
                print(f"Ошибка GigaChat: {e}, используем простой алгоритм...")
        
        # Fallback: простой алгоритм
        fallback = GeminiService()._simple_distribution_fallback(trucks, orders)
        return (
            "⚠️ GigaChat AI недоступен. Использовано простое распределение:\n\n"
            f"{fallback}\n\n"
            "──────────────────────────────────────────────────\n"
            "💡 Для использования GigaChat AI:\n"
            "   1. Получите API ключ на https://developers.sber.ru/gigachat\n"
            "   2. Добавьте в .env.local: GIGACHAT_API_KEY=ваш_ключ\n"
            "   3. Перезапустите сервер"
        )


class YandexMapsService:
    """Сервис для работы с Yandex Maps API (геокодирование и маршрутизация)"""
    
    def __init__(self):
        self.api_key = os.getenv('YANDEX_MAPS_API_KEY', '')
        # Актуальные endpoints Yandex Maps API (2026)
        self.geocode_url = 'https://geocode-maps.yandex.ru/1.x/'
        # Для маршрутизации используем Router API
        self.route_url = 'https://api.routing.yandex.net/v2/route'
        self.available = bool(self.api_key and self.api_key != 'your_yandex_maps_api_key_here')

    def geocode(self, address: str) -> Optional[Dict]:
        """
        Геокодирование адреса (получение координат по адресу)
        
        Args:
            address: Адрес для геокодирования
            
        Returns:
            Словарь с координатами {'lat': float, 'lng': float} или None
        """
        if not self.available:
            print("⚠️ Yandex Maps API недоступен. Укажите YANDEX_MAPS_API_KEY в .env")
            # Возвращаем координаты Москвы по умолчанию
            return {'lat': 55.751244, 'lng': 37.618423}

        params = {
            'apikey': self.api_key,
            'geocode': address,
            'format': 'json',
            'lang': 'ru_RU',
            'results': 1  # Нам нужен только первый результат
        }

        try:
            response = requests.get(self.geocode_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            geo_objects = data.get('response', {}).get('GeoObjectCollection', {}).get('featureMember', [])
            if geo_objects:
                point = geo_objects[0]['GeoObject']['Point']['pos']
                lng, lat = point.split()
                return {'lat': float(lat), 'lng': float(lng)}
            else:
                print(f"Не найдены координаты для адреса: {address}")
                return None
                
        except requests.exceptions.Timeout:
            print(f"Таймаут при геокодировании адреса: {address}")
            return None
        except requests.exceptions.RequestException as e:
            print(f"Ошибка HTTP при геокодировании: {e}")
            return None
        except (KeyError, ValueError, IndexError) as e:
            print(f"Ошибка парсинга ответа геокодера: {e}")
            return None

    def calculate_route(self, points: List[str]) -> Optional[Dict]:
        """
        Расчёт маршрута через несколько точек
        
        Args:
            points: Список адресов (минимум 2)
            
        Returns:
            Словарь с данными маршрута или None
        """
        if len(points) < 2:
            print("Для расчёта маршрута нужно минимум 2 точки")
            return None
            
        if not self.available:
            print("⚠️ Yandex Maps API недоступен. Используется примерный расчёт.")
            # Fallback: примерный расчёт 500 км
            return {
                'distance_km': 500.0,
                'duration_hours': 8.0,
                'loading_time_hours': len(points) * 3,
                'total_eta_hours': 8.0 + (len(points) * 3),
                'coordinates': [],
                'fallback': True
            }

        # Геокодируем все точки
        coordinates = []
        for idx, point in enumerate(points):
            coords = self.geocode(point)
            if coords:
                coordinates.append(f"{coords['lng']},{coords['lat']}")
            else:
                print(f"Не удалось геокодировать точку #{idx + 1}: {point}")
                return None

        if len(coordinates) < 2:
            print("Недостаточно успешно геокодированных точек")
            return None

        try:
            # Строим маршрут через Router API
            waypoints = '|'.join(coordinates)
            params = {
                'apikey': self.api_key,
                'waypoints': waypoints,
                'mode': 'truck',  # Режим для грузовиков
                'rll': waypoints,  # Координаты точек
            }

            response = requests.get(self.route_url, params=params, timeout=20)
            response.raise_for_status()
            data = response.json()

            # Парсим ответ
            if 'route' in data and data['route']:
                route = data['route']
                # Расстояние в метрах, переводим в км
                distance_km = route.get('distance', {}).get('value', 0) / 1000
                # Время в секундах, переводим в часы
                duration_hours = route.get('duration', {}).get('value', 0) / 3600
                
                # Добавляем время на погрузку/разгрузку (3 часа на точку согласно ТЗ)
                loading_time = len(points) * 3
                total_eta = duration_hours + loading_time

                return {
                    'distance_km': round(distance_km, 2),
                    'duration_hours': round(duration_hours, 2),
                    'loading_time_hours': loading_time,
                    'total_eta_hours': round(total_eta, 2),
                    'coordinates': coordinates,
                    'points_count': len(points),
                    'fallback': False
                }
            else:
                print(f"Некорректный ответ от Router API: {data}")
                # Fallback расчёт
                return self._fallback_route_calculation(coordinates, len(points))
                
        except requests.exceptions.Timeout:
            print("Таймаут при расчёте маршрута")
            return self._fallback_route_calculation(coordinates, len(points))
        except requests.exceptions.RequestException as e:
            print(f"Ошибка HTTP при расчёте маршрута: {e}")
            return self._fallback_route_calculation(coordinates, len(points))
        except (KeyError, ValueError) as e:
            print(f"Ошибка парсинга маршрута: {e}")
            return self._fallback_route_calculation(coordinates, len(points))

    def _fallback_route_calculation(self, coordinates: List[str], points_count: int, 
                                     origin: str = None, destination: str = None) -> Dict:
        """
        Fallback расчёт маршрута при недоступности API
        
        Использует справочную таблицу расстояний для известных маршрутов,
        или примерные значения для неизвестных
        """
        # Попробуем использовать справочную таблицу, если есть названия городов
        if origin and destination:
            try:
                # Используем справочник расстояний
                table_data = calculate_table_eta(origin, destination, points_count)
                return {
                    'distance_km': table_data['distance_km'],
                    'duration_hours': table_data['travel_time_hours'],
                    'loading_time_hours': table_data['loading_time_hours'],
                    'total_eta_hours': table_data['total_eta_hours'],
                    'coordinates': coordinates,
                    'fallback': True,
                    'source': 'distance_table',
                    'note': f'Данные из справочника расстояний ({origin} → {destination})'
                }
            except Exception as e:
                print(f"Ошибка при использовании справочника: {e}")
        
        # Если справочник не помог - используем типичные значения
        estimated_distance = 500.0
        estimated_duration = 8.0
        loading_time = points_count * 3
        
        return {
            'distance_km': estimated_distance,
            'duration_hours': estimated_duration,
            'loading_time_hours': loading_time,
            'total_eta_hours': estimated_duration + loading_time,
            'coordinates': coordinates,
            'fallback': True,
            'source': 'default',
            'note': 'Использованы типичные значения (500 км, 8 часов)'
        }

    def calculate_distance(self, origin: str, destination: str) -> Optional[float]:
        """
        Расчёт расстояния между двумя точками
        
        Использует многоуровневый fallback:
        1. Yandex Maps API (если доступен)
        2. Справочная таблица расстояний
        3. Типичное значение (500 км)
        
        Args:
            origin: Адрес отправления
            destination: Адрес назначения
            
        Returns:
            Расстояние в километрах
        """
        # Пробуем через Yandex API
        route = self.calculate_route([origin, destination])
        if route:
            return route['distance_km']
        
        # Fallback: пробуем справочную таблицу
        try:
            table_distance = get_table_distance(origin, destination)
            if table_distance and table_distance != 500.0:  # 500 - дефолтное значение
                print(f"✓ Расстояние из справочника: {origin} → {destination} = {table_distance} км")
                return table_distance
        except Exception as e:
            print(f"Ошибка при обращении к справочнику расстояний: {e}")
        
        # Последний fallback: типичное значение
        return 500.0
