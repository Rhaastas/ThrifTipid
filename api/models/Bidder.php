<?php
/**
 * Bidder Model - Bidder database operations
 */

class Bidder {
    private $conn;
    
    public function __construct() {
        $this->conn = Database::getInstance()->getConnection();
    }
    
    /**
     * Find bidder by ID
     */
    public function findById($id) {
        $stmt = $this->conn->prepare('SELECT id, name, username, email, rating, created_at FROM bidders WHERE id = ? LIMIT 1');
        $stmt->bind_param('i', $id);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }
    
    /**
     * Find bidder by username
     */
    public function findByUsername($username) {
        $stmt = $this->conn->prepare('SELECT * FROM bidders WHERE username = ? LIMIT 1');
        $stmt->bind_param('s', $username);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }
    
    /**
     * Find bidder by email
     */
    public function findByEmail($email) {
        $stmt = $this->conn->prepare('SELECT * FROM bidders WHERE email = ? LIMIT 1');
        $stmt->bind_param('s', $email);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }
    
    /**
     * Check if username exists
     */
    public function usernameExists($username) {
        $stmt = $this->conn->prepare('SELECT 1 FROM bidders WHERE username = ? LIMIT 1');
        $stmt->bind_param('s', $username);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc() !== null;
    }
    
    /**
     * Check if email exists
     */
    public function emailExists($email) {
        $stmt = $this->conn->prepare('SELECT 1 FROM bidders WHERE email = ? LIMIT 1');
        $stmt->bind_param('s', $email);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc() !== null;
    }
    
    /**
     * Create a new bidder
     */
    public function create($name, $username, $email, $passwordHash) {
        $stmt = $this->conn->prepare('INSERT INTO bidders (name, username, email, password_hash) VALUES (?, ?, ?, ?)');
        if (!$stmt) {
            return false;
        }
        $stmt->bind_param('ssss', $name, $username, $email, $passwordHash);
        return $stmt->execute();
    }
    
    /**
     * Get bidder's bid history
     */
    public function getBidHistory($bidderId, $limit = 50, $offset = 0) {
        $stmt = $this->conn->prepare('
            SELECT b.id, b.bid_amount, b.created_at, a.id as auction_id, a.title as auction_title, 
                   a.status, a.end_time, b.is_winning
            FROM bids b
            JOIN auctions a ON b.auction_id = a.id
            WHERE b.bidder_id = ?
            ORDER BY b.created_at DESC
            LIMIT ? OFFSET ?
        ');
        if (!$stmt) {
            return [];
        }
        $stmt->bind_param('iii', $bidderId, $limit, $offset);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }
    
    /**
     * Get bidder's winning bids
     */
    public function getWinningBids($bidderId) {
        $stmt = $this->conn->prepare('
            SELECT b.id, b.bid_amount, b.created_at, a.id as auction_id, a.title as auction_title,
                   a.end_time, a.auctioneer_id
            FROM bids b
            JOIN auctions a ON b.auction_id = a.id
            WHERE b.bidder_id = ? AND b.is_winning = 1 AND a.status = "closed"
            ORDER BY a.end_time DESC
        ');
        if (!$stmt) {
            return [];
        }
        $stmt->bind_param('i', $bidderId);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }
    
    /**
     * Update bidder profile
     */
    public function update($id, $name, $email) {
        $stmt = $this->conn->prepare('UPDATE bidders SET name = ?, email = ?, updated_at = NOW() WHERE id = ?');
        if (!$stmt) {
            return false;
        }
        $stmt->bind_param('ssi', $name, $email, $id);
        return $stmt->execute();
    }
    
    /**
     * Update bidder rating
     */
    public function updateRating($id, $rating) {
        $stmt = $this->conn->prepare('UPDATE bidders SET rating = ?, updated_at = NOW() WHERE id = ?');
        if (!$stmt) {
            return false;
        }
        $stmt->bind_param('di', $rating, $id);
        return $stmt->execute();
    }
}
?>
