<?php
/**
 * Auctioneer Model - Auctioneer database operations
 */

class Auctioneer {
    private $conn;
    
    public function __construct() {
        $this->conn = Database::getInstance()->getConnection();
    }
    
    /**
     * Find auctioneer by ID
     */
    public function findById($id) {
        $stmt = $this->conn->prepare('SELECT id, name, username, email, rating, created_at FROM auctioneers WHERE id = ? LIMIT 1');
        $stmt->bind_param('i', $id);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }
    
    /**
     * Find auctioneer by username
     */
    public function findByUsername($username) {
        $stmt = $this->conn->prepare('SELECT * FROM auctioneers WHERE username = ? LIMIT 1');
        $stmt->bind_param('s', $username);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }
    
    /**
     * Find auctioneer by email
     */
    public function findByEmail($email) {
        $stmt = $this->conn->prepare('SELECT * FROM auctioneers WHERE email = ? LIMIT 1');
        $stmt->bind_param('s', $email);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }
    
    /**
     * Check if username exists
     */
    public function usernameExists($username) {
        $stmt = $this->conn->prepare('SELECT 1 FROM auctioneers WHERE username = ? LIMIT 1');
        $stmt->bind_param('s', $username);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc() !== null;
    }
    
    /**
     * Check if email exists
     */
    public function emailExists($email) {
        $stmt = $this->conn->prepare('SELECT 1 FROM auctioneers WHERE email = ? LIMIT 1');
        $stmt->bind_param('s', $email);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc() !== null;
    }
    
    /**
     * Create a new auctioneer
     */
    public function create($name, $username, $email, $passwordHash) {
        $stmt = $this->conn->prepare('INSERT INTO auctioneers (name, username, email, password_hash) VALUES (?, ?, ?, ?)');
        if (!$stmt) {
            return false;
        }
        $stmt->bind_param('ssss', $name, $username, $email, $passwordHash);
        return $stmt->execute();
    }
    
    /**
     * Get auctioneer's auctions
     */
    public function getAuctions($auctioneerId, $limit = 50, $offset = 0) {
        $stmt = $this->conn->prepare('
            SELECT id, title, description, start_price, current_price, status, start_time, end_time, created_at
            FROM auctions
            WHERE auctioneer_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        ');
        if (!$stmt) {
            return [];
        }
        $stmt->bind_param('iii', $auctioneerId, $limit, $offset);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }
    
    /**
     * Get auction count for auctioneer
     */
    public function getAuctionCount($auctioneerId) {
        $stmt = $this->conn->prepare('SELECT COUNT(*) as count FROM auctions WHERE auctioneer_id = ?');
        if (!$stmt) {
            return 0;
        }
        $stmt->bind_param('i', $auctioneerId);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        return (int)$result['count'];
    }
    
    /**
     * Get active auctions for auctioneer
     */
    public function getActiveAuctions($auctioneerId) {
        $stmt = $this->conn->prepare('
            SELECT id, title, description, start_price, current_price, status, start_time, end_time
            FROM auctions
            WHERE auctioneer_id = ? AND status = "active" AND (end_time IS NULL OR end_time > NOW())
            ORDER BY created_at DESC
        ');
        if (!$stmt) {
            return [];
        }
        $stmt->bind_param('i', $auctioneerId);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }
    
    /**
     * Get closed auctions for auctioneer
     */
    public function getClosedAuctions($auctioneerId) {
        $stmt = $this->conn->prepare('
            SELECT id, title, description, start_price, current_price, status, start_time, end_time
            FROM auctions
            WHERE auctioneer_id = ? AND status = "closed"
            ORDER BY end_time DESC
        ');
        if (!$stmt) {
            return [];
        }
        $stmt->bind_param('i', $auctioneerId);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }
    
    /**
     * Update auctioneer profile
     */
    public function update($id, $name, $email) {
        $stmt = $this->conn->prepare('UPDATE auctioneers SET name = ?, email = ?, updated_at = NOW() WHERE id = ?');
        if (!$stmt) {
            return false;
        }
        $stmt->bind_param('ssi', $name, $email, $id);
        return $stmt->execute();
    }
    
    /**
     * Update auctioneer rating
     */
    public function updateRating($id, $rating) {
        $stmt = $this->conn->prepare('UPDATE auctioneers SET rating = ?, updated_at = NOW() WHERE id = ?');
        if (!$stmt) {
            return false;
        }
        $stmt->bind_param('di', $rating, $id);
        return $stmt->execute();
    }
}
?>
