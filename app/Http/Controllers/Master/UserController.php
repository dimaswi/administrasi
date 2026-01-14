<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use App\Services\CacheService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->get('perPage', 10);
        $search = $request->get('search', '');

        $users = User::query()
            ->with(['role'])
            ->when($search, function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%")
                    ->orWhere('nip', 'like', "%{$search}%");
            })
            ->orderBy('created_at', 'asc')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('master/user/index', [
            'users' => $users,
            'filters' => [
                'search' => $search,
                'perPage' => $perPage,
            ],
        ]);
    }

    public function create()
    {
        $roles = Role::all();
        
        return Inertia::render('master/user/create', [
            'roles' => $roles,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'nip' => 'required|string|max:20|unique:users',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role_id' => 'nullable|exists:roles,id',
        ], [
            'name.required' => 'Nama wajib diisi',
            'name.string' => 'Nama harus berupa teks',
            'name.max' => 'Nama maksimal 255 karakter',
            'nip.required' => 'NIP wajib diisi',
            'nip.string' => 'NIP harus berupa teks',
            'nip.max' => 'NIP maksimal 20 karakter',
            'nip.unique' => 'NIP sudah digunakan',
            'password.required' => 'Password wajib diisi',
            'password.confirmed' => 'Konfirmasi password tidak cocok',
            'role_id.exists' => 'Role tidak valid',
        ]);

        User::create([
            'name' => $request->name,
            'nip' => $request->nip,
            'password' => Hash::make($request->password),
            'role_id' => $request->role_id === '0' ? null : $request->role_id,
        ]);

        // Clear related cache
        CacheService::clearUserCache();

        return redirect()->route('users.index');
    }

    public function edit(User $user)
    {
        $roles = Role::all();
        
        return Inertia::render('master/user/edit', [
            'user' => $user->load('role'),
            'roles' => $roles,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'nip' => 'required|string|max:20|unique:users,nip,' . $user->id,
            'password' => ['nullable', 'confirmed', Rules\Password::defaults()],
            'role_id' => 'nullable|exists:roles,id',
        ], [
            'name.required' => 'Nama wajib diisi',
            'name.string' => 'Nama harus berupa teks',
            'name.max' => 'Nama maksimal 255 karakter',
            'nip.required' => 'NIP wajib diisi',
            'nip.string' => 'NIP harus berupa teks',
            'nip.max' => 'NIP maksimal 20 karakter',
            'nip.unique' => 'NIP sudah digunakan',
            'password.confirmed' => 'Konfirmasi password tidak cocok',
            'role_id.exists' => 'Role tidak valid',
        ]);

        $user->update([
            'name' => $request->name,
            'nip' => $request->nip,
            'password' => $request->filled('password') ? Hash::make($request->password) : $user->password,
            'role_id' => $request->role_id === '0' ? null : $request->role_id,
        ]);

        // Clear related cache
        CacheService::clearUserCache($user->id);

        return redirect()->route('users.index');
    }

    public function destroy(User $user)
    {
        $userId = $user->id;
        $user->delete();

        // Clear related cache
        CacheService::clearUserCache($userId);

        return redirect()->route('users.index');
    }
}
