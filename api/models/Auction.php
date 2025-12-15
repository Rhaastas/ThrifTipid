<?php
/**
 * Auction Model - Auction database operations
 */

class Auction {
    private $conn;
    
    public function __construct() {
        $this->conn = Database::getInstance()->getConnection();
    }
    
    /**
     * Get auction by ID with auctioneer info
     */
    public function getById($id) {
        $stmt = $this->conn->prepare('
             SELECT a.id, a.auctioneer_id, a.user_id, a.product_id, a.title, a.description, a.start_price, a.current_price, 
                 a.reserve_price, a.status, a.start_time, a.end_time, a.created_at,
                 COALESCE(u.name, c.name) as owner_name, COALESCE(u.username, c.username) as owner_username
             FROM auctions a
             LEFT JOIN users u ON a.user_id = u.id
             LEFT JOIN auctioneers c ON a.auctioneer_id = c.id
             WHERE a.id = ? LIMIT 1
        ');
        if (!$stmt) {
            return null;
        }
        $stmt->bind_param('i', $id);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }
    
    /**
     * Get all active auctions
     */
    public function getAllActive($limit = 50, $offset = 0) {
        $stmt = $this->conn->prepare('
             SELECT a.id, a.auctioneer_id, a.user_id, a.product_id, a.title, a.description, a.start_price, a.current_price,
                 a.reserve_price, a.status, a.start_time, a.end_time, a.created_at,
                 COALESCE(u.name, c.name) as owner_name,
                 COUNT(b.id) as bid_count
             FROM auctions a
             LEFT JOIN users u ON a.user_id = u.id
             LEFT JOIN auctioneers c ON a.auctioneer_id = c.id
             LEFT JOIN bids b ON a.id = b.auction_id
            WHERE a.status = "active" AND (a.end_time IS NULL OR a.end_time > NOW())
            GROUP BY a.id
            ORDER BY a.start_time DESC
            LIMIT ? OFFSET ?
        ');
        if (!$stmt) {
            return [];
        }
        $stmt->bind_param('ii', $limit, $offset);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }
    
    /**
     * Get all auctions (any status)
     */
    public function getAll($limit = 100, $offset = 0) {
        $stmt = $this->conn->prepare('
             SELECT a.id, a.auctioneer_id, a.user_id, a.product_id, a.title, a.description, a.start_price, a.current_price,
                 a.reserve_price, a.status, a.start_time, a.end_time, a.created_at,
                 COALESCE(u.name, c.name) as owner_name,
                 COUNT(b.id) as bid_count
             FROM auctions a
             LEFT JOIN users u ON a.user_id = u.id
             LEFT JOIN auctioneers c ON a.auctioneer_id = c.id
             LEFT JOIN bids b ON a.id = b.auction_id
            GROUP BY a.id
            ORDER BY a.created_at DESC
            LIMIT ? OFFSET ?
        ');
        if (!$stmt) {
            return [];
        }
        $stmt->bind_param('ii', $limit, $offset);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }
    
    /**
     * Create a new auction
     */
    public function create($auctioneerId, $title, $description, $startPrice, $reservePrice = null, $endTime = null) {
        $stmt = $this->conn->prepare('
            INSERT INTO auctions (auctioneer_id, title, description, start_price, current_price, reserve_price, end_time, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, "active")
        ');
        if (!$stmt) {
            return false;
        }
        // Set current_price to start_price initially
        $stmt->bind_param('issddd' . ($endTime ? 's' : ''), 
            $auctioneerId, $title, $description, $startPrice, $startPrice, $reservePrice, $endTime);
        return $stmt->execute() ? $this->conn->insert_id : false;
    }
    
    /**
     * Update auction
     */
    public function update($id, $title, $description, $reservePrice = null) {
        $stmt = $this->conn->prepare('
            UPDATE auctions 
            SET title = ?, description = ?, reserve_price = ?, updated_at = NOW()
            WHERE id = ?
        ');
        if (!$stmt) {
            return false;
        }
        $stmt->bind_param('ssdi', $title, $description, $reservePrice, $id);
        return $stmt->execute();
    }

    /**
     * Create an auction linked to a product and user
     */
    public function createForProduct($userId, $productId, $title, $description, $startPrice, $reservePrice = null, $endTime = null) {
        $stmt = $this->conn->prepare('
            INSERT INTO auctions (user_id, product_id, title, description, start_price, current_price, reserve_price, end_time, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, "active")
        ');
        if (!$stmt) return false;
        // bind_param: i (userId), i (productId), s (title), s (description), d (startPrice), d (currentPrice), d (reservePrice), s (endTime)
        // All 8 parameters need types: iissddds (all passed, endTime can be null)
        $stmt->bind_param('iissddds', $userId, $productId, $title, $description, $startPrice, $startPrice, $reservePrice, $endTime);
        return $stmt->execute() ? $this->conn->insert_id : false;
    }
    
    /**
     * Close auction and set winning bid
     */
    public function close($id) {
        $stmt = $this->conn->prepare('
            UPDATE auctions 
            SET status = "closed", end_time = NOW(), updated_at = NOW()
            WHERE id = ?
        ');
        if (!$stmt) {
            return false;
        }
        $stmt->bind_param('i', $id);
        return $stmt->execute();
    }
    
    /**
     * Update auction current price
     */
    public function updateCurrentPrice($id, $newPrice) {
        $stmt = $this->conn->prepare('
            UPDATE auctions 
            SET current_price = ?, updated_at = NOW()
            WHERE id = ?
        ');
        if (!$stmt) {
            return false;
        }
        $stmt->bind_param('di', $newPrice, $id);
        return $stmt->execute();
    }
    
    /**
     * Cancel auction
     */
    public function cancel($id) {
        $stmt = $this->conn->prepare('
            UPDATE auctions 
            SET status = "cancelled", updated_at = NOW()
            WHERE id = ?
        ');
        if (!$stmt) {
            return false;
        }
        $stmt->bind_param('i', $id);
        return $stmt->execute();
    }
    
    /**
     * Search auctions by title
     */
    public function search($searchTerm, $limit = 50, $offset = 0) {
        $searchTerm = '%' . $searchTerm . '%';
        $stmt = $this->conn->prepare('
            SELECT a.id, a.auctioneer_id, a.title, a.description, a.start_price, a.current_price,
                   a.reserve_price, a.status, a.start_time, a.end_time, a.created_at,
                   c.name as auctioneer_name,
                   COUNT(b.id) as bid_count
            FROM auctions a
            LEFT JOIN auctioneers c ON a.auctioneer_id = c.id
            LEFT JOIN bids b ON a.id = b.auction_id
            WHERE a.title LIKE ? OR a.description LIKE ?
            GROUP BY a.id
            ORDER BY a.created_at DESC
            LIMIT ? OFFSET ?
        ');
        if (!$stmt) {
            return [];
        }
        $stmt->bind_param('ssii', $searchTerm, $searchTerm, $limit, $offset);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }
    
    /**
     * Get auction count
     */
    public function getCount() {
        $result = $this->conn->query('SELECT COUNT(*) as count FROM auctions');
        if (!$result) {
            return 0;
        }
        $row = $result->fetch_assoc();
        return (int)$row['count'];
    }
}
?>
