<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Employee;
use App\Models\HR\EmployeeEducation;
use Illuminate\Http\Request;

class EmployeeEducationController extends Controller
{
    public function store(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'education_level_id' => 'required|exists:education_levels,id',
            'institution' => 'required|string|max:200',
            'major' => 'nullable|string|max:200',
            'start_year' => 'nullable|integer|min:1950|max:' . (date('Y') + 5),
            'end_year' => 'nullable|integer|min:1950|max:' . (date('Y') + 5),
            'gpa' => 'nullable|numeric|min:0|max:4',
            'certificate_number' => 'nullable|string|max:100',
            'is_highest' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        // If this is marked as highest, unmark others
        if (!empty($validated['is_highest'])) {
            $employee->educations()->update(['is_highest' => false]);
        }

        $employee->educations()->create($validated);

        return back();
    }

    public function update(Request $request, Employee $employee, EmployeeEducation $education)
    {
        $validated = $request->validate([
            'education_level_id' => 'required|exists:education_levels,id',
            'institution' => 'required|string|max:200',
            'major' => 'nullable|string|max:200',
            'start_year' => 'nullable|integer|min:1950|max:' . (date('Y') + 5),
            'end_year' => 'nullable|integer|min:1950|max:' . (date('Y') + 5),
            'gpa' => 'nullable|numeric|min:0|max:4',
            'certificate_number' => 'nullable|string|max:100',
            'is_highest' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        // If this is marked as highest, unmark others
        if (!empty($validated['is_highest'])) {
            $employee->educations()->where('id', '!=', $education->id)->update(['is_highest' => false]);
        }

        $education->update($validated);

        return back();
    }

    public function destroy(Employee $employee, EmployeeEducation $education)
    {
        $education->delete();

        return back();
    }
}
