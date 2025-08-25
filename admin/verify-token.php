<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://ilyambr.me');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Your Google OAuth 2.0 Client ID
$client_id = '507965092209-7gvs8eg4e9qe6oc15dg89qam76lmtvue.apps.googleusercontent.com';
$authorized_email = 'amberrpann@gmail.com';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$id_token = $input['token'] ?? '';

if (empty($id_token)) {
    http_response_code(400);
    echo json_encode(['error' => 'Token required']);
    exit;
}

// Verify the token with Google
$url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . $id_token;
$response = file_get_contents($url);

if ($response === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to verify token']);
    exit;
}

$token_data = json_decode($response, true);

// Check if token is valid and from correct client
if (!isset($token_data['aud']) || $token_data['aud'] !== $client_id) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid token']);
    exit;
}

// Check if email is authorized
if (!isset($token_data['email']) || $token_data['email'] !== $authorized_email) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized email']);
    exit;
}

// Token is valid and email is authorized
echo json_encode([
    'success' => true,
    'user' => [
        'email' => $token_data['email'],
        'name' => $token_data['name'],
        'picture' => $token_data['picture']
    ]
]);
?>
