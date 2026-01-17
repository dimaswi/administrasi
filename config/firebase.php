<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Firebase Project ID
    |--------------------------------------------------------------------------
    |
    | Project ID dari Firebase Console
    |
    */
    'project_id' => env('FIREBASE_PROJECT_ID', 'klinik-muh-kdg'),

    /*
    |--------------------------------------------------------------------------
    | Firebase Credentials (Service Account)
    |--------------------------------------------------------------------------
    |
    | Path ke file service account JSON dari Firebase Console
    | Download dari: Project Settings > Service Accounts > Generate new private key
    |
    */
    'credentials' => env('FIREBASE_CREDENTIALS', storage_path('app/firebase/service-account.json')),
];
