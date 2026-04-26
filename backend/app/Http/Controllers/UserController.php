<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    /** GET /api/auth/me */
    public function me(Request $request)
    {
        return response()->json($this->userData($request->user()));
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

        return response()->json($users->map(fn($u) => $this->userData($u)));
    }

    /** POST /api/users/{id}/change-role */
    public function changeRole(Request $request, User $user)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['error' => 'Недостаточно прав.'], 403);
        }

        $request->validate(['role' => 'required|in:client,manager,admin']);
        $user->update(['role' => $request->role]);

        return response()->json($this->userData($user->fresh()));
    }

    /** DELETE /api/users/{id} */
    public function destroy(Request $request, User $user)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['error' => 'Недостаточно прав.'], 403);
        }
        $user->delete();
        return response()->json(['message' => 'Пользователь удалён.']);
    }

    private function userData(User $user): array
    {
        return [
            'id'                 => $user->id,
            'email'              => $user->email,
            'name'               => $user->name,
            'phone'              => $user->phone,
            'role'               => $user->role,
            'avatar_url'         => $user->avatarUrl(),
            'is_active'          => $user->is_active,
            'two_factor_enabled' => $user->two_factor_enabled,
            'created_at'         => $user->created_at,
        ];
    }
}
