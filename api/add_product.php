<?php
require_once __DIR__ . '/bootstrap.php';

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

$conn = Database::getInstance()->getConnection();

// Authenticate via session_token cookie
$sessionToken = $_COOKIE['session_token'] ?? '';
if ($sessionToken === '') {
    Response::error('Not authenticated', 401);
}

$stmt = $conn->prepare('SELECT u.id FROM user_sessions s JOIN users u ON u.id = s.user_id WHERE s.session_token = ? AND s.expires_at > NOW() LIMIT 1');
if (!$stmt) {
    Response::error('Database error', 500, $conn->error);
}
$stmt->bind_param('s', $sessionToken);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();
if (!$row) {
    Response::error('Invalid session', 401);
}
$userId = (int)$row['id'];

// Product fields
$title = trim($_POST['title'] ?? '');
$description = trim($_POST['description'] ?? '');
$price = $_POST['price'] ?? null;
$buyoutPrice = $_POST['buyout_price'] ?? null;
$category = trim($_POST['category'] ?? '');
$condition = trim($_POST['condition'] ?? '');
$location = trim($_POST['location'] ?? '');

if ($title === '' || $price === null || !is_numeric($price)) {
    Response::error('Title and valid price are required', 422);
}

$priceCents = (int)round(((float)$price) * 100);
$buyoutPriceCents = $buyoutPrice !== null && is_numeric($buyoutPrice) ? (int)round(((float)$buyoutPrice) * 100) : null;

// Start transaction
$conn->begin_transaction();
try {
    $ins = $conn->prepare('INSERT INTO products (user_id, title, description, price_cents, buyout_price_cents, category, product_condition, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    if (!$ins) throw new Exception('Prepare failed: ' . $conn->error);
    $ins->bind_param('issiisss', $userId, $title, $description, $priceCents, $buyoutPriceCents, $category, $condition, $location);
    if (!$ins->execute()) throw new Exception('Execute failed: ' . $ins->error);
    $productId = $conn->insert_id;

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

            $insImg = $conn->prepare('INSERT INTO product_images (product_id, image_blob, mime_type, size_bytes, is_primary) VALUES (?, ?, ?, ?, ?)');
            if (!$insImg) throw new Exception('Prepare failed: ' . $conn->error);
            // bind_param: product_id (i), image_blob (s), mime_type (s), size_bytes (i), is_primary (i)
            $insImg->bind_param('issii', $productId, $data, $mime, $size, $isPrimary);
            if (!$insImg->execute()) throw new Exception('Execute failed: ' . $insImg->error);
            $isPrimary = 0;
        }
    }

    // Create auction for the product
    require_once __DIR__ . '/models/Auction.php';
    $auctionModel = new Auction();
    $startPrice = ((int)$priceCents) / 100.0;
    $auctionId = $auctionModel->createForProduct($userId, $productId, $title, $description, $startPrice, null, null);
    if (!$auctionId) {
        throw new Exception('Failed to create auction: ' . $conn->error);
    }
    
    $upd = $conn->prepare('UPDATE products SET auction_id = ? WHERE id = ?');
    if (!$upd) throw new Exception('Prepare failed: ' . $conn->error);
    $upd->bind_param('ii', $auctionId, $productId);
    if (!$upd->execute()) throw new Exception('Execute failed: ' . $upd->error);

    $conn->commit();
    http_response_code(200);
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'product_id' => $productId, 'auction_id' => $auctionId]);
    exit;
} catch (Throwable $e) {
    $conn->rollback();
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Failed to save product: ' . $e->getMessage()]);
    exit;
}

?>


