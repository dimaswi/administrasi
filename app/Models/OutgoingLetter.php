<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class OutgoingLetter extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'template_id',
        'incoming_letter_id',
        'letter_number',
        'subject',
        'letter_date',
        'variable_values',
        'rendered_html',
        'pdf_path',
        'attachments',
        'status',
        'notes',
        'current_version',
        'revision_requested',
        'revision_request_notes',
        'revision_requested_by',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'variable_values' => 'array',
        'attachments' => 'array',
        'letter_date' => 'date',
        'revision_requested' => 'boolean',
        'created_by' => 'integer',
        'updated_by' => 'integer',
        'revision_requested_by' => 'integer',
    ];

    const STATUS_DRAFT = 'draft';
    const STATUS_PENDING = 'pending_approval';
    const STATUS_PARTIAL = 'partially_signed';
    const STATUS_SIGNED = 'fully_signed';
    const STATUS_REJECTED = 'rejected';
    const STATUS_REVISION = 'revision_requested';

    // Relationships
    public function template(): BelongsTo
    {
        return $this->belongsTo(DocumentTemplate::class, 'template_id');
    }

    public function incomingLetter(): BelongsTo
    {
        return $this->belongsTo(IncomingLetter::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function signatories(): HasMany
    {
        return $this->hasMany(LetterSignatory::class, 'letter_id')->orderBy('sign_order');
    }

    public function revisions(): HasMany
    {
        return $this->hasMany(LetterRevision::class, 'letter_id')->orderBy('version', 'desc');
    }

    public function revisionRequester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'revision_requested_by');
    }

    public function archive(): HasOne
    {
        return $this->hasOne(Archive::class, 'outgoing_letter_id');
    }

    // Scopes
    public function scopeDraft($query)
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    public function scopePending($query)
    {
        return $query->whereIn('status', [self::STATUS_PENDING, self::STATUS_PARTIAL]);
    }

    public function scopeFullySigned($query)
    {
        return $query->where('status', self::STATUS_SIGNED);
    }

    public function scopeAccessibleBy($query, User $user)
    {
        // User can see letters if:
        // 1. They are assigned as a signatory, OR
        // 2. The letter belongs to their organization unit
        return $query->where(function ($q) use ($user) {
            // Letters where user is a signatory
            $q->whereHas('signatories', function ($sq) use ($user) {
                $sq->where('user_id', $user->id);
            })
            // OR letters from their organization unit
            ->orWhereHas('template', function ($tq) use ($user) {
                $tq->where('organization_unit_id', $user->organization_unit_id);
            });
        });
    }

    /**
     * Check if letter can be edited
     */
    /**
     * Check if letter can be edited
     * Letter can be edited while not fully signed/rejected
     */
    public function canEdit(): bool
    {
        return !in_array($this->status, [self::STATUS_SIGNED, self::STATUS_REJECTED]);
    }

    /**
     * Check if letter is fully signed
     */
    public function isFullySigned(): bool
    {
        if ($this->signatories()->count() === 0) {
            return false;
        }
        
        return $this->signatories()
            ->where('status', '!=', 'approved')
            ->count() === 0;
    }

    /**
     * Get approval progress
     */
    public function getApprovalProgress(): array
    {
        $total = $this->signatories()->count();
        $approved = $this->signatories()->where('status', 'approved')->count();
        $pending = $this->signatories()->where('status', 'pending')->count();
        $rejected = $this->signatories()->where('status', 'rejected')->count();
        
        return [
            'total' => $total,
            'approved' => $approved,
            'pending' => $pending,
            'rejected' => $rejected,
            'percentage' => $total > 0 ? round(($approved / $total) * 100) : 0,
        ];
    }

    /**
     * Get next signatory in queue
     */
    public function getNextSignatory(): ?LetterSignatory
    {
        return $this->signatories()
            ->where('status', 'pending')
            ->orderBy('sign_order')
            ->first();
    }

    /**
     * Check if user can sign this letter
     */
    public function canBeSignedBy(User $user): bool
    {
        // Cannot sign if letter is in revision status
        if ($this->status === self::STATUS_REVISION || $this->revision_requested) {
            return false;
        }

        $signatory = $this->signatories()
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();
        
        if (!$signatory) {
            return false;
        }
        
        // Check if it's their turn (all previous signatories have signed)
        $pendingBefore = $this->signatories()
            ->where('sign_order', '<', $signatory->sign_order)
            ->where('status', 'pending')
            ->count();
        
        return $pendingBefore === 0;
    }

    /**
     * Generate letter number based on template format
     */
    public function generateLetterNumber(): string
    {
        $template = $this->template;
        $format = $template->numbering_format ?? '{no}/{kode}/{unit}/{bulan}/{tahun}';
        
        // Get current year and month (roman)
        $year = now()->format('Y');
        $romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
        $month = $romanMonths[now()->month - 1];
        
        // Get the numbering group ID (templates in same group share numbering)
        $numberingGroupId = $template->getNumberingGroupId();
        
        // Get all template IDs in the same numbering group
        $linkedTemplateIds = DocumentTemplate::where(function($query) use ($numberingGroupId) {
            $query->where('numbering_group_id', $numberingGroupId)
                  ->orWhere('id', $numberingGroupId);
        })->pluck('id')->toArray();
        
        // Get the next sequence number for this numbering group this year
        $lastNumber = self::whereIn('template_id', $linkedTemplateIds)
            ->whereYear('created_at', now()->year)
            ->whereNotNull('letter_number')
            ->count();
        $sequenceNumber = str_pad($lastNumber + 1, 3, '0', STR_PAD_LEFT);
        
        // Get organization unit code from the creator
        $creator = $this->creator;
        $unitCode = '';
        if ($creator && $creator->organizationUnit) {
            $unitCode = $creator->organizationUnit->code ?? '';
        }
        
        // Replace placeholders (case-insensitive)
        $replacements = [
            // Lowercase format (from builder)
            '{no}' => $sequenceNumber,
            '{kode}' => $template->code ?? 'OUT',
            '{unit}' => $unitCode,
            '{bulan}' => $month,
            '{tahun}' => $year,
            // Legacy uppercase format (backward compatibility)
            '{CODE}' => $template->code ?? 'OUT',
            '{NO}' => $sequenceNumber,
            '{MONTH}' => $month,
            '{YEAR}' => $year,
            '{UNIT}' => $unitCode,
        ];
        
        $number = str_replace(
            array_keys($replacements),
            array_values($replacements),
            $format
        );
        
        return $number;
    }

    /**
     * Update status based on signatories
     */
    public function updateStatusFromSignatories(): void
    {
        $progress = $this->getApprovalProgress();
        
        if ($progress['rejected'] > 0) {
            $this->update(['status' => self::STATUS_REJECTED]);
        } elseif ($progress['approved'] === $progress['total'] && $progress['total'] > 0) {
            $this->update(['status' => self::STATUS_SIGNED]);
        } elseif ($progress['approved'] > 0) {
            $this->update(['status' => self::STATUS_PARTIAL]);
        }
    }

    /**
     * Create initial revision snapshot
     */
    public function createInitialRevision(): LetterRevision
    {
        return $this->revisions()->create([
            'version' => 1,
            'type' => LetterRevision::TYPE_INITIAL,
            'variable_values' => $this->variable_values,
            'rendered_html' => $this->rendered_html,
            'pdf_path' => $this->pdf_path,
            'revision_notes' => 'Versi awal surat',
            'created_by' => $this->created_by,
        ]);
    }

    /**
     * Request revision from signatory
     */
    public function requestRevision(string $notes, int $requestedBy): void
    {
        // Create revision request record
        $this->revisions()->create([
            'version' => $this->current_version,
            'type' => LetterRevision::TYPE_REVISION_REQUEST,
            'variable_values' => $this->variable_values,
            'rendered_html' => $this->rendered_html,
            'pdf_path' => $this->pdf_path,
            'requested_changes' => $notes,
            'created_by' => $requestedBy,
        ]);

        // Update letter status
        $this->update([
            'status' => self::STATUS_REVISION,
            'revision_requested' => true,
            'revision_request_notes' => $notes,
            'revision_requested_by' => $requestedBy,
        ]);

        // Reset signatory statuses to pending
        $this->signatories()->update(['status' => LetterSignatory::STATUS_PENDING]);
    }

    /**
     * Submit revision
     */
    public function submitRevision(array $variableValues, ?string $notes = null): void
    {
        $newVersion = $this->current_version + 1;

        // Create revision submitted record
        $this->revisions()->create([
            'version' => $newVersion,
            'type' => LetterRevision::TYPE_REVISION_SUBMITTED,
            'variable_values' => $variableValues,
            'revision_notes' => $notes ?? 'Revisi telah disubmit',
            'created_by' => auth()->id(),
        ]);

        // Update letter
        $this->update([
            'variable_values' => $variableValues,
            'current_version' => $newVersion,
            'status' => self::STATUS_PENDING,
            'revision_requested' => false,
            'revision_request_notes' => null,
            'revision_requested_by' => null,
            'updated_by' => auth()->id(),
        ]);
    }

    /**
     * Check if revision is requested
     */
    public function hasRevisionRequest(): bool
    {
        return $this->revision_requested === true;
    }

    /**
     * Check if letter can be revised (only by creator when revision requested)
     */
    public function canRevise(): bool
    {
        return $this->revision_requested && 
               (int) $this->created_by === (int) auth()->id();
    }

    /**
     * Get latest revision
     */
    public function getLatestRevision(): ?LetterRevision
    {
        return $this->revisions()->latest('version')->first();
    }
}
