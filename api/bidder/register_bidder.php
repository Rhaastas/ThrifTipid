<?php
/**
 * Bidder Registration
 * POST /api/bidder/register_bidder.php
 */

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../models/Bidder.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
    exit;
}

$name = trim($_POST['name'] ?? '');
$username = trim($_POST['username'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';
$confirmPassword = $_POST['confirm_password'] ?? '';

// Validation
$errors = [];

if ($name === '') {
    $errors[] = 'Name is required';
}

if ($username === '') {
    $errors[] = 'Username is required';
} elseif (strlen($username) < 3 || strlen($username) > 32) {
    $errors[] = 'Username must be between 3 and 32 characters';
}

if ($email === '') {
    $errors[] = 'Email is required';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Invalid email format';
}

if ($password === '') {
    $errors[] = 'Password is required';
} elseif (strlen($password) < 6) {
    $errors[] = 'Password must be at least 6 characters';
}

if ($password !== $confirmPassword) {
    $errors[] = 'Passwords do not match';
}

if (count($errors) > 0) {
    Response::validation($errors);
    exit;
}

$bidderModel = new Bidder();

// Check if username or email already exists
if ($bidderModel->usernameExists($username)) {
    Response::error('Username already taken', 409);
    exit;
}

if ($bidderModel->emailExists($email)) {
    Response::error('Email already registered', 409);
    exit;
}

// Hash password and create account
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

if ($bidderModel->create($name, $username, $email, $passwordHash)) {
    Response::success(['message' => 'Registration successful'], 'Welcome to ThrifTipid! Please login.', 201);
} else {
    Response::error('Registration failed', 500);
}
?>
