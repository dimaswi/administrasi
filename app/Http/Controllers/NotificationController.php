<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class NotificationController extends Controller
{
    /**
     * Get all notifications for authenticated user
     */
    public function index(Request $request)
    {
        // Check if it's an API request (has 'api' in query or explicit JSON header)
        if ($request->has('api') || ($request->ajax() && $request->expectsJson())) {
            $query = Auth::user()->notifications()
                ->orderBy('created_at', 'desc');

            // Filter by read status
            if ($request->has('unread') && $request->unread) {
                $query->unread();
            }

            // Limit results
            $limit = $request->get('limit', 20);
            $notifications = $query->limit($limit)->get();

            return response()->json($notifications);
        }

        // Return Inertia page for normal browser requests
        $notifications = Auth::user()->notifications()
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('notifications', [
            'notifications' => $notifications,
        ]);
    }

    /**
     * Get unread count
     */
    public function unreadCount()
    {
        $count = Auth::user()->notifications()->unread()->count();
        
        return response()->json(['count' => $count]);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Notification $notification)
    {
        // Verify ownership
        if ($notification->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $notification->markAsRead();

        return response()->json([
            'message' => 'Notification marked as read',
            'notification' => $notification,
        ]);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead()
    {
        Auth::user()->notifications()
            ->unread()
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json([
            'message' => 'All notifications marked as read',
        ]);
    }

    /**
     * Delete notification
     */
    public function destroy(Notification $notification)
    {
        // Verify ownership
        if ($notification->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $notification->delete();

        return response()->json([
            'message' => 'Notification deleted',
        ]);
    }

    /**
     * Delete all read notifications
     */
    public function clearRead()
    {
        Auth::user()->notifications()
            ->read()
            ->delete();

        return response()->json([
            'message' => 'All read notifications cleared',
        ]);
    }
}
