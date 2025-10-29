<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $letter->letter_number }}</title>
    <style>
        @page {
            margin: 2cm 2cm 3cm 2cm;
        }

        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #000;
        }

        .letterhead {
            text-align: center;
            border-bottom: 3px solid #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }

        .letterhead img.logo {
            height: 60px;
            margin-bottom: 10px;
        }

        .letterhead h2 {
            font-size: 16pt;
            margin: 5px 0;
            font-weight: bold;
            text-transform: uppercase;
        }

        .letterhead p {
            font-size: 10pt;
            margin: 3px 0;
        }

        .letter-meta {
            margin: 20px 0;
        }

        .letter-meta table {
            width: 100%;
            border: none;
        }

        .letter-meta td {
            padding: 3px 0;
            vertical-align: top;
        }

        .letter-meta td:first-child {
            width: 100px;
        }

        .letter-meta td:nth-child(2) {
            width: 10px;
        }

        .letter-content {
            text-align: justify;
            margin: 20px 0;
        }

        .letter-content p {
            margin: 10px 0;
        }

        .letter-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }

        .letter-content table th,
        .letter-content table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
        }

        .letter-content table th {
            background-color: #f0f0f0;
            font-weight: bold;
        }

        .signature-block {
            margin-top: 40px;
            float: right;
            text-align: center;
            width: 200px;
        }

        .signature-block p {
            margin: 5px 0;
        }

        .signature-space {
            height: 60px;
        }

        .qr-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            border: 1px solid #ccc;
            padding: 10px;
            background: white;
            text-align: center;
        }

        .qr-code img {
            width: 100px;
            height: 100px;
        }

        .certificate-info {
            font-size: 7pt;
            margin-top: 5px;
            color: #666;
        }

        .certificate-info p {
            margin: 2px 0;
        }

        /* Clear float */
        .clearfix::after {
            content: "";
            display: table;
            clear: both;
        }

        h1, h2, h3, h4, h5, h6 {
            margin: 15px 0 10px 0;
        }

        ul, ol {
            margin: 10px 0;
            padding-left: 30px;
        }

        li {
            margin: 5px 0;
        }

        strong {
            font-weight: bold;
        }

        em {
            font-style: italic;
        }

        u {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <!-- Letter Content -->
    <div class="letter-document">
        {!! $letter->rendered_html !!}
    </div>

    <!-- QR Code for Certificate Verification -->
    @if($certificate && $qrCode)
    <div class="qr-container">
        <div class="qr-code">
            <img src="data:image/png;base64,{{ $qrCode }}" alt="QR Code">
        </div>
        <div class="certificate-info">
            <p><strong>Certificate ID:</strong></p>
            <p>{{ $certificate->certificate_id }}</p>
            <p><strong>Signed:</strong></p>
            <p>{{ $certificate->signed_at->format('d/m/Y H:i') }}</p>
            <p style="font-size: 6pt; margin-top: 5px;">Scan untuk verifikasi</p>
        </div>
    </div>
    @endif
</body>
</html>
