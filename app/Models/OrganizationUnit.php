<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrganizationUnit extends Model
{
    protected $fillable = [
        'code',
        'name',
        'description',
        'letterhead_image',
        'parent_id',
        'level',
        'head_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'level' => 'integer',
        'head_id' => 'integer',
        'parent_id' => 'integer',
    ];

    /**
     * Parent organization unit
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(OrganizationUnit::class, 'parent_id');
    }

    /**
     * Child organization units
     */
    public function children(): HasMany
    {
        return $this->hasMany(OrganizationUnit::class, 'parent_id');
    }

    /**
     * Head of the organization unit
     */
    public function head(): BelongsTo
    {
        return $this->belongsTo(User::class, 'head_id');
    }

    /**
     * Users in this organization unit
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'organization_unit_id');
    }

    /**
     * Meetings organized by this unit
     */
    public function meetings(): HasMany
    {
        return $this->hasMany(Meeting::class, 'organization_unit_id');
    }

    /**
     * Get full hierarchy path
     */
    public function getFullPathAttribute(): string
    {
        $path = [$this->name];
        $parent = $this->parent;
        
        while ($parent) {
            array_unshift($path, $parent->name);
            $parent = $parent->parent;
        }
        
        return implode(' > ', $path);
    }
}
