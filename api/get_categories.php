<?php
require_once 'bootstrap.php';

header('Content-Type: application/json');

try {
    // Get all categories ordered by name
    $stmt = $pdo->query("
        SELECT id, name, description
        FROM categories
        ORDER BY name ASC
    ");
    
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    Response::success([
        'categories' => $categories
    ]);
    
} catch (Exception $e) {
    error_log("Get categories error: " . $e->getMessage());
    Response::error('Failed to fetch categories', 500);
}
