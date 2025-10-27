import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Head, Link } from "@inertiajs/react";
import { Shield, Home, ArrowLeft } from "lucide-react";

export default function Error403() {
    return (
        <>
            <Head title="403 - Access Denied" />
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <Card className="border-red-200">
                        <CardHeader className="text-center">
                            <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
                                <Shield className="h-6 w-6 text-red-600" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-gray-900">
                                Akses Ditolak
                            </CardTitle>
                            <CardDescription className="text-gray-600">
                                Anda tidak memiliki izin untuk mengakses halaman ini.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-sm text-red-800">
                                    <strong>Error 403:</strong> Forbidden
                                </p>
                                <p className="text-sm text-red-700 mt-1">
                                    Hubungi administrator untuk mendapatkan akses ke halaman ini.
                                </p>
                            </div>
                            
                            <div className="flex flex-col space-y-3">
                                <Button 
                                    onClick={() => window.history.back()}
                                    variant="outline"
                                    className="w-full"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Kembali
                                </Button>
                                
                                <Link href="/dashboard">
                                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                        <Home className="h-4 w-4 mr-2" />
                                        Kembali ke Dashboard
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
