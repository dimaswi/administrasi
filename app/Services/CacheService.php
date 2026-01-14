<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;

class CacheService
{
    /**
     * Default cache TTL in seconds (5 minutes)
     */
    const DEFAULT_TTL = 300;

    /**
     * Short cache TTL in seconds (1 minute)
     */
    const SHORT_TTL = 60;

    /**
     * Long cache TTL in seconds (30 minutes)
     */
    const LONG_TTL = 1800;

    /**
     * Dashboard cache TTL in seconds (2 minutes)
     */
    const DASHBOARD_TTL = 120;

    /**
     * Cache key prefixes
     */
    const PREFIX_DASHBOARD = 'dashboard';
    const PREFIX_MEETINGS = 'meetings';
    const PREFIX_LETTERS = 'letters';
    const PREFIX_ARCHIVES = 'archives';
    const PREFIX_USERS = 'users';
    const PREFIX_ROLES = 'roles';
    const PREFIX_PERMISSIONS = 'permissions';
    const PREFIX_ROOMS = 'rooms';
    const PREFIX_ORGANIZATIONS = 'organizations';
    const PREFIX_TEMPLATES = 'templates';
    const PREFIX_NOTIFICATIONS = 'notifications';
    const PREFIX_DISPOSITIONS = 'dispositions';

    /**
     * Generate a cache key with prefix
     */
    public static function key(string $prefix, string ...$parts): string
    {
        return implode(':', array_merge([$prefix], $parts));
    }

    /**
     * Generate a user-specific cache key
     */
    public static function userKey(string $prefix, string ...$parts): string
    {
        $userId = Auth::id() ?? 'guest';
        return implode(':', array_merge([$prefix, "user_{$userId}"], $parts));
    }

    /**
     * Get cached data or execute callback and cache result
     */
    public static function remember(string $key, int $ttl, callable $callback)
    {
        return Cache::remember($key, $ttl, $callback);
    }

    /**
     * Get cached data or execute callback and cache result forever
     */
    public static function rememberForever(string $key, callable $callback)
    {
        return Cache::rememberForever($key, $callback);
    }

    /**
     * Store data in cache
     */
    public static function put(string $key, $value, int $ttl = self::DEFAULT_TTL): bool
    {
        return Cache::put($key, $value, $ttl);
    }

    /**
     * Get data from cache
     */
    public static function get(string $key, $default = null)
    {
        return Cache::get($key, $default);
    }

    /**
     * Check if key exists in cache
     */
    public static function has(string $key): bool
    {
        return Cache::has($key);
    }

    /**
     * Remove data from cache
     */
    public static function forget(string $key): bool
    {
        return Cache::forget($key);
    }

    /**
     * Clear all cache with specific prefix pattern
     */
    public static function forgetByPrefix(string $prefix): void
    {
        // For Redis, we can use tags or pattern matching
        // This is a simple implementation that clears by tag
        Cache::tags([$prefix])->flush();
    }

    /**
     * Clear dashboard cache
     */
    public static function clearDashboardCache(): void
    {
        $keys = [
            self::key(self::PREFIX_DASHBOARD, 'statistics'),
            self::key(self::PREFIX_DASHBOARD, 'meetings_trend'),
            self::key(self::PREFIX_DASHBOARD, 'archives_trend'),
            self::key(self::PREFIX_DASHBOARD, 'recent_meetings'),
            self::key(self::PREFIX_DASHBOARD, 'recent_archives'),
        ];

        foreach ($keys as $key) {
            self::forget($key);
        }
    }

    /**
     * Clear meeting cache
     */
    public static function clearMeetingCache(?int $meetingId = null): void
    {
        self::forget(self::key(self::PREFIX_MEETINGS, 'list'));
        self::forget(self::key(self::PREFIX_MEETINGS, 'calendar'));
        
        if ($meetingId) {
            self::forget(self::key(self::PREFIX_MEETINGS, 'detail', (string) $meetingId));
        }

        // Also clear dashboard cache since it shows meeting stats
        self::clearDashboardCache();
    }

    /**
     * Clear letter cache
     */
    public static function clearLetterCache(?int $letterId = null, string $type = 'incoming'): void
    {
        self::forget(self::key(self::PREFIX_LETTERS, $type, 'list'));
        
        if ($letterId) {
            self::forget(self::key(self::PREFIX_LETTERS, $type, 'detail', (string) $letterId));
        }

        // Also clear dashboard cache since it shows letter stats
        self::clearDashboardCache();
    }

    /**
     * Clear archive cache
     */
    public static function clearArchiveCache(?int $archiveId = null): void
    {
        self::forget(self::key(self::PREFIX_ARCHIVES, 'list'));
        
        if ($archiveId) {
            self::forget(self::key(self::PREFIX_ARCHIVES, 'detail', (string) $archiveId));
        }

        // Also clear dashboard cache since it shows archive stats
        self::clearDashboardCache();
    }

    /**
     * Clear user cache
     */
    public static function clearUserCache(?int $userId = null): void
    {
        self::forget(self::key(self::PREFIX_USERS, 'list'));
        self::forget(self::key(self::PREFIX_USERS, 'all'));
        
        if ($userId) {
            self::forget(self::key(self::PREFIX_USERS, 'detail', (string) $userId));
        }
    }

    /**
     * Clear role cache
     */
    public static function clearRoleCache(?int $roleId = null): void
    {
        self::forget(self::key(self::PREFIX_ROLES, 'list'));
        self::forget(self::key(self::PREFIX_ROLES, 'all'));
        
        if ($roleId) {
            self::forget(self::key(self::PREFIX_ROLES, 'detail', (string) $roleId));
        }
    }

    /**
     * Clear permission cache
     */
    public static function clearPermissionCache(): void
    {
        self::forget(self::key(self::PREFIX_PERMISSIONS, 'all'));
    }

    /**
     * Clear room cache
     */
    public static function clearRoomCache(?int $roomId = null): void
    {
        self::forget(self::key(self::PREFIX_ROOMS, 'list'));
        self::forget(self::key(self::PREFIX_ROOMS, 'active'));
        
        if ($roomId) {
            self::forget(self::key(self::PREFIX_ROOMS, 'detail', (string) $roomId));
        }

        // Also clear meeting cache since it uses rooms
        self::clearMeetingCache();
    }

    /**
     * Clear organization cache
     */
    public static function clearOrganizationCache(?int $orgId = null): void
    {
        self::forget(self::key(self::PREFIX_ORGANIZATIONS, 'list'));
        self::forget(self::key(self::PREFIX_ORGANIZATIONS, 'active'));
        
        if ($orgId) {
            self::forget(self::key(self::PREFIX_ORGANIZATIONS, 'detail', (string) $orgId));
        }
    }

    /**
     * Clear template cache
     */
    public static function clearTemplateCache(?int $templateId = null): void
    {
        self::forget(self::key(self::PREFIX_TEMPLATES, 'list'));
        self::forget(self::key(self::PREFIX_TEMPLATES, 'active'));
        
        if ($templateId) {
            self::forget(self::key(self::PREFIX_TEMPLATES, 'detail', (string) $templateId));
        }
    }

    /**
     * Clear disposition cache
     */
    public static function clearDispositionCache(?int $dispositionId = null): void
    {
        self::forget(self::key(self::PREFIX_DISPOSITIONS, 'list'));
        
        if ($dispositionId) {
            self::forget(self::key(self::PREFIX_DISPOSITIONS, 'detail', (string) $dispositionId));
        }

        // Clear related incoming letter cache
        self::clearLetterCache(null, 'incoming');
    }

    /**
     * Clear notification cache for a user
     */
    public static function clearNotificationCache(?int $userId = null): void
    {
        if ($userId) {
            self::forget(self::userKey(self::PREFIX_NOTIFICATIONS, (string) $userId));
        }
    }

    /**
     * Clear all application cache
     */
    public static function clearAll(): void
    {
        Cache::flush();
    }
}
