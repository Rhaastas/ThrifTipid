<?php
/**
 * List Auctions
 * GET /api/auctioneer/list_auctions.php
 */

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../models/Auction.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
    exit;
}

// Check if auctioneer is logged in
if (!Session::has('auctioneer_id')) {
    Response::error('Not authenticated', 401);
    exit;
}

$auctioneerId = Session::get('auctioneer_id');
$limit = (int)($_GET['limit'] ?? 50);
$offset = (int)($_GET['offset'] ?? 0);
$status = trim($_GET['status'] ?? '');

// Limit pagination
if ($limit > 500) $limit = 500;
if ($offset < 0) $offset = 0;

$auctionModel = new Auction();

// Get auctions based on status filter
if ($status === 'active') {
    $auctions = $auctionModel->getActiveAuctions($auctioneerId);
} elseif ($status === 'closed') {
    $auctions = $auctionModel->getClosedAuctions($auctioneerId);
} else {
    $auctions = $auctionModel->getAuctions($auctioneerId, $limit, $offset);
}

Response::success([
    'auctions' => $auctions,
    'count' => count($auctions),
    'status_filter' => $status,
    'limit' => $limit,
    'offset' => $offset
]);
?>
