<?php
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$name = trim($_POST['name'] ?? '');
$username = trim($_POST['username'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';
$confirm = $_POST['confirm_password'] ?? '';

if ($name === '' || $username === '' || $email === '' || $password === '') {
    http_response_code(422);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'All fields are required']);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Invalid email']);
    exit;
}
if (strlen($username) < 3 || strlen($username) > 32) {
    http_response_code(422);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Username length invalid']);
    exit;
}
if ($password !== $confirm) {
    http_response_code(422);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Passwords do not match']);
    exit;
}

$conn = Database::getInstance()->getConnection();

// Check unique email/username
$checkQuery = 'SELECT 1 FROM users WHERE email = ? OR username = ? LIMIT 1';
$checkStmt = $conn->prepare($checkQuery);
if (!$checkStmt) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database error']);
    exit;
}
$checkStmt->bind_param('ss', $email, $username);
$checkStmt->execute();
$checkResult = $checkStmt->get_result();
if ($checkResult->fetch_assoc()) {
    http_response_code(409);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Email or username already exists']);
    exit;
}

$hash = password_hash($password, PASSWORD_DEFAULT);

$insertQuery = 'INSERT INTO users (name, username, email, password_hash) VALUES (?, ?, ?, ?)';
$insertStmt = $conn->prepare($insertQuery);
if (!$insertStmt) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database error']);
    exit;
}
$insertStmt->bind_param('ssss', $name, $username, $email, $hash);
if (!$insertStmt->execute()) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Failed to create user']);
    exit;
}

http_response_code(200);
header('Content-Type: application/json');
echo json_encode(['success' => true]);
exit;

?>


