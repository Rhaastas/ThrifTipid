<?php
require __DIR__ . '/db.php';

// Accept both GET and POST requests for logout
if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method not allowed'], 405);
}

// Get session token from cookie
$token = $_COOKIE['session_token'] ?? null;

if ($token) {
    $pdo = db();
    
    // Delete the session from database
    $stmt = $pdo->prepare('DELETE FROM user_sessions WHERE session_token = ?');
    $stmt->execute([$token]);
}

// Clear the session cookie
setcookie('session_token', '', [
    'expires' => time() - 3600,
    'path' => '/',
    'httponly' => false,
    'samesite' => 'Lax',
]);

json_response(['success' => true]);

?>

