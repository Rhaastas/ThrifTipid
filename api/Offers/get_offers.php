<?php
require_once __DIR__ . '/../bootstrap.php';

// Only accept GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

// Check authentication
$userId = Auth::userId();
if (!$userId) {
    Response::error('Unauthorized', 401);
}

$productId = isset($_GET['product_id']) ? (int)$_GET['product_id'] : 0;

if (!$productId) {
    Response::error('Missing product_id', 400);
}

try {
    $conn = Database::getInstance()->getConnection();
    
    // First, verify the user owns this product
    $stmt = $conn->prepare('SELECT user_id FROM products WHERE id = ?');
    $stmt->bind_param('i', $productId);
    $stmt->execute();
    $result = $stmt->get_result();
    $product = $result->fetch_assoc();
    
    if (!$product) {
        Response::error('Product not found', 404);
    }
    
    if ((int)$product['user_id'] !== $userId) {
        Response::error('Forbidden - You do not own this product', 403);
    }
    
    // Get all offers for this product, ordered by amount (highest first)
    $stmt = $conn->prepare("
        SELECT 
            b.id,
            b.bid_amount,
            b.status,
            b.created_at,
            u.id as buyer_id,
            u.name as buyer_name,
            u.username as buyer_username,
            u.email as buyer_email
        FROM bids b
        JOIN users u ON b.bidder_id = u.id
        WHERE b.product_id = ? 
        AND b.auction_id IS NULL
        AND b.bid_type = 'offer'
        ORDER BY b.bid_amount DESC, b.created_at DESC
    ");
    
    $stmt->bind_param('i', $productId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $offers = [];
    while ($row = $result->fetch_assoc()) {
        $offers[] = [
            'id' => (int)$row['id'],
            'amount' => number_format((float)$row['bid_amount'], 2, '.', ''),
            'status' => $row['status'],
            'created_at' => $row['created_at'],
            'buyer' => [
                'id' => (int)$row['buyer_id'],
                'name' => $row['buyer_name'],
                'username' => $row['buyer_username'],
                'email' => $row['buyer_email']
            ]
        ];
    }
    
    Response::success([
        'offers' => $offers,
        'total' => count($offers)
    ]);
    
} catch (Exception $e) {
    error_log("Get offers error: " . $e->getMessage());
    Response::error('Failed to fetch offers', 500);
}
