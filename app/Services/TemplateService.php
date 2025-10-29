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
                
                // Apply marks (bold, italic, etc.)
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
                        }
                    }
                }
                
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
                $html = '<table class="table-auto border-collapse border">';
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

        // Build signature HTML based on layout
        $signatureHtml = '<div class="signature-area" style="margin-top: 40px;">';

        switch ($layout) {
            case 'bottom_right_1':
                // Single signature on the right
                $signatureHtml .= '<div style="display: flex; justify-content: flex-end; padding-right: 80px;">';
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
     * Render a single signature box
     */
    private function renderSignatureBox(array $signature, $approvals, int $index): string
    {
        $label = $signature['label'] ?? 'Penandatangan';
        $position = $signature['position'] ?? 'Jabatan';

        // Find approval for this signature index
        $approval = null;
        if ($approvals) {
            $approval = $approvals->firstWhere('signature_index', $index);
        }

        $html = '<div style="text-align: center; min-width: 120px; transform: scale(0.6); transform-origin: center;">';
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
     * Extract variables from template
     */
    public function extractVariables(array $content): array
    {
        $variables = [];

        if (isset($content['type']) && $content['type'] === 'variable') {
            $variables[] = $content['attrs']['name'] ?? '';
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
}
