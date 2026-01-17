<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Surat Balasan Cuti - {{ $leave->employee->user->name ?? 'Draft' }}</title>
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
        
        .letter-title {
            text-align: center;
            font-weight: bold;
            margin-bottom: 5mm;
        }
        
        .letter-number {
            text-align: center;
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
            height: 20mm;
        }
        
        .conditions-list {
            margin-left: 5mm;
        }
        
        .conditions-list li {
            margin-bottom: 2mm;
        }
    </style>
</head>
<body>
    @php
        $headerSettings = $template->header_settings;
        $signatureSettings = $template->signature_settings;
        
        // Variable values dari Leave
        $variableValues = [
            'nomor_surat' => $letterNumber ?? '',
            'tanggal_surat' => \Carbon\Carbon::now()->translatedFormat('d F Y'),
            'nama' => $leave->employee->user->name ?? '',
            'nik' => $leave->employee->employee_id ?? '',
            'nip' => $leave->employee->user->nip ?? '',
            'jabatan' => $leave->employee->position ?? ($leave->employee->jobCategory->name ?? ''),
            'unit_kerja' => $leave->employee->organizationUnit->name ?? '',
            'hari_cuti' => $leave->total_days ?? '',
            'tanggal_mulai_cuti' => $leave->start_date ? $leave->start_date->translatedFormat('d F Y') : '',
            'tanggal_selesai_cuti' => $leave->end_date ? $leave->end_date->translatedFormat('d F Y') : '',
            'jenis_cuti' => $leave->leaveType->name ?? '',
        ];
        
        // Helper function to replace variables
        if (!function_exists('replaceVarsResponse')) {
            function replaceVarsResponse($text, $values) {
                if (!$text) return '';
                
                // Pattern: double curly braces with word inside
                $pattern = '/' . '\{\{' . '(\w+)' . '\}\}' . '/';
                return preg_replace_callback($pattern, function($matches) use ($values) {
                    $key = $matches[1];
                    return $values[$key] ?? $matches[0];
                }, $text);
            }
        }
        
        // Get director info (Pimpinan - Organization Level 1)
        $directorName = $leave->director->name ?? '[Nama Direktur]';
        $directorNip = $leave->director->nip ?? '[NIP]';

        // Get HR Approver info (Kepala Unit PSDI)
        $approverName = $leave->approver->name ?? '[Nama Kepala Unit PSDI]';
        $approverNip = $leave->approver->nip ?? '[NIP]';
    @endphp
    
    {{-- Header --}}
    @if($headerSettings['enabled'] ?? false)
    <div class="header">
        @if(($headerSettings['use_image'] ?? false) && !empty($headerSettings['header_image']['src'] ?? null))
            <img src="{{ $headerSettings['header_image']['src'] }}" style="width: 100%; max-height: {{ $headerSettings['header_image']['height'] ?? 40 }}mm;">
        @else
            <div class="header-content">
                @if(($headerSettings['logo']['enabled'] ?? false) && !empty($headerSettings['logo']['src'] ?? null))
                <div class="header-logo">
                    <img src="{{ $headerSettings['logo']['src'] }}" alt="Logo">
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
                        {{ replaceVarsResponse($line['text'] ?? '', $variableValues) }}
                    </div>
                    @endforeach
                </div>
            </div>
        @endif
    </div>
    @endif
    
    {{-- Title --}}
    <div class="letter-title" style="text-decoration: underline;">
        SURAT PEMBERIAN IZIN CUTI
    </div>
    <div class="letter-number">
        Nomor : {{ $letterNumber ?? '[nomor_surat]' }}
    </div>
    
    {{-- Content --}}
    <div class="content-block" style="margin-bottom: 5mm;">
        <em>Assalamualaikum Wr.Wb</em>
    </div>
    
    <div class="content-block" style="margin-bottom: 5mm;">
        Dengan Hormat,<br>
        Diberikan cuti kepada karyawan klinik dibawah ini :
    </div>
    
    {{-- Employee Info --}}
    <div class="field-group" style="margin-bottom: 5mm;">
        <div class="field-group-row">
            <span class="field-label" style="width: 25mm;">Nama</span>
            <span class="field-separator">:</span>
            <span class="field-value">{{ $variableValues['nama'] }}</span>
        </div>
        <div class="field-group-row">
            <span class="field-label" style="width: 25mm;">NIK</span>
            <span class="field-separator">:</span>
            <span class="field-value">{{ $variableValues['nik'] }}</span>
        </div>
        <div class="field-group-row">
            <span class="field-label" style="width: 25mm;">Jabatan</span>
            <span class="field-separator">:</span>
            <span class="field-value">{{ $variableValues['jabatan'] }}</span>
        </div>
        <div class="field-group-row">
            <span class="field-label" style="width: 25mm;">Unit Kerja</span>
            <span class="field-separator">:</span>
            <span class="field-value">{{ $variableValues['unit_kerja'] }}</span>
        </div>
    </div>
    
    {{-- Leave Period --}}
    <div class="content-block" style="margin-bottom: 5mm; text-align: justify;">
        Selama {{ $variableValues['hari_cuti'] }} hari terhitung mulai tanggal {{ $variableValues['tanggal_mulai_cuti'] }} sampai dengan {{ $variableValues['tanggal_selesai_cuti'] }} dengan ketentuan sebagai berikut :
    </div>
    
    {{-- Conditions --}}
    <ol class="conditions-list" style="margin-bottom: 5mm;">
        <li>Sebelum menjalankan cuti wajib menyerahkan pekerjaan pada atasan /pejabat yang ditunjuk;</li>
        <li>Setelah menjalankan cuti wajib melaporkan diri kepada PSDI dan bekerja kembali sebagaimana biasa.</li>
    </ol>
    
    {{-- Closing --}}
    <div class="content-block" style="margin-bottom: 10mm; text-align: justify;">
        Demikian surat izin cuti ini dibuat untuk dapat dipergunakan sebagaimana mestinya.
    </div>
    
    <div class="content-block" style="margin-bottom: 15mm;">
        <em>Nasruminallah wafathungqorieb</em><br>
        <em>Wassalamualaikum Wr.Wb</em>
    </div>
    
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
                @foreach($slots as $slotIndex => $slot)
                    @php
                        // Kolom 0 = Pimpinan (Mengetahui/Director), Kolom 1 = Kepala Unit PSDI (HR Approver)
                        if ($colIndex === 0) {
                            $name = $directorName;
                            $nip = $directorNip;
                        } else {
                            $name = $approverName;
                            $nip = $approverNip;
                        }
                    @endphp
                    <div class="signature-slot" style="text-align: {{ $slot['text_align'] ?? 'center' }}; font-size: {{ $slot['font_size'] ?? 12 }}pt;">
                        @if($slot['label_above'] ?? null)
                        <div>{{ replaceVarsResponse($slot['label_above'], $variableValues) }}</div>
                        @endif
                        @if($slot['label_position'] ?? null)
                        <div>{{ replaceVarsResponse($slot['label_position'], $variableValues) }}</div>
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

                        @if($slot['label_below'] ?? null)
                        <div style="font-weight: bold;">
                            {{ replaceVarsResponse($slot['label_below'], $variableValues) }}
                        </div>
                        @endif
                    </div>
                @endforeach
            </div>
            @endforeach
        </div>
    </div>
    @else
    {{-- Fallback jika template belum dikonfigurasi --}}
    <div class="signature-container">
        <div class="signature-grid">
            {{-- Left Column - Mengetahui (Pimpinan/Director) --}}
            <div class="signature-column" style="width: 50%;">
                <div class="signature-slot" style="text-align: center;">
                    <div>Mengetahui</div>
                    <div class="signature-space"></div>
                    <div style="font-weight: bold; text-decoration: underline;">{{ $directorName }}</div>
                    <div style="font-size: 10pt;">NIP. {{ $directorNip }}</div>
                    <div style="font-weight: bold;">Pimpinan</div>
                </div>
            </div>

            {{-- Right Column - Kepala Unit PSDI (HR Approver) --}}
            <div class="signature-column" style="width: 50%;">
                <div class="signature-slot" style="text-align: center;">
                    <div>Bojonegoro, {{ \Carbon\Carbon::now()->translatedFormat('d F Y') }}</div>
                    <div class="signature-space"></div>
                    <div style="font-weight: bold; text-decoration: underline;">{{ $approverName }}</div>
                    <div style="font-size: 10pt;">NIP. {{ $approverNip }}</div>
                    <div style="font-weight: bold;">Kepala Unit PSDI</div>
                </div>
            </div>
        </div>
    </div>
    @endif
</body>
</html>
