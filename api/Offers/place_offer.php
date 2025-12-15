<?php
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../models/Bid.php';
require_once __DIR__ . '/../models/Product.php';
require_once __DIR__ . '/../models/Notification.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { Response::error('Method not allowed',405); exit; }
$userId = Auth::userId(); if (!$userId) { Response::error('Unauthorized',401); exit; }

$input = json_decode(file_get_contents('php://input'), true);
$product_id = isset($input['product_id']) ? (int)$input['product_id'] : 0;
$conversation_id = isset($input['conversation_id']) ? trim($input['conversation_id']) : '';
$amount = isset($input['amount']) ? (float)$input['amount'] : null;

if (!$product_id || !$amount) { Response::error('Missing product_id or amount',400); exit; }

// Verify product exists
$pModel = new Product();
$product = $pModel->getById($product_id);
if (!$product) { Response::error('Product not found',404); exit; }

// Check if product is already sold
if (isset($product['status']) && $product['status'] === 'sold') {
    Response::error('This item has already been sold', 400);
    exit;
}

$target_user = (int)$product['user_id'];

// If no conversation_id provided, generate a deterministic one for this buyer+product+seller
if (!$conversation_id) {
	$conversation_id = 'product_' . $product_id . '_buyer_' . $userId . '_seller_' . $target_user;
}

// Don't allow owner to make offer on own product
if ($target_user === $userId) { Response::error('Cannot make offer on your own product', 403); exit; }

$bidModel = new Bid();

// Enforce minimum offer: at least current price or highest existing offer
$conn = Database::getInstance()->getConnection();
$highestStmt = $conn->prepare('SELECT MAX(bid_amount) AS max_bid FROM bids WHERE product_id = ? AND auction_id IS NULL');
$highestStmt->bind_param('i', $product_id);
$highestStmt->execute();
$highestRow = $highestStmt->get_result()->fetch_assoc();
$highestBid = $highestRow && $highestRow['max_bid'] !== null ? (float)$highestRow['max_bid'] : 0.0;
$basePrice = ((int)$product['price_cents']) / 100.0;
$minRequired = max($basePrice, $highestBid);
if ($amount < $minRequired) {
	Response::error('Offer must be at least the current price (₱' . number_format($minRequired, 2) . ')', 400);
}

try {
	$newId = $bidModel->createOffer($product_id, $conversation_id, $userId, $target_user, $amount);

	// Inform product owner
	$notif = new Notification();
	$notif->create(
		$target_user,
		sprintf('New offer of ₱%.2f on "%s"', $amount, $product['title']),
		['bid_id'=>$newId, 'product_id'=>$product_id, 'conversation_id'=>$conversation_id]
	);

	Response::success(['bid_id'=>$newId], 'Offer placed', 201);
} catch (Throwable $e) {
	// Bubble up a clear error for debugging
	Response::error('Failed to place offer: ' . $e->getMessage(), 500);
}
