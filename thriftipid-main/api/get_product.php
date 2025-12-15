<?php
require __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
	json_response(['error' => 'Method not allowed'], 405);
}

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) {
	json_response(['error' => 'Invalid id'], 422);
}

$pdo = db();

$stmt = $pdo->prepare('SELECT p.id, p.user_id, p.title, p.description, p.price_cents, p.category, p.product_condition, p.location, p.created_at, 
    u.display_name AS seller_name, u.name AS seller_full_name, u.username AS seller_username, u.email AS seller_email,
    (SELECT COUNT(*) FROM products WHERE user_id = u.id) AS seller_active_listings
FROM products p
JOIN users u ON u.id = p.user_id
WHERE p.id = ?
LIMIT 1');
$stmt->execute([$id]);
$product = $stmt->fetch();
if (!$product) {
	json_response(['error' => 'Not found'], 404);
}

// images
$imgStmt = $pdo->prepare('SELECT id, mime_type, size_bytes, is_primary FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, id ASC');
$imgStmt->execute([$id]);
$images = [];
while ($row = $imgStmt->fetch()) {
	$images[] = [
		'id' => (int)$row['id'],
		'url' => 'api/image.php?id=' . (int)$row['id'],
		'mime' => $row['mime_type'],
		'size' => (int)$row['size_bytes'],
		'is_primary' => (int)$row['is_primary'] === 1,
	];
}

$price = ((int)$product['price_cents']) / 100.0;

json_response([
	'product' => [
		'id' => (int)$product['id'],
		'title' => $product['title'],
		'description' => $product['description'],
		'price' => $price,
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

?>


