import { usePage } from '@inertiajs/react';
import type { SharedData } from '@/types';

export function usePermission() {
    const { props } = usePage<SharedData>();
    const permissions = props.auth.permissions || [];
    const user = props.auth.user;

    const hasPermission = (permission: string): boolean => {
        return permissions.includes(permission);
    };

    const hasRole = (role: string): boolean => {
        return user?.role?.name === role;
    };

    const isAdmin = (): boolean => {
        return hasRole('admin');
    };

    const hasAnyPermission = (permissionsList: string[]): boolean => {
        return permissionsList.some(permission => hasPermission(permission));
    };

    return {
        hasPermission,
        hasRole,
        isAdmin,
        hasAnyPermission,
        permissions,
        user,
    };
}
