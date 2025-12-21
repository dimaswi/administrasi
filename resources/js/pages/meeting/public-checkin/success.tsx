import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock } from 'lucide-react';

interface Props {
    participant_name: string;
    meeting_title: string;
    check_in_time: string;
}

export default function CheckinSuccess({ participant_name, meeting_title, check_in_time }: Props) {
    return (
        <>
            <Head title="Check-in Berhasil" />
            
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                            <CheckCircle className="h-12 w-12 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl text-green-800">
                            Check-in Berhasil!
                        </CardTitle>
                        <CardDescription className="text-base">
                            Kehadiran Anda telah tercatat
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                        <div className="bg-white border rounded-lg p-4 space-y-3">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground">Nama</p>
                                <p className="font-semibold text-lg">{participant_name}</p>
                            </div>
                            
                            <div className="border-t pt-3 text-center">
                                <p className="text-sm text-muted-foreground">Rapat</p>
                                <p className="font-medium">{meeting_title}</p>
                            </div>
                            
                            <div className="border-t pt-3">
                                <div className="flex items-center justify-center gap-2 text-green-700">
                                    <Clock className="h-5 w-5" />
                                    <span className="font-medium">Check-in pukul {check_in_time} WIB</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                            <p className="text-sm text-green-800">
                                Terima kasih atas partisipasi Anda dalam rapat ini. 
                                Anda dapat menutup halaman ini.
                            </p>
                        </div>

                        <div className="text-center pt-2">
                            <p className="text-xs text-muted-foreground">
                                Sistem Administrasi Rapat
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
