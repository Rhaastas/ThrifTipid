<?php
/**
 * Bid Model - Bid database operations
 */

class Bid {
    private $conn;
    
    public function __construct() {
        $this->conn = Database::getInstance()->getConnection();
    }
    
    /**
     * Get bid by ID
     */
    public function getById($id) {
        $stmt = $this->conn->prepare('
            SELECT b.id, b.auction_id, b.bidder_id, b.bid_amount, b.is_winning, b.created_at,
                   u.name as bidder_name, u.username as bidder_username,
                   a.title as auction_title, a.end_time
            FROM bids b
            JOIN users u ON b.bidder_id = u.id
            JOIN auctions a ON b.auction_id = a.id
            WHERE b.id = ? LIMIT 1
        ');
        if (!$stmt) {
            return null;
        }
        $stmt->bind_param('i', $id);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }
    
    /**
     * Get all bids for an auction
     */
    public function getByAuctionId($auctionId, $limit = 100, $offset = 0) {
        $stmt = $this->conn->prepare('
            SELECT b.id, b.bidder_id, b.bid_amount, b.is_winning, b.created_at,
                   u.name as bidder_name, u.username as bidder_username, u.rating
            FROM bids b
            JOIN users u ON b.bidder_id = u.id
            WHERE b.auction_id = ?
            ORDER BY b.bid_amount DESC, b.created_at DESC
            LIMIT ? OFFSET ?
        ');
        if (!$stmt) {
            return [];
        }
        $stmt->bind_param('iii', $auctionId, $limit, $offset);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }
    
    /**
     * Get highest bid for an auction
     */
    public function getHighestBid($auctionId) {
        $stmt = $this->conn->prepare('
            SELECT b.id, b.bidder_id, b.bid_amount, b.created_at,
                   u.name as bidder_name, u.username as bidder_username
            FROM bids b
            JOIN users u ON b.bidder_id = u.id
            WHERE b.auction_id = ?
            ORDER BY b.bid_amount DESC
            LIMIT 1
        ');
        if (!$stmt) {
            return null;
        }
        $stmt->bind_param('i', $auctionId);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }
    
    /**
     * Get bids by bidder
     */
    public function getByBidderId($bidderId, $limit = 50, $offset = 0) {
        $stmt = $this->conn->prepare('
            SELECT b.id, b.auction_id, b.bid_amount, b.is_winning, b.created_at,
                   a.title as auction_title, a.status, a.end_time, a.current_price
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
     * Place a new bid
     */
    public function create($auctionId, $bidderId, $bidAmount) {
        // Start transaction
        $this->conn->begin_transaction();
        
        try {
            // Check auction status
            $auctionStmt = $this->conn->prepare('SELECT status, current_price FROM auctions WHERE id = ?');
            if (!$auctionStmt) {
                throw new Exception('Database error');
            }
            $auctionStmt->bind_param('i', $auctionId);
            $auctionStmt->execute();
            $auction = $auctionStmt->get_result()->fetch_assoc();
            
            if (!$auction || $auction['status'] !== 'active') {
                throw new Exception('Auction is not active');
            }
            
            // Bid must be higher than current price
            if ($bidAmount <= $auction['current_price']) {
                throw new Exception('Bid must be higher than current price');
            }
            
            // Update previous winning bids to non-winning
            $updateStmt = $this->conn->prepare('UPDATE bids SET is_winning = 0 WHERE auction_id = ?');
            if (!$updateStmt) {
                throw new Exception('Database error');
            }
            $updateStmt->bind_param('i', $auctionId);
            $updateStmt->execute();
            
            // Insert new bid as winning
            $insertStmt = $this->conn->prepare('
                INSERT INTO bids (auction_id, bidder_id, bid_amount, is_winning)
                VALUES (?, ?, ?, 1)
            ');
            if (!$insertStmt) {
                throw new Exception('Database error');
            }
            $insertStmt->bind_param('iid', $auctionId, $bidderId, $bidAmount);
            $insertStmt->execute();
            
            // Update auction current price
            $priceStmt = $this->conn->prepare('UPDATE auctions SET current_price = ? WHERE id = ?');
            if (!$priceStmt) {
                throw new Exception('Database error');
            }
            $priceStmt->bind_param('di', $bidAmount, $auctionId);
            $priceStmt->execute();
            
            // After successful bid, attempt to notify auction owner (if notifications table exists)
            try {
                $ownerStmt = $this->conn->prepare('SELECT user_id, product_id, auctioneer_id FROM auctions WHERE id = ? LIMIT 1');
                if ($ownerStmt) {
                    $ownerStmt->bind_param('i', $auctionId);
                    $ownerStmt->execute();
                    $ownerRes = $ownerStmt->get_result()->fetch_assoc();
                    $ownerId = null;
                    if ($ownerRes) {
                        if (!empty($ownerRes['user_id'])) $ownerId = (int)$ownerRes['user_id'];
                        elseif (!empty($ownerRes['product_id'])) {
                            $pstmt = $this->conn->prepare('SELECT user_id FROM products WHERE id = ? LIMIT 1');
                            if ($pstmt) {
                                $pstmt->bind_param('i', $ownerRes['product_id']);
                                $pstmt->execute();
                                $prow = $pstmt->get_result()->fetch_assoc();
                                if ($prow) $ownerId = (int)$prow['user_id'];
                            }
                        }
                    }
                    if ($ownerId && $ownerId !== $bidderId) {
                        // Insert notification if table exists
                        $noteStmt = $this->conn->prepare('INSERT INTO notifications (user_id, message, is_read, created_at) VALUES (?, ?, 0, NOW())');
                        if ($noteStmt) {
                            $msg = 'Your auction received a new bid of ' . number_format($bidAmount, 2) . ' on auction ID ' . $auctionId;
                            $noteStmt->bind_param('is', $ownerId, $msg);
                            $noteStmt->execute();
                        }
                    }
                }
            } catch (Throwable $e) {
                // ignore notification failures
            }

            $this->conn->commit();
            return $this->conn->insert_id;
        } catch (Exception $e) {
            $this->conn->rollback();
            return false;
        }
    }
    
    /**
     * Get bid count for an auction
     */
    public function getCountByAuction($auctionId) {
        $stmt = $this->conn->prepare('SELECT COUNT(*) as count FROM bids WHERE auction_id = ?');
        if (!$stmt) {
            return 0;
        }
        $stmt->bind_param('i', $auctionId);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        return (int)$result['count'];
    }
    
    /**
     * Get bidder's bid count
     */
    public function getCountByBidder($bidderId) {
        $stmt = $this->conn->prepare('SELECT COUNT(*) as count FROM bids WHERE bidder_id = ?');
        if (!$stmt) {
            return 0;
        }
        $stmt->bind_param('i', $bidderId);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        return (int)$result['count'];
    }
    
    /**
     * Check if bidder has already bid on auction
     */
    public function hasBid($auctionId, $bidderId) {
        $stmt = $this->conn->prepare('SELECT 1 FROM bids WHERE auction_id = ? AND bidder_id = ? LIMIT 1');
        if (!$stmt) {
            return false;
        }
        $stmt->bind_param('ii', $auctionId, $bidderId);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc() !== null;
    }
    
    /**
     * Create an offer on a product via messaging (creates a bid record with conversation_id)
     * This is used when a buyer makes an offer during a messaging conversation with the seller
     */
    public function createOffer($productId, $conversationId, $bidderId, $sellerId, $bidAmount) {
        // Create a direct offer on a product (non-auction). Stores seller as user_id, bidder as bidder_id.
        $this->conn->begin_transaction();
        try {
            $productStmt = $this->conn->prepare('SELECT id, user_id FROM products WHERE id = ? LIMIT 1');
            if (!$productStmt) {
                throw new Exception('Unable to prepare product lookup');
            }
            $productStmt->bind_param('i', $productId);
            $productStmt->execute();
            $productRow = $productStmt->get_result()->fetch_assoc();
            if (!$productRow) {
                throw new Exception('Product not found');
            }

            // Trust DB for seller id to avoid tampering
            $ownerId = (int)$productRow['user_id'];
            if ($sellerId && $ownerId !== (int)$sellerId) {
                throw new Exception('Seller mismatch for product');
            }
            $sellerId = $ownerId;

            $insertStmt = $this->conn->prepare('
                INSERT INTO bids (auction_id, product_id, bidder_id, user_id, bid_amount, conversation_id, is_winning)
                VALUES (NULL, ?, ?, ?, ?, ?, 0)
            ');
            if (!$insertStmt) {
                throw new Exception('Unable to prepare insert');
            }
            $insertStmt->bind_param('iiids', $productId, $bidderId, $sellerId, $bidAmount, $conversationId);
            if (!$insertStmt->execute()) {
                throw new Exception('Insert failed: ' . $insertStmt->error);
            }

            $newId = $this->conn->insert_id;
            $this->conn->commit();
            return $newId;
        } catch (Throwable $e) {
            $this->conn->rollback();
            throw $e;
        }
    }
    
    /**
     * Get offers (product-based bids) by product
     */
    public function getOffersByProduct($productId) {
        $stmt = $this->conn->prepare('
            SELECT b.id, b.product_id, b.bidder_id, b.user_id, b.bid_amount, b.conversation_id, b.created_at,
                   u.name as bidder_name, u.username as bidder_username
            FROM bids b
            JOIN users u ON b.bidder_id = u.id
            WHERE b.product_id = ? AND b.auction_id IS NULL
            ORDER BY b.created_at DESC
        ');
        if (!$stmt) {
            return [];
        }
        $stmt->bind_param('i', $productId);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }
    
    /**
     * Get offers by conversation
     */
    public function getOffersByConversation($conversationId) {
        $stmt = $this->conn->prepare('
            SELECT b.id, b.product_id, b.bidder_id, b.bid_amount, b.conversation_id, b.created_at,
                   u.name as bidder_name, u.username as bidder_username
            FROM bids b
            JOIN users u ON b.bidder_id = u.id
            WHERE b.conversation_id = ? AND b.product_id IS NOT NULL
            ORDER BY b.created_at DESC
        ');
        if (!$stmt) {
            return [];
        }
        $stmt->bind_param('s', $conversationId);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }
}
?>
