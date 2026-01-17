<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Surat Izin Pulang Cepat - {{ $earlyLeave->employee->user->name ?? 'Draft' }}</title>
    @php
        // Set locale to Indonesian
        \Carbon\Carbon::setLocale('id');
        
        // Use passed margins or fallback to template settings
        $marginTopMm = $pdfMargins['top'] ?? $template->page_settings['margins']['top'] ?? 25;
        $marginRightMm = $pdfMargins['right'] ?? $template->page_settings['margins']['right'] ?? 25;
        $marginBottomMm = $pdfMargins['bottom'] ?? $template->page_settings['margins']['bottom'] ?? 25;
        $marginLeftMm = $pdfMargins['left'] ?? $template->page_settings['margins']['left'] ?? 30;
    @endphp
    <style>
        @page {
            size: A4;
            margin: 0;
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
            padding: {{ $marginTopMm }}mm {{ $marginRightMm }}mm {{ $marginBottomMm }}mm {{ $marginLeftMm }}mm;
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
        
        .letter-opening {
            margin-bottom: 0;
        }
        
        .letter-date {
            margin-bottom: 10mm;
        }
        
        .field-group {
            margin-bottom: 0;
            display: block;
        }
        
        .field-group-row {
            display: block;
            margin-bottom: 0;
            page-break-inside: avoid;
        }
        
        .field-label {
            display: inline-block;
            vertical-align: top;
        }
        
        .field-separator {
            display: inline-block;
            width: 5mm;
            text-align: center;
        }
        
        .field-value {
            display: inline-block;
        }
        
        .signature-container {
            margin-top: {{ $template->signature_settings['margin_top'] ?? 30 }}mm;
        }
        
        .letter-content {
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
            margin-bottom: 5mm;
        }
        
        .signature-space {
            height: 15mm;
        }
    </style>
</head>
<body>
    @php
        $headerSettings = $template->header_settings;
        $signatureSettings = $template->signature_settings;
        
        // Variable values dari EarlyLeaveRequest
        $variableValues = [
            'nomor_surat' => $letterNumber ?? '',
            'tanggal_surat' => \Carbon\Carbon::now()->translatedFormat('d F Y'),
            'nama' => $earlyLeave->employee->user->name ?? '',
            'jabatan' => $earlyLeave->employee->position ?? '',
            'unit_kerja' => $earlyLeave->employee->organizationUnit->name ?? '',
            'tanggal_pulang_cepat' => $earlyLeave->date ? $earlyLeave->date->translatedFormat('d F Y') : '',
            'jam_pulang_cepat' => $earlyLeave->requested_leave_time ? $earlyLeave->requested_leave_time->format('H:i') : '',
            'alasan_pulang_cepat' => $earlyLeave->reason ?? '',
            'nama_rekan_yang_dilimpahkan_we' => $earlyLeave->delegation_to ?? '-',
        ];
        
        // Helper function to replace variables
        function replaceVarsEarly($text, $values) {
            if (!$text) return '';
            
            return preg_replace_callback('/\{\{(\w+)\}\}/', function($matches) use ($values) {
                $key = $matches[1];
                return $values[$key] ?? $matches[0];
            }, $text);
        }
        
        // Format date to Indonesian
        function formatDateIndoEarly($dateStr) {
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
                        {{ replaceVarsEarly($line['text'] ?? '', $variableValues) }}
                    </div>
                    @endforeach
                </div>
            </div>
        @endif
    </div>
    @endif
    
    {{-- Content Blocks --}}
    <div class="letter-content">
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
                $spacingAfterRecipient = $config['spacing_after_recipient'] ?? 10;
            @endphp
            <div class="letter-opening" style="{{ $marginStyle }} {{ $fontStyle }}">
                @if($dateConfig['enabled'] ?? false)
                <div class="letter-date" style="text-align: {{ $dateConfig['position'] ?? 'right' }}; margin-bottom: {{ $dateConfig['spacing_bottom'] ?? 10 }}mm;">
                    @if($dateConfig['show_place'] ?? false)
                        {{ $dateConfig['place_source'] === 'variable' ? replaceVarsEarly($dateConfig['place_text'] ?? '', $variableValues) : ($dateConfig['place_text'] ?? '') }}, 
                    @endif
                    {{ $dateConfig['date_source'] === 'variable' ? formatDateIndoEarly(replaceVarsEarly($dateConfig['date_variable'] ?? '', $variableValues)) : formatDateIndoEarly($dateConfig['date_manual'] ?? '') }}
                </div>
                @endif
                
                <div style="margin-bottom: {{ $spacingAfterRecipient }}mm;">
                @foreach(($config['recipient_slots'] ?? []) as $slot)
                @php
                    $slotText = $slot['text'] ?? '';
                    if (($slot['source'] ?? 'manual') === 'variable') {
                        $varName = str_replace(['{{', '}}'], '', $slotText);
                        $slotText = replaceVarsEarly('{{' . $varName . '}}', $variableValues);
                    }
                @endphp
                <div style="text-align: {{ $slot['text_align'] ?? 'left' }};">{{ $slot['prefix'] ?? '' }}{{ $slotText }}</div>
                @endforeach
                </div>
            </div>
        @elseif($block['type'] === 'text' || $block['type'] === 'paragraph')
            <div class="content-block" style="{{ $marginStyle }} {{ $fontStyle }}">
                {!! nl2br(e(replaceVarsEarly($block['content'] ?? '', $variableValues))) !!}
            </div>
        @elseif($block['type'] === 'field-group')
            @php
                $fieldGroup = $block['field_group'] ?? [];
                $labelWidth = $fieldGroup['label_width'] ?? 25;
                $separator = $fieldGroup['separator'] ?? ':';
            @endphp
            <div class="field-group" style="{{ $marginStyle }} {{ $fontStyle }}">
                @foreach(($fieldGroup['items'] ?? []) as $item)
                <div class="field-group-row">
                    <span class="field-label" style="width: {{ $labelWidth }}mm;">{{ $item['label'] ?? '' }}</span>
                    <span class="field-separator">{{ $separator }}</span>
                    <span class="field-value">{{ replaceVarsEarly($item['value'] ?? '', $variableValues) }}</span>
                </div>
                @endforeach
            </div>
        @elseif($block['type'] === 'spacer')
            <div style="height: {{ ($style['margin_top'] ?? 5) + ($style['margin_bottom'] ?? 5) }}mm;"></div>
        @elseif($block['type'] === 'page-break')
            <div style="page-break-after: always;"></div>
        @endif
    @endforeach
    </div><!-- End letter-content -->
    
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
            
            // Signature data
            $employeeName = $earlyLeave->employee->user->name ?? '[Nama]';
            $employeeNip = $earlyLeave->employee->user->nip ?? '[NIP]';
            $approverName = $earlyLeave->approver->name ?? '[Nama]';
            $approverNip = $earlyLeave->approver->nip ?? '[NIP]';
        @endphp
        
        <div class="signature-grid">
            @foreach($columns as $colIndex => $slots)
            <div class="signature-column" style="width: {{ 100 / $columnCount }}%;">
                @foreach($slots as $slotIndex => $slot)
                    @php
                        // Kolom 0 = Pemohon (Employee), Kolom 1 = Menyetujui (Approver)
                        $name = $colIndex === 0 ? $employeeName : $approverName;
                        $nip = $colIndex === 0 ? $employeeNip : $approverNip;
                    @endphp
                    <div class="signature-slot" style="text-align: {{ $slot['text_align'] ?? 'center' }}; font-size: {{ $slot['font_size'] ?? 12 }}pt;">
                        @if($slot['label_above'] ?? null)
                        <div>{{ replaceVarsEarly($slot['label_above'], $variableValues) }}</div>
                        @endif
                        @if($slot['label_position'] ?? null)
                        <div>{{ replaceVarsEarly($slot['label_position'], $variableValues) }}</div>
                        @endif
                        
                        <div class="signature-space" style="height: {{ $slot['signature_height'] ?? 25 }}mm;"></div>
                        
                        @if($slot['show_name'] ?? true)
                        <div style="font-weight: bold; text-decoration: underline;">
                            {{ $name }}
                        </div>
                        @endif
                        
                        @if($slot['show_nip'] ?? true)
                        <div style="font-size: 10pt;">
                            NIP. {{ $nip }}
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
