<?php
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get authenticated user from session token
$sessionToken = $_COOKIE['session_token'] ?? '';
if ($sessionToken === '') {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

$conn = Database::getInstance()->getConnection();

// Get user ID from session
$query = 'SELECT u.id FROM user_sessions s JOIN users u ON u.id = s.user_id WHERE s.session_token = ? AND s.expires_at > NOW() LIMIT 1';
$stmt = $conn->prepare($query);
if (!$stmt) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database error']);
    exit;
}
$stmt->bind_param('s', $sessionToken);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();
if (!$row) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Invalid session']);
    exit;
}
$userId = (int)$row['id'];

// Get user profile data
$userQuery = 'SELECT id, name, username, email, display_name, role, created_at, last_login_at FROM users WHERE id = ? LIMIT 1';
$userStmt = $conn->prepare($userQuery);
if (!$userStmt) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database error']);
    exit;
}
$userStmt->bind_param('i', $userId);
$userStmt->execute();
$userResult = $userStmt->get_result();
$user = $userResult->fetch_assoc();
if (!$user) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'User not found']);
    exit;
}

// Get user's products count
$countQuery = 'SELECT COUNT(*) as count FROM products WHERE user_id = ?';
$countStmt = $conn->prepare($countQuery);
if (!$countStmt) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database error']);
    exit;
}
$countStmt->bind_param('i', $userId);
$countStmt->execute();
$countResult = $countStmt->get_result();
$countRow = $countResult->fetch_assoc();
$productsCount = (int)$countRow['count'];

// Get user's sold items count
$soldQuery = 'SELECT COUNT(*) as count FROM products WHERE user_id = ? AND status = "sold"';
$soldStmt = $conn->prepare($soldQuery);
$soldCount = 0;
if ($soldStmt) {
    $soldStmt->bind_param('i', $userId);
    $soldStmt->execute();
    $soldResult = $soldStmt->get_result();
    $soldRow = $soldResult->fetch_assoc();
    $soldCount = (int)$soldRow['count'];
}

// Get user's products
$productsQuery = 'SELECT p.id, p.title, p.description, p.price_cents, p.buyout_price_cents, p.category, p.product_condition, p.location, p.created_at, p.status,
    (SELECT pi.id FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 ORDER BY pi.id ASC LIMIT 1) as primary_image_id,
    (SELECT MAX(bid_amount) FROM bids WHERE product_id = p.id AND auction_id IS NULL) AS highest_offer
FROM products p
WHERE p.user_id = ?
ORDER BY p.created_at DESC';
$productsStmt = $conn->prepare($productsQuery);
if (!$productsStmt) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database error']);
    exit;
}
$productsStmt->bind_param('i', $userId);
$productsStmt->execute();
$productsResult = $productsStmt->get_result();

$productsList = [];
while ($product = $productsResult->fetch_assoc()) {
    $basePrice = ((int)$product['price_cents']) / 100.0;
    $buyoutPrice = isset($product['buyout_price_cents']) && $product['buyout_price_cents'] ? ((int)$product['buyout_price_cents']) / 100.0 : null;
    $highestOffer = $product['highest_offer'] ? (float)$product['highest_offer'] : null;
    
    // Current price is the max of base price and highest offer
    $currentPrice = $highestOffer ? max($basePrice, $highestOffer) : $basePrice;
    
    $productsList[] = [
        'id' => (int)$product['id'],
        'title' => $product['title'],
        'description' => $product['description'],
        'base_price' => number_format($basePrice, 2),
        'buyout_price' => $buyoutPrice ? number_format($buyoutPrice, 2) : null,
        'highest_offer' => $highestOffer ? number_format($highestOffer, 2) : null,
        'price' => number_format($currentPrice, 2),
        'category' => $product['category'],
        'condition' => $product['product_condition'],
        'location' => $product['location'],
        'created_at' => $product['created_at'],
        'status' => $product['status'] ?: 'active',
        'image_url' => $product['primary_image_id'] ? ('/api/image.php?id=' . $product['primary_image_id']) : null,
    ];
}

// Get notifications for the user (if table exists)
$notifications = [];
try {
    $noteStmt = $conn->prepare('SELECT id, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100');
    if ($noteStmt) {
        $noteStmt->bind_param('i', $userId);
        $noteStmt->execute();
        $noteRes = $noteStmt->get_result();
        while ($n = $noteRes->fetch_assoc()) {
            $notifications[] = [
                'id' => (int)$n['id'],
                'message' => $n['message'],
                'is_read' => (int)$n['is_read'] === 1,
                'created_at' => $n['created_at']
            ];
        }
    }
} catch (Throwable $e) {
    // ignore if notifications table doesn't exist
}

http_response_code(200);
header('Content-Type: application/json');
echo json_encode([
    'user' => [
        'id' => (int)$user['id'],
        'name' => $user['name'],
        'username' => $user['username'],
        'email' => $user['email'],
        'display_name' => $user['display_name'] ?: $user['name'],
        'role' => $user['role'],
        'created_at' => $user['created_at'],
        'last_login_at' => $user['last_login_at'],
    ],
    'stats' => [
        'items_listed' => $productsCount,
        'items_sold' => $soldCount,
        'rating' => 4.8, // Default, can be calculated from reviews table later
        'reviews_count' => 0, // Can be calculated from reviews table later
    ],
    'products' => $productsList,
    'notifications' => $notifications,
]);
exit;

?>

