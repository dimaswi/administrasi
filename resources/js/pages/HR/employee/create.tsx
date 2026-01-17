import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormPage } from '@/components/ui/form-page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import HRLayout from '@/layouts/hr-layout';
import { Head, useForm } from '@inertiajs/react';
import { Users } from 'lucide-react';
import { toast } from 'sonner';

interface JobCategory {
    id: number;
    code: string;
    name: string;
}

interface EmploymentStatus {
    id: number;
    name: string;
}

interface EducationLevel {
    id: number;
    code: string;
    name: string;
}

interface OrganizationUnit {
    id: number;
    name: string;
}

interface Props {
    jobCategories: JobCategory[];
    employmentStatuses: EmploymentStatus[];
    educationLevels: EducationLevel[];
    organizationUnits: OrganizationUnit[];
}

interface FormData {
    [key: string]: string;
    first_name: string;
    last_name: string;
    nik: string;
    gender: string;
    place_of_birth: string;
    date_of_birth: string;
    religion: string;
    marital_status: string;
    blood_type: string;
    address: string;
    city: string;
    province: string;
    postal_code: string;
    phone: string;
    phone_secondary: string;
    email: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    emergency_contact_relation: string;
    job_category_id: string;
    employment_status_id: string;
    organization_unit_id: string;
    position: string;
    join_date: string;
    contract_start_date: string;
    contract_end_date: string;
    education_level_id: string;
    education_institution: string;
    education_major: string;
    education_year: string;
    npwp_number: string;
    bpjs_kesehatan_number: string;
    bpjs_ketenagakerjaan_number: string;
    bank_name: string;
    bank_account_number: string;
    bank_account_name: string;
    notes: string;
}

// Static options
const genderOptions = [
    { value: 'male', label: 'Laki-laki' },
    { value: 'female', label: 'Perempuan' },
];

const religionOptions = [
    { value: 'Islam', label: 'Islam' },
    { value: 'Kristen', label: 'Kristen' },
    { value: 'Katolik', label: 'Katolik' },
    { value: 'Hindu', label: 'Hindu' },
    { value: 'Buddha', label: 'Buddha' },
    { value: 'Konghucu', label: 'Konghucu' },
];

const maritalStatusOptions = [
    { value: 'single', label: 'Belum Menikah' },
    { value: 'married', label: 'Menikah' },
    { value: 'divorced', label: 'Cerai' },
    { value: 'widowed', label: 'Duda/Janda' },
];

const bloodTypeOptions = [
    { value: 'A', label: 'A' },
    { value: 'B', label: 'B' },
    { value: 'AB', label: 'AB' },
    { value: 'O', label: 'O' },
];

export default function Create({ jobCategories, employmentStatuses, educationLevels, organizationUnits }: Props) {
    const breadcrumbs = [
        { title: <Users className="h-4 w-4" />, href: '/hr/employees' },
        { title: 'Tambah Karyawan', href: '/hr/employees/create' },
    ];

    const { data, setData, post, processing, errors } = useForm<FormData>({
        first_name: '',
        last_name: '',
        nik: '',
        gender: '',
        place_of_birth: '',
        date_of_birth: '',
        religion: '',
        marital_status: '',
        blood_type: '',
        address: '',
        city: '',
        province: '',
        postal_code: '',
        phone: '',
        phone_secondary: '',
        email: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relation: '',
        job_category_id: '',
        employment_status_id: '',
        organization_unit_id: '',
        position: '',
        join_date: '',
        contract_start_date: '',
        contract_end_date: '',
        education_level_id: '',
        education_institution: '',
        education_major: '',
        education_year: '',
        npwp_number: '',
        bpjs_kesehatan_number: '',
        bpjs_ketenagakerjaan_number: '',
        bank_name: '',
        bank_account_number: '',
        bank_account_name: '',
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/hr/employees', {
            onError: () => toast.error('Gagal menambahkan karyawan'),
        });
    };

    // Convert props to searchable select options
    const jobCategoryOptions = jobCategories.map((cat) => ({
        value: cat.id.toString(),
        label: `[${cat.code}] ${cat.name}`,
    }));

    const employmentStatusOptions = employmentStatuses.map((status) => ({
        value: status.id.toString(),
        label: status.name,
    }));

    const organizationUnitOptions = organizationUnits.map((unit) => ({
        value: unit.id.toString(),
        label: unit.name,
    }));

    const educationLevelOptions = educationLevels.map((level) => ({
        value: level.id.toString(),
        label: level.name,
    }));

    return (
        <HRLayout>
            <Head title="Tambah Karyawan" />

            <FormPage
                title="Tambah Karyawan Baru"
                description="NIK akan digenerate otomatis berdasarkan tahun masuk dan kategori pekerjaan"
                backUrl="/hr/employees"
                onSubmit={handleSubmit}
                isLoading={processing}
                submitLabel="Simpan Karyawan"
            >
                <div className="space-y-6">
                    {/* Data Pribadi */}
                    <Card>
                        <CardHeader>
                            <div className="py-4">
                                <CardTitle>Data Pribadi</CardTitle>
                                <CardDescription>Informasi identitas karyawan</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="first_name">Nama Depan *</Label>
                                    <Input
                                        id="first_name"
                                        value={data.first_name}
                                        onChange={(e) => setData('first_name', e.target.value)}
                                        placeholder="John"
                                        className={errors.first_name ? 'border-red-500' : ''}
                                    />
                                    {errors.first_name && <small className="text-red-500">{errors.first_name}</small>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="last_name">Nama Belakang</Label>
                                    <Input
                                        id="last_name"
                                        value={data.last_name}
                                        onChange={(e) => setData('last_name', e.target.value)}
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="nik">NIK KTP</Label>
                                    <Input
                                        id="nik"
                                        value={data.nik}
                                        onChange={(e) => setData('nik', e.target.value)}
                                        placeholder="3201234567890001"
                                        maxLength={16}
                                        className={errors.nik ? 'border-red-500' : ''}
                                    />
                                    {errors.nik && <small className="text-red-500">{errors.nik}</small>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gender">Jenis Kelamin *</Label>
                                    <SearchableSelect
                                        options={genderOptions}
                                        value={data.gender}
                                        onValueChange={(value) => setData('gender', value)}
                                        placeholder="Pilih jenis kelamin"
                                        className={errors.gender ? '[&>button]:border-red-500' : ''}
                                    />
                                    {errors.gender && <small className="text-red-500">{errors.gender}</small>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="place_of_birth">Tempat Lahir</Label>
                                    <Input
                                        id="place_of_birth"
                                        value={data.place_of_birth}
                                        onChange={(e) => setData('place_of_birth', e.target.value)}
                                        placeholder="Jakarta"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="date_of_birth">Tanggal Lahir</Label>
                                    <Input
                                        id="date_of_birth"
                                        type="date"
                                        value={data.date_of_birth}
                                        onChange={(e) => setData('date_of_birth', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="religion">Agama</Label>
                                    <SearchableSelect
                                        options={religionOptions}
                                        value={data.religion}
                                        onValueChange={(value) => setData('religion', value)}
                                        placeholder="Pilih agama"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="marital_status">Status Perkawinan</Label>
                                    <SearchableSelect
                                        options={maritalStatusOptions}
                                        value={data.marital_status}
                                        onValueChange={(value) => setData('marital_status', value)}
                                        placeholder="Pilih status"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="blood_type">Golongan Darah</Label>
                                    <SearchableSelect
                                        options={bloodTypeOptions}
                                        value={data.blood_type}
                                        onValueChange={(value) => setData('blood_type', value)}
                                        placeholder="Pilih"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Data Kontak */}
                    <Card>
                        <CardHeader>
                            <div className="py-4">
                                <CardTitle>Data Kontak</CardTitle>
                                <CardDescription>Alamat dan informasi kontak</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="address">Alamat</Label>
                                <Textarea
                                    id="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    placeholder="Jl. Contoh No. 123..."
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="city">Kota</Label>
                                    <Input id="city" value={data.city} onChange={(e) => setData('city', e.target.value)} placeholder="Jakarta" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="province">Provinsi</Label>
                                    <Input
                                        id="province"
                                        value={data.province}
                                        onChange={(e) => setData('province', e.target.value)}
                                        placeholder="DKI Jakarta"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="postal_code">Kode Pos</Label>
                                    <Input
                                        id="postal_code"
                                        value={data.postal_code}
                                        onChange={(e) => setData('postal_code', e.target.value)}
                                        placeholder="12345"
                                        maxLength={10}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">No. HP Utama</Label>
                                    <Input
                                        id="phone"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="08123456789"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone_secondary">No. HP Lainnya</Label>
                                    <Input
                                        id="phone_secondary"
                                        value={data.phone_secondary}
                                        onChange={(e) => setData('phone_secondary', e.target.value)}
                                        placeholder="08198765432"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="email@example.com"
                                    />
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="mb-4 font-medium">Kontak Darurat</h4>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="emergency_contact_name">Nama</Label>
                                        <Input
                                            id="emergency_contact_name"
                                            value={data.emergency_contact_name}
                                            onChange={(e) => setData('emergency_contact_name', e.target.value)}
                                            placeholder="Nama kontak darurat"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="emergency_contact_phone">No. HP</Label>
                                        <Input
                                            id="emergency_contact_phone"
                                            value={data.emergency_contact_phone}
                                            onChange={(e) => setData('emergency_contact_phone', e.target.value)}
                                            placeholder="08123456789"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="emergency_contact_relation">Hubungan</Label>
                                        <Input
                                            id="emergency_contact_relation"
                                            value={data.emergency_contact_relation}
                                            onChange={(e) => setData('emergency_contact_relation', e.target.value)}
                                            placeholder="Istri/Suami/Orang Tua"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Data Kepegawaian */}
                    <Card>
                        <CardHeader>
                            <div className="py-4">
                                <CardTitle>Data Kepegawaian</CardTitle>
                                <CardDescription>Informasi pekerjaan dan kontrak</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="job_category_id">Kategori Pekerjaan *</Label>
                                    <SearchableSelect
                                        options={jobCategoryOptions}
                                        value={data.job_category_id}
                                        onValueChange={(value) => setData('job_category_id', value)}
                                        placeholder="Pilih kategori"
                                        className={errors.job_category_id ? '[&>button]:border-red-500' : ''}
                                    />
                                    {errors.job_category_id && <small className="text-red-500">{errors.job_category_id}</small>}
                                    <p className="text-xs text-muted-foreground">Kode kategori digunakan untuk NIK</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="employment_status_id">Status Kepegawaian *</Label>
                                    <SearchableSelect
                                        options={employmentStatusOptions}
                                        value={data.employment_status_id}
                                        onValueChange={(value) => setData('employment_status_id', value)}
                                        placeholder="Pilih status"
                                        className={errors.employment_status_id ? '[&>button]:border-red-500' : ''}
                                    />
                                    {errors.employment_status_id && <small className="text-red-500">{errors.employment_status_id}</small>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="organization_unit_id">Unit Organisasi</Label>
                                    <SearchableSelect
                                        options={organizationUnitOptions}
                                        value={data.organization_unit_id}
                                        onValueChange={(value) => setData('organization_unit_id', value)}
                                        placeholder="Pilih unit"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="position">Jabatan</Label>
                                    <Input
                                        id="position"
                                        value={data.position}
                                        onChange={(e) => setData('position', e.target.value)}
                                        placeholder="Staff Perawat"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="join_date">Tanggal Masuk *</Label>
                                    <Input
                                        id="join_date"
                                        type="date"
                                        value={data.join_date}
                                        onChange={(e) => setData('join_date', e.target.value)}
                                        className={errors.join_date ? 'border-red-500' : ''}
                                    />
                                    {errors.join_date && <small className="text-red-500">{errors.join_date}</small>}
                                    <p className="text-xs text-muted-foreground">Tahun masuk digunakan untuk NIK</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contract_start_date">Mulai Kontrak</Label>
                                    <Input
                                        id="contract_start_date"
                                        type="date"
                                        value={data.contract_start_date}
                                        onChange={(e) => setData('contract_start_date', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contract_end_date">Akhir Kontrak</Label>
                                    <Input
                                        id="contract_end_date"
                                        type="date"
                                        value={data.contract_end_date}
                                        onChange={(e) => setData('contract_end_date', e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Data Pendidikan */}
                    <Card>
                        <CardHeader>
                            <div className="py-4">
                                <CardTitle>Data Pendidikan</CardTitle>
                                <CardDescription>Pendidikan terakhir karyawan</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="education_level_id">Tingkat Pendidikan</Label>
                                    <SearchableSelect
                                        options={educationLevelOptions}
                                        value={data.education_level_id}
                                        onValueChange={(value) => setData('education_level_id', value)}
                                        placeholder="Pilih tingkat"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="education_year">Tahun Lulus</Label>
                                    <Input
                                        id="education_year"
                                        type="number"
                                        min={1900}
                                        max={new Date().getFullYear()}
                                        value={data.education_year}
                                        onChange={(e) => setData('education_year', e.target.value)}
                                        placeholder="2020"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="education_institution">Institusi/Sekolah</Label>
                                    <Input
                                        id="education_institution"
                                        value={data.education_institution}
                                        onChange={(e) => setData('education_institution', e.target.value)}
                                        placeholder="Universitas Indonesia"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="education_major">Jurusan</Label>
                                    <Input
                                        id="education_major"
                                        value={data.education_major}
                                        onChange={(e) => setData('education_major', e.target.value)}
                                        placeholder="Ilmu Keperawatan"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dokumen & Akun Bank */}
                    <Card>
                        <CardHeader>
                            <div className="py-4">
                                <CardTitle>Dokumen & Akun Bank</CardTitle>
                                <CardDescription>Nomor dokumen dan informasi bank</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="npwp_number">No. NPWP</Label>
                                    <Input
                                        id="npwp_number"
                                        value={data.npwp_number}
                                        onChange={(e) => setData('npwp_number', e.target.value)}
                                        placeholder="12.345.678.9-012.000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bpjs_kesehatan_number">No. BPJS Kesehatan</Label>
                                    <Input
                                        id="bpjs_kesehatan_number"
                                        value={data.bpjs_kesehatan_number}
                                        onChange={(e) => setData('bpjs_kesehatan_number', e.target.value)}
                                        placeholder="0001234567890"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bpjs_ketenagakerjaan_number">No. BPJS Ketenagakerjaan</Label>
                                    <Input
                                        id="bpjs_ketenagakerjaan_number"
                                        value={data.bpjs_ketenagakerjaan_number}
                                        onChange={(e) => setData('bpjs_ketenagakerjaan_number', e.target.value)}
                                        placeholder="0001234567890"
                                    />
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="mb-4 font-medium">Informasi Bank</h4>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="bank_name">Nama Bank</Label>
                                        <Input
                                            id="bank_name"
                                            value={data.bank_name}
                                            onChange={(e) => setData('bank_name', e.target.value)}
                                            placeholder="BCA"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bank_account_number">No. Rekening</Label>
                                        <Input
                                            id="bank_account_number"
                                            value={data.bank_account_number}
                                            onChange={(e) => setData('bank_account_number', e.target.value)}
                                            placeholder="1234567890"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bank_account_name">Nama Pemilik Rekening</Label>
                                        <Input
                                            id="bank_account_name"
                                            value={data.bank_account_name}
                                            onChange={(e) => setData('bank_account_name', e.target.value)}
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Catatan</Label>
                                    <Textarea
                                        id="notes"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder="Catatan tambahan..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </FormPage>
        </HRLayout>
    );
}
