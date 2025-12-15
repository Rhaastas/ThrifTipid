<?php
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../models/Notification.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405); exit;
}

$userId = Auth::userId();
if (!$userId) { Response::error('Unauthorized',401); exit; }

$input = json_decode(file_get_contents('php://input'), true);

// Handle mark all as read
if (isset($input['mark_all']) && $input['mark_all']) {
    $conn = Database::getInstance()->getConnection();
    $stmt = $conn->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?");
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    Response::success([], 'All notifications marked as read');
    exit;
}

// Handle single notification mark as read
if (isset($input['id'])) {
    $notificationId = intval($input['id']);
    
    // Verify the notification belongs to this user before marking as read
    $conn = Database::getInstance()->getConnection();
    $stmt = $conn->prepare("SELECT user_id FROM notifications WHERE id = ?");
    $stmt->bind_param('i', $notificationId);
    $stmt->execute();
    $result = $stmt->get_result();
    $notification = $result->fetch_assoc();
    
    if (!$notification) {
        Response::error('Notification not found', 404);
        exit;
    }
    
    if ($notification['user_id'] != $userId) {
        Response::error('Unauthorized', 403);
        exit;
    }
    
    // Mark as read
    $notifModel = new Notification();
    if ($notifModel->markRead($notificationId)) {
        Response::success([], 'Notification marked as read');
    } else {
        Response::error('Failed to mark notification as read');
    }
    exit;
}

Response::error('Invalid request');
?>
