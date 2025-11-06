<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>{{ $data_rapat->agenda_rapat }}</title>
</head>

<body style="margin-left: 10px; margin-right: 10px; margin-top: -6%; font-family: Arial, Helvetica, sans-serif; font-size: 11pt">

    <div style="text-align: left">
        <img src="{{ $kop }}" height="178" width="700" alt="">
    </div>

    <hr>

    <br>

    <table>
        <tr>
            <td>Nomor</td>
            <td>:</td>
            <td>{{ $data_rapat->nomor_rapat }}</td>
        </tr>
        <tr>
            <td>Tanggal</td>
            <td>:</td>
            <td>{{ $tanggal_undangan }}</td>
        </tr>
        <tr>
            <td>Kepada Yth.</td>
            <td>:</td>
            <td>
                <b><u>Terlampir</u></b>
            </td>
        </tr>
        <tr>
            <td>Perihal</td>
            <td>:</td>
            <td><b>UNDANGAN RAPAT</b></td>
        </tr>
    </table>

    <br>

    <div>
        <i>AssalamualaikumWr.Wb</i>
        {{-- <br> --}}
        <p>Dengan Hormat,</p>
        {{-- <br> --}}
        <p>Puji syukur kehadirat Allah SWT yang senantiasa melimpahkan rahmat dan hidayahNya kepada kita semua untuk terus tergerak hati kita Ber-Amar Ma’ruf Nahi Munkar di jalanNya. </p>
        {{-- <br> --}}
        <p>Bersama datangnya surat ini kami mengundang Bapak / ibu untuk hadir pada rapat yang akan dilaksanakan pada :</p>
    </div>

    <table style="padding-left: 2cm; padding-right: 2cm">
        <tr>
            <td>Hari / Tanggal</td>
            <td>:</td>
            <td>{{ $tanggal_rapat }}</td>
        </tr>

        <tr>
            <td>Pukul</td>
            <td>:</td>
            <td>{{ substr($data_rapat->starts_at, -8) }} WIB - {{ substr($data_rapat->ends_at, -8) }} WIB</td>
        </tr>

        <tr>
            <td>Tempat</td>
            <td>:</td>
            <td>{{ $tempat_rapat->nama_ruang }}</td>
        </tr>

        <tr>
            <td>Agenda</td>
            <td>:</td>
            <td style="margin-top: 5px; margin-bottom: 5px">{{ $data_rapat->agenda_rapat }}</td>
        </tr>

        <tr>
            <td>Catatan</td>
            <td>:</td>
            @if ( $data_rapat->catatan != null )
                <td>{{ $data_rapat->catatan }}</td>
            @else
                <td> - </td>
            @endif
        </tr>
    </table>

    <div>
        <p>Demikian surat undangan ini kami buat, atas perhatian serta kerjasamanya kami sampaikan terima kasih.</p>

        <i>Nasrum Minallah Wa FatHun Qarib</i>

        <div>
            &nbsp;
        </div>

        <i>Wassalamualaikum Wr.Wb</i>
    </div>

    <table>
        <tr>
            <td style="padding-left: 450px"></td>
            <td style="text-align: center">Pimpinan Rapat</td>
        </tr>
        <tr>
            <td></td>
            <td style="text-align: center"><img src="data:image/png;base64, {!! $qr !!}"></td>
        </tr>
        <tr>
            <td></td>
            <td style="text-align: center">{{ $pimpinan_rapat }}</td>
        </tr>
    </table>

    <div style="page-break-after: always"></div>

    <div style="text-align: left">
        <img src="{{ $kop }}" height="178" width="700" alt="">
    </div>

    <hr>

    <br>

    <table>
        <tr>
            <td style="vertical-align: top">Lampiran</td>
            <td style="vertical-align: top">:</td>
            <td style="vertical-align: top">
                <ol>
                    @foreach ($undangan_rapat as $undangan)
                        <li>{{ $undangan->name }}</li>
                    @endforeach
                </ol>
            </td>
        </tr>
    </table>

</body>

</html>