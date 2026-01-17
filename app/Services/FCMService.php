<?php

namespace App\Services;

use App\Models\FcmToken;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class FCMService
{
    protected $projectId;
    protected $credentialsPath;
    protected $fcmUrl;

    public function __construct()
    {
        $this->projectId = config('firebase.project_id');
        $this->credentialsPath = config('firebase.credentials');
        $this->fcmUrl = "https://fcm.googleapis.com/v1/projects/{$this->projectId}/messages:send";
    }

    /**
     * Get OAuth2 access token from service account
     */
    protected function getAccessToken(): ?string
    {
        // Cache token for 50 minutes (expires in 60)
        return Cache::remember('fcm_access_token', 3000, function () {
            if (!file_exists($this->credentialsPath)) {
                Log::error('Firebase credentials file not found: ' . $this->credentialsPath);
                return null;
            }

            $credentials = json_decode(file_get_contents($this->credentialsPath), true);
            
            if (!$credentials) {
                Log::error('Invalid Firebase credentials file');
                return null;
            }

            // Create JWT
            $header = base64_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
            
            $now = time();
            $payload = base64_encode(json_encode([
                'iss' => $credentials['client_email'],
                'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
                'aud' => 'https://oauth2.googleapis.com/token',
                'iat' => $now,
                'exp' => $now + 3600,
            ]));

            $signatureInput = $header . '.' . $payload;
            
            openssl_sign(
                $signatureInput,
                $signature,
                $credentials['private_key'],
                'SHA256'
            );
            
            $jwt = $signatureInput . '.' . base64_encode($signature);

            // Exchange JWT for access token (disable SSL verify for local development)
            $response = Http::withoutVerifying()->asForm()->post('https://oauth2.googleapis.com/token', [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion' => $jwt,
            ]);

            if ($response->successful()) {
                return $response->json('access_token');
            }

            Log::error('Failed to get FCM access token: ' . $response->body());
            return null;
        });
    }

    /**
     * Send notification to a single token
     */
    public function sendToToken(string $token, string $title, string $body, array $data = []): bool
    {
        $accessToken = $this->getAccessToken();
        
        if (!$accessToken) {
            Log::warning('FCM access token not available');
            return false;
        }

        try {
            $message = [
                'message' => [
                    'token' => $token,
                    'notification' => [
                        'title' => $title,
                        'body' => $body,
                    ],
                    'android' => [
                        'priority' => 'high',
                        'notification' => [
                            'sound' => 'default',
                        ],
                    ],
                    'apns' => [
                        'payload' => [
                            'aps' => [
                                'sound' => 'default',
                            ],
                        ],
                    ],
                ],
            ];

            if (!empty($data)) {
                $message['message']['data'] = array_map('strval', $data);
            }

            $response = Http::withoutVerifying()->withHeaders([
                'Authorization' => 'Bearer ' . $accessToken,
                'Content-Type' => 'application/json',
            ])->post($this->fcmUrl, $message);

            if ($response->successful()) {
                return true;
            }

            $error = $response->json();
            
            // Check if token is invalid
            if (isset($error['error']['details'])) {
                foreach ($error['error']['details'] as $detail) {
                    if (isset($detail['errorCode']) && 
                        in_array($detail['errorCode'], ['UNREGISTERED', 'INVALID_ARGUMENT'])) {
                        FcmToken::removeInvalidToken($token);
                    }
                }
            }

            Log::error('FCM send failed: ' . $response->body());
            return false;
        } catch (\Exception $e) {
            Log::error('FCM send exception: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send notification to multiple tokens
     */
    public function sendToMultipleTokens(array $tokens, string $title, string $body, array $data = []): array
    {
        if (empty($tokens)) {
            return ['success' => 0, 'failed' => 0, 'total' => 0];
        }

        $successCount = 0;
        $failedCount = 0;

        // FCM V1 API doesn't support batch, send one by one
        foreach ($tokens as $token) {
            if ($this->sendToToken($token, $title, $body, $data)) {
                $successCount++;
            } else {
                $failedCount++;
            }
        }

        return [
            'success' => $successCount,
            'failed' => $failedCount,
            'total' => count($tokens),
        ];
    }

    /**
     * Send notification to all users
     */
    public function sendToAllUsers(string $title, string $body, array $data = []): array
    {
        $tokens = FcmToken::whereHas('user')->pluck('token')->toArray();
        return $this->sendToMultipleTokens($tokens, $title, $body, $data);
    }

    /**
     * Send notification to specific users
     */
    public function sendToUsers(array $userIds, string $title, string $body, array $data = []): array
    {
        $tokens = FcmToken::whereIn('user_id', $userIds)->pluck('token')->toArray();
        return $this->sendToMultipleTokens($tokens, $title, $body, $data);
    }

    /**
     * Send notification to a user (all their devices)
     */
    public function sendToUser(User $user, string $title, string $body, array $data = []): array
    {
        return $this->sendToUsers([$user->id], $title, $body, $data);
    }

    /**
     * Register FCM token for user
     */
    public function registerToken(int $userId, string $token, ?string $deviceType = null, ?string $deviceName = null): FcmToken
    {
        return FcmToken::updateOrCreateToken($userId, $token, $deviceType, $deviceName);
    }

    /**
     * Unregister FCM token
     */
    public function unregisterToken(string $token): void
    {
        FcmToken::removeInvalidToken($token);
    }
}
