<?php
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../models/User.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405); exit;
}

$userId = Auth::currentUserId();
if (!$userId) { Response::error('Unauthorized',401); exit; }

if (!isset($_FILES['avatar'])) {
    Response::error('No file uploaded',400); exit;
}

$file = $_FILES['avatar'];
// Basic validation
if ($file['error'] !== UPLOAD_ERR_OK) { Response::error('Upload error',400); exit; }
$maxSize = 5 * 1024 * 1024;
if ($file['size'] > $maxSize) { Response::error('File too large',413); exit; }

$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$allowed = ['jpg','jpeg','png','webp'];
if (!in_array(strtolower($ext), $allowed)) { Response::error('Invalid file type',415); exit; }

// create uploads dir if missing
$uploadDir = __DIR__ . '/../../public/uploads/profiles/';
if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

// unique filename
$fname = 'avatar_' . $userId . '_' . time() . '.' . $ext;
$destination = $uploadDir . $fname;

if (!move_uploaded_file($file['tmp_name'], $destination)) {
    Response::error('Failed to save file',500); exit;
}

// store relative path in users.profile_pic
$conn = Database::getInstance()->getConnection();
$publicPath = '/public/uploads/profiles/' . $fname;
$stmt = $conn->prepare("UPDATE users SET profile_pic = ? WHERE id = ?");
$stmt->bind_param('si', $publicPath, $userId);
$stmt->execute();

Response::success(['path'=>$publicPath], 'Avatar uploaded');
