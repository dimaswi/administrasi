<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $letter->template->name }} - {{ $letter->number }}</title>
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
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.5;
            color: #000;
            background: white;
        }
        
        .page {
            width: 210mm;
            min-height: 297mm;
            padding: 20mm 25mm;
            margin: 0 auto;
            background: white;
            position: relative;
        }
        
        /* Letterhead - Full Width */
        .letterhead {
            margin: -20mm -25mm 20mm -25mm;
            padding: 0;
            width: 700px;
            height: 178px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .letterhead img {
            width: 700px;
            height: 178px;
            object-fit: cover;
            display: block;
        }
        
        /* Content */
        .content {
            margin-bottom: 40mm;
        }
        
        /* Signature Area - Dynamic layouts */
        .signature-container {
            margin-top: 30mm;
            page-break-inside: avoid;
            transform: scale(0.6);
            transform-origin: top center;
        }
        
        .signature-box {
            display: inline-block;
            text-align: center;
            min-width: 200px;
            vertical-align: top;
        }
        
        .signature-box .position {
            margin-bottom: 50px;
            font-size: 11pt;
        }
        
        .signature-box .qr-code {
            margin: 10px auto;
            width: 80px;
            height: 80px;
        }
        
        .signature-box .name {
            font-weight: bold;
            border-bottom: 1px solid #000;
            padding-bottom: 2px;
            margin: 0 auto;
            display: inline-block;
            min-width: 160px;
        }
        
        .signature-box .nip {
            font-size: 10pt;
            margin-top: 2px;
        }
        
        /* Layout: bottom_right_1 - Kanan bawah (1 TTD) */
        .signature-layout-bottom_right_1 {
            text-align: right;
            padding-right: 80px;
        }
        
        /* Layout: bottom_left_right - Kiri & Kanan (2 TTD) */
        .signature-layout-bottom_left_right {
            display: flex;
            justify-content: space-between;
            padding-left: 60px;
            padding-right: 60px;
        }
        
        /* Layout: three_signatures - 2 atas, 1 tengah bawah (3 TTD) */
        .signature-layout-three_signatures .signature-row-top {
            display: flex;
            justify-content: space-between;
            padding-left: 60px;
            padding-right: 60px;
            margin-bottom: 15mm;
        }
        
        .signature-layout-three_signatures .signature-row-bottom {
            text-align: center;
        }
        
        /* Layout: four_signatures - 2 atas, 2 bawah (4 TTD) */
        .signature-layout-four_signatures .signature-row {
            display: flex;
            justify-content: space-between;
            padding-left: 60px;
            padding-right: 60px;
            margin-bottom: 12mm;
        }
        
        .signature-layout-four_signatures .signature-row:last-child {
            margin-bottom: 0;
        }
        
        /* Untuk cetak */
        @media print {
            body {
                background: white;
            }
            
            .page {
                margin: 0;
                border: none;
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        <!-- LETTERHEAD - Full width dari template -->
        @if($letter->template->letterhead && isset($letter->template->letterhead['logo']))
        <div class="letterhead">
            <img src="{{ $letter->template->letterhead['logo'] }}" alt="Kop Surat">
        </div>
        @endif
        
        <!-- CONTENT - Dari TipTap Editor -->
        <div class="content">
            {!! $letter->rendered_content !!}
        </div>
        
        <!-- SIGNATURE - Dynamic layout dari template -->
        @php
            $signatureLayout = $letter->template->signature_layout ?? 'bottom_right_1';
            $signatures = $letter->template->signatures ?? [];
        @endphp
        
        @if(count($signatures) > 0)
        <div class="signature-container signature-layout-{{ $signatureLayout }}">
            @if($signatureLayout === 'bottom_right_1')
                <!-- Opsi 1: Kanan bawah (1 TTD) -->
                <div class="signature-box">
                    <div class="position">{{ $signatures[0]['position'] ?? 'Penandatangan' }}</div>
                    @if($letter->certificate)
                    <div class="qr-code">
                        {!! QrCode::size(80)->generate(route('verify-certificate', $letter->certificate)) !!}
                    </div>
                    @endif
                    <div class="name">{{ $signatures[0]['label'] ?? 'Nama Penandatangan' }}</div>
                </div>
                
            @elseif($signatureLayout === 'bottom_left_right')
                <!-- Opsi 2: Kiri & Kanan (2 TTD) -->
                @foreach($signatures as $index => $signature)
                <div class="signature-box">
                    <div class="position">{{ $signature['position'] ?? "Penandatangan " . ($index + 1) }}</div>
                    @if($letter->certificate && $index === 0)
                    <div class="qr-code">
                        {!! QrCode::size(80)->generate(route('verify-certificate', $letter->certificate)) !!}
                    </div>
                    @endif
                    <div class="name">{{ $signature['label'] ?? "Nama " . ($index + 1) }}</div>
                </div>
                @endforeach
                
            @elseif($signatureLayout === 'three_signatures')
                <!-- Opsi 3: 2 atas, 1 tengah bawah (3 TTD) -->
                <div class="signature-row-top">
                    @foreach(array_slice($signatures, 0, 2) as $index => $signature)
                    <div class="signature-box">
                        <div class="position">{{ $signature['position'] ?? "Penandatangan " . ($index + 1) }}</div>
                        <div class="name">{{ $signature['label'] ?? "Nama " . ($index + 1) }}</div>
                    </div>
                    @endforeach
                </div>
                <div class="signature-row-bottom">
                    @if(isset($signatures[2]))
                    <div class="signature-box">
                        <div class="position">{{ $signatures[2]['position'] ?? 'Mengetahui' }}</div>
                        @if($letter->certificate)
                        <div class="qr-code">
                            {!! QrCode::size(80)->generate(route('verify-certificate', $letter->certificate)) !!}
                        </div>
                        @endif
                        <div class="name">{{ $signatures[2]['label'] ?? 'Nama 3' }}</div>
                    </div>
                    @endif
                </div>
                
            @elseif($signatureLayout === 'four_signatures')
                <!-- Opsi 4: 2 atas, 2 bawah (4 TTD) -->
                <div class="signature-row">
                    @foreach(array_slice($signatures, 0, 2) as $index => $signature)
                    <div class="signature-box">
                        <div class="position">{{ $signature['position'] ?? "Penandatangan " . ($index + 1) }}</div>
                        <div class="name">{{ $signature['label'] ?? "Nama " . ($index + 1) }}</div>
                    </div>
                    @endforeach
                </div>
                <div class="signature-row">
                    @foreach(array_slice($signatures, 2, 2) as $index => $signature)
                    <div class="signature-box">
                        <div class="position">{{ $signature['position'] ?? "Penandatangan " . ($index + 3) }}</div>
                        @if($letter->certificate && $index === 1)
                        <div class="qr-code">
                            {!! QrCode::size(80)->generate(route('verify-certificate', $letter->certificate)) !!}
                        </div>
                        @endif
                        <div class="name">{{ $signature['label'] ?? "Nama " . ($index + 3) }}</div>
                    </div>
                    @endforeach
                </div>
            @endif
        </div>
        @endif
    </div>
</body>
</html>
