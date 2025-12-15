<?php
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
	http_response_code(405);
	header('Content-Type: application/json');
	echo json_encode(['error' => 'Method not allowed']);
	exit;
}

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) {
	http_response_code(422);
	header('Content-Type: application/json');
	echo json_encode(['error' => 'Invalid id']);
	exit;
}

$conn = Database::getInstance()->getConnection();

// Fetch product with seller info and highest offer
$query = 'SELECT p.id, p.user_id, p.title, p.description, p.price_cents, p.buyout_price_cents, p.category, p.product_condition, p.location, p.created_at,
	u.display_name AS seller_name, u.name AS seller_full_name, u.username AS seller_username, u.email AS seller_email,
	(SELECT COUNT(*) FROM products WHERE user_id = u.id) AS seller_active_listings,
	(SELECT MAX(bid_amount) FROM bids WHERE product_id = p.id AND auction_id IS NULL) AS highest_offer
FROM products p
JOIN users u ON u.id = p.user_id
WHERE p.id = ?
LIMIT 1';

$stmt = $conn->prepare($query);
if (!$stmt) {
	http_response_code(500);
	header('Content-Type: application/json');
	echo json_encode(['error' => 'Database error']);
	exit;
}

$stmt->bind_param('i', $id);
if (!$stmt->execute()) {
	http_response_code(500);
	header('Content-Type: application/json');
	echo json_encode(['error' => 'Query failed']);
	exit;
}

$result = $stmt->get_result();
$product = $result->fetch_assoc();
if (!$product) {
	http_response_code(404);
	header('Content-Type: application/json');
	echo json_encode(['error' => 'Not found']);
	exit;
}

// Fetch images
$imgQuery = 'SELECT id, mime_type, size_bytes, is_primary FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, id ASC';
$imgStmt = $conn->prepare($imgQuery);
if (!$imgStmt) {
	http_response_code(500);
	header('Content-Type: application/json');
	echo json_encode(['error' => 'Database error']);
	exit;
}

$imgStmt->bind_param('i', $id);
if (!$imgStmt->execute()) {
	http_response_code(500);
	header('Content-Type: application/json');
	echo json_encode(['error' => 'Query failed']);
	exit;
}

$imgResult = $imgStmt->get_result();
$images = [];
while ($row = $imgResult->fetch_assoc()) {
	$images[] = [
		'id' => (int)$row['id'],
		'url' => '/api/image.php?id=' . (int)$row['id'],
		'mime' => $row['mime_type'],
		'size' => (int)$row['size_bytes'],
		'is_primary' => (int)$row['is_primary'] === 1,
	];
}

$basePrice = ((int)$product['price_cents']) / 100.0;
$buyoutPrice = isset($product['buyout_price_cents']) && $product['buyout_price_cents'] ? ((int)$product['buyout_price_cents']) / 100.0 : null;
$highestOffer = isset($product['highest_offer']) ? (float)$product['highest_offer'] : 0.0;
$currentPrice = max($basePrice, $highestOffer);

http_response_code(200);
header('Content-Type: application/json');
echo json_encode([
	'product' => [
		'id' => (int)$product['id'],
		'title' => $product['title'],
		'description' => $product['description'],
		'price' => $currentPrice,
		'base_price' => $basePrice,
		'buyout_price' => $buyoutPrice,
		'highest_offer' => $highestOffer,
		'category' => $product['category'],
		'condition' => $product['product_condition'],
		'location' => $product['location'],
		'created_at' => $product['created_at'],
		'images' => $images,
		'seller' => [
			'id' => (int)$product['user_id'],
			'name' => $product['seller_name'] ?: ($product['seller_full_name'] ?: 'Seller'),
			'username' => $product['seller_username'] ?: '',
			'email' => $product['seller_email'] ?: '',
			'activeListings' => (int)($product['seller_active_listings'] ?? 0),
		],
	],
]);
exit;

?>


