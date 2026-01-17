<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Services\CacheService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoomController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->get('perPage', 10);
        $search = $request->get('search', '');

        $rooms = Room::query()
            ->withCount(['meetings'])
            ->when($search, function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('building', 'like', "%{$search}%");
            })
            ->orderBy('building', 'asc')
            ->orderBy('floor', 'asc')
            ->orderBy('code', 'asc')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('master/room/index', [
            'rooms' => $rooms,
            'filters' => [
                'search' => $search,
                'perPage' => $perPage,
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('master/room/create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'code' => 'required|string|max:50|unique:rooms',
            'name' => 'required|string|max:255',
            'building' => 'nullable|string|max:100',
            'floor' => 'nullable|string|max:50',
            'capacity' => 'required|integer|min:1',
            'facilities' => 'nullable|string',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ], [
            'code.required' => 'Kode ruangan wajib diisi',
            'code.unique' => 'Kode ruangan sudah digunakan',
            'name.required' => 'Nama ruangan wajib diisi',
            'capacity.required' => 'Kapasitas wajib diisi',
            'capacity.min' => 'Kapasitas minimal 1',
        ]);

        Room::create($request->all());

        // Clear related cache
        CacheService::clearRoomCache();

        return redirect()->route('rooms.index')->with('success', 'Ruangan berhasil ditambahkan');
    }

    public function show(Room $room)
    {
        $room->load([
            'meetings' => function ($query) {
                $query->with(['organizer', 'organizationUnit'])
                    ->orderBy('meeting_date', 'desc')
                    ->orderBy('start_time', 'desc')
                    ->limit(10);
            }
        ]);

        return Inertia::render('master/room/show', [
            'room' => $room,
        ]);
    }

    public function edit(Room $room)
    {
        return Inertia::render('master/room/edit', [
            'room' => $room,
        ]);
    }

    public function update(Request $request, Room $room)
    {
        $request->validate([
            'code' => 'required|string|max:50|unique:rooms,code,' . $room->id,
            'name' => 'required|string|max:255',
            'building' => 'nullable|string|max:100',
            'floor' => 'nullable|string|max:50',
            'capacity' => 'required|integer|min:1',
            'facilities' => 'nullable|string',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ], [
            'code.required' => 'Kode ruangan wajib diisi',
            'code.unique' => 'Kode ruangan sudah digunakan',
            'name.required' => 'Nama ruangan wajib diisi',
            'capacity.required' => 'Kapasitas wajib diisi',
            'capacity.min' => 'Kapasitas minimal 1',
        ]);

        $room->update($request->all());

        // Clear related cache
        CacheService::clearRoomCache($room->id);

        return redirect()->route('rooms.index')->with('success', 'Ruangan berhasil diperbarui');
    }

    public function destroy(Room $room)
    {
        if ($room->meetings()->whereIn('status', ['scheduled', 'ongoing'])->count() > 0) {
            return redirect()->back()->with('error', 'Ruangan tidak dapat dihapus karena masih memiliki rapat aktif');
        }

        $room->delete();

        // Clear related cache
        CacheService::clearRoomCache($room->id);

        return redirect()->route('rooms.index')->with('success', 'Ruangan berhasil dihapus');
    }

    public function checkAvailability(Request $request)
    {
        $request->validate([
            'room_id' => 'required|exists:rooms,id',
            'meeting_date' => 'required|date',
            'start_time' => 'required',
            'end_time' => 'required',
            'exclude_meeting_id' => 'nullable|exists:meetings,id',
        ]);

        $room = Room::find($request->room_id);
        $isAvailable = $room->isAvailable(
            $request->meeting_date,
            $request->start_time,
            $request->end_time,
            $request->exclude_meeting_id
        );

        return response()->json(['available' => $isAvailable]);
    }
}

