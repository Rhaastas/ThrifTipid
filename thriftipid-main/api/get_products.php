<?php
require __DIR__ . '/db.php';

$pdo = db();

$stmt = $pdo->query(
    'SELECT p.id, p.title, p.description, p.price_cents, p.category, p.product_condition, p.location, p.created_at,
            (SELECT pi.id FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 ORDER BY pi.id ASC LIMIT 1) as primary_image_id
     FROM products p
     ORDER BY p.created_at DESC
     LIMIT 100'
);

$rows = $stmt->fetchAll();
foreach ($rows as &$r) {
    $r['price'] = number_format(((int)$r['price_cents']) / 100, 2);
    if ($r['primary_image_id']) {
        $r['image_url'] = 'api/image.php?id=' . $r['primary_image_id'];
    } else {
        $r['image_url'] = null;
    }
}

json_response(['items' => $rows]);

?>


