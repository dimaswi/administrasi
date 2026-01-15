<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeaveType extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'description',
        'default_quota',
        'is_paid',
        'requires_approval',
        'allow_carry_over',
        'max_carry_over_days',
        'min_advance_days',
        'max_consecutive_days',
        'is_active',
        'sort_order',
        'color',
    ];

    protected $casts = [
        'default_quota' => 'integer',
        'is_paid' => 'boolean',
        'requires_approval' => 'boolean',
        'allow_carry_over' => 'boolean',
        'max_carry_over_days' => 'integer',
        'min_advance_days' => 'integer',
        'max_consecutive_days' => 'integer',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * Color options for UI
     */
    public const COLORS = [
        'blue' => 'Biru',
        'green' => 'Hijau',
        'yellow' => 'Kuning',
        'red' => 'Merah',
        'purple' => 'Ungu',
        'pink' => 'Pink',
        'orange' => 'Oranye',
        'cyan' => 'Cyan',
        'gray' => 'Abu-abu',
    ];

    /**
     * Relationships
     */
    public function leaves(): HasMany
    {
        return $this->hasMany(Leave::class);
    }

    public function balances(): HasMany
    {
        return $this->hasMany(EmployeeLeaveBalance::class);
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    /**
     * Accessors
     */
    public function getPaidLabelAttribute(): string
    {
        return $this->is_paid ? 'Berbayar' : 'Tidak Berbayar';
    }

    public function getColorClassAttribute(): string
    {
        return match ($this->color) {
            'blue' => 'bg-blue-500',
            'green' => 'bg-green-500',
            'yellow' => 'bg-yellow-500',
            'red' => 'bg-red-500',
            'purple' => 'bg-purple-500',
            'pink' => 'bg-pink-500',
            'orange' => 'bg-orange-500',
            'cyan' => 'bg-cyan-500',
            'gray' => 'bg-gray-500',
            default => 'bg-blue-500',
        };
    }
}
