<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Employee;
use App\Models\HR\EmployeeWorkHistory;
use Illuminate\Http\Request;

class EmployeeWorkHistoryController extends Controller
{
    public function store(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:200',
            'position' => 'required|string|max:200',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'job_description' => 'nullable|string',
            'leaving_reason' => 'nullable|string|max:200',
            'reference_contact' => 'nullable|string|max:100',
            'reference_phone' => 'nullable|string|max:20',
        ]);

        $employee->workHistories()->create($validated);

        return back();
    }

    public function update(Request $request, Employee $employee, EmployeeWorkHistory $workHistory)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:200',
            'position' => 'required|string|max:200',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'job_description' => 'nullable|string',
            'leaving_reason' => 'nullable|string|max:200',
            'reference_contact' => 'nullable|string|max:100',
            'reference_phone' => 'nullable|string|max:20',
        ]);

        $workHistory->update($validated);

        return back();
    }

    public function destroy(Employee $employee, EmployeeWorkHistory $workHistory)
    {
        $workHistory->delete();

        return back();
    }
}
