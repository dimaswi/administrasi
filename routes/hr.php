<?php

use App\Http\Controllers\HR\HRDashboardController;
use App\Http\Controllers\HR\JobCategoryController;
use App\Http\Controllers\HR\EmploymentStatusController;
use App\Http\Controllers\HR\EducationLevelController;
use App\Http\Controllers\HR\EmployeeController;
use App\Http\Controllers\HR\EmployeeFamilyController;
use App\Http\Controllers\HR\EmployeeEducationController;
use App\Http\Controllers\HR\EmployeeWorkHistoryController;
use App\Http\Controllers\HR\EmployeeScheduleController;
use App\Http\Controllers\HR\WorkScheduleController;
use App\Http\Controllers\HR\AttendanceController;
use App\Http\Controllers\HR\LeaveTypeController;
use App\Http\Controllers\HR\LeaveController;
use App\Http\Controllers\HR\LeaveBalanceController;
use App\Http\Controllers\HR\EmployeeCredentialController;
use App\Http\Controllers\HR\TrainingController;
use App\Http\Controllers\HR\EmployeeTrainingController;
use App\Http\Controllers\HR\PerformancePeriodController;
use App\Http\Controllers\HR\KpiController;
use App\Http\Controllers\HR\PerformanceReviewController;
use App\Http\Controllers\HR\ReportController;
use App\Http\Controllers\HR\Feedback360Controller;
use App\Http\Controllers\HR\CalibrationController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->prefix('hr')->name('hr.')->group(function () {
    // HR Dashboard
    Route::get('/', [HRDashboardController::class, 'index'])->name('dashboard');
    
    // Reports Hub
    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('/', [ReportController::class, 'index'])->name('index');
        Route::get('/leave', [ReportController::class, 'leaveReport'])->name('leave');
        Route::get('/leave/export', [ReportController::class, 'exportLeaveReport'])->name('leave.export');
        Route::get('/training', [ReportController::class, 'trainingReport'])->name('training');
        Route::get('/training/export', [ReportController::class, 'exportTrainingReport'])->name('training.export');
        Route::get('/performance', [ReportController::class, 'performanceReport'])->name('performance');
        Route::get('/performance/export', [ReportController::class, 'exportPerformanceReport'])->name('performance.export');
        Route::get('/employee', [ReportController::class, 'employeeReport'])->name('employee');
        Route::get('/employee/export', [ReportController::class, 'exportEmployeeReport'])->name('employee.export');
        Route::get('/turnover', [ReportController::class, 'turnoverReport'])->name('turnover');
        Route::get('/turnover/export', [ReportController::class, 'exportTurnoverReport'])->name('turnover.export');
    });
    
    // Attendances
    Route::get('attendances', [AttendanceController::class, 'index'])->name('attendances.index');
    Route::get('attendances/bulk', [AttendanceController::class, 'bulkForm'])->name('attendances.bulk-form');
    Route::post('attendances/bulk', [AttendanceController::class, 'bulkStore'])->name('attendances.bulk');
    Route::get('attendances/report', [AttendanceController::class, 'report'])->name('attendances.report');
    Route::get('attendances/export/daily', [AttendanceController::class, 'exportDaily'])->name('attendances.export.daily');
    Route::get('attendances/export/monthly', [AttendanceController::class, 'exportMonthly'])->name('attendances.export.monthly');
    Route::get('attendances/{employee}/create', [AttendanceController::class, 'create'])->name('attendances.create');
    Route::post('attendances/{employee}', [AttendanceController::class, 'store'])->name('attendances.store');
    Route::delete('attendances/{attendance}', [AttendanceController::class, 'destroy'])->name('attendances.destroy');
    
    // Leave Balances
    Route::get('leave-balances', [LeaveBalanceController::class, 'index'])->name('leave-balances.index');
    Route::get('leave-balances/{employee}/edit', [LeaveBalanceController::class, 'edit'])->name('leave-balances.edit');
    Route::put('leave-balances/{employee}', [LeaveBalanceController::class, 'update'])->name('leave-balances.update');
    Route::post('leave-balances/initialize', [LeaveBalanceController::class, 'initializeYear'])->name('leave-balances.initialize');
    
    // Leaves
    Route::get('leaves', [LeaveController::class, 'index'])->name('leaves.index');
    Route::get('leaves/create', [LeaveController::class, 'create'])->name('leaves.create');
    Route::get('leaves/export', [LeaveController::class, 'export'])->name('leaves.export');
    Route::post('leaves', [LeaveController::class, 'store'])->name('leaves.store');
    Route::get('leaves/{leave}', [LeaveController::class, 'show'])->name('leaves.show');
    Route::get('leaves/{leave}/edit', [LeaveController::class, 'edit'])->name('leaves.edit');
    Route::put('leaves/{leave}', [LeaveController::class, 'update'])->name('leaves.update');
    Route::delete('leaves/{leave}', [LeaveController::class, 'destroy'])->name('leaves.destroy');
    Route::post('leaves/{leave}/approve', [LeaveController::class, 'approve'])->name('leaves.approve');
    Route::post('leaves/{leave}/reject', [LeaveController::class, 'reject'])->name('leaves.reject');
    Route::post('leaves/{leave}/cancel', [LeaveController::class, 'cancel'])->name('leaves.cancel');
    
    // Leave Types
    Route::get('leave-types', [LeaveTypeController::class, 'index'])->name('leave-types.index');
    Route::get('leave-types/create', [LeaveTypeController::class, 'create'])->name('leave-types.create');
    Route::post('leave-types', [LeaveTypeController::class, 'store'])->name('leave-types.store');
    Route::get('leave-types/{leaveType}', [LeaveTypeController::class, 'show'])->name('leave-types.show');
    Route::get('leave-types/{leaveType}/edit', [LeaveTypeController::class, 'edit'])->name('leave-types.edit');
    Route::put('leave-types/{leaveType}', [LeaveTypeController::class, 'update'])->name('leave-types.update');
    Route::delete('leave-types/{leaveType}', [LeaveTypeController::class, 'destroy'])->name('leave-types.destroy');
    
    // Job Categories
    Route::get('job-categories', [JobCategoryController::class, 'index'])->name('job-categories.index');
    Route::get('job-categories/create', [JobCategoryController::class, 'create'])->name('job-categories.create');
    Route::post('job-categories', [JobCategoryController::class, 'store'])->name('job-categories.store');
    Route::get('job-categories/{jobCategory}', [JobCategoryController::class, 'show'])->name('job-categories.show');
    Route::get('job-categories/{jobCategory}/edit', [JobCategoryController::class, 'edit'])->name('job-categories.edit');
    Route::put('job-categories/{jobCategory}', [JobCategoryController::class, 'update'])->name('job-categories.update');
    Route::delete('job-categories/{jobCategory}', [JobCategoryController::class, 'destroy'])->name('job-categories.destroy');
    
    // Employment Statuses
    Route::get('employment-statuses', [EmploymentStatusController::class, 'index'])->name('employment-statuses.index');
    Route::get('employment-statuses/create', [EmploymentStatusController::class, 'create'])->name('employment-statuses.create');
    Route::post('employment-statuses', [EmploymentStatusController::class, 'store'])->name('employment-statuses.store');
    Route::get('employment-statuses/{employmentStatus}', [EmploymentStatusController::class, 'show'])->name('employment-statuses.show');
    Route::get('employment-statuses/{employmentStatus}/edit', [EmploymentStatusController::class, 'edit'])->name('employment-statuses.edit');
    Route::put('employment-statuses/{employmentStatus}', [EmploymentStatusController::class, 'update'])->name('employment-statuses.update');
    Route::delete('employment-statuses/{employmentStatus}', [EmploymentStatusController::class, 'destroy'])->name('employment-statuses.destroy');
    
    // Education Levels
    Route::get('education-levels', [EducationLevelController::class, 'index'])->name('education-levels.index');
    Route::get('education-levels/create', [EducationLevelController::class, 'create'])->name('education-levels.create');
    Route::post('education-levels', [EducationLevelController::class, 'store'])->name('education-levels.store');
    Route::get('education-levels/{educationLevel}', [EducationLevelController::class, 'show'])->name('education-levels.show');
    Route::get('education-levels/{educationLevel}/edit', [EducationLevelController::class, 'edit'])->name('education-levels.edit');
    Route::put('education-levels/{educationLevel}', [EducationLevelController::class, 'update'])->name('education-levels.update');
    Route::delete('education-levels/{educationLevel}', [EducationLevelController::class, 'destroy'])->name('education-levels.destroy');
    
    // Work Schedules (Master Data Shift)
    Route::get('work-schedules', [WorkScheduleController::class, 'index'])->name('work-schedules.index');
    Route::get('work-schedules/create', [WorkScheduleController::class, 'create'])->name('work-schedules.create');
    Route::post('work-schedules', [WorkScheduleController::class, 'store'])->name('work-schedules.store');
    Route::get('work-schedules/{workSchedule}/edit', [WorkScheduleController::class, 'edit'])->name('work-schedules.edit');
    Route::put('work-schedules/{workSchedule}', [WorkScheduleController::class, 'update'])->name('work-schedules.update');
    Route::delete('work-schedules/{workSchedule}', [WorkScheduleController::class, 'destroy'])->name('work-schedules.destroy');
    
    // Employee Schedules (Jadwal Kerja per Karyawan)
    Route::get('schedules', [EmployeeScheduleController::class, 'index'])->name('schedules.index');
    Route::get('schedules/bulk', [EmployeeScheduleController::class, 'bulkForm'])->name('schedules.bulk-form');
    Route::post('schedules/bulk', [EmployeeScheduleController::class, 'bulkCreate'])->name('schedules.bulk');
    Route::get('schedules/{employee}', [EmployeeScheduleController::class, 'show'])->name('schedules.show');
    Route::get('schedules/{employee}/create', [EmployeeScheduleController::class, 'create'])->name('schedules.create');
    Route::post('schedules/{employee}', [EmployeeScheduleController::class, 'store'])->name('schedules.store');
    Route::get('schedules/{employee}/schedules/{schedule}/edit', [EmployeeScheduleController::class, 'edit'])->name('schedules.edit');
    Route::put('schedules/{employee}/schedules/{schedule}', [EmployeeScheduleController::class, 'update'])->name('schedules.update');
    Route::delete('schedules/{employee}/schedules/{schedule}', [EmployeeScheduleController::class, 'destroy'])->name('schedules.destroy');
    
    // Employees
    Route::get('employees', [EmployeeController::class, 'index'])->name('employees.index');
    Route::get('employees/create', [EmployeeController::class, 'create'])->name('employees.create');
    Route::post('employees', [EmployeeController::class, 'store'])->name('employees.store');
    Route::get('employees/{employee}', [EmployeeController::class, 'show'])->name('employees.show');
    Route::get('employees/{employee}/edit', [EmployeeController::class, 'edit'])->name('employees.edit');
    Route::put('employees/{employee}', [EmployeeController::class, 'update'])->name('employees.update');
    Route::patch('employees/{employee}/partial', [EmployeeController::class, 'updatePartial'])->name('employees.update-partial');
    Route::delete('employees/{employee}', [EmployeeController::class, 'destroy'])->name('employees.destroy');
    Route::patch('employees/{employee}/status', [EmployeeController::class, 'updateStatus'])->name('employees.update-status');
    
    // Employee Families
    Route::post('employees/{employee}/families', [EmployeeFamilyController::class, 'store'])->name('employees.families.store');
    Route::put('employees/{employee}/families/{family}', [EmployeeFamilyController::class, 'update'])->name('employees.families.update');
    Route::delete('employees/{employee}/families/{family}', [EmployeeFamilyController::class, 'destroy'])->name('employees.families.destroy');
    
    // Employee Educations
    Route::post('employees/{employee}/educations', [EmployeeEducationController::class, 'store'])->name('employees.educations.store');
    Route::put('employees/{employee}/educations/{education}', [EmployeeEducationController::class, 'update'])->name('employees.educations.update');
    Route::delete('employees/{employee}/educations/{education}', [EmployeeEducationController::class, 'destroy'])->name('employees.educations.destroy');
    
    // Employee Work Histories
    Route::post('employees/{employee}/work-histories', [EmployeeWorkHistoryController::class, 'store'])->name('employees.work-histories.store');
    Route::put('employees/{employee}/work-histories/{workHistory}', [EmployeeWorkHistoryController::class, 'update'])->name('employees.work-histories.update');
    Route::delete('employees/{employee}/work-histories/{workHistory}', [EmployeeWorkHistoryController::class, 'destroy'])->name('employees.work-histories.destroy');
    
    // Employee Credentials
    Route::get('credentials', [EmployeeCredentialController::class, 'index'])->name('credentials.index');
    Route::get('credentials/export', [EmployeeCredentialController::class, 'export'])->name('credentials.export');
    Route::get('credentials/{credential}', [EmployeeCredentialController::class, 'show'])->name('credentials.show');
    Route::get('credentials/{credential}/edit', [EmployeeCredentialController::class, 'edit'])->name('credentials.edit');
    Route::put('credentials/{credential}', [EmployeeCredentialController::class, 'update'])->name('credentials.update');
    Route::post('credentials/{credential}/verify', [EmployeeCredentialController::class, 'verify'])->name('credentials.verify');
    Route::post('credentials/{credential}/unverify', [EmployeeCredentialController::class, 'unverify'])->name('credentials.unverify');
    Route::delete('credentials/{credential}', [EmployeeCredentialController::class, 'destroy'])->name('credentials.destroy');
    Route::get('employees/{employee}/credentials/create', [EmployeeCredentialController::class, 'create'])->name('employees.credentials.create');
    Route::post('employees/{employee}/credentials', [EmployeeCredentialController::class, 'store'])->name('employees.credentials.store');
    
    // Trainings (Master Data)
    Route::get('trainings', [TrainingController::class, 'index'])->name('trainings.index');
    Route::get('trainings/export', [TrainingController::class, 'export'])->name('trainings.export');
    Route::get('trainings/create', [TrainingController::class, 'create'])->name('trainings.create');
    Route::post('trainings', [TrainingController::class, 'store'])->name('trainings.store');
    Route::get('trainings/{training}', [TrainingController::class, 'show'])->name('trainings.show');
    Route::get('trainings/{training}/edit', [TrainingController::class, 'edit'])->name('trainings.edit');
    Route::put('trainings/{training}', [TrainingController::class, 'update'])->name('trainings.update');
    Route::delete('trainings/{training}', [TrainingController::class, 'destroy'])->name('trainings.destroy');
    
    // Employee Trainings (Peserta Training)
    Route::get('employee-trainings', [EmployeeTrainingController::class, 'index'])->name('employee-trainings.index');
    Route::get('employee-trainings/export', [EmployeeTrainingController::class, 'export'])->name('employee-trainings.export');
    Route::get('employee-trainings/create', [EmployeeTrainingController::class, 'create'])->name('employee-trainings.create');
    Route::post('employee-trainings', [EmployeeTrainingController::class, 'store'])->name('employee-trainings.store');
    Route::get('employee-trainings/{employeeTraining}', [EmployeeTrainingController::class, 'show'])->name('employee-trainings.show');
    Route::get('employee-trainings/{employeeTraining}/edit', [EmployeeTrainingController::class, 'edit'])->name('employee-trainings.edit');
    Route::put('employee-trainings/{employeeTraining}', [EmployeeTrainingController::class, 'update'])->name('employee-trainings.update');
    Route::delete('employee-trainings/{employeeTraining}', [EmployeeTrainingController::class, 'destroy'])->name('employee-trainings.destroy');
    
    // Performance Periods (Periode Penilaian)
    Route::get('performance-periods', [PerformancePeriodController::class, 'index'])->name('performance-periods.index');
    Route::get('performance-periods/create', [PerformancePeriodController::class, 'create'])->name('performance-periods.create');
    Route::post('performance-periods', [PerformancePeriodController::class, 'store'])->name('performance-periods.store');
    Route::get('performance-periods/{performancePeriod}', [PerformancePeriodController::class, 'show'])->name('performance-periods.show');
    Route::get('performance-periods/{performancePeriod}/edit', [PerformancePeriodController::class, 'edit'])->name('performance-periods.edit');
    Route::put('performance-periods/{performancePeriod}', [PerformancePeriodController::class, 'update'])->name('performance-periods.update');
    Route::delete('performance-periods/{performancePeriod}', [PerformancePeriodController::class, 'destroy'])->name('performance-periods.destroy');
    Route::post('performance-periods/{performancePeriod}/set-current', [PerformancePeriodController::class, 'setCurrent'])->name('performance-periods.set-current');
    Route::post('performance-periods/{performancePeriod}/activate', [PerformancePeriodController::class, 'activate'])->name('performance-periods.activate');
    Route::post('performance-periods/{performancePeriod}/close', [PerformancePeriodController::class, 'close'])->name('performance-periods.close');
    
    // KPI Management (Kategori & Template KPI)
    Route::get('kpi', [KpiController::class, 'index'])->name('kpi.index');
    Route::post('kpi/categories', [KpiController::class, 'storeCategory'])->name('kpi.categories.store');
    Route::put('kpi/categories/{category}', [KpiController::class, 'updateCategory'])->name('kpi.categories.update');
    Route::delete('kpi/categories/{category}', [KpiController::class, 'destroyCategory'])->name('kpi.categories.destroy');
    Route::post('kpi/templates', [KpiController::class, 'storeTemplate'])->name('kpi.templates.store');
    Route::put('kpi/templates/{template}', [KpiController::class, 'updateTemplate'])->name('kpi.templates.update');
    Route::delete('kpi/templates/{template}', [KpiController::class, 'destroyTemplate'])->name('kpi.templates.destroy');
    
    // Performance Reviews (Penilaian Kinerja)
    Route::get('performance-reviews', [PerformanceReviewController::class, 'index'])->name('performance-reviews.index');
    Route::get('performance-reviews/export', [PerformanceReviewController::class, 'export'])->name('performance-reviews.export');
    Route::get('performance-reviews/create', [PerformanceReviewController::class, 'create'])->name('performance-reviews.create');
    Route::post('performance-reviews', [PerformanceReviewController::class, 'store'])->name('performance-reviews.store');
    Route::get('performance-reviews/{performanceReview}', [PerformanceReviewController::class, 'show'])->name('performance-reviews.show');
    Route::delete('performance-reviews/{performanceReview}', [PerformanceReviewController::class, 'destroy'])->name('performance-reviews.destroy');
    Route::post('performance-reviews/{performanceReview}/self-review', [PerformanceReviewController::class, 'submitSelfReview'])->name('performance-reviews.self-review');
    Route::post('performance-reviews/{performanceReview}/manager-review', [PerformanceReviewController::class, 'submitManagerReview'])->name('performance-reviews.manager-review');
    Route::post('performance-reviews/{performanceReview}/complete', [PerformanceReviewController::class, 'complete'])->name('performance-reviews.complete');
    
    // 360 Feedback Sessions (Admin)
    Route::get('feedback360', [Feedback360Controller::class, 'index'])->name('feedback360.index');
    Route::get('feedback360/create', [Feedback360Controller::class, 'create'])->name('feedback360.create');
    Route::post('feedback360', [Feedback360Controller::class, 'store'])->name('feedback360.store');
    Route::get('feedback360/{feedback360}', [Feedback360Controller::class, 'show'])->name('feedback360.show');
    Route::get('feedback360/{feedback360}/edit', [Feedback360Controller::class, 'edit'])->name('feedback360.edit');
    Route::put('feedback360/{feedback360}', [Feedback360Controller::class, 'update'])->name('feedback360.update');
    Route::delete('feedback360/{feedback360}', [Feedback360Controller::class, 'destroy'])->name('feedback360.destroy');
    Route::post('feedback360/{feedback360}/start', [Feedback360Controller::class, 'start'])->name('feedback360.start');
    Route::post('feedback360/{feedback360}/complete', [Feedback360Controller::class, 'complete'])->name('feedback360.complete');
    Route::get('feedback360/participants/{participant}/result', [Feedback360Controller::class, 'participantResult'])->name('feedback360.participant-result');
    Route::post('feedback360/participants/{participant}/reviewers', [Feedback360Controller::class, 'addReviewer'])->name('feedback360.add-reviewer');
    Route::delete('feedback360/reviewers/{reviewer}', [Feedback360Controller::class, 'removeReviewer'])->name('feedback360.remove-reviewer');
    
    // 360 Feedback (Employee Portal)
    Route::get('my-feedback-requests', [Feedback360Controller::class, 'myFeedbackRequests'])->name('feedback360.my-requests');
    Route::get('my-feedback-requests/{reviewer}/give', [Feedback360Controller::class, 'giveFeedback'])->name('feedback360.give-feedback');
    Route::post('my-feedback-requests/{reviewer}/submit', [Feedback360Controller::class, 'submitFeedback'])->name('feedback360.submit-feedback');
    Route::get('my-feedback-result', [Feedback360Controller::class, 'myResult'])->name('feedback360.my-result');
    
    // Calibration Sessions
    Route::get('calibration', [CalibrationController::class, 'index'])->name('calibration.index');
    Route::get('calibration/create', [CalibrationController::class, 'create'])->name('calibration.create');
    Route::post('calibration', [CalibrationController::class, 'store'])->name('calibration.store');
    Route::get('calibration/{calibration}', [CalibrationController::class, 'show'])->name('calibration.show');
    Route::delete('calibration/{calibration}', [CalibrationController::class, 'destroy'])->name('calibration.destroy');
    Route::post('calibration/{calibration}/start', [CalibrationController::class, 'start'])->name('calibration.start');
    Route::post('calibration/{calibration}/complete', [CalibrationController::class, 'complete'])->name('calibration.complete');
    Route::post('calibration/reviews/{calibrationReview}/calibrate', [CalibrationController::class, 'calibrateReview'])->name('calibration.calibrate-review');
    Route::post('calibration/reviews/{calibrationReview}/reset', [CalibrationController::class, 'resetCalibration'])->name('calibration.reset-calibration');
    Route::post('calibration/reviews/{calibrationReview}/comments', [CalibrationController::class, 'addComment'])->name('calibration.add-comment');
    Route::get('calibration/reviews/{calibrationReview}/comments', [CalibrationController::class, 'getComments'])->name('calibration.get-comments');
});
