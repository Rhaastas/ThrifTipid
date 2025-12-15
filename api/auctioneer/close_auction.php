<?php
/**
 * Close Auction
 * POST /api/auctioneer/close_auction.php
 */

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../models/Auction.php';
require_once __DIR__ . '/../models/Bid.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
    exit;
}

// Check if auctioneer is logged in
if (!Session::has('auctioneer_id')) {
    Response::error('Not authenticated', 401);
    exit;
}

$auctioneerId = Session::get('auctioneer_id');
$auctionId = (int)($_POST['auction_id'] ?? 0);

if ($auctionId <= 0) {
    Response::error('Invalid auction ID', 422);
    exit;
}

$auctionModel = new Auction();
$auction = $auctionModel->getById($auctionId);

if (!$auction) {
    Response::error('Auction not found', 404);
    exit;
}

// Verify the auctioneer owns this auction
if ($auction['auctioneer_id'] !== $auctioneerId) {
    Response::error('Unauthorized', 403);
    exit;
}

if ($auction['status'] !== 'active') {
    Response::error('Auction is not active', 422);
    exit;
}

// Close the auction
if ($auctionModel->close($auctionId)) {
    $updatedAuction = $auctionModel->getById($auctionId);
    Response::success([
        'auction' => $updatedAuction
    ], 'Auction closed successfully');
} else {
    Response::error('Failed to close auction', 500);
}
?>
