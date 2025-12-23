<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $letter->letter_number ?? 'Surat' }}</title>
    <style>
        @page {
            margin: {{ $template->page_settings['margins']['top'] ?? 25 }}mm 
                    {{ $template->page_settings['margins']['right'] ?? 25 }}mm 
                    {{ $template->page_settings['margins']['bottom'] ?? 25 }}mm 
                    {{ $template->page_settings['margins']['left'] ?? 30 }}mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: '{{ $template->page_settings['default_font']['family'] ?? 'Times New Roman' }}', Times, serif;
            font-size: {{ $template->page_settings['default_font']['size'] ?? 12 }}pt;
            line-height: {{ $template->page_settings['default_font']['line_height'] ?? 1.5 }};
            color: #000;
        }
        
        .header {
            margin-bottom: {{ $template->header_settings['margin_bottom'] ?? 10 }}mm;
            @if($template->header_settings['border_bottom']['enabled'] ?? false)
            border-bottom: {{ $template->header_settings['border_bottom']['width'] ?? 2 }}px 
                          {{ $template->header_settings['border_bottom']['style'] ?? 'solid' }} 
                          {{ $template->header_settings['border_bottom']['color'] ?? '#000' }};
            padding-bottom: 8px;
            @endif
        }
        
        .header-content {
            display: table;
            width: 100%;
        }
        
        .header-logo {
            display: table-cell;
            vertical-align: middle;
            width: {{ $template->header_settings['logo']['width'] ?? 25 }}mm;
            padding-right: {{ $template->header_settings['logo']['margin'] ?? 5 }}mm;
        }
        
        .header-logo img {
            max-width: {{ $template->header_settings['logo']['width'] ?? 25 }}mm;
            height: auto;
        }
        
        .header-text {
            display: table-cell;
            vertical-align: middle;
        }
        
        .header-text-line {
            text-align: center;
        }
        
        .content-block {
            margin-bottom: 0;
        }
        
        .text-left { text-align: left; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-justify { text-align: justify; }
        
        .font-bold { font-weight: bold; }
        .font-italic { font-style: italic; }
        .underline { text-decoration: underline; }
        
        .signature-container {
            margin-top: {{ $template->signature_settings['margin_top'] ?? 30 }}mm;
        }
        
        .signature-grid {
            display: table;
            width: 100%;
        }
        
        .signature-column {
            display: table-cell;
            vertical-align: top;
            padding: 0 10px;
        }
        
        .signature-slot {
            margin-bottom: 10mm;
        }
        
        .signature-space {
            height: 25mm;
        }
        
        .field-group {
            margin-bottom: 2mm;
        }
        
        .field-label {
            display: inline-block;
            width: 25mm;
        }
        
        .field-separator {
            display: inline-block;
            width: 5mm;
        }
        
        .letter-opening {
            margin-bottom: 10mm;
        }
        
        .letter-date {
            margin-bottom: 10mm;
        }
    </style>
</head>
<body>
    @php
        $headerSettings = $template->header_settings;
        $signatureSettings = $template->signature_settings;
        $variableValues = $letter->variable_values ?? [];
        
        // Helper function to replace variables
        function replaceVars($text, $values, $letter) {
            if (!$text) return '';
            
            // System variables
            $values['tanggal_surat'] = $letter->letter_date ? \Carbon\Carbon::parse($letter->letter_date)->translatedFormat('d F Y') : '';
            $values['nomor_surat'] = $letter->letter_number ?? '';
            $values['perihal'] = $letter->subject ?? '';
            
            return preg_replace_callback('/\{\{(\w+)\}\}/', function($matches) use ($values) {
                $key = $matches[1];
                return $values[$key] ?? $matches[0];
            }, $text);
        }
        
        // Format date to Indonesian
        function formatDateIndo($dateStr) {
            if (!$dateStr) return '';
            try {
                return \Carbon\Carbon::parse($dateStr)->translatedFormat('d F Y');
            } catch (\Exception $e) {
                return $dateStr;
            }
        }
    @endphp
    
    {{-- Header --}}
    @if($headerSettings['enabled'] ?? false)
    <div class="header">
        @if($headerSettings['use_image'] && ($headerSettings['header_image']['src'] ?? null))
            <img src="{{ $headerSettings['header_image']['src'] }}" style="width: 100%; max-height: {{ $headerSettings['header_image']['height'] ?? 40 }}mm;">
        @else
            <div class="header-content">
                @if($headerSettings['logo']['enabled'] ?? false)
                <div class="header-logo">
                    @if($headerSettings['logo']['src'] ?? null)
                        <img src="{{ $headerSettings['logo']['src'] }}" alt="Logo">
                    @endif
                </div>
                @endif
                <div class="header-text">
                    @foreach(($headerSettings['text_lines'] ?? []) as $line)
                    <div class="header-text-line" style="
                        font-size: {{ $line['font_size'] ?? 12 }}pt;
                        font-weight: {{ $line['font_weight'] ?? 'normal' }};
                        @if($line['font_style'] ?? false) font-style: {{ $line['font_style'] }}; @endif
                        @if($line['text_decoration'] ?? false) text-decoration: {{ $line['text_decoration'] }}; @endif
                    ">
                        {{ replaceVars($line['text'] ?? '', $variableValues, $letter) }}
                    </div>
                    @endforeach
                </div>
            </div>
        @endif
    </div>
    @endif
    
    {{-- Content Blocks --}}
    @foreach(($template->content_blocks ?? []) as $block)
        @php
            $style = $block['style'] ?? [];
            $marginStyle = sprintf(
                'margin: %smm %smm %smm %smm;',
                $style['margin_top'] ?? 0,
                $style['margin_right'] ?? 0,
                $style['margin_bottom'] ?? 0,
                $style['margin_left'] ?? 0
            );
            $fontStyle = '';
            if ($style['font_family'] ?? null) $fontStyle .= "font-family: {$style['font_family']};";
            if ($style['font_size'] ?? null) $fontStyle .= "font-size: {$style['font_size']}pt;";
            if ($style['font_weight'] ?? null) $fontStyle .= "font-weight: {$style['font_weight']};";
            if ($style['font_style'] ?? null) $fontStyle .= "font-style: {$style['font_style']};";
            if ($style['text_align'] ?? null) $fontStyle .= "text-align: {$style['text_align']};";
            if ($style['line_height'] ?? null) $fontStyle .= "line-height: {$style['line_height']};";
            if ($style['indent_first_line'] ?? 0) $fontStyle .= "text-indent: {$style['indent_first_line']}mm;";
        @endphp
        
        @if($block['type'] === 'letter-opening')
            @php
                $config = $block['letter_opening'] ?? [];
                $dateConfig = $config['date'] ?? [];
            @endphp
            <div class="letter-opening" style="{{ $marginStyle }}">
                @if($dateConfig['enabled'] ?? false)
                <div class="letter-date" style="text-align: {{ $dateConfig['position'] ?? 'right' }}; margin-bottom: {{ $dateConfig['spacing_bottom'] ?? 10 }}mm;">
                    @if($dateConfig['show_place'] ?? false)
                        {{ $dateConfig['place_source'] === 'variable' ? replaceVars($dateConfig['place_text'] ?? '', $variableValues, $letter) : ($dateConfig['place_text'] ?? '') }}, 
                    @endif
                    {{ $dateConfig['date_source'] === 'variable' ? formatDateIndo(replaceVars($dateConfig['date_variable'] ?? '', $variableValues, $letter)) : formatDateIndo($dateConfig['date_manual'] ?? '') }}
                </div>
                @endif
                
                @foreach(($config['recipient_slots'] ?? []) as $slot)
                @php
                    $slotText = $slot['text'] ?? '';
                    if ($slot['source'] === 'variable') {
                        $varName = str_replace(['{{', '}}'], '', $slotText);
                        $slotText = replaceVars('{{' . $varName . '}}', $variableValues, $letter);
                    }
                @endphp
                <div style="text-align: {{ $slot['text_align'] ?? 'left' }};">
                    {{ $slot['prefix'] ?? '' }}{{ $slotText }}
                </div>
                @endforeach
            </div>
        @elseif($block['type'] === 'text' || $block['type'] === 'paragraph')
            <div class="content-block" style="{{ $marginStyle }} {{ $fontStyle }}">
                {!! nl2br(e(replaceVars($block['content'] ?? '', $variableValues, $letter))) !!}
            </div>
        @elseif($block['type'] === 'field-group')
            @php
                $fieldGroup = $block['field_group'] ?? [];
                $labelWidth = $fieldGroup['label_width'] ?? 25;
                $separator = $fieldGroup['separator'] ?? ':';
            @endphp
            <div style="{{ $marginStyle }}">
                @foreach(($fieldGroup['items'] ?? []) as $item)
                <div class="field-group">
                    <span class="field-label" style="width: {{ $labelWidth }}mm;">{{ $item['label'] ?? '' }}</span>
                    <span class="field-separator">{{ $separator }}</span>
                    <span>{{ replaceVars($item['value'] ?? '', $variableValues, $letter) }}</span>
                </div>
                @endforeach
            </div>
        @elseif($block['type'] === 'spacer')
            <div style="height: {{ ($style['margin_top'] ?? 5) + ($style['margin_bottom'] ?? 5) }}mm;"></div>
        @elseif($block['type'] === 'page-break')
            <div style="page-break-after: always;"></div>
        @elseif($block['type'] === 'table')
            @php
                $tableConfig = $block['table_config'] ?? [];
                $rows = $tableConfig['rows'] ?? [];
                $hasBorder = $tableConfig['border'] ?? true;
                $borderColor = $tableConfig['border_color'] ?? '#000000';
                $headerRow = $tableConfig['header_row'] ?? true;
                $cellPadding = $tableConfig['cell_padding'] ?? 2;
                $columnWidths = $tableConfig['column_widths'] ?? [];
            @endphp
            @if(count($rows) > 0)
            <div style="{{ $marginStyle }}">
                <table style="width: 100%; border-collapse: collapse; {{ $fontStyle }}">
                    @foreach($rows as $rowIndex => $row)
                        @php
                            $isHeader = $rowIndex === 0 && $headerRow;
                        @endphp
                        <tr>
                            @foreach($row as $colIndex => $cell)
                                @php
                                    $cellAlign = $cell['align'] ?? 'left';
                                    $cellBold = $cell['bold'] ?? false;
                                    $cellContent = replaceVars($cell['content'] ?? '', $variableValues, $letter);
                                    $colWidth = isset($columnWidths[$colIndex]) ? $columnWidths[$colIndex] . '%' : 'auto';
                                    $cellColspan = $cell['colspan'] ?? 1;
                                    $cellRowspan = $cell['rowspan'] ?? 1;
                                    $borderStyle = $hasBorder ? "border: 1px solid {$borderColor};" : '';
                                    $bgColor = $isHeader ? 'background-color: #f3f4f6;' : '';
                                @endphp
                                @if($isHeader)
                                    <th style="{{ $borderStyle }} padding: {{ $cellPadding }}mm; text-align: {{ $cellAlign }}; font-weight: bold; {{ $bgColor }} width: {{ $colWidth }};" colspan="{{ $cellColspan }}" rowspan="{{ $cellRowspan }}">
                                        {{ $cellContent }}
                                    </th>
                                @else
                                    <td style="{{ $borderStyle }} padding: {{ $cellPadding }}mm; text-align: {{ $cellAlign }}; {{ $cellBold ? 'font-weight: bold;' : '' }} width: {{ $colWidth }};" colspan="{{ $cellColspan }}" rowspan="{{ $cellRowspan }}">
                                        {{ $cellContent }}
                                    </td>
                                @endif
                            @endforeach
                        </tr>
                    @endforeach
                </table>
            </div>
            @endif
        @endif
    @endforeach
    
    {{-- Signature Section --}}
    @if(count($signatureSettings['slots'] ?? []) > 0)
    <div class="signature-container">
        @php
            $columnCount = (int) explode('-', $signatureSettings['layout'] ?? '2-column')[0];
            $columns = [];
            $allSlots = collect($signatureSettings['slots'] ?? []);
            for ($i = 0; $i < $columnCount; $i++) {
                $columns[$i] = $allSlots->filter(function($s) use ($i) { return ($s['column'] ?? 0) == $i; })->sortBy('order')->values();
            }
        @endphp
        
        <div class="signature-grid">
            @foreach($columns as $colIndex => $slots)
            <div class="signature-column" style="width: {{ 100 / $columnCount }}%;">
                @foreach($slots as $slot)
                    @php
                        $signatory = $signatories->firstWhere('slot_id', $slot['id']);
                        $user = $signatory?->user;
                        $isSigned = $signatory && $signatory->signed_at;
                    @endphp
                    <div class="signature-slot" style="text-align: {{ $slot['text_align'] ?? 'center' }}; font-size: {{ $slot['font_size'] ?? 12 }}pt;">
                        @if($slot['label_above'] ?? null)
                        <div>{{ replaceVars($slot['label_above'], $variableValues, $letter) }}</div>
                        @endif
                        @if($slot['label_position'] ?? null)
                        <div>{{ replaceVars($slot['label_position'], $variableValues, $letter) }}</div>
                        @endif
                        
                        <div class="signature-space" style="height: {{ $slot['signature_height'] ?? 25 }}mm;">
                            @if($isSigned)
                            <div style="text-align: center; color: green; font-style: italic; font-size: 10pt; padding-top: 10mm;">
                                ✓ Ditandatangani Digital
                            </div>
                            @endif
                        </div>
                        
                        @if($slot['show_name'] ?? true)
                        <div style="font-weight: bold; text-decoration: underline;">
                            {{ $user?->name ?? '[Nama]' }}
                        </div>
                        @endif
                        
                        @if($slot['show_nip'] ?? true)
                        <div style="font-size: 10pt;">
                            NIP. {{ $user?->nip ?? '[NIP]' }}
                        </div>
                        @endif
                    </div>
                @endforeach
            </div>
            @endforeach
        </div>
    </div>
    @endif
</body>
</html>
