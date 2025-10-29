<?php

namespace App\Http\Controllers\Meeting;

use App\Http\Controllers\Controller;
use App\Models\Meeting;
use App\Models\MeetingActionItem;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ActionItemController extends Controller
{
    /**
     * Display action items for a meeting
     */
    public function index(Meeting $meeting)
    {
        $actionItems = $meeting->actionItems()
            ->with('assignedUser')
            ->orderBy('priority', 'desc')
            ->orderBy('deadline', 'asc')
            ->get();

        return response()->json($actionItems);
    }

    /**
     * Store a new action item
     */
    public function store(Request $request, Meeting $meeting)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'assigned_to' => 'nullable|exists:users,id',
            'deadline' => 'nullable|date',
            'priority' => 'required|in:low,medium,high',
            'notes' => 'nullable|string',
        ]);

        $actionItem = $meeting->actionItems()->create($validated);
        $actionItem->load('assignedUser');

        // Send notification if assigned to someone
        if ($actionItem->assigned_to) {
            NotificationService::notifyActionItemAssigned(
                $actionItem->assignedUser,
                $actionItem,
                $meeting
            );
        }

        // Notify moderators
        NotificationService::notifyModeratorsNewActionItem(
            Auth::user(),
            $actionItem,
            $meeting
        );

        return response()->json([
            'message' => 'Action item berhasil ditambahkan',
            'action_item' => $actionItem,
        ], 201);
    }

    /**
     * Update an action item
     */
    public function update(Request $request, Meeting $meeting, MeetingActionItem $actionItem)
    {
        // Validate action item belongs to the meeting
        if ($actionItem->meeting_id !== $meeting->id) {
            return response()->json(['message' => 'Action item tidak ditemukan'], 404);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'assigned_to' => 'nullable|exists:users,id',
            'deadline' => 'nullable|date',
            'priority' => 'sometimes|required|in:low,medium,high',
            'status' => 'sometimes|required|in:pending,in_progress,completed,cancelled',
            'notes' => 'nullable|string',
        ]);

        // If status changed to completed, set completed_at
        if (isset($validated['status']) && $validated['status'] === 'completed' && $actionItem->status !== 'completed') {
            $validated['completed_at'] = now();
        }

        $actionItem->update($validated);
        $actionItem->load('assignedUser');

        return response()->json([
            'message' => 'Action item berhasil diperbarui',
            'action_item' => $actionItem,
        ]);
    }

    /**
     * Delete an action item
     */
    public function destroy(Meeting $meeting, MeetingActionItem $actionItem)
    {
        // Validate action item belongs to the meeting
        if ($actionItem->meeting_id !== $meeting->id) {
            return response()->json(['message' => 'Action item tidak ditemukan'], 404);
        }

        $actionItem->delete();

        return response()->json([
            'message' => 'Action item berhasil dihapus',
        ]);
    }

    /**
     * Mark action item as completed
     */
    public function complete(Meeting $meeting, MeetingActionItem $actionItem)
    {
        // Validate action item belongs to the meeting
        if ($actionItem->meeting_id !== $meeting->id) {
            return response()->json(['message' => 'Action item tidak ditemukan'], 404);
        }

        $actionItem->markAsCompleted();
        $actionItem->load('assignedUser', 'meeting');

        // Notify assigned user if completed by someone else
        if ($actionItem->assigned_to && $actionItem->assigned_to !== Auth::id()) {
            NotificationService::notifyActionItemCompleted(
                $actionItem->assignedUser,
                $actionItem,
                $meeting,
                Auth::user()
            );
        }

        // Notify moderators
        $moderators = $meeting->participants()
            ->where('role', 'moderator')
            ->where('user_id', '!=', Auth::id())
            ->with('user')
            ->get()
            ->pluck('user')
            ->filter();

        foreach ($moderators as $moderator) {
            NotificationService::notifyActionItemCompleted(
                $moderator,
                $actionItem,
                $meeting,
                Auth::user()
            );
        }

        return response()->json([
            'message' => 'Action item ditandai selesai',
            'action_item' => $actionItem,
        ]);
    }
}
