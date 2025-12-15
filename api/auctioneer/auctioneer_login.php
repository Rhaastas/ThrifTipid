<?php
// Debug: Show errors during development
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
ob_start();

// Ensure fatal errors are returned as JSON
register_shutdown_function(function () {
    $err = error_get_last();
    if ($err !== null) {
        if (!headers_sent()) header('Content-Type: application/json');
        $payload = [
            'success' => false,
            'message' => 'Fatal error',
            'error' => $err,
        ];
        if (ob_get_length()) ob_end_clean();
        echo json_encode($payload);
        exit;
    }
});

/**
 * Auctioneer Login
 * POST /api/auctioneer/auctioneer_login.php
 */

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../models/Auctioneer.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
    exit;
}

$login = trim($_POST['login'] ?? $_POST['username'] ?? '');
$password = $_POST['password'] ?? '';

if ($login === '' || $password === '') {
    Response::error('Username and password are required', 422);
    exit;
}

$auctioneerModel = new Auctioneer();
$auctioneer = $auctioneerModel->findByUsername($login);

if (!$auctioneer || !password_verify($password, $auctioneer['password_hash'])) {
    Response::error('Invalid credentials', 401);
    exit;
}

// Create session for auctioneer
Session::set('auctioneer_id', $auctioneer['id']);
Session::set('auctioneer_username', $auctioneer['username']);
Session::set('auctioneer_name', $auctioneer['name']);
Session::set('auctioneer_type', 'auctioneer');

// Generate secure session token
try {
    $session_token = bin2hex(random_bytes(32));
} catch (Exception $e) {
    Response::error('Failed to generate session token', 500, $e->getMessage());
}

$auctioneer_id = $auctioneer['id'];
$expires_at = date('Y-m-d H:i:s', time() + 60 * 60 * 24 * 7); // 7 days
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$ua = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';

// Verify user_sessions table exists
$conn = Database::getInstance()->getConnection();
$check = $conn->query("SHOW TABLES LIKE 'user_sessions'");
if (!$check || $check->num_rows === 0) {
    Response::error('user_sessions table not found', 500);
}

// Store session in user_sessions table (include ip and user_agent)
$stmt = $conn->prepare('INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, created_at, expires_at) VALUES (?, ?, ?, ?, NOW(), ?)');
if ($stmt) {
    $stmt->bind_param('issss', $auctioneer_id, $session_token, $ip, $ua, $expires_at);
    if (!$stmt->execute()) {
        Response::error('Failed to create session token: ' . $stmt->error, 500);
    }
} else {
    Response::error('Failed to prepare session token statement: ' . $conn->error, 500);
}

// Set session_token cookie
setcookie('session_token', $session_token, [
    'expires' => time() + 60 * 60 * 24 * 7,
    'path' => '/',
    'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
    'httponly' => false,
    'samesite' => 'Lax',
]);

// Return JSON success
if (ob_get_length()) ob_end_clean();
Response::success([
    'auctioneer' => [
        'id' => $auctioneer['id'],
        'name' => $auctioneer['name'],
        'username' => $auctioneer['username'],
        'email' => $auctioneer['email'],
        'rating' => $auctioneer['rating'],
    ]
], 'Login successful');
