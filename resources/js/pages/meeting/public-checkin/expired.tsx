import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CheckinExpired() {
    return (
        <>
            <Head title="Sesi Check-in Kedaluwarsa" />
            
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <XCircle className="h-10 w-10 text-red-600" />
                        </div>
                        <CardTitle className="text-xl md:text-2xl text-red-800">
                            Sesi Check-in Kedaluwarsa
                        </CardTitle>
                        <CardDescription className="text-base">
                            QR Code check-in sudah tidak berlaku
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <div className="flex gap-3">
                                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-amber-800">
                                    <p className="font-medium mb-1">Kemungkinan penyebab:</p>
                                    <ul className="list-disc list-inside space-y-1 text-amber-700">
                                        <li>Token check-in sudah kedaluwarsa</li>
                                        <li>Moderator telah menghentikan sesi check-in</li>
                                        <li>Rapat sudah selesai atau dibatalkan</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex gap-3">
                                <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-800">
                                    <p className="font-medium mb-1">Apa yang harus dilakukan:</p>
                                    <p className="text-blue-700">
                                        Minta moderator/penyelenggara untuk menampilkan QR Code baru, 
                                        lalu scan kembali untuk check-in.
                                    </p>
                                </div>
                            </div>
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
