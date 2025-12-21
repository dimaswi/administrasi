<?php

namespace App\Http\Controllers;

use App\Models\OutgoingLetter;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VerifyLetterController extends Controller
{
    /**
     * Show verification page for a letter
     */
    public function show(string $id)
    {
        $letter = OutgoingLetter::with([
            'template',
            'creator',
            'signatories.user',
        ])->findOrFail($id);

        // Transform signatories for display
        $signatories = $letter->signatories->map(function ($signatory) {
            return [
                'id' => $signatory->id,
                'name' => $signatory->user->name,
                'nip' => $signatory->user->nip,
                'position' => $signatory->getSlotInfo()['label_position'] ?? null,
                'status' => $signatory->status,
                'signed_at' => $signatory->signed_at,
            ];
        });

        $isFullySigned = $letter->status === OutgoingLetter::STATUS_SIGNED;

        return Inertia::render('verify/letter', [
            'letter' => [
                'id' => $letter->id,
                'letter_number' => $letter->letter_number,
                'subject' => $letter->subject,
                'letter_date' => $letter->letter_date,
                'status' => $letter->status,
                'created_at' => $letter->created_at,
                'template_name' => $letter->template->name ?? null,
                'creator_name' => $letter->creator->name ?? null,
            ],
            'signatories' => $signatories,
            'is_valid' => $isFullySigned,
        ]);
    }
}
