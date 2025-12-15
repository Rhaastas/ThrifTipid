<?php
// Disable output buffering to prevent corruption
if (ob_get_level()) {
    ob_end_clean();
}

require_once __DIR__ . '/bootstrap.php';

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) {
    http_response_code(400);
    exit('Bad request');
}

try {
    $conn = Database::getInstance()->getConnection();
    
    $stmt = $conn->prepare('SELECT image_blob, mime_type FROM product_images WHERE id = ? LIMIT 1');
    if (!$stmt) {
        http_response_code(500);
        exit('Server error');
    }
    
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $img = $result->fetch_assoc();
    
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