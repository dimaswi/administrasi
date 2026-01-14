<?php

namespace App\Models\HR;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CalibrationComment extends Model
{
    protected $fillable = [
        'calibration_review_id',
        'user_id',
        'comment',
    ];

    // Relationships
    public function calibrationReview(): BelongsTo
    {
        return $this->belongsTo(CalibrationReview::class, 'calibration_review_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
