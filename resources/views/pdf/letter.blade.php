<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $letter->letter_number }}</title>
    <style>
        @page {
            margin: 48px;
        }

        * {
            box-sizing: border-box;
        }

        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #000;
            margin: 0;
            padding: 0;
            background: white;
            white-space: pre-wrap;
            tab-size: 20;
            -moz-tab-size: 20;
        }

        /* Rich Text Styling - sama seperti preview */
        p {
            margin: 0;
            padding: 0;
            min-height: 1em;
        }

        p:empty::before {
            content: '\00a0';
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

        /* Table Styling - sama seperti preview */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }

        table td, table th {
            border: 1px solid #000;
            padding: 5px 8px;
            vertical-align: top;
        }

        table th {
            font-weight: bold;
            background-color: #f0f0f0;
        }

        /* Borderless table */
        table[style*="border: none"],
        table.borderless,
        table.borderless td,
        table.borderless th {
            border: none !important;
        }

        /* Table with specific border styles */
        table[style*="border:"] td,
        table[style*="border:"] th {
            border: inherit;
        }

        /* Heading Styles */
        h1, h2, h3, h4, h5, h6 {
            margin: 10px 0;
            font-weight: bold;
        }

        h1 {
            font-size: 18pt;
        }

        h2 {
            font-size: 16pt;
        }

        h3 {
            font-size: 14pt;
        }

        h4 {
            font-size: 12pt;
        }

        h5 {
            font-size: 11pt;
        }

        h6 {
            font-size: 10pt;
        }

        /* List Styles */
        ul, ol {
            margin: 5px 0;
            padding-left: 25px;
        }

        li {
            margin: 2px 0;
        }

        /* Image Styles */
        img {
            max-width: 100%;
            height: auto;
            display: inline-block;
        }

        /* QR Code Signature */
        img[alt="QR"],
        img[title*="Scan untuk verifikasi"],
        img[alt="Signature"] {
            display: inline-block;
            vertical-align: middle;
        }

        /* Span styling - untuk signature dan variable */
        span {
            display: inline;
        }

        /* Preserve inline styles dari TipTap */
        [style] {
            /* Biarkan inline styles dari HTML */
        }

        /* Text alignment */
        [style*="text-align: left"] {
            text-align: left !important;
        }

        [style*="text-align: center"] {
            text-align: center !important;
        }

        [style*="text-align: right"] {
            text-align: right !important;
        }

        [style*="text-align: justify"] {
            text-align: justify !important;
        }

        /* Line height */
        [style*="line-height"] {
            line-height: inherit !important;
        }

        /* Indentation */
        [style*="margin-left"] {
            margin-left: inherit !important;
        }

        /* Preserve colors */
        [style*="color:"] {
            color: inherit !important;
        }

        [style*="background-color:"] {
            background-color: inherit !important;
        }
    </style>
</head>
<body>
    {!! $letter->rendered_html !!}
</body>
</html>
