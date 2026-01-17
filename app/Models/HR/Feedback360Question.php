<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Feedback360Question extends Model
{
    protected $fillable = [
        'session_id',
        'category',
        'question',
        'description',
        'type',
        'weight',
        'order',
        'is_required',
    ];

    protected $casts = [
        'is_required' => 'boolean',
    ];

    public const TYPES = [
        'rating' => 'Rating (1-5)',
        'text' => 'Teks Bebas',
        'yes_no' => 'Ya/Tidak',
    ];

    // Accessors
    public function getCategoryLabelAttribute(): string
    {
        return Feedback360Session::QUESTION_CATEGORIES[$this->category] ?? $this->category;
    }

    public function getTypeLabelAttribute(): string
    {
        return self::TYPES[$this->type] ?? $this->type;
    }

    // Relationships
    public function session(): BelongsTo
    {
        return $this->belongsTo(Feedback360Session::class, 'session_id');
    }

    public function responses(): HasMany
    {
        return $this->hasMany(Feedback360Response::class, 'question_id');
    }
}
