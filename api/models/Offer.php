<?php
/**
 * Offer Model - Product offer operations (used in messaging/negotiation context)
 */

class Offer {
    private $conn;

    public function __construct() {
        $this->conn = Database::getInstance()->getConnection();
    }

    /**
     * Create an offer within a conversation
     */
    public function createOfferInConversation($product_id, $conversation_id, $user_id, $amount) {
        $stmt = $this->conn->prepare("INSERT INTO offers (product_id, conversation_id, user_id, offer_amount, status) VALUES (?, ?, ?, ?, 'pending')");
        if (!$stmt) return false;
        $stmt->bind_param('isid', $product_id, $conversation_id, $user_id, $amount);
        if ($stmt->execute()) {
            return $this->conn->insert_id;
        }
        return false;
    }

    /**
     * Get offers for a product
     */
    public function getOffersByProduct($product_id) {
        $stmt = $this->conn->prepare("
            SELECT o.*, u.username as user_name, u.name as user_full_name 
            FROM offers o
            JOIN users u ON o.user_id = u.id
            WHERE o.product_id = ? 
            ORDER BY o.offer_amount DESC, o.created_at DESC
        ");
        if (!$stmt) return [];
        $stmt->bind_param('i', $product_id);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    /**
     * Get offers by user (offers they made)
     */
    public function getOffersByUser($user_id) {
        $stmt = $this->conn->prepare("
            SELECT o.*, p.title as product_title
            FROM offers o
            JOIN products p ON o.product_id = p.id
            WHERE o.user_id = ? 
            ORDER BY o.created_at DESC
        ");
        if (!$stmt) return [];
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    /**
     * Get offers in a conversation
     */
    public function getOffersByConversation($conversation_id) {
        $stmt = $this->conn->prepare("
            SELECT o.*, u.username as user_name, p.title as product_title
            FROM offers o
            JOIN users u ON o.user_id = u.id
            JOIN products p ON o.product_id = p.id
            WHERE o.conversation_id = ?
            ORDER BY o.created_at DESC
        ");
        if (!$stmt) return [];
        $stmt->bind_param('s', $conversation_id);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    /**
     * Get single offer by ID
     */
    public function getOfferById($offer_id) {
        $stmt = $this->conn->prepare("
            SELECT o.*, u.username as user_name, p.title as product_title, p.user_id as product_owner_id
            FROM offers o
            JOIN users u ON o.user_id = u.id
            JOIN products p ON o.product_id = p.id
            WHERE o.id = ?
            LIMIT 1
        ");
        if (!$stmt) return null;
        $stmt->bind_param('i', $offer_id);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }

    /**
     * Accept offer
     */
    public function acceptOffer($offer_id) {
        $stmt = $this->conn->prepare("UPDATE offers SET status = 'accepted', updated_at = NOW() WHERE id = ?");
        if (!$stmt) return false;
        $stmt->bind_param('i', $offer_id);
        return $stmt->execute();
    }

    /**
     * Reject offer
     */
    public function rejectOffer($offer_id) {
        $stmt = $this->conn->prepare("UPDATE offers SET status = 'rejected', updated_at = NOW() WHERE id = ?");
        if (!$stmt) return false;
        $stmt->bind_param('i', $offer_id);
        return $stmt->execute();
    }

    /**
     * Delete offer
     */
    public function deleteOffer($offer_id) {
        $stmt = $this->conn->prepare("DELETE FROM offers WHERE id = ?");
        if (!$stmt) return false;
        $stmt->bind_param('i', $offer_id);
        return $stmt->execute();
    }

    /**
     * Get highest offer for a product
     */
    public function getHighestOffer($product_id) {
        $stmt = $this->conn->prepare("
            SELECT * FROM offers 
            WHERE product_id = ? AND status = 'pending'
            ORDER BY offer_amount DESC 
            LIMIT 1
        ");
        if (!$stmt) return null;
        $stmt->bind_param('i', $product_id);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }
}
?>