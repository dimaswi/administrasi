<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\KpiCategory;
use App\Models\HR\KpiTemplate;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KpiController extends Controller
{
    /**
     * Display KPI categories and templates
     */
    public function index(Request $request)
    {
        $categories = KpiCategory::withCount('templates')
            ->ordered()
            ->get()
            ->map(fn($cat) => [
                'id' => $cat->id,
                'name' => $cat->name,
                'code' => $cat->code,
                'description' => $cat->description,
                'weight' => $cat->weight,
                'sort_order' => $cat->sort_order,
                'is_active' => $cat->is_active,
                'templates_count' => $cat->templates_count,
            ]);

        $templates = KpiTemplate::with('category')
            ->orderBy('category_id')
            ->orderBy('name')
            ->get()
            ->map(fn($tpl) => [
                'id' => $tpl->id,
                'category_id' => $tpl->category_id,
                'category_name' => $tpl->category->name,
                'name' => $tpl->name,
                'code' => $tpl->code,
                'description' => $tpl->description,
                'measurement_type' => $tpl->measurement_type,
                'measurement_type_label' => $tpl->measurement_type_label,
                'unit' => $tpl->unit,
                'target_min' => $tpl->target_min,
                'target_max' => $tpl->target_max,
                'target_range' => $tpl->target_range,
                'weight' => $tpl->weight,
                'is_active' => $tpl->is_active,
            ]);

        return Inertia::render('HR/performance/kpi/index', [
            'categories' => $categories,
            'templates' => $templates,
            'measurementTypes' => KpiTemplate::MEASUREMENT_TYPES,
        ]);
    }

    /**
     * Store new KPI category
     */
    public function storeCategory(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:kpi_categories,code',
            'description' => 'nullable|string',
            'weight' => 'required|integer|min:1|max:100',
            'sort_order' => 'integer|min:0',
            'is_active' => 'boolean',
        ]);

        KpiCategory::create($validated);

        return back()->with('success', 'Kategori KPI berhasil ditambahkan');
    }

    /**
     * Update KPI category
     */
    public function updateCategory(Request $request, KpiCategory $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:kpi_categories,code,' . $category->id,
            'description' => 'nullable|string',
            'weight' => 'required|integer|min:1|max:100',
            'sort_order' => 'integer|min:0',
            'is_active' => 'boolean',
        ]);

        $category->update($validated);

        return back()->with('success', 'Kategori KPI berhasil diperbarui');
    }

    /**
     * Delete KPI category
     */
    public function destroyCategory(KpiCategory $category)
    {
        if ($category->templates()->exists()) {
            return back()->with('error', 'Tidak dapat menghapus kategori yang masih memiliki template KPI');
        }

        if ($category->reviewItems()->exists()) {
            return back()->with('error', 'Tidak dapat menghapus kategori yang sudah digunakan dalam penilaian');
        }

        $category->delete();

        return back()->with('success', 'Kategori KPI berhasil dihapus');
    }

    /**
     * Store new KPI template
     */
    public function storeTemplate(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:kpi_categories,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:kpi_templates,code',
            'description' => 'nullable|string',
            'measurement_type' => 'required|in:' . implode(',', array_keys(KpiTemplate::MEASUREMENT_TYPES)),
            'unit' => 'nullable|string|max:50',
            'target_min' => 'nullable|numeric',
            'target_max' => 'nullable|numeric|gte:target_min',
            'weight' => 'integer|min:1',
            'is_active' => 'boolean',
        ]);

        KpiTemplate::create($validated);

        return back()->with('success', 'Template KPI berhasil ditambahkan');
    }

    /**
     * Update KPI template
     */
    public function updateTemplate(Request $request, KpiTemplate $template)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:kpi_categories,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:kpi_templates,code,' . $template->id,
            'description' => 'nullable|string',
            'measurement_type' => 'required|in:' . implode(',', array_keys(KpiTemplate::MEASUREMENT_TYPES)),
            'unit' => 'nullable|string|max:50',
            'target_min' => 'nullable|numeric',
            'target_max' => 'nullable|numeric|gte:target_min',
            'weight' => 'integer|min:1',
            'is_active' => 'boolean',
        ]);

        $template->update($validated);

        return back()->with('success', 'Template KPI berhasil diperbarui');
    }

    /**
     * Delete KPI template
     */
    public function destroyTemplate(KpiTemplate $template)
    {
        if ($template->reviewItems()->exists()) {
            return back()->with('error', 'Tidak dapat menghapus template yang sudah digunakan dalam penilaian');
        }

        $template->delete();

        return back()->with('success', 'Template KPI berhasil dihapus');
    }
}
