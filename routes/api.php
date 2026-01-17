<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group.
|
*/

// Auth routes for mobile
Route::prefix('auth')->group(function () {
    // Login
    Route::post('/login', function (Request $request) {
        $request->validate([
            'nip' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('nip', $request->nip)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'NIP atau password salah',
            ], 401);
        }

        // Revoke old tokens
        $user->tokens()->delete();

        // Create new token
        $token = $user->createToken('mobile-app')->plainTextToken;

        // Get employee data if exists
        $employee = \App\Models\HR\Employee::where('user_id', $user->id)
            ->with(['organizationUnit', 'jobCategory', 'employmentStatus'])
            ->first();

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'nip' => $user->nip,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'organization_unit_id' => $user->organization_unit_id,
                'is_active' => $user->is_active,
            ],
            'employee' => $employee,
        ]);
    });

    // Logout
    Route::post('/logout', function (Request $request) {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    })->middleware('auth:sanctum');

    // Get profile
    Route::get('/profile', function (Request $request) {
        $user = $request->user();
        
        // Get employee data if exists
        $employee = \App\Models\HR\Employee::where('user_id', $user->id)
            ->with(['organizationUnit', 'jobCategory', 'employmentStatus'])
            ->first();
        
        return response()->json([
            'data' => [
                'id' => $user->id,
                'nip' => $user->nip,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'organization_unit_id' => $user->organization_unit_id,
                'is_active' => $user->is_active,
                'employee' => $employee,
            ],
        ]);
    })->middleware('auth:sanctum');

    // Change password
    Route::post('/change-password', function (Request $request) {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Password saat ini salah',
                'errors' => ['current_password' => ['Password saat ini salah']],
            ], 422);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json([
            'message' => 'Password berhasil diubah',
        ]);
    })->middleware('auth:sanctum');
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // HR Employees
    Route::prefix('hr')->group(function () {
        Route::get('/employees', function () {
            return response()->json([
                'data' => \App\Models\HR\Employee::with('user', 'organizationUnit')->paginate(20),
            ]);
        });

        Route::get('/employees/me', function (Request $request) {
            $employee = \App\Models\HR\Employee::where('user_id', $request->user()->id)
                ->with(['user', 'organizationUnit', 'jobCategory', 'employmentStatus'])
                ->first();
            
            if (!$employee) {
                return response()->json(['data' => null, 'message' => 'Employee not found'], 404);
            }
            
            return response()->json([
                'data' => $employee,
            ]);
        });

        // Get employees for delegation selection
        Route::get('/employees/delegation-list', function (Request $request) {
            $employee = \App\Models\HR\Employee::where('user_id', $request->user()->id)->first();
            
            if (!$employee) {
                return response()->json(['data' => []], 200);
            }
            
            // Get all active employees except self
            $employees = \App\Models\HR\Employee::where('status', 'active')
                ->where('id', '!=', $employee->id)
                ->orderBy('first_name')
                ->get(['id', 'employee_id', 'first_name', 'last_name', 'position']);
            
            // Transform for mobile
            $data = $employees->map(function ($emp) {
                return [
                    'id' => $emp->id,
                    'employee_id' => $emp->employee_id,
                    'name' => trim($emp->first_name . ' ' . ($emp->last_name ?? '')),
                    'position' => $emp->position,
                ];
            });
            
            return response()->json(['data' => $data]);
        });

        Route::put('/employees/me', function (Request $request) {
            $employee = \App\Models\HR\Employee::where('user_id', $request->user()->id)->first();
            
            if (!$employee) {
                return response()->json(['message' => 'Employee not found'], 404);
            }
            
            // Fields that can be updated by the user
            $fillableFields = [
                'nik',
                'email',
                'phone',
                'phone_secondary',
                'gender',
                'place_of_birth',
                'date_of_birth',
                'religion',
                'blood_type',
                'marital_status',
                'address',
                'city',
                'province',
                'postal_code',
                'emergency_contact_name',
                'emergency_contact_phone',
                'emergency_contact_relation',
                'npwp_number',
                'bpjs_kesehatan_number',
                'bpjs_ketenagakerjaan_number',
                'bank_name',
                'bank_account_number',
                'bank_account_name',
            ];
            
            $data = $request->only($fillableFields);
            
            // Remove null/empty values
            $data = array_filter($data, function($value) {
                return $value !== null && $value !== '';
            });
            
            $employee->update($data);
            
            return response()->json([
                'data' => $employee->fresh(['user', 'organizationUnit', 'jobCategory', 'employmentStatus']),
                'message' => 'Data berhasil diperbarui',
            ]);
        });

        Route::get('/employees/{id}', function ($id) {
            $employee = \App\Models\HR\Employee::with('user', 'organizationUnit')->findOrFail($id);
            return response()->json([
                'data' => $employee,
            ]);
        });

        // Attendances
        Route::get('/attendances', function (Request $request) {
            $employee = \App\Models\HR\Employee::where('user_id', $request->user()->id)->first();
            
            $attendances = \App\Models\HR\Attendance::where('employee_id', $employee?->id)
                ->orderBy('date', 'desc')
                ->paginate(20);
            
            // Add status_label to each attendance
            $attendances->getCollection()->transform(function ($attendance) {
                $attendance->status_label = \App\Models\HR\Attendance::STATUS_LABELS[$attendance->status] ?? $attendance->status;
                $attendance->clock_in_formatted = $attendance->clock_in ? $attendance->clock_in->format('H:i') : null;
                $attendance->clock_out_formatted = $attendance->clock_out ? $attendance->clock_out->format('H:i') : null;
                return $attendance;
            });
            
            return response()->json([
                'data' => $attendances,
            ]);
        });

        // Get today's schedule
        Route::get('/attendances/schedule/today', function (Request $request) {
            $employee = \App\Models\HR\Employee::where('user_id', $request->user()->id)->first();
            
            if (!$employee) {
                return response()->json(['message' => 'Employee not found'], 404);
            }

            $today = now()->toDateString();
            
            // Check if employee has approved leave for today
            $approvedLeave = \App\Models\HR\Leave::where('employee_id', $employee->id)
                ->where('status', 'approved')
                ->where('start_date', '<=', $today)
                ->where('end_date', '>=', $today)
                ->with('leaveType')
                ->first();
            
            if ($approvedLeave) {
                return response()->json([
                    'is_day_off' => true,
                    'is_on_leave' => true,
                    'leave' => [
                        'id' => $approvedLeave->id,
                        'type' => $approvedLeave->leaveType?->name ?? 'Cuti',
                        'start_date' => $approvedLeave->start_date->format('Y-m-d'),
                        'end_date' => $approvedLeave->end_date->format('Y-m-d'),
                        'reason' => $approvedLeave->reason,
                    ],
                    'message' => 'Anda sedang dalam masa ' . ($approvedLeave->leaveType?->name ?? 'cuti'),
                ]);
            }

            $schedule = \App\Models\HR\EmployeeSchedule::getCurrentSchedule($employee->id);
            $dayOfWeek = strtolower(now()->format('l'));
            $shift = $schedule?->getShiftForDay($dayOfWeek);
            
            if (!$shift) {
                return response()->json([
                    'is_day_off' => true,
                    'is_on_leave' => false,
                    'message' => 'Hari ini adalah hari libur Anda',
                ]);
            }

            return response()->json([
                'is_day_off' => false,
                'is_on_leave' => false,
                'shift' => [
                    'id' => $shift->id,
                    'name' => $shift->name,
                    'clock_in_time' => substr($shift->clock_in_time, 0, 5),
                    'clock_out_time' => substr($shift->clock_out_time, 0, 5),
                ],
            ]);
        });

        Route::post('/attendances/clock-in', function (Request $request) {
            $employee = \App\Models\HR\Employee::where('user_id', $request->user()->id)->first();
            
            if (!$employee) {
                return response()->json(['message' => 'Employee not found'], 404);
            }

            $today = now()->toDateString();
            $now = now();
            
            // Check if employee has approved leave for today
            $approvedLeave = \App\Models\HR\Leave::where('employee_id', $employee->id)
                ->where('status', 'approved')
                ->where('start_date', '<=', $today)
                ->where('end_date', '>=', $today)
                ->with('leaveType')
                ->first();
            
            if ($approvedLeave) {
                $leaveTypeName = $approvedLeave->leaveType?->name ?? 'cuti';
                return response()->json([
                    'message' => "Anda sedang dalam masa $leaveTypeName. Tidak perlu melakukan absensi.",
                ], 400);
            }
            
            // Get current schedule for employee
            $schedule = \App\Models\HR\EmployeeSchedule::getCurrentSchedule($employee->id);
            $dayOfWeek = strtolower($now->format('l')); // monday, tuesday, etc.
            $shift = $schedule?->getShiftForDay($dayOfWeek);
            
            // Check if today is a day off (no shift scheduled)
            if (!$shift) {
                return response()->json([
                    'message' => 'Hari ini adalah hari libur Anda. Check-in tidak diperlukan.',
                ], 400);
            }
            
            // Get scheduled times
            $scheduledClockIn = null;
            $scheduledClockOut = null;
            $workScheduleId = null;
            
            if ($shift) {
                // Store scheduled times as full datetime for today
                $scheduledClockIn = \Carbon\Carbon::parse($today . ' ' . $shift->clock_in_time);
                $scheduledClockOut = \Carbon\Carbon::parse($today . ' ' . $shift->clock_out_time);
                $workScheduleId = $shift->id;
            }
            
            // Check if attendance exists for today
            $attendance = \App\Models\HR\Attendance::where('employee_id', $employee->id)
                ->where('date', $today)
                ->first();
            
            if ($attendance) {
                // If already clocked in, return error
                if ($attendance->clock_in) {
                    return response()->json(['message' => 'Sudah clock in hari ini'], 400);
                }
                
                // If exists but no clock_in (manual entry), update it
                $attendance->update([
                    'clock_in' => $now,
                    'clock_in_latitude' => $request->latitude ? round((float)$request->latitude, 8) : null,
                    'clock_in_longitude' => $request->longitude ? round((float)$request->longitude, 8) : null,
                    'scheduled_clock_in' => $scheduledClockIn,
                    'scheduled_clock_out' => $scheduledClockOut,
                    'employee_schedule_id' => $schedule?->id,
                    'work_schedule_id' => $workScheduleId,
                ]);
            } else {
                // Create new attendance
                $attendance = \App\Models\HR\Attendance::create([
                    'employee_id' => $employee->id,
                    'date' => $today,
                    'clock_in' => $now,
                    'clock_in_latitude' => $request->latitude ? round((float)$request->latitude, 8) : null,
                    'clock_in_longitude' => $request->longitude ? round((float)$request->longitude, 8) : null,
                    'scheduled_clock_in' => $scheduledClockIn,
                    'scheduled_clock_out' => $scheduledClockOut,
                    'employee_schedule_id' => $schedule?->id,
                    'work_schedule_id' => $workScheduleId,
                ]);
            }
            
            // Use model method to calculate late minutes and status
            $attendance->late_minutes = $attendance->calculateLateMinutes();
            $attendance->status = $attendance->determineStatus();
            $attendance->save();

            return response()->json([
                'message' => 'Clock in berhasil',
                'data' => $attendance->fresh(),
            ]);
        });

        Route::post('/attendances/clock-out', function (Request $request) {
            $employee = \App\Models\HR\Employee::where('user_id', $request->user()->id)->first();
            
            if (!$employee) {
                return response()->json(['message' => 'Employee not found'], 404);
            }

            $today = now()->toDateString();
            $now = now();
            
            $attendance = \App\Models\HR\Attendance::where('employee_id', $employee->id)
                ->where('date', $today)
                ->first();

            if (!$attendance) {
                return response()->json(['message' => 'Belum clock in hari ini'], 400);
            }

            if ($attendance->clock_out) {
                return response()->json(['message' => 'Sudah clock out hari ini'], 400);
            }

            // Check if trying to clock out before scheduled time
            $scheduledClockOut = $attendance->scheduled_clock_out;
            if ($scheduledClockOut && $now < $scheduledClockOut) {
                // Check if there's an approved early leave request
                $earlyLeaveRequest = \App\Models\HR\EarlyLeaveRequest::where('employee_id', $employee->id)
                    ->where('date', $today)
                    ->where('status', 'approved')
                    ->first();
                
                if (!$earlyLeaveRequest) {
                    $scheduledTime = \Carbon\Carbon::parse($scheduledClockOut)->format('H:i');
                    return response()->json([
                        'message' => "Belum waktunya pulang. Jadwal pulang: {$scheduledTime}. Ajukan izin pulang cepat jika ingin pulang lebih awal.",
                        'can_request_early_leave' => true,
                        'scheduled_clock_out' => $scheduledTime,
                    ], 400);
                }
            }

            // Update clock out
            $attendance->update([
                'clock_out' => $now,
                'clock_out_latitude' => $request->latitude ? round((float)$request->latitude, 8) : null,
                'clock_out_longitude' => $request->longitude ? round((float)$request->longitude, 8) : null,
            ]);
            
            // Use model methods to calculate
            $attendance->early_leave_minutes = $attendance->calculateEarlyLeaveMinutes();
            $attendance->work_duration_minutes = $attendance->calculateWorkDuration();
            $attendance->status = $attendance->determineStatus();
            $attendance->save();

            return response()->json([
                'message' => 'Clock out berhasil',
                'data' => $attendance->fresh(),
            ]);
        });

        // Early Leave Requests
        Route::prefix('early-leave-requests')->group(function () {
            // Get my early leave requests
            Route::get('/', function (Request $request) {
                $employee = \App\Models\HR\Employee::where('user_id', $request->user()->id)->first();
                
                $requests = \App\Models\HR\EarlyLeaveRequest::where('employee_id', $employee?->id)
                    ->with(['approver:id,name', 'director:id,name', 'delegationEmployee.user:id,name'])
                    ->orderBy('created_at', 'desc')
                    ->paginate(20);
                
                // Transform to include additional info
                $requests->getCollection()->transform(function ($item) {
                    $item->approved_by_name = $item->approver?->name;
                    $item->director_name = $item->director?->name;
                    $item->delegation_employee_name = $item->delegationEmployee?->user?->name;
                    return $item;
                });
                
                return response()->json(['data' => $requests]);
            });

            // Get today's early leave request status
            Route::get('/today', function (Request $request) {
                $employee = \App\Models\HR\Employee::where('user_id', $request->user()->id)->first();
                
                if (!$employee) {
                    return response()->json(['message' => 'Employee not found'], 404);
                }
                
                $today = now()->toDateString();
                
                $earlyLeaveRequest = \App\Models\HR\EarlyLeaveRequest::where('employee_id', $employee->id)
                    ->where('date', $today)
                    ->with('approver:id,name')
                    ->latest()
                    ->first();
                
                // Get scheduled clock out time
                $schedule = \App\Models\HR\EmployeeSchedule::getCurrentSchedule($employee->id);
                $dayOfWeek = strtolower(now()->format('l'));
                $shift = $schedule?->getShiftForDay($dayOfWeek);
                $scheduledClockOut = $shift ? substr($shift->clock_out_time, 0, 5) : null;
                
                return response()->json([
                    'early_leave_request' => $earlyLeaveRequest,
                    'scheduled_clock_out' => $scheduledClockOut,
                    'can_request' => !$earlyLeaveRequest || $earlyLeaveRequest->status === 'rejected',
                ]);
            });

            // Create early leave request with hierarchical approval
            Route::post('/', function (Request $request) {
                $request->validate([
                    'requested_leave_time' => 'required|date_format:H:i',
                    'reason' => 'required|string|max:500',
                    'delegation_to' => 'nullable|string|max:255',
                    'delegation_employee_id' => 'nullable|exists:employees,id',
                ]);
                
                $employee = \App\Models\HR\Employee::where('user_id', $request->user()->id)->first();
                
                if (!$employee) {
                    return response()->json(['message' => 'Employee not found'], 404);
                }
                
                $today = now()->toDateString();
                
                // Check if already has pending request today (check all pending statuses)
                $existingRequest = \App\Models\HR\EarlyLeaveRequest::where('employee_id', $employee->id)
                    ->where('date', $today)
                    ->whereIn('status', ['pending_delegation', 'pending_supervisor', 'pending_hr', 'approved'])
                    ->first();
                
                if ($existingRequest) {
                    return response()->json([
                        'message' => 'Sudah ada pengajuan izin pulang cepat hari ini',
                    ], 400);
                }
                
                // Get today's attendance
                $attendance = \App\Models\HR\Attendance::where('employee_id', $employee->id)
                    ->where('date', $today)
                    ->first();
                
                if (!$attendance) {
                    return response()->json(['message' => 'Anda belum clock in hari ini'], 400);
                }
                
                // Get scheduled clock out
                $schedule = \App\Models\HR\EmployeeSchedule::getCurrentSchedule($employee->id);
                $dayOfWeek = strtolower(now()->format('l'));
                $shift = $schedule?->getShiftForDay($dayOfWeek);
                
                if (!$shift) {
                    return response()->json(['message' => 'Tidak ada jadwal kerja hari ini'], 400);
                }
                
                $scheduledClockOut = substr($shift->clock_out_time, 0, 5);
                $requestedTime = $request->requested_leave_time;
                
                // Validate requested time is before scheduled
                if ($requestedTime >= $scheduledClockOut) {
                    return response()->json([
                        'message' => 'Waktu pulang yang diminta harus sebelum jadwal pulang',
                    ], 400);
                }
                
                // Determine initial status based on delegation
                $initialStatus = $request->delegation_employee_id ? 'pending_delegation' : 'pending_supervisor';
                
                $earlyLeaveRequest = \App\Models\HR\EarlyLeaveRequest::create([
                    'employee_id' => $employee->id,
                    'attendance_id' => $attendance->id,
                    'date' => $today,
                    'requested_leave_time' => $requestedTime,
                    'scheduled_leave_time' => $scheduledClockOut,
                    'reason' => $request->reason,
                    'delegation_to' => $request->delegation_to,
                    'delegation_employee_id' => $request->delegation_employee_id,
                    'status' => $initialStatus,
                    'auto_checkout' => true,
                ]);
                
                // Send notification to delegation or supervisor
                if ($request->delegation_employee_id) {
                    $delegationEmployee = \App\Models\HR\Employee::find($request->delegation_employee_id);
                    if ($delegationEmployee?->user) {
                        // Send notification to delegation
                    }
                }
                
                return response()->json([
                    'message' => 'Pengajuan izin pulang cepat berhasil dikirim',
                    'data' => $earlyLeaveRequest,
                ], 201);
            });

            // Cancel early leave request (only if still in draft or pending_delegation)
            Route::delete('/{id}', function (Request $request, $id) {
                $employee = \App\Models\HR\Employee::where('user_id', $request->user()->id)->first();
                
                $earlyLeaveRequest = \App\Models\HR\EarlyLeaveRequest::where('id', $id)
                    ->where('employee_id', $employee?->id)
                    ->whereIn('status', ['pending_delegation', 'pending_supervisor'])
                    ->first();
                
                if (!$earlyLeaveRequest) {
                    return response()->json(['message' => 'Pengajuan tidak ditemukan atau sudah diproses'], 404);
                }
                
                $earlyLeaveRequest->delete();
                
                return response()->json(['message' => 'Pengajuan dibatalkan']);
            });

            // Download early leave letter PDF (Surat Izin Pulang Cepat)
            Route::get('/{id}/download-pdf', function (Request $request, $id) {
                $employee = \App\Models\HR\Employee::where('user_id', $request->user()->id)->first();
                
                $earlyLeave = \App\Models\HR\EarlyLeaveRequest::where('id', $id)
                    ->where('employee_id', $employee?->id)
                    ->first();
                
                if (!$earlyLeave) {
                    return response()->json(['message' => 'Pengajuan tidak ditemukan'], 404);
                }
                
                if ($earlyLeave->status !== 'approved') {
                    return response()->json(['message' => 'Surat hanya dapat diunduh untuk izin yang sudah disetujui'], 400);
                }

                $earlyLeave->load(['employee.user', 'employee.organizationUnit', 'approver', 'delegationEmployee.user']);

                // Get early leave template
                $template = \App\Models\DocumentTemplate::active()
                    ->ofType(\App\Models\DocumentTemplate::TYPE_EARLY_LEAVE)
                    ->where('organization_unit_id', $earlyLeave->employee->organization_unit_id)
                    ->first();

                if (!$template) {
                    return response()->json(['message' => 'Template surat izin pulang cepat belum dikonfigurasi'], 404);
                }

                // Set locale to Indonesian for date formatting
                \Carbon\Carbon::setLocale('id');

                // Generate letter number
                $format = $template->numbering_format ?? '{no}/PLC/{unit}/{tahun}';
                $year = now()->year;
                $count = \App\Models\HR\EarlyLeaveRequest::whereYear('approved_at', $year)
                    ->where('status', 'approved')
                    ->whereHas('employee', fn($q) => $q->where('organization_unit_id', $earlyLeave->employee->organization_unit_id))
                    ->count();
                $nextNumber = str_pad($count + 1, 3, '0', STR_PAD_LEFT);
                $unitCode = $earlyLeave->employee->organizationUnit->code ?? 'UNIT';
                
                // Replace all possible placeholders
                $letterNumber = str_replace(
                    ['{no}', '{kode}', '{unit}', '{tahun}', '{bulan}', '{nomor}'],
                    [$nextNumber, $unitCode, $unitCode, $year, now()->format('m'), $nextNumber],
                    $format
                );

                // Generate PDF with margin workaround
                $pageSettings = $template->page_settings;
                $margins = $pageSettings['margins'] ?? [];
                
                $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.early-leave-letter', [
                    'earlyLeave' => $earlyLeave,
                    'template' => $template,
                    'letterNumber' => $letterNumber,
                    'pdfMargins' => [
                        'top' => $margins['top'] ?? 25,
                        'right' => $margins['right'] ?? 25,
                        'bottom' => $margins['bottom'] ?? 25,
                        'left' => $margins['left'] ?? 30,
                    ],
                ]);

                $pdf->setPaper(strtolower($pageSettings['paper_size'] ?? 'a4'), $pageSettings['orientation'] ?? 'portrait');

                $filename = 'Surat_Izin_Pulang_Cepat_' . str_replace([' ', '/', '\\'], '_', $earlyLeave->employee->user->name ?? 'draft') . '.pdf';

                return $pdf->download($filename);
            });

            // Download early leave response letter PDF (Surat Balasan - after director signs)
            Route::get('/{id}/download-response-pdf', function (Request $request, $id) {
                $employee = \App\Models\HR\Employee::where('user_id', $request->user()->id)->first();
                
                $earlyLeave = \App\Models\HR\EarlyLeaveRequest::where('id', $id)
                    ->where('employee_id', $employee?->id)
                    ->first();
                
                if (!$earlyLeave) {
                    return response()->json(['message' => 'Pengajuan tidak ditemukan'], 404);
                }
                
                // Only if director has signed
                if (!$earlyLeave->director_signed_at) {
                    return response()->json(['message' => 'Surat Balasan hanya dapat diunduh setelah ditandatangani Direktur'], 400);
                }

                $earlyLeave->load(['employee.user', 'employee.organizationUnit', 'approver', 'director', 'delegationEmployee.user', 'supervisor']);

                // Get response template (use early leave response type if exists, otherwise use leave response)
                $template = \App\Models\DocumentTemplate::active()
                    ->ofType(\App\Models\DocumentTemplate::TYPE_EARLY_LEAVE_RESPONSE ?? 'early_leave_response')
                    ->where('organization_unit_id', $earlyLeave->employee->organization_unit_id)
                    ->first();

                // Fallback to any active response template
                if (!$template) {
                    $template = \App\Models\DocumentTemplate::active()
                        ->ofType(\App\Models\DocumentTemplate::TYPE_EARLY_LEAVE_RESPONSE ?? 'early_leave_response')
                        ->first();
                }

                // Last fallback to leave response template
                if (!$template) {
                    $template = \App\Models\DocumentTemplate::active()
                        ->ofType(\App\Models\DocumentTemplate::TYPE_LEAVE_RESPONSE)
                        ->first();
                }

                if (!$template) {
                    return response()->json(['message' => 'Template surat balasan belum dikonfigurasi'], 404);
                }

                // Set locale to Indonesian for date formatting
                \Carbon\Carbon::setLocale('id');

                // Get page settings
                $pageSettings = $template->page_settings;
                $margins = $pageSettings['margins'] ?? [];
                
                $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.early-leave-response-letter', [
                    'earlyLeave' => $earlyLeave,
                    'template' => $template,
                    'letterNumber' => $earlyLeave->response_letter_number,
                    'pdfMargins' => [
                        'top' => $margins['top'] ?? 25,
                        'right' => $margins['right'] ?? 25,
                        'bottom' => $margins['bottom'] ?? 25,
                        'left' => $margins['left'] ?? 30,
                    ],
                ]);

                $pdf->setPaper(strtolower($pageSettings['paper_size'] ?? 'a4'), $pageSettings['orientation'] ?? 'portrait');

                $filename = 'Surat_Balasan_Izin_Pulang_Cepat_' . str_replace([' ', '/', '\\'], '_', $earlyLeave->employee->user->name ?? 'draft') . '.pdf';

                return $pdf->download($filename);
            });
        });

        // ========== APPROVAL ROUTES (HIERARCHICAL WORKFLOW) ==========
        Route::prefix('approvals')->group(function () {
            // Get all pending approvals for current user
            Route::get('/', function (Request $request) {
                $service = new \App\Services\LeaveApprovalService();
                $approvals = $service->getPendingApprovalsForUser($request->user());
                
                return response()->json([
                    'data' => $approvals,
                    'count' => $approvals['leaves']->count() + $approvals['early_leaves']->count(),
                ]);
            });

            // Get pending approval count
            Route::get('/count', function (Request $request) {
                $service = new \App\Services\LeaveApprovalService();
                
                return response()->json([
                    'count' => $service->countPendingApprovals($request->user()),
                ]);
            });

            // Approve/reject leave as delegation
            Route::post('/leaves/{leave}/delegation', function (Request $request, \App\Models\HR\Leave $leave) {
                $request->validate([
                    'action' => 'required|in:approve,reject',
                    'notes' => 'nullable|string|max:500',
                ]);

                $employee = \App\Models\HR\Employee::where('user_id', $request->user()->id)->first();
                
                if (!$employee || !$leave->canApproveAsDelegation($employee->id)) {
                    return response()->json(['message' => 'Anda tidak berhak menyetujui pengajuan ini'], 403);
                }

                if ($request->action === 'approve') {
                    $leave->approveDelegation($employee->id, $request->notes);
                    return response()->json(['message' => 'Delegasi berhasil dikonfirmasi']);
                } else {
                    $leave->reject($request->user()->id, $request->notes);
                    return response()->json(['message' => 'Pengajuan ditolak']);
                }
            });

            // Approve/reject leave as supervisor
            Route::post('/leaves/{leave}/supervisor', function (Request $request, \App\Models\HR\Leave $leave) {
                $request->validate([
                    'action' => 'required|in:approve,reject',
                    'notes' => 'nullable|string|max:500',
                ]);

                if (!$leave->canApproveAsSupervisor($request->user()->id)) {
                    return response()->json(['message' => 'Anda tidak berhak menyetujui pengajuan ini'], 403);
                }

                if ($request->action === 'approve') {
                    $leave->approveSupervisor($request->user()->id, $request->notes);
                    return response()->json(['message' => 'Pengajuan berhasil disetujui']);
                } else {
                    $leave->reject($request->user()->id, $request->notes);
                    return response()->json(['message' => 'Pengajuan ditolak']);
                }
            });

            // Sign leave as director
            Route::post('/leaves/{leave}/director', function (Request $request, \App\Models\HR\Leave $leave) {
                $request->validate([
                    'action' => 'required|in:sign,reject',
                    'notes' => 'nullable|string|max:500',
                ]);

                if (!$leave->canSignAsDirector($request->user()->id)) {
                    return response()->json(['message' => 'Anda tidak berhak menandatangani surat ini'], 403);
                }

                if ($request->action === 'sign') {
                    $service = new \App\Services\LeaveApprovalService();
                    $template = $service->getLeaveResponseTemplate($leave->employee);
                    
                    $letterNumber = null;
                    if ($template) {
                        $letterNumber = $service->generateResponseLetterNumber($template, $leave);
                    }
                    
                    $leave->signDirector($request->user()->id, $letterNumber);
                    
                    // Send notification to employee
                    if ($leave->employee->user_id) {
                        app(\App\Services\FCMService::class)->sendToUsers(
                            [$leave->employee->user_id],
                            'Cuti Disetujui',
                            'Pengajuan cuti Anda telah disetujui dan ditandatangani.',
                            ['type' => 'leave_approved', 'leave_id' => (string) $leave->id]
                        );
                    }
                    
                    return response()->json(['message' => 'Surat berhasil ditandatangani']);
                } else {
                    $leave->reject($request->user()->id, $request->notes);
                    return response()->json(['message' => 'Pengajuan ditolak']);
                }
            });

            // Approve/reject early leave as delegation
            Route::post('/early-leaves/{earlyLeave}/delegation', function (Request $request, \App\Models\HR\EarlyLeaveRequest $earlyLeave) {
                $request->validate([
                    'action' => 'required|in:approve,reject',
                    'notes' => 'nullable|string|max:500',
                ]);

                $employee = \App\Models\HR\Employee::where('user_id', $request->user()->id)->first();
                
                if (!$employee || !$earlyLeave->canApproveAsDelegation($employee->id)) {
                    return response()->json(['message' => 'Anda tidak berhak menyetujui pengajuan ini'], 403);
                }

                if ($request->action === 'approve') {
                    $earlyLeave->approveDelegation($employee->id, $request->notes);
                    return response()->json(['message' => 'Delegasi berhasil dikonfirmasi']);
                } else {
                    $earlyLeave->reject($request->user(), $request->notes);
                    return response()->json(['message' => 'Pengajuan ditolak']);
                }
            });

            // Approve/reject early leave as supervisor
            Route::post('/early-leaves/{earlyLeave}/supervisor', function (Request $request, \App\Models\HR\EarlyLeaveRequest $earlyLeave) {
                $request->validate([
                    'action' => 'required|in:approve,reject',
                    'notes' => 'nullable|string|max:500',
                ]);

                if (!$earlyLeave->canApproveAsSupervisor($request->user()->id)) {
                    return response()->json(['message' => 'Anda tidak berhak menyetujui pengajuan ini'], 403);
                }

                if ($request->action === 'approve') {
                    $earlyLeave->approveSupervisor($request->user()->id, $request->notes);
                    return response()->json(['message' => 'Pengajuan berhasil disetujui']);
                } else {
                    $earlyLeave->reject($request->user(), $request->notes);
                    return response()->json(['message' => 'Pengajuan ditolak']);
                }
            });

            // Sign early leave as director (notification only - after HR approval)
            Route::post('/early-leaves/{earlyLeave}/director', function (Request $request, \App\Models\HR\EarlyLeaveRequest $earlyLeave) {
                $request->validate([
                    'action' => 'required|in:sign',
                    'notes' => 'nullable|string|max:500',
                ]);

                if (!$earlyLeave->canSignAsDirector($request->user()->id)) {
                    return response()->json(['message' => 'Anda tidak berhak menandatangani surat ini'], 403);
                }

                $earlyLeave->signDirector($request->user()->id);
                
                // Send notification to employee
                if ($earlyLeave->employee->user_id) {
                    app(\App\Services\FCMService::class)->sendToUsers(
                        [$earlyLeave->employee->user_id],
                        'Surat Izin Pulang Cepat Ditandatangani',
                        'Surat izin pulang cepat Anda telah ditandatangani Direktur. Silakan download Surat Balasan.',
                        ['type' => 'early_leave_director_signed', 'early_leave_id' => (string) $earlyLeave->id]
                    );
                }
                
                return response()->json(['message' => 'Surat berhasil ditandatangani']);
            });
        });

        // Leaves
        Route::get('/leaves', function (Request $request) {
            $employee = \App\Models\HR\Employee::where('user_id', $request->user()->id)->first();
            
            $leaves = \App\Models\HR\Leave::where('employee_id', $employee?->id)
                ->with(['leaveType', 'approver:id,name', 'director:id,name'])
                ->orderBy('created_at', 'desc')
                ->paginate(20);

            // Transform to include approved_by_name and director_signed_at
            $leaves->getCollection()->transform(function ($leave) {
                $leave->approved_by_name = $leave->approver?->name;
                $leave->director_signed_at = $leave->director_signed_at?->format('Y-m-d H:i:s');
                $leave->director_name = $leave->director?->name;
                return $leave;
            });
            
            return response()->json([
                'data' => $leaves,
            ]);
        });

        Route::post('/leaves', function (Request $request) {
            $request->validate([
                'leave_type_id' => 'required|exists:leave_types,id',
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',
                'reason' => 'required|string',
                'delegation_to' => 'nullable|string',
                'delegation_employee_id' => 'nullable|exists:employees,id',
            ]);

            $employee = \App\Models\HR\Employee::where('user_id', $request->user()->id)->first();
            
            if (!$employee) {
                return response()->json(['message' => 'Employee not found'], 404);
            }

            // Calculate total days
            $startDate = \Carbon\Carbon::parse($request->start_date);
            $endDate = \Carbon\Carbon::parse($request->end_date);
            $totalDays = $startDate->diffInDays($endDate) + 1;

            // Determine initial status based on delegation
            $initialStatus = $request->delegation_employee_id ? 'pending_delegation' : 'pending_supervisor';

            $leave = \App\Models\HR\Leave::create([
                'employee_id' => $employee->id,
                'leave_type_id' => $request->leave_type_id,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'total_days' => $totalDays,
                'reason' => $request->reason,
                'delegation_to' => $request->delegation_to,
                'delegation_employee_id' => $request->delegation_employee_id,
                'status' => $initialStatus,
                'submitted_at' => now(),
                'created_by' => $request->user()->id,
                'updated_by' => $request->user()->id,
            ]);

            // Send notification to delegation if set
            if ($request->delegation_employee_id) {
                $delegationEmployee = \App\Models\HR\Employee::find($request->delegation_employee_id);
                if ($delegationEmployee && $delegationEmployee->user_id) {
                    app(\App\Services\FCMService::class)->sendToUsers(
                        [$delegationEmployee->user_id],
                        'Konfirmasi Delegasi Tugas',
                        $employee->user?->name . ' meminta konfirmasi Anda sebagai delegasi untuk pengajuan cuti.',
                        ['type' => 'leave_delegation_request', 'leave_id' => (string) $leave->id]
                    );
                }
            } else {
                // Send notification to supervisor
                $supervisor = $leave->getSupervisorUser();
                if ($supervisor) {
                    app(\App\Services\FCMService::class)->sendToUsers(
                        [$supervisor->id],
                        'Pengajuan Cuti Baru',
                        $employee->user?->name . ' mengajukan cuti dan menunggu persetujuan Anda.',
                        ['type' => 'leave_approval_request', 'leave_id' => (string) $leave->id]
                    );
                }
            }

            return response()->json([
                'message' => 'Pengajuan cuti berhasil',
                'data' => $leave->load('leaveType'),
            ], 201);
        });

        // Download leave letter PDF
        Route::get('/leaves/{leave}/download-pdf', function (Request $request, \App\Models\HR\Leave $leave) {
            $employee = \App\Models\HR\Employee::where('user_id', $request->user()->id)->first();
            
            // Verify ownership
            if (!$employee || (int) $leave->employee_id !== (int) $employee->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            
            // Only approved leaves can generate letter
            if ($leave->status !== 'approved') {
                return response()->json(['message' => 'Surat hanya dapat diunduh untuk cuti yang sudah disetujui'], 400);
            }

            $leave->load(['employee.user', 'employee.organizationUnit', 'leaveType', 'approver', 'delegationEmployee.user']);

            // Get leave template for this organization
            $template = \App\Models\DocumentTemplate::active()
                ->ofType(\App\Models\DocumentTemplate::TYPE_LEAVE)
                ->where('organization_unit_id', $leave->employee->organization_unit_id)
                ->first();

            if (!$template) {
                return response()->json(['message' => 'Template surat cuti belum dikonfigurasi'], 404);
            }

            // Set locale to Indonesian for date formatting
            \Carbon\Carbon::setLocale('id');
            
            // Generate letter number
            $format = $template->numbering_format ?? '{no}/CUTI/{unit}/{tahun}';
            $year = now()->year;
            $count = \App\Models\HR\Leave::whereYear('approved_at', $year)
                ->where('status', 'approved')
                ->whereHas('employee', fn($q) => $q->where('organization_unit_id', $leave->employee->organization_unit_id))
                ->count();
            $nextNumber = str_pad($count + 1, 3, '0', STR_PAD_LEFT);
            $unitCode = $leave->employee->organizationUnit->code ?? 'UNIT';
            
            // Replace all possible placeholders
            $letterNumber = str_replace(
                ['{no}', '{kode}', '{unit}', '{tahun}', '{bulan}', '{nomor}'],
                [$nextNumber, $unitCode, $unitCode, $year, now()->format('m'), $nextNumber],
                $format
            );

            // Generate PDF with margin workaround
            // DomPDF @page margin doesn't work reliably, so we pass margins to template
            $pageSettings = $template->page_settings;
            $margins = $pageSettings['margins'] ?? [];
            
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.leave-letter', [
                'leave' => $leave,
                'template' => $template,
                'letterNumber' => $letterNumber,
                'pdfMargins' => [
                    'top' => $margins['top'] ?? 25,
                    'right' => $margins['right'] ?? 25,
                    'bottom' => $margins['bottom'] ?? 25,
                    'left' => $margins['left'] ?? 30,
                ],
            ]);

            $pdf->setPaper(strtolower($pageSettings['paper_size'] ?? 'a4'), $pageSettings['orientation'] ?? 'portrait');

            $filename = 'Surat_Cuti_' . str_replace([' ', '/', '\\'], '_', $leave->employee->user->name ?? 'draft') . '.pdf';

            return $pdf->download($filename);
        });

        // Download leave response letter PDF (Surat Balasan - after director signs)
        Route::get('/leaves/{leave}/download-response-pdf', function (Request $request, \App\Models\HR\Leave $leave) {
            $employee = \App\Models\HR\Employee::where('user_id', $request->user()->id)->first();
            
            // Verify ownership
            if (!$employee || (int) $leave->employee_id !== (int) $employee->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            
            // Only leaves with director signature can generate response letter
            if (!$leave->director_signed_at) {
                return response()->json(['message' => 'Surat Balasan hanya dapat diunduh setelah ditandatangani Direktur'], 400);
            }

            $leave->load(['employee.user', 'employee.organizationUnit', 'leaveType', 'approver', 'director', 'delegationEmployee.user', 'supervisor']);

            // Get response template
            $template = \App\Models\DocumentTemplate::active()
                ->ofType(\App\Models\DocumentTemplate::TYPE_LEAVE_RESPONSE)
                ->where('organization_unit_id', $leave->employee->organization_unit_id)
                ->first();

            // Fallback to any active response template
            if (!$template) {
                $template = \App\Models\DocumentTemplate::active()
                    ->ofType(\App\Models\DocumentTemplate::TYPE_LEAVE_RESPONSE)
                    ->first();
            }

            if (!$template) {
                return response()->json(['message' => 'Template surat balasan cuti belum dikonfigurasi'], 404);
            }

            // Set locale to Indonesian for date formatting
            \Carbon\Carbon::setLocale('id');

            // Get page settings
            $pageSettings = $template->page_settings;
            $margins = $pageSettings['margins'] ?? [];
            
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.leave-response-letter', [
                'leave' => $leave,
                'template' => $template,
                'letterNumber' => $leave->response_letter_number,
                'pdfMargins' => [
                    'top' => $margins['top'] ?? 25,
                    'right' => $margins['right'] ?? 25,
                    'bottom' => $margins['bottom'] ?? 25,
                    'left' => $margins['left'] ?? 30,
                ],
            ]);

            $pdf->setPaper(strtolower($pageSettings['paper_size'] ?? 'a4'), $pageSettings['orientation'] ?? 'portrait');

            $filename = 'Surat_Balasan_Cuti_' . str_replace([' ', '/', '\\'], '_', $leave->employee->user->name ?? 'draft') . '.pdf';

            return $pdf->download($filename);
        });

        // Leave types - hanya yang employee punya balance-nya
        Route::get('/leave-types', function (Request $request) {
            $employee = \App\Models\HR\Employee::where('user_id', $request->user()->id)->first();
            
            if (!$employee) {
                return response()->json(['data' => []]);
            }
            
            $year = now()->year;
            
            // Get leave type IDs that employee has balance for
            $assignedTypeIds = \App\Models\HR\EmployeeLeaveBalance::where('employee_id', $employee->id)
                ->where('year', $year)
                ->pluck('leave_type_id');
            
            // Only return leave types that are assigned to this employee
            $types = \App\Models\HR\LeaveType::where('is_active', true)
                ->whereIn('id', $assignedTypeIds)
                ->get();
            
            return response()->json(['data' => $types]);
        });

        Route::get('/leave-balances', function (Request $request) {
            $employee = \App\Models\HR\Employee::where('user_id', $request->user()->id)->first();
            
            if (!$employee) {
                return response()->json(['data' => []]);
            }
            
            $year = now()->year;
            $balances = \App\Models\HR\EmployeeLeaveBalance::where('employee_id', $employee->id)
                ->where('year', $year)
                ->with('leaveType')
                ->get()
                ->filter(function ($balance) {
                    // Only return balances with active leave types
                    return $balance->leaveType && $balance->leaveType->is_active;
                })
                ->map(function ($balance) {
                    return [
                        'id' => $balance->id,
                        'leave_type' => [
                            'id' => $balance->leaveType->id,
                            'name' => $balance->leaveType->name,
                            'code' => $balance->leaveType->code,
                            'color' => $balance->leaveType->color,
                        ],
                        'year' => $balance->year,
                        'initial_balance' => $balance->initial_balance,
                        'carry_over' => $balance->carry_over,
                        'adjustment' => $balance->adjustment,
                        'used' => $balance->used,
                        'pending' => $balance->pending,
                        'total' => $balance->total_balance,
                        'remaining' => $balance->available_balance,
                    ];
                })
                ->values();
            
            return response()->json(['data' => $balances]);
        });

        // Work Schedules - Get employee's current schedule
        Route::get('/schedules', function (Request $request) {
            $employee = \App\Models\HR\Employee::where('user_id', $request->user()->id)->first();
            
            if (!$employee) {
                return response()->json(['data' => null, 'message' => 'Employee not found'], 404);
            }
            
            $today = now()->toDateString();
            
            // Get current active schedule
            $currentSchedule = \App\Models\HR\EmployeeSchedule::where('employee_id', $employee->id)
                ->where('effective_date', '<=', $today)
                ->where(function ($q) use ($today) {
                    $q->whereNull('end_date')
                      ->orWhere('end_date', '>=', $today);
                })
                ->with([
                    'mondayShift', 'tuesdayShift', 'wednesdayShift',
                    'thursdayShift', 'fridayShift', 'saturdayShift', 'sundayShift'
                ])
                ->first();
            
            if (!$currentSchedule) {
                return response()->json(['data' => null]);
            }
            
            $formatShift = function ($shift) {
                if (!$shift) return null;
                return [
                    'id' => $shift->id,
                    'code' => $shift->code,
                    'name' => $shift->name,
                    'clock_in' => substr($shift->clock_in_time, 0, 5),
                    'clock_out' => substr($shift->clock_out_time, 0, 5),
                    'is_flexible' => $shift->is_flexible,
                    'work_hours' => $shift->work_hours_per_day,
                ];
            };
            
            return response()->json([
                'data' => [
                    'id' => $currentSchedule->id,
                    'effective_date' => $currentSchedule->effective_date->format('Y-m-d'),
                    'end_date' => $currentSchedule->end_date?->format('Y-m-d'),
                    'shifts' => [
                        'monday' => $formatShift($currentSchedule->mondayShift),
                        'tuesday' => $formatShift($currentSchedule->tuesdayShift),
                        'wednesday' => $formatShift($currentSchedule->wednesdayShift),
                        'thursday' => $formatShift($currentSchedule->thursdayShift),
                        'friday' => $formatShift($currentSchedule->fridayShift),
                        'saturday' => $formatShift($currentSchedule->saturdayShift),
                        'sunday' => $formatShift($currentSchedule->sundayShift),
                    ],
                    'notes' => $currentSchedule->notes,
                ],
            ]);
        });

        // Get schedule for a specific month (calendar view)
        Route::get('/schedules/calendar', function (Request $request) {
            $employee = \App\Models\HR\Employee::where('user_id', $request->user()->id)->first();
            
            if (!$employee) {
                return response()->json(['data' => [], 'message' => 'Employee not found'], 404);
            }
            
            $month = $request->get('month', now()->month);
            $year = $request->get('year', now()->year);
            
            $startDate = \Carbon\Carbon::create($year, $month, 1)->startOfMonth();
            $endDate = $startDate->copy()->endOfMonth();
            
            // Get all schedules that overlap with this month
            $schedules = \App\Models\HR\EmployeeSchedule::where('employee_id', $employee->id)
                ->where('effective_date', '<=', $endDate)
                ->where(function ($q) use ($startDate) {
                    $q->whereNull('end_date')
                      ->orWhere('end_date', '>=', $startDate);
                })
                ->with([
                    'mondayShift', 'tuesdayShift', 'wednesdayShift',
                    'thursdayShift', 'fridayShift', 'saturdayShift', 'sundayShift'
                ])
                ->orderBy('effective_date')
                ->get();
            
            // Get attendances for this month
            $attendances = \App\Models\HR\Attendance::where('employee_id', $employee->id)
                ->whereBetween('date', [$startDate, $endDate])
                ->get()
                ->keyBy(fn($a) => $a->date->format('Y-m-d'));
            
            // Get leaves for this month
            $leaves = \App\Models\HR\Leave::where('employee_id', $employee->id)
                ->where(function ($q) use ($startDate, $endDate) {
                    $q->whereBetween('start_date', [$startDate, $endDate])
                      ->orWhereBetween('end_date', [$startDate, $endDate])
                      ->orWhere(function ($q2) use ($startDate, $endDate) {
                          $q2->where('start_date', '<=', $startDate)
                             ->where('end_date', '>=', $endDate);
                      });
                })
                ->whereIn('status', ['pending', 'approved'])
                ->with('leaveType')
                ->get();
            
            // Build calendar data
            $calendarData = [];
            $currentDate = $startDate->copy();
            
            $dayMapping = [
                0 => 'sunday',
                1 => 'monday',
                2 => 'tuesday',
                3 => 'wednesday',
                4 => 'thursday',
                5 => 'friday',
                6 => 'saturday',
            ];
            
            while ($currentDate <= $endDate) {
                $dateStr = $currentDate->format('Y-m-d');
                $dayOfWeek = $dayMapping[$currentDate->dayOfWeek];
                
                // Find applicable schedule for this date
                $schedule = $schedules->first(function ($s) use ($currentDate) {
                    return $s->effective_date <= $currentDate && 
                           ($s->end_date === null || $s->end_date >= $currentDate);
                });
                
                $shift = null;
                if ($schedule) {
                    $shiftRelation = $dayOfWeek . 'Shift';
                    $shiftData = $schedule->$shiftRelation;
                    if ($shiftData) {
                        $shift = [
                            'id' => $shiftData->id,
                            'code' => $shiftData->code,
                            'name' => $shiftData->name,
                            'clock_in' => substr($shiftData->clock_in_time, 0, 5),
                            'clock_out' => substr($shiftData->clock_out_time, 0, 5),
                        ];
                    }
                }
                
                // Get attendance for this date
                $attendance = $attendances->get($dateStr);
                $attendanceData = null;
                if ($attendance) {
                    $attendanceData = [
                        'id' => $attendance->id,
                        'clock_in' => $attendance->clock_in ? $attendance->clock_in->format('H:i') : null,
                        'clock_out' => $attendance->clock_out ? $attendance->clock_out->format('H:i') : null,
                        'status' => $attendance->status,
                        'is_late' => $attendance->is_late,
                        'is_early_leave' => $attendance->is_early_leave,
                    ];
                }
                
                // Check if on leave
                $leaveData = null;
                foreach ($leaves as $leave) {
                    if ($leave->start_date <= $currentDate && $leave->end_date >= $currentDate) {
                        $leaveData = [
                            'id' => $leave->id,
                            'type' => $leave->leaveType?->name,
                            'color' => $leave->leaveType?->color,
                            'status' => $leave->status,
                        ];
                        break;
                    }
                }
                
                $calendarData[] = [
                    'date' => $dateStr,
                    'day_of_week' => $dayOfWeek,
                    'is_today' => $currentDate->isToday(),
                    'shift' => $shift,
                    'attendance' => $attendanceData,
                    'leave' => $leaveData,
                    'is_weekend' => in_array($dayOfWeek, ['saturday', 'sunday']),
                    'is_off' => $shift === null,
                ];
                
                $currentDate->addDay();
            }
            
            return response()->json([
                'data' => [
                    'month' => $month,
                    'year' => $year,
                    'days' => $calendarData,
                ],
            ]);
        });

        // FCM Token Registration
        Route::post('/fcm/register-token', function (Request $request) {
            $request->validate([
                'token' => 'required|string',
                'device_type' => 'required|string|in:android,ios,web',
                'device_name' => 'nullable|string',
            ]);

            $user = $request->user();

            // Update or create token
            \App\Models\FcmToken::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'token' => $request->token,
                ],
                [
                    'device_type' => $request->device_type,
                    'device_name' => $request->device_name,
                    'is_active' => true,
                ]
            );

            return response()->json(['message' => 'Token registered successfully']);
        });

        Route::post('/fcm/unregister-token', function (Request $request) {
            $request->validate([
                'token' => 'required|string',
            ]);

            \App\Models\FcmToken::where('user_id', $request->user()->id)
                ->where('token', $request->token)
                ->delete();

            return response()->json(['message' => 'Token unregistered successfully']);
        });

        // Dashboard
        Route::get('/dashboard', function (Request $request) {
            $employee = \App\Models\HR\Employee::where('user_id', $request->user()->id)
                ->with(['organizationUnit', 'jobCategory', 'employmentStatus'])
                ->first();
            $today = now()->toDateString();
            $now = now();
            $year = now()->year;

            $todayAttendance = null;
            $pendingLeaves = 0;
            $leaveBalances = [];
            $recentAttendances = [];
            $todaySchedule = null;
            $earlyLeaveRequest = null;

            if ($employee) {
                $todayAttendance = \App\Models\HR\Attendance::where('employee_id', $employee->id)
                    ->where('date', $today)
                    ->first();
                
                // Add formatted fields if attendance exists
                if ($todayAttendance) {
                    $todayAttendance->clock_in_formatted = $todayAttendance->clock_in ? $todayAttendance->clock_in->format('H:i') : null;
                    $todayAttendance->clock_out_formatted = $todayAttendance->clock_out ? $todayAttendance->clock_out->format('H:i') : null;
                    $todayAttendance->status_label = \App\Models\HR\Attendance::STATUS_LABELS[$todayAttendance->status] ?? $todayAttendance->status;
                }

                // Get today's schedule
                $schedule = \App\Models\HR\EmployeeSchedule::getCurrentSchedule($employee->id);
                $dayOfWeek = strtolower($now->format('l'));
                $shift = $schedule?->getShiftForDay($dayOfWeek);
                
                if (!$shift) {
                    $todaySchedule = [
                        'is_day_off' => true,
                        'message' => 'Hari ini adalah hari libur Anda',
                    ];
                } else {
                    $todaySchedule = [
                        'is_day_off' => false,
                        'shift' => [
                            'id' => $shift->id,
                            'name' => $shift->name,
                            'clock_in_time' => substr($shift->clock_in_time, 0, 5),
                            'clock_out_time' => substr($shift->clock_out_time, 0, 5),
                        ],
                    ];
                }

                // Get early leave request status for today
                $earlyLeaveRequest = \App\Models\HR\EarlyLeaveRequest::where('employee_id', $employee->id)
                    ->where('date', $today)
                    ->latest()
                    ->first();
                
                if ($earlyLeaveRequest) {
                    $earlyLeaveRequest = [
                        'id' => $earlyLeaveRequest->id,
                        'status' => $earlyLeaveRequest->status,
                        'status_label' => $earlyLeaveRequest->status_label,
                        'requested_leave_time' => substr($earlyLeaveRequest->requested_leave_time, 0, 5),
                        'reason' => $earlyLeaveRequest->reason,
                    ];
                }

                $pendingLeaves = \App\Models\HR\Leave::where('employee_id', $employee->id)
                    ->where('status', 'pending')
                    ->count();

                $leaveBalances = \App\Models\HR\EmployeeLeaveBalance::where('employee_id', $employee->id)
                    ->where('year', $year)
                    ->with('leaveType')
                    ->get()
                    ->map(function ($balance) {
                        return [
                            'leave_type' => $balance->leaveType?->name,
                            'remaining' => $balance->available_balance,
                            'total' => $balance->total_balance,
                        ];
                    });

                $recentAttendances = \App\Models\HR\Attendance::where('employee_id', $employee->id)
                    ->orderBy('date', 'desc')
                    ->take(7)
                    ->get()
                    ->map(function ($attendance) {
                        return [
                            'id' => $attendance->id,
                            'date' => $attendance->date->format('Y-m-d'),
                            'clock_in' => $attendance->clock_in ? $attendance->clock_in->format('H:i') : null,
                            'clock_out' => $attendance->clock_out ? $attendance->clock_out->format('H:i') : null,
                            'status' => $attendance->status,
                            'status_label' => \App\Models\HR\Attendance::STATUS_LABELS[$attendance->status] ?? $attendance->status,
                            'late_minutes' => $attendance->late_minutes,
                            'early_leave_minutes' => $attendance->early_leave_minutes,
                            'work_duration_minutes' => $attendance->work_duration_minutes,
                        ];
                    });
            }

            return response()->json([
                'data' => [
                    'employee' => $employee,
                    'today_attendance' => $todayAttendance,
                    'today_schedule' => $todaySchedule,
                    'early_leave_request' => $earlyLeaveRequest,
                    'pending_leaves' => $pendingLeaves,
                    'leave_balances' => $leaveBalances,
                    'recent_attendances' => $recentAttendances,
                ],
            ]);
        });
    });

    // Notifications (Announcements from FCM)
    Route::get('/notifications', function (Request $request) {
        $query = \App\Models\AnnouncementRecipient::where('user_id', $request->user()->id)
            ->with(['announcement.creator'])
            ->orderBy('created_at', 'desc');
        
        // Filter by unread
        if ($request->has('unread') && $request->unread) {
            $query->where('is_read', false);
        }
        
        $recipients = $query->paginate($request->get('per_page', 20));
        
        // Transform to notification format
        $notifications = $recipients->getCollection()->map(function ($recipient) {
            return [
                'id' => $recipient->id,
                'user_id' => $recipient->user_id,
                'type' => $recipient->announcement->type ?? 'announcement',
                'title' => $recipient->announcement->title,
                'message' => $recipient->announcement->message,
                'icon' => 'Megaphone',
                'color' => 'blue',
                'data' => null,
                'action_url' => null,
                'is_read' => $recipient->is_read,
                'read_at' => $recipient->read_at?->toIso8601String(),
                'created_at' => $recipient->created_at->toIso8601String(),
            ];
        });
        
        $unreadCount = \App\Models\AnnouncementRecipient::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->count();
        
        return response()->json([
            'data' => $notifications,
            'meta' => [
                'current_page' => $recipients->currentPage(),
                'last_page' => $recipients->lastPage(),
                'per_page' => $recipients->perPage(),
                'total' => $recipients->total(),
                'unread_count' => $unreadCount,
            ],
        ]);
    });

    Route::post('/notifications/{id}/read', function (Request $request, $id) {
        $recipient = \App\Models\AnnouncementRecipient::where('user_id', $request->user()->id)
            ->findOrFail($id);
        $recipient->markAsRead();
        return response()->json(['message' => 'Notification marked as read']);
    });

    Route::post('/notifications/mark-all-read', function (Request $request) {
        \App\Models\AnnouncementRecipient::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
        return response()->json(['message' => 'All notifications marked as read']);
    });

    Route::delete('/notifications/{id}', function (Request $request, $id) {
        $recipient = \App\Models\AnnouncementRecipient::where('user_id', $request->user()->id)
            ->findOrFail($id);
        $recipient->delete();
        return response()->json(['message' => 'Notification deleted']);
    });

    Route::get('/notifications/unread-count', function (Request $request) {
        $count = \App\Models\AnnouncementRecipient::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->count();
        return response()->json(['count' => $count]);
    });

    // ========== MEETINGS ==========
    Route::prefix('meetings')->group(function () {
        // Get meetings where user is a participant
        Route::get('/', function (Request $request) {
            $user = $request->user();
            $status = $request->get('status');
            $upcoming = $request->get('upcoming', false);
            
            $query = \App\Models\Meeting::query()
                ->with(['room', 'organizer', 'organizationUnit'])
                ->withCount(['participants', 'attendedParticipants'])
                ->whereHas('participants', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                });
            
            if ($status) {
                $query->where('status', $status);
            }
            
            if ($upcoming) {
                $query->where('meeting_date', '>=', now()->toDateString())
                    ->whereIn('status', ['draft', 'scheduled', 'ongoing'])
                    ->orderBy('meeting_date', 'asc')
                    ->orderBy('start_time', 'asc');
            } else {
                $query->orderBy('meeting_date', 'desc')
                    ->orderBy('start_time', 'desc');
            }
            
            $meetings = $query->paginate($request->get('per_page', 10));
            
            // Transform meetings data
            $meetings->getCollection()->transform(function ($meeting) use ($user) {
                $participant = $meeting->participants->where('user_id', $user->id)->first();
                return [
                    'id' => $meeting->id,
                    'meeting_number' => $meeting->meeting_number,
                    'title' => $meeting->title,
                    'agenda' => $meeting->agenda,
                    'meeting_date' => $meeting->meeting_date->format('Y-m-d'),
                    'start_time' => $meeting->start_time,
                    'end_time' => $meeting->end_time,
                    'status' => $meeting->status,
                    'status_label' => $meeting->status_label,
                    'status_color' => $meeting->status_color,
                    'room' => $meeting->room ? [
                        'id' => $meeting->room->id,
                        'name' => $meeting->room->name,
                        'location' => $meeting->room->location,
                    ] : null,
                    'organizer' => $meeting->organizer ? [
                        'id' => $meeting->organizer->id,
                        'name' => $meeting->organizer->name,
                    ] : null,
                    'organization_unit' => $meeting->organizationUnit ? [
                        'id' => $meeting->organizationUnit->id,
                        'name' => $meeting->organizationUnit->name,
                    ] : null,
                    'participants_count' => $meeting->participants_count,
                    'attended_participants_count' => $meeting->attended_participants_count,
                    'my_role' => $participant?->role,
                    'my_attendance_status' => $participant?->attendance_status,
                ];
            });
            
            return response()->json([
                'data' => $meetings->items(),
                'meta' => [
                    'current_page' => $meetings->currentPage(),
                    'last_page' => $meetings->lastPage(),
                    'per_page' => $meetings->perPage(),
                    'total' => $meetings->total(),
                ],
            ]);
        });

        // Get meeting detail
        Route::get('/{meeting}', function (Request $request, \App\Models\Meeting $meeting) {
            $user = $request->user();
            
            // Check if user is participant
            $participant = $meeting->participants()->where('user_id', $user->id)->first();
            if (!$participant) {
                return response()->json(['message' => 'Anda bukan peserta rapat ini'], 403);
            }
            
            $meeting->load(['room', 'organizer', 'organizationUnit', 'participants.user', 'actionItems.assignee']);
            
            return response()->json([
                'data' => [
                    'id' => $meeting->id,
                    'meeting_number' => $meeting->meeting_number,
                    'title' => $meeting->title,
                    'agenda' => $meeting->agenda,
                    'meeting_date' => $meeting->meeting_date->format('Y-m-d'),
                    'start_time' => $meeting->start_time,
                    'end_time' => $meeting->end_time,
                    'status' => $meeting->status,
                    'status_label' => $meeting->status_label,
                    'status_color' => $meeting->status_color,
                    'notes' => $meeting->notes,
                    'minutes_of_meeting' => $meeting->minutes_of_meeting,
                    'memo_content' => $meeting->memo_content,
                    'room' => $meeting->room ? [
                        'id' => $meeting->room->id,
                        'name' => $meeting->room->name,
                        'location' => $meeting->room->location,
                        'capacity' => $meeting->room->capacity,
                    ] : null,
                    'organizer' => $meeting->organizer ? [
                        'id' => $meeting->organizer->id,
                        'name' => $meeting->organizer->name,
                        'nip' => $meeting->organizer->nip,
                    ] : null,
                    'organization_unit' => $meeting->organizationUnit ? [
                        'id' => $meeting->organizationUnit->id,
                        'name' => $meeting->organizationUnit->name,
                    ] : null,
                    'participants' => $meeting->participants->map(function ($p) {
                        return [
                            'id' => $p->id,
                            'user_id' => $p->user_id,
                            'name' => $p->user?->name,
                            'nip' => $p->user?->nip,
                            'role' => $p->role,
                            'role_label' => $p->role_label,
                            'attendance_status' => $p->attendance_status,
                            'attendance_status_label' => $p->attendance_status_label,
                            'check_in_time' => $p->check_in_time,
                        ];
                    }),
                    'action_items' => $meeting->actionItems->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'title' => $item->title,
                            'description' => $item->description,
                            'assignee' => $item->assignee ? [
                                'id' => $item->assignee->id,
                                'name' => $item->assignee->name,
                            ] : null,
                            'due_date' => $item->due_date?->format('Y-m-d'),
                            'status' => $item->status,
                            'completed_at' => $item->completed_at?->format('Y-m-d H:i:s'),
                        ];
                    }),
                    'my_role' => $participant->role,
                    'my_attendance_status' => $participant->attendance_status,
                    'can_check_in' => $meeting->status === 'ongoing' && $participant->attendance_status !== 'attended',
                ],
            ]);
        });

        // Check-in to meeting (for participants)
        Route::post('/{meeting}/check-in', function (Request $request, \App\Models\Meeting $meeting) {
            $user = $request->user();
            
            // Check if meeting is ongoing
            if ($meeting->status !== 'ongoing') {
                return response()->json(['message' => 'Rapat belum dimulai atau sudah selesai'], 400);
            }
            
            // Find participant
            $participant = $meeting->participants()->where('user_id', $user->id)->first();
            if (!$participant) {
                return response()->json(['message' => 'Anda bukan peserta rapat ini'], 403);
            }
            
            // Check if already checked in
            if ($participant->attendance_status === 'attended') {
                return response()->json(['message' => 'Anda sudah melakukan check-in'], 400);
            }
            
            // Mark as attended
            $participant->markAsAttended();
            
            return response()->json([
                'message' => 'Check-in berhasil',
                'data' => [
                    'attendance_status' => 'attended',
                    'check_in_time' => $participant->fresh()->check_in_time,
                ],
            ]);
        });

        // QR Check-in (using token from QR code)
        Route::post('/qr-check-in', function (Request $request) {
            $request->validate([
                'token' => 'required|string',
            ]);
            
            $user = $request->user();
            $token = $request->token;
            
            // Find meeting by check-in token
            $meeting = \App\Models\Meeting::findByCheckinToken($token);
            if (!$meeting) {
                return response()->json(['message' => 'Token tidak valid atau sudah kadaluarsa'], 400);
            }
            
            // Find participant
            $participant = $meeting->participants()->where('user_id', $user->id)->first();
            if (!$participant) {
                return response()->json(['message' => 'Anda bukan peserta rapat ini'], 403);
            }
            
            // Check if already checked in
            if ($participant->attendance_status === 'attended') {
                return response()->json(['message' => 'Anda sudah melakukan check-in'], 400);
            }
            
            // Mark as attended
            $participant->markAsAttended();
            
            return response()->json([
                'message' => 'Check-in berhasil',
                'data' => [
                    'meeting_id' => $meeting->id,
                    'meeting_title' => $meeting->title,
                    'attendance_status' => 'attended',
                    'check_in_time' => $participant->fresh()->check_in_time,
                ],
            ]);
        });

        // Confirm attendance (RSVP)
        Route::post('/{meeting}/confirm', function (Request $request, \App\Models\Meeting $meeting) {
            $user = $request->user();
            
            // Check if meeting is still scheduled
            if (!in_array($meeting->status, ['draft', 'scheduled'])) {
                return response()->json(['message' => 'Konfirmasi tidak dapat dilakukan untuk rapat ini'], 400);
            }
            
            // Find participant
            $participant = $meeting->participants()->where('user_id', $user->id)->first();
            if (!$participant) {
                return response()->json(['message' => 'Anda bukan peserta rapat ini'], 403);
            }
            
            $request->validate([
                'status' => 'required|in:confirmed,excused',
                'notes' => 'nullable|string|max:500',
            ]);
            
            $participant->update([
                'attendance_status' => $request->status,
                'notes' => $request->notes,
            ]);
            
            return response()->json([
                'message' => $request->status === 'confirmed' ? 'Konfirmasi kehadiran berhasil' : 'Anda ditandai berhalangan hadir',
                'data' => [
                    'attendance_status' => $request->status,
                ],
            ]);
        });

        // Get upcoming meetings count (for dashboard)
        Route::get('/stats/upcoming', function (Request $request) {
            $user = $request->user();
            
            $upcomingCount = \App\Models\Meeting::query()
                ->whereHas('participants', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                })
                ->where('meeting_date', '>=', now()->toDateString())
                ->whereIn('status', ['draft', 'scheduled', 'ongoing'])
                ->count();
            
            $todayMeetings = \App\Models\Meeting::query()
                ->with(['room'])
                ->whereHas('participants', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                })
                ->where('meeting_date', now()->toDateString())
                ->whereIn('status', ['scheduled', 'ongoing'])
                ->orderBy('start_time', 'asc')
                ->get()
                ->map(function ($meeting) {
                    return [
                        'id' => $meeting->id,
                        'title' => $meeting->title,
                        'start_time' => $meeting->start_time,
                        'end_time' => $meeting->end_time,
                        'status' => $meeting->status,
                        'room_name' => $meeting->room?->name,
                    ];
                });
            
            return response()->json([
                'upcoming_count' => $upcomingCount,
                'today_meetings' => $todayMeetings,
            ]);
        });
    });
});
