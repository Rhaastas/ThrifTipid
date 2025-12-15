<?php
require __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Method not allowed'], 405);
}

// Get authenticated user from session token
$sessionToken = $_COOKIE['session_token'] ?? '';
if ($sessionToken === '') {
    json_response(['error' => 'Not authenticated'], 401);
}

$pdo = db();

// Get user ID from session
$stmt = $pdo->prepare('SELECT u.id FROM user_sessions s JOIN users u ON u.id = s.user_id WHERE s.session_token = ? AND s.expires_at > NOW() LIMIT 1');
$stmt->execute([$sessionToken]);
$row = $stmt->fetch();
if (!$row) {
    json_response(['error' => 'Invalid session'], 401);
}
$userId = (int)$row['id'];

// Get user profile data
$userStmt = $pdo->prepare('SELECT id, name, username, email, display_name, created_at, last_login_at FROM users WHERE id = ? LIMIT 1');
$userStmt->execute([$userId]);
$user = $userStmt->fetch();
if (!$user) {
    json_response(['error' => 'User not found'], 404);
}

// Get user's products count
$productsCountStmt = $pdo->prepare('SELECT COUNT(*) as count FROM products WHERE user_id = ?');
$productsCountStmt->execute([$userId]);
$productsCount = $productsCountStmt->fetch()['count'];

// Get user's products
$productsStmt = $pdo->prepare('SELECT p.id, p.title, p.description, p.price_cents, p.category, p.product_condition, p.location, p.created_at,
    (SELECT pi.id FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 ORDER BY pi.id ASC LIMIT 1) as primary_image_id
FROM products p
WHERE p.user_id = ?
ORDER BY p.created_at DESC');
$productsStmt->execute([$userId]);
$products = $productsStmt->fetchAll();

$productsList = [];
foreach ($products as $product) {
    $price = ((int)$product['price_cents']) / 100.0;
    $productsList[] = [
        'id' => (int)$product['id'],
        'title' => $product['title'],
        'description' => $product['description'],
        'price' => number_format($price, 2),
        'category' => $product['category'],
        'condition' => $product['product_condition'],
        'location' => $product['location'],
        'created_at' => $product['created_at'],
        'image_url' => $product['primary_image_id'] ? ('api/image.php?id=' . $product['primary_image_id']) : null,
    ];
}

json_response([
    'user' => [
        'id' => (int)$user['id'],
        'name' => $user['name'],
        'username' => $user['username'],
        'email' => $user['email'],
        'display_name' => $user['display_name'] ?: $user['name'],
        'created_at' => $user['created_at'],
        'last_login_at' => $user['last_login_at'],
    ],
    'stats' => [
        'items_listed' => (int)$productsCount,
        'items_sold' => 0, // Can be added later when sold status is implemented
        'rating' => 4.8, // Default, can be calculated from reviews table later
        'reviews_count' => 0, // Can be calculated from reviews table later
    ],
    'products' => $productsList,
]);

?>

