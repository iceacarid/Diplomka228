<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\BlockAppeal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    /** GET /api/auth/me */
    public function me(Request $request)
    {
        return response()->json($this->userData($request->user()->load('warehouse')));
    }

    /** PUT/PATCH /api/auth/me */
    public function update(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name'  => 'sometimes|string|max:255',
            'phone' => 'sometimes|nullable|string|max:20',
            'avatar'=> 'sometimes|nullable|image|max:2048',
        ]);

        // Смена пароля
        if ($request->has('new_password')) {
            if (!$request->old_password) {
                return response()->json(['old_password' => ['Укажите текущий пароль']], 422);
            }
            if (!Hash::check($request->old_password, $user->password)) {
                return response()->json(['old_password' => ['Неверный текущий пароль']], 422);
            }
            if (strlen($request->new_password) < 6) {
                return response()->json(['new_password' => ['Пароль должен быть минимум 6 символов']], 422);
            }
            $data['password'] = Hash::make($request->new_password);
        }

        // Загрузка аватара
        if ($request->hasFile('avatar')) {
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            $path = $request->file('avatar')->store('avatars', 'public');
            $data['avatar'] = $path;
        }

        $user->update($data);
        return response()->json($this->userData($user->fresh()));
    }

    /** GET /api/users */
    public function index(Request $request)
    {
        $authUser = $request->user();

        if ($authUser->role === 'admin') {
            $users = User::all();
        } elseif ($authUser->role === 'manager') {
            $users = User::where('role', 'client')->get();
        } else {
            $users = User::where('id', $authUser->id)->get();
        }

        $users->load('warehouse');
        return response()->json($users->map(fn($u) => $this->userData($u)));
    }

    /** POST /api/users/{id}/change-role */
    public function changeRole(Request $request, User $user)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['error' => 'Недостаточно прав.'], 403);
        }

        $request->validate(['role' => 'required|in:client,manager,admin,courier,warehouse_keeper,driver']);

        if (in_array($request->role, ['courier', 'warehouse_keeper'])) {
            $request->validate(['warehouse_id' => 'required|exists:warehouses,id']);
            $user->update(['role' => $request->role, 'warehouse_id' => $request->warehouse_id]);
        } else {
            $user->update(['role' => $request->role, 'warehouse_id' => null]);
        }

        return response()->json($this->userData($user->fresh()));
    }

    /** POST /api/users/{id}/block */
    public function block(Request $request, User $user)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['error' => 'Недостаточно прав.'], 403);
        }
        if ((int) $user->id === (int) $request->user()->id) {
            return response()->json(['error' => 'Нельзя заблокировать себя.'], 422);
        }
        $data = $request->validate(['reason' => 'nullable|string|max:500']);
        $user->update([
            'is_blocked'   => true,
            'block_reason' => $data['reason'] ?? null,
        ]);
        // Revoke all tokens
        $user->tokens()->delete();
        return response()->json($this->userData($user->fresh()));
    }

    /** POST /api/users/{id}/unblock */
    public function unblock(Request $request, User $user)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['error' => 'Недостаточно прав.'], 403);
        }
        $user->update(['is_blocked' => false, 'block_reason' => null]);
        // Mark block appeal as reviewed if exists
        BlockAppeal::where('user_id', $user->id)->where('status', 'pending')
            ->update(['status' => 'reviewed', 'reviewed_by' => $request->user()->id]);
        return response()->json($this->userData($user->fresh()));
    }

    /** POST /api/users/block-appeal */
    public function submitBlockAppeal(Request $request)
    {
        $user = $request->user();
        if (!$user->is_blocked) {
            return response()->json(['error' => 'Аккаунт не заблокирован.'], 422);
        }
        if (BlockAppeal::where('user_id', $user->id)->exists()) {
            return response()->json(['error' => 'Апелляция уже подана. Повторная подача невозможна.'], 409);
        }
        $data = $request->validate(['body' => 'required|string|min:10|max:2000']);
        $appeal = BlockAppeal::create([
            'user_id' => $user->id,
            'body'    => $data['body'],
        ]);
        return response()->json(['id' => $appeal->id, 'status' => $appeal->status], 201);
    }

    /** GET /api/block-appeals (admin only) */
    public function blockAppeals(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['error' => 'Недостаточно прав.'], 403);
        }
        $appeals = BlockAppeal::with(['user', 'reviewer'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($a) => [
                'id'             => $a->id,
                'user_id'        => $a->user_id,
                'user_name'      => $a->user?->name,
                'user_email'     => $a->user?->email,
                'body'           => $a->body,
                'status'         => $a->status,
                'admin_response' => $a->admin_response,
                'reviewed_by'    => $a->reviewer?->name,
                'created_at'     => $a->created_at,
            ]);
        return response()->json(['data' => $appeals]);
    }

    private function userData(User $user): array
    {
        return [
            'id'                 => $user->id,
            'email'              => $user->email,
            'name'               => $user->name,
            'phone'              => $user->phone,
            'role'               => $user->role,
            'warehouse_id'       => $user->warehouse_id,
            'warehouse_name'     => $user->warehouse?->name,
            'avatar_url'         => $user->avatarUrl(),
            'is_active'          => $user->is_active,
            'is_blocked'         => (bool) $user->is_blocked,
            'block_reason'       => $user->block_reason,
            'has_block_appeal'   => BlockAppeal::where('user_id', $user->id)->exists(),
            'two_factor_enabled' => $user->two_factor_enabled,
            'created_at'         => $user->created_at,
        ];
    }
}
