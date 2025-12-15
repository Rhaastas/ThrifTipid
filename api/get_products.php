<?php
require_once __DIR__ . '/bootstrap.php';

$conn = Database::getInstance()->getConnection();

$query = '
    SELECT p.id, p.title, p.description, p.price_cents, p.buyout_price_cents, p.category, p.product_condition, p.location, p.created_at,
            (SELECT pi.id FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 ORDER BY pi.id ASC LIMIT 1) as primary_image_id,
            (SELECT MAX(bid_amount) FROM bids WHERE product_id = p.id AND auction_id IS NULL) AS highest_offer
     FROM products p
     WHERE (p.status IS NULL OR p.status != "sold")
     ORDER BY p.created_at DESC
     LIMIT 100
';

$stmt = $conn->prepare($query);
if (!$stmt) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database error']);
    exit;
}

if (!$stmt->execute()) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Query failed']);
    exit;
}

$result = $stmt->get_result();
$rows = [];
while ($row = $result->fetch_assoc()) {
    $basePrice = ((int)$row['price_cents']) / 100;
    $buyoutPrice = isset($row['buyout_price_cents']) && $row['buyout_price_cents'] ? ((int)$row['buyout_price_cents']) / 100 : null;
    $highestOffer = $row['highest_offer'] ? (float)$row['highest_offer'] : null;
    
    // Current price is the max of base price and highest offer
    $currentPrice = $highestOffer ? max($basePrice, $highestOffer) : $basePrice;
    
    $row['base_price'] = number_format($basePrice, 2);
    $row['buyout_price'] = $buyoutPrice ? number_format($buyoutPrice, 2) : null;
    $row['highest_offer'] = $highestOffer ? number_format($highestOffer, 2) : null;
    $row['price'] = number_format($currentPrice, 2);
    
    if ($row['primary_image_id']) {
        $row['image_url'] = '/api/image.php?id=' . $row['primary_image_id'];
    } else {
        $row['image_url'] = null;
    }
    $rows[] = $row;
}

http_response_code(200);
header('Content-Type: application/json');
echo json_encode(['items' => $rows]);
exit;

?>


