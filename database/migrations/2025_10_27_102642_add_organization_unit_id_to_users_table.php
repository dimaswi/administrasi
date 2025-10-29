<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('organization_unit_id')->nullable()->after('role_id')->constrained('organization_units')->onDelete('set null');
            $table->string('position')->nullable()->after('organization_unit_id'); // Jabatan
            $table->string('phone')->nullable()->after('position'); // Nomor telepon
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['organization_unit_id']);
            $table->dropColumn(['organization_unit_id', 'position', 'phone']);
        });
    }
};
