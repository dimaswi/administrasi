<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Undangan Rapat - {{ $meeting->meeting_number }}</title>
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
                <p style="margin: 5px 0; font-size: 10pt;">UNDANGAN RAPAT</p>
            </div>
        @endif
    </div>

    <!-- Konten Halaman 1 -->
    <table>
        <tr>
            <td>Nomor</td>
            <td>    :</td>
            <td>{{ $meeting->meeting_number }}</td>
        </tr>
        <tr>
            <td>Tanggal</td>
            <td>    :</td>
            <td>{{ \Carbon\Carbon::parse($meeting->meeting_date)->locale('id')->isoFormat('dddd, D MMMM YYYY') }}</td>
        </tr>
        <tr>
            <td>Kepada Yth.</td>
            <td>    :</td>
            <td>
                <b><u>Terlampir</u></b>
            </td>
        </tr>
        <tr>
            <td>Perihal</td>
            <td>    :</td>
            <td><b>UNDANGAN RAPAT</b></td>
        </tr>
    </table>

    <br>

    <!-- Content -->
    <div>
        <i>Assalamualaikum Wr. Wb</i>
        <p>Dengan Hormat,</p>
        <p>Puji syukur kehadirat Allah SWT yang senantiasa melimpahkan rahmat dan hidayahNya kepada kita semua untuk terus tergerak hati kita Ber-Amar Ma'ruf Nahi Munkar di jalanNya.</p>
        <p>Bersama datangnya surat ini kami mengundang Bapak/Ibu untuk hadir pada rapat yang akan dilaksanakan pada :</p>
    </div>

    <!-- Meeting Details -->
    <table class="detail-table">
        <tr>
            <td>Hari / Tanggal</td>
            <td>:</td>
            <td>{{ \Carbon\Carbon::parse($meeting->meeting_date)->locale('id')->isoFormat('dddd, D MMMM YYYY') }}</td>
        </tr>

        <tr>
            <td>Pukul</td>
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
            <td>Catatan</td>
            <td>:</td>
            @if($meeting->notes)
                <td>{{ $meeting->notes }}</td>
            @else
                <td> - </td>
            @endif
        </tr>
    </table>

    <!-- Closing -->
    <div>
        <p>Demikian surat undangan ini kami buat, atas perhatian serta kerjasamanya kami sampaikan terima kasih.</p>

        <i>Nasrum Minallah Wa FatHun Qarib</i>

        <div>
            &nbsp;
        </div>

        <i>Wassalamualaikum Wr. Wb</i>
    </div>

    <!-- Signature -->
    <table class="signature-table">
        <tr>
            <td style="padding-left: 450px"></td>
            <td style="text-align: center">Pimpinan Rapat</td>
        </tr>
        <tr>
            <td></td>
            <td style="text-align: center; padding-top: 10px; padding-bottom: 5px;">
                @php
                    $moderator = $meeting->participants->where('role', 'moderator')->first();
                    $leader = $meeting->organizer; 
                @endphp
                
                <!-- QR Code Signature Certificate -->
                @if(isset($qrCode))
                    <img src="data:image/png;base64,{{ $qrCode }}" alt="Signature Certificate" style="width: 120px; height: 120px; margin-bottom: 5px;">
                    <br>
                @endif
                
                <strong><u>{{$leader->name}}</u></strong> 
                @if($leader->nip)
                    <br><span style="font-size: 10pt;">NIP. {{ $leader->nip }}</span>
                @endif
                
            </td>
        </tr>
    </table>

    <!-- Participants List -->
    @if($meeting->participants && $meeting->participants->count() > 0)
    
    <!-- Page Break untuk halaman lampiran jika ada peserta -->
    <div style="page-break-before: always;"></div>

    <div style="margin-bottom: 10px;">
        <strong>Lampiran : Daftar Peserta Rapat</strong>
    </div>
    
    <table style="width: 100%; border: 1px solid #000; margin-top: 10px;">
        <thead>
            <tr style="background-color: #e0e0e0;">
                <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 40px;">No</th>
                <th style="border: 1px solid #000; padding: 6px; text-align: left;">Nama</th>
                <th style="border: 1px solid #000; padding: 6px; text-align: left; width: 120px;">NIP</th>
                <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 120px;">Peran</th>
            </tr>
        </thead>
        <tbody>
            @foreach($meeting->participants as $index => $participant)
            <tr>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">{{ $index + 1 }}</td>
                <td style="border: 1px solid #000; padding: 6px;">{{ $participant->user->name }}</td>
                <td style="border: 1px solid #000; padding: 6px;">{{ $participant->user->nip ?? '-' }}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">
                    @if($participant->role === 'moderator')
                        Moderator
                    @elseif($participant->role === 'secretary')
                        Notulis
                    @elseif($participant->role === 'observer')
                        Observer
                    @else
                        Peserta
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif
</body>
</html>
