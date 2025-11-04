<?php

namespace App\Http\Controllers\Arsip;

use App\Http\Controllers\Controller;
use App\Models\LetterTemplate;
use App\Models\User;
use App\Models\OrganizationUnit;
use App\Models\Notification;
use App\Services\TemplateService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TemplateController extends Controller
{
    private TemplateService $templateService;

    public function __construct(TemplateService $templateService)
    {
        $this->templateService = $templateService;
    }

    /**
     * Display a listing of templates
     */
    public function index(Request $request)
    {
        $query = LetterTemplate::with('creator')
            ->where('organization_unit_id', Auth::user()->organization_unit_id)
            ->orderBy('created_at', 'desc');

        // Filter by category
        if ($request->has('category') && $request->category) {
            $query->where('category', $request->category);
        }

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $templates = $query->paginate(10);

        // Get unique categories for filter
        $categories = LetterTemplate::select('category')
            ->where('organization_unit_id', Auth::user()->organization_unit_id)
            ->distinct()
            ->whereNotNull('category')
            ->pluck('category');

        return Inertia::render('arsip/templates/index', [
            'templates' => $templates,
            'categories' => $categories,
            'filters' => $request->only(['category', 'is_active', 'search']),
        ]);
    }

    /**
     * Show the form for creating a new template
     */
    public function create()
    {
        // Get all users with their organization unit and position
        $users = User::with('organizationUnit')
            ->whereNotNull('organization_unit_id')
            ->select('id', 'name', 'position', 'organization_unit_id')
            ->orderBy('name')
            ->get()
            ->map(function($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'position' => $user->position ?? '-',
                    'organization_unit' => $user->organizationUnit ? $user->organizationUnit->name : '-',
                ];
            });

        return Inertia::render('arsip/templates/create', [
            'users' => $users,
        ]);
    }

    /**
     * Store a newly created template
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:letter_templates,code',
            'category' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'content' => 'required|string',
            'content_html' => 'nullable|string',
            'variables' => 'required|string',
            'letterhead' => 'nullable|string',
            'signatures' => 'nullable|string',
            'signature_layout' => 'nullable|string',
            'numbering_format' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        // Parse JSON strings to arrays
        $validated['content'] = json_decode($validated['content'], true);
        $validated['variables'] = json_decode($validated['variables'], true);
        $validated['letterhead'] = isset($validated['letterhead']) ? json_decode($validated['letterhead'], true) : null;
        
        // Parse signatures if provided
        if (isset($validated['signatures'])) {
            $validated['signatures'] = json_decode($validated['signatures'], true);
        } else {
            $validated['signatures'] = [];
        }
        
        // Ensure signature_layout has value (NOT NULL constraint)
        if (!isset($validated['signature_layout']) || empty($validated['signature_layout'])) {
            $validated['signature_layout'] = 'bottom_right_1';
        }

        // Auto-assign organization_unit_id from user
        $validated['organization_unit_id'] = Auth::user()->organization_unit_id;
        $validated['created_by'] = Auth::id();

        $template = LetterTemplate::create($validated);

        return redirect()->route('arsip.templates.index')
            ->with('success', 'Template berhasil dibuat');
    }

    /**
     * Display the specified template
     */
    public function show(LetterTemplate $template)
    {
        $template->load('creator', 'updater');
        $template->loadCount('letters');

        // Use stored HTML if available, otherwise render from JSON for backward compatibility
        if (!empty($template->content_html)) {
            $template->rendered_html = $template->content_html;
        } else {
            // Fallback: render from JSON (for old templates created before HTML storage)
            $template->rendered_html = $this->templateService->jsonToHtml($template->content);
        }

        return Inertia::render('arsip/templates/show', [
            'template' => $template,
        ]);
    }

    /**
     * Show the form for editing the specified template
     */
    public function edit(LetterTemplate $template)
    {
        // Get all users with their organization unit and position
        $users = User::with('organizationUnit')
            ->whereNotNull('organization_unit_id')
            ->select('id', 'name', 'position', 'organization_unit_id')
            ->orderBy('name')
            ->get()
            ->map(function($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'position' => $user->position ?? '-',
                    'organization_unit' => $user->organizationUnit ? $user->organizationUnit->name : '-',
                ];
            });

        // Convert old Variable Node format to new Variable Mark format for backward compatibility
        $content = $template->content;
        if (is_array($content)) {
            $content = $this->templateService->convertVariableNodeToMark($content);
        }

        // Kirim data signatures dari database ke frontend untuk edit form
        $templateData = $template->toArray();
        $templateData['content'] = $content;
        $templateData['signatures'] = $template->signatures; // Kirim signatures dari database

        return Inertia::render('arsip/templates/edit', [
            'template' => $templateData,
            'users' => $users,
        ]);
    }

    /**
     * Update the specified template
     */
    public function update(Request $request, LetterTemplate $template)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:letter_templates,code,' . $template->id,
            'category' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'content' => 'required|string',
            'content_html' => 'nullable|string', // Store original HTML from editor
            'variables' => 'required|string',
            'letterhead' => 'nullable|string',
            'signatures' => 'nullable|string', // Accept signatures data
            'signature_layout' => 'nullable|string',
            'numbering_format' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        // Parse JSON strings to arrays
        $validated['content'] = json_decode($validated['content'], true);
        $validated['variables'] = json_decode($validated['variables'], true);
        $validated['letterhead'] = isset($validated['letterhead']) ? json_decode($validated['letterhead'], true) : null;
        
        // Parse signatures if provided
        if (isset($validated['signatures'])) {
            $validated['signatures'] = json_decode($validated['signatures'], true);
        }
        
        // Ensure signature_layout has value if not provided (NOT NULL constraint)
        if (!isset($validated['signature_layout']) || empty($validated['signature_layout'])) {
            $validated['signature_layout'] = 'bottom_right_1';
        }

        $validated['updated_by'] = Auth::id();

        $template->update($validated);

        return redirect()->route('arsip.templates.index')
            ->with('success', 'Template berhasil diperbarui');
    }

    /**
     * Remove the specified template
     */
    public function destroy(LetterTemplate $template)
    {
        // Check if template is being used
        if ($template->letters()->count() > 0) {
            return back()->with('error', 'Template tidak dapat dihapus karena sudah digunakan');
        }

        $template->delete();

        return redirect()->route('arsip.templates.index')
            ->with('success', 'Template berhasil dihapus');
    }

    /**
     * Toggle template active status
     */
    public function toggleActive(LetterTemplate $template)
    {
        $template->update([
            'is_active' => !$template->is_active,
            'updated_by' => Auth::id(),
        ]);

        $status = $template->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return back()->with('success', "Template berhasil {$status}");
    }

    /**
     * Duplicate template
     */
    public function duplicate(LetterTemplate $template)
    {
        $newTemplate = $template->replicate();
        $newTemplate->name = $template->name . ' (Copy)';
        $newTemplate->code = $template->code . '_COPY_' . time();
        $newTemplate->created_by = Auth::id();
        $newTemplate->updated_by = null;
        $newTemplate->save();

        return redirect()->route('arsip.templates.edit', $newTemplate)
            ->with('success', 'Template berhasil diduplikasi');
    }

    /**
     * Show form to share template to other organization units
     */
    public function showShareForm(LetterTemplate $template)
    {
        // Only creator or admin can share
        if ($template->created_by !== Auth::id() && Auth::user()->role_id !== 1) {
            abort(403, 'Anda tidak memiliki akses untuk membagikan template ini');
        }

        // Get all organization units except current user's unit
        $organizationUnits = OrganizationUnit::where('id', '!=', Auth::user()->organization_unit_id)
            ->where('is_active', true)
            ->orderBy('level')
            ->orderBy('name')
            ->get();

        return Inertia::render('arsip/templates/share', [
            'template' => $template,
            'organizationUnits' => $organizationUnits,
        ]);
    }

    /**
     * Share template to selected organization units (by duplicating)
     */
    public function shareToOrganizations(Request $request, LetterTemplate $template)
    {
        // Only creator or admin can share
        if ($template->created_by !== Auth::id() && Auth::user()->role_id !== 1) {
            return back()->with('error', 'Anda tidak memiliki akses untuk membagikan template ini');
        }

        $validated = $request->validate([
            'organization_unit_ids' => 'required|array|min:1',
            'organization_unit_ids.*' => 'required|exists:organization_units,id',
            'keep_original_name' => 'boolean',
        ]);

        $sharedCount = 0;
        $errors = [];

        foreach ($validated['organization_unit_ids'] as $orgUnitId) {
            try {
                // Extract base code (remove any existing _COPY_ suffix)
                $baseCode = preg_replace('/_COPY_\d+(_\d+)?$/', '', $template->code);
                
                // Check if a template with the same base code already exists in target organization
                $exists = LetterTemplate::where('organization_unit_id', $orgUnitId)
                    ->where(function($query) use ($baseCode) {
                        $query->where('code', $baseCode)
                              ->orWhere('code', 'like', $baseCode . '_COPY_%');
                    })
                    ->exists();

                if ($exists) {
                    $orgUnit = OrganizationUnit::find($orgUnitId);
                    $errors[] = "Template dengan kode dasar {$baseCode} sudah ada di {$orgUnit->name}";
                    continue;
                }

                // Duplicate template to target organization
                $newTemplate = $template->replicate();
                $newTemplate->organization_unit_id = $orgUnitId;
                
                // Generate unique code for the shared template
                // Extract base code (remove any existing _COPY_ suffix)
                $baseCode = preg_replace('/_COPY_\d+$/', '', $template->code);
                $newCode = $baseCode . '_COPY_' . time();
                
                // Ensure uniqueness by checking and adding incremental suffix if needed
                $counter = 1;
                while (LetterTemplate::where('code', $newCode)->exists()) {
                    $newCode = $baseCode . '_COPY_' . time() . '_' . $counter;
                    $counter++;
                }
                
                $newTemplate->code = $newCode;
                
                // Optionally modify name to indicate it's shared
                if (!($validated['keep_original_name'] ?? false)) {
                    $orgUnit = OrganizationUnit::find($orgUnitId);
                    $newTemplate->name = $template->name . " (dari " . Auth::user()->organizationUnit->name . ")";
                }
                
                $newTemplate->created_by = Auth::id();
                $newTemplate->updated_by = null;
                $newTemplate->save();

                $sharedCount++;

                // Send notification to organization unit head
                $orgUnit = OrganizationUnit::find($orgUnitId);
                if ($orgUnit->head_id) {
                    Notification::create([
                        'user_id' => $orgUnit->head_id,
                        'type' => 'template_shared',
                        'title' => 'Template Baru Dibagikan',
                        'message' => Auth::user()->name . " membagikan template \"{$template->name}\" ke unit {$orgUnit->name}",
                        'data' => [
                            'template_id' => $newTemplate->id,
                            'shared_by' => Auth::id(),
                        ],
                        'action_url' => route('arsip.templates.show', $newTemplate->id),
                    ]);
                }
            } catch (\Exception $e) {
                $orgUnit = OrganizationUnit::find($orgUnitId);
                $errors[] = "Gagal membagikan ke {$orgUnit->name}: {$e->getMessage()}";
            }
        }

        if ($sharedCount > 0) {
            $message = "Template berhasil dibagikan ke {$sharedCount} organization unit";
            if (!empty($errors)) {
                $message .= ". Beberapa error: " . implode(', ', $errors);
            }
            return redirect()->route('arsip.templates.index')->with('success', $message);
        } else {
            return back()->with('error', 'Gagal membagikan template: ' . implode(', ', $errors));
        }
    }
}
