<?php

namespace App\Services;

use App\Models\HR\Leave;
use App\Models\HR\EarlyLeaveRequest;
use App\Models\HR\Employee;
use App\Models\User;
use App\Models\OrganizationUnit;
use App\Models\DocumentTemplate;
use Illuminate\Support\Collection;

class LeaveApprovalService
{
    /**
     * Get pending approvals for a user (as delegation, supervisor, or director)
     */
    public function getPendingApprovalsForUser(User $user): array
    {
        $employee = Employee::where('user_id', $user->id)->first();
        
        return [
            'leaves' => $this->getPendingLeaves($user, $employee),
            'early_leaves' => $this->getPendingEarlyLeaves($user, $employee),
        ];
    }

    /**
     * Get pending leaves for approval
     */
    protected function getPendingLeaves(User $user, ?Employee $employee): Collection
    {
        $pendingLeaves = collect();

        // As delegation
        if ($employee) {
            $delegationLeaves = Leave::pendingDelegation()
                ->where('delegation_employee_id', $employee->id)
                ->with(['employee.user', 'employee.organizationUnit', 'leaveType'])
                ->get()
                ->map(fn($leave) => $this->formatLeave($leave, 'delegation'));
            
            $pendingLeaves = $pendingLeaves->merge($delegationLeaves);
        }

        // As supervisor
        $supervisorLeaves = $this->getLeavesWhereSupervisor($user)
            ->map(fn($leave) => $this->formatLeave($leave, 'supervisor'));
        
        $pendingLeaves = $pendingLeaves->merge($supervisorLeaves);

        // As director
        $directorLeaves = $this->getLeavesWhereDirector($user)
            ->map(fn($leave) => $this->formatLeave($leave, 'director'));
        
        $pendingLeaves = $pendingLeaves->merge($directorLeaves);

        return $pendingLeaves;
    }

    /**
     * Get pending early leaves for approval
     */
    protected function getPendingEarlyLeaves(User $user, ?Employee $employee): Collection
    {
        $pendingEarlyLeaves = collect();

        // As delegation
        if ($employee) {
            $delegationRequests = EarlyLeaveRequest::pendingDelegation()
                ->where('delegation_employee_id', $employee->id)
                ->with(['employee.user', 'employee.organizationUnit'])
                ->get()
                ->map(fn($request) => $this->formatEarlyLeave($request, 'delegation'));
            
            $pendingEarlyLeaves = $pendingEarlyLeaves->merge($delegationRequests);
        }

        // As supervisor
        $supervisorRequests = $this->getEarlyLeavesWhereSupervisor($user)
            ->map(fn($request) => $this->formatEarlyLeave($request, 'supervisor'));
        
        $pendingEarlyLeaves = $pendingEarlyLeaves->merge($supervisorRequests);

        // As director
        $directorRequests = $this->getEarlyLeavesWhereDirector($user)
            ->map(fn($request) => $this->formatEarlyLeave($request, 'director'));
        
        $pendingEarlyLeaves = $pendingEarlyLeaves->merge($directorRequests);

        return $pendingEarlyLeaves;
    }

    /**
     * Get leaves where user is supervisor
     */
    protected function getLeavesWhereSupervisor(User $user): Collection
    {
        // Find organization units where user is head
        $headOfUnits = OrganizationUnit::where('head_id', $user->id)->get();
        
        if ($headOfUnits->isEmpty()) {
            return collect();
        }

        $headOfUnitIds = $headOfUnits->pluck('id')->toArray();
        
        // Get child units where user can approve their heads
        $childUnitIds = [];
        foreach ($headOfUnits as $unit) {
            // Get direct child units - their heads need approval from this user
            $childUnits = OrganizationUnit::where('parent_id', $unit->id)->pluck('id')->toArray();
            $childUnitIds = array_merge($childUnitIds, $childUnits);
        }
        
        // Get child unit head user IDs (these are users who need approval from this supervisor)
        $childUnitHeadUserIds = OrganizationUnit::whereIn('id', $childUnitIds)
            ->whereNotNull('head_id')
            ->pluck('head_id')
            ->toArray();

        // Get head user IDs of the units user is managing (to exclude them from regular employee query)
        // These heads need approval from THEIR parent head, not from themselves
        $ownUnitHeadUserIds = OrganizationUnit::whereIn('id', $headOfUnitIds)
            ->whereNotNull('head_id')
            ->pluck('head_id')
            ->toArray();

        // Case 1: Regular employees in units where user is head
        // Exclude: heads of child units AND heads of the unit itself (they need parent approval)
        $excludeUserIds = array_unique(array_merge($childUnitHeadUserIds, $ownUnitHeadUserIds));
        
        $regularEmployeeLeaves = Leave::pendingSupervisor()
            ->whereHas('employee', function ($query) use ($headOfUnitIds, $excludeUserIds) {
                $query->whereIn('organization_unit_id', $headOfUnitIds)
                    ->whereHas('user', function ($q) use ($excludeUserIds) {
                        $q->whereNotIn('id', $excludeUserIds);
                    });
            })
            ->with(['employee.user', 'employee.organizationUnit', 'leaveType'])
            ->get();

        // Case 2: Heads of child units who need approval from parent head
        $childUnitHeadLeaves = collect();
        if (!empty($childUnitHeadUserIds)) {
            $childUnitHeadLeaves = Leave::pendingSupervisor()
                ->whereHas('employee', function ($query) use ($childUnitHeadUserIds) {
                    $query->whereHas('user', function ($q) use ($childUnitHeadUserIds) {
                        $q->whereIn('id', $childUnitHeadUserIds);
                    });
                })
                ->with(['employee.user', 'employee.organizationUnit', 'leaveType'])
                ->get();
        }

        return $regularEmployeeLeaves->merge($childUnitHeadLeaves);
    }

    /**
     * Get leaves where user is director (for signing - status = approved but not yet signed)
     */
    protected function getLeavesWhereDirector(User $user): Collection
    {
        // Find level 1 organization where user is head
        $directorOfUnit = OrganizationUnit::where('head_id', $user->id)
            ->where('level', 1)
            ->first();
        
        if (!$directorOfUnit) {
            return collect();
        }

        // Get all child unit IDs
        $childUnitIds = $this->getAllChildUnitIds($directorOfUnit->id);
        $childUnitIds[] = $directorOfUnit->id;

        // Director signs approved leaves that haven't been signed yet
        return Leave::approved()
            ->whereNull('director_signed_at')
            ->whereHas('employee', function ($query) use ($childUnitIds) {
                $query->whereIn('organization_unit_id', $childUnitIds);
            })
            ->with(['employee.user', 'employee.organizationUnit', 'leaveType'])
            ->get();
    }

    /**
     * Get early leaves where user is supervisor
     */
    protected function getEarlyLeavesWhereSupervisor(User $user): Collection
    {
        $headOfUnits = OrganizationUnit::where('head_id', $user->id)->get();
        
        if ($headOfUnits->isEmpty()) {
            return collect();
        }

        $headOfUnitIds = $headOfUnits->pluck('id')->toArray();
        
        // Get child units where user can approve their heads
        $childUnitIds = [];
        foreach ($headOfUnits as $unit) {
            $childUnits = OrganizationUnit::where('parent_id', $unit->id)->pluck('id')->toArray();
            $childUnitIds = array_merge($childUnitIds, $childUnits);
        }
        
        // Get child unit head user IDs
        $childUnitHeadUserIds = OrganizationUnit::whereIn('id', $childUnitIds)
            ->whereNotNull('head_id')
            ->pluck('head_id')
            ->toArray();

        // Get head user IDs of the units user is managing (to exclude them from regular employee query)
        $ownUnitHeadUserIds = OrganizationUnit::whereIn('id', $headOfUnitIds)
            ->whereNotNull('head_id')
            ->pluck('head_id')
            ->toArray();

        // Case 1: Regular employees in units where user is head
        // Exclude: heads of child units AND heads of the unit itself
        $excludeUserIds = array_unique(array_merge($childUnitHeadUserIds, $ownUnitHeadUserIds));
        
        $regularEmployeeRequests = EarlyLeaveRequest::pendingSupervisor()
            ->whereHas('employee', function ($query) use ($headOfUnitIds, $excludeUserIds) {
                $query->whereIn('organization_unit_id', $headOfUnitIds)
                    ->whereHas('user', function ($q) use ($excludeUserIds) {
                        $q->whereNotIn('id', $excludeUserIds);
                    });
            })
            ->with(['employee.user', 'employee.organizationUnit'])
            ->get();

        // Case 2: Heads of child units who need approval from parent head
        $childUnitHeadRequests = collect();
        if (!empty($childUnitHeadUserIds)) {
            $childUnitHeadRequests = EarlyLeaveRequest::pendingSupervisor()
                ->whereHas('employee', function ($query) use ($childUnitHeadUserIds) {
                    $query->whereHas('user', function ($q) use ($childUnitHeadUserIds) {
                        $q->whereIn('id', $childUnitHeadUserIds);
                    });
                })
                ->with(['employee.user', 'employee.organizationUnit'])
                ->get();
        }

        return $regularEmployeeRequests->merge($childUnitHeadRequests);
    }

    /**
     * Get early leaves where user is director (for signing - status = approved but not yet signed)
     */
    protected function getEarlyLeavesWhereDirector(User $user): Collection
    {
        $directorOfUnit = OrganizationUnit::where('head_id', $user->id)
            ->where('level', 1)
            ->first();
        
        if (!$directorOfUnit) {
            return collect();
        }

        $childUnitIds = $this->getAllChildUnitIds($directorOfUnit->id);
        $childUnitIds[] = $directorOfUnit->id;

        // Director signs approved early leaves that haven't been signed yet
        return EarlyLeaveRequest::approved()
            ->whereNull('director_signed_at')
            ->whereHas('employee', function ($query) use ($childUnitIds) {
                $query->whereIn('organization_unit_id', $childUnitIds);
            })
            ->with(['employee.user', 'employee.organizationUnit'])
            ->get();
    }

    /**
     * Get all child unit IDs recursively
     */
    protected function getAllChildUnitIds(int $parentId): array
    {
        $ids = [];
        $children = OrganizationUnit::where('parent_id', $parentId)->get();
        
        foreach ($children as $child) {
            $ids[] = $child->id;
            $ids = array_merge($ids, $this->getAllChildUnitIds($child->id));
        }
        
        return $ids;
    }

    /**
     * Format leave for response
     */
    protected function formatLeave(Leave $leave, string $approvalRole): array
    {
        // Format date range nicely
        $startDate = $leave->start_date;
        $endDate = $leave->end_date;
        
        if ($startDate->isSameDay($endDate)) {
            $dateRange = $startDate->translatedFormat('d M Y');
        } else {
            $dateRange = $startDate->translatedFormat('d M') . ' - ' . $endDate->translatedFormat('d M Y');
        }

        return [
            'id' => $leave->id,
            'type' => 'leave',
            'approval_role' => $approvalRole,
            'approval_type' => $approvalRole, // Alias for Flutter
            'employee' => [
                'id' => $leave->employee->id,
                'name' => $leave->employee->user?->name ?? $leave->employee->first_name . ' ' . $leave->employee->last_name,
                'organization_unit' => $leave->employee->organizationUnit?->name,
                'position' => $leave->employee->position,
            ],
            'leave_type' => $leave->leaveType?->name,
            'leave_type_name' => $leave->leaveType?->name, // Alias for Flutter
            'start_date' => $leave->start_date->format('Y-m-d'),
            'end_date' => $leave->end_date->format('Y-m-d'),
            'date_range' => $dateRange, // For Flutter
            'total_days' => $leave->total_days,
            'reason' => $leave->reason,
            'delegation_to' => $leave->delegation_to,
            'status' => $leave->status,
            'status_label' => $leave->status_label,
            'created_at' => $leave->created_at->format('Y-m-d H:i'),
        ];
    }

    /**
     * Format early leave for response
     */
    protected function formatEarlyLeave(EarlyLeaveRequest $request, string $approvalRole): array
    {
        return [
            'id' => $request->id,
            'type' => 'early_leave',
            'approval_role' => $approvalRole,
            'approval_type' => $approvalRole, // Alias for Flutter
            'employee' => [
                'id' => $request->employee->id,
                'name' => $request->employee->user?->name ?? $request->employee->first_name . ' ' . $request->employee->last_name,
                'organization_unit' => $request->employee->organizationUnit?->name,
                'position' => $request->employee->position,
            ],
            'date' => $request->date->format('Y-m-d'),
            'date_formatted' => $request->date->translatedFormat('d M Y'), // For Flutter
            'requested_leave_time' => $request->requested_leave_time->format('H:i'),
            'scheduled_leave_time' => $request->scheduled_leave_time->format('H:i'),
            'reason' => $request->reason,
            'delegation_to' => $request->delegation_to,
            'status' => $request->status,
            'status_label' => $request->status_label,
            'created_at' => $request->created_at->format('Y-m-d H:i'),
        ];
    }

    /**
     * Get response letter template for leave
     */
    public function getLeaveResponseTemplate(Employee $employee): ?DocumentTemplate
    {
        // First try to find template in employee's org unit
        $template = DocumentTemplate::active()
            ->leaveResponseTemplate()
            ->where('organization_unit_id', $employee->organization_unit_id)
            ->first();

        if ($template) {
            return $template;
        }

        // Fallback: find template in level 1 org unit
        $orgUnit = $employee->organizationUnit;
        while ($orgUnit && $orgUnit->level > 1) {
            $orgUnit = $orgUnit->parent;
        }

        if ($orgUnit) {
            return DocumentTemplate::active()
                ->leaveResponseTemplate()
                ->where('organization_unit_id', $orgUnit->id)
                ->first();
        }

        return null;
    }

    /**
     * Generate response letter number for Leave
     */
    public function generateResponseLetterNumber(DocumentTemplate $template, Leave $leave): string
    {
        $format = $template->numbering_format ?? '{no}/CUTI-BALASAN/{unit}/{tahun}';
        $year = now()->year;
        
        // Count existing response letters for this year
        $count = Leave::whereYear('response_letter_generated_at', $year)
            ->whereNotNull('response_letter_number')
            ->whereHas('employee', fn($q) => $q->where('organization_unit_id', $leave->employee->organization_unit_id))
            ->count();
        
        $nextNumber = str_pad($count + 1, 3, '0', STR_PAD_LEFT);
        $unitCode = $leave->employee->organizationUnit->code ?? 'UNIT';
        
        return str_replace(
            ['{no}', '{kode}', '{unit}', '{tahun}', '{bulan}', '{nomor}'],
            [$nextNumber, $unitCode, $unitCode, $year, now()->format('m'), $nextNumber],
            $format
        );
    }

    /**
     * Generate response letter number for Early Leave Request
     */
    public function generateEarlyLeaveResponseLetterNumber(EarlyLeaveRequest $earlyLeave): string
    {
        $year = now()->year;
        $orgUnitId = $earlyLeave->employee->organization_unit_id ?? null;
        
        // Try to get template for numbering format
        $template = $orgUnitId 
            ? DocumentTemplate::active()
                ->where('type', 'early_leave_response')
                ->where('organization_unit_id', $orgUnitId)
                ->first()
            : null;
        
        $format = $template?->numbering_format ?? '{no}/IPC-BALASAN/{unit}/{tahun}';
        
        // Count existing early leave response letters for this year
        $count = EarlyLeaveRequest::whereYear('response_letter_generated_at', $year)
            ->whereNotNull('response_letter_number')
            ->when($orgUnitId, fn($q) => $q->whereHas('employee', fn($q2) => $q2->where('organization_unit_id', $orgUnitId)))
            ->count();
        
        $nextNumber = str_pad($count + 1, 3, '0', STR_PAD_LEFT);
        $unitCode = $earlyLeave->employee->organizationUnit->code ?? 'UNIT';
        
        return str_replace(
            ['{no}', '{kode}', '{unit}', '{tahun}', '{bulan}', '{nomor}'],
            [$nextNumber, $unitCode, $unitCode, $year, now()->format('m'), $nextNumber],
            $format
        );
    }

    /**
     * Check if user has any pending approvals
     */
    public function hasPendingApprovals(User $user): bool
    {
        $approvals = $this->getPendingApprovalsForUser($user);
        
        return $approvals['leaves']->count() > 0 || $approvals['early_leaves']->count() > 0;
    }

    /**
     * Count pending approvals for user
     */
    public function countPendingApprovals(User $user): int
    {
        $approvals = $this->getPendingApprovalsForUser($user);
        
        return $approvals['leaves']->count() + $approvals['early_leaves']->count();
    }
}
