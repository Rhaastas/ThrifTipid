<?php
require __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method not allowed'], 405);
}

$pdo = db();

// Simple auth: resolve user by session_token cookie
// This user_id will be stored in the products table to identify the seller
$sessionToken = $_COOKIE['session_token'] ?? '';
if ($sessionToken === '') {
    json_response(['error' => 'Not authenticated'], 401);
}

$stmt = $pdo->prepare('SELECT u.id FROM user_sessions s JOIN users u ON u.id = s.user_id WHERE s.session_token = ? AND s.expires_at > NOW() LIMIT 1');
$stmt->execute([$sessionToken]);
$row = $stmt->fetch();
if (!$row) {
    json_response(['error' => 'Invalid session'], 401);
}
$userId = (int)$row['id']; // This is the seller/user_id that will be stored with the product

// Product fields
$title = trim($_POST['title'] ?? '');
$description = trim($_POST['description'] ?? '');
$price = $_POST['price'] ?? null;
$category = trim($_POST['category'] ?? '');
$condition = trim($_POST['condition'] ?? '');
$location = trim($_POST['location'] ?? '');

if ($title === '' || $price === null || !is_numeric($price)) {
    json_response(['error' => 'Title and valid price are required'], 422);
}

$pdo->beginTransaction();
try {
    // Insert product with user_id (seller) - the user_id links the product to the seller who listed it
    $insProd = $pdo->prepare('INSERT INTO products (user_id, title, description, price_cents, category, product_condition, location) VALUES (?, ?, ?, ?, ?, ?, ?)');
    $priceCents = (int)round(((float)$price) * 100);
    $insProd->execute([$userId, $title, $description, $priceCents, $category, $condition, $location]);
    $productId = (int)$pdo->lastInsertId();

    $isPrimary = 1;
    if (isset($_FILES['images']) && is_array($_FILES['images']['tmp_name'])) {
        $count = count($_FILES['images']['tmp_name']);
        for ($i = 0; $i < $count; $i++) {
            if (!is_uploaded_file($_FILES['images']['tmp_name'][$i])) continue;
            $mime = mime_content_type($_FILES['images']['tmp_name'][$i]);
            $allowed = ['image/jpeg','image/png','image/webp'];
            if (!in_array($mime, $allowed, true)) continue;
            
            $data = file_get_contents($_FILES['images']['tmp_name'][$i]);
            $size = strlen($data);
            
            // For MySQL BLOB, we can use PDO::PARAM_STR or PDO::PARAM_LOB
            // Using direct execute with array works better for binary data
            $insImg = $pdo->prepare('INSERT INTO product_images (product_id, image_blob, mime_type, size_bytes, is_primary) VALUES (?, ?, ?, ?, ?)');
            $insImg->execute([$productId, $data, $mime, $size, $isPrimary]);
            $isPrimary = 0; // only first image primary
        }
    }

    $pdo->commit();
    json_response(['success' => true, 'product_id' => $productId]);
} catch (Throwable $e) {
    $pdo->rollBack();
    json_response(['error' => 'Failed to save product'], 500);
}

?>


