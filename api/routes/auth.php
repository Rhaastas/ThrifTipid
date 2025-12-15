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
 * Auth Routes - Login, Register, Logout
 */

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../models/User.php';

// Get request method
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

$userModel = new User();

switch ($action) {
    case 'register':
        if ($method !== 'POST') {
            Response::error('Method not allowed', 405);
        }
        handleRegister($userModel);
        break;
        
    case 'login':
        if ($method !== 'POST') {
            Response::error('Method not allowed', 405);
        }
        handleLogin($userModel);
        break;
        
    case 'logout':
        if ($method !== 'POST') {
            Response::error('Method not allowed', 405);
        }
        handleLogout();
        break;
        
    case 'profile':
        if ($method !== 'GET') {
            Response::error('Method not allowed', 405);
        }
        handleProfile($userModel);
        break;
        
    default:
        Response::error('Invalid action', 400);
}

/**
 * Handle user registration
 */
function handleRegister($userModel) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        Response::error('Invalid input', 400);
    }
    
    $name = trim($input['name'] ?? '');
    $username = trim($input['username'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    
    // Validation
    if (!$name || !$username || !$email || !$password) {
        Response::validation('Missing required fields', ['name', 'username', 'email', 'password']);
    }
    
    if (!Auth::isValidEmail($email)) {
        Response::validation('Invalid email format');
    }
    
    if (!Auth::isValidUsername($username)) {
        Response::validation('Username must be 3-32 characters (alphanumeric, -, _)');
    }
    
    if (strlen($password) < 8) {
        Response::validation('Password must be at least 8 characters');
    }
    
    // Check if user exists
    if ($userModel->emailExists($email)) {
        Response::error('Email already registered', 409);
    }
    
    if ($userModel->usernameExists($username)) {
        Response::error('Username already taken', 409);
    }
    
    // Create user
    $passwordHash = Auth::hashPassword($password);
    $userId = $userModel->create($name, $username, $email, $passwordHash);
    
    if (!$userId) {
        Response::error('Failed to create user', 500);
    }
    
    // Log in user automatically
    $user = $userModel->findById($userId);
    Session::setUser([
        'id' => $user['id'],
        'name' => $user['name'],
        'username' => $user['username'],
        'email' => $user['email'],
        'display_name' => $user['display_name']
    ]);
    
    Response::success([
        'id' => $user['id'],
        'name' => $user['name'],
        'username' => $user['username'],
        'email' => $user['email'],
        'display_name' => $user['display_name'],
        'role' => $user['role'] ?? 'user'
    ], 'User registered successfully', 201);
}

/**
 * Handle user login
 */
function handleLogin($userModel) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        Response::error('Invalid input', 400);
    }

    $login = trim($input['login'] ?? '');
    $password = $input['password'] ?? '';

    if (!$login || !$password) {
        Response::validation('Login and password are required');
    }

    // Find user
    $user = $userModel->findByEmailOrUsername($login);

    if (!$user || !Auth::verifyPassword($password, $user['password_hash'])) {
        Response::error('Invalid credentials', 401);
    }

    // Update last login
    $userModel->updateLastLogin($user['id']);

    // Create session
    Session::setUser([
        'id' => $user['id'],
        'name' => $user['name'],
        'username' => $user['username'],
        'email' => $user['email'],
        'display_name' => $user['display_name'],
        'role' => $user['role']
    ]);

    // Generate secure session token
    try {
        $session_token = bin2hex(random_bytes(32));
    } catch (Exception $e) {
        Response::error('Failed to generate session token', 500, $e->getMessage());
    }
    $user_id = $user['id'];
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
        $stmt->bind_param('issss', $user_id, $session_token, $ip, $ua, $expires_at);
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

    if (ob_get_length()) ob_end_clean();
    Response::success([
        'id' => $user['id'],
        'name' => $user['name'],
        'username' => $user['username'],
        'email' => $user['email'],
        'display_name' => $user['display_name'],
        'role' => $user['role']
    ], 'Login successful');
}

/**
 * Handle logout
 */
function handleLogout() {
    Session::logout();
    Response::success(null, 'Logged out successfully');
}

/**
 * Handle get profile
 */
function handleProfile($userModel) {
    Auth::requireLogin();
    
    $user = Auth::user();
    $fullUser = $userModel->findById($user['id']);
    
    Response::success($fullUser, 'Profile retrieved');
}
?>
