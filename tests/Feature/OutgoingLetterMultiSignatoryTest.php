<?php

use App\Models\DocumentTemplate;
use App\Models\LetterSignatory;
use App\Models\OrganizationUnit;
use App\Models\OutgoingLetter;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

function createFourColumnTemplate(OrganizationUnit $unit, User $creator): DocumentTemplate
{
    return DocumentTemplate::create([
        'name' => 'Template 4 Kolom',
        'code' => 'T4K-' . uniqid(),
        'organization_unit_id' => $unit->id,
        'page_settings' => DocumentTemplate::defaultPageSettings(),
        'header_settings' => DocumentTemplate::defaultHeaderSettings(),
        'content_blocks' => [
            [
                'id' => 'blk-1',
                'type' => 'paragraph',
                'content' => 'Isi surat uji coba',
                'style' => [
                    'font_family' => null,
                    'font_size' => null,
                    'font_weight' => 'normal',
                    'font_style' => 'normal',
                    'text_align' => 'left',
                    'line_height' => null,
                    'margin_top' => 0,
                    'margin_bottom' => 4,
                    'margin_left' => 0,
                    'margin_right' => 0,
                    'indent_first_line' => 0,
                    'letter_spacing' => 0,
                ],
            ],
        ],
        'footer_settings' => null,
        'signature_settings' => [
            'margin_top' => 20,
            'layout' => '4-column',
            'column_gap' => 10,
            'slots' => [
                ['id' => 'slot-1', 'column' => 0, 'order' => 0, 'label_above' => 'Mengetahui', 'label_position' => 'Jabatan 1', 'show_name' => true, 'show_nip' => true, 'signature_height' => 25, 'text_align' => 'center', 'font_size' => 12],
                ['id' => 'slot-2', 'column' => 1, 'order' => 0, 'label_above' => 'Menyetujui', 'label_position' => 'Jabatan 2', 'show_name' => true, 'show_nip' => true, 'signature_height' => 25, 'text_align' => 'center', 'font_size' => 12],
                ['id' => 'slot-3', 'column' => 2, 'order' => 0, 'label_above' => 'Memeriksa', 'label_position' => 'Jabatan 3', 'show_name' => true, 'show_nip' => true, 'signature_height' => 25, 'text_align' => 'center', 'font_size' => 12],
                ['id' => 'slot-4', 'column' => 3, 'order' => 0, 'label_above' => 'Pembuat', 'label_position' => 'Jabatan 4', 'show_name' => true, 'show_nip' => true, 'signature_height' => 25, 'text_align' => 'center', 'font_size' => 12],
            ],
        ],
        'variables' => [],
        'numbering_format' => '{no}/{kode}/{unit}/{bulan}/{tahun}',
        'is_active' => true,
        'created_by' => $creator->id,
    ]);
}

test('same user assigned to 3 of 4 signature slots can sign all 3 consecutive slots at once', function () {
    $unit = OrganizationUnit::create(['code' => 'UNIT1', 'name' => 'Unit Satu']);
    $creator = User::factory()->create(['organization_unit_id' => $unit->id]);
    $userA = User::factory()->create(['organization_unit_id' => $unit->id]);
    $userB = User::factory()->create(['organization_unit_id' => $unit->id]);

    $template = createFourColumnTemplate($unit, $creator);

    $this->actingAs($creator)->post('/arsip/outgoing-letters', [
        'template_id' => $template->id,
        'subject' => 'Surat 4 Kolom 3 TTD Sama',
        'letter_date' => '2026-11-24',
        'variable_values' => ['perihal' => 'Test'],
        'signatories' => [
            ['user_id' => $userA->id, 'slot_id' => 'slot-1', 'sign_order' => 0],
            ['user_id' => $userA->id, 'slot_id' => 'slot-2', 'sign_order' => 1],
            ['user_id' => $userA->id, 'slot_id' => 'slot-3', 'sign_order' => 2],
            ['user_id' => $userB->id, 'slot_id' => 'slot-4', 'sign_order' => 3],
        ],
    ])->assertRedirect();

    $letter = OutgoingLetter::firstOrFail();
    $userASlots = $letter->signatories()->where('user_id', $userA->id)->orderBy('sign_order')->get();
    expect($userASlots)->toHaveCount(3);

    $this->actingAs($userA)
        ->get("/arsip/outgoing-letters/{$letter->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('can_sign', true)
            ->where('signable_signatory_ids', $userASlots->pluck('id')->values()->all())
        );

    $this->actingAs($userA)
        ->post("/arsip/outgoing-letters/{$letter->id}/sign", [
            'signatory_ids' => $userASlots->pluck('id')->values()->all(),
        ])
        ->assertRedirect();

    $letter->refresh();
    expect($letter->status)->toBe(OutgoingLetter::STATUS_PARTIAL);
    expect($letter->signatories()->where('user_id', $userA->id)->where('status', 'approved')->count())->toBe(3);

    $certificateIds = $letter->signatories()->where('user_id', $userA->id)->pluck('certificate_id')->unique();
    expect($certificateIds)->toHaveCount(3);

    $this->actingAs($userA)
        ->get("/arsip/outgoing-letters/{$letter->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('can_sign', false)
            ->where('signable_signatory_ids', [])
        );

    $this->actingAs($userB)
        ->post("/arsip/outgoing-letters/{$letter->id}/sign")
        ->assertRedirect();

    $letter->refresh();
    expect($letter->status)->toBe(OutgoingLetter::STATUS_SIGNED);
});

test('same user assigned to non-consecutive slots can sign later slot after intermediate signer completes', function () {
    $unit = OrganizationUnit::create(['code' => 'UNIT2', 'name' => 'Unit Dua']);
    $creator = User::factory()->create(['organization_unit_id' => $unit->id]);
    $userA = User::factory()->create(['organization_unit_id' => $unit->id]);
    $userB = User::factory()->create(['organization_unit_id' => $unit->id]);

    $template = createFourColumnTemplate($unit, $creator);

    $letter = OutgoingLetter::create([
        'template_id' => $template->id,
        'subject' => 'Surat Giliran Terpisah',
        'letter_date' => '2026-11-24',
        'variable_values' => ['perihal' => 'Test'],
        'status' => OutgoingLetter::STATUS_PENDING,
        'created_by' => $creator->id,
    ]);

    $slot1 = LetterSignatory::create(['letter_id' => $letter->id, 'user_id' => $userA->id, 'slot_id' => 'slot-1', 'sign_order' => 0, 'status' => 'pending']);
    $slot2 = LetterSignatory::create(['letter_id' => $letter->id, 'user_id' => $userB->id, 'slot_id' => 'slot-2', 'sign_order' => 1, 'status' => 'pending']);
    $slot3 = LetterSignatory::create(['letter_id' => $letter->id, 'user_id' => $userA->id, 'slot_id' => 'slot-3', 'sign_order' => 2, 'status' => 'pending']);
    $slot4 = LetterSignatory::create(['letter_id' => $letter->id, 'user_id' => $userA->id, 'slot_id' => 'slot-4', 'sign_order' => 3, 'status' => 'pending']);

    // Initially only slot1 is signable for userA
    $this->actingAs($userA)
        ->get("/arsip/outgoing-letters/{$letter->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('can_sign', true)
            ->where('signable_signatory_ids', [$slot1->id])
        );

    // UserA signs without specifying signatory_ids -> signs slot1 only, slot3 & slot4 remain pending
    $this->actingAs($userA)
        ->post("/arsip/outgoing-letters/{$letter->id}/sign")
        ->assertRedirect();

    expect($slot1->fresh()->status)->toBe('approved');
    expect($slot3->fresh()->status)->toBe('pending');
    expect($slot4->fresh()->status)->toBe('pending');

    // UserA still has pending slots, so show() should report pending user_signatory and can_request_revision = true
    $this->actingAs($userA)
        ->get("/arsip/outgoing-letters/{$letter->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('can_sign', false)
            ->where('can_request_revision', true)
            ->where('user_signatory.status', 'pending')
            ->where('signable_signatory_ids', [])
        );

    // UserB signs slot2
    $this->actingAs($userB)
        ->post("/arsip/outgoing-letters/{$letter->id}/sign")
        ->assertRedirect();

    // Now slot3 and slot4 are both signable for userA
    $this->actingAs($userA)
        ->get("/arsip/outgoing-letters/{$letter->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('can_sign', true)
            ->where('user_signatory.id', $slot3->id)
            ->where('signable_signatory_ids', [$slot3->id, $slot4->id])
        );

    // UserA signs remaining slots
    $this->actingAs($userA)
        ->post("/arsip/outgoing-letters/{$letter->id}/sign", [
            'signatory_ids' => [$slot3->id, $slot4->id],
        ])
        ->assertRedirect();

    $letter->refresh();
    expect($letter->status)->toBe(OutgoingLetter::STATUS_SIGNED);
});

test('user who already approved one slot can still reject on their remaining pending slot', function () {
    $unit = OrganizationUnit::create(['code' => 'UNIT3', 'name' => 'Unit Tiga']);
    $creator = User::factory()->create(['organization_unit_id' => $unit->id]);
    $userA = User::factory()->create(['organization_unit_id' => $unit->id]);
    $userB = User::factory()->create(['organization_unit_id' => $unit->id]);

    $template = createFourColumnTemplate($unit, $creator);

    $letter = OutgoingLetter::create([
        'template_id' => $template->id,
        'subject' => 'Surat Tolak Slot Kedua',
        'letter_date' => '2026-11-24',
        'variable_values' => ['perihal' => 'Test'],
        'status' => OutgoingLetter::STATUS_PENDING,
        'created_by' => $creator->id,
    ]);

    $slot1 = LetterSignatory::create(['letter_id' => $letter->id, 'user_id' => $userA->id, 'slot_id' => 'slot-1', 'sign_order' => 0, 'status' => 'approved', 'signed_at' => now()]);
    $slot2 = LetterSignatory::create(['letter_id' => $letter->id, 'user_id' => $userB->id, 'slot_id' => 'slot-2', 'sign_order' => 1, 'status' => 'approved', 'signed_at' => now()]);
    $slot3 = LetterSignatory::create(['letter_id' => $letter->id, 'user_id' => $userA->id, 'slot_id' => 'slot-3', 'sign_order' => 2, 'status' => 'pending']);

    $this->actingAs($userA)
        ->post("/arsip/outgoing-letters/{$letter->id}/reject", [
            'rejection_reason' => 'Perlu perbaikan di posisi jabatan 3',
        ])
        ->assertRedirect();

    expect($slot3->fresh()->status)->toBe('rejected');
    expect($letter->fresh()->status)->toBe(OutgoingLetter::STATUS_REJECTED);
});
