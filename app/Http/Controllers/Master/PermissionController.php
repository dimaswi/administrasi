<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PermissionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $perPage = (int) $request->get('perPage', 10);
        $search = $request->get('search', '');
        $module = $request->get('module', '');

        $permissions = Permission::query()
            ->with('roles')
            ->when($search, function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%")
                           ->orWhere('display_name', 'like', "%{$search}%")
                           ->orWhere('description', 'like', "%{$search}%");
            })
            ->when($module, function ($query, $module) {
                return $query->where('module', $module);
            })
            ->orderBy('module', 'asc')
            ->orderBy('name', 'asc')
            ->paginate($perPage)
            ->withQueryString();

        $modules = Permission::distinct()->pluck('module')->filter()->sort()->values();

        return Inertia::render('master/permission/index', [
            'permissions' => $permissions,
            'modules' => $modules,
            'filters' => [
                'search' => $search,
                'module' => $module,
                'perPage' => $perPage,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        $modules = Permission::distinct()->pluck('module')->filter()->sort()->values();
        $presetModule = $request->query('module', '');

        return Inertia::render('master/permission/create', [
            'modules' => $modules,
            'presetModule' => $presetModule,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:permissions',
            'display_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'module' => 'required|string|max:255',
        ], [
            'name.required' => 'Nama permission wajib diisi',
            'name.unique' => 'Nama permission sudah digunakan',
            'display_name.required' => 'Display name wajib diisi',
            'module.required' => 'Module wajib diisi',
        ]);

        Permission::create([
            'name' => $request->name,
            'display_name' => $request->display_name,
            'description' => $request->description,
            'module' => $request->module,
        ]);

        return redirect()->route('permissions.index')->with('success', 'Permission berhasil ditambahkan');
    }

    /**
     * Display the specified resource.
     */
    public function show(Permission $permission)
    {
        $permission->load(['roles']);
        
        return Inertia::render('master/permission/show', [
            'permission' => $permission,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Permission $permission)
    {
        $modules = Permission::distinct()->pluck('module')->filter()->sort()->values();

        return Inertia::render('master/permission/edit', [
            'permission' => $permission,
            'modules' => $modules,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Permission $permission)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:permissions,name,' . $permission->id,
            'display_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'module' => 'required|string|max:255',
        ], [
            'name.required' => 'Nama permission wajib diisi',
            'name.unique' => 'Nama permission sudah digunakan',
            'display_name.required' => 'Display name wajib diisi',
            'module.required' => 'Module wajib diisi',
        ]);

        $permission->update([
            'name' => $request->name,
            'display_name' => $request->display_name,
            'description' => $request->description,
            'module' => $request->module,
        ]);

        return redirect()->route('permissions.index')->with('success', 'Permission berhasil diperbarui');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Permission $permission)
    {
        if ($permission->roles()->count() > 0) {
            return redirect()->back()->with('error', 'Permission tidak dapat dihapus karena masih digunakan oleh role');
        }

        $permission->delete();

        return redirect()->route('permissions.index')->with('success', 'Permission berhasil dihapus');
    }
}
