<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiService
{
    public function optimizeLoad(array $trucks, array $orders, string $customPrompt = ''): string
    {
        $prompt = $this->buildPrompt($trucks, $orders, $customPrompt);

        // Цепочка: Claude → Gemini → Groq → DeepSeek
        $providers = ['claude', 'gemini', 'groq', 'deepseek'];
        $methods   = ['tryClaude', 'tryGemini', 'tryGroq', 'tryDeepSeek'];
        $result    = null;
        $usedProvider = null;

        foreach ($providers as $i => $name) {
            $res = $this->{$methods[$i]}($prompt);
            if ($res !== null) {
                $result       = $res;
                $usedProvider = $name;
                break;
            }
        }

        $ttl = 3600;
        Cache::put('ai_last_call_ok',       $result !== null, $ttl);
        Cache::put('ai_last_call_at',        now()->timestamp, $ttl);
        Cache::put('ai_last_used_provider',  $usedProvider ?? 'none', $ttl);

        return $result ?? 'Не удалось получить рекомендацию от AI. Проверьте API-ключи.';
    }

    private function buildPrompt(array $trucks, array $orders, string $custom): string
    {
        $trucksInfo = json_encode($trucks, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        $ordersInfo = json_encode($orders, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

        $base = "Ты — эксперт по логистике. Оптимизируй распределение заказов по транспортным средствам.\n\n" .
                "Транспорт:\n{$trucksInfo}\n\n" .
                "Заказы:\n{$ordersInfo}\n\n" .
                "Дай конкретные рекомендации: какой заказ назначить на какой транспорт, учитывая вес, объём и маршруты.";

        return $custom ? $base . "\n\nДополнительные требования: {$custom}" : $base;
    }

    private function tryClaude(string $prompt): ?string
    {
        $key     = config('services.claude.key');
        $baseUrl = config('services.claude.base_url', 'https://popus.lol');
        if (!$key) return null;

        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'x-api-key'         => $key,
                    'anthropic-version' => '2023-06-01',
                ])
                ->post("{$baseUrl}/v1/messages", [
                    'model'      => 'claude-3-5-haiku-20241022',
                    'max_tokens' => 1024,
                    'messages'   => [['role' => 'user', 'content' => $prompt]],
                ]);

            return $response->json('content.0.text');
        } catch (\Exception $e) {
            Log::warning('Claude failed: ' . $e->getMessage());
            return null;
        }
    }

    private function tryGemini(string $prompt): ?string
    {
        $key = config('services.gemini.key');
        if (!$key) return null;

        try {
            $response = Http::timeout(30)->post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={$key}",
                ['contents' => [['parts' => [['text' => $prompt]]]]]
            );
            return $response->json('candidates.0.content.parts.0.text');
        } catch (\Exception $e) {
            Log::warning('Gemini failed: ' . $e->getMessage());
            return null;
        }
    }

    private function tryGroq(string $prompt): ?string
    {
        $key = config('services.groq.key');
        if (!$key) return null;

        try {
            $response = Http::timeout(30)
                ->withToken($key)
                ->post('https://api.groq.com/openai/v1/chat/completions', [
                    'model'    => 'llama3-8b-8192',
                    'messages' => [['role' => 'user', 'content' => $prompt]],
                ]);
            return $response->json('choices.0.message.content');
        } catch (\Exception $e) {
            Log::warning('Groq failed: ' . $e->getMessage());
            return null;
        }
    }

    private function tryDeepSeek(string $prompt): ?string
    {
        $key = config('services.deepseek.key');
        if (!$key) return null;

        try {
            $response = Http::timeout(30)
                ->withToken($key)
                ->post('https://api.deepseek.com/chat/completions', [
                    'model'    => 'deepseek-chat',
                    'messages' => [['role' => 'user', 'content' => $prompt]],
                ]);
            return $response->json('choices.0.message.content');
        } catch (\Exception $e) {
            Log::warning('DeepSeek failed: ' . $e->getMessage());
            return null;
        }
    }
}
