<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class GigaChatService
{
    private const AUTH_URL = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
    private const API_URL  = 'https://gigachat.devices.sberbank.ru/api/v1';
    private const TOKEN_TTL = 1700; // 28 min — token valid 30 min

    public function getAccessToken(): ?string
    {
        if (Cache::has('gigachat_access_token')) {
            return Cache::get('gigachat_access_token');
        }
        $token = $this->fetchToken();
        if ($token) {
            Cache::put('gigachat_access_token', $token, self::TOKEN_TTL);
        }
        return $token;
    }

    private function fetchToken(): ?string
    {
        $authKey = config('services.gigachat.auth_key');
        if (!$authKey) {
            Log::warning('GigaChat: GIGACHAT_AUTH_KEY not configured');
            return null;
        }

        try {
            $response = Http::withoutVerifying()
                ->withHeaders([
                    'Content-Type'  => 'application/x-www-form-urlencoded',
                    'Accept'        => 'application/json',
                    'RqUID'         => Str::uuid()->toString(),
                    'Authorization' => 'Basic ' . $authKey,
                ])
                ->timeout(15)
                ->asForm()
                ->post(self::AUTH_URL, ['scope' => 'GIGACHAT_API_PERS']);

            $token = $response->json('access_token');
            if (!$token) {
                Log::warning('GigaChat: empty token', ['body' => substr($response->body(), 0, 300)]);
            }
            return $token;
        } catch (\Exception $e) {
            Log::warning('GigaChat token fetch failed: ' . $e->getMessage());
            return null;
        }
    }

    public function chat(string $systemPrompt, string $userMessage): ?string
    {
        $token = $this->getAccessToken();
        if (!$token) return null;

        try {
            $response = Http::withoutVerifying()
                ->withToken($token)
                ->withHeaders(['Accept' => 'application/json'])
                ->timeout(60)
                ->post(self::API_URL . '/chat/completions', [
                    'model'       => 'GigaChat',
                    'temperature' => 0.2,
                    'max_tokens'  => 2048,
                    'messages'    => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user',   'content' => $userMessage],
                    ],
                ]);

            $text = $response->json('choices.0.message.content');

            if (!$text) {
                Log::warning('GigaChat: empty response', ['body' => substr($response->body(), 0, 500)]);
                Cache::forget('gigachat_access_token');
                Cache::put('gigachat_last_call_ok', false, 3600);
                Cache::put('gigachat_last_call_at', now()->timestamp, 3600);
                return null;
            }

            Cache::put('gigachat_last_call_ok', true, 3600);
            Cache::put('gigachat_last_call_at', now()->timestamp, 3600);
            return $text;
        } catch (\Exception $e) {
            Log::warning('GigaChat chat failed: ' . $e->getMessage());
            Cache::forget('gigachat_access_token');
            Cache::put('gigachat_last_call_ok', false, 3600);
            Cache::put('gigachat_last_call_at', now()->timestamp, 3600);
            return null;
        }
    }

    /**
     * Extract Russian federal subject (субъект РФ) from an address string.
     * Returns normalized region name or null on failure.
     */
    public function extractRegion(string $address): ?string
    {
        $system = 'Ты — геокодер. По адресу определи субъект Российской Федерации. '
                . 'Отвечай ТОЛЬКО названием субъекта, без лишних слов. '
                . 'Примеры: "Москва", "Республика Татарстан", "Московская область", "Краснодарский край". '
                . 'Если адрес не российский или регион не определить — ответь пустой строкой.';

        $raw = $this->chat($system, "Адрес: {$address}");
        if (!$raw) return null;

        $region = trim(strip_tags($raw));
        // Reject obviously wrong answers (too long or empty)
        if ($region === '' || mb_strlen($region) > 100) return null;

        return $region;
    }

    /**
     * Ask GigaChat for recommendations on orders that didn't fit any truck.
     */
    public function recommendForUnassigned(array $unassignedOrders, array $trucks): ?string
    {
        $ordersJson = json_encode($unassignedOrders, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        $trucksJson = json_encode($trucks,           JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

        $system = 'Ты — опытный логист-консультант. '
                . 'Для каждого нераспределённого груза дай конкретную практическую рекомендацию. '
                . 'Предлагай реальные решения: газель / малотоннажный транспорт, разбивку партии на части, '
                . 'консолидацию с попутным грузом, перенос на следующий рейс, изменение маршрута через другой склад. '
                . 'Отвечай на русском, кратко и конкретно, без воды. '
                . 'Формат: для каждого груза одна строка "• [tracking_id]: [рекомендация]".';

        $user = "Нераспределённые грузы:\n{$ordersJson}\n\n"
              . "Доступные фуры (для контекста вместимости):\n{$trucksJson}\n\n"
              . "Дай рекомендацию для каждого нераспределённого груза.";

        return $this->chat($system, $user);
    }

    /**
     * Ask GigaChat to distribute orders across trucks.
     * Returns decoded array with keys: plan[], unassigned[]
     * or null on failure.
     */
    public function optimizeDistribution(array $trucks, array $orders, array $warehouses = []): ?array
    {
        $trucksJson     = json_encode($trucks,     JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        $ordersJson     = json_encode($orders,     JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        $warehousesJson = json_encode($warehouses, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

        $warehouseSection = !empty($warehouses)
            ? "\n\nСостояние складов:\n{$warehousesJson}\nУчти загруженность складов при приоритизации отправки (предпочти склады с высокой загрузкой)."
            : '';

        $system = <<<PROMPT
Ты — опытный логист-аналитик. Оптимально распредели нераспределённые грузы по доступным фурам.

Правила:
1. Суммарный вес всех грузов в фуре НЕ должен превышать capacity_weight этой фуры.
2. Суммарный объём в фуре НЕ должен превышать capacity_volume (если capacity_volume > 0).
3. Группируй грузы по схожим направлениям маршрута.
4. Максимизируй загрузку фур.
5. Учитывай actual_weight (фактический вес) вместо weight, если он задан.
6. Если груз не умещается ни в одну фуру — только тогда помести в unassigned.

СТРОГИЕ ТРЕБОВАНИЯ К ФОРМАТУ:
- Каждый truck_id встречается в "plan" РОВНО ОДИН РАЗ.
- Все заказы для одной фуры перечисли в одном объекте в массиве order_ids.
- Используй ТОЛЬКО те id, которые есть во входных данных. Не придумывай новые id.
- Отвечай ТОЛЬКО валидным JSON без markdown, без текста вне JSON.

Формат (строго):
{"plan":[{"truck_id":1,"order_ids":[5,8],"justification":"обоснование на русском"}],"unassigned":[{"order_id":3,"reason":"причина на русском"}]}
PROMPT;

        $user = "Фуры:\n{$trucksJson}\n\nГрузы:\n{$ordersJson}{$warehouseSection}\n\nРаспредели оптимально. Только JSON.";

        $raw = $this->chat($system, $user);
        if (!$raw) return null;

        // Strip markdown code fences GigaChat sometimes adds
        $clean = preg_replace('/^```(?:json)?\s*/i', '', trim($raw));
        $clean = preg_replace('/\s*```\s*$/m', '', $clean);

        $decoded = json_decode(trim($clean), true);

        if (json_last_error() !== JSON_ERROR_NONE || !isset($decoded['plan'])) {
            Log::warning('GigaChat: invalid JSON structure', ['raw' => substr($raw, 0, 600)]);
            return null;
        }

        return $decoded;
    }
}
