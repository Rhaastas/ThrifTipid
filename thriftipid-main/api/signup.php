<?php
require __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method not allowed'], 405);
}

$name = trim($_POST['name'] ?? '');
$username = trim($_POST['username'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';
$confirm = $_POST['confirm_password'] ?? '';

if ($name === '' || $username === '' || $email === '' || $password === '') {
    json_response(['error' => 'All fields are required'], 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(['error' => 'Invalid email'], 422);
}
if (strlen($username) < 3 || strlen($username) > 32) {
    json_response(['error' => 'Username length invalid'], 422);
}
if ($password !== $confirm) {
    json_response(['error' => 'Passwords do not match'], 422);
}

$pdo = db();

// Check unique email/username
$stmt = $pdo->prepare('SELECT 1 FROM users WHERE email = ? OR username = ? LIMIT 1');
$stmt->execute([$email, $username]);
if ($stmt->fetch()) {
    json_response(['error' => 'Email or username already exists'], 409);
}

$hash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $pdo->prepare('INSERT INTO users (name, username, email, password_hash) VALUES (?, ?, ?, ?)');
$stmt->execute([$name, $username, $email, $hash]);

json_response(['success' => true]);

?>


