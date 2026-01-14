export interface User {
    id: number;
    name: string;
    nip: string | null;
}

export interface Employee {
    id: number;
    employee_id: string;
    user_id: number | null;
    user: User | null;
    first_name: string;
    last_name: string | null;
    full_name: string;
    nik: string | null;
    gender: 'male' | 'female';
    place_of_birth: string | null;
    date_of_birth: string | null;
    religion: string | null;
    marital_status: string | null;
    blood_type: string | null;
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
    permanent_date: string | null;
    status: string;
    photo: string | null;
    npwp_number: string | null;
    bpjs_kesehatan_number: string | null;
    bpjs_ketenagakerjaan_number: string | null;
    bank_name: string | null;
    bank_account_number: string | null;
    bank_account_name: string | null;
    notes: string | null;
    education_institution: string | null;
    education_major: string | null;
    education_year: number | null;
    job_category: { id: number; name: string; is_medical: boolean } | null;
    employment_status: { id: number; name: string } | null;
    organization_unit: { id: number; name: string } | null;
    education_level: { id: number; name: string } | null;
    families: EmployeeFamily[];
    educations: EmployeeEducation[];
    work_histories: EmployeeWorkHistory[];
}

export interface EmployeeFamily {
    id: number;
    name: string;
    relation: string;
    nik: string | null;
    gender: string | null;
    place_of_birth: string | null;
    date_of_birth: string | null;
    occupation: string | null;
    phone: string | null;
    is_emergency_contact: boolean;
    is_dependent: boolean;
    notes: string | null;
}

export interface EmployeeEducation {
    id: number;
    institution: string;
    major: string | null;
    start_year: number | null;
    end_year: number | null;
    gpa: number | null;
    certificate_number: string | null;
    is_highest: boolean;
    notes: string | null;
    education_level: { id: number; name: string } | null;
}

export interface EmployeeWorkHistory {
    id: number;
    company_name: string;
    position: string;
    start_date: string;
    end_date: string | null;
    job_description: string | null;
    leaving_reason: string | null;
    reference_contact: string | null;
    reference_phone: string | null;
}

export interface EducationLevel {
    id: number;
    code: string;
    name: string;
}

export const maritalLabels: Record<string, string> = {
    single: 'Belum Menikah',
    married: 'Menikah',
    divorced: 'Cerai',
    widowed: 'Duda/Janda',
};

export const relationLabels: Record<string, string> = {
    spouse: 'Pasangan',
    child: 'Anak',
    parent: 'Orang Tua',
    sibling: 'Saudara Kandung',
    other: 'Lainnya',
};

export const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

export const formatDateShort = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};
