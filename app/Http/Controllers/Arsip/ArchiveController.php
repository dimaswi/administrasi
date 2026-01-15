<?php

namespace App\Http\Controllers\Arsip;

use App\Http\Controllers\Controller;
use App\Models\Archive;
use App\Models\IncomingLetter;
use App\Models\OutgoingLetter;
use App\Services\CacheService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ArchiveController extends Controller
{
    /**
     * Display a listing of archives
     */
    public function index(Request $request)
    {
        $query = Archive::with(['incomingLetter', 'outgoingLetter', 'archiver'])
            ->orderBy('document_date', 'desc');

        // Filter by type
        if ($request->has('type') && $request->type) {
            $query->where('type', $request->type);
        }

        // Filter by category
        if ($request->has('category') && $request->category) {
            $query->where('category', $request->category);
        }

        // Filter by document type
        if ($request->has('document_type') && $request->document_type) {
            $query->where('document_type', $request->document_type);
        }

        // Filter by classification
        if ($request->has('classification') && $request->classification) {
            $query->where('classification', $request->classification);
        }

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->whereFullText(['title', 'description', 'document_number'], $search);
        }

        // Filter by date range
        if ($request->has('date_from') && $request->date_from) {
            $query->where('document_date', '>=', $request->date_from);
        }
        if ($request->has('date_to') && $request->date_to) {
            $query->where('document_date', '<=', $request->date_to);
        }

        $perPage = $request->input('per_page', 15);
        $archives = $query->paginate($perPage)->withQueryString();

        // Get unique values for filters
        $categories = Archive::select('category')->distinct()->whereNotNull('category')->pluck('category');
        $documentTypes = Archive::select('document_type')->distinct()->whereNotNull('document_type')->pluck('document_type');

        return Inertia::render('arsip/archives/index', [
            'archives' => $archives,
            'categories' => $categories,
            'documentTypes' => $documentTypes,
            'filters' => $request->only(['type', 'category', 'document_type', 'classification', 'search', 'date_from', 'date_to', 'per_page']),
        ]);
    }

    /**
     * Show the form for creating a new archive (document upload)
     */
    public function create()
    {
        return Inertia::render('arsip/archives/create');
    }

    /**
     * Store a newly created archive
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'document_number' => 'nullable|string|max:255',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:255',
            'document_date' => 'required|date',
            'document_type' => 'nullable|string|max:255',
            'file' => 'required|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
            'sender' => 'nullable|string|max:255',
            'recipient' => 'nullable|string|max:255',
            'classification' => 'required|in:public,internal,confidential,secret',
            'retention_period' => 'nullable|integer|min:1',
            'tags' => 'nullable|array',
        ]);

        // Upload file
        $file = $request->file('file');
        $filename = time() . '_' . $file->getClientOriginalName();
        $path = $file->storeAs('archives', $filename, 'public');

        // Calculate retention until date
        $retentionUntil = null;
        $retentionPeriod = !empty($validated['retention_period']) ? (int)$validated['retention_period'] : null;
        
        if ($retentionPeriod && $retentionPeriod > 0) {
            $retentionUntil = now()->addYears($retentionPeriod);
        }

        $archive = Archive::create([
            'type' => 'document',
            'document_number' => $validated['document_number'],
            'title' => $validated['title'],
            'description' => $validated['description'],
            'category' => $validated['category'],
            'document_date' => $validated['document_date'],
            'document_type' => $validated['document_type'],
            'file_path' => $path,
            'file_type' => $file->getClientOriginalExtension(),
            'file_size' => $file->getSize(),
            'sender' => $validated['sender'],
            'recipient' => $validated['recipient'],
            'classification' => $validated['classification'],
            'retention_period' => $retentionPeriod,
            'retention_until' => $retentionUntil,
            'tags' => $validated['tags'] ?? [],
            'archived_by' => Auth::id(),
        ]);

        // Clear related cache
        CacheService::clearArchiveCache();

        return redirect()->route('arsip.archives.show', $archive)
            ->with('success', 'Dokumen berhasil diarsipkan');
    }

    /**
     * Display the specified archive
     */
    public function show(Archive $archive)
    {
        $archive->load(['incomingLetter', 'outgoingLetter', 'archiver']);

        return Inertia::render('arsip/archives/show', [
            'archive' => $archive,
        ]);
    }

    /**
     * Show the form for editing the specified archive
     */
    public function edit(Archive $archive)
    {
        return Inertia::render('arsip/archives/edit', [
            'archive' => $archive,
        ]);
    }

    /**
     * Update the specified archive
     */
    public function update(Request $request, Archive $archive)
    {
        $validated = $request->validate([
            'document_number' => 'nullable|string|max:255',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:255',
            'document_date' => 'required|date',
            'document_type' => 'nullable|string|max:255',
            'file' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
            'sender' => 'nullable|string|max:255',
            'recipient' => 'nullable|string|max:255',
            'classification' => 'required|in:public,internal,confidential,secret',
            'retention_period' => 'nullable|integer|min:1',
            'tags' => 'nullable|array',
        ]);

        // Handle file upload if new file is provided
        if ($request->hasFile('file')) {
            // Delete old file
            Storage::disk('public')->delete($archive->file_path);

            // Upload new file
            $file = $request->file('file');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('archives', $filename, 'public');

            $validated['file_path'] = $path;
            $validated['file_type'] = $file->getClientOriginalExtension();
            $validated['file_size'] = $file->getSize();
        }

        // Calculate retention until date
        $retentionPeriod = !empty($validated['retention_period']) ? (int)$validated['retention_period'] : null;
        
        if ($retentionPeriod && $retentionPeriod > 0) {
            $validated['retention_until'] = now()->addYears($retentionPeriod);
            $validated['retention_period'] = $retentionPeriod;
        } else {
            $validated['retention_until'] = null;
            $validated['retention_period'] = null;
        }

        $archive->update($validated);

        // Clear related cache
        CacheService::clearArchiveCache($archive->id);

        return redirect()->route('arsip.archives.show', $archive)
            ->with('success', 'Arsip berhasil diperbarui');
    }

    /**
     * Remove the specified archive
     */
    public function destroy(Archive $archive)
    {
        // Delete file only if it exists and is not an outgoing letter
        if ($archive->file_path && $archive->type !== 'outgoing_letter') {
            Storage::disk('public')->delete($archive->file_path);
        }

        $archive->delete();

        // Clear related cache
        CacheService::clearArchiveCache($archive->id);

        return redirect()->route('arsip.archives.index')
            ->with('success', 'Arsip berhasil dihapus');
    }

    /**
     * Preview archive - for outgoing letters, show the letter preview
     */
    public function preview(Archive $archive)
    {
        // For outgoing letter archives, show the letter preview
        if ($archive->type === 'outgoing_letter' && $archive->outgoingLetter) {
            $archive->load('archiver');
            $outgoingLetter = $archive->outgoingLetter;
            $outgoingLetter->load(['template', 'signatories.user', 'creator']);

            return Inertia::render('arsip/archives/preview-letter', [
                'archive' => $archive,
                'letter' => $outgoingLetter,
                'paper_sizes' => \App\Models\DocumentTemplate::paperSizes(),
            ]);
        }

        // For other archives, redirect to show page
        return redirect()->route('arsip.archives.show', $archive);
    }

    /**
     * Download archive file
     */
    public function download(Archive $archive)
    {
        // For outgoing letter archives, redirect to preview/print page
        // because we don't store PDF files on server (using browser print for accurate output)
        if ($archive->type === 'outgoing_letter' && $archive->outgoingLetter) {
            return redirect()->route('arsip.archives.preview', $archive);
        }

        // For other archives, download from storage
        if (!$archive->file_path) {
            return back()->with('error', 'File tidak ditemukan');
        }

        $path = storage_path('app/public/' . $archive->file_path);

        if (!file_exists($path)) {
            return back()->with('error', 'File tidak ditemukan');
        }

        return response()->download($path, $archive->title . '.' . $archive->file_type);
    }

    /**
     * Archive an incoming letter
     */
    public function archiveIncomingLetter(IncomingLetter $incomingLetter)
    {
        // Check if letter can be archived (should be completed)
        if ($incomingLetter->status !== 'completed') {
            return back()->with('error', 'Hanya surat yang sudah selesai diproses yang dapat diarsipkan');
        }

        if ($incomingLetter->archive()->exists()) {
            return back()->with('error', 'Surat masuk sudah diarsipkan');
        }

        // Determine file path
        $filePath = $incomingLetter->file_path;
        if (!$filePath) {
            return back()->with('error', 'Surat masuk tidak memiliki file yang dapat diarsipkan');
        }

        // Map classification from incoming letter to archive
        $classificationMap = [
            'biasa' => 'public',
            'penting' => 'internal',
            'segera' => 'internal',
            'rahasia' => 'confidential',
        ];

        $archive = Archive::create([
            'type' => 'incoming_letter',
            'incoming_letter_id' => $incomingLetter->id,
            'document_number' => $incomingLetter->incoming_number,
            'title' => $incomingLetter->subject,
            'description' => 'Arsip surat masuk dari ' . $incomingLetter->sender . ' - Nomor: ' . $incomingLetter->original_number,
            'category' => $incomingLetter->category,
            'document_date' => $incomingLetter->received_date,
            'document_type' => $incomingLetter->category,
            'file_path' => $filePath,
            'file_type' => pathinfo($filePath, PATHINFO_EXTENSION),
            'file_size' => Storage::disk('public')->exists($filePath) ? Storage::disk('public')->size($filePath) : null,
            'sender' => $incomingLetter->sender,
            'classification' => $classificationMap[$incomingLetter->classification] ?? 'internal',
            'archived_by' => Auth::id(),
        ]);

        // Update incoming letter status to archived
        $incomingLetter->update(['status' => 'archived']);

        return back()->with('success', 'Surat masuk berhasil diarsipkan');
    }

    /**
     * Archive an outgoing letter
     */
    public function archiveOutgoingLetter(Request $request, OutgoingLetter $outgoingLetter)
    {
        // Check if letter can be archived (should be fully signed)
        if ($outgoingLetter->status !== 'fully_signed') {
            return back()->with('error', 'Hanya surat yang sudah selesai ditandatangani yang dapat diarsipkan');
        }

        if ($outgoingLetter->archive()->exists()) {
            return back()->with('error', 'Surat keluar sudah diarsipkan');
        }

        $request->validate([
            'category' => 'required|string|max:255',
            'classification' => 'required|in:public,internal,confidential,secret',
            'retention_period' => 'nullable|integer|min:1|max:100',
        ]);

        // Create archive
        $archive = Archive::create([
            'type' => 'outgoing_letter',
            'outgoing_letter_id' => $outgoingLetter->id,
            'document_number' => $outgoingLetter->letter_number,
            'title' => $outgoingLetter->subject,
            'description' => 'Arsip surat keluar - Template: ' . ($outgoingLetter->template->name ?? 'Unknown'),
            'category' => $request->category,
            'document_date' => $outgoingLetter->letter_date,
            'document_type' => 'Surat Keluar',
            'file_path' => $outgoingLetter->pdf_path,
            'file_type' => 'pdf',
            'file_size' => $outgoingLetter->pdf_path && Storage::disk('public')->exists($outgoingLetter->pdf_path) 
                ? Storage::disk('public')->size($outgoingLetter->pdf_path) 
                : null,
            'classification' => $request->classification,
            'retention_period' => $request->retention_period,
            'retention_until' => $request->retention_period 
                ? now()->addYears($request->retention_period) 
                : null,
            'archived_by' => Auth::id(),
        ]);

        return back()->with('success', 'Surat keluar berhasil diarsipkan');
    }

    /**
     * Get expiring archives
     */
    public function expiring()
    {
        $archives = Archive::expiringSoon(30)
            ->with(['incomingLetter', 'outgoingLetter', 'archiver'])
            ->orderBy('retention_until')
            ->paginate(15);

        return Inertia::render('arsip/archives/expiring', [
            'archives' => $archives,
        ]);
    }
}
