<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Employee;
use App\Models\HR\Feedback360Comment;
use App\Models\HR\Feedback360Participant;
use App\Models\HR\Feedback360Question;
use App\Models\HR\Feedback360Response;
use App\Models\HR\Feedback360Reviewer;
use App\Models\HR\Feedback360Session;
use App\Models\HR\PerformancePeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class Feedback360Controller extends Controller
{
    /**
     * Display list of 360 feedback sessions
     */
    public function index(Request $request)
    {
        $search = $request->get('search');
        $status = $request->get('status');
        $periodId = $request->get('period_id');
        $perPage = $request->get('per_page', 25);

        $query = Feedback360Session::with(['period', 'creator'])
            ->withCount('participants')
            ->latest('created_at');

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($status && $status !== '_all') {
            $query->where('status', $status);
        }

        if ($periodId && $periodId !== '_all') {
            $query->where('period_id', $periodId);
        }

        $sessions = $query->paginate($perPage);

        $sessions->through(fn($session) => [
            'id' => $session->id,
            'name' => $session->name,
            'period' => $session->period ? [
                'id' => $session->period->id,
                'name' => $session->period->name,
            ] : null,
            'status' => $session->status,
            'status_label' => $session->status_label,
            'start_date' => $session->start_date->format('Y-m-d'),
            'end_date' => $session->end_date->format('Y-m-d'),
            'is_anonymous' => $session->is_anonymous,
            'participants_count' => $session->participants_count,
            'progress' => $session->getProgress(),
            'creator_name' => $session->creator?->name,
            'created_at' => $session->created_at->format('Y-m-d'),
        ]);

        $periods = PerformancePeriod::orderBy('start_date', 'desc')->get(['id', 'name']);

        // Stats
        $stats = [
            'total' => Feedback360Session::count(),
            'active' => Feedback360Session::where('status', 'in_progress')->count(),
            'completed' => Feedback360Session::where('status', 'completed')->count(),
            'draft' => Feedback360Session::where('status', 'draft')->count(),
        ];

        return Inertia::render('HR/performance/feedback360/index', [
            'sessions' => $sessions,
            'periods' => $periods,
            'statuses' => Feedback360Session::STATUSES,
            'stats' => $stats,
            'filters' => [
                'search' => $search,
                'status' => $status ?? '_all',
                'period_id' => $periodId ?? '_all',
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Show form to create session
     */
    public function create()
    {
        $periods = PerformancePeriod::orderBy('start_date', 'desc')
            ->get(['id', 'name', 'status']);

        $employees = Employee::where('status', 'active')
            ->orderBy('first_name')
            ->get(['id', 'employee_id', 'first_name', 'last_name'])
            ->map(fn($e) => [
                'id' => $e->id,
                'employee_id' => $e->employee_id,
                'name' => $e->first_name . ' ' . ($e->last_name ?? ''),
            ]);

        return Inertia::render('HR/performance/feedback360/form', [
            'periods' => $periods,
            'employees' => $employees,
            'categories' => Feedback360Session::QUESTION_CATEGORIES,
            'relationships' => Feedback360Session::RELATIONSHIPS,
            'questionTypes' => Feedback360Question::TYPES,
            'session' => null,
        ]);
    }

    /**
     * Store new session
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'period_id' => 'required|exists:performance_periods,id',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'is_anonymous' => 'boolean',
            'min_reviewers' => 'required|integer|min:1|max:10',
            'participant_ids' => 'required|array|min:1',
            'participant_ids.*' => 'exists:employees,id',
            'questions' => 'required|array|min:1',
            'questions.*.category' => 'required|string',
            'questions.*.question' => 'required|string|max:500',
            'questions.*.type' => 'required|in:rating,text,yes_no',
            'questions.*.weight' => 'required|integer|min:1|max:10',
            'questions.*.is_required' => 'boolean',
        ]);

        try {
            DB::beginTransaction();

            $session = Feedback360Session::create([
                'name' => $validated['name'],
                'period_id' => $validated['period_id'],
                'description' => $validated['description'] ?? null,
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'is_anonymous' => $validated['is_anonymous'] ?? true,
                'min_reviewers' => $validated['min_reviewers'],
                'status' => 'draft',
                'created_by' => Auth::id(),
            ]);

            // Create participants
            foreach ($validated['participant_ids'] as $employeeId) {
                Feedback360Participant::create([
                    'session_id' => $session->id,
                    'employee_id' => $employeeId,
                    'status' => 'pending',
                ]);
            }

            // Create questions
            foreach ($validated['questions'] as $index => $questionData) {
                Feedback360Question::create([
                    'session_id' => $session->id,
                    'category' => $questionData['category'],
                    'question' => $questionData['question'],
                    'description' => $questionData['description'] ?? null,
                    'type' => $questionData['type'],
                    'weight' => $questionData['weight'],
                    'is_required' => $questionData['is_required'] ?? true,
                    'order' => $index,
                ]);
            }

            DB::commit();

            return redirect()->route('hr.feedback360.show', $session->id)
                ->with('success', 'Sesi 360 Feedback berhasil dibuat');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal membuat sesi: ' . $e->getMessage());
        }
    }

    /**
     * Show session detail
     */
    public function show(Feedback360Session $feedback360)
    {
        $feedback360->load([
            'period',
            'creator',
            'questions' => fn($q) => $q->orderBy('category')->orderBy('order'),
            'participants.employee.organizationUnit',
            'participants.reviewers.reviewerEmployee',
        ]);

        $participants = $feedback360->participants->map(fn($p) => [
            'id' => $p->id,
            'employee' => [
                'id' => $p->employee->id,
                'employee_id' => $p->employee->employee_id,
                'name' => $p->employee->first_name . ' ' . ($p->employee->last_name ?? ''),
                'organization_unit' => $p->employee->organizationUnit?->name,
            ],
            'status' => $p->status,
            'status_label' => $p->status_label,
            'average_score' => $p->average_score,
            'total_feedbacks' => $p->total_feedbacks,
            'reviewers' => $p->reviewers->map(fn($r) => [
                'id' => $r->id,
                'reviewer_employee' => [
                    'id' => $r->reviewerEmployee->id,
                    'name' => $r->reviewerEmployee->first_name . ' ' . ($r->reviewerEmployee->last_name ?? ''),
                ],
                'relationship' => $r->relationship,
                'relationship_label' => $r->relationship_label,
                'status' => $r->status,
                'status_label' => $r->status_label,
                'completed_at' => $r->completed_at?->format('Y-m-d H:i'),
            ]),
        ]);

        $questions = $feedback360->questions->groupBy('category')->map(function ($items, $category) {
            return [
                'category' => $category,
                'category_label' => Feedback360Session::QUESTION_CATEGORIES[$category] ?? $category,
                'questions' => $items->map(fn($q) => [
                    'id' => $q->id,
                    'question' => $q->question,
                    'description' => $q->description,
                    'type' => $q->type,
                    'type_label' => $q->type_label,
                    'weight' => $q->weight,
                    'is_required' => $q->is_required,
                ])->values(),
            ];
        })->values();

        return Inertia::render('HR/performance/feedback360/show', [
            'session' => [
                'id' => $feedback360->id,
                'name' => $feedback360->name,
                'description' => $feedback360->description,
                'period' => $feedback360->period ? [
                    'id' => $feedback360->period->id,
                    'name' => $feedback360->period->name,
                ] : null,
                'status' => $feedback360->status,
                'status_label' => $feedback360->status_label,
                'start_date' => $feedback360->start_date->format('Y-m-d'),
                'end_date' => $feedback360->end_date->format('Y-m-d'),
                'is_anonymous' => $feedback360->is_anonymous,
                'min_reviewers' => $feedback360->min_reviewers,
                'progress' => $feedback360->getProgress(),
                'creator_name' => $feedback360->creator?->name,
                'created_at' => $feedback360->created_at->format('Y-m-d'),
            ],
            'participants' => $participants,
            'questionGroups' => $questions,
            'categories' => Feedback360Session::QUESTION_CATEGORIES,
            'relationships' => Feedback360Session::RELATIONSHIPS,
        ]);
    }

    /**
     * Edit session
     */
    public function edit(Feedback360Session $feedback360)
    {
        if (!in_array($feedback360->status, ['draft'])) {
            return redirect()->route('hr.feedback360.show', $feedback360->id)
                ->with('error', 'Sesi tidak dapat diedit karena sudah berjalan');
        }

        $feedback360->load(['questions', 'participants']);

        $periods = PerformancePeriod::orderBy('start_date', 'desc')
            ->get(['id', 'name', 'status']);

        $employees = Employee::where('status', 'active')
            ->orderBy('first_name')
            ->get(['id', 'employee_id', 'first_name', 'last_name'])
            ->map(fn($e) => [
                'id' => $e->id,
                'employee_id' => $e->employee_id,
                'name' => $e->first_name . ' ' . ($e->last_name ?? ''),
            ]);

        return Inertia::render('HR/performance/feedback360/form', [
            'periods' => $periods,
            'employees' => $employees,
            'categories' => Feedback360Session::QUESTION_CATEGORIES,
            'relationships' => Feedback360Session::RELATIONSHIPS,
            'questionTypes' => Feedback360Question::TYPES,
            'session' => [
                'id' => $feedback360->id,
                'name' => $feedback360->name,
                'description' => $feedback360->description,
                'period_id' => $feedback360->period_id,
                'start_date' => $feedback360->start_date->format('Y-m-d'),
                'end_date' => $feedback360->end_date->format('Y-m-d'),
                'is_anonymous' => $feedback360->is_anonymous,
                'min_reviewers' => $feedback360->min_reviewers,
                'participant_ids' => $feedback360->participants->pluck('employee_id')->toArray(),
                'questions' => $feedback360->questions->map(fn($q) => [
                    'id' => $q->id,
                    'category' => $q->category,
                    'question' => $q->question,
                    'description' => $q->description,
                    'type' => $q->type,
                    'weight' => $q->weight,
                    'is_required' => $q->is_required,
                ])->toArray(),
            ],
        ]);
    }

    /**
     * Update session
     */
    public function update(Request $request, Feedback360Session $feedback360)
    {
        if (!in_array($feedback360->status, ['draft'])) {
            return back()->with('error', 'Sesi tidak dapat diedit karena sudah berjalan');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'period_id' => 'required|exists:performance_periods,id',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'is_anonymous' => 'boolean',
            'min_reviewers' => 'required|integer|min:1|max:10',
            'participant_ids' => 'required|array|min:1',
            'participant_ids.*' => 'exists:employees,id',
            'questions' => 'required|array|min:1',
            'questions.*.category' => 'required|string',
            'questions.*.question' => 'required|string|max:500',
            'questions.*.type' => 'required|in:rating,text,yes_no',
            'questions.*.weight' => 'required|integer|min:1|max:10',
            'questions.*.is_required' => 'boolean',
        ]);

        try {
            DB::beginTransaction();

            $feedback360->update([
                'name' => $validated['name'],
                'period_id' => $validated['period_id'],
                'description' => $validated['description'] ?? null,
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'is_anonymous' => $validated['is_anonymous'] ?? true,
                'min_reviewers' => $validated['min_reviewers'],
            ]);

            // Sync participants
            $existingParticipantIds = $feedback360->participants->pluck('employee_id')->toArray();
            $newParticipantIds = $validated['participant_ids'];

            // Delete removed participants
            $feedback360->participants()
                ->whereNotIn('employee_id', $newParticipantIds)
                ->delete();

            // Add new participants
            $toAdd = array_diff($newParticipantIds, $existingParticipantIds);
            foreach ($toAdd as $employeeId) {
                Feedback360Participant::create([
                    'session_id' => $feedback360->id,
                    'employee_id' => $employeeId,
                    'status' => 'pending',
                ]);
            }

            // Sync questions - delete old and create new
            $feedback360->questions()->delete();
            foreach ($validated['questions'] as $index => $questionData) {
                Feedback360Question::create([
                    'session_id' => $feedback360->id,
                    'category' => $questionData['category'],
                    'question' => $questionData['question'],
                    'description' => $questionData['description'] ?? null,
                    'type' => $questionData['type'],
                    'weight' => $questionData['weight'],
                    'is_required' => $questionData['is_required'] ?? true,
                    'order' => $index,
                ]);
            }

            DB::commit();

            return redirect()->route('hr.feedback360.show', $feedback360->id)
                ->with('success', 'Sesi 360 Feedback berhasil diperbarui');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal memperbarui sesi: ' . $e->getMessage());
        }
    }

    /**
     * Delete session
     */
    public function destroy(Feedback360Session $feedback360)
    {
        if (!in_array($feedback360->status, ['draft', 'cancelled'])) {
            return back()->with('error', 'Sesi tidak dapat dihapus karena sudah berjalan');
        }

        $feedback360->delete();

        return redirect()->route('hr.feedback360.index')
            ->with('success', 'Sesi 360 Feedback berhasil dihapus');
    }

    /**
     * Start/activate a session
     */
    public function start(Feedback360Session $feedback360)
    {
        if ($feedback360->status !== 'draft') {
            return back()->with('error', 'Sesi sudah dimulai atau selesai');
        }

        if ($feedback360->participants()->count() === 0) {
            return back()->with('error', 'Tambahkan participant terlebih dahulu');
        }

        if ($feedback360->questions()->count() === 0) {
            return back()->with('error', 'Tambahkan pertanyaan terlebih dahulu');
        }

        $feedback360->update(['status' => 'in_progress']);

        return back()->with('success', 'Sesi 360 Feedback berhasil dimulai');
    }

    /**
     * Complete a session
     */
    public function complete(Feedback360Session $feedback360)
    {
        if ($feedback360->status !== 'in_progress') {
            return back()->with('error', 'Sesi belum dimulai atau sudah selesai');
        }

        $feedback360->update(['status' => 'completed']);

        return back()->with('success', 'Sesi 360 Feedback berhasil diselesaikan');
    }

    /**
     * Add reviewer to participant
     */
    public function addReviewer(Request $request, Feedback360Participant $participant)
    {
        $validated = $request->validate([
            'reviewer_employee_id' => [
                'required',
                'exists:employees,id',
                function ($attribute, $value, $fail) use ($participant) {
                    $exists = Feedback360Reviewer::where('participant_id', $participant->id)
                        ->where('reviewer_employee_id', $value)
                        ->exists();
                    if ($exists) {
                        $fail('Reviewer sudah ditambahkan sebelumnya.');
                    }
                },
            ],
            'relationship' => 'required|in:self,supervisor,peer,subordinate,external',
        ]);

        Feedback360Reviewer::create([
            'participant_id' => $participant->id,
            'reviewer_employee_id' => $validated['reviewer_employee_id'],
            'relationship' => $validated['relationship'],
            'status' => 'pending',
        ]);

        // Update participant status
        if ($participant->status === 'pending') {
            $participant->update(['status' => 'in_progress']);
        }

        return back()->with('success', 'Reviewer berhasil ditambahkan');
    }

    /**
     * Remove reviewer from participant
     */
    public function removeReviewer(Feedback360Reviewer $reviewer)
    {
        if ($reviewer->status === 'completed') {
            return back()->with('error', 'Reviewer sudah menyelesaikan feedback');
        }

        $reviewer->delete();

        return back()->with('success', 'Reviewer berhasil dihapus');
    }

    /**
     * View participant result/report
     */
    public function participantResult(Feedback360Participant $participant)
    {
        $participant->load([
            'session.questions',
            'employee.organizationUnit',
            'reviewers' => fn($q) => $q->where('status', 'completed')
                ->with(['reviewerEmployee', 'responses.question', 'comment']),
        ]);

        $session = $participant->session;

        // Calculate scores by category
        $categoryScores = $participant->getScoresByCategory();
        $relationshipScores = $participant->getScoresByRelationship();

        // Get all feedback comments (anonymized if needed)
        $feedbackComments = $participant->reviewers->map(function ($reviewer) use ($session) {
            return [
                'relationship' => $reviewer->relationship,
                'relationship_label' => $reviewer->relationship_label,
                'reviewer_name' => $session->is_anonymous ? null : ($reviewer->reviewerEmployee->first_name . ' ' . ($reviewer->reviewerEmployee->last_name ?? '')),
                'strengths' => $reviewer->comment?->strengths,
                'improvements' => $reviewer->comment?->improvements,
                'additional_comments' => $reviewer->comment?->additional_comments,
            ];
        });

        return Inertia::render('HR/performance/feedback360/result', [
            'session' => [
                'id' => $session->id,
                'name' => $session->name,
                'is_anonymous' => $session->is_anonymous,
            ],
            'participant' => [
                'id' => $participant->id,
                'employee' => [
                    'id' => $participant->employee->id,
                    'employee_id' => $participant->employee->employee_id,
                    'name' => $participant->employee->first_name . ' ' . ($participant->employee->last_name ?? ''),
                    'organization_unit' => $participant->employee->organizationUnit?->name,
                ],
                'average_score' => $participant->average_score,
                'total_feedbacks' => $participant->total_feedbacks,
            ],
            'categoryScores' => $categoryScores,
            'relationshipScores' => $relationshipScores,
            'feedbackComments' => $feedbackComments,
            'categories' => Feedback360Session::QUESTION_CATEGORIES,
        ]);
    }

    // ==================== EMPLOYEE PORTAL ====================

    /**
     * List feedback requests for current employee
     */
    public function myFeedbackRequests(Request $request)
    {
        $user = Auth::user();
        $employee = Employee::where('user_id', $user->id)->first();

        if (!$employee) {
            return Inertia::render('HR/performance/feedback360/my-requests', [
                'pendingRequests' => [],
                'completedRequests' => [],
                'message' => 'Akun Anda tidak terhubung dengan data karyawan',
            ]);
        }

        $pendingReviewers = Feedback360Reviewer::with([
                'participant.employee',
                'participant.session',
            ])
            ->where('reviewer_employee_id', $employee->id)
            ->whereIn('status', ['pending', 'in_progress'])
            ->whereHas('participant.session', fn($q) => $q->where('status', 'in_progress'))
            ->get()
            ->map(fn($r) => [
                'id' => $r->id,
                'participant_name' => $r->participant->employee->first_name . ' ' . ($r->participant->employee->last_name ?? ''),
                'session_name' => $r->participant->session->name,
                'relationship' => $r->relationship,
                'relationship_label' => $r->relationship_label,
                'deadline' => $r->participant->session->end_date->format('Y-m-d'),
                'status' => $r->status,
            ]);

        $completedReviewers = Feedback360Reviewer::with([
                'participant.employee',
                'participant.session',
            ])
            ->where('reviewer_employee_id', $employee->id)
            ->where('status', 'completed')
            ->latest('completed_at')
            ->limit(10)
            ->get()
            ->map(fn($r) => [
                'id' => $r->id,
                'participant_name' => $r->participant->employee->first_name . ' ' . ($r->participant->employee->last_name ?? ''),
                'session_name' => $r->participant->session->name,
                'relationship' => $r->relationship,
                'relationship_label' => $r->relationship_label,
                'completed_at' => $r->completed_at?->format('Y-m-d H:i'),
            ]);

        return Inertia::render('HR/performance/feedback360/my-requests', [
            'pendingRequests' => $pendingReviewers,
            'completedRequests' => $completedReviewers,
        ]);
    }

    /**
     * Show feedback form for employee to fill
     */
    public function giveFeedback(Feedback360Reviewer $reviewer)
    {
        $user = Auth::user();
        $employee = Employee::where('user_id', $user->id)->first();

        // Verify ownership
        if (!$employee || $reviewer->reviewer_employee_id !== $employee->id) {
            abort(403, 'Anda tidak memiliki akses untuk memberikan feedback ini');
        }

        if ($reviewer->status === 'completed') {
            return redirect()->route('hr.feedback360.my-requests')
                ->with('info', 'Anda sudah menyelesaikan feedback ini');
        }

        $reviewer->load([
            'participant.employee',
            'participant.session.questions',
            'responses',
            'comment',
        ]);

        $session = $reviewer->participant->session;
        $existingResponses = $reviewer->responses->keyBy('question_id');

        $questions = $session->questions->groupBy('category')->map(function ($items, $category) use ($existingResponses) {
            return [
                'category' => $category,
                'category_label' => Feedback360Session::QUESTION_CATEGORIES[$category] ?? $category,
                'questions' => $items->map(function ($q) use ($existingResponses) {
                    $response = $existingResponses->get($q->id);
                    return [
                        'id' => $q->id,
                        'question' => $q->question,
                        'description' => $q->description,
                        'type' => $q->type,
                        'is_required' => $q->is_required,
                        'existing_score' => $response?->score,
                        'existing_answer' => $response?->answer,
                        'existing_boolean' => $response?->boolean_answer,
                    ];
                })->values(),
            ];
        })->values();

        return Inertia::render('HR/performance/feedback360/give-feedback', [
            'reviewer' => [
                'id' => $reviewer->id,
                'relationship' => $reviewer->relationship,
                'relationship_label' => $reviewer->relationship_label,
            ],
            'participant' => [
                'name' => $reviewer->participant->employee->first_name . ' ' . ($reviewer->participant->employee->last_name ?? ''),
            ],
            'session' => [
                'id' => $session->id,
                'name' => $session->name,
                'is_anonymous' => $session->is_anonymous,
                'end_date' => $session->end_date->format('Y-m-d'),
            ],
            'questionGroups' => $questions,
            'existingComment' => $reviewer->comment ? [
                'strengths' => $reviewer->comment->strengths,
                'improvements' => $reviewer->comment->improvements,
                'additional_comments' => $reviewer->comment->additional_comments,
            ] : null,
        ]);
    }

    /**
     * Save/submit feedback
     */
    public function submitFeedback(Request $request, Feedback360Reviewer $reviewer)
    {
        $user = Auth::user();
        $employee = Employee::where('user_id', $user->id)->first();

        // Verify ownership
        if (!$employee || $reviewer->reviewer_employee_id !== $employee->id) {
            abort(403, 'Anda tidak memiliki akses untuk memberikan feedback ini');
        }

        if ($reviewer->status === 'completed') {
            return back()->with('error', 'Feedback sudah diselesaikan');
        }

        $validated = $request->validate([
            'responses' => 'required|array',
            'responses.*.question_id' => 'required|exists:feedback360_questions,id',
            'responses.*.score' => 'nullable|numeric|min:1|max:5',
            'responses.*.answer' => 'nullable|string|max:2000',
            'responses.*.boolean_answer' => 'nullable|boolean',
            'comment' => 'nullable|array',
            'comment.strengths' => 'nullable|string|max:2000',
            'comment.improvements' => 'nullable|string|max:2000',
            'comment.additional_comments' => 'nullable|string|max:2000',
            'is_submit' => 'boolean', // true = submit & complete, false = save draft
        ]);

        $isSubmit = $validated['is_submit'] ?? false;

        try {
            DB::beginTransaction();

            // Save responses
            foreach ($validated['responses'] as $responseData) {
                Feedback360Response::updateOrCreate(
                    [
                        'reviewer_id' => $reviewer->id,
                        'question_id' => $responseData['question_id'],
                    ],
                    [
                        'score' => $responseData['score'] ?? null,
                        'answer' => $responseData['answer'] ?? null,
                        'boolean_answer' => $responseData['boolean_answer'] ?? null,
                    ]
                );
            }

            // Save comment
            if ($validated['comment'] ?? false) {
                Feedback360Comment::updateOrCreate(
                    ['reviewer_id' => $reviewer->id],
                    [
                        'strengths' => $validated['comment']['strengths'] ?? null,
                        'improvements' => $validated['comment']['improvements'] ?? null,
                        'additional_comments' => $validated['comment']['additional_comments'] ?? null,
                    ]
                );
            }

            // Update status
            if ($isSubmit) {
                $reviewer->markCompleted();
                $message = 'Feedback berhasil dikirim';
            } else {
                $reviewer->update(['status' => 'in_progress']);
                $message = 'Feedback berhasil disimpan sebagai draft';
            }

            DB::commit();

            if ($isSubmit) {
                return redirect()->route('hr.feedback360.my-requests')
                    ->with('success', $message);
            }

            return back()->with('success', $message);

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal menyimpan feedback: ' . $e->getMessage());
        }
    }

    /**
     * View my own feedback result (as participant)
     */
    public function myResult(Request $request)
    {
        $user = Auth::user();
        $employee = Employee::where('user_id', $user->id)->first();

        if (!$employee) {
            return Inertia::render('HR/performance/feedback360/my-result', [
                'participations' => [],
                'message' => 'Akun Anda tidak terhubung dengan data karyawan',
            ]);
        }

        $participations = Feedback360Participant::with(['session'])
            ->where('employee_id', $employee->id)
            ->whereHas('session', fn($q) => $q->whereIn('status', ['in_progress', 'completed']))
            ->get()
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'session_name' => $p->session->name,
                    'session_status' => $p->session->status,
                    'status' => $p->status,
                    'status_label' => $p->status_label,
                    'average_score' => $p->average_score,
                    'total_feedbacks' => $p->total_feedbacks,
                    'can_view_result' => $p->session->status === 'completed' || ($p->status === 'completed' && $p->total_feedbacks >= $p->session->min_reviewers),
                ];
            });

        return Inertia::render('HR/performance/feedback360/my-result', [
            'participations' => $participations,
        ]);
    }
}
