<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Feedback360Response extends Model
{
    protected $fillable = [
        'reviewer_id',
        'question_id',
        'score',
        'answer',
        'boolean_answer',
    ];

    protected $casts = [
        'score' => 'decimal:2',
        'boolean_answer' => 'boolean',
    ];

    // Relationships
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(Feedback360Reviewer::class, 'reviewer_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Feedback360Question::class, 'question_id');
    }
}
