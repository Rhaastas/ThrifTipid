<?php
require_once 'bootstrap.php';
require_once 'core/Auth.php';
require_once 'core/Response.php';

// Disable error display, only log
ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json');

// Authenticate user
$userId = Auth::userId();
if (!$userId) {
    Response::error('Unauthorized', 401);
    exit;
}

try {
    $conn = Database::getInstance()->getConnection();
    
    // Check if buyer_id column exists (backward compatibility)
    $checkColumn = $conn->query("SHOW COLUMNS FROM products LIKE 'buyer_id'");
    $hasBuyerId = $checkColumn && $checkColumn->num_rows > 0;
    
    if ($hasBuyerId) {
        // New approach: Query products table directly using buyer_id
        // Join with bids to get the actual accepted offer/bid price
        $query = "
            SELECT 
                p.id,
                p.title,
                p.description,
                p.price_cents,
                p.buyout_price_cents,
                p.category,
                p.product_condition,
                p.location,
                p.user_id as seller_id,
                p.buyer_id,
                p.created_at,
                p.sold_at,
                p.sold_at as purchased_at,
                u.username as seller_name,
                COALESCE(b.bid_amount * 100, p.buyout_price_cents, p.price_cents) as purchase_price_cents
            FROM products p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN bids b ON p.id = b.product_id 
                AND b.bidder_id = p.buyer_id 
                AND b.status = 'accepted'
            WHERE p.buyer_id = ?
            AND p.status = 'sold'
            ORDER BY p.sold_at DESC
        ";
    } else {
        // Fallback: Query through bids table for backward compatibility
        // Check if bids table has bid_type column
        $checkBidType = $conn->query("SHOW COLUMNS FROM bids LIKE 'bid_type'");
        $hasBidType = $checkBidType && $checkBidType->num_rows > 0;
        
        if (!$hasBidType) {
            // No buyer tracking available
            Response::success([
                'items' => [],
                'count' => 0,
                'message' => 'Please run database migration to add buyer_id column'
            ]);
            exit;
        }
        
        $query = "
            SELECT DISTINCT
                p.id,
                p.title,
                p.description,
                p.price_cents,
                p.buyout_price_cents,
                p.category,
                p.product_condition,
                p.location,
                p.user_id as seller_id,
                p.created_at,
                p.sold_at,
                u.username as seller_name,
                b.bid_amount as purchase_price_cents,
                b.created_at as purchased_at
            FROM products p
            INNER JOIN bids b ON p.id = b.product_id
            LEFT JOIN users u ON p.user_id = u.id
            WHERE b.user_id = ?
            AND b.bid_type = 'buyout'
            AND b.status = 'accepted'
            ORDER BY b.created_at DESC
        ";
    }
    
    $stmt = $conn->prepare($query);
    if (!$stmt) {
        Response::error('Database error: ' . $conn->error, 500);
        exit;
    }
    
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    error_log("get_purchased_items.php - Query executed, rows found: " . $result->num_rows);
    
    $purchasedItems = [];
    while ($row = $result->fetch_assoc()) {
        // Convert cents to dollars
        $purchasePrice = ((int)$row['purchase_price_cents']) / 100;
        $imageStmt = $conn->prepare('SELECT id FROM product_images WHERE product_id = ? AND is_primary = 1 LIMIT 1');
        if ($imageStmt) {
            $imageStmt->bind_param('i', $row['id']);
            $imageStmt->execute();
            $imageResult = $imageStmt->get_result();
            $imageRow = $imageResult->fetch_assoc();
            $imageUrl = $imageRow ? '/api/image.php?id=' . $imageRow['id'] : '/public/assets/images/placeholder.jpg';
            $imageStmt->close();
        } else {
            $imageUrl = '/public/assets/images/placeholder.jpg';
        }
        
        $purchasedItems[] = [
            'id' => (int)$row['id'],
            'title' => $row['title'] ?? 'Unknown',
            'description' => $row['description'] ?? '',
            'price' => number_format($purchasePrice, 2, '.', ''),
            'category' => $row['category'] ?? 'misc',
            'condition' => $row['product_condition'] ?? 'used',
            'location' => $row['location'] ?? 'Unknown',
            'seller_id' => (int)$row['seller_id'],
            'seller_name' => $row['seller_name'] ?? 'Unknown Seller',
            'image_url' => $imageUrl,
            'purchased_at' => $row['purchased_at'] ?? $row['sold_at'],
            'sold_at' => $row['sold_at'] ?? null
        ];
    }
    
    $stmt->close();
    
    Response::success([
        'items' => $purchasedItems,
        'count' => count($purchasedItems)
    ]);
    
} catch (Exception $e) {
    error_log("Error fetching purchased items: " . $e->getMessage());
    Response::error('An error occurred while fetching purchased items', 500);
}
