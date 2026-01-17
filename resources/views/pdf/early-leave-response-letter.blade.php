<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Surat Balasan Izin Pulang Cepat - {{ $earlyLeave->employee->user->name ?? 'Draft' }}</title>
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
        
        // Variable values dari EarlyLeave
        $variableValues = [
            'nomor_surat' => $letterNumber ?? '',
            'tanggal_surat' => \Carbon\Carbon::now()->translatedFormat('d F Y'),
            'nama' => $earlyLeave->employee->user->name ?? '',
            'nik' => $earlyLeave->employee->employee_id ?? '',
            'nip' => $earlyLeave->employee->user->nip ?? '',
            'jabatan' => $earlyLeave->employee->position ?? ($earlyLeave->employee->jobCategory->name ?? ''),
            'unit_kerja' => $earlyLeave->employee->organizationUnit->name ?? '',
            'tanggal_izin' => $earlyLeave->date ? $earlyLeave->date->translatedFormat('d F Y') : '',
            'waktu_pulang' => $earlyLeave->requested_leave_time ? $earlyLeave->requested_leave_time->format('H:i') : '',
            'waktu_jadwal' => $earlyLeave->scheduled_leave_time ? $earlyLeave->scheduled_leave_time->format('H:i') : '',
            'alasan' => $earlyLeave->reason ?? '',
        ];
        
        // Get director info
        $directorName = $earlyLeave->director->name ?? '[Nama Direktur]';
        $directorNip = $earlyLeave->director->nip ?? '[NIP]';
        
        // Get unit head info (supervisor who approved)
        $unitHeadName = $earlyLeave->supervisor->name ?? '[Nama Kepala Unit]';
        $unitHeadNip = $earlyLeave->supervisor->nip ?? '[NIP]';
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
                        {{ $line['text'] ?? '' }}
                    </div>
                    @endforeach
                </div>
            </div>
        @endif
    </div>
    @endif
    
    {{-- Title --}}
    <div class="letter-title" style="text-decoration: underline;">
        SURAT PEMBERIAN IZIN PULANG CEPAT
    </div>
    <div class="letter-number">
        Nomor : {{ $letterNumber ?? '-' }}
    </div>
    
    {{-- Content --}}
    <div class="content-block" style="margin-bottom: 5mm;">
        <em>Assalamualaikum Wr.Wb</em>
    </div>
    
    <div class="content-block" style="margin-bottom: 5mm;">
        Dengan Hormat,<br>
        Diberikan izin pulang cepat kepada karyawan klinik dibawah ini :
    </div>
    
    {{-- Employee Info --}}
    <div class="field-group" style="margin-bottom: 5mm;">
        <div class="field-group-row">
            <span class="field-label" style="width: 30mm;">Nama</span>
            <span class="field-separator">:</span>
            <span class="field-value">{{ $variableValues['nama'] }}</span>
        </div>
        <div class="field-group-row">
            <span class="field-label" style="width: 30mm;">NIK</span>
            <span class="field-separator">:</span>
            <span class="field-value">{{ $variableValues['nik'] }}</span>
        </div>
        <div class="field-group-row">
            <span class="field-label" style="width: 30mm;">Jabatan</span>
            <span class="field-separator">:</span>
            <span class="field-value">{{ $variableValues['jabatan'] }}</span>
        </div>
        <div class="field-group-row">
            <span class="field-label" style="width: 30mm;">Unit Kerja</span>
            <span class="field-separator">:</span>
            <span class="field-value">{{ $variableValues['unit_kerja'] }}</span>
        </div>
        <div class="field-group-row">
            <span class="field-label" style="width: 30mm;">Tanggal</span>
            <span class="field-separator">:</span>
            <span class="field-value">{{ $variableValues['tanggal_izin'] }}</span>
        </div>
        <div class="field-group-row">
            <span class="field-label" style="width: 30mm;">Waktu Pulang</span>
            <span class="field-separator">:</span>
            <span class="field-value">{{ $variableValues['waktu_pulang'] }} WIB (Jadwal: {{ $variableValues['waktu_jadwal'] }} WIB)</span>
        </div>
        <div class="field-group-row">
            <span class="field-label" style="width: 30mm;">Alasan</span>
            <span class="field-separator">:</span>
            <span class="field-value">{{ $variableValues['alasan'] }}</span>
        </div>
    </div>
    
    {{-- Conditions --}}
    <div class="content-block" style="margin-bottom: 5mm; text-align: justify;">
        Dengan ketentuan sebagai berikut :
    </div>
    
    <ol class="conditions-list" style="margin-bottom: 5mm;">
        <li>Sebelum pulang wajib menyerahkan pekerjaan pada atasan / pejabat yang ditunjuk;</li>
        <li>Apabila keesokan hari masuk kerja, wajib melaporkan diri kepada PSDI dan bekerja kembali sebagaimana biasa.</li>
    </ol>
    
    {{-- Closing --}}
    <div class="content-block" style="margin-bottom: 10mm; text-align: justify;">
        Demikian surat izin pulang cepat ini dibuat untuk dapat dipergunakan sebagaimana mestinya.
    </div>
    
    <div class="content-block" style="margin-bottom: 15mm;">
        <em>Nasruminallah wafathungqorieb</em><br>
        <em>Wassalamualaikum Wr.Wb</em>
    </div>
    
    {{-- Signature Section --}}
    <div class="signature-container">
        <div class="signature-grid">
            {{-- Left Column - Mengetahui --}}
            <div class="signature-column" style="width: 50%;">
                <div class="signature-slot" style="text-align: center;">
                    <div>Mengetahui</div>
                    <div class="signature-space"></div>
                    <div style="font-weight: bold; text-decoration: underline;">{{ $unitHeadName }}</div>
                    <div style="font-size: 10pt;">NIP. {{ $unitHeadNip }}</div>
                    <div style="font-weight: bold;">Pimpinan</div>
                </div>
            </div>
            
            {{-- Right Column - Director --}}
            <div class="signature-column" style="width: 50%;">
                <div class="signature-slot" style="text-align: center;">
                    <div>Bojonegoro, {{ \Carbon\Carbon::now()->translatedFormat('d F Y') }}</div>
                    <div class="signature-space"></div>
                    <div style="font-weight: bold; text-decoration: underline;">{{ $directorName }}</div>
                    <div style="font-size: 10pt;">NIP. {{ $directorNip }}</div>
                    <div style="font-weight: bold;">Kepala Unit PSDI</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
