<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daftar Hadir - {{ $meeting->meeting_number }}</title>
    <style>
        @page {
            margin: 2cm 1.5cm;
            size: A4 landscape;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #000;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
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
            margin-top: 3px;
        }

        .meeting-info {
            margin: 15px 0;
            padding: 12px;
            background-color: #f3f4f6;
            border-left: 4px solid #2563eb;
        }

        .meeting-info table {
            width: 100%;
            border-collapse: collapse;
        }

        .meeting-info td {
            padding: 3px 8px;
            font-size: 10pt;
        }

        .meeting-info td:first-child {
            width: 150px;
            font-weight: bold;
        }

        .meeting-info td:nth-child(2) {
            width: 15px;
        }

        .attendance-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }

        .attendance-table th,
        .attendance-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
            font-size: 9pt;
        }

        .attendance-table th {
            background-color: #2563eb;
            color: white;
            font-weight: bold;
            text-align: center;
        }

        .attendance-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }

        .attendance-table td:first-child {
            text-align: center;
            width: 35px;
        }

        .signature-cell {
            min-height: 60px;
            vertical-align: middle;
        }

        .status-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 8pt;
            font-weight: bold;
            text-align: center;
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

        .status-confirmed {
            background-color: #dbeafe;
            color: #1e40af;
        }

        .role-badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 8pt;
            font-weight: bold;
        }

        .role-moderator {
            background-color: #dbeafe;
            color: #1e40af;
        }

        .role-secretary {
            background-color: #d1fae5;
            color: #065f46;
        }

        .role-observer {
            background-color: #e9d5ff;
            color: #6b21a8;
        }

        .summary {
            margin-top: 20px;
            padding: 12px;
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
        }

        .summary table {
            width: 50%;
            border-collapse: collapse;
        }

        .summary td {
            padding: 5px 10px;
            font-size: 10pt;
        }

        .summary td:first-child {
            width: 150px;
            font-weight: bold;
        }

        .summary td:nth-child(2) {
            width: 15px;
        }

        .footer {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
            font-size: 8pt;
            color: #666;
            text-align: center;
        }

        .signature-section {
            margin-top: 30px;
            text-align: right;
        }

        .signature-box {
            display: inline-block;
            text-align: center;
            min-width: 180px;
        }

        .signature-line {
            margin-top: 60px;
            border-top: 1px solid #000;
            padding-top: 5px;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <h1>DAFTAR HADIR RAPAT</h1>
        <div class="subtitle">{{ $meeting->organizationUnit->name ?? 'Organisasi' }}</div>
    </div>

    <!-- Meeting Info -->
    <div class="meeting-info">
        <table>
            <tr>
                <td>Nomor Rapat</td>
                <td>:</td>
                <td><strong>{{ $meeting->meeting_number }}</strong></td>
                <td style="width: 120px;">Hari/Tanggal</td>
                <td>:</td>
                <td>{{ \Carbon\Carbon::parse($meeting->meeting_date)->isoFormat('dddd, D MMMM YYYY') }}</td>
            </tr>
            <tr>
                <td>Judul Rapat</td>
                <td>:</td>
                <td><strong>{{ $meeting->title }}</strong></td>
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
                <td>Penyelenggara</td>
                <td>:</td>
                <td>{{ $meeting->organizer->name }}</td>
            </tr>
        </table>
    </div>

    <!-- Attendance Table -->
    <table class="attendance-table">
        <thead>
            <tr>
                <th rowspan="2">No.</th>
                <th rowspan="2">Nama</th>
                <th rowspan="2">NIP</th>
                <th rowspan="2">Unit Organisasi</th>
                <th rowspan="2">Peran</th>
                <th rowspan="2">Status</th>
                <th rowspan="2">Waktu Check-in</th>
                <th colspan="2">Tanda Tangan</th>
            </tr>
            <tr>
                <th style="width: 120px;">Hadir</th>
                <th style="width: 120px;">Pulang</th>
            </tr>
        </thead>
        <tbody>
            @foreach($meeting->participants->sortBy('user.name') as $index => $participant)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ $participant->user->name }}</td>
                <td style="font-size: 8pt;">{{ $participant->user->nip ?? '-' }}</td>
                <td style="font-size: 8pt;">{{ $participant->user->organizationUnit->name ?? '-' }}</td>
                <td style="text-align: center;">
                    @if($participant->role === 'moderator')
                        <span class="role-badge role-moderator">Moderator</span>
                    @elseif($participant->role === 'secretary')
                        <span class="role-badge role-secretary">Notulis</span>
                    @elseif($participant->role === 'observer')
                        <span class="role-badge role-observer">Observer</span>
                    @else
                        Peserta
                    @endif
                </td>
                <td style="text-align: center;">
                    @if($participant->attendance_status === 'attended')
                        <span class="status-badge status-attended">HADIR</span>
                    @elseif($participant->attendance_status === 'absent')
                        <span class="status-badge status-absent">TIDAK HADIR</span>
                    @elseif($participant->attendance_status === 'excused')
                        <span class="status-badge status-excused">IZIN</span>
                    @elseif($participant->attendance_status === 'confirmed')
                        <span class="status-badge status-confirmed">KONFIRMASI</span>
                    @else
                        -
                    @endif
                </td>
                <td style="text-align: center; font-size: 8pt;">
                    @if($participant->attendance_time)
                        {{ \Carbon\Carbon::parse($participant->attendance_time)->format('H:i') }}
                    @else
                        -
                    @endif
                </td>
                <td class="signature-cell"></td>
                <td class="signature-cell"></td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Summary -->
    <div class="summary">
        <table>
            <tr>
                <td><strong>Total Peserta</strong></td>
                <td>:</td>
                <td><strong>{{ $meeting->participants->count() }} orang</strong></td>
            </tr>
            <tr>
                <td><strong>Hadir</strong></td>
                <td>:</td>
                <td><strong style="color: #059669;">{{ $meeting->attendedParticipants->count() }} orang</strong></td>
            </tr>
            <tr>
                <td><strong>Tidak Hadir</strong></td>
                <td>:</td>
                <td><strong style="color: #dc2626;">{{ $meeting->participants->where('attendance_status', 'absent')->count() }} orang</strong></td>
            </tr>
            <tr>
                <td><strong>Izin</strong></td>
                <td>:</td>
                <td><strong style="color: #d97706;">{{ $meeting->participants->where('attendance_status', 'excused')->count() }} orang</strong></td>
            </tr>
        </table>
    </div>

    <!-- Signature -->
    <div class="signature-section">
        <div class="signature-box">
            <p>Mengetahui,<br>
            <strong>Moderator/Penyelenggara</strong></p>
            <div class="signature-line">
                <strong>{{ $meeting->organizer->name }}</strong><br>
                @if($meeting->organizer->nip)
                    <small>NIP. {{ $meeting->organizer->nip }}</small>
                @endif
            </div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <p><strong>Daftar Hadir Rapat - {{ $meeting->meeting_number }}</strong></p>
        <p>Dokumen ini digenerate secara otomatis oleh Sistem Manajemen Rapat | 
        Dicetak pada: {{ \Carbon\Carbon::now()->isoFormat('dddd, D MMMM YYYY HH:mm') }} WIB</p>
    </div>
</body>
</html>