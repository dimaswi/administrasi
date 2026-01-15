<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CompanySettingsController extends Controller
{
    public function index()
    {
        $settings = $this->getSettings();
        
        return Inertia::render('settings/company', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'company_short_name' => 'nullable|string|max:50',
            'company_address' => 'nullable|string|max:500',
            'company_phone' => 'nullable|string|max:20',
            'company_email' => 'nullable|email|max:255',
            'company_website' => 'nullable|url|max:255',
            'company_npwp' => 'nullable|string|max:30',
            'office_latitude' => 'nullable|numeric|between:-90,90',
            'office_longitude' => 'nullable|numeric|between:-180,180',
            'office_radius' => 'nullable|integer|min:50|max:1000',
            'work_start_time' => 'nullable|date_format:H:i',
            'work_end_time' => 'nullable|date_format:H:i',
            'late_tolerance_minutes' => 'nullable|integer|min:0|max:60',
            'leave_approval_levels' => 'nullable|integer|min:1|max:3',
            'overtime_approval_required' => 'nullable|boolean',
        ]);

        foreach ($validated as $key => $value) {
            $this->setSetting($key, $value);
        }

        Cache::forget('company_settings');

        return back()->with('success', 'Pengaturan perusahaan berhasil disimpan.');
    }

    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|image|mimes:png,jpg,jpeg|max:2048',
        ]);

        $path = $request->file('logo')->store('company', 'public');
        
        $oldLogo = $this->getSetting('company_logo');
        if ($oldLogo && Storage::disk('public')->exists($oldLogo)) {
            Storage::disk('public')->delete($oldLogo);
        }

        $this->setSetting('company_logo', $path);
        Cache::forget('company_settings');

        return back()->with('success', 'Logo berhasil diupload.');
    }

    private function getSettings(): array
    {
        return Cache::remember('company_settings', 3600, function () {
            $settings = \DB::table('settings')->pluck('value', 'key')->toArray();
            
            return [
                'company_name' => $settings['company_name'] ?? 'PT. Nama Perusahaan',
                'company_short_name' => $settings['company_short_name'] ?? '',
                'company_address' => $settings['company_address'] ?? '',
                'company_phone' => $settings['company_phone'] ?? '',
                'company_email' => $settings['company_email'] ?? '',
                'company_website' => $settings['company_website'] ?? '',
                'company_npwp' => $settings['company_npwp'] ?? '',
                'company_logo' => $settings['company_logo'] ?? null,
                'office_latitude' => (float) ($settings['office_latitude'] ?? -6.2088),
                'office_longitude' => (float) ($settings['office_longitude'] ?? 106.8456),
                'office_radius' => (int) ($settings['office_radius'] ?? 100),
                'work_start_time' => $settings['work_start_time'] ?? '08:00',
                'work_end_time' => $settings['work_end_time'] ?? '17:00',
                'late_tolerance_minutes' => (int) ($settings['late_tolerance_minutes'] ?? 15),
                'leave_approval_levels' => (int) ($settings['leave_approval_levels'] ?? 1),
                'overtime_approval_required' => (bool) ($settings['overtime_approval_required'] ?? true),
            ];
        });
    }

    private function getSetting(string $key, $default = null)
    {
        return \DB::table('settings')->where('key', $key)->value('value') ?? $default;
    }

    private function setSetting(string $key, $value): void
    {
        \DB::table('settings')->updateOrInsert(
            ['key' => $key],
            ['value' => $value, 'updated_at' => now()]
        );
    }
}
