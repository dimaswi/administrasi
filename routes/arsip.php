<?php

use App\Http\Controllers\Arsip\TemplateController;
use App\Http\Controllers\Arsip\LetterController;
use App\Http\Controllers\Arsip\IncomingLetterController;
use App\Http\Controllers\Arsip\DispositionController;
use App\Http\Controllers\Arsip\CertificateController;
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
    
    // Template Management
    Route::prefix('templates')->name('templates.')->group(function () {
        Route::get('/', [TemplateController::class, 'index'])->name('index');
        Route::get('/create', [TemplateController::class, 'create'])->name('create');
        Route::post('/', [TemplateController::class, 'store'])->name('store');
        Route::get('/{template}', [TemplateController::class, 'show'])->name('show');
        Route::get('/{template}/edit', [TemplateController::class, 'edit'])->name('edit');
        Route::put('/{template}', [TemplateController::class, 'update'])->name('update');
        Route::delete('/{template}', [TemplateController::class, 'destroy'])->name('destroy');
        Route::post('/{template}/toggle-active', [TemplateController::class, 'toggleActive'])->name('toggle-active');
        Route::post('/{template}/duplicate', [TemplateController::class, 'duplicate'])->name('duplicate');
        
        // Share template to other organizations
        Route::get('/{template}/share', [TemplateController::class, 'showShareForm'])->name('share-form');
        Route::post('/{template}/share', [TemplateController::class, 'shareToOrganizations'])->name('share');
    });

    // Letter Management
    Route::prefix('letters')->name('letters.')->group(function () {
        Route::get('/', [LetterController::class, 'index'])->name('index');
        Route::get('/create', [LetterController::class, 'create'])->name('create');
        Route::post('/', [LetterController::class, 'store'])->name('store');
        
        // Pending approvals for current user
        Route::get('/approvals/pending', [LetterController::class, 'pendingApprovals'])->name('approvals.pending');
        
        Route::get('/{letter}', [LetterController::class, 'show'])->name('show');
        Route::get('/{letter}/edit', [LetterController::class, 'edit'])->name('edit');
        Route::put('/{letter}', [LetterController::class, 'update'])->name('update');
        Route::delete('/{letter}', [LetterController::class, 'destroy'])->name('destroy');
        Route::post('/{letter}/submit-for-approval', [LetterController::class, 'submitForApproval'])->name('submit-for-approval');
        Route::post('/{letter}/cancel-approval', [LetterController::class, 'cancelApproval'])->name('cancel-approval');
        
        // Letter approval actions (new multi-signature system)
        Route::post('/{letter}/approve-by-user', [LetterController::class, 'approveByUser'])->name('approve-by-user');
        Route::post('/{letter}/reject-by-user', [LetterController::class, 'rejectByUser'])->name('reject-by-user');
        Route::post('/{letter}/revoke-approval', [LetterController::class, 'revokeApproval'])->name('revoke-approval');
        
        // Legacy approval actions (keeping for backward compatibility)
        Route::post('/{letter}/approve', [LetterController::class, 'approve'])->name('approve');
        Route::post('/{letter}/reject', [LetterController::class, 'reject'])->name('reject');
        
        // PDF actions
        Route::get('/{letter}/download-pdf', [LetterController::class, 'downloadPDF'])->name('download-pdf');
        Route::post('/{letter}/regenerate-pdf', [LetterController::class, 'regeneratePDF'])->name('regenerate-pdf');
        
        // Other actions
        Route::post('/preview', [LetterController::class, 'preview'])->name('preview');
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

    // Certificate Management
    Route::prefix('certificates')->name('certificates.')->group(function () {
        Route::post('/{certificate}/revoke', [CertificateController::class, 'revoke'])->name('revoke');
        Route::get('/{certificate}/download-qr', [CertificateController::class, 'downloadQRCode'])->name('download-qr');
    });

    // Archive Management
    Route::prefix('archives')->name('archives.')->group(function () {
        Route::get('/', [ArchiveController::class, 'index'])->name('index')->middleware('permission:archive.view');
        Route::get('/create', [ArchiveController::class, 'create'])->name('create')->middleware('permission:archive.create');
        Route::post('/', [ArchiveController::class, 'store'])->name('store')->middleware('permission:archive.create');
        Route::get('/expiring', [ArchiveController::class, 'expiring'])->name('expiring')->middleware('permission:archive.view');
        
        // Archive letter (outgoing)
        Route::post('/letters/{letter}/archive', [ArchiveController::class, 'archiveLetter'])->name('archive-letter')->middleware('permission:archive.create');
        
        // Archive incoming letter
        Route::post('/incoming-letters/{incomingLetter}/archive', [ArchiveController::class, 'archiveIncomingLetter'])->name('archive-incoming-letter')->middleware('permission:archive.create');
        
        // Download harus sebelum {archive} show
        Route::get('/{archive}/download', [ArchiveController::class, 'download'])->name('download')->middleware('permission:archive.download');
        Route::get('/{archive}/edit', [ArchiveController::class, 'edit'])->name('edit')->middleware('permission:archive.edit');
        Route::get('/{archive}', [ArchiveController::class, 'show'])->name('show')->middleware('permission:archive.view');
        Route::put('/{archive}', [ArchiveController::class, 'update'])->name('update')->middleware('permission:archive.edit');
        Route::delete('/{archive}', [ArchiveController::class, 'destroy'])->name('destroy')->middleware('permission:archive.delete');
    });
});

// Public routes (no auth required)
Route::get('/verify/{id}', [CertificateController::class, 'verify'])->name('verify.certificate');
Route::get('/verify-signature/{certificate}/{approval}', [CertificateController::class, 'verifySignature'])->name('verify.signature');
