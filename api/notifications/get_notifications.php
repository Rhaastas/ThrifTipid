<?php
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../models/Notification.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405); exit;
}

$userId = Auth::userId();
if (!$userId) {
    Response::error('Unauthorized', 401); exit;
}

$notifModel = new Notification();
$notes = $notifModel->getForUser($userId, 100);

Response::success(['notifications' => $notes]);
