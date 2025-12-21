<?php

use App\Http\Controllers\Meeting\ActionItemController;
use App\Http\Controllers\Meeting\MeetingController;
use App\Http\Controllers\Meeting\PublicCheckinController;
use Illuminate\Support\Facades\Route;

// Public routes (tanpa login) - untuk check-in peserta via QR Code
Route::get('meeting/checkin/{token}', [PublicCheckinController::class, 'showCheckinPage'])->name('public.checkin');
Route::post('meeting/checkin/{token}', [PublicCheckinController::class, 'processCheckin'])->name('public.checkin.process');

Route::middleware('auth')->group(function () {
    // Meeting Management
    Route::get('meeting/meetings', [MeetingController::class, 'index'])->name('meetings.index')->middleware('permission:meeting.view');
    Route::get('meeting/meetings/calendar-data', [MeetingController::class, 'calendarData'])->name('meetings.calendar-data')->middleware('permission:meeting.view');
    Route::get('meeting/meetings/create', [MeetingController::class, 'create'])->name('meetings.create')->middleware('permission:meeting.create');
    Route::post('meeting/meetings', [MeetingController::class, 'store'])->name('meetings.store')->middleware('permission:meeting.create');
    Route::get('meeting/meetings/{meeting}', [MeetingController::class, 'show'])->name('meetings.show')->middleware('permission:meeting.view');
    Route::get('meeting/meetings/{meeting}/edit', [MeetingController::class, 'edit'])->name('meetings.edit')->middleware('permission:meeting.edit');
    Route::put('meeting/meetings/{meeting}', [MeetingController::class, 'update'])->name('meetings.update')->middleware('permission:meeting.edit');
    Route::delete('meeting/meetings/{meeting}', [MeetingController::class, 'destroy'])->name('meetings.destroy')->middleware('permission:meeting.delete');
    
    // Meeting Actions
    Route::put('meeting/meetings/{meeting}/status', [MeetingController::class, 'updateStatus'])->name('meetings.update-status')->middleware('permission:meeting.edit');
    Route::post('meeting/meetings/{meeting}/start', [MeetingController::class, 'startMeeting'])->name('meetings.start')->middleware('permission:meeting.view');
    Route::post('meeting/meetings/{meeting}/cancel', [MeetingController::class, 'cancelMeeting'])->name('meetings.cancel')->middleware('permission:meeting.edit');
    Route::put('meeting/meetings/{meeting}/complete', [MeetingController::class, 'complete'])->name('meetings.complete')->middleware('permission:meeting.complete');
    Route::put('meeting/meetings/{meeting}/participants/{participant}/attendance', [MeetingController::class, 'markAttendance'])->name('meetings.mark-attendance')->middleware('permission:meeting.mark-attendance');
    
    // Check-in Token Management (untuk moderator/organizer)
    Route::post('meeting/meetings/{meeting}/checkin-token', [PublicCheckinController::class, 'generateToken'])->name('meetings.generate-checkin-token');
    Route::get('meeting/meetings/{meeting}/checkin-token', [PublicCheckinController::class, 'getTokenStatus'])->name('meetings.checkin-token-status');
    Route::delete('meeting/meetings/{meeting}/checkin-token', [PublicCheckinController::class, 'stopCheckin'])->name('meetings.stop-checkin');
    
    // Memo and Attendance Management
    Route::get('meeting/meetings/{meeting}/memo', [MeetingController::class, 'editMemo'])->name('meetings.edit-memo')->middleware('permission:meeting.edit');
    Route::put('meeting/meetings/{meeting}/memo', [MeetingController::class, 'updateMemo'])->name('meetings.update-memo')->middleware('permission:meeting.edit');
    Route::get('meeting/meetings/{meeting}/attendance', [MeetingController::class, 'editAttendance'])->name('meetings.edit-attendance')->middleware('permission:meeting.view');
    Route::post('meeting/meetings/{meeting}/check-in', [MeetingController::class, 'checkInAttendance'])->name('meetings.check-in')->middleware('permission:meeting.view');
    
    // Generate Documents
    Route::get('meeting/meetings/{meeting}/generate-invitation', [MeetingController::class, 'generateInvitation'])->name('meetings.generate-invitation')->middleware('permission:meeting.generate-documents');
    Route::get('meeting/meetings/{meeting}/generate-memo', [MeetingController::class, 'generateMemo'])->name('meetings.generate-memo')->middleware('permission:meeting.generate-documents');
    Route::get('meeting/meetings/{meeting}/generate-attendance', [MeetingController::class, 'generateAttendance'])->name('meetings.generate-attendance')->middleware('permission:meeting.generate-documents');
    
    // Action Items Management
    Route::get('meeting/meetings/{meeting}/action-items', [ActionItemController::class, 'index'])->name('action-items.index')->middleware('permission:meeting.view');
    Route::post('meeting/meetings/{meeting}/action-items', [ActionItemController::class, 'store'])->name('action-items.store')->middleware('permission:meeting.edit');
    Route::put('meeting/meetings/{meeting}/action-items/{actionItem}', [ActionItemController::class, 'update'])->name('action-items.update')->middleware('permission:meeting.edit');
    Route::delete('meeting/meetings/{meeting}/action-items/{actionItem}', [ActionItemController::class, 'destroy'])->name('action-items.destroy')->middleware('permission:meeting.edit');
    Route::post('meeting/meetings/{meeting}/action-items/{actionItem}/complete', [ActionItemController::class, 'complete'])->name('action-items.complete')->middleware('permission:meeting.edit');
});

