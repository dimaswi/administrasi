<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\OrganizationUnit;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class OrganizationUnitController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->get('perPage', 10);
        $search = $request->get('search', '');
        $level = $request->get('level', '');

        $organizationUnits = OrganizationUnit::query()
            ->with(['parent', 'head', 'children'])
            ->withCount(['users', 'children'])
            ->when($search, function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            })
            ->when($level, function ($query, $level) {
                return $query->where('level', $level);
            })
            ->orderBy('level', 'asc')
            ->orderBy('code', 'asc')
            ->paginate($perPage)
            ->withQueryString();

        $levels = OrganizationUnit::distinct()->pluck('level')->sort()->values();

        return Inertia::render('master/organization/index', [
            'organizationUnits' => $organizationUnits,
            'levels' => $levels,
            'filters' => [
                'search' => $search,
                'level' => $level,
                'perPage' => $perPage,
            ],
        ]);
    }

    public function create()
    {
        $parentUnits = OrganizationUnit::where('is_active', true)
            ->orderBy('level', 'asc')
            ->orderBy('name', 'asc')
            ->get();
        
        $users = User::where('role_id', '!=', null)
            ->orderBy('name', 'asc')
            ->get();

        return Inertia::render('master/organization/create', [
            'parentUnits' => $parentUnits,
            'users' => $users,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'code' => 'required|string|max:50|unique:organization_units',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'letterhead_image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'parent_id' => 'nullable|exists:organization_units,id',
            'level' => 'required|integer|min:1',
            'head_id' => 'nullable|exists:users,id',
            'is_active' => 'boolean',
        ], [
            'code.required' => 'Kode unit wajib diisi',
            'code.unique' => 'Kode unit sudah digunakan',
            'name.required' => 'Nama unit wajib diisi',
            'level.required' => 'Level wajib diisi',
            'level.min' => 'Level minimal 1',
            'letterhead_image.image' => 'File harus berupa gambar',
            'letterhead_image.mimes' => 'Format gambar harus jpeg, png, atau jpg',
            'letterhead_image.max' => 'Ukuran gambar maksimal 2MB',
            'parent_id.exists' => 'Parent unit tidak valid',
            'head_id.exists' => 'Kepala unit tidak valid',
        ]);

        $data = $request->except('letterhead_image');
        
        // Handle file upload
        if ($request->hasFile('letterhead_image')) {
            $file = $request->file('letterhead_image');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('letterheads', $filename, 'public');
            $data['letterhead_image'] = $path;
        }

        OrganizationUnit::create($data);

        return redirect()->route('organizations.index')->with('success', 'Unit organisasi berhasil ditambahkan');
    }

    public function show(OrganizationUnit $organization)
    {
        $organization->load([
            'parent',
            'head',
            'children.head',
            'users' => function ($query) {
                $query->orderBy('name');
            }
        ]);

        return inertia('master/organization/show', [
            'organization' => $organization,
        ]);
    }

    public function edit(OrganizationUnit $organization)
    {
        $organization->load(['parent', 'head']);
        
        $parentUnits = OrganizationUnit::where('id', '!=', $organization->id)
            ->where('is_active', true)
            ->orderBy('level', 'asc')
            ->orderBy('name', 'asc')
            ->get();
        
        $users = User::where('role_id', '!=', null)
            ->orderBy('name', 'asc')
            ->get();

        return Inertia::render('master/organization/edit', [
            'organization' => $organization,
            'parentUnits' => $parentUnits,
            'users' => $users,
        ]);
    }

    public function update(Request $request, OrganizationUnit $organization)
    {
        $request->validate([
            'code' => 'required|string|max:50|unique:organization_units,code,' . $organization->id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'letterhead_image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'parent_id' => 'nullable|exists:organization_units,id',
            'level' => 'required|integer|min:1',
            'head_id' => 'nullable|exists:users,id',
            'is_active' => 'boolean',
        ], [
            'code.required' => 'Kode unit wajib diisi',
            'code.unique' => 'Kode unit sudah digunakan',
            'name.required' => 'Nama unit wajib diisi',
            'level.required' => 'Level wajib diisi',
            'level.min' => 'Level minimal 1',
            'letterhead_image.image' => 'File harus berupa gambar',
            'letterhead_image.mimes' => 'Format gambar harus jpeg, png, atau jpg',
            'letterhead_image.max' => 'Ukuran gambar maksimal 2MB',
            'parent_id.exists' => 'Parent unit tidak valid',
            'head_id.exists' => 'Kepala unit tidak valid',
        ]);

        // Prevent circular reference
        if ($request->parent_id == $organization->id) {
            return redirect()->back()->withErrors(['parent_id' => 'Unit tidak bisa menjadi parent dari dirinya sendiri']);
        }

        $data = $request->except('letterhead_image');
        
        // Handle file upload
        if ($request->hasFile('letterhead_image')) {
            // Delete old file if exists
            if ($organization->letterhead_image) {
                Storage::disk('public')->delete($organization->letterhead_image);
            }
            
            $file = $request->file('letterhead_image');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('letterheads', $filename, 'public');
            $data['letterhead_image'] = $path;
        }

        $organization->update($data);

        return redirect()->route('organizations.index')->with('success', 'Unit organisasi berhasil diperbarui');
    }

    public function destroy(OrganizationUnit $organization)
    {
        if ($organization->users()->count() > 0) {
            return redirect()->back()->with('error', 'Unit organisasi tidak dapat dihapus karena masih memiliki user');
        }

        if ($organization->children()->count() > 0) {
            return redirect()->back()->with('error', 'Unit organisasi tidak dapat dihapus karena masih memiliki sub unit');
        }

        if ($organization->meetings()->count() > 0) {
            return redirect()->back()->with('error', 'Unit organisasi tidak dapat dihapus karena masih memiliki rapat');
        }

        // Delete letterhead image if exists
        if ($organization->letterhead_image) {
            Storage::disk('public')->delete($organization->letterhead_image);
        }

        $organization->delete();

        return redirect()->route('organizations.index')->with('success', 'Unit organisasi berhasil dihapus');
    }
}

