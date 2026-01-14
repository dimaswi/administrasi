import { Head, Link } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { DetailPage } from '@/components/ui/form-page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, User as UserIcon, Briefcase, GraduationCap, Users as UsersIcon, FileText, Stethoscope, Users, CreditCard } from 'lucide-react';
import {
    Employee,
    EducationLevel,
    User,
    PersonalTab,
    EmploymentTab,
    FamilyTab,
    EducationTab,
    WorkHistoryTab,
    DocumentsTab,
    CredentialTab,
} from './components';

interface Props {
    employee: Employee;
    educationLevels: EducationLevel[];
    availableUsers: User[];
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    active: { label: 'Aktif', variant: 'default' },
    inactive: { label: 'Nonaktif', variant: 'secondary' },
    resigned: { label: 'Resign', variant: 'outline' },
    terminated: { label: 'PHK', variant: 'destructive' },
};

export default function Show({ employee, educationLevels, availableUsers }: Props) {
    const breadcrumbs = [
        { title: <Users className="h-4 w-4" />, href: '/hr/employees' },
        { title: employee.full_name || `${employee.first_name} ${employee.last_name || ''}`, href: `/hr/employees/${employee.id}` },
    ];

    const getInitials = (name: string | null | undefined) => {
        if (!name) return 'NA';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const status = statusLabels[employee.status] || { label: employee.status, variant: 'secondary' as const };
    const fullName = employee.full_name || `${employee.first_name} ${employee.last_name || ''}`;

    return (
        <HRLayout>
            <Head title={`Detail ${fullName}`} />

            <DetailPage
                title={fullName}
                description={`${employee.employee_id} • ${employee.job_category?.name || '-'} • ${employee.position || '-'}`}
                backUrl="/hr/employees"
                actions={
                    <Button asChild>
                        <Link href={`/hr/employees/${employee.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                }
            >
                {/* Header with Avatar */}
                <div className="flex items-center gap-4 mb-6 pb-4 border-b">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={employee.photo ? `/storage/${employee.photo}` : undefined} />
                        <AvatarFallback className="text-lg">{getInitials(fullName)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-semibold">{fullName}</h2>
                            {employee.job_category?.is_medical && (
                                <Stethoscope className="h-4 w-4 text-blue-500" />
                            )}
                            <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <p className="text-muted-foreground">
                            {employee.job_category?.name || '-'} • {employee.position || '-'}
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="personal" className="space-y-4">
                    <TabsList className="bg-transparent border-b rounded-none w-full justify-start p-0 h-auto">
                        <TabsTrigger value="personal" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2">
                            <UserIcon className="h-4 w-4 mr-2" />
                            Personal
                        </TabsTrigger>
                        <TabsTrigger value="employment" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2">
                            <Briefcase className="h-4 w-4 mr-2" />
                            Kepegawaian
                        </TabsTrigger>
                        <TabsTrigger value="family" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2">
                            <UsersIcon className="h-4 w-4 mr-2" />
                            Keluarga
                        </TabsTrigger>
                        <TabsTrigger value="education" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2">
                            <GraduationCap className="h-4 w-4 mr-2" />
                            Pendidikan
                        </TabsTrigger>
                        <TabsTrigger value="work-history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2">
                            <Briefcase className="h-4 w-4 mr-2" />
                            Riwayat Kerja
                        </TabsTrigger>
                        <TabsTrigger value="documents" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2">
                            <FileText className="h-4 w-4 mr-2" />
                            Dokumen
                        </TabsTrigger>
                        <TabsTrigger value="credentials" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Kredensial
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="personal" className="pt-6">
                        <PersonalTab employee={employee} />
                    </TabsContent>

                    <TabsContent value="employment" className="pt-6">
                        <EmploymentTab employee={employee} availableUsers={availableUsers} />
                    </TabsContent>

                    <TabsContent value="family" className="pt-6">
                        <FamilyTab employee={employee} />
                    </TabsContent>

                    <TabsContent value="education" className="pt-6">
                        <EducationTab employee={employee} educationLevels={educationLevels} />
                    </TabsContent>

                    <TabsContent value="work-history" className="pt-6">
                        <WorkHistoryTab employee={employee} />
                    </TabsContent>

                    <TabsContent value="documents" className="pt-6">
                        <DocumentsTab employee={employee} />
                    </TabsContent>

                    <TabsContent value="credentials" className="pt-6">
                        <CredentialTab employee={employee} />
                    </TabsContent>
                </Tabs>
            </DetailPage>
        </HRLayout>
    );
}
