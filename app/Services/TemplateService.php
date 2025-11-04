<?php

namespace App\Services;

use App\Models\LetterTemplate;
use Illuminate\Support\Facades\Auth;

class TemplateService
{
    /**
     * Render template HTML from TipTap JSON
     */
    public function renderTemplate(LetterTemplate $template, array $data): string
    {
        $html = $this->jsonToHtml($template->content);

        // Replace variables with actual data
        foreach ($data as $key => $value) {
            // Handle rich text values (already HTML)
            if (is_array($value) && isset($value['type']) && $value['type'] === 'doc') {
                $value = $this->jsonToHtml($value);
            }

            // Format date variables to Indonesian format
            if (strpos($key, 'tanggal') !== false && !empty($value) && !is_array($value)) {
                $value = $this->formatIndonesianDate($value);
            }

            $html = str_replace("{{" . $key . "}}", $value, $html);
        }

        // Add letterhead if exists
        if ($template->letterhead) {
            $html = $this->prependLetterhead($html, $template->letterhead);
        }

        return $html;
    }

    /**
     * Convert TipTap JSON to HTML
     */
    public function jsonToHtml(array $content): string
    {
        if (!isset($content['type'])) {
            return '';
        }

        $type = $content['type'];
        $html = '';

        switch ($type) {
            case 'doc':
                foreach ($content['content'] ?? [] as $node) {
                    $html .= $this->jsonToHtml($node);
                }
                break;

            case 'paragraph':
                $styles = [];
                $attrs = $content['attrs'] ?? [];
                
                // Handle text alignment
                if (isset($attrs['textAlign'])) {
                    $styles[] = 'text-align: ' . $attrs['textAlign'];
                }
                
                // Handle indentation (margin-left from indent extension)
                if (isset($attrs['indent']) && $attrs['indent'] > 0) {
                    $styles[] = 'margin-left: ' . $attrs['indent'] . 'px';
                }
                
                // Handle line-height
                if (isset($attrs['lineHeight']) && $attrs['lineHeight'] !== 'normal') {
                    $styles[] = 'line-height: ' . $attrs['lineHeight'];
                }
                
                $styleAttr = !empty($styles) ? ' style="' . implode('; ', $styles) . '"' : '';
                
                $html = '<p' . $styleAttr . '>';
                
                // Check if paragraph has content
                if (!empty($content['content'])) {
                    foreach ($content['content'] as $node) {
                        $html .= $this->jsonToHtml($node);
                    }
                } else {
                    // Empty paragraph - add non-breaking space to preserve line break
                    $html .= '&nbsp;';
                }
                
                $html .= '</p>';
                break;

            case 'text':
                $text = $content['text'] ?? '';
                
                // Apply marks (bold, italic, variable, etc.)
                if (isset($content['marks'])) {
                    foreach ($content['marks'] as $mark) {
                        switch ($mark['type']) {
                            case 'bold':
                                $text = "<strong>{$text}</strong>";
                                break;
                            case 'italic':
                                $text = "<em>{$text}</em>";
                                break;
                            case 'underline':
                                $text = "<u>{$text}</u>";
                                break;
                            case 'variable':
                                // Variable mark - keep text as-is (it's already {{varname}})
                                // Don't wrap in any HTML to avoid line-height issues
                                break;
                        }
                    }
                }
                
                // Preserve whitespace and tabs but allow wrapping
                // Convert tabs to actual tab character (will be styled with CSS tab-size)
                // Convert leading/trailing spaces and multiple consecutive spaces to &nbsp;
                // Keep single spaces for word wrapping
                $text = preg_replace('/^ /', '&nbsp;', $text); // Leading space
                $text = preg_replace('/ $/', '&nbsp;', $text); // Trailing space
                $text = preg_replace_callback('/  +/', function($matches) {
                    return str_repeat('&nbsp;', strlen($matches[0]));
                }, $text); // Multiple spaces
                // Tabs are preserved as-is, will be rendered with CSS tab-size
                
                $html = $text;
                break;

            case 'heading':
                $level = $content['attrs']['level'] ?? 1;
                $styles = [];
                $attrs = $content['attrs'] ?? [];
                
                // Handle text alignment
                if (isset($attrs['textAlign'])) {
                    $styles[] = 'text-align: ' . $attrs['textAlign'];
                }
                
                // Handle indentation
                if (isset($attrs['indent']) && $attrs['indent'] > 0) {
                    $styles[] = 'margin-left: ' . $attrs['indent'] . 'px';
                }
                
                // Handle line-height
                if (isset($attrs['lineHeight']) && $attrs['lineHeight'] !== 'normal') {
                    $styles[] = 'line-height: ' . $attrs['lineHeight'];
                }
                
                $styleAttr = !empty($styles) ? ' style="' . implode('; ', $styles) . '"' : '';
                
                $html = "<h{$level}{$styleAttr}>";
                foreach ($content['content'] ?? [] as $node) {
                    $html .= $this->jsonToHtml($node);
                }
                $html .= "</h{$level}>";
                break;

            case 'bulletList':
                $html = '<ul>';
                foreach ($content['content'] ?? [] as $node) {
                    $html .= $this->jsonToHtml($node);
                }
                $html .= '</ul>';
                break;

            case 'orderedList':
                $html = '<ol>';
                foreach ($content['content'] ?? [] as $node) {
                    $html .= $this->jsonToHtml($node);
                }
                $html .= '</ol>';
                break;

            case 'listItem':
                $html = '<li>';
                foreach ($content['content'] ?? [] as $node) {
                    $html .= $this->jsonToHtml($node);
                }
                $html .= '</li>';
                break;

            case 'table':
                // Support custom class attribute for borderless tables
                $tableClass = $content['attrs']['class'] ?? '';
                $defaultClass = 'table-auto border-collapse';
                if (!empty($tableClass) && strpos($tableClass, 'borderless') !== false) {
                    $defaultClass = 'table-auto'; // No border for borderless tables
                } else {
                    $defaultClass .= ' border';
                }
                $html = "<table class='{$defaultClass} {$tableClass}'>";
                foreach ($content['content'] ?? [] as $node) {
                    $html .= $this->jsonToHtml($node);
                }
                $html .= '</table>';
                break;

            case 'tableRow':
                $html = '<tr>';
                foreach ($content['content'] ?? [] as $node) {
                    $html .= $this->jsonToHtml($node);
                }
                $html .= '</tr>';
                break;

            case 'tableCell':
            case 'tableHeader':
                $tag = $type === 'tableHeader' ? 'th' : 'td';
                // Check if parent table is borderless (need to walk up the tree to check)
                // For now, always add border - borderless class on table will override via CSS
                $html = "<{$tag} class='border p-2'>";
                foreach ($content['content'] ?? [] as $node) {
                    $html .= $this->jsonToHtml($node);
                }
                $html .= "</{$tag}>";
                break;

            case 'image':
                $src = $content['attrs']['src'] ?? '';
                $alt = $content['attrs']['alt'] ?? '';
                $html = "<img src='{$src}' alt='{$alt}' />";
                break;

            case 'hardBreak':
                $html = '<br />';
                break;

            case 'variable':
                $varName = $content['attrs']['name'] ?? '';
                // Render as plain text without any wrapper to avoid line-height issues
                $html = "{{" . $varName . "}}";
                break;

            case 'letterhead':
                // Skip letterhead node in content - letterhead is automatically prepended
                // This prevents double letterhead when user inserts it in template content
                $html = '';
                break;

            case 'signature':
                // Render signature inline - PERSIS SAMA dengan SignatureComponent React
                $signatureIndex = $content['attrs']['signatureIndex'] ?? 0;
                $userName = $content['attrs']['userName'] ?? 'Nama Penandatangan';
                $position = $content['attrs']['position'] ?? 'Jabatan';
                $nip = $content['attrs']['nip'] ?? null;
                $showSignatureImage = $content['attrs']['showSignatureImage'] ?? false;
                $signatureImage = $content['attrs']['signatureImage'] ?? null;
                $userId = $content['attrs']['userId'] ?? null;
                
                // Outer wrapper: inline-block, align-bottom, margin: 0 4px
                $html = '<span style="display: inline-block; vertical-align: bottom; margin: 0 4px;">';
                
                // Inner container: inline-flex flex-col items-center, p-2 (8px), border, rounded, fontSize: 10px
                $html .= '<span style="display: inline-flex; flex-direction: column; align-items: center; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; background: white; font-size: 10px;">';
                
                // Position - text-center mb-1 (4px), font-medium (500)
                $html .= '<span style="display: block; text-align: center; margin-bottom: 4px; font-weight: 500;">' . htmlspecialchars($position) . '</span>';
                
                // QR Code placeholder - border, bg-white, h-14 w-14 (56px), flex items-center justify-center, mb-1 (4px), text-xs (12px)
                $html .= '<span style="display: flex; align-items: center; justify-content: center; border: 1px solid #d1d5db; background: white; width: 56px; height: 56px; margin-bottom: 4px; font-size: 12px; color: #9ca3af;">QR</span>';
                
                // Signature image (optional) - h-8 (32px), w-auto, object-contain, mb-1 (4px)
                if ($showSignatureImage && $signatureImage) {
                    $html .= '<img src="' . htmlspecialchars($signatureImage) . '" alt="TTD" style="height: 32px; width: auto; object-fit: contain; margin-bottom: 4px; display: block;" />';
                }
                
                // Name - font-semibold (600), border-b, px-2 (8px), mb-0.5 (2px)
                $html .= '<span style="display: inline-block; font-weight: 600; border-bottom: 1px solid #000; padding-left: 8px; padding-right: 8px; margin-bottom: 2px;">' . htmlspecialchars($userName) . '</span>';
                
                // NIP (optional) - text-[9px]
                if ($nip) {
                    $html .= '<span style="display: block; font-size: 9px;">NIP. ' . htmlspecialchars($nip) . '</span>';
                }
                
                $html .= '</span>'; // Close inner container
                $html .= '</span>'; // Close outer wrapper
                break;

            case 'signatureBlock':
                $html = '<div class="signature-block">';
                foreach ($content['content'] ?? [] as $node) {
                    $html .= $this->jsonToHtml($node);
                }
                $html .= '</div>';
                break;
        }

        return $html;
    }

    /**
     * Prepend letterhead to HTML
     */
    private function prependLetterhead(string $html, array $letterhead): string
    {
        // New format: letterhead contains full logo image (base64 or URL)
        // Size: 700x178px already rendered in template create
        if (!empty($letterhead['logo'])) {
            $width = $letterhead['width'] ?? 700;
            $height = $letterhead['height'] ?? 178;
            
            $letterheadHtml = '<div class="letterhead" style="width: '.$width.'px; height: '.$height.'px; margin: -32px -32px 0 -32px;">';
            $letterheadHtml .= "<img src='{$letterhead['logo']}' alt='Kop Surat' style='width: 100%; height: 100%; object-fit: contain;' />";
            $letterheadHtml .= '</div>';
            
            return $letterheadHtml . $html;
        }
        
        // Legacy format: individual fields (backward compatibility)
        if (!empty($letterhead['organization_name'])) {
            $letterheadHtml = '<div class="letterhead">';
            
            if (!empty($letterhead['logo_path'])) {
                $letterheadHtml .= "<img src='{$letterhead['logo_path']}' alt='Logo' class='logo' />";
            }
            
            $letterheadHtml .= "<h2>{$letterhead['organization_name']}</h2>";
            
            if (!empty($letterhead['address'])) {
                $letterheadHtml .= "<p>{$letterhead['address']}</p>";
            }
            
            $contact = [];
            if (!empty($letterhead['phone'])) {
                $contact[] = "Telp: {$letterhead['phone']}";
            }
            if (!empty($letterhead['email'])) {
                $contact[] = "Email: {$letterhead['email']}";
            }
            if ($contact) {
                $letterheadHtml .= "<p>" . implode(' | ', $contact) . "</p>";
            }
            
            $letterheadHtml .= '</div><hr />';
            
            return $letterheadHtml . $html;
        }
        
        return $html;
    }

    /**
     * Append signature blocks to rendered HTML based on template signatures and approvals
     */
    public function appendSignatures(string $html, LetterTemplate $template, $approvals = null): string
    {
        // If no approvals exist, don't render signature blocks
        if (!$approvals || $approvals->count() === 0) {
            return $html;
        }

        // Get unique signature count from approvals (actual data)
        $approvalCount = $approvals->count();
        
        // Use template signatures if available, otherwise create from approvals
        $signatures = $template->signatures ?? [];
        
        // If template signatures don't match approval count, use approval data
        if (count($signatures) !== $approvalCount) {
            // Template has been modified! Use approval data instead
            $signatures = [];
            foreach ($approvals as $approval) {
                $signatures[] = [
                    'label' => $approval->user->name ?? 'Penandatangan',
                    'position' => $approval->position_name ?? 'Jabatan',
                ];
            }
        }

        // Determine layout based on signature count
        $layout = $template->signature_layout ?? 'bottom_right_1';
        
        // Auto-detect layout if count doesn't match
        if (count($signatures) !== $approvalCount) {
            $layout = $this->detectLayout($approvalCount);
        }

        // Check if any signature uses custom placement
        $hasCustomPlacement = false;
        foreach ($signatures as $signature) {
            if (isset($signature['placement']) && $signature['placement'] === 'custom') {
                $hasCustomPlacement = true;
                break;
            }
        }

        // Build signature HTML based on layout or custom placement
        $signatureHtml = '<div class="signature-area" style="margin-top: 40px;' . ($hasCustomPlacement ? ' position: relative; min-height: 200px;' : '') . '">';

        if ($hasCustomPlacement) {
            // Use custom placement for each signature
            foreach ($signatures as $index => $signature) {
                $signatureHtml .= $this->renderSignatureBox($signature, $approvals, $index);
            }
        } else {
            // Use predefined layout with dynamic placement adjustments
            switch ($layout) {
                case 'bottom_right_1':
                    // Single signature - respect placement
                    $placement = $signatures[0]['placement'] ?? 'right';
                    $justifyContent = $placement === 'left' ? 'flex-start' : ($placement === 'center' ? 'center' : 'flex-end');
                    $signatureHtml .= '<div style="display: flex; justify-content: ' . $justifyContent . '; padding: 0 80px;">';
                    $signatureHtml .= $this->renderSignatureBox($signatures[0] ?? [], $approvals, 0);
                    $signatureHtml .= '</div>';
                    break;

                case 'bottom_left_right':
                    // Two signatures: left and right
                    $signatureHtml .= '<div style="display: flex; justify-content: space-between; padding-left: 60px; padding-right: 60px;">';
                    $signatureHtml .= $this->renderSignatureBox($signatures[0] ?? [], $approvals, 0);
                    $signatureHtml .= $this->renderSignatureBox($signatures[1] ?? [], $approvals, 1);
                    $signatureHtml .= '</div>';
                    break;

                case 'bottom_center_3':
                case 'three_signatures':
                    // Three signatures in a row
                    $signatureHtml .= '<div style="display: flex; justify-content: space-around; padding: 0 40px;">';
                    $signatureHtml .= $this->renderSignatureBox($signatures[0] ?? [], $approvals, 0);
                    $signatureHtml .= $this->renderSignatureBox($signatures[1] ?? [], $approvals, 1);
                    $signatureHtml .= $this->renderSignatureBox($signatures[2] ?? [], $approvals, 2);
                    $signatureHtml .= '</div>';
                    break;

                case 'stacked_right':
                    // Stacked signatures on the right
                    $signatureHtml .= '<div style="display: flex; flex-direction: column; align-items: flex-end; gap: 20px; padding-right: 80px;">';
                    foreach ($signatures as $index => $signature) {
                        $signatureHtml .= $this->renderSignatureBox($signature, $approvals, $index);
                    }
                    $signatureHtml .= '</div>';
                    break;

                case 'four_signatures':
                    // Four signatures: 2 rows x 2 columns
                    $signatureHtml .= '<div style="display: flex; flex-direction: column; gap: 30px; padding: 0 60px;">';
                    // First row: 2 signatures
                    $signatureHtml .= '<div style="display: flex; justify-content: space-between;">';
                    $signatureHtml .= $this->renderSignatureBox($signatures[0] ?? [], $approvals, 0);
                    $signatureHtml .= $this->renderSignatureBox($signatures[1] ?? [], $approvals, 1);
                    $signatureHtml .= '</div>';
                    // Second row: 2 signatures
                    $signatureHtml .= '<div style="display: flex; justify-content: space-between;">';
                    $signatureHtml .= $this->renderSignatureBox($signatures[2] ?? [], $approvals, 2);
                    $signatureHtml .= $this->renderSignatureBox($signatures[3] ?? [], $approvals, 3);
                    $signatureHtml .= '</div>';
                    $signatureHtml .= '</div>';
                    break;

                default:
                    // Fallback: render all signatures in grid layout
                    $signatureHtml .= '<div style="display: flex; flex-wrap: wrap; justify-content: space-around; gap: 20px; padding: 0 40px;">';
                    foreach ($signatures as $index => $signature) {
                        $signatureHtml .= $this->renderSignatureBox($signature, $approvals, $index);
                    }
                    $signatureHtml .= '</div>';
            }
        }

        $signatureHtml .= '</div>';

        return $html . $signatureHtml;
    }

    /**
     * Auto-detect layout based on approval count
     */
    private function detectLayout(int $count): string
    {
        switch ($count) {
            case 1:
                return 'bottom_right_1';
            case 2:
                return 'bottom_left_right';
            case 3:
                return 'bottom_center_3';
            case 4:
                return 'four_signatures';
            default:
                return 'stacked_right';
        }
    }

    /**
     * Render a single signature box with dynamic placement
     */
    private function renderSignatureBox(array $signature, $approvals, int $index): string
    {
        $label = $signature['label'] ?? 'Penandatangan';
        $position = $signature['position'] ?? 'Jabatan';
        $placement = $signature['placement'] ?? 'right';

        // Find approval for this signature index
        $approval = null;
        if ($approvals) {
            $approval = $approvals->firstWhere('signature_index', $index);
        }

        // Determine positioning based on placement
        $positionStyle = '';
        if ($placement === 'custom' && isset($signature['customX']) && isset($signature['customY'])) {
            $positionStyle = sprintf(
                'position: absolute; left: %s%%; top: %s%%;',
                $signature['customX'],
                $signature['customY']
            );
        }

        $html = '<div style="text-align: center; min-width: 120px; transform: scale(0.6); transform-origin: center; ' . $positionStyle . '">';
        $html .= '<div style="margin-bottom: 50px;">';
        $html .= '<div style="font-size: 12px; margin-bottom: 8px;">' . htmlspecialchars($position) . '</div>';
        
        // QR Code or Signature placeholder
        $html .= '<div style="width: 120px; height: 120px; border: 1px dashed #ccc; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #999;">';
        
        if ($approval && $approval->status === 'approved' && !empty($approval->signature_data)) {
            // Show QR code if signature data exists
            $html .= '<div style="font-size: 10px; color: #666;">QR Code:<br/>' . substr($approval->signature_data, 0, 8) . '...</div>';
        } else {
            // Placeholder
            $html .= 'QR / TTD';
        }
        
        $html .= '</div>';
        $html .= '</div>';
        
        // Name line
        $html .= '<div style="border-bottom: 1px solid #000; width: 160px; margin: 0 auto;"></div>';
        $html .= '<div style="font-size: 12px; margin-top: 4px; font-weight: bold;">' . htmlspecialchars($label) . '</div>';
        
        // Show approval status if approved
        if ($approval && $approval->status === 'approved') {
            $html .= '<div style="font-size: 10px; color: #666; margin-top: 2px;">';
            $html .= 'Disetujui: ' . date('d/m/Y H:i', strtotime($approval->signed_at));
            $html .= '</div>';
        }
        
        $html .= '</div>';

        return $html;
    }

    /**
     * Convert old Variable Node format to new Variable Mark format
     * For backward compatibility with templates created before Mark migration
     */
    public function convertVariableNodeToMark(array $content): array
    {
        if (!isset($content['type'])) {
            return $content;
        }

        // If this is a variable node, convert it to text with variable mark
        if ($content['type'] === 'variable') {
            $varName = $content['attrs']['name'] ?? '';
            return [
                'type' => 'text',
                'text' => "{{" . $varName . "}}",
                'marks' => [
                    [
                        'type' => 'variable',
                        'attrs' => [
                            'name' => $varName
                        ]
                    ]
                ]
            ];
        }

        // Recursively process content array
        if (isset($content['content']) && is_array($content['content'])) {
            $content['content'] = array_map(function($node) {
                return $this->convertVariableNodeToMark($node);
            }, $content['content']);
        }

        return $content;
    }

    /**
     * Extract variables from template
     */
    public function extractVariables(array $content): array
    {
        $variables = [];

        // Check for old variable node format
        if (isset($content['type']) && $content['type'] === 'variable') {
            $variables[] = $content['attrs']['name'] ?? '';
        }

        // Check for new variable mark format
        if (isset($content['marks']) && is_array($content['marks'])) {
            foreach ($content['marks'] as $mark) {
                if ($mark['type'] === 'variable') {
                    $variables[] = $mark['attrs']['name'] ?? '';
                }
            }
        }

        if (isset($content['content']) && is_array($content['content'])) {
            foreach ($content['content'] as $node) {
                $variables = array_merge($variables, $this->extractVariables($node));
            }
        }

        return array_unique($variables);
    }

    /**
     * Validate template data
     */
    public function validateTemplateData(LetterTemplate $template, array $data): array
    {
        $errors = [];
        
        foreach ($template->variables as $variable) {
            $name = $variable['name'];
            $required = $variable['required'] ?? false;
            
            if ($required && empty($data[$name])) {
                $errors[$name] = "Field {$variable['label']} harus diisi";
            }
        }

        return $errors;
    }

    /**
     * Replace variables in HTML with actual data
     * This is used when we have stored HTML from editor and need to replace variables
     */
    public function replaceVariablesInHtml(string $html, array $data): string
    {
        // Replace variables with actual data
        foreach ($data as $key => $value) {
            // Handle rich text values (already HTML)
            if (is_array($value) && isset($value['type']) && $value['type'] === 'doc') {
                $value = $this->jsonToHtml($value);
            }

            // Replace {{variable_name}} with actual value
            $html = str_replace("{{" . $key . "}}", $value, $html);
        }

        return $html;
    }

    /**
     * Replace variables in TipTap JSON content with actual data
     * This recursively walks through the JSON structure and replaces variable text
     */
    public function replaceVariablesInContent(array $content, array $data): array
    {
        // Deep clone to avoid modifying original
        $result = json_decode(json_encode($content), true);
        
        // Recursively replace variables in the content
        $result = $this->replaceVariablesRecursive($result, $data);
        
        return $result;
    }

    /**
     * Format date to Indonesian format: 1 November 2025
     */
    private function formatIndonesianDate($date): string
    {
        if (empty($date)) {
            return $date;
        }

        try {
            $timestamp = strtotime($date);
            if ($timestamp === false) {
                return $date; // Return original if cannot parse
            }

            $months = [
                1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
                5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
                9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
            ];

            $day = date('j', $timestamp); // Day without leading zero
            $month = $months[(int)date('n', $timestamp)];
            $year = date('Y', $timestamp);

            return "{$day} {$month} {$year}";
        } catch (\Exception $e) {
            return $date; // Return original if error
        }
    }

    /**
     * Recursively replace variables in TipTap JSON structure
     */
    private function replaceVariablesRecursive(array $node, array $data): array
    {
        // If this is a text node with variable mark
        if (isset($node['type']) && $node['type'] === 'text' && isset($node['text'])) {
            // Check if text contains variable placeholder
            foreach ($data as $key => $value) {
                // Handle rich text values
                if (is_array($value) && isset($value['type']) && $value['type'] === 'doc') {
                    $value = $this->jsonToHtml($value);
                }
                
                // Format date variables to Indonesian format
                if (strpos($key, 'tanggal') !== false && !empty($value) && !is_array($value)) {
                    $value = $this->formatIndonesianDate($value);
                }
                
                // Replace {{variable}} in text
                $node['text'] = str_replace("{{" . $key . "}}", $value, $node['text']);
            }
        }

        // Recursively process content array
        if (isset($node['content']) && is_array($node['content'])) {
            foreach ($node['content'] as $index => $childNode) {
                $node['content'][$index] = $this->replaceVariablesRecursive($childNode, $data);
            }
        }

        return $node;
    }

    /**
     * Extract all signatures from TipTap JSON content
     * Returns array of signature data with userId, userName, position, etc.
     */
    public function extractSignatures(array $content): array
    {
        $signatures = [];
        $this->extractSignaturesRecursive($content, $signatures);
        return $signatures;
    }

    /**
     * Recursively extract signatures from TipTap JSON
     */
    private function extractSignaturesRecursive(array $node, array &$signatures): void
    {
        // If this is a signature node
        if (isset($node['type']) && $node['type'] === 'signature') {
            $attrs = $node['attrs'] ?? [];
            
            // Only add if it has a userId (assigned to someone)
            if (!empty($attrs['userId'])) {
                $signatures[] = [
                    'userId' => $attrs['userId'],
                    'userName' => $attrs['userName'] ?? 'Nama Penandatangan',
                    'position' => $attrs['position'] ?? 'Jabatan',
                    'nip' => $attrs['nip'] ?? null,
                    'signatureIndex' => $attrs['signatureIndex'] ?? count($signatures),
                ];
            }
        }

        // Recursively process content array
        if (isset($node['content']) && is_array($node['content'])) {
            foreach ($node['content'] as $childNode) {
                $this->extractSignaturesRecursive($childNode, $signatures);
            }
        }
    }
}
