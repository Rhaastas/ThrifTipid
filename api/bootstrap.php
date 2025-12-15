<?php
/**
 * Bootstrap - Initialize the API
 * Load all core classes and helpers
 */

// Set CORS headers - Allow admin panel (port 3001) and main site
$allowedOrigins = [
    'http://localhost',
    'http://localhost:3001',
    'http://127.0.0.1',
    'http://127.0.0.1:3001'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: http://localhost');
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Load core classes
require_once __DIR__ . '/core/Database.php';
require_once __DIR__ . '/core/Response.php';
require_once __DIR__ . '/core/Session.php';
require_once __DIR__ . '/core/Auth.php';

// Initialize session
Session::start();

// Define API routes
define('API_BASE_URL', '/api');
define('APP_ROOT', dirname(dirname(__FILE__)));
?>
