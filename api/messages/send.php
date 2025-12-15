<?php
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../models/Message.php';
require_once __DIR__ . '/../models/Notification.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { Response::error('Method not allowed',405); exit; }
$userId = Auth::userId(); if (!$userId) { Response::error('Unauthorized',401); exit; }

$input = json_decode(file_get_contents('php://input'), true);
$to = isset($input['to']) ? (int)$input['to'] : 0;
$body = isset($input['body']) ? trim($input['body']) : '';

if (!$to || !$body) { Response::error('Missing to or body',400); exit; }

$mesModel = new Message();
$conv = $mesModel->createConversationId($userId, $to);
if (!$conv) { Response::error('Invalid conversation',400); exit; }

$msgId = $mesModel->send($conv, $userId, $to, $body);

// Create a notification for recipient
$notif = new Notification();
$notif->create($to, sprintf('New message from user #%d', $userId), ['conversation' => $conv, 'message_id' => $msgId]);

if ($msgId) {
    Response::success(['message_id' => $msgId, 'conversation_id' => $conv], 'Message sent', 201);
} else {
    Response::error('Failed to send message',500);
}
