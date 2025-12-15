<?php
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

// Get authenticated user
$sessionToken = $_COOKIE['session_token'] ?? '';
if ($sessionToken === '') {
    Response::error('Not authenticated', 401);
}

$conn = Database::getInstance()->getConnection();

$stmt = $conn->prepare('SELECT u.id FROM user_sessions s JOIN users u ON u.id = s.user_id WHERE s.session_token = ? AND s.expires_at > NOW() LIMIT 1');
if (!$stmt) {
    Response::error('Database error', 500);
}
$stmt->bind_param('s', $sessionToken);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();
if (!$row) {
    Response::error('Invalid session', 401);
}
$buyerId = (int)$row['id'];

// Get product ID
$productId = isset($_POST['product_id']) ? (int)$_POST['product_id'] : 0;
if ($productId <= 0) {
    Response::error('Invalid product ID', 422);
}

// Start transaction
$conn->begin_transaction();
try {
    // Fetch product details with lock
    $productStmt = $conn->prepare('SELECT p.id, p.user_id, p.title, p.buyout_price_cents, p.price_cents FROM products p WHERE p.id = ? FOR UPDATE');
    if (!$productStmt) throw new Exception('Database error: ' . $conn->error);
    
    $productStmt->bind_param('i', $productId);
    if (!$productStmt->execute()) throw new Exception('Failed to fetch product: ' . $productStmt->error);
    
    $productResult = $productStmt->get_result();
    $product = $productResult->fetch_assoc();
    
    if (!$product) {
        throw new Exception('Product not found');
    }
    
    $sellerId = (int)$product['user_id'];
    
    // Can't buy your own product
    if ($sellerId === $buyerId) {
        throw new Exception('You cannot buy your own product');
    }
    
    // Check if buyout price is set
    if (!$product['buyout_price_cents'] || $product['buyout_price_cents'] <= 0) {
        throw new Exception('This product does not have a buyout price');
    }
    
    $buyoutAmount = ((int)$product['buyout_price_cents']) / 100.0;
    
    // Check if bid_type and status columns exist (they may not if ALTER wasn't run)
    $checkColumnsStmt = $conn->query("SHOW COLUMNS FROM bids LIKE 'bid_type'");
    $hasBidType = $checkColumnsStmt && $checkColumnsStmt->num_rows > 0;
    
    // Record the buyout as a special bid
    if ($hasBidType) {
        // New schema with bid_type and status
        // user_id = seller, bidder_id = buyer
        $bidStmt = $conn->prepare('INSERT INTO bids (product_id, user_id, bidder_id, bid_amount, bid_type, status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())');
        if (!$bidStmt) throw new Exception('Database error: ' . $conn->error);
        
        $bidType = 'buyout';
        $status = 'accepted';
        
        $bidStmt->bind_param('iiidss', $productId, $sellerId, $buyerId, $buyoutAmount, $bidType, $status);
    } else {
        // Old schema without bid_type and status
        // user_id = seller, bidder_id = buyer
        $bidStmt = $conn->prepare('INSERT INTO bids (product_id, user_id, bidder_id, bid_amount, created_at) VALUES (?, ?, ?, ?, NOW())');
        if (!$bidStmt) throw new Exception('Database error: ' . $conn->error);
        
        $bidStmt->bind_param('iiid', $productId, $sellerId, $buyerId, $buyoutAmount);
    }
    
    if (!$bidStmt->execute()) throw new Exception('Failed to record buyout: ' . $bidStmt->error);
    
    // Mark product as sold and record the buyer
    $updateStmt = $conn->prepare('UPDATE products SET status = ?, buyer_id = ?, sold_at = NOW() WHERE id = ?');
    if (!$updateStmt) throw new Exception('Database error: ' . $conn->error);
    
    $soldStatus = 'sold';
    $updateStmt->bind_param('sii', $soldStatus, $buyerId, $productId);
    if (!$updateStmt->execute()) throw new Exception('Failed to update product status: ' . $updateStmt->error);
    
    // Create notification for seller
    require_once __DIR__ . '/models/Notification.php';
    $notificationModel = new Notification();
    $notificationModel->create(
        $sellerId,
        "🎉 Your item '{$product['title']}' was purchased via buyout for ₱" . number_format($buyoutAmount, 2) . "!"
    );
    
    // Create notification for buyer
    $notificationModel->create(
        $buyerId,
        "✅ You successfully purchased '{$product['title']}' for ₱" . number_format($buyoutAmount, 2)
    );
    
    $conn->commit();
    
    Response::success([
        'message' => 'Purchase successful! The seller has been notified.',
        'product_id' => $productId,
        'amount' => $buyoutAmount
    ], 201);
    
} catch (Throwable $e) {
    $conn->rollback();
    Response::error($e->getMessage(), 400);
}
?>
