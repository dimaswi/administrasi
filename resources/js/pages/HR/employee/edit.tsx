import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormPage } from '@/components/ui/form-page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import HRLayout from '@/layouts/hr-layout';
import { Head, useForm } from '@inertiajs/react';
import { Briefcase, FileText, Plus, Trash2, Users } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';

interface JobCategory {
    id: number;
    code: string;
    name: string;
    is_medical: boolean;
    requires_str: boolean;
    requires_sip: boolean;
}

interface EmploymentStatus {
    id: number;
    code: string;
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

interface EmployeeFamily {
    [key: string]: string | number | undefined;
    id?: number;
    name: string;
    relation: string;
    birth_date: string;
    occupation: string;
    phone: string;
}

interface EmployeeEducation {
    [key: string]: string | number | undefined;
    id?: number;
    education_level_id: string;
    institution_name: string;
    major: string;
    graduation_year: string;
    gpa: string;
}

interface EmployeeWorkHistory {
    [key: string]: string | number | undefined;
    id?: number;
    company_name: string;
    position: string;
    start_date: string;
    end_date: string;
    job_description: string;
    leaving_reason: string;
    reference_contact: string;
    reference_phone: string;
}

interface Employee {
    id: number;
    employee_id: string;
    user_id: number | null;
    job_category_id: number;
    employment_status_id: number;
    organization_unit_id: number | null;
    first_name: string;
    last_name: string | null;
    full_name: string;
    nik: string | null;
    npwp_number: string | null;
    place_of_birth: string | null;
    date_of_birth: string | null;
    gender: string;
    religion: string | null;
    blood_type: string | null;
    marital_status: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
    postal_code: string | null;
    phone: string | null;
    phone_secondary: string | null;
    email: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    emergency_contact_relation: string | null;
    position: string | null;
    join_date: string;
    contract_start_date: string | null;
    contract_end_date: string | null;
    str_number: string | null;
    str_expiry_date: string | null;
    sip_number: string | null;
    sip_expiry_date: string | null;
    bpjs_kesehatan_number: string | null;
    bpjs_ketenagakerjaan_number: string | null;
    bank_name: string | null;
    bank_account_number: string | null;
    bank_account_name: string | null;
    status: string;
    notes: string | null;
    job_category?: JobCategory;
    families?: EmployeeFamily[];
    educations?: EmployeeEducation[];
    work_histories?: EmployeeWorkHistory[];
}

interface FormData {
    [key: string]: string | EmployeeFamily[] | EmployeeEducation[] | EmployeeWorkHistory[];
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
    str_number: string;
    str_expiry_date: string;
    sip_number: string;
    sip_expiry_date: string;
    npwp_number: string;
    bpjs_kesehatan_number: string;
    bpjs_ketenagakerjaan_number: string;
    bank_name: string;
    bank_account_number: string;
    bank_account_name: string;
    notes: string;
    families: EmployeeFamily[];
    educations: EmployeeEducation[];
    work_histories: EmployeeWorkHistory[];
}

interface Props {
    employee: Employee;
    jobCategories: JobCategory[];
    employmentStatuses: EmploymentStatus[];
    educationLevels: EducationLevel[];
    organizationUnits: OrganizationUnit[];
}

// Static options - same as create.tsx for consistency
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

const familyRelationOptions = [
    { value: 'Suami', label: 'Suami' },
    { value: 'Istri', label: 'Istri' },
    { value: 'Anak', label: 'Anak' },
    { value: 'Ayah', label: 'Ayah' },
    { value: 'Ibu', label: 'Ibu' },
];

export default function EditEmployee({ employee, jobCategories, employmentStatuses, educationLevels, organizationUnits }: Props) {
    const selectedJobCategory = jobCategories.find((jc) => jc.id === employee.job_category_id);
    const [currentJobCategory, setCurrentJobCategory] = useState<JobCategory | null>(selectedJobCategory || null);

    const breadcrumbs = [
        { title: <Users className="h-4 w-4" />, href: '/hr/employees' },
        { title: employee.full_name, href: `/hr/employees/${employee.id}` },
        { title: 'Edit', href: `/hr/employees/${employee.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm<FormData>({
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        nik: employee.nik || '',
        gender: employee.gender || '',
        place_of_birth: employee.place_of_birth || '',
        date_of_birth: employee.date_of_birth || '',
        religion: employee.religion || '',
        marital_status: employee.marital_status || '',
        blood_type: employee.blood_type || '',
        address: employee.address || '',
        city: employee.city || '',
        province: employee.province || '',
        postal_code: employee.postal_code || '',
        phone: employee.phone || '',
        phone_secondary: employee.phone_secondary || '',
        email: employee.email || '',
        emergency_contact_name: employee.emergency_contact_name || '',
        emergency_contact_phone: employee.emergency_contact_phone || '',
        emergency_contact_relation: employee.emergency_contact_relation || '',
        job_category_id: employee.job_category_id?.toString() || '',
        employment_status_id: employee.employment_status_id?.toString() || '',
        organization_unit_id: employee.organization_unit_id?.toString() || '',
        position: employee.position || '',
        join_date: employee.join_date || '',
        contract_start_date: employee.contract_start_date || '',
        contract_end_date: employee.contract_end_date || '',
        str_number: employee.str_number || '',
        str_expiry_date: employee.str_expiry_date || '',
        sip_number: employee.sip_number || '',
        sip_expiry_date: employee.sip_expiry_date || '',
        npwp_number: employee.npwp_number || '',
        bpjs_kesehatan_number: employee.bpjs_kesehatan_number || '',
        bpjs_ketenagakerjaan_number: employee.bpjs_ketenagakerjaan_number || '',
        bank_name: employee.bank_name || '',
        bank_account_number: employee.bank_account_number || '',
        bank_account_name: employee.bank_account_name || '',
        notes: employee.notes || '',
        families:
            employee.families?.map((f) => ({
                id: f.id,
                name: f.name || '',
                relation: f.relation || '',
                birth_date: f.birth_date || '',
                occupation: f.occupation || '',
                phone: f.phone || '',
            })) || [],
        educations:
            employee.educations?.map((e) => ({
                id: e.id,
                education_level_id: e.education_level_id?.toString() || '',
                institution_name: e.institution_name || '',
                major: e.major || '',
                graduation_year: e.graduation_year?.toString() || '',
                gpa: e.gpa?.toString() || '',
            })) || [],
        work_histories:
            employee.work_histories?.map((wh) => ({
                id: wh.id,
                company_name: wh.company_name || '',
                position: wh.position || '',
                start_date: wh.start_date || '',
                end_date: wh.end_date || '',
                job_description: wh.job_description || '',
                leaving_reason: wh.leaving_reason || '',
                reference_contact: wh.reference_contact || '',
                reference_phone: wh.reference_phone || '',
            })) || [],
    });

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

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(`/hr/employees/${employee.id}`, {
            onError: () => toast.error('Gagal memperbarui data karyawan'),
        });
    };

    const handleJobCategoryChange = (value: string) => {
        setData('job_category_id', value);
        const category = jobCategories.find((jc) => jc.id.toString() === value);
        setCurrentJobCategory(category || null);
    };

    // Family handlers
    const addFamily = () => {
        setData('families', [...data.families, { name: '', relation: '', birth_date: '', occupation: '', phone: '' }]);
    };

    const removeFamily = (index: number) => {
        setData(
            'families',
            data.families.filter((_, i) => i !== index),
        );
    };

    const updateFamily = (index: number, field: keyof EmployeeFamily, value: string) => {
        const updated = [...data.families];
        updated[index] = { ...updated[index], [field]: value };
        setData('families', updated);
    };

    // Education handlers
    const addEducation = () => {
        setData('educations', [...data.educations, { education_level_id: '', institution_name: '', major: '', graduation_year: '', gpa: '' }]);
    };

    const removeEducation = (index: number) => {
        setData(
            'educations',
            data.educations.filter((_, i) => i !== index),
        );
    };

    const updateEducation = (index: number, field: keyof EmployeeEducation, value: string) => {
        const updated = [...data.educations];
        updated[index] = { ...updated[index], [field]: value };
        setData('educations', updated);
    };

    // Work History handlers
    const addWorkHistory = () => {
        setData('work_histories', [
            ...data.work_histories,
            {
                company_name: '',
                position: '',
                start_date: '',
                end_date: '',
                job_description: '',
                leaving_reason: '',
                reference_contact: '',
                reference_phone: '',
            },
        ]);
    };

    const removeWorkHistory = (index: number) => {
        setData(
            'work_histories',
            data.work_histories.filter((_, i) => i !== index),
        );
    };

    const updateWorkHistory = (index: number, field: keyof EmployeeWorkHistory, value: string) => {
        const updated = [...data.work_histories];
        updated[index] = { ...updated[index], [field]: value };
        setData('work_histories', updated);
    };

    return (
        <HRLayout>
            <Head title={`Edit ${employee.full_name}`} />

            <FormPage
                title={`Edit ${employee.full_name}`}
                description={`ID Karyawan: ${employee.employee_id}`}
                backUrl="/hr/employees"
                onSubmit={handleSubmit}
                isLoading={processing}
                submitLabel="Simpan Perubahan"
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

                    {/* Data Keluarga */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between py-4">
                                <div>
                                    <CardTitle>Data Keluarga</CardTitle>
                                    <CardDescription>Informasi anggota keluarga karyawan</CardDescription>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={addFamily}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Tambah Keluarga
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {data.families.length === 0 ? (
                                <p className="py-4 text-center text-muted-foreground">
                                    Belum ada data keluarga. Klik tombol "Tambah Keluarga" untuk menambahkan.
                                </p>
                            ) : (
                                data.families.map((family, index) => (
                                    <div key={index} className="space-y-4 rounded-lg border p-4">
                                        <div className="flex justify-end">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeFamily(index)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            <div className="space-y-2">
                                                <Label>Nama</Label>
                                                <Input
                                                    value={family.name}
                                                    onChange={(e) => updateFamily(index, 'name', e.target.value)}
                                                    placeholder="Nama anggota keluarga"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Hubungan</Label>
                                                <SearchableSelect
                                                    options={familyRelationOptions}
                                                    value={family.relation}
                                                    onValueChange={(value) => updateFamily(index, 'relation', value)}
                                                    placeholder="Pilih hubungan"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Tanggal Lahir</Label>
                                                <Input
                                                    type="date"
                                                    value={family.birth_date}
                                                    onChange={(e) => updateFamily(index, 'birth_date', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Pekerjaan</Label>
                                                <Input
                                                    value={family.occupation}
                                                    onChange={(e) => updateFamily(index, 'occupation', e.target.value)}
                                                    placeholder="Pekerjaan"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>No. HP</Label>
                                                <Input
                                                    value={family.phone}
                                                    onChange={(e) => updateFamily(index, 'phone', e.target.value)}
                                                    placeholder="08123456789"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
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
                                        onValueChange={handleJobCategoryChange}
                                        placeholder="Pilih kategori"
                                        className={errors.job_category_id ? '[&>button]:border-red-500' : ''}
                                    />
                                    {errors.job_category_id && <small className="text-red-500">{errors.job_category_id}</small>}
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

                            {/* STR & SIP for Medical Categories */}
                            {currentJobCategory?.is_medical && (
                                <div className="space-y-4 border-t pt-4">
                                    <h4 className="font-medium">Data Tenaga Medis</h4>

                                    {currentJobCategory.requires_str && (
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="str_number">Nomor STR</Label>
                                                <Input
                                                    id="str_number"
                                                    value={data.str_number}
                                                    onChange={(e) => setData('str_number', e.target.value)}
                                                    placeholder="Nomor STR"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="str_expiry_date">Masa Berlaku STR</Label>
                                                <Input
                                                    id="str_expiry_date"
                                                    type="date"
                                                    value={data.str_expiry_date}
                                                    onChange={(e) => setData('str_expiry_date', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {currentJobCategory.requires_sip && (
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="sip_number">Nomor SIP</Label>
                                                <Input
                                                    id="sip_number"
                                                    value={data.sip_number}
                                                    onChange={(e) => setData('sip_number', e.target.value)}
                                                    placeholder="Nomor SIP"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="sip_expiry_date">Masa Berlaku SIP</Label>
                                                <Input
                                                    id="sip_expiry_date"
                                                    type="date"
                                                    value={data.sip_expiry_date}
                                                    onChange={(e) => setData('sip_expiry_date', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Riwayat Pendidikan */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between py-4">
                                <div>
                                    <CardTitle>Riwayat Pendidikan</CardTitle>
                                    <CardDescription>Informasi pendidikan formal karyawan</CardDescription>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={addEducation}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Tambah Pendidikan
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {data.educations.length === 0 ? (
                                <p className="py-4 text-center text-muted-foreground">
                                    Belum ada data pendidikan. Klik tombol "Tambah Pendidikan" untuk menambahkan.
                                </p>
                            ) : (
                                data.educations.map((education, index) => (
                                    <div key={index} className="space-y-4 rounded-lg border p-4">
                                        <div className="flex justify-end">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeEducation(index)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            <div className="space-y-2">
                                                <Label>Jenjang Pendidikan</Label>
                                                <SearchableSelect
                                                    options={educationLevelOptions}
                                                    value={education.education_level_id}
                                                    onValueChange={(value) => updateEducation(index, 'education_level_id', value)}
                                                    placeholder="Pilih jenjang"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Nama Institusi</Label>
                                                <Input
                                                    value={education.institution_name}
                                                    onChange={(e) => updateEducation(index, 'institution_name', e.target.value)}
                                                    placeholder="Nama sekolah/universitas"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Jurusan/Program Studi</Label>
                                                <Input
                                                    value={education.major}
                                                    onChange={(e) => updateEducation(index, 'major', e.target.value)}
                                                    placeholder="Jurusan/Prodi"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Tahun Lulus</Label>
                                                <Input
                                                    type="number"
                                                    value={education.graduation_year}
                                                    onChange={(e) => updateEducation(index, 'graduation_year', e.target.value)}
                                                    placeholder="2020"
                                                    min={1950}
                                                    max={new Date().getFullYear()}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>IPK/Nilai</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={education.gpa}
                                                    onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                                                    placeholder="3.50"
                                                    min={0}
                                                    max={4}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Riwayat Pekerjaan */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between py-4">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Briefcase className="h-5 w-5" />
                                        Riwayat Pekerjaan
                                    </CardTitle>
                                    <CardDescription>Pengalaman kerja sebelumnya</CardDescription>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={addWorkHistory}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Tambah Riwayat
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {data.work_histories.length === 0 ? (
                                <p className="py-4 text-center text-muted-foreground">
                                    Belum ada data riwayat pekerjaan. Klik tombol "Tambah Riwayat" untuk menambahkan.
                                </p>
                            ) : (
                                data.work_histories.map((workHistory, index) => (
                                    <div key={index} className="space-y-4 rounded-lg border p-4">
                                        <div className="flex justify-end">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeWorkHistory(index)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>Nama Perusahaan</Label>
                                                <Input
                                                    value={workHistory.company_name}
                                                    onChange={(e) => updateWorkHistory(index, 'company_name', e.target.value)}
                                                    placeholder="PT. ABC Indonesia"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Posisi/Jabatan</Label>
                                                <Input
                                                    value={workHistory.position}
                                                    onChange={(e) => updateWorkHistory(index, 'position', e.target.value)}
                                                    placeholder="Staff Admin"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Tanggal Mulai</Label>
                                                <Input
                                                    type="date"
                                                    value={workHistory.start_date}
                                                    onChange={(e) => updateWorkHistory(index, 'start_date', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Tanggal Selesai</Label>
                                                <Input
                                                    type="date"
                                                    value={workHistory.end_date}
                                                    onChange={(e) => updateWorkHistory(index, 'end_date', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Deskripsi Pekerjaan</Label>
                                            <Textarea
                                                value={workHistory.job_description}
                                                onChange={(e) => updateWorkHistory(index, 'job_description', e.target.value)}
                                                placeholder="Deskripsi tugas dan tanggung jawab..."
                                                rows={2}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Alasan Keluar</Label>
                                            <Input
                                                value={workHistory.leaving_reason}
                                                onChange={(e) => updateWorkHistory(index, 'leaving_reason', e.target.value)}
                                                placeholder="Mencari tantangan baru, habis kontrak, dll"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>Nama Referensi</Label>
                                                <Input
                                                    value={workHistory.reference_contact}
                                                    onChange={(e) => updateWorkHistory(index, 'reference_contact', e.target.value)}
                                                    placeholder="Nama atasan/HRD"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>No. HP Referensi</Label>
                                                <Input
                                                    value={workHistory.reference_phone}
                                                    onChange={(e) => updateWorkHistory(index, 'reference_phone', e.target.value)}
                                                    placeholder="08123456789"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
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

                            <div className="border-t pt-4">
                                <h4 className="mb-4 font-medium">Upload Dokumen</h4>
                                <p className="mb-4 text-sm text-muted-foreground">Fitur upload dokumen akan tersedia pada update berikutnya.</p>
                                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                    {['Foto', 'KTP', 'NPWP', 'Ijazah', 'STR', 'SIP', 'BPJS'].map((doc) => (
                                        <div
                                            key={doc}
                                            className="cursor-pointer rounded-lg border-2 border-dashed p-4 text-center hover:border-primary"
                                        >
                                            <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                                            <p className="mt-2 text-sm text-muted-foreground">{doc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </FormPage>
        </HRLayout>
    );
}
