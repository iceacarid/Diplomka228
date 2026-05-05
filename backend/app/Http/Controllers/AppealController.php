<?php

namespace App\Http\Controllers;

use App\Models\Appeal;
use Illuminate\Http\Request;

class AppealController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()->isAdmin(), 403, 'Только администратор.');

        $appeals = Appeal::with(['client', 'chat.order'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->orderByDesc('created_at')
            ->paginate(30);

        return response()->json([
            'data'         => collect($appeals->items())->map(fn($a) => $this->appealData($a)),
            'current_page' => $appeals->currentPage(),
            'last_page'    => $appeals->lastPage(),
            'total'        => $appeals->total(),
        ]);
    }

    public function update(Request $request, Appeal $appeal)
    {
        abort_unless($request->user()->isAdmin(), 403, 'Только администратор.');

        $appeal->update(['status' => 'reviewed', 'admin_id' => $request->user()->id]);

        return response()->json($this->appealData($appeal->load(['client', 'chat.order'])));
    }

    private function appealData(Appeal $appeal): array
    {
        return [
            'id'          => $appeal->id,
            'chat_id'     => $appeal->chat_id,
            'client_id'   => $appeal->client_id,
            'client_name' => $appeal->client?->name,
            'client_email'=> $appeal->client?->email,
            'tracking_id' => $appeal->chat?->order?->tracking_id,
            'body'        => $appeal->body,
            'status'      => $appeal->status,
            'admin_id'    => $appeal->admin_id,
            'created_at'  => $appeal->created_at,
        ];
    }
}
