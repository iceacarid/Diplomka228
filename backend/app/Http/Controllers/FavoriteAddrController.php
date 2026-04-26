<?php

namespace App\Http\Controllers;

use App\Models\FavoriteAddr;
use Illuminate\Http\Request;

class FavoriteAddrController extends Controller
{
    public function index(Request $request)
    {
        $addresses = FavoriteAddr::where('user_id', $request->user()->id)->get();
        return response()->json($addresses);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'   => 'required|string|max:100',
            'address' => 'required|string|max:500',
            'lat'     => 'nullable|numeric',
            'lng'     => 'nullable|numeric',
        ]);
        $data['user_id'] = $request->user()->id;
        $addr = FavoriteAddr::create($data);
        return response()->json($addr, 201);
    }

    public function update(Request $request, FavoriteAddr $favoriteAddr)
    {
        if ($favoriteAddr->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Доступ запрещён.'], 403);
        }
        $data = $request->validate([
            'title'   => 'sometimes|string|max:100',
            'address' => 'sometimes|string|max:500',
            'lat'     => 'nullable|numeric',
            'lng'     => 'nullable|numeric',
        ]);
        $favoriteAddr->update($data);
        return response()->json($favoriteAddr);
    }

    public function destroy(Request $request, FavoriteAddr $favoriteAddr)
    {
        if ($favoriteAddr->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Доступ запрещён.'], 403);
        }
        $favoriteAddr->delete();
        return response()->json(['message' => 'Адрес удалён.']);
    }
}
