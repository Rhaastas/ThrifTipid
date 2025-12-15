<?php
// Disable output buffering to prevent corruption
if (ob_get_level()) {
    ob_end_clean();
}

require __DIR__ . '/db.php';

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) {
    http_response_code(400);
    exit('Bad request');
}

try {
    $pdo = db();
    
    $stmt = $pdo->prepare('SELECT image_blob, mime_type FROM product_images WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $img = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$img || empty($img['image_blob'])) {
        http_response_code(404);
        exit('Not found');
    }
    
    // Get the binary data
    $imageData = $img['image_blob'];
    $mimeType = $img['mime_type'] ?: 'image/jpeg';
    
    // Set proper headers before any output
    header('Content-Type: ' . $mimeType);
    header('Cache-Control: public, max-age=86400');
    header('Content-Length: ' . strlen($imageData));
    
    // Output binary data directly
    echo $imageData;
    exit;
    
} catch (Throwable $e) {
    http_response_code(500);
    error_log('Image error: ' . $e->getMessage());
    exit('Server error');
}

?>