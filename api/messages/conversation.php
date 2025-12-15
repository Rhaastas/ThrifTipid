<?php
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../models/Message.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') { Response::error('Method not allowed',405); exit; }
$userId = Auth::userId(); if (!$userId) { Response::error('Unauthorized',401); exit; }

$with = isset($_GET['with']) ? (int)$_GET['with'] : 0;
if (!$with) { Response::error('Missing with param',400); exit; }

$mesModel = new Message();
$conv = $mesModel->createConversationId($userId, $with);
$messages = $mesModel->getConversation($conv, 200);

Response::success(['conversation' => $conv, 'messages' => $messages]);
