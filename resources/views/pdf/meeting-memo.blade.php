<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Memo Hasil Rapat - {{ $meeting->meeting_number }}</title>
    <style>
        @page {
            margin-top: 200px;
            margin-bottom: 1cm;
        }

        body {
            margin-left: 10px;
            margin-right: 10px;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11pt;
        }

        .letterhead {
            position: fixed;
            top: -200px;
            left: 0;
            right: 0;
            text-align: left;
            height: 180px;
        }

        .letterhead img {
            height: 178px;
            width: 700px;
        }

        table {
            border-collapse: collapse;
        }

        table td {
            vertical-align: top;
            padding: 2px 0;
        }

        .detail-table {
            padding-left: 2cm;
            padding-right: 2cm;
        }

        .signature-table {
            margin-top: 20px;
        }

        .signature-table td {
            padding: 5px;
        }

        .memo-content {
            margin: 15px 0;
            line-height: 1.6;
            text-align: justify;
        }

        .participants-table {
            width: 100%;
            border: 1px solid #000;
            margin-top: 10px;
        }

        .participants-table th,
        .participants-table td {
            border: 1px solid #000;
            padding: 6px;
        }

        .participants-table th {
            background-color: #e0e0e0;
            text-align: center;
            font-weight: bold;
        }

        .status-badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 9pt;
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
    </style>
</head>
<body>
    <!-- Letterhead (Akan muncul di setiap halaman) -->
    <div class="letterhead">
        @if($meeting->organizationUnit && $meeting->organizationUnit->letterhead_image)
            <img src="{{ public_path('storage/' . $meeting->organizationUnit->letterhead_image) }}" alt="Kop Surat">
            <hr style="border: 1px solid #000; margin-top: 5px;">
        @else
            <!-- Fallback jika tidak ada kop surat -->
            <div style="text-align: center; padding: 20px 0; border-bottom: 3px solid #000;">
                <h2 style="margin: 0; font-size: 16pt;">{{ $meeting->organizationUnit->name ?? 'ORGANISASI' }}</h2>
                <p style="margin: 5px 0; font-size: 10pt;">MEMO HASIL RAPAT</p>
            </div>
        @endif
    </div>

    <!-- Konten Halaman 1 -->
    <table>
        <tr>
            <td>Nomor Rapat</td>
            <td>    :</td>
            <td>{{ $meeting->meeting_number }}</td>
        </tr>
        <tr>
            <td>Tanggal Rapat</td>
            <td>    :</td>
            <td>{{ \Carbon\Carbon::parse($meeting->meeting_date)->locale('id')->isoFormat('dddd, D MMMM YYYY') }}</td>
        </tr>
        <tr>
            <td>Perihal</td>
            <td>    :</td>
            <td><b>MEMO HASIL RAPAT</b></td>
        </tr>
    </table>

    <br>

    <!-- Meeting Details -->
    <table class="detail-table">
        <tr>
            <td style="width: 150px;">Judul Rapat</td>
            <td style="width: 10px;">:</td>
            <td><b>{{ $meeting->title }}</b></td>
        </tr>

        <tr>
            <td>Hari / Tanggal</td>
            <td>:</td>
            <td>{{ \Carbon\Carbon::parse($meeting->meeting_date)->locale('id')->isoFormat('dddd, D MMMM YYYY') }}</td>
        </tr>

        <tr>
            <td>Waktu</td>
            <td>:</td>
            <td>{{ $meeting->start_time }} WIB - {{ $meeting->end_time }} WIB</td>
        </tr>

        <tr>
            <td>Tempat</td>
            <td>:</td>
            <td>{{ $meeting->room->name }}</td>
        </tr>

        <tr>
            <td>Agenda</td>
            <td>:</td>
            <td style="margin-top: 5px; margin-bottom: 5px">{{ $meeting->agenda }}</td>
        </tr>

        <tr>
            <td>Pimpinan Rapat</td>
            <td>:</td>
            <td>
                @php
                    $moderator = $meeting->participants->where('role', 'moderator')->first();
                    $leader = $moderator ? $moderator->user : $meeting->organizer;
                @endphp
                {{ $leader->name }}
            </td>
        </tr>

        <tr>
            <td>Notulis</td>
            <td>:</td>
            <td>
                @php
                    $secretary = $meeting->participants->where('role', 'secretary')->first();
                @endphp
                {{ $secretary ? $secretary->user->name : '-' }}
            </td>
        </tr>

        <tr>
            <td>Jumlah Peserta</td>
            <td>:</td>
            <td>{{ $meeting->participants->count() }} orang (Hadir: {{ $meeting->attendedParticipants->count() }} orang)</td>
        </tr>
    </table>

    <br>

    <!-- Memo Content -->
    <div>
        <strong>HASIL PEMBAHASAN DAN KEPUTUSAN:</strong>
    </div>
    
    <div class="memo-content">
        @if($meeting->memo_content)
            {!! $meeting->memo_content !!}
        @else
            <p style="text-align: center; color: #666; font-style: italic;">Memo hasil rapat belum diisi</p>
        @endif
    </div>

    @if($meeting->notes)
    <!-- Additional Notes -->
    <div style="margin-top: 20px;">
        <strong>CATATAN TAMBAHAN:</strong>
    </div>
    <div style="margin: 10px 0; line-height: 1.6;">
        <p style="white-space: pre-line;">{{ $meeting->notes }}</p>
    </div>
    @endif

    <!-- Action Items jika ada -->
    @if($meeting->actionItems && $meeting->actionItems->count() > 0)
    <div style="margin-top: 20px;">
        <strong>TINDAK LANJUT:</strong>
    </div>
    
    <table class="participants-table">
        <thead>
            <tr>
                <th style="width: 40px;">No</th>
                <th>Tindakan</th>
                <th style="width: 150px;">Penanggung Jawab</th>
                <th style="width: 100px;">Tenggat</th>
            </tr>
        </thead>
        <tbody>
            @foreach($meeting->actionItems as $index => $item)
            <tr>
                <td style="text-align: center;">{{ $index + 1 }}</td>
                <td>{{ $item->description }}</td>
                <td>{{ $item->assignedTo->name ?? '-' }}</td>
                <td style="text-align: center;">
                    {{ $item->due_date ? \Carbon\Carbon::parse($item->due_date)->format('d/m/Y') : '-' }}
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    <!-- Signature -->
    <table class="signature-table">
        <tr>
            <td style="width: 50%; text-align: center;">
                <div>Mengetahui,</div>
                <div style="margin-top: 5px;">Pimpinan Rapat</div>
                <div style="margin-top: 60px;">
                    @if(isset($qrCodeLeader))
                        <img src="data:image/png;base64,{{ $qrCodeLeader }}" alt="Signature Certificate" style="width: 100px; height: 100px; margin-bottom: 5px;">
                        <br>
                    @endif
                    <strong><u>{{ $leader->name }}</u></strong>
                    @if($leader->nip)
                        <br><span style="font-size: 10pt;">NIP. {{ $leader->nip }}</span>
                    @endif
                </div>
            </td>
            <td style="width: 50%; text-align: center;">
                <div>Notulis</div>
                <div style="margin-top: 60px;">
                    @if(isset($qrCodeSecretary) && $secretary)
                        <img src="data:image/png;base64,{{ $qrCodeSecretary }}" alt="Signature Certificate" style="width: 100px; height: 100px; margin-bottom: 5px;">
                        <br>
                    @endif
                    @if($secretary)
                        <strong><u>{{ $secretary->user->name }}</u></strong>
                        @if($secretary->user->nip)
                            <br><span style="font-size: 10pt;">NIP. {{ $secretary->user->nip }}</span>
                        @endif
                    @else
                        <div style="height: 60px;"></div>
                        <strong>_________________</strong>
                    @endif
                </div>
            </td>
        </tr>
    </table>

    <!-- Page Break untuk halaman lampiran daftar hadir -->
    @if($meeting->participants && $meeting->participants->count() > 0)
    <div style="page-break-before: always;"></div>

    <div style="margin-bottom: 10px;">
        <strong>Lampiran : Daftar Hadir Peserta Rapat</strong>
    </div>
    
    <table class="participants-table">
        <thead>
            <tr>
                <th style="width: 40px;">No</th>
                <th>Nama</th>
                <th style="width: 120px;">NIP</th>
                <th style="width: 150px;">Unit Organisasi</th>
                <th style="width: 100px;">Status Hadir</th>
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
    @endif
</body>
</html>