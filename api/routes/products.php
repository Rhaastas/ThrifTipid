<?php
/**
 * Product Routes - CRUD operations for products
 */

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../models/Product.php';

// Get request method
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

$productModel = new Product();

switch ($action) {
    case 'list':
        if ($method !== 'GET') {
            Response::error('Method not allowed', 405);
        }
        handleList($productModel);
        break;
        
    case 'get':
        if ($method !== 'GET') {
            Response::error('Method not allowed', 405);
        }
        handleGet($productModel);
        break;
        
    case 'create':
        if ($method !== 'POST') {
            Response::error('Method not allowed', 405);
        }
        handleCreate($productModel);
        break;
        
    case 'update':
        if ($method !== 'POST') {
            Response::error('Method not allowed', 405);
        }
        handleUpdate($productModel);
        break;
        
    case 'delete':
        if ($method !== 'POST') {
            Response::error('Method not allowed', 405);
        }
        handleDelete($productModel);
        break;
        
    case 'my-products':
        if ($method !== 'GET') {
            Response::error('Method not allowed', 405);
        }
        handleMyProducts($productModel);
        break;
        
    default:
        Response::error('Invalid action', 400);
}

/**
 * List all products
 */
function handleList($productModel) {
    $page = (int)($_GET['page'] ?? 1);
    $limit = (int)($_GET['limit'] ?? 20);
    
    $products = $productModel->getAll($page, $limit);
    
    Response::success([
        'products' => $products,
        'page' => $page,
        'limit' => $limit
    ], 'Products retrieved');
}

/**
 * Get single product
 */
function handleGet($productModel) {
    $id = (int)($_GET['id'] ?? 0);
    
    if (!$id) {
        Response::error('Product ID required', 400);
    }
    
    $product = $productModel->getById($id);
    
    if (!$product) {
        Response::notFound('Product not found');
    }
    
    Response::success($product, 'Product retrieved');
}

/**
 * Create product
 */
function handleCreate($productModel) {
    Auth::requireLogin();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        Response::error('Invalid input', 400);
    }
    
    $title = trim($input['title'] ?? '');
    $description = trim($input['description'] ?? '');
    $priceCents = (int)($input['price_cents'] ?? 0);
    $category = trim($input['category'] ?? '');
    $condition = trim($input['condition'] ?? '');
    $location = trim($input['location'] ?? '');
    
    // Validation
    if (!$title || !$description || $priceCents < 0) {
        Response::validation('Missing or invalid required fields');
    }
    
    $userId = Auth::userId();
    $productId = $productModel->create($userId, $title, $description, $priceCents, $category, $condition, $location);
    
    if (!$productId) {
        Response::error('Failed to create product', 500);
    }
    
    $product = $productModel->getById($productId);
    Response::success($product, 'Product created', 201);
}

/**
 * Update product
 */
function handleUpdate($productModel) {
    Auth::requireLogin();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        Response::error('Invalid input', 400);
    }
    
    $id = (int)($input['id'] ?? 0);
    $title = trim($input['title'] ?? '');
    $description = trim($input['description'] ?? '');
    $priceCents = (int)($input['price_cents'] ?? 0);
    $category = trim($input['category'] ?? '');
    $condition = trim($input['condition'] ?? '');
    $location = trim($input['location'] ?? '');
    
    if (!$id || !$title || !$description || $priceCents < 0) {
        Response::validation('Missing or invalid required fields');
    }
    
    $product = $productModel->getById($id);
    if (!$product) {
        Response::notFound('Product not found');
    }
    
    if ($product['user_id'] != Auth::userId()) {
        Response::error('Unauthorized', 403);
    }
    
    $success = $productModel->update($id, $title, $description, $priceCents, $category, $condition, $location);
    
    if (!$success) {
        Response::error('Failed to update product', 500);
    }
    
    $updated = $productModel->getById($id);
    Response::success($updated, 'Product updated');
}

/**
 * Delete product
 */
function handleDelete($productModel) {
    Auth::requireLogin();
    
    $input = json_decode(file_get_contents('php://input'), true);
    $id = (int)($input['id'] ?? 0);
    
    if (!$id) {
        Response::error('Product ID required', 400);
    }
    
    $product = $productModel->getById($id);
    if (!$product) {
        Response::notFound('Product not found');
    }
    
    if ($product['user_id'] != Auth::userId()) {
        Response::error('Unauthorized', 403);
    }
    
    $success = $productModel->delete($id);
    
    if (!$success) {
        Response::error('Failed to delete product', 500);
    }
    
    Response::success(null, 'Product deleted');
}

/**
 * Get user's products
 */
function handleMyProducts($productModel) {
    Auth::requireLogin();
    
    $page = (int)($_GET['page'] ?? 1);
    $limit = (int)($_GET['limit'] ?? 20);
    
    $products = $productModel->getByUserId(Auth::userId(), $page, $limit);
    
    Response::success([
        'products' => $products,
        'page' => $page,
        'limit' => $limit
    ], 'User products retrieved');
}
?>
