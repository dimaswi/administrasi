<?php

namespace App\Console\Commands;

use App\Services\CacheService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Redis;

class RedisCacheManage extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'redis:cache 
                            {action : The action to perform (clear, stats, keys)}
                            {--prefix= : Clear cache with specific prefix}
                            {--pattern= : Key pattern to search (for keys action)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Manage Redis cache for the application';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $action = $this->argument('action');

        return match ($action) {
            'clear' => $this->clearCache(),
            'stats' => $this->showStats(),
            'keys' => $this->listKeys(),
            default => $this->invalidAction(),
        };
    }

    /**
     * Clear cache
     */
    private function clearCache(): int
    {
        $prefix = $this->option('prefix');

        if ($prefix) {
            $this->info("Clearing cache with prefix: {$prefix}");
            
            match ($prefix) {
                'dashboard' => CacheService::clearDashboardCache(),
                'meetings' => CacheService::clearMeetingCache(),
                'letters' => CacheService::clearLetterCache(),
                'archives' => CacheService::clearArchiveCache(),
                'users' => CacheService::clearUserCache(),
                'roles' => CacheService::clearRoleCache(),
                'permissions' => CacheService::clearPermissionCache(),
                'rooms' => CacheService::clearRoomCache(),
                'organizations' => CacheService::clearOrganizationCache(),
                'templates' => CacheService::clearTemplateCache(),
                'dispositions' => CacheService::clearDispositionCache(),
                default => $this->warn("Unknown prefix: {$prefix}"),
            };
        } else {
            $this->info('Clearing all application cache...');
            CacheService::clearAll();
        }

        $this->info('Cache cleared successfully!');
        return Command::SUCCESS;
    }

    /**
     * Show Redis statistics
     */
    private function showStats(): int
    {
        $this->info('Redis Connection Statistics:');
        $this->newLine();

        try {
            $info = Redis::info();
            
            $this->table(
                ['Metric', 'Value'],
                [
                    ['Redis Version', $info['redis_version'] ?? 'N/A'],
                    ['Connected Clients', $info['connected_clients'] ?? 'N/A'],
                    ['Used Memory', $info['used_memory_human'] ?? 'N/A'],
                    ['Used Memory Peak', $info['used_memory_peak_human'] ?? 'N/A'],
                    ['Total Keys', $info['db0'] ?? 'N/A'],
                    ['Uptime (days)', $info['uptime_in_days'] ?? 'N/A'],
                    ['Total Commands Processed', $info['total_commands_processed'] ?? 'N/A'],
                    ['Keyspace Hits', $info['keyspace_hits'] ?? 'N/A'],
                    ['Keyspace Misses', $info['keyspace_misses'] ?? 'N/A'],
                ]
            );

            // Calculate hit rate
            $hits = (int) ($info['keyspace_hits'] ?? 0);
            $misses = (int) ($info['keyspace_misses'] ?? 0);
            $total = $hits + $misses;
            $hitRate = $total > 0 ? round(($hits / $total) * 100, 2) : 0;

            $this->newLine();
            $this->info("Cache Hit Rate: {$hitRate}%");

        } catch (\Exception $e) {
            $this->error('Failed to get Redis stats: ' . $e->getMessage());
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }

    /**
     * List keys matching pattern
     */
    private function listKeys(): int
    {
        $pattern = $this->option('pattern') ?? '*';
        
        $this->info("Searching for keys matching: {$pattern}");
        $this->newLine();

        try {
            $keys = Redis::keys($pattern);
            
            if (empty($keys)) {
                $this->warn('No keys found matching the pattern.');
                return Command::SUCCESS;
            }

            $this->info('Found ' . count($keys) . ' keys:');
            $this->newLine();

            foreach (array_slice($keys, 0, 100) as $key) {
                $this->line("  - {$key}");
            }

            if (count($keys) > 100) {
                $this->newLine();
                $this->warn('... and ' . (count($keys) - 100) . ' more keys');
            }

        } catch (\Exception $e) {
            $this->error('Failed to list keys: ' . $e->getMessage());
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }

    /**
     * Handle invalid action
     */
    private function invalidAction(): int
    {
        $this->error('Invalid action. Use: clear, stats, or keys');
        return Command::FAILURE;
    }
}
