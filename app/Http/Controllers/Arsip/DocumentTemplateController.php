<?php

namespace App\Http\Controllers\Arsip;

use App\Http\Controllers\Controller;
use App\Models\DocumentTemplate;
use App\Models\OrganizationUnit;
use App\Models\OutgoingLetter;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\CacheService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class DocumentTemplateController extends Controller
{
    /**
     * Display a listing of templates
     */
    public function index(Request $request)
    {
        $query = DocumentTemplate::with('creator')
            ->where('organization_unit_id', Auth::user()->organization_unit_id)
            ->orderBy('created_at', 'desc');

        // Filter by category
        if ($request->has('category') && $request->category) {
            $query->where('category', $request->category);
        }

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('code', 'ilike', "%{$search}%")
                  ->orWhere('description', 'ilike', "%{$search}%");
            });
        }

        $templates = $query->paginate(15);

        // Get unique categories for filter
        $categories = DocumentTemplate::select('category')
            ->where('organization_unit_id', Auth::user()->organization_unit_id)
            ->distinct()
            ->whereNotNull('category')
            ->pluck('category');

        return Inertia::render('arsip/document-templates/index', [
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
        // Get unique categories for dropdown
        $categories = DocumentTemplate::select('category')
            ->where('organization_unit_id', auth()->user()->organization_unit_id)
            ->distinct()
            ->whereNotNull('category')
            ->pluck('category')
            ->toArray();

        return Inertia::render('arsip/document-templates/create', [
            'categories' => $categories,
            'defaults' => [
                'page_settings' => DocumentTemplate::defaultPageSettings(),
                'header_settings' => DocumentTemplate::defaultHeaderSettings(),
                'signature_settings' => DocumentTemplate::defaultSignatureSettings(),
            ],
            'paper_sizes' => DocumentTemplate::paperSizes(),
            'font_families' => DocumentTemplate::fontFamilies(),
        ]);
    }

    /**
     * Store a newly created template
     */
    public function store(Request $request)
    {
        $userOrgId = Auth::user()->organization_unit_id;
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => [
                'required',
                'string',
                'max:50',
                // Unique within the user's organization unit only
                \Illuminate\Validation\Rule::unique('document_templates', 'code')
                    ->where('organization_unit_id', $userOrgId),
            ],
            'category' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'page_settings' => 'required|array',
            'page_settings.paper_size' => 'required|string|in:A4,Letter,Legal,F4',
            'page_settings.orientation' => 'required|string|in:portrait,landscape',
            'page_settings.margins' => 'required|array',
            'page_settings.margins.top' => 'required|numeric|min:0|max:100',
            'page_settings.margins.bottom' => 'required|numeric|min:0|max:100',
            'page_settings.margins.left' => 'required|numeric|min:0|max:100',
            'page_settings.margins.right' => 'required|numeric|min:0|max:100',
            'page_settings.default_font' => 'required|array',
            'page_settings.default_font.family' => 'required|string',
            'page_settings.default_font.size' => 'required|numeric|min:6|max:72',
            'page_settings.default_font.line_height' => 'required|numeric|min:0.5|max:5',
            'header_settings' => 'nullable|array',
            'content_blocks' => 'required|array',
            'footer_settings' => 'nullable|array',
            'signature_settings' => 'required|array',
            'variables' => 'required|array',
            'numbering_format' => 'nullable|string|max:255',
        ]);

        // Handle logo upload if present
        if ($request->hasFile('header_logo')) {
            $logoPath = $request->file('header_logo')->store('template-logos', 'public');
            $validated['header_settings']['logo']['src'] = $logoPath;
        }

        $template = DocumentTemplate::create([
            ...$validated,
            'organization_unit_id' => Auth::user()->organization_unit_id,
            'created_by' => Auth::id(),
            'is_active' => true,
        ]);

        // Clear related cache
        CacheService::clearTemplateCache();

        return redirect()->route('arsip.document-templates.show', $template)
            ->with('success', 'Template berhasil dibuat');
    }

    /**
     * Display the specified template
     */
    public function show(DocumentTemplate $documentTemplate)
    {
        $this->authorizeAccess($documentTemplate);
        
        $documentTemplate->load('creator', 'organizationUnit');

        return Inertia::render('arsip/document-templates/show', [
            'template' => $documentTemplate,
            'paper_sizes' => DocumentTemplate::paperSizes(),
        ]);
    }

    /**
     * Show the form for editing the template (Builder)
     */
    public function edit(DocumentTemplate $documentTemplate)
    {
        $this->authorizeAccess($documentTemplate);

        // Get unique categories for dropdown
        $categories = DocumentTemplate::select('category')
            ->where('organization_unit_id', auth()->user()->organization_unit_id)
            ->distinct()
            ->whereNotNull('category')
            ->pluck('category')
            ->toArray();

        return Inertia::render('arsip/document-templates/edit', [
            'template' => $documentTemplate,
            'categories' => $categories,
            'paper_sizes' => DocumentTemplate::paperSizes(),
            'font_families' => DocumentTemplate::fontFamilies(),
        ]);
    }

    /**
     * Update the specified template
     */
    public function update(Request $request, DocumentTemplate $documentTemplate)
    {
        $this->authorizeAccess($documentTemplate);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => [
                'required',
                'string',
                'max:50',
                // Unique within the same organization unit, excluding current template
                \Illuminate\Validation\Rule::unique('document_templates', 'code')
                    ->where('organization_unit_id', $documentTemplate->organization_unit_id)
                    ->ignore($documentTemplate->id),
            ],
            'category' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'page_settings' => 'required|array',
            'header_settings' => 'nullable|array',
            'content_blocks' => 'required|array',
            'footer_settings' => 'nullable|array',
            'signature_settings' => 'required|array',
            'variables' => 'required|array',
            'numbering_format' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        // Handle logo upload if present
        if ($request->hasFile('header_logo')) {
            // Delete old logo
            if ($documentTemplate->header_settings['logo']['src'] ?? null) {
                Storage::disk('public')->delete($documentTemplate->header_settings['logo']['src']);
            }
            $logoPath = $request->file('header_logo')->store('template-logos', 'public');
            $validated['header_settings']['logo']['src'] = $logoPath;
        }

        $validated['updated_by'] = Auth::id();

        $documentTemplate->update($validated);

        // Clear related cache
        CacheService::clearTemplateCache($documentTemplate->id);

        return back()->with('success', 'Template berhasil diperbarui');
    }

    /**
     * Remove the specified template
     */
    public function destroy(DocumentTemplate $documentTemplate)
    {
        $this->authorizeAccess($documentTemplate);

        // Check if template is used by any letters
        if ($documentTemplate->letters()->count() > 0) {
            return back()->with('error', 'Template tidak dapat dihapus karena sudah digunakan oleh surat');
        }

        // Delete logo if exists
        if ($documentTemplate->header_settings['logo']['src'] ?? null) {
            Storage::disk('public')->delete($documentTemplate->header_settings['logo']['src']);
        }

        $documentTemplate->delete();

        // Clear related cache
        CacheService::clearTemplateCache($documentTemplate->id);

        return redirect()->route('arsip.document-templates.index')
            ->with('success', 'Template berhasil dihapus');
    }

    /**
     * Toggle template active status
     */
    public function toggleActive(DocumentTemplate $documentTemplate)
    {
        $this->authorizeAccess($documentTemplate);

        $documentTemplate->update([
            'is_active' => !$documentTemplate->is_active,
            'updated_by' => Auth::id(),
        ]);

        // Clear related cache
        CacheService::clearTemplateCache($documentTemplate->id);

        return back()->with('success', 'Status template berhasil diubah');
    }

    /**
     * Show duplicate form
     * Note: No authorization - any user can view and duplicate templates from any org
     */
    public function duplicateForm(DocumentTemplate $documentTemplate)
    {
        $documentTemplate->load('organizationUnit');

        // Get all organization units for selection
        $organizationUnits = OrganizationUnit::orderBy('name')->get();

        // Get current letter count for this numbering group
        $numberingGroupId = $documentTemplate->getNumberingGroupId();
        $linkedTemplateIds = DocumentTemplate::where(function($query) use ($numberingGroupId) {
            $query->where('numbering_group_id', $numberingGroupId)
                  ->orWhere('id', $numberingGroupId);
        })->pluck('id')->toArray();

        $currentLetterCount = OutgoingLetter::whereIn('template_id', $linkedTemplateIds)
            ->whereYear('created_at', now()->year)
            ->whereNotNull('letter_number')
            ->count();

        // Get linked templates
        $linkedTemplates = DocumentTemplate::whereIn('id', $linkedTemplateIds)
            ->where('id', '!=', $documentTemplate->id)
            ->with('organizationUnit')
            ->get();

        return Inertia::render('arsip/document-templates/duplicate', [
            'template' => $documentTemplate,
            'organizationUnits' => $organizationUnits,
            'currentLetterCount' => $currentLetterCount,
            'linkedTemplates' => $linkedTemplates,
        ]);
    }

    /**
     * Duplicate a template with options
     * Note: No authorization - any user can duplicate templates to their org
     */
    public function duplicate(Request $request, DocumentTemplate $documentTemplate)
    {
        $isNewTemplate = $request->boolean('is_new_template');
        $targetOrgId = $request->input('organization_unit_id');

        // For both types, code must be unique within the target organization unit
        // But we allow same code in different organization units (for linked templates across units)
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => [
                'required',
                'string',
                'max:50',
                // Unique within the target organization unit
                \Illuminate\Validation\Rule::unique('document_templates', 'code')
                    ->where('organization_unit_id', $targetOrgId),
            ],
            'organization_unit_id' => 'required|exists:organization_units,id',
            'numbering_format' => 'nullable|string|max:255',
            'is_new_template' => 'required|boolean',
        ]);

        // For linked template (not new), ensure code matches source template
        if (!$isNewTemplate && $validated['code'] !== $documentTemplate->code) {
            return back()->withErrors([
                'code' => 'Kode template harus sama dengan template sumber untuk template terhubung'
            ]);
        }

        $newTemplate = $documentTemplate->replicate();
        $newTemplate->name = $validated['name'];
        $newTemplate->code = $validated['code'];
        $newTemplate->organization_unit_id = $validated['organization_unit_id'];
        $newTemplate->numbering_format = $validated['numbering_format'] ?? $documentTemplate->numbering_format;
        $newTemplate->created_by = Auth::id();
        $newTemplate->updated_by = null;
        
        // Set numbering group based on option
        if (!$isNewTemplate) {
            // Share numbering with source template (linked)
            $newTemplate->numbering_group_id = $documentTemplate->getNumberingGroupId();
        } else {
            // Independent numbering (will be set to own ID after save)
            $newTemplate->numbering_group_id = null;
        }
        
        $newTemplate->save();

        // If independent numbering, set numbering_group_id to own ID
        if ($isNewTemplate) {
            $newTemplate->update(['numbering_group_id' => $newTemplate->id]);
        }

        // Clear related cache
        CacheService::clearTemplateCache();

        // Send notification to original template creator
        NotificationService::notifyTemplateDuplicated($documentTemplate, $newTemplate, Auth::user());

        // Get target org name for message
        $targetOrg = OrganizationUnit::find($validated['organization_unit_id']);
        
        return redirect()->route('arsip.document-templates.index')
            ->with('success', "Template berhasil diduplikasi ke unit {$targetOrg->name}");
    }

    /**
     * Upload header logo
     */
    public function uploadLogo(Request $request, DocumentTemplate $documentTemplate)
    {
        $this->authorizeAccess($documentTemplate);

        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        // Delete old logo
        if ($documentTemplate->header_settings['logo']['src'] ?? null) {
            Storage::disk('public')->delete($documentTemplate->header_settings['logo']['src']);
        }

        $logoPath = $request->file('logo')->store('template-logos', 'public');

        $headerSettings = $documentTemplate->header_settings ?? DocumentTemplate::defaultHeaderSettings();
        $headerSettings['logo']['src'] = $logoPath;
        $headerSettings['logo']['enabled'] = true;

        $documentTemplate->update([
            'header_settings' => $headerSettings,
            'updated_by' => Auth::id(),
        ]);

        // Clear related cache
        CacheService::clearTemplateCache($documentTemplate->id);

        return response()->json([
            'success' => true,
            'logo_path' => $logoPath,
            'logo_url' => Storage::disk('public')->url($logoPath),
        ]);
    }

    /**
     * Preview template with sample data
     */
    public function preview(Request $request, DocumentTemplate $documentTemplate)
    {
        $this->authorizeAccess($documentTemplate);

        // Generate sample data from variables
        $sampleData = [];
        foreach ($documentTemplate->variables ?? [] as $variable) {
            $sampleData[$variable['key']] = $variable['default_value'] ?? '[' . $variable['label'] . ']';
        }

        return Inertia::render('arsip/document-templates/preview', [
            'template' => $documentTemplate,
            'sample_data' => $sampleData,
            'paper_sizes' => DocumentTemplate::paperSizes(),
        ]);
    }

    /**
     * Check if user can access this template
     */
    private function authorizeAccess(DocumentTemplate $template): void
    {
        if ($template->organization_unit_id !== Auth::user()->organization_unit_id) {
            abort(403, 'Anda tidak memiliki akses ke template ini');
        }
    }
}
