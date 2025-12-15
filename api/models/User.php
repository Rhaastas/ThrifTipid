<?php
/**
 * User Model - User database operations
 */

class User {
    private $conn;
    
    public function __construct() {
        $this->conn = db();
    }
    
    /**
     * Find user by ID
     */
    public function findById($id) {
        $stmt = $this->conn->prepare('SELECT id, name, username, email, display_name, role FROM users WHERE id = ? LIMIT 1');
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        $stmt->close();
        return $user;
    }
    
    /**
     * Find user by email
     */
    public function findByEmail($email) {
        $stmt = $this->conn->prepare('SELECT id, name, username, email, password_hash, display_name, role FROM users WHERE email = ? LIMIT 1');
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        $stmt->close();
        return $user;
    }
    
    /**
     * Find user by username
     */
    public function findByUsername($username) {
        $stmt = $this->conn->prepare('SELECT id, name, username, email, password_hash, display_name, role FROM users WHERE username = ? LIMIT 1');
        $stmt->bind_param('s', $username);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        $stmt->close();
        return $user;
    }
    
    /**
     * Find user by email or username
     */
    public function findByEmailOrUsername($login) {
        $stmt = $this->conn->prepare('SELECT id, name, username, email, password_hash, display_name, role FROM users WHERE email = ? OR username = ? LIMIT 1');
        $stmt->bind_param('ss', $login, $login);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        $stmt->close();
        return $user;
    }
    
    /**
     * Create new user
     */
    public function create($name, $username, $email, $passwordHash, $displayName = null) {
        $stmt = $this->conn->prepare('
            INSERT INTO users (name, username, email, password_hash, display_name, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        ');
        
        if (!$stmt) {
            return false;
        }
        
        $stmt->bind_param('sssss', $name, $username, $email, $passwordHash, $displayName);
        $success = $stmt->execute();
        $userId = $this->conn->insert_id;
        $stmt->close();
        
        return $success ? $userId : false;
    }
    
    /**
     * Update last login
     */
    public function updateLastLogin($userId) {
        $stmt = $this->conn->prepare('UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = ?');
        $stmt->bind_param('i', $userId);
        $success = $stmt->execute();
        $stmt->close();
        return $success;
    }
    
    /**
     * Check if email exists
     */
    public function emailExists($email) {
        $stmt = $this->conn->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $result = $stmt->get_result();
        $exists = $result->num_rows > 0;
        $stmt->close();
        return $exists;
    }
    
    /**
     * Check if username exists
     */
    public function usernameExists($username) {
        $stmt = $this->conn->prepare('SELECT id FROM users WHERE username = ? LIMIT 1');
        $stmt->bind_param('s', $username);
        $stmt->execute();
        $result = $stmt->get_result();
        $exists = $result->num_rows > 0;
        $stmt->close();
        return $exists;
    }
}
?>
