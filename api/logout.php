<?php
require_once __DIR__ . '/bootstrap.php';

// Accept both GET and POST requests for logout
if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get session token from cookie
$token = $_COOKIE['session_token'] ?? null;

if ($token) {
    $conn = Database::getInstance()->getConnection();
    
    // Delete the session from database
    $delQuery = 'DELETE FROM user_sessions WHERE session_token = ?';
    $delStmt = $conn->prepare($delQuery);
    if ($delStmt) {
        $delStmt->bind_param('s', $token);
        $delStmt->execute();
    }
}

// Clear the session cookie
setcookie('session_token', '', [
    'expires' => time() - 3600,
    'path' => '/',
    'httponly' => false,
    'samesite' => 'Lax',
]);

http_response_code(200);
header('Content-Type: application/json');
echo json_encode(['success' => true]);
exit;

?>

