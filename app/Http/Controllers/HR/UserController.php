<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use App\Models\OrganizationUnit;
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
            ->with(['role', 'organizationUnit'])
            ->when($search, function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%")
                    ->orWhere('nip', 'like', "%{$search}%");
            })
            ->orderBy('created_at', 'asc')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('HR/access/user/index', [
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
        $organizationUnits = OrganizationUnit::where('is_active', true)
            ->orderBy('name', 'asc')
            ->get();

        return Inertia::render('HR/access/user/create', [
            'roles' => $roles,
            'organizationUnits' => $organizationUnits,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'nip' => 'required|string|max:20|unique:users',
            'email' => 'nullable|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role_id' => 'nullable|exists:roles,id',
            'organization_unit_id' => 'nullable|exists:organization_units,id',
            'position' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'is_active' => 'boolean',
        ], [
            'name.required' => 'Nama wajib diisi',
            'name.string' => 'Nama harus berupa teks',
            'name.max' => 'Nama maksimal 255 karakter',
            'nip.required' => 'NIP wajib diisi',
            'nip.string' => 'NIP harus berupa teks',
            'nip.max' => 'NIP maksimal 20 karakter',
            'nip.unique' => 'NIP sudah digunakan',
            'email.email' => 'Format email tidak valid',
            'email.unique' => 'Email sudah digunakan',
            'password.required' => 'Password wajib diisi',
            'password.confirmed' => 'Konfirmasi password tidak cocok',
            'role_id.exists' => 'Role tidak valid',
            'organization_unit_id.exists' => 'Unit organisasi tidak valid',
        ]);

        User::create([
            'name' => $request->name,
            'nip' => $request->nip,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role_id' => $request->role_id === '0' ? null : $request->role_id,
            'organization_unit_id' => $request->organization_unit_id,
            'position' => $request->position,
            'phone' => $request->phone,
            'is_active' => $request->is_active ?? true,
        ]);

        // Clear related cache
        CacheService::clearUserCache();

        return redirect()->route('hr.access.users.index')->with('success', 'User berhasil ditambahkan');
    }

    public function show(User $user)
    {
        $user->load(['role', 'organizationUnit', 'employee']);

        return Inertia::render('HR/access/user/show', [
            'user' => $user,
        ]);
    }

    public function edit(User $user)
    {
        $roles = Role::all();
        $organizationUnits = OrganizationUnit::where('is_active', true)
            ->orderBy('name', 'asc')
            ->get();

        return Inertia::render('HR/access/user/edit', [
            'user' => $user->load(['role', 'organizationUnit']),
            'roles' => $roles,
            'organizationUnits' => $organizationUnits,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'nip' => 'required|string|max:20|unique:users,nip,' . $user->id,
            'email' => 'nullable|email|max:255|unique:users,email,' . $user->id,
            'password' => ['nullable', 'confirmed', Rules\Password::defaults()],
            'role_id' => 'nullable|exists:roles,id',
            'organization_unit_id' => 'nullable|exists:organization_units,id',
            'position' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'is_active' => 'boolean',
        ], [
            'name.required' => 'Nama wajib diisi',
            'name.string' => 'Nama harus berupa teks',
            'name.max' => 'Nama maksimal 255 karakter',
            'nip.required' => 'NIP wajib diisi',
            'nip.string' => 'NIP harus berupa teks',
            'nip.max' => 'NIP maksimal 20 karakter',
            'nip.unique' => 'NIP sudah digunakan',
            'email.email' => 'Format email tidak valid',
            'email.unique' => 'Email sudah digunakan',
            'password.confirmed' => 'Konfirmasi password tidak cocok',
            'role_id.exists' => 'Role tidak valid',
            'organization_unit_id.exists' => 'Unit organisasi tidak valid',
        ]);

        $data = [
            'name' => $request->name,
            'nip' => $request->nip,
            'email' => $request->email,
            'role_id' => $request->role_id === '0' ? null : $request->role_id,
            'organization_unit_id' => $request->organization_unit_id,
            'position' => $request->position,
            'phone' => $request->phone,
            'is_active' => $request->is_active ?? true,
        ];

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        // Clear related cache
        CacheService::clearUserCache($user->id);

        return redirect()->route('hr.access.users.index')->with('success', 'User berhasil diperbarui');
    }

    public function destroy(User $user)
    {
        $userId = $user->id;
        $user->delete();

        // Clear related cache
        CacheService::clearUserCache($userId);

        return redirect()->route('hr.access.users.index')->with('success', 'User berhasil dihapus');
    }
}
