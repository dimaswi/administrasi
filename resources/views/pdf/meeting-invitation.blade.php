<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Undangan Rapat - {{ $meeting->meeting_number }}</title>
    <style>
        @page {
            margin: 2cm 2cm;
            size: A4;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #000;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 3px solid #000;
        }

        .header h1 {
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 5px;
            text-transform: uppercase;
        }

        .header .subtitle {
            font-size: 11pt;
            font-style: italic;
            color: #333;
        }

        .document-info {
            margin: 20px 0;
            text-align: right;
        }

        .document-info table {
            margin-left: auto;
            border-collapse: collapse;
        }

        .document-info td {
            padding: 3px 10px;
            font-size: 11pt;
        }

        .document-info td:first-child {
            text-align: right;
            font-weight: bold;
        }

        .greeting {
            margin: 20px 0;
        }

        .content {
            margin: 20px 0;
            text-align: justify;
        }

        .meeting-details {
            margin: 25px 0;
            padding: 15px;
            background-color: #f9f9f9;
            border-left: 4px solid #2563eb;
        }

        .meeting-details table {
            width: 100%;
            border-collapse: collapse;
        }

        .meeting-details td {
            padding: 8px 5px;
            vertical-align: top;
        }

        .meeting-details td:first-child {
            width: 150px;
            font-weight: bold;
        }

        .meeting-details td:nth-child(2) {
            width: 20px;
            text-align: center;
        }

        .agenda-box {
            margin: 20px 0;
            padding: 15px;
            background-color: #fff;
            border: 1px solid #ddd;
        }

        .agenda-box h3 {
            font-size: 12pt;
            margin-bottom: 10px;
            color: #2563eb;
        }

        .participants-section {
            margin: 25px 0;
        }

        .participants-section h3 {
            font-size: 12pt;
            margin-bottom: 10px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 5px;
        }

        .participants-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        .participants-table th,
        .participants-table td {
            border: 1px solid #333;
            padding: 8px;
            text-align: left;
            font-size: 10pt;
        }

        .participants-table th {
            background-color: #2563eb;
            color: white;
            font-weight: bold;
        }

        .participants-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }

        .closing {
            margin-top: 30px;
        }

        .signature {
            margin-top: 40px;
            text-align: right;
        }

        .signature-box {
            display: inline-block;
            text-align: center;
            min-width: 200px;
        }

        .signature-line {
            margin-top: 80px;
            border-top: 1px solid #000;
            padding-top: 5px;
        }

        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            font-size: 9pt;
            color: #666;
            text-align: center;
        }

        .important-notice {
            margin: 20px 0;
            padding: 12px;
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            font-size: 10pt;
        }

        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 9pt;
            font-weight: bold;
        }

        .badge-moderator {
            background-color: #dbeafe;
            color: #1e40af;
        }

        .badge-secretary {
            background-color: #d1fae5;
            color: #065f46;
        }

        .badge-observer {
            background-color: #e9d5ff;
            color: #6b21a8;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <h1>UNDANGAN RAPAT</h1>
        <div class="subtitle">{{ $meeting->organizationUnit->name ?? 'Organisasi' }}</div>
    </div>

    <!-- Document Info -->
    <div class="document-info">
        <table>
            <tr>
                <td>Nomor</td>
                <td>:</td>
                <td>{{ $meeting->meeting_number }}</td>
            </tr>
            <tr>
                <td>Tanggal</td>
                <td>:</td>
                <td>{{ \Carbon\Carbon::parse($meeting->meeting_date)->isoFormat('D MMMM YYYY') }}</td>
            </tr>
        </table>
    </div>

    <!-- Greeting -->
    <div class="greeting">
        <p>Kepada Yth.<br>
        <strong>Peserta Rapat</strong><br>
        Di tempat</p>
    </div>

    <!-- Content -->
    <div class="content">
        <p>Dengan hormat,</p>
        <p style="margin-top: 15px;">
            Sehubungan dengan kebutuhan koordinasi dan pembahasan agenda kerja, dengan ini kami mengundang 
            Bapak/Ibu untuk menghadiri rapat dengan rincian sebagai berikut:
        </p>
    </div>

    <!-- Meeting Details -->
    <div class="meeting-details">
        <table>
            <tr>
                <td>Judul Rapat</td>
                <td>:</td>
                <td><strong>{{ $meeting->title }}</strong></td>
            </tr>
            <tr>
                <td>Hari/Tanggal</td>
                <td>:</td>
                <td>{{ \Carbon\Carbon::parse($meeting->meeting_date)->isoFormat('dddd, D MMMM YYYY') }}</td>
            </tr>
            <tr>
                <td>Waktu</td>
                <td>:</td>
                <td>{{ $meeting->start_time }} - {{ $meeting->end_time }} WIB</td>
            </tr>
            <tr>
                <td>Tempat</td>
                <td>:</td>
                <td>
                    {{ $meeting->room->name }}
                    @if($meeting->room->building)
                        <br><small>{{ $meeting->room->building }}
                        @if($meeting->room->floor) Lantai {{ $meeting->room->floor }}@endif</small>
                    @endif
                </td>
            </tr>
            <tr>
                <td>Penyelenggara</td>
                <td>:</td>
                <td>{{ $meeting->organizer->name }}</td>
            </tr>
        </table>
    </div>

    <!-- Agenda -->
    <div class="agenda-box">
        <h3>AGENDA RAPAT</h3>
        <p style="white-space: pre-line;">{{ $meeting->agenda }}</p>
    </div>

    @if($meeting->notes)
    <!-- Notes -->
    <div class="important-notice">
        <strong>Catatan Penting:</strong><br>
        <p style="margin-top: 5px; white-space: pre-line;">{{ $meeting->notes }}</p>
    </div>
    @endif

    <!-- Participants List -->
    @if($meeting->participants && $meeting->participants->count() > 0)
    <div class="participants-section">
        <h3>DAFTAR PESERTA RAPAT</h3>
        <table class="participants-table">
            <thead>
                <tr>
                    <th style="width: 40px;">No.</th>
                    <th>Nama</th>
                    <th>NIP</th>
                    <th>Unit Organisasi</th>
                    <th style="width: 100px;">Peran</th>
                </tr>
            </thead>
            <tbody>
                @foreach($meeting->participants->sortBy('role') as $index => $participant)
                <tr>
                    <td style="text-align: center;">{{ $index + 1 }}</td>
                    <td>{{ $participant->user->name }}</td>
                    <td>{{ $participant->user->nip ?? '-' }}</td>
                    <td>{{ $participant->user->organizationUnit->name ?? '-' }}</td>
                    <td>
                        @if($participant->role === 'moderator')
                            <span class="badge badge-moderator">Moderator</span>
                        @elseif($participant->role === 'secretary')
                            <span class="badge badge-secretary">Notulis</span>
                        @elseif($participant->role === 'observer')
                            <span class="badge badge-observer">Observer</span>
                        @else
                            Peserta
                        @endif
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    <!-- Closing -->
    <div class="content closing">
        <p>
            Demikian undangan ini kami sampaikan. Atas perhatian dan kehadiran Bapak/Ibu, 
            kami ucapkan terima kasih.
        </p>
    </div>

    <!-- Signature -->
    <div class="signature">
        <div class="signature-box">
            <p>Hormat kami,<br>
            <strong>Penyelenggara</strong></p>
            <div class="signature-line">
                <strong>{{ $meeting->organizer->name }}</strong><br>
                @if($meeting->organizer->nip)
                    NIP. {{ $meeting->organizer->nip }}
                @endif
            </div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <p>Dokumen ini digenerate secara otomatis oleh Sistem Manajemen Rapat</p>
        <p>Dicetak pada: {{ \Carbon\Carbon::now()->isoFormat('dddd, D MMMM YYYY HH:mm') }} WIB</p>
    </div>
</body>
</html>
