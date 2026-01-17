import { NavMain, NavMainWithSub } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
<<<<<<< HEAD
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar';
import { WorkspaceSwitcherHR } from '@/components/workspace-switcher-hr';
import { type NavItem, type NavItemWithSub } from '@/types';
import {
    BarChart3,
    BookOpen,
    Briefcase,
    Calendar,
    CalendarCheck,
    CalendarOff,
    ClipboardList,
    Clock,
    FileBarChart,
    FileText,
    GraduationCap,
    Key,
    LayoutDashboard,
    LayoutGrid,
    Megaphone,
    Scale,
    Shield,
    Target,
    UserCheck,
    Users,
    Wallet,
=======
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
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
} from 'lucide-react';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/hr',
        icon: LayoutDashboard,
    },
<<<<<<< HEAD
    {
        title: 'Pengumuman',
        href: '/hr/announcements',
        icon: Megaphone,
    },
=======
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
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
<<<<<<< HEAD
        title: 'Izin Pulang Cepat',
        href: '/hr/early-leave-requests',
        icon: Clock,
    },
    {
=======
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
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
<<<<<<< HEAD
        title: 'Daftar User',
        href: '/hr/access/users',
        icon: Users,
    },
    {
        title: 'Daftar Role',
        href: '/hr/access/roles',
        icon: Shield,
    },
    {
        title: 'Daftar Permission',
        href: '/hr/access/permissions',
        icon: Key,
    },
    {
        title: 'Unit Organisasi',
        href: '/hr/organizations',
        icon: BookOpen,
    },
    {
=======
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
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
