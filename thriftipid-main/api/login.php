<?php
require __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method not allowed'], 405);
}

$login = trim($_POST['login'] ?? '');
$password = $_POST['password'] ?? '';
$remember = isset($_POST['remember']) && $_POST['remember'] == '1';

if ($login === '' || $password === '') {
    json_response(['error' => 'Login and password are required'], 422);
}

$pdo = db();

// Find by email or username
$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1');
$stmt->execute([$login, $login]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    json_response(['error' => 'Invalid credentials'], 401);
}

// Create session token
$token = bin2hex(random_bytes(32)); // 64-char hex
$expires = new DateTime($remember ? '+30 days' : '+1 day');

$ins = $pdo->prepare('INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?)');
$ins->execute([
    $user['id'],
    $token,
    $_SERVER['REMOTE_ADDR'] ?? null,
    $_SERVER['HTTP_USER_AGENT'] ?? null,
    $expires->format('Y-m-d H:i:s'),
]);

setcookie('session_token', $token, [
    'expires' => $expires->getTimestamp(),
    'path' => '/',
    'httponly' => false,
    'samesite' => 'Lax',
]);

$upd = $pdo->prepare('UPDATE users SET last_login_at = NOW() WHERE id = ?');
$upd->execute([$user['id']]);

json_response(['success' => true]);

?>


