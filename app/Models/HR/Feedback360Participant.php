<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Feedback360Participant extends Model
{
    protected $fillable = [
        'session_id',
        'employee_id',
        'status',
        'average_score',
        'total_feedbacks',
    ];

    protected $casts = [
        'average_score' => 'decimal:2',
    ];

    public const STATUSES = [
        'pending' => 'Menunggu',
        'in_progress' => 'Sedang Berjalan',
        'completed' => 'Selesai',
    ];

    // Accessors
    public function getStatusLabelAttribute(): string
    {
        return self::STATUSES[$this->status] ?? $this->status;
    }

    // Relationships
    public function session(): BelongsTo
    {
        return $this->belongsTo(Feedback360Session::class, 'session_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function reviewers(): HasMany
    {
        return $this->hasMany(Feedback360Reviewer::class, 'participant_id');
    }

    // Helper methods
    public function calculateAverageScore(): void
    {
        $completedReviewers = $this->reviewers()->where('status', 'completed')->get();
        
        if ($completedReviewers->isEmpty()) {
            $this->average_score = null;
            $this->total_feedbacks = 0;
            $this->save();
            return;
        }

        $totalScore = 0;
        $totalCount = 0;

        foreach ($completedReviewers as $reviewer) {
            $responses = $reviewer->responses()->whereNotNull('score')->get();
            if ($responses->isNotEmpty()) {
                $totalScore += $responses->avg('score');
                $totalCount++;
            }
        }

        $this->average_score = $totalCount > 0 ? $totalScore / $totalCount : null;
        $this->total_feedbacks = $completedReviewers->count();
        $this->save();

        // Update participant status if all reviewers completed
        $pendingReviewers = $this->reviewers()
            ->whereIn('status', ['pending', 'in_progress'])
            ->count();
        
        if ($pendingReviewers === 0 && $this->total_feedbacks >= $this->session->min_reviewers) {
            $this->status = 'completed';
            $this->save();
        }
    }

    public function getScoresByCategory(): array
    {
        $completedReviewers = $this->reviewers()
            ->where('status', 'completed')
            ->with('responses.question')
            ->get();

        $categoryScores = [];
        
        foreach ($completedReviewers as $reviewer) {
            foreach ($reviewer->responses as $response) {
                if ($response->score === null) continue;
                
                $category = $response->question->category;
                if (!isset($categoryScores[$category])) {
                    $categoryScores[$category] = ['total' => 0, 'count' => 0];
                }
                $categoryScores[$category]['total'] += $response->score;
                $categoryScores[$category]['count']++;
            }
        }

        return collect($categoryScores)->map(function ($data, $category) {
            return [
                'category' => $category,
                'category_label' => Feedback360Session::QUESTION_CATEGORIES[$category] ?? $category,
                'average' => $data['count'] > 0 ? round($data['total'] / $data['count'], 2) : 0,
                'count' => $data['count'],
            ];
        })->values()->toArray();
    }

    public function getScoresByRelationship(): array
    {
        $completedReviewers = $this->reviewers()
            ->where('status', 'completed')
            ->with('responses')
            ->get();

        $relationshipScores = [];
        
        foreach ($completedReviewers as $reviewer) {
            $relationship = $reviewer->relationship;
            $avgScore = $reviewer->responses()->whereNotNull('score')->avg('score');
            
            if ($avgScore === null) continue;
            
            if (!isset($relationshipScores[$relationship])) {
                $relationshipScores[$relationship] = ['total' => 0, 'count' => 0];
            }
            $relationshipScores[$relationship]['total'] += $avgScore;
            $relationshipScores[$relationship]['count']++;
        }

        return collect($relationshipScores)->map(function ($data, $relationship) {
            return [
                'relationship' => $relationship,
                'relationship_label' => Feedback360Session::RELATIONSHIPS[$relationship] ?? $relationship,
                'average' => $data['count'] > 0 ? round($data['total'] / $data['count'], 2) : 0,
                'count' => $data['count'],
            ];
        })->values()->toArray();
    }
}
