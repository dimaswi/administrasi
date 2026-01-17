<?php

use App\Http\Controllers\AnnouncementController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->prefix('hr')->group(function () {
    Route::get('/announcements', [AnnouncementController::class, 'index'])->name('hr.announcements.index');
    Route::get('/announcements/create', [AnnouncementController::class, 'create'])->name('hr.announcements.create');
    Route::post('/announcements', [AnnouncementController::class, 'store'])->name('hr.announcements.store');
    Route::get('/announcements/{announcement}', [AnnouncementController::class, 'show'])->name('hr.announcements.show');
    Route::post('/announcements/{announcement}/mark-as-read', [AnnouncementController::class, 'markAsRead'])->name('hr.announcements.mark-as-read');

    // FCM Token Management
    Route::post('/fcm/register-token', [AnnouncementController::class, 'registerToken'])->name('hr.fcm.register-token');
    Route::post('/fcm/unregister-token', [AnnouncementController::class, 'unregisterToken'])->name('hr.fcm.unregister-token');
});
