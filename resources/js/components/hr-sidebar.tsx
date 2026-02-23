import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar';
import { WorkspaceSwitcherHR } from '@/components/workspace-switcher-hr';
import { type NavItem } from '@/types';
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
    Megaphone,
    Scale,
    Shield,
    Target,
    UserCheck,
    Users,
    Wallet,
    FolderOpen,
    Award,
    Settings2,
} from 'lucide-react';

const navItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/hr',
        icon: LayoutDashboard,
    },
    {
        title: 'Pengumuman',
        href: '/hr/announcements',
        icon: Megaphone,
    },
    {
        title: 'Laporan',
        href: '/hr/reports',
        icon: FileBarChart,
        children: [
            { title: 'Laporan Karyawan', href: '/hr/reports/employee' },
            { title: 'Laporan Cuti', href: '/hr/reports/leave' },
            { title: 'Laporan Training', href: '/hr/reports/training' },
            { title: 'Laporan Kinerja', href: '/hr/reports/performance' },
            { title: 'Laporan Turnover', href: '/hr/reports/turnover' },
        ],
    },
    {
        title: 'Karyawan',
        href: '/hr/employees',
        icon: Users,
        children: [
            { title: 'Data Karyawan', href: '/hr/employees', icon: Users },
            { title: 'Kehadiran', href: '/hr/attendances', icon: CalendarCheck },
            { title: 'Cuti & Izin', href: '/hr/leaves', icon: CalendarOff },
            { title: 'Izin Pulang Cepat', href: '/hr/early-leave-requests', icon: Clock },
            { title: 'Saldo Cuti', href: '/hr/leave-balances', icon: Wallet },
            { title: 'Jadwal Kerja', href: '/hr/schedules', icon: Clock },
            { title: 'Kredensial', href: '/hr/credentials', icon: FileText },
        ],
    },
    {
        title: 'Training',
        href: '/hr/trainings',
        icon: GraduationCap,
        children: [
            { title: 'Daftar Training', href: '/hr/trainings', icon: GraduationCap },
            { title: 'Peserta Training', href: '/hr/employee-trainings', icon: Users },
        ],
    },
    {
        title: 'Kinerja',
        href: '/hr/performance-reviews',
        icon: Award,
        children: [
            { title: 'Penilaian Kinerja', href: '/hr/performance-reviews', icon: BarChart3 },
            { title: '360 Feedback', href: '/hr/feedback360', icon: UserCheck },
            { title: 'Kalibrasi', href: '/hr/calibration', icon: Scale },
            { title: 'Periode Penilaian', href: '/hr/performance-periods', icon: Calendar },
            { title: 'Kategori & KPI', href: '/hr/kpi', icon: Target },
        ],
    },
    {
        title: 'Master Data',
        href: '/hr/access/users',
        icon: Settings2,
        children: [
            { title: 'Daftar User', href: '/hr/access/users', icon: Users },
            { title: 'Daftar Role', href: '/hr/access/roles', icon: Shield },
            { title: 'Daftar Permission', href: '/hr/access/permissions', icon: Key },
            { title: 'Unit Organisasi', href: '/hr/organizations', icon: BookOpen },
            { title: 'Template Jadwal', href: '/hr/work-schedules', icon: Clock },
            { title: 'Jenis Cuti', href: '/hr/leave-types', icon: FileText },
            { title: 'Kategori Pekerjaan', href: '/hr/job-categories', icon: Briefcase },
            { title: 'Status Kepegawaian', href: '/hr/employment-statuses', icon: ClipboardList },
            { title: 'Tingkat Pendidikan', href: '/hr/education-levels', icon: GraduationCap },
        ],
    },
];

export function HRSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <WorkspaceSwitcherHR />
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={navItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
