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
            
            // Tambahkan kop surat setelah setiap page break
            $html = $this->addLetterheadAfterPageBreaks($html, $template->letterhead);
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
                
                // Post-process: Convert consecutive paragraphs with "Label : Value" pattern to table
                $html = $this->convertAlignmentPatternsToTable($html);
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
                
                // Preserve whitespace and tabs
                // Convert tabs to 4em space for consistent alignment with monospace-like behavior
                $text = str_replace("\t", '<span style="display:inline-block;width:4em;"></span>', $text);
                // Convert leading/trailing spaces and multiple consecutive spaces to &nbsp;
                // Keep single spaces for word wrapping
                $text = preg_replace('/^ /', '&nbsp;', $text); // Leading space
                $text = preg_replace('/ $/', '&nbsp;', $text); // Trailing space
                $text = preg_replace_callback('/  +/', function($matches) {
                    return str_repeat('&nbsp;', strlen($matches[0]));
                }, $text); // Multiple spaces
                
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

            case 'alignmentTable':
                // Tabel borderless khusus untuk alignment (2 kolom: left & right)
                $html = '<table data-type="alignment-table" style="width: 100%; border-collapse: collapse; border: none; margin: 10px 0;"><tbody>';
                foreach ($content['content'] ?? [] as $node) {
                    $html .= $this->jsonToHtml($node);
                }
                $html .= '</tbody></table>';
                break;

            case 'alignmentTableRow':
                $html = '<tr>';
                foreach ($content['content'] ?? [] as $node) {
                    $html .= $this->jsonToHtml($node);
                }
                $html .= '</tr>';
                break;

            case 'alignmentTableCell':
                $align = $content['attrs']['align'] ?? 'left';
                $html = '<td data-align="' . $align . '" style="text-align: ' . $align . '; border: none; padding: 4px 8px; vertical-align: top;">';
                foreach ($content['content'] ?? [] as $node) {
                    $html .= $this->jsonToHtml($node);
                }
                $html .= '</td>';
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

            case 'pageBreak':
                // Page break untuk membuat halaman baru di PDF
                // Tambahkan page break + letterhead untuk halaman berikutnya
                $html = '<div data-type="page-break" style="page-break-after: always;"></div>';
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
                // Render signature sebagai inline biasa (tanpa float)
                $signatureIndex = $content['attrs']['signatureIndex'] ?? 0;
                $userName = $content['attrs']['userName'] ?? 'Nama Penandatangan';
                $position = $content['attrs']['position'] ?? 'Jabatan';
                $nip = $content['attrs']['nip'] ?? null;
                $showSignatureImage = $content['attrs']['showSignatureImage'] ?? false;
                $signatureImage = $content['attrs']['signatureImage'] ?? null;
                $userId = $content['attrs']['userId'] ?? null;
                
                // Outer wrapper: inline-block - TANPA FLOAT
                $userIdAttr = $userId ? ' data-user-id="' . htmlspecialchars($userId) . '" data-user-name="' . htmlspecialchars($userName) . '"' : '';
                $html = '<span data-type="signature"' . $userIdAttr . ' style="display: inline-block; vertical-align: top; min-width: 180px; text-align: center; margin: 0 8px;">';
                
                // Inner container: flex column dengan padding yang cukup - TANPA BORDER
                $html .= '<span style="display: inline-flex; flex-direction: column; align-items: center; padding: 12px; background: white; font-size: 11pt;">';
                
                // Position
                $html .= '<span style="display: block; text-align: center; margin-bottom: 8px; font-weight: 500; font-size: 11pt;">' . htmlspecialchars($position) . '</span>';
                
                // QR Code placeholder - ukuran lebih besar - TANPA BORDER
                $html .= '<span style="display: flex; align-items: center; justify-content: center; background: white; width: 80px; height: 80px; margin-bottom: 8px; font-size: 10pt; color: #9ca3af;">QR</span>';
                
                // Signature image (optional)
                if ($showSignatureImage && $signatureImage) {
                    $html .= '<img src="' . htmlspecialchars($signatureImage) . '" alt="TTD" style="height: 40px; width: auto; object-fit: contain; margin-bottom: 8px; display: block;" />';
                }
                
                // Name dengan underline
                $html .= '<span style="display: inline-block; font-weight: 600; border-bottom: 1px solid #000; padding: 0 12px; margin-bottom: 4px; font-size: 11pt;">' . htmlspecialchars($userName) . '</span>';
                
                // NIP (optional)
                if ($nip) {
                    $html .= '<span style="display: block; font-size: 9pt;">NIP. ' . htmlspecialchars($nip) . '</span>';
                }
                
                $html .= '</span>'; // Close flex container
                $html .= '</span>'; // Close outer wrapper
                break;

            case 'signatureBlock':
                // Signature block baru untuk digunakan di dalam alignment table
                $userName = $content['attrs']['userName'] ?? 'Nama Penandatangan';
                $position = $content['attrs']['position'] ?? 'Jabatan';
                $nip = $content['attrs']['nip'] ?? null;
                $userId = $content['attrs']['userId'] ?? null;
                
                $userIdAttr = $userId ? ' data-user-id="' . htmlspecialchars($userId) . '" data-user-name="' . htmlspecialchars($userName) . '"' : '';
                $html = '<div data-type="signature-block"' . $userIdAttr . ' style="display: block; text-align: center; padding: 8px;">';
                
                // Position/Jabatan
                $html .= '<div style="margin-bottom: 8px; font-weight: 500; font-size: 11pt;">' . htmlspecialchars($position) . '</div>';
                
                // QR Code placeholder - 80px
                $html .= '<div style="display: flex; align-items: center; justify-content: center; background: white; width: 80px; height: 80px; margin: 0 auto 8px; font-size: 10pt; color: #9ca3af;">QR</div>';
                
                // Name dengan underline
                $html .= '<div style="font-weight: 600; border-bottom: 1px solid #000; padding: 0 12px; margin-bottom: 4px; display: inline-block; font-size: 11pt;">' . htmlspecialchars($userName) . '</div>';
                
                // NIP
                if ($nip) {
                    $html .= '<div style="font-size: 9pt;">NIP. ' . htmlspecialchars($nip) . '</div>';
                }
                
                $html .= '</div>';
                break;
        }

        return $html;
    }

    /**
     * Prepend letterhead to HTML
     */
    /**
     * Prepend letterhead to HTML content
     */
    public function prependLetterhead(string $html, array $letterhead): string
    {
        // New format: letterhead contains full logo image (base64 or URL)
        // Ukuran presisi: 700px x 147px (ukuran standar kop surat)
        if (!empty($letterhead['logo'])) {
            $letterheadHtml = '<div class="letterhead" style="width: 700px; max-width: 100%; margin: 0 0 0 0; padding: 0;">';
            $letterheadHtml .= "<img src='{$letterhead['logo']}' alt='Kop Surat' style='width: 700px; height: 147px; max-width: 100%; object-fit: contain; display: block; margin: 0; padding: 0;' />";
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
     * Add letterhead after each page break
     */
    public function addLetterheadAfterPageBreaks(string $html, array $letterhead): string
    {
        // Generate letterhead HTML
        $letterheadHtml = '';
        
        // New format: letterhead contains full logo image (base64 or URL)
        if (!empty($letterhead['logo'])) {
            $letterheadHtml = '<div class="letterhead" style="width: 700px; max-width: 100%; margin: 20px 0 0 0; padding: 0;">';
            $letterheadHtml .= "<img src='{$letterhead['logo']}' alt='Kop Surat' style='width: 700px; height: 147px; max-width: 100%; object-fit: contain; display: block; margin: 0; padding: 0;' />";
            $letterheadHtml .= '</div>';
        }
        // Legacy format: individual fields (backward compatibility)
        else if (!empty($letterhead['organization_name'])) {
            $letterheadHtml = '<div class="letterhead" style="margin-top: 20px;">';
            
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
        }
        
        if (empty($letterheadHtml)) {
            return $html;
        }
        
        // Replace page breaks with page break + letterhead
        $html = str_replace(
            '<div data-type="page-break" style="page-break-after: always;"></div>',
            '<div data-type="page-break" style="page-break-after: always;"></div>' . $letterheadHtml,
            $html
        );
        
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
    /**
     * Format date to Indonesian format
     */
    public function formatIndonesianDate($date): string
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
        // If this is a signature node (old format)
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
        
        // If this is a signatureBlock node (new format)
        if (isset($node['type']) && $node['type'] === 'signatureBlock') {
            $attrs = $node['attrs'] ?? [];
            
            // Only add if it has a userId (assigned to someone)
            if (!empty($attrs['userId'])) {
                $signatures[] = [
                    'userId' => $attrs['userId'],
                    'userName' => $attrs['userName'] ?? 'Nama Penandatangan',
                    'position' => $attrs['position'] ?? 'Jabatan',
                    'nip' => $attrs['nip'] ?? null,
                    'signatureIndex' => count($signatures), // Auto-increment
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
    
    /**
     * Auto-convert alignment patterns (Label : Value) to table for better alignment
     * Detects ALL GROUPS of consecutive paragraphs with pattern: Label [TAB/spaces] : Value
     * Works with regular paragraphs AND indented paragraphs (margin-left, padding-left)
     * Converts to: <table><tr><td width=150px>Label</td><td>: Value</td></tr></table>
     * This ensures colons align vertically regardless of label length
     * PRESERVES margin-left indentation from original paragraphs
     */
    private function convertAlignmentPatternsToTable(string $html): string
    {
        // Auto-convert "Label : Value" pattern to table for alignment
        // Match pattern: <p [with any style including margin/padding]>Label<span...></span>+:&nbsp;Value</p>
        // Updated pattern to handle indented paragraphs with inline styles and capture margin-left
        $pattern = '/<p([^>]*)>(\s*)([^<]+?)(<span[^>]*><\/span>)+\s*:\s*&nbsp;(.+?)<\/p>/i';
        
        preg_match_all($pattern, $html, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);
        
        if (empty($matches)) {
            return $html;
        }
        
        // Group consecutive matches (gap < 500 chars to allow indented sections)
        $groups = [];
        $currentGroup = [];
        $lastEnd = -1;
        
        foreach ($matches as $match) {
            $fullMatch = $match[0][0];
            $offset = $match[0][1];
            $pAttributes = $match[1][0]; // Capture <p> attributes (includes style)
            $whitespace = $match[2][0]; // Leading whitespace
            $label = trim($match[3][0]);
            $value = $match[5][0]; // Value is now at index 5
            
            // Extract margin-left from style attribute
            $marginLeft = '';
            if (preg_match('/margin-left:\s*(\d+)px/', $pAttributes, $styleMatch)) {
                $marginLeft = $styleMatch[1] . 'px';
            }
            
            // If gap too large, start new group
            if ($lastEnd > 0 && $offset > $lastEnd + 500) {
                // Save current group if it has enough items
                if (count($currentGroup) >= 2) {
                    $groups[] = $currentGroup;
                }
                $currentGroup = [];
            }
            
            $currentGroup[] = [
                'full' => $fullMatch,
                'offset' => $offset,
                'label' => $label,
                'value' => $value,
                'whitespace' => $whitespace,
                'marginLeft' => $marginLeft,
            ];
            
            $lastEnd = $offset + strlen($fullMatch);
        }
        
        // Don't forget last group
        if (count($currentGroup) >= 2) {
            $groups[] = $currentGroup;
        }
        
        if (empty($groups)) {
            return $html; // No groups with 2+ items
        }
        
        // Convert each group to table (in reverse order to maintain offsets)
        foreach (array_reverse($groups) as $group) {
            // Preserve indentation from first item
            $indent = $group[0]['whitespace'] ?? '';
            $marginLeft = $group[0]['marginLeft'] ?? '';
            
            // Add margin-left to table style if exists
            $tableStyle = 'width: 100%; border: none; border-collapse: collapse; margin: 0.5em 0;';
            if (!empty($marginLeft)) {
                $tableStyle .= ' margin-left: ' . $marginLeft . ';';
            }
            
            $tableHtml = $indent . '<table style="' . $tableStyle . '"><tbody>';
            
            foreach ($group as $item) {
                $tableHtml .= '<tr>';
                $tableHtml .= '<td style="border: none; padding: 2px 8px 2px 0; vertical-align: top; width: 150px;">' . $item['label'] . '</td>';
                $tableHtml .= '<td style="border: none; padding: 2px 0; vertical-align: top;">: ' . $item['value'] . '</td>';
                $tableHtml .= '</tr>';
            }
            
            $tableHtml .= '</tbody></table>';
            
            // Replace this group with table
            $firstOffset = $group[0]['offset'];
            $lastItem = end($group);
            $lastOffset = $lastItem['offset'];
            $lastLength = strlen($lastItem['full']);
            $totalLength = ($lastOffset + $lastLength) - $firstOffset;
            
            $html = substr_replace($html, $tableHtml, $firstOffset, $totalLength);
        }
        
        return $html;
    }
}
