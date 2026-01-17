<?php

use App\Http\Controllers\Settings\CompanySettingsController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\RoomController;
use App\Http\Controllers\Settings\SystemLogController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('password.edit');
    Route::put('settings/password', [PasswordController::class, 'update'])->name('password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance');

    // Company Settings
    Route::get('settings/company', [CompanySettingsController::class, 'index'])->name('settings.company');
    Route::patch('settings/company', [CompanySettingsController::class, 'update'])->name('settings.company.update');
    Route::post('settings/company/logo', [CompanySettingsController::class, 'uploadLogo'])->name('settings.company.logo');

    // System Logs
    Route::get('settings/system-logs', [SystemLogController::class, 'index'])->name('settings.system-logs');
    Route::post('settings/system-logs/clear', [SystemLogController::class, 'clear'])->name('settings.system-logs.clear');

    // Organization Unit Management moved to hr.php
    // See routes/hr.php for Organization management

    // Room Management
    Route::get('master/rooms', [RoomController::class, 'index'])->name('rooms.index')->middleware('permission:room.view');
    Route::get('master/rooms/create', [RoomController::class, 'create'])->name('rooms.create')->middleware('permission:room.create');
    Route::post('master/rooms', [RoomController::class, 'store'])->name('rooms.store')->middleware('permission:room.create');
    Route::get('master/rooms/{room}/edit', [RoomController::class, 'edit'])->name('rooms.edit')->middleware('permission:room.edit');
    Route::get('master/rooms/{room}', [RoomController::class, 'show'])->name('rooms.show')->middleware('permission:room.view');
    Route::put('master/rooms/{room}', [RoomController::class, 'update'])->name('rooms.update')->middleware('permission:room.edit');
    Route::delete('master/rooms/{room}', [RoomController::class, 'destroy'])->name('rooms.destroy')->middleware('permission:room.delete');
    Route::post('master/rooms/check-availability', [RoomController::class, 'checkAvailability'])->name('rooms.check-availability');
});
