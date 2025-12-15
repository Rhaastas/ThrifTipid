<?php
/**
 * Message Model - User messaging operations
 */

class Message {
    private $conn;
    
    public function __construct() {
        $this->conn = Database::getInstance()->getConnection();
    }

    public function createConversationId($userA, $userB) {
        // deterministic id for two-user chat
        $a = (int)$userA; $b = (int)$userB;
        if ($a === $b) return null;
        $min = min($a,$b); $max = max($a,$b);
        return $min . '_' . $max;
    }

    public function send($conversation_id, $sender_id, $recipient_id, $body) {
        $stmt = $this->conn->prepare("INSERT INTO messages (conversation_id, sender_id, recipient_id, body) VALUES (?, ?, ?, ?)");
        $stmt->bind_param('siis', $conversation_id, $sender_id, $recipient_id, $body);
        if ($stmt->execute()) return $this->conn->insert_id;
        return false;
    }

    public function getConversation($conversation_id, $limit = 100) {
        $stmt = $this->conn->prepare("SELECT id, conversation_id, sender_id, recipient_id, body, is_read, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?");
        $stmt->bind_param('si', $conversation_id, $limit);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }
}
?>
