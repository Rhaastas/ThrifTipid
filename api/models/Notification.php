<?php
/**
 * Notification Model - User notification operations
 */

class Notification {
    private $conn;

    public function __construct() {
        $this->conn = Database::getInstance()->getConnection();
    }

    public function create($user_id, $message, $meta = null) {
        $stmt = $this->conn->prepare("INSERT INTO notifications (user_id, message, meta) VALUES (?, ?, ?)");
        if (!$stmt) return false;
        $metaJson = $meta !== null ? json_encode($meta) : null;
        $stmt->bind_param('iss', $user_id, $message, $metaJson);
        if ($stmt->execute()) {
            return $this->conn->insert_id;
        }
        return false;
    }

    public function getForUser($user_id, $limit = 50) {
        $stmt = $this->conn->prepare("SELECT id, message, meta, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?");
        $stmt->bind_param('ii', $user_id, $limit);
        $stmt->execute();
        $res = $stmt->get_result();
        return $res->fetch_all(MYSQLI_ASSOC);
    }

    public function markRead($notification_id) {
        $stmt = $this->conn->prepare("UPDATE notifications SET is_read = 1 WHERE id = ?");
        $stmt->bind_param('i', $notification_id);
        return $stmt->execute();
    }
}
?>
