<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\User;
use Illuminate\Console\Command;

class DebugPermissions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'permission:debug';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Debug permissions for roles and users';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('=== PERMISSION DEBUG ===');
        
        // Check roles
        $roles = Role::with('permissions')->get();
        
        foreach ($roles as $role) {
            $this->line("\nRole: {$role->name} ({$role->display_name})");
            if ($role->permissions->count() > 0) {
                foreach ($role->permissions as $permission) {
                    $this->line("  - {$permission->name}");
                }
            } else {
                $this->error("  No permissions assigned!");
            }
        }
        
        // Check users
        $this->line("\n=== USERS ===");
        $users = User::with(['role.permissions'])->get();
        
        foreach ($users as $user) {
            $this->line("\nUser: {$user->name} (NIP: {$user->nip})");
            if ($user->role) {
                $this->line("  Role: {$user->role->name}");
                $permissions = $user->getAllPermissions();
                if (count($permissions) > 0) {
                    $this->line("  Permissions: " . implode(', ', $permissions));
                } else {
                    $this->error("  No permissions!");
                }
            } else {
                $this->error("  No role assigned!");
            }
        }
    }
}
