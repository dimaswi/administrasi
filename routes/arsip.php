<?php

use App\Http\Controllers\Arsip\DocumentTemplateController;
use App\Http\Controllers\Arsip\OutgoingLetterController;
use App\Http\Controllers\Arsip\IncomingLetterController;
use App\Http\Controllers\Arsip\DispositionController;
use App\Http\Controllers\Arsip\ArchiveController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Arsip Routes
|--------------------------------------------------------------------------
|
| Routes for document management system (letters and archives)
|
*/

Route::middleware(['auth'])->prefix('arsip')->name('arsip.')->group(function () {

    // Document Template Management
    Route::prefix('document-templates')->name('document-templates.')->group(function () {
        Route::get('/', [DocumentTemplateController::class, 'index'])->name('index');
        Route::get('/create', [DocumentTemplateController::class, 'create'])->name('create');
        Route::post('/', [DocumentTemplateController::class, 'store'])->name('store');
        Route::get('/{documentTemplate}', [DocumentTemplateController::class, 'show'])->name('show');
        Route::get('/{documentTemplate}/edit', [DocumentTemplateController::class, 'edit'])->name('edit');
        Route::put('/{documentTemplate}', [DocumentTemplateController::class, 'update'])->name('update');
        Route::delete('/{documentTemplate}', [DocumentTemplateController::class, 'destroy'])->name('destroy');
        Route::post('/{documentTemplate}/toggle-active', [DocumentTemplateController::class, 'toggleActive'])->name('toggle-active');
        Route::get('/{documentTemplate}/duplicate', [DocumentTemplateController::class, 'duplicateForm'])->name('duplicate-form');
        Route::post('/{documentTemplate}/duplicate', [DocumentTemplateController::class, 'duplicate'])->name('duplicate');
        Route::post('/{documentTemplate}/upload-logo', [DocumentTemplateController::class, 'uploadLogo'])->name('upload-logo');
        Route::get('/{documentTemplate}/preview', [DocumentTemplateController::class, 'preview'])->name('preview');
    });

    // Outgoing Letter Management
    Route::prefix('outgoing-letters')->name('outgoing-letters.')->group(function () {
        Route::get('/', [OutgoingLetterController::class, 'index'])->name('index');
        Route::get('/create', [OutgoingLetterController::class, 'create'])->name('create');
        Route::post('/', [OutgoingLetterController::class, 'store'])->name('store');
        Route::get('/approvals', [OutgoingLetterController::class, 'pendingApprovals'])->name('approvals');
        Route::get('/{outgoingLetter}', [OutgoingLetterController::class, 'show'])->name('show');
        Route::get('/{outgoingLetter}/edit', [OutgoingLetterController::class, 'edit'])->name('edit');
        Route::put('/{outgoingLetter}', [OutgoingLetterController::class, 'update'])->name('update');
        Route::delete('/{outgoingLetter}', [OutgoingLetterController::class, 'destroy'])->name('destroy');
        Route::post('/{outgoingLetter}/sign', [OutgoingLetterController::class, 'sign'])->name('sign');
        Route::post('/{outgoingLetter}/reject', [OutgoingLetterController::class, 'reject'])->name('reject');
        Route::get('/{outgoingLetter}/preview', [OutgoingLetterController::class, 'preview'])->name('preview');
        Route::get('/{outgoingLetter}/download-pdf', [OutgoingLetterController::class, 'downloadPdf'])->name('download-pdf');
        
        // Revision routes
        Route::post('/{outgoingLetter}/request-revision', [OutgoingLetterController::class, 'requestRevision'])->name('request-revision');
        Route::get('/{outgoingLetter}/revision', [OutgoingLetterController::class, 'revisionForm'])->name('revision-form');
        Route::post('/{outgoingLetter}/submit-revision', [OutgoingLetterController::class, 'submitRevision'])->name('submit-revision');
    });

    // Incoming Letter Management
    Route::prefix('incoming-letters')->name('incoming-letters.')->group(function () {
        Route::get('/', [IncomingLetterController::class, 'index'])->name('index');
        Route::get('/create', [IncomingLetterController::class, 'create'])->name('create');
        Route::post('/', [IncomingLetterController::class, 'store'])->name('store');
        Route::get('/{incomingLetter}', [IncomingLetterController::class, 'show'])->name('show');
        Route::get('/{incomingLetter}/edit', [IncomingLetterController::class, 'edit'])->name('edit');
        Route::put('/{incomingLetter}', [IncomingLetterController::class, 'update'])->name('update');
        Route::delete('/{incomingLetter}', [IncomingLetterController::class, 'destroy'])->name('destroy');
        Route::get('/{incomingLetter}/download', [IncomingLetterController::class, 'download'])->name('download');
        Route::get('/{incomingLetter}/preview', [IncomingLetterController::class, 'preview'])->name('preview');
    });

    // Disposition Management
    Route::prefix('dispositions')->name('dispositions.')->group(function () {
        Route::get('/', [DispositionController::class, 'index'])->name('index');
        Route::get('/create', [DispositionController::class, 'create'])->name('create');
        Route::post('/', [DispositionController::class, 'store'])->name('store');
        Route::get('/{disposition}', [DispositionController::class, 'show'])->name('show');
        Route::post('/{disposition}/mark-in-progress', [DispositionController::class, 'markInProgress'])->name('mark-in-progress');
        Route::post('/{disposition}/mark-completed', [DispositionController::class, 'markCompleted'])->name('mark-completed');
        Route::post('/{disposition}/follow-up', [DispositionController::class, 'storeFollowUp'])->name('follow-up');
        Route::delete('/{disposition}', [DispositionController::class, 'destroy'])->name('destroy');
    });

    // Archive Management
    Route::prefix('archives')->name('archives.')->group(function () {
        Route::get('/', [ArchiveController::class, 'index'])->name('index')->middleware('permission:archive.view');
        Route::get('/create', [ArchiveController::class, 'create'])->name('create')->middleware('permission:archive.create');
        Route::post('/', [ArchiveController::class, 'store'])->name('store')->middleware('permission:archive.create');
        Route::get('/expiring', [ArchiveController::class, 'expiring'])->name('expiring')->middleware('permission:archive.view');
        
        // Archive incoming letter
        Route::post('/incoming-letters/{incomingLetter}/archive', [ArchiveController::class, 'archiveIncomingLetter'])->name('archive-incoming-letter')->middleware('permission:archive.create');
        
        // Archive outgoing letter
        Route::post('/outgoing-letters/{outgoingLetter}/archive', [ArchiveController::class, 'archiveOutgoingLetter'])->name('archive-outgoing-letter')->middleware('permission:archive.create');
        
        // Download dan Preview harus sebelum {archive} show
        Route::get('/{archive}/download', [ArchiveController::class, 'download'])->name('download')->middleware('permission:archive.download');
        Route::get('/{archive}/preview', [ArchiveController::class, 'preview'])->name('preview')->middleware('permission:archive.view');
        Route::get('/{archive}/edit', [ArchiveController::class, 'edit'])->name('edit')->middleware('permission:archive.edit');
        Route::get('/{archive}', [ArchiveController::class, 'show'])->name('show')->middleware('permission:archive.view');
        Route::put('/{archive}', [ArchiveController::class, 'update'])->name('update')->middleware('permission:archive.edit');
        Route::delete('/{archive}', [ArchiveController::class, 'destroy'])->name('destroy')->middleware('permission:archive.delete');
    });
});
