<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Employee;
use App\Models\HR\EmployeeFamily;
use Illuminate\Http\Request;

class EmployeeFamilyController extends Controller
{
    public function store(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'relation' => 'required|string|max:50',
            'nik' => 'nullable|string|max:16',
            'gender' => 'nullable|string|in:male,female',
            'place_of_birth' => 'nullable|string|max:100',
            'date_of_birth' => 'nullable|date',
            'occupation' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',
            'is_emergency_contact' => 'boolean',
            'is_dependent' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $employee->families()->create($validated);

        return back();
    }

    public function update(Request $request, Employee $employee, EmployeeFamily $family)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'relation' => 'required|string|max:50',
            'nik' => 'nullable|string|max:16',
            'gender' => 'nullable|string|in:male,female',
            'place_of_birth' => 'nullable|string|max:100',
            'date_of_birth' => 'nullable|date',
            'occupation' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',
            'is_emergency_contact' => 'boolean',
            'is_dependent' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $family->update($validated);

        return back();
    }

    public function destroy(Employee $employee, EmployeeFamily $family)
    {
        $family->delete();

        return back();
    }
}
