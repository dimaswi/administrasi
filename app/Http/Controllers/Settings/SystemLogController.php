<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;

class SystemLogController extends Controller
{
    public function index(Request $request)
    {
        $date = $request->get('date', now()->format('Y-m-d'));
        $level = $request->get('level', '');
        $search = $request->get('search', '');
        
        $logs = $this->getLogs($date, $level, $search);
        $availableDates = $this->getAvailableLogDates();
        
        return Inertia::render('settings/system-logs', [
            'logs' => $logs,
            'availableDates' => $availableDates,
            'filters' => [
                'date' => $date,
                'level' => $level,
                'search' => $search,
            ],
        ]);
    }

    private function getLogs(string $date, string $level = '', string $search = ''): array
    {
        $logFile = storage_path('logs/laravel-' . $date . '.log');
        
        if (!File::exists($logFile)) {
            // Try single log file
            $logFile = storage_path('logs/laravel.log');
            if (!File::exists($logFile)) {
                return [];
            }
        }

        $content = File::get($logFile);
        $logs = [];
        
        // Parse log entries
        $pattern = '/\[(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})\]\s(\w+)\.(\w+):\s(.+?)(?=\[\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\]|$)/s';
        
        preg_match_all($pattern, $content, $matches, PREG_SET_ORDER);
        
        foreach ($matches as $match) {
            $logLevel = strtolower($match[3]);
            $message = trim($match[4]);
            
            // Filter by level
            if ($level && $logLevel !== $level) {
                continue;
            }
            
            // Filter by search
            if ($search && stripos($message, $search) === false) {
                continue;
            }
            
            $logs[] = [
                'datetime' => $match[1],
                'environment' => $match[2],
                'level' => $logLevel,
                'message' => $this->truncateMessage($message),
                'full_message' => $message,
            ];
        }
        
        // Return latest first, limit 500
        return array_slice(array_reverse($logs), 0, 500);
    }

    private function truncateMessage(string $message, int $length = 200): string
    {
        $firstLine = strtok($message, "\n");
        if (strlen($firstLine) > $length) {
            return substr($firstLine, 0, $length) . '...';
        }
        return $firstLine;
    }

    private function getAvailableLogDates(): array
    {
        $logPath = storage_path('logs');
        $dates = [];
        
        foreach (File::files($logPath) as $file) {
            if (preg_match('/laravel-(\d{4}-\d{2}-\d{2})\.log/', $file->getFilename(), $matches)) {
                $dates[] = $matches[1];
            }
        }
        
        // Also add today if main log exists
        if (File::exists($logPath . '/laravel.log')) {
            $today = now()->format('Y-m-d');
            if (!in_array($today, $dates)) {
                $dates[] = $today;
            }
        }
        
        rsort($dates);
        return array_slice($dates, 0, 30); // Last 30 days
    }

    public function clear(Request $request)
    {
        $date = $request->get('date');
        
        if ($date) {
            $logFile = storage_path('logs/laravel-' . $date . '.log');
            if (File::exists($logFile)) {
                File::delete($logFile);
            }
        } else {
            // Clear main log
            $logFile = storage_path('logs/laravel.log');
            if (File::exists($logFile)) {
                File::put($logFile, '');
            }
        }
        
        return back()->with('success', 'Log berhasil dihapus.');
    }
}
