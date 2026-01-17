<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class DocumentTemplate extends Model
{
    use SoftDeletes;

    // Template types
    public const TYPE_GENERAL = 'general';
    public const TYPE_LEAVE = 'leave';
    public const TYPE_EARLY_LEAVE = 'early_leave';
    public const TYPE_LEAVE_RESPONSE = 'leave_response';
    public const TYPE_EARLY_LEAVE_RESPONSE = 'early_leave_response';

    protected $fillable = [
        'name',
        'code',
        'category',
        'template_type',
        'organization_unit_id',
        'numbering_group_id',
        'description',
        'page_settings',
        'header_settings',
        'content_blocks',
        'footer_settings',
        'signature_settings',
        'variables',
        'numbering_format',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'page_settings' => 'array',
        'header_settings' => 'array',
        'content_blocks' => 'array',
        'footer_settings' => 'array',
        'signature_settings' => 'array',
        'variables' => 'array',
        'is_active' => 'boolean',
        'numbering_group_id' => 'integer',
    ];

    /**
     * Default page settings
     */
    public static function defaultPageSettings(): array
    {
        return [
            'paper_size' => 'A4',
            'orientation' => 'portrait',
            'margins' => [
                'top' => 20,
                'bottom' => 20,
                'left' => 25,
                'right' => 20,
            ],
            'default_font' => [
                'family' => 'Times New Roman',
                'size' => 12,
                'line_height' => 1.5,
            ],
        ];
    }

    /**
     * Default header settings
     */
    public static function defaultHeaderSettings(): array
    {
        return [
            'enabled' => true,
            'height' => 35,
            'margin_bottom' => 10,
            'logo' => [
                'enabled' => false,
                'position' => 'left',
                'width' => 20,
                'height' => null,
                'src' => null,
            ],
            'text_lines' => [],
            'border_bottom' => [
                'enabled' => true,
                'style' => 'double',
                'width' => 2,
                'color' => '#000000',
            ],
        ];
    }

    /**
     * Default signature settings
     */
    public static function defaultSignatureSettings(): array
    {
        return [
            'margin_top' => 20,
            'layout' => '2-column',
            'column_gap' => 10,
            'slots' => [],
        ];
    }

    /**
     * Paper size dimensions in mm
     */
    public static function paperSizes(): array
    {
        return [
            'A4' => ['width' => 210, 'height' => 297],
            'Letter' => ['width' => 216, 'height' => 279],
            'Legal' => ['width' => 216, 'height' => 356],
            'F4' => ['width' => 215, 'height' => 330],
        ];
    }

    /**
     * Available font families
     */
    public static function fontFamilies(): array
    {
        return [
            'Times New Roman',
            'Arial',
            'Helvetica',
            'Calibri',
            'Georgia',
            'Verdana',
            'Tahoma',
            'Courier New',
        ];
    }

    // Relationships
    public function organizationUnit(): BelongsTo
    {
        return $this->belongsTo(OrganizationUnit::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function letters(): HasMany
    {
        return $this->hasMany(OutgoingLetter::class, 'template_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    public function scopeForOrganization($query, $organizationUnitId)
    {
        return $query->where('organization_unit_id', $organizationUnitId);
    }

    public function scopeOfType($query, $type)
    {
        return $query->where('template_type', $type);
    }

    public function scopeLeaveTemplate($query)
    {
        return $query->where('template_type', self::TYPE_LEAVE);
    }

    public function scopeEarlyLeaveTemplate($query)
    {
        return $query->where('template_type', self::TYPE_EARLY_LEAVE);
    }

    public function scopeLeaveResponseTemplate($query)
    {
        return $query->where('template_type', self::TYPE_LEAVE_RESPONSE);
    }

    public function scopeEarlyLeaveResponseTemplate($query)
    {
        return $query->where('template_type', self::TYPE_EARLY_LEAVE_RESPONSE);
    }

    /**
     * Get the effective numbering group ID
     * If not set, use the template's own ID
     */
    public function getNumberingGroupId(): int
    {
        return $this->numbering_group_id ?? $this->id;
    }

    /**
     * Get all templates in the same numbering group
     */
    public function getLinkedTemplates()
    {
        $groupId = $this->getNumberingGroupId();
        
        return self::where(function($query) use ($groupId) {
            $query->where('numbering_group_id', $groupId)
                  ->orWhere('id', $groupId);
        })->get();
    }

    /**
     * Check if this template shares numbering with another
     */
    public function sharesNumberingWith(DocumentTemplate $other): bool
    {
        return $this->getNumberingGroupId() === $other->getNumberingGroupId();
    }

    /**
     * Get paper dimensions based on settings
     */
    public function getPaperDimensions(): array
    {
        $paperSize = $this->page_settings['paper_size'] ?? 'A4';
        $orientation = $this->page_settings['orientation'] ?? 'portrait';
        
        $dimensions = self::paperSizes()[$paperSize] ?? self::paperSizes()['A4'];
        
        if ($orientation === 'landscape') {
            return [
                'width' => $dimensions['height'],
                'height' => $dimensions['width'],
            ];
        }
        
        return $dimensions;
    }

    /**
     * Get content area dimensions (paper minus margins)
     */
    public function getContentDimensions(): array
    {
        $paper = $this->getPaperDimensions();
        $margins = $this->page_settings['margins'] ?? [];
        
        return [
            'width' => $paper['width'] - ($margins['left'] ?? 25) - ($margins['right'] ?? 20),
            'height' => $paper['height'] - ($margins['top'] ?? 20) - ($margins['bottom'] ?? 20),
        ];
    }

    /**
     * Extract all variable keys from content blocks
     */
    public function getVariableKeys(): array
    {
        $keys = [];
        
        // From content blocks
        foreach ($this->content_blocks ?? [] as $block) {
            if (isset($block['content'])) {
                preg_match_all('/\{\{(\w+)\}\}/', $block['content'], $matches);
                $keys = array_merge($keys, $matches[1]);
            }
        }
        
        // From signature settings
        foreach ($this->signature_settings['slots'] ?? [] as $slot) {
            if (isset($slot['name_placeholder'])) {
                preg_match_all('/\{\{(\w+)\}\}/', $slot['name_placeholder'], $matches);
                $keys = array_merge($keys, $matches[1]);
            }
            if (isset($slot['nip_placeholder'])) {
                preg_match_all('/\{\{(\w+)\}\}/', $slot['nip_placeholder'], $matches);
                $keys = array_merge($keys, $matches[1]);
            }
        }
        
        return array_unique($keys);
    }
}
