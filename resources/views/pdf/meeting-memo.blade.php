<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Memo Hasil Rapat - {{ $meeting->meeting_number }}</title>
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
            font-size: 18pt;
            font-weight: bold;
            margin-bottom: 5px;
            text-transform: uppercase;
            color: #2563eb;
        }

        .header .subtitle {
            font-size: 12pt;
            margin-top: 5px;
        }

        .document-info {
            margin: 20px 0;
            padding: 15px;
            background-color: #f3f4f6;
            border-left: 4px solid #2563eb;
        }

        .document-info table {
            width: 100%;
            border-collapse: collapse;
        }

        .document-info td {
            padding: 5px 10px;
            font-size: 11pt;
        }

        .document-info td:first-child {
            width: 180px;
            font-weight: bold;
        }

        .document-info td:nth-child(2) {
            width: 20px;
        }

        .section-title {
            font-size: 14pt;
            font-weight: bold;
            margin: 25px 0 10px 0;
            padding-bottom: 5px;
            border-bottom: 2px solid #2563eb;
            color: #1e40af;
        }

        .content {
            margin: 15px 0;
            text-align: justify;
        }

        .memo-content {
            margin: 20px 0;
            padding: 20px;
            background-color: #fff;
            border: 1px solid #d1d5db;
            min-height: 300px;
        }

        .memo-content h1,
        .memo-content h2,
        .memo-content h3 {
            margin: 15px 0 10px 0;
            color: #1f2937;
        }

        .memo-content h1 {
            font-size: 16pt;
        }

        .memo-content h2 {
            font-size: 14pt;
        }

        .memo-content h3 {
            font-size: 12pt;
        }

        .memo-content p {
            margin: 10px 0;
        }

        .memo-content ul,
        .memo-content ol {
            margin: 10px 0;
            padding-left: 25px;
        }

        .memo-content li {
            margin: 5px 0;
        }

        .memo-content strong {
            font-weight: bold;
        }

        .memo-content em {
            font-style: italic;
        }

        .attendance-summary {
            margin: 20px 0;
            padding: 15px;
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
        }

        .attendance-summary h3 {
            font-size: 12pt;
            margin-bottom: 10px;
            color: #374151;
        }

        .attendance-grid {
            display: table;
            width: 100%;
            margin-top: 10px;
        }

        .attendance-item {
            display: table-row;
        }

        .attendance-item > div {
            display: table-cell;
            padding: 5px 10px;
            border-bottom: 1px solid #e5e7eb;
        }

        .attendance-item:last-child > div {
            border-bottom: none;
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

        .status-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 9pt;
            font-weight: bold;
        }

        .status-attended {
            background-color: #d1fae5;
            color: #065f46;
        }

        .status-absent {
            background-color: #fee2e2;
            color: #991b1b;
        }

        .status-excused {
            background-color: #fef3c7;
            color: #92400e;
        }

        .signature-section {
            margin-top: 40px;
            page-break-inside: avoid;
        }

        .signature-row {
            display: table;
            width: 100%;
            margin-top: 20px;
        }

        .signature-box {
            display: table-cell;
            text-align: center;
            width: 50%;
            padding: 10px;
        }

        .signature-line {
            margin-top: 80px;
            border-top: 1px solid #000;
            padding-top: 5px;
            display: inline-block;
            min-width: 200px;
        }

        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            font-size: 9pt;
            color: #666;
            text-align: center;
        }

        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 100pt;
            color: rgba(0, 0, 0, 0.03);
            z-index: -1;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <!-- Watermark -->
    <div class="watermark">MEMO</div>

    <!-- Header -->
    <div class="header">
        <h1>MEMORANDUM HASIL RAPAT</h1>
        <div class="subtitle">{{ $meeting->organizationUnit->name ?? 'Organisasi' }}</div>
    </div>

    <!-- Document Info -->
    <div class="document-info">
        <table>
            <tr>
                <td>Nomor Rapat</td>
                <td>:</td>
                <td><strong>{{ $meeting->meeting_number }}</strong></td>
            </tr>
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
                <td>{{ $meeting->room->name }}
                    @if($meeting->room->building)
                        , {{ $meeting->room->building }}
                        @if($meeting->room->floor) Lt. {{ $meeting->room->floor }}@endif
                    @endif
                </td>
            </tr>
            <tr>
                <td>Penyelenggara</td>
                <td>:</td>
                <td>{{ $meeting->organizer->name }}</td>
            </tr>
            <tr>
                <td>Status</td>
                <td>:</td>
                <td><strong>{{ $meeting->status === 'completed' ? 'SELESAI' : strtoupper($meeting->status) }}</strong></td>
            </tr>
        </table>
    </div>

    <!-- Agenda -->
    <div class="section-title">I. AGENDA RAPAT</div>
    <div class="content">
        <p style="white-space: pre-line;">{{ $meeting->agenda }}</p>
    </div>

    <!-- Attendance Summary -->
    <div class="section-title">II. RINGKASAN KEHADIRAN</div>
    <div class="attendance-summary">
        <div class="attendance-grid">
            <div class="attendance-item">
                <div style="width: 40%;"><strong>Total Peserta</strong></div>
                <div style="width: 10%;">:</div>
                <div><strong>{{ $meeting->participants->count() }} orang</strong></div>
            </div>
            <div class="attendance-item">
                <div><strong>Hadir</strong></div>
                <div>:</div>
                <div><strong style="color: #059669;">{{ $meeting->attendedParticipants->count() }} orang</strong></div>
            </div>
            <div class="attendance-item">
                <div><strong>Tidak Hadir</strong></div>
                <div>:</div>
                <div><strong style="color: #dc2626;">{{ $meeting->participants->where('attendance_status', 'absent')->count() }} orang</strong></div>
            </div>
            <div class="attendance-item">
                <div><strong>Izin</strong></div>
                <div>:</div>
                <div><strong style="color: #d97706;">{{ $meeting->participants->where('attendance_status', 'excused')->count() }} orang</strong></div>
            </div>
        </div>
    </div>

    <!-- Participants -->
    <div class="section-title">III. DAFTAR HADIR</div>
    <table class="participants-table">
        <thead>
            <tr>
                <th style="width: 40px;">No.</th>
                <th>Nama</th>
                <th>NIP</th>
                <th>Unit Organisasi</th>
                <th style="width: 100px; text-align: center;">Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($meeting->participants->sortByDesc('attendance_status') as $index => $participant)
            <tr>
                <td style="text-align: center;">{{ $index + 1 }}</td>
                <td>{{ $participant->user->name }}</td>
                <td>{{ $participant->user->nip ?? '-' }}</td>
                <td>{{ $participant->user->organizationUnit->name ?? '-' }}</td>
                <td style="text-align: center;">
                    @if($participant->attendance_status === 'attended')
                        <span class="status-badge status-attended">HADIR</span>
                    @elseif($participant->attendance_status === 'absent')
                        <span class="status-badge status-absent">TIDAK HADIR</span>
                    @elseif($participant->attendance_status === 'excused')
                        <span class="status-badge status-excused">IZIN</span>
                    @else
                        -
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Memo Content -->
    <div class="section-title">IV. HASIL PEMBAHASAN DAN KEPUTUSAN</div>
    <div class="memo-content">
        @if($meeting->memo_content)
            {!! $meeting->memo_content !!}
        @else
            <p style="color: #6b7280; font-style: italic;">
                Belum ada catatan hasil pembahasan dan keputusan rapat yang diinput.
            </p>
        @endif
    </div>

    @if($meeting->notes)
    <!-- Additional Notes -->
    <div class="section-title">V. CATATAN TAMBAHAN</div>
    <div class="content">
        <p style="white-space: pre-line;">{{ $meeting->notes }}</p>
    </div>
    @endif

    <!-- Signature -->
    <div class="signature-section">
        <div class="section-title">PENGESAHAN</div>
        <div class="signature-row">
            <div class="signature-box">
                <p><strong>Notulis</strong></p>
                <div class="signature-line">
                    @php
                        $secretary = $meeting->participants->where('role', 'secretary')->first();
                    @endphp
                    @if($secretary)
                        <strong>{{ $secretary->user->name }}</strong><br>
                        @if($secretary->user->nip)
                            NIP. {{ $secretary->user->nip }}
                        @endif
                    @else
                        <strong>_________________</strong>
                    @endif
                </div>
            </div>
            <div class="signature-box">
                <p><strong>Moderator/Penyelenggara</strong></p>
                <div class="signature-line">
                    <strong>{{ $meeting->organizer->name }}</strong><br>
                    @if($meeting->organizer->nip)
                        NIP. {{ $meeting->organizer->nip }}
                    @endif
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <p><strong>Memorandum Hasil Rapat - {{ $meeting->meeting_number }}</strong></p>
        <p>Dokumen ini digenerate secara otomatis oleh Sistem Manajemen Rapat</p>
        <p>Dicetak pada: {{ \Carbon\Carbon::now()->isoFormat('dddd, D MMMM YYYY HH:mm') }} WIB</p>
    </div>
</body>
</html>
