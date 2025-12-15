<?php
/**
 * GET /api/auctioneer/view_offers.php
 * Query params: product_id
 */

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../models/Bid.php';
require_once __DIR__ . '/../models/Product.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
    exit;
}

$currentUserId = Auth::userId();
if (!$currentUserId) {
    Response::error('Not authenticated', 401);
    exit;
}

$productId = (int)($_GET['product_id'] ?? 0);
if ($productId <= 0) {
    Response::error('Product ID required', 422);
    exit;
}

// Verify product exists
$productModel = new Product();
$product = $productModel->getById($productId);
if (!$product) {
    Response::error('Product not found', 404);
    exit;
}

// Ensure current user is owner of the product
$ownerId = (int)$product['user_id'];
if ($ownerId !== $currentUserId) {
    Response::error('Forbidden - you do not own this product', 403);
    exit;
}

$bidModel = new Bid();
$offers = $bidModel->getOffersByProduct($productId);

Response::success(['offers' => $offers], 'Offers retrieved', 200);
?>