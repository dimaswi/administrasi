<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use App\Services\CacheService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class RoleController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->get('perPage', 10);
        $search = $request->get('search', '');

        $roles = Role::query()
            ->with(['permissions'])
            ->withCount(['users'])
            ->when($search, function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%")
                           ->orWhere('display_name', 'like', "%{$search}%");
            })
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('HR/access/role/index', [
            'roles' => $roles,
            'filters' => [
                'search' => $search,
                'perPage' => $perPage,
            ],
        ]);
    }

    public function create()
    {
        $permissions = Permission::orderBy('module', 'asc')
            ->orderBy('name', 'asc')
            ->get();

        return Inertia::render('HR/access/role/create', [
            'permissions' => $permissions,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'display_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'permission_ids' => 'array',
            'permission_ids.*' => 'exists:permissions,id',
        ], [
            'display_name.required' => 'Display name wajib diisi',
        ]);

        DB::transaction(function () use ($request) {
            // Generate name from display_name
            $name = strtolower(str_replace(' ', '_', $request->display_name));

            $role = Role::create([
                'name' => $name,
                'display_name' => $request->display_name,
                'description' => $request->description,
            ]);

            if ($request->permission_ids) {
                $role->permissions()->sync($request->permission_ids);
            }
        });

        // Clear related cache
        CacheService::clearRoleCache();
        CacheService::clearPermissionCache();

<<<<<<< HEAD:app/Http/Controllers/HR/RoleController.php
        return redirect()->route('hr.access.roles.index')->with('success', 'Role berhasil ditambahkan');
=======
        return redirect()->route('roles.index')->with('success', 'Role berhasil ditambahkan');
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce:app/Http/Controllers/Master/RoleController.php
    }

    public function edit(Role $role)
    {
        $permissions = Permission::orderBy('module', 'asc')
            ->orderBy('name', 'asc')
            ->get();
        $role->load(['permissions']);

        return Inertia::render('HR/access/role/edit', [
            'role' => $role,
            'permissions' => $permissions,
        ]);
    }

    public function update(Request $request, Role $role)
    {
        $request->validate([
            'display_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'permission_ids' => 'array',
            'permission_ids.*' => 'exists:permissions,id',
        ], [
            'display_name.required' => 'Display name wajib diisi',
        ]);

        DB::transaction(function () use ($request, $role) {
            // Generate name from display_name
            $name = strtolower(str_replace(' ', '_', $request->display_name));

            $role->update([
                'name' => $name,
                'display_name' => $request->display_name,
                'description' => $request->description,
            ]);

            $role->permissions()->sync($request->permission_ids ?? []);
        });

        // Clear related cache
        CacheService::clearRoleCache($role->id);
        CacheService::clearPermissionCache();

<<<<<<< HEAD:app/Http/Controllers/HR/RoleController.php
        return redirect()->route('hr.access.roles.index')->with('success', 'Role berhasil diperbarui');
=======
        return redirect()->route('roles.index')->with('success', 'Role berhasil diperbarui');
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce:app/Http/Controllers/Master/RoleController.php
    }

    public function destroy(Role $role)
    {
        if ($role->users()->count() > 0) {
            return redirect()->back()->with('error', 'Role tidak dapat dihapus karena masih digunakan oleh user');
        }

        $role->permissions()->detach();
        $role->delete();

        // Clear related cache
        CacheService::clearRoleCache($role->id);
        CacheService::clearPermissionCache();

<<<<<<< HEAD:app/Http/Controllers/HR/RoleController.php
        return redirect()->route('hr.access.roles.index')->with('success', 'Role berhasil dihapus');
=======
        return redirect()->route('roles.index')->with('success', 'Role berhasil dihapus');
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce:app/Http/Controllers/Master/RoleController.php
    }
}
