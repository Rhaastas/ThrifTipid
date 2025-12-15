<?php
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../models/Bid.php';
require_once __DIR__ . '/../models/Notification.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { Response::error('Method not allowed',405); exit; }
$userId = Auth::userId(); if (!$userId) { Response::error('Unauthorized',401); exit; }

$input = json_decode(file_get_contents('php://input'), true);
$bid_id = isset($input['bid_id']) ? (int)$input['bid_id'] : 0;
$action = isset($input['action']) ? $input['action'] : 'reject'; // accept|reject

if (!$bid_id) { Response::error('Missing bid_id',400); exit; }

$bidModel = new Bid();
$bid = $bidModel->getById($bid_id);

if (!$bid || $bid['auction_id'] !== null) { Response::error('Offer not found (not a product offer)',404); exit; }

// Get product to verify ownership
$pModel = new Product();
$product = $pModel->getById($bid['product_id']);
if (!$product) { Response::error('Product not found',404); exit; }

// only product owner can respond
if ((int)$product['user_id'] !== $userId) { Response::error('Forbidden - only product owner can respond',403); exit; }

// For now, offers are accepted/rejected via messaging UI (no separate table update needed)
// Just notify the offeror of the response
$newStatus = $action === 'accept' ? 'accepted' : 'rejected';

// notify offeror
$notif = new Notification();
$notif->create($bid['bidder_id'], sprintf('Your offer of ₱%.2f on "%s" was %s', $bid['bid_amount'], $product['title'], $newStatus), json_encode(['bid_id'=>$bid_id, 'status'=>$newStatus]));

Response::success([], 'Offer ' . $newStatus);
