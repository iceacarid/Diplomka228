<?php

namespace App\Http\Controllers;

use App\Models\Appeal;
use App\Models\Chat;
use App\Models\Message;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function index(Request $request)
    {
        $user  = $request->user();
        $query = Chat::with(['order', 'manager'])
                     ->withCount(['messages as unread_count' => function ($q) use ($user) {
                         $q->whereNull('read_at')->where('sender_id', '!=', $user->id);
                     }]);

        match ($user->role) {
            'client'  => $query->whereHas('order', fn($q) => $q->where('client_id', $user->id)),
            'manager' => $query->where(function ($q) use ($user) {
                             $q->where('manager_id', $user->id)
                               ->orWhereHas('order', fn($o) => $o->where('manager_id', $user->id));
                         }),
            default   => null, // admin — all chats
        };

        if ($request->has('status'))       $query->where('status', $request->status);
        if ($request->has('order_id'))     $query->where('order_id', $request->order_id);
        if ($request->has('date'))         $query->whereDate('created_at', $request->date);
        if ($request->has('order_status')) $query->whereHas('order', fn($q) => $q->where('status', $request->order_status));
        if ($request->has('search'))       $query->whereHas('order', fn($q) => $q->where('tracking_id', 'like', '%' . $request->search . '%'));

        $chats = $query->orderByRaw("CASE WHEN status = 'archived' THEN 1 ELSE 0 END")
                      ->orderByDesc('updated_at')
                      ->paginate(20);

        return response()->json([
            'data'         => $chats->items(),
            'current_page' => $chats->currentPage(),
            'last_page'    => $chats->lastPage(),
            'total'        => $chats->total(),
        ]);
    }

    public function show(Request $request, Chat $chat)
    {
        $user = $request->user();
        abort_unless($chat->canUserRead($user), 403, 'Доступ запрещён.');

        $chat->load(['order', 'manager']);
        $messages = $chat->messages()->with('sender')->get()
                         ->map(fn($m) => $this->messageData($m, $user));

        // Сбросить флаг внимания при открытии менеджером
        if ($user->isManager() && $chat->flagged) {
            $chat->update(['flagged' => false]);
        }

        // Отметить как прочитанные
        $chat->messages()
             ->whereNull('read_at')
             ->where('sender_id', '!=', $user->id)
             ->update(['read_at' => now()]);

        $order = $chat->order;

        return response()->json([
            'id'           => $chat->id,
            'order_id'     => $chat->order_id,
            'tracking_id'  => $order->tracking_id,
            'order_status' => $order->status,
            'status'       => $chat->status,
            'manager_id'   => $chat->manager_id,
            'manager_name' => $chat->manager?->name,
            'can_write'    => $chat->canUserWrite($user),
            'has_appeal'   => $chat->appeal()->exists(),
            'messages'     => $messages,
            'order_data'   => [
                'id'                     => $order->id,
                'origin_address'         => $order->origin_address,
                'dest_address'           => $order->dest_address,
                'weight'                 => $order->weight,
                'volume'                 => $order->volume,
                'cargo_type'             => $order->cargo_type,
                'cargo_type_custom'      => $order->cargo_type_custom,
                'cargo_description'      => $order->cargo_description,
                'price'                  => $order->price,
                'pickup_date'            => $order->pickup_date?->toDateString(),
                'pickup_time'            => $order->pickup_time,
                'courier_blocked'        => (bool) $order->courier_blocked,
                'courier_blocked_reason' => $order->courier_blocked_reason,
            ],
        ]);
    }

    public function messages(Request $request, Chat $chat)
    {
        $user = $request->user();
        abort_unless($chat->canUserRead($user), 403, 'Доступ запрещён.');

        $query = $chat->messages()->with('sender');

        if ($request->has('after')) {
            $query->where('id', '>', (int) $request->after);
        } else {
            $query->latest()->limit(50);
        }

        $messages = $query->get()->map(fn($m) => $this->messageData($m, $user));

        if ($messages->count()) {
            $chat->messages()
                 ->whereIn('id', $messages->pluck('id'))
                 ->whereNull('read_at')
                 ->where('sender_id', '!=', $user->id)
                 ->update(['read_at' => now()]);
        }

        return response()->json($messages);
    }

    public function sendMessage(Request $request, Chat $chat)
    {
        $user = $request->user();
        abort_unless(
            $chat->canUserWrite($user),
            403,
            $chat->isArchived() ? 'Чат архивирован.' : 'Доступ запрещён.'
        );

        $hasMetadata = $request->has('metadata') && is_array($request->metadata);
        $type = ($hasMetadata && $user->isClient()) ? 'form_submission' : 'text';

        $data = $request->validate([
            'body'     => $type === 'form_submission' ? 'nullable|string|max:4000' : 'required|string|max:4000',
            'metadata' => 'nullable|array',
        ]);

        $message = Message::create([
            'chat_id'     => $chat->id,
            'sender_id'   => $user->id,
            'sender_role' => $user->role,
            'body'        => $data['body'] ?? '',
            'type'        => $type,
            'metadata'    => $data['metadata'] ?? null,
        ]);

        // Клиент отправил форму → переводим заявку в очередь на проверку менеджером
        if ($type === 'form_submission' && $user->isClient()) {
            $order = $chat->order;
            if ($order && $order->status === 'draft') {
                $orderUpdate = ['status' => 'pending_approval'];
                if (!empty($data['metadata']['pickup_date'])) {
                    $orderUpdate['pickup_date'] = $data['metadata']['pickup_date'];
                }
                $order->update($orderUpdate);
                Message::create([
                    'chat_id'     => $chat->id,
                    'sender_id'   => null,
                    'sender_role' => 'bot',
                    'body'        => "Заявка {$order->tracking_id} передана на проверку менеджеру. Ожидайте подтверждения.",
                    'type'        => 'text',
                    'metadata'    => ['event' => 'order_submitted'],
                ]);
            }
        }

        $chat->touch();

        return response()->json($this->messageData($message->load('sender'), $user), 201);
    }

    public function updateMessage(Request $request, Chat $chat, Message $message)
    {
        $user = $request->user();
        abort_unless($user->isManagerOrAdmin(), 403, 'Только менеджер или администратор.');
        abort_unless($chat->canUserWrite($user), 403, 'Нет доступа к этому чату.');
        abort_unless($message->type === 'form_submission', 422, 'Можно редактировать только форму.');

        $data    = $request->validate(['metadata' => 'required|array']);
        $oldMeta = $message->metadata ?? [];
        $newMeta = $data['metadata'];

        $message->update(['metadata' => $newMeta]);

        // Sync pickup_date to order if changed
        $order = $chat->order;
        if ($order && isset($newMeta['pickup_date']) && ($oldMeta['pickup_date'] ?? null) !== $newMeta['pickup_date']) {
            $order->update(['pickup_date' => $newMeta['pickup_date']]);
        }

        // Build human-readable diff and notify
        $labels = [
            'pickup_date'          => 'Дата забора',
            'pickup_time'          => 'Время забора',
            'pickup_name'          => 'Контакт на месте забора',
            'pickup_phone'         => 'Телефон на месте забора',
            'delivery_name'        => 'Имя получателя',
            'delivery_phone'       => 'Телефон получателя',
            'cargo_description'    => 'Описание груза',
            'loaders_pickup'       => 'Грузчики на погрузке',
            'loaders_pickup_floor' => 'Этаж погрузки',
            'loaders_delivery'     => 'Грузчики на выгрузке',
            'packaging'            => 'Упаковка',
            'comment'              => 'Комментарий',
        ];

        $changes = [];
        foreach ($labels as $key => $label) {
            $old = (string) ($oldMeta[$key] ?? '');
            $new = (string) ($newMeta[$key] ?? '');
            if ($old !== $new) {
                $oldStr = $old !== '' ? $old : '—';
                $newStr = $new !== '' ? $new : '—';
                $changes[] = "• {$label}: {$oldStr} → {$newStr}";
            }
        }

        if (!empty($changes)) {
            Message::create([
                'chat_id'     => $chat->id,
                'sender_id'   => null,
                'sender_role' => 'bot',
                'body'        => "Менеджер {$user->name} изменил данные заявки:\n" . implode("\n", $changes),
                'type'        => 'text',
                'metadata'    => ['event' => 'form_edited'],
            ]);
            $chat->touch();
        }

        return response()->json($this->messageData($message->load('sender'), $user));
    }

    public function confirm(Request $request, Chat $chat)
    {
        $user = $request->user();
        abort_unless($user->isManagerOrAdmin(), 403, 'Только менеджер или администратор.');
        abort_unless($chat->canUserRead($user), 403, 'Нет доступа.');

        $order = $chat->order;
        if ($order->status === 'confirmed') {
            return response()->json(['error' => 'Заявка уже подтверждена.'], 400);
        }

        $order->update(['status' => 'confirmed']);

        Message::create([
            'chat_id'     => $chat->id,
            'sender_id'   => null,
            'sender_role' => 'bot',
            'body'        => "Заявка {$order->tracking_id} подтверждена менеджером {$user->name}.",
            'type'        => 'text',
            'metadata'    => ['event' => 'order_confirmed', 'manager_name' => $user->name],
        ]);

        $chat->touch();

        return response()->json(['status' => 'confirmed']);
    }

    public function archive(Request $request, Chat $chat)
    {
        $user = $request->user();
        abort_unless($user->isManagerOrAdmin(), 403, 'Только менеджер или администратор.');
        abort_unless($chat->canUserRead($user), 403, 'Нет доступа.');

        if ($chat->status === 'archived') {
            return response()->json(['error' => 'Чат уже архивирован.'], 400);
        }

        $chat->update(['status' => 'archived']);

        Message::create([
            'chat_id'     => $chat->id,
            'sender_id'   => null,
            'sender_role' => 'bot',
            'body'        => "Чат закрыт {$user->name}. Переписка заморожена для обеих сторон.",
            'type'        => 'text',
            'metadata'    => ['event' => 'chat_archived', 'manager_name' => $user->name],
        ]);

        $chat->touch();

        return response()->json(['status' => 'archived']);
    }

    public function unarchive(Request $request, Chat $chat)
    {
        $user = $request->user();
        abort_unless($user->isAdmin(), 403, 'Только администратор.');

        if ($chat->status !== 'archived') {
            return response()->json(['error' => 'Чат не архивирован.'], 400);
        }

        $chat->update(['status' => 'active', 'flagged' => true]);

        Message::create([
            'chat_id'     => $chat->id,
            'sender_id'   => null,
            'sender_role' => 'bot',
            'body'        => "Чат разблокирован администратором {$user->name}. Переписка возобновлена.",
            'type'        => 'text',
            'metadata'    => ['event' => 'chat_unarchived', 'admin_name' => $user->name],
        ]);

        $chat->touch();

        return response()->json(['status' => 'active']);
    }

    public function submitAppeal(Request $request, Chat $chat)
    {
        $user = $request->user();
        abort_unless($user->isClient(), 403, 'Только клиент может подать апелляцию.');
        abort_unless((int) $chat->order->client_id === (int) $user->id, 403, 'Нет доступа.');

        if ($chat->status !== 'archived') {
            return response()->json(['error' => 'Апелляция возможна только по архивированному чату.'], 400);
        }

        if ($chat->appeal()->exists()) {
            return response()->json(['error' => 'Апелляция по этому чату уже подана.'], 409);
        }

        $data = $request->validate(['body' => 'required|string|max:2000']);

        $appeal = Appeal::create([
            'chat_id'   => $chat->id,
            'client_id' => $user->id,
            'body'      => $data['body'],
        ]);

        Message::create([
            'chat_id'     => $chat->id,
            'sender_id'   => null,
            'sender_role' => 'bot',
            'body'        => "Апелляция подана. Администратор рассмотрит ситуацию.",
            'type'        => 'text',
            'metadata'    => ['event' => 'appeal_submitted'],
        ]);

        $chat->touch();

        return response()->json(['id' => $appeal->id, 'status' => $appeal->status], 201);
    }

    private function messageData(Message $msg, $user): array
    {
        return [
            'id'          => $msg->id,
            'chat_id'     => $msg->chat_id,
            'sender_id'   => $msg->sender_id,
            'sender_name' => $msg->sender_id ? ($msg->sender?->name ?? 'Пользователь') : 'Система',
            'sender_role' => $msg->sender_role,
            'body'        => $msg->body,
            'type'        => $msg->type,
            'metadata'    => $msg->metadata,
            'read_at'     => $msg->read_at,
            'created_at'  => $msg->created_at,
            'is_mine'     => $msg->sender_id === $user->id,
        ];
    }
}
