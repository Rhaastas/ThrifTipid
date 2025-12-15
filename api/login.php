<?php
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$login = trim($_POST['login'] ?? '');
$password = $_POST['password'] ?? '';
$remember = isset($_POST['remember']) && $_POST['remember'] == '1';

if ($login === '' || $password === '') {
    http_response_code(422);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Login and password are required']);
    exit;
}

$conn = Database::getInstance()->getConnection();

// Find by email or username
$query = 'SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1';
$stmt = $conn->prepare($query);
if (!$stmt) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database error']);
    exit;
}
$stmt->bind_param('ss', $login, $login);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if (!$user || !password_verify($password, $user['password_hash'])) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Invalid credentials']);
    exit;
}

// Create session token
$token = bin2hex(random_bytes(32)); // 64-char hex
$expires = new DateTime($remember ? '+30 days' : '+1 day');

$insQuery = 'INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?)';
$insStmt = $conn->prepare($insQuery);
if (!$insStmt) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database error']);
    exit;
}

$userId = (int)$user['id'];
$ipAddr = $_SERVER['REMOTE_ADDR'] ?? null;
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;
$expiresStr = $expires->format('Y-m-d H:i:s');

$insStmt->bind_param('issss', $userId, $token, $ipAddr, $userAgent, $expiresStr);
if (!$insStmt->execute()) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Failed to create session']);
    exit;
}

setcookie('session_token', $token, [
    'expires' => $expires->getTimestamp(),
    'path' => '/',
    'httponly' => false,
    'samesite' => 'Lax',
]);

$updQuery = 'UPDATE users SET last_login_at = NOW() WHERE id = ?';
$updStmt = $conn->prepare($updQuery);
if ($updStmt) {
    $updStmt->bind_param('i', $userId);
    $updStmt->execute();
}

http_response_code(200);
header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'user' => [
        'id' => (int)$user['id'],
        'username' => $user['username'],
        'name' => $user['name'],
        'role' => $user['role'] ?? 'user'
    ]
]);
exit;

?>


