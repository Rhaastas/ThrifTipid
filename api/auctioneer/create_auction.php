<?php
/**
 * Create Auction
 * POST /api/auctioneer/create_auction.php
 */

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../models/Auction.php';

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
$title = trim($_POST['title'] ?? '');
$description = trim($_POST['description'] ?? '');
$startPrice = (float)($_POST['start_price'] ?? 0);
$reservePrice = isset($_POST['reserve_price']) ? (float)$_POST['reserve_price'] : null;
$endTime = trim($_POST['end_time'] ?? '');

// Validation
$errors = [];

if ($title === '') {
    $errors[] = 'Title is required';
}

if ($description === '') {
    $errors[] = 'Description is required';
}

if ($startPrice <= 0) {
    $errors[] = 'Start price must be greater than 0';
}

if ($reservePrice !== null && $reservePrice <= 0) {
    $errors[] = 'Reserve price must be greater than 0';
}

if ($reservePrice !== null && $reservePrice < $startPrice) {
    $errors[] = 'Reserve price must be greater than or equal to start price';
}

if ($endTime !== '' && strtotime($endTime) === false) {
    $errors[] = 'Invalid end time format';
}

if (count($errors) > 0) {
    Response::validation($errors);
    exit;
}

$auctionModel = new Auction();
$auctionId = $auctionModel->create($auctioneerId, $title, $description, $startPrice, $reservePrice, $endTime);

if ($auctionId) {
    $auction = $auctionModel->getById($auctionId);
    Response::success([
        'auction' => $auction
    ], 'Auction created successfully', 201);
} else {
    Response::error('Failed to create auction', 500);
}
?>
