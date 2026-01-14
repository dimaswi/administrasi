import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Employee, maritalLabels, formatDate } from './types';

interface Props {
    employee: Employee;
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div className="flex justify-between py-2 border-b last:border-0">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-right">{value || '-'}</span>
        </div>
    );
}

export function PersonalTab({ employee }: Props) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader className="p-4">
                    <CardTitle className="text-base">Data Pribadi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                    <InfoRow label="Nama Lengkap" value={employee.full_name} />
                    <InfoRow label="NIK KTP" value={employee.nik} />
                    <InfoRow label="Jenis Kelamin" value={employee.gender === 'male' ? 'Laki-laki' : 'Perempuan'} />
                    <InfoRow label="Tempat, Tanggal Lahir" value={`${employee.place_of_birth || '-'}, ${formatDate(employee.date_of_birth)}`} />
                    <InfoRow label="Agama" value={employee.religion} />
                    <InfoRow label="Status Perkawinan" value={employee.marital_status ? (maritalLabels[employee.marital_status] || employee.marital_status) : null} />
                    <InfoRow label="Golongan Darah" value={employee.blood_type} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="p-4">
                    <CardTitle className="text-base">Kontak</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                    <InfoRow label="No. HP" value={employee.phone} />
                    <InfoRow label="No. HP Lainnya" value={employee.phone_secondary} />
                    <InfoRow label="Email" value={employee.email} />
                    <div className="pt-3 mt-3 border-t">
                        <p className="text-sm font-medium mb-2">Kontak Darurat</p>
                        <InfoRow label="Nama" value={employee.emergency_contact_name} />
                        <InfoRow label="Telepon" value={employee.emergency_contact_phone} />
                        <InfoRow label="Hubungan" value={employee.emergency_contact_relation} />
                    </div>
                </CardContent>
            </Card>

            <Card className="md:col-span-2">
                <CardHeader className="p-4">
                    <CardTitle className="text-base">Alamat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                    <InfoRow label="Alamat" value={employee.address} />
                    <div className="grid grid-cols-3 gap-4">
                        <InfoRow label="Kota" value={employee.city} />
                        <InfoRow label="Provinsi" value={employee.province} />
                        <InfoRow label="Kode Pos" value={employee.postal_code} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
