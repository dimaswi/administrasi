<?php

use App\Http\Controllers\Settings\OrganizationUnitController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\RoomController;
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

    // Organization Unit Management
    Route::get('master/organizations', [OrganizationUnitController::class, 'index'])->name('organizations.index')->middleware('permission:organization.view');
    Route::get('master/organizations/create', [OrganizationUnitController::class, 'create'])->name('organizations.create')->middleware('permission:organization.create');
    Route::post('master/organizations', [OrganizationUnitController::class, 'store'])->name('organizations.store')->middleware('permission:organization.create');
    Route::get('master/organizations/{organization}/edit', [OrganizationUnitController::class, 'edit'])->name('organizations.edit')->middleware('permission:organization.edit');
    Route::get('master/organizations/{organization}', [OrganizationUnitController::class, 'show'])->name('organizations.show')->middleware('permission:organization.view');
    Route::put('master/organizations/{organization}', [OrganizationUnitController::class, 'update'])->name('organizations.update')->middleware('permission:organization.edit');
    Route::delete('master/organizations/{organization}', [OrganizationUnitController::class, 'destroy'])->name('organizations.destroy')->middleware('permission:organization.delete');

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
