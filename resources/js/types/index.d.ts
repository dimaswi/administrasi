import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
    permissions: string[];
}

export interface BreadcrumbItem {
    title: string | JSX.Element;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    children?: NavItem[];
    permission?: string;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    nip: string;
    password?: string;
    role_id?: number | null;
    organization_unit_id?: number | null;
    position?: string | null;
    phone?: string | null;
    remember_token?: string | null;
    created_at: string;
    updated_at: string;
    role?: Role;
    organization_unit?: OrganizationUnit;
}

export interface Role {
    id: number;
    name: string;
    display_name: string;
    description?: string | null;
    created_at: string;
    updated_at: string;
    permissions?: Permission[];
    users?: User[];
    users_count?: number;
}

export interface Permission {
    id: number;
    name: string;
    display_name: string;
    description?: string | null;
    module: string;
    created_at: string;
    updated_at: string;
    roles?: Role[];
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

// Meeting Module Types
export interface OrganizationUnit {
    id: number;
    code: string;
    name: string;
    description?: string | null;
    parent_id?: number | null;
    level: number;
    head_id?: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    parent?: OrganizationUnit | null;
    head?: User | null;
    children?: OrganizationUnit[];
    users?: User[];
    meetings?: Meeting[];
    users_count?: number;
    children_count?: number;
    full_path?: string;
}

export interface Room {
    id: number;
    code: string;
    name: string;
    building?: string | null;
    floor?: string | null;
    capacity: number;
    facilities?: string | null;
    description?: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    meetings?: Meeting[];
    meetings_count?: number;
    location?: string;
}

export interface Meeting {
    id: number;
    meeting_number: string;
    title: string;
    agenda: string;
    meeting_date: string;
    start_time: string;
    end_time: string;
    room_id: number;
    organizer_id: number;
    organization_unit_id?: number | null;
    status: 'draft' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
    notes?: string | null;
    minutes_of_meeting?: string | null;
    memo_content?: string | null;
    invitation_file?: string | null;
    memo_file?: string | null;
    attendance_file?: string | null;
    created_at: string;
    updated_at: string;
    room?: Room;
    organizer?: User;
    organization_unit?: OrganizationUnit | null;
    participants?: MeetingParticipant[];
    participants_count?: number;
    attended_participants_count?: number;
    status_label?: string;
    status_color?: string;
}

export interface MeetingParticipant {
    id: number;
    meeting_id: number;
    user_id: number;
    role: 'participant' | 'moderator' | 'secretary' | 'observer';
    attendance_status: 'invited' | 'confirmed' | 'attended' | 'absent' | 'excused';
    check_in_time?: string | null;
    notes?: string | null;
    created_at: string;
    updated_at: string;
    meeting?: Meeting;
    user?: User;
    role_label?: string;
    attendance_status_label?: string;
    attendance_status_color?: string;
}

