<?php

namespace App\Http\Controllers;

use App\Models\AiRequest;
use App\Services\AiService;
use Illuminate\Http\Request;

class AiController extends Controller
{
    public function __construct(private AiService $aiService) {}

    public function optimize(Request $request)
    {
        $request->validate([
            'trucks' => 'required|array|min:1',
            'orders' => 'required|array|min:1',
            'prompt' => 'nullable|string',
        ]);

        $recommendation = $this->aiService->optimizeLoad(
            $request->trucks,
            $request->orders,
            $request->input('prompt', '')
        );

        $record = AiRequest::create([
            'manager_id'    => $request->user()->id,
            'request_text'  => 'Транспорт: ' . count($request->trucks) . ', Заказы: ' . count($request->orders),
            'response_text' => $recommendation,
        ]);

        return response()->json([
            'recommendation' => $recommendation,
            'request_id'     => $record->id,
        ]);
    }

    public function history(Request $request)
    {
        $history = AiRequest::where('manager_id', $request->user()->id)
                            ->orderByDesc('created_at')
                            ->limit(10)
                            ->get();

        return response()->json($history->map(fn($r) => [
            'id'           => $r->id,
            'request_text' => $r->request_text,
            'response_text'=> $r->response_text,
            'manager_name' => $r->manager?->name ?? '',
            'created_at'   => $r->created_at,
        ]));
    }
}
