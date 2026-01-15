import { NavMain, NavMainWithSub } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { WorkspaceSwitcherHR } from '@/components/workspace-switcher-hr';
import { 
    Sidebar, 
    SidebarContent, 
    SidebarFooter, 
    SidebarHeader,
} from '@/components/ui/sidebar';
import { type NavItem, type NavItemWithSub } from '@/types';
import { 
    LayoutDashboard, 
    Users, 
    CalendarCheck, 
    CalendarOff, 
    Wallet, 
    Clock, 
    FileText, 
    GraduationCap,
    Target,
    BarChart3,
    Calendar,
    Briefcase,
    ClipboardList,
    FileBarChart,
    UserCheck,
    Scale,
    TrendingDown,
} from 'lucide-react';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/hr',
        icon: LayoutDashboard,
    },
];

const reportNavItem: NavItemWithSub = {
    title: 'Laporan',
    icon: FileBarChart,
    items: [
        { title: 'Semua Laporan', href: '/hr/reports' },
        { title: 'Laporan Karyawan', href: '/hr/reports/employee' },
        { title: 'Laporan Cuti', href: '/hr/reports/leave' },
        { title: 'Laporan Training', href: '/hr/reports/training' },
        { title: 'Laporan Kinerja', href: '/hr/reports/performance' },
        { title: 'Laporan Turnover', href: '/hr/reports/turnover' },
    ],
};

const employeeNavItems: NavItem[] = [
    {
        title: 'Data Karyawan',
        href: '/hr/employees',
        icon: Users,
    },
    {
        title: 'Kehadiran',
        href: '/hr/attendances',
        icon: CalendarCheck,
    },
    {
        title: 'Cuti & Izin',
        href: '/hr/leaves',
        icon: CalendarOff,
    },
    {
        title: 'Saldo Cuti',
        href: '/hr/leave-balances',
        icon: Wallet,
    },
    {
        title: 'Jadwal Kerja',
        href: '/hr/schedules',
        icon: Clock,
    },
    {
        title: 'Kredensial',
        href: '/hr/credentials',
        icon: FileText,
    },
];

const trainingNavItems: NavItem[] = [
    {
        title: 'Daftar Training',
        href: '/hr/trainings',
        icon: GraduationCap,
    },
    {
        title: 'Peserta Training',
        href: '/hr/employee-trainings',
        icon: Users,
    },
];

const performanceNavItems: NavItem[] = [
    {
        title: 'Penilaian Kinerja',
        href: '/hr/performance-reviews',
        icon: BarChart3,
    },
    {
        title: '360 Feedback',
        href: '/hr/feedback360',
        icon: UserCheck,
    },
    {
        title: 'Kalibrasi',
        href: '/hr/calibration',
        icon: Scale,
    },
    {
        title: 'Periode Penilaian',
        href: '/hr/performance-periods',
        icon: Calendar,
    },
    {
        title: 'Kategori & KPI',
        href: '/hr/kpi',
        icon: Target,
    },
];

const masterNavItems: NavItem[] = [
    {
        title: 'Template Jadwal',
        href: '/hr/work-schedules',
        icon: Clock,
    },
    {
        title: 'Jenis Cuti',
        href: '/hr/leave-types',
        icon: FileText,
    },
    {
        title: 'Kategori Pekerjaan',
        href: '/hr/job-categories',
        icon: Briefcase,
    },
    {
        title: 'Status Kepegawaian',
        href: '/hr/employment-statuses',
        icon: ClipboardList,
    },
    {
        title: 'Tingkat Pendidikan',
        href: '/hr/education-levels',
        icon: GraduationCap,
    },
];

export function HRSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <WorkspaceSwitcherHR />
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} label="Menu" />
                <NavMainWithSub item={reportNavItem} />
                <NavMain items={employeeNavItems} label="Karyawan" />
                <NavMain items={trainingNavItems} label="Training" />
                <NavMain items={performanceNavItems} label="Kinerja" />
                <NavMain items={masterNavItems} label="Master Data" />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
