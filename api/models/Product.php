<?php
/**
 * Product Model - Product database operations
 */

class Product {
    private $conn;
    
    public function __construct() {
        $this->conn = Database::getInstance()->getConnection();
    }
    
    /**
     * Get all products with pagination
     */
    public function getAll($page = 1, $limit = 20) {
        $offset = ($page - 1) * $limit;
        
        $stmt = $this->conn->prepare('
            SELECT p.id, p.user_id, p.title, p.description, p.price_cents, p.category, 
                   p.product_condition, p.location, p.created_at, p.updated_at
            FROM products p
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        ');
        
        $stmt->bind_param('ii', $limit, $offset);
        $stmt->execute();
        $result = $stmt->get_result();
        $products = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        
        return $products;
    }
    
    /**
     * Get product by ID
     */
    public function getById($id) {
        $stmt = $this->conn->prepare('
            SELECT p.id, p.user_id, p.title, p.description, p.price_cents, p.category, 
                   p.product_condition, p.location, p.created_at, p.updated_at
            FROM products p
            WHERE p.id = ? LIMIT 1
        ');
        
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $product = $result->fetch_assoc();
        $stmt->close();
        
        return $product;
    }
    
    /**
     * Get products by user ID
     */
    public function getByUserId($userId, $page = 1, $limit = 20) {
        $offset = ($page - 1) * $limit;
        
        $stmt = $this->conn->prepare('
            SELECT p.id, p.user_id, p.title, p.description, p.price_cents, p.category, 
                   p.product_condition, p.location, p.created_at, p.updated_at
            FROM products p
            WHERE p.user_id = ?
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        ');
        
        $stmt->bind_param('iii', $userId, $limit, $offset);
        $stmt->execute();
        $result = $stmt->get_result();
        $products = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        
        return $products;
    }
    
    /**
     * Create new product
     */
    public function create($userId, $title, $description, $priceCents, $category = '', $condition = '', $location = '') {
        $stmt = $this->conn->prepare('
            INSERT INTO products (user_id, title, description, price_cents, category, product_condition, location, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ');
        
        if (!$stmt) {
            return false;
        }
        
        $stmt->bind_param('issiiss', $userId, $title, $description, $priceCents, $category, $condition, $location);
        $success = $stmt->execute();
        $productId = $this->conn->insert_id;
        $stmt->close();
        
        return $success ? $productId : false;
    }
    
    /**
     * Update product
     */
    public function update($id, $title, $description, $priceCents, $category = '', $condition = '', $location = '') {
        $stmt = $this->conn->prepare('
            UPDATE products 
            SET title = ?, description = ?, price_cents = ?, category = ?, product_condition = ?, location = ?, updated_at = NOW()
            WHERE id = ?
        ');
        
        if (!$stmt) {
            return false;
        }
        
        $stmt->bind_param('sissssi', $title, $description, $priceCents, $category, $condition, $location, $id);
        $success = $stmt->execute();
        $stmt->close();
        
        return $success;
    }
    
    /**
     * Delete product
     */
    public function delete($id) {
        $stmt = $this->conn->prepare('DELETE FROM products WHERE id = ?');
        $stmt->bind_param('i', $id);
        $success = $stmt->execute();
        $stmt->close();
        return $success;
    }
}
?>
