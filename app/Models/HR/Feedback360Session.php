<?php

namespace App\Models\HR;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Feedback360Session extends Model
{
    protected $fillable = [
        'period_id',
        'name',
        'description',
        'status',
        'start_date',
        'end_date',
        'is_anonymous',
        'min_reviewers',
        'created_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_anonymous' => 'boolean',
    ];

    public const STATUSES = [
        'draft' => 'Draft',
        'in_progress' => 'Sedang Berjalan',
        'completed' => 'Selesai',
        'cancelled' => 'Dibatalkan',
    ];

    public const RELATIONSHIPS = [
        'self' => 'Diri Sendiri',
        'supervisor' => 'Atasan',
        'peer' => 'Rekan Sejawat',
        'subordinate' => 'Bawahan',
        'external' => 'Eksternal',
    ];

    public const QUESTION_CATEGORIES = [
        'leadership' => 'Kepemimpinan',
        'communication' => 'Komunikasi',
        'teamwork' => 'Kerja Tim',
        'problem_solving' => 'Pemecahan Masalah',
        'technical' => 'Kemampuan Teknis',
        'professionalism' => 'Profesionalisme',
        'innovation' => 'Inovasi',
        'customer_focus' => 'Fokus Pelanggan',
    ];

    // Accessors
    public function getStatusLabelAttribute(): string
    {
        return self::STATUSES[$this->status] ?? $this->status;
    }

    public function getIsActiveAttribute(): bool
    {
        return $this->status === 'in_progress' 
            && $this->start_date <= now() 
            && $this->end_date >= now();
    }

    // Relationships
    public function period(): BelongsTo
    {
        return $this->belongsTo(PerformancePeriod::class, 'period_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function participants(): HasMany
    {
        return $this->hasMany(Feedback360Participant::class, 'session_id');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Feedback360Question::class, 'session_id')->orderBy('category')->orderBy('order');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'in_progress')
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now());
    }

    // Helper methods
    public function getProgress(): array
    {
        $total = $this->participants()->count();
        $completed = $this->participants()->where('status', 'completed')->count();
        $percentage = $total > 0 ? round(($completed / $total) * 100) : 0;

        return [
            'total' => $total,
            'completed' => $completed,
            'percentage' => $percentage,
        ];
    }
}
