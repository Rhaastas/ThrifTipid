<?php
/**
 * Place Bid
 * POST /api/bidder/place_bid.php
 */

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../models/Bid.php';
require_once __DIR__ . '/../models/Auction.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
    exit;
}

// Authenticate current user (supports session or session_token cookie)
$currentUserId = Auth::userId();
if (!$currentUserId) {
    Response::error('Not authenticated', 401);
    exit;
}

$bidderId = (int)$currentUserId;
$auctionId = (int)($_POST['auction_id'] ?? 0);
$bidAmount = (float)($_POST['amount'] ?? $_POST['bid_amount'] ?? 0);

if ($auctionId <= 0) {
    Response::error('Invalid auction ID', 422);
    exit;
}

if ($bidAmount <= 0) {
    Response::error('Bid amount must be greater than 0', 422);
    exit;
}

$bidModel = new Bid();
$auctionModel = new Auction();

// Verify auction exists and is active
$auction = $auctionModel->getById($auctionId);
if (!$auction) {
    Response::error('Auction not found', 404);
    exit;
}

if ($auction['status'] !== 'active') {
    Response::error('Auction is not active', 422);
    exit;
}

// Prevent auction owner from bidding
$ownerId = $auction['user_id'] ?? null;
if (!$ownerId && isset($auction['product_id'])) {
    // try to resolve owner from product if auction doesn't have user_id
    $conn = Database::getInstance()->getConnection();
    $pstmt = $conn->prepare('SELECT user_id FROM products WHERE id = ? LIMIT 1');
    if ($pstmt) {
        $pstmt->bind_param('i', $auction['product_id']);
        $pstmt->execute();
        $prow = $pstmt->get_result()->fetch_assoc();
        if ($prow) $ownerId = (int)$prow['user_id'];
    }
}
if ($ownerId && $ownerId === $bidderId) {
    Response::error('You cannot bid on your own auction', 422);
    exit;
}

// Check if bid is higher than current price
if ($bidAmount <= $auction['current_price']) {
    Response::error('Bid must be higher than current price of ' . $auction['current_price'], 422);
    exit;
}

// Place the bid
$bidId = $bidModel->create($auctionId, $bidderId, $bidAmount);

require_once __DIR__ . '/../models/Notification.php';

if ($bidId) {
    // load created bid
    $bid = $bidModel->getById($bidId);

    // notify auction owner (ownerId was determined earlier in file)
    try {
        $notificationModel = new Notification(Database::getInstance());
        $message = sprintf("New bid of %s placed on your product (auction #%d) by user #%d", number_format($bidAmount,2), $auctionId, $bidderId);
        $notificationModel->create($ownerId, $message, ['bid_id' => $bidId, 'auction_id' => $auctionId, 'product_id' => $auction['product_id'] ?? null]);
    } catch (Exception $e) {
        // don't block the user — log if you have logger; continue
    }

    Response::success([
        'bid' => $bid
    ], 'Bid placed successfully', 201);
} else {
    Response::error('Failed to place bid', 500);
}

