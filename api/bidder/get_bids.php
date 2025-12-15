<?php
/**
 * Get Bids for Auction
 * GET /api/bidder/get_bids.php?auction_id=ID
 */

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../models/Bid.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
    exit;
}

$auctionId = (int)($_GET['auction_id'] ?? 0);
$limit = (int)($_GET['limit'] ?? 100);
$offset = (int)($_GET['offset'] ?? 0);

if ($auctionId <= 0) {
    Response::error('auction_id is required', 422);
    exit;
}

// Limit pagination
if ($limit > 500) $limit = 500;
if ($offset < 0) $offset = 0;

$bidModel = new Bid();
$bids = $bidModel->getByAuctionId($auctionId, $limit, $offset);
$bidCount = $bidModel->getCountByAuction($auctionId);

Response::success([
    'bids' => $bids,
    'count' => $bidCount,
    'limit' => $limit,
    'offset' => $offset
]);
?>
