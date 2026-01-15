<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Feedback360Comment extends Model
{
    protected $fillable = [
        'reviewer_id',
        'strengths',
        'improvements',
        'additional_comments',
    ];

    // Relationships
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(Feedback360Reviewer::class, 'reviewer_id');
    }
}
