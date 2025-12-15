<?php
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../models/Message.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
    exit;
}

$userId = Auth::userId();
if (!$userId) {
    Response::error('Unauthorized', 401);
    exit;
}

try {
    $conn = Database::getInstance()->getConnection();
    
    // Get all unique conversations for this user
    $query = "
        SELECT 
            m.conversation_id,
            CASE 
                WHEN m.sender_id = ? THEN m.recipient_id
                ELSE m.sender_id
            END as other_user_id,
            u.username as other_user_name,
            (SELECT body FROM messages 
             WHERE conversation_id = m.conversation_id 
             ORDER BY created_at DESC LIMIT 1) as last_message,
            (SELECT created_at FROM messages 
             WHERE conversation_id = m.conversation_id 
             ORDER BY created_at DESC LIMIT 1) as last_message_time,
            (SELECT COUNT(*) FROM messages 
             WHERE conversation_id = m.conversation_id 
             AND recipient_id = ? 
             AND is_read = 0) as unread_count
        FROM messages m
        LEFT JOIN users u ON (
            CASE 
                WHEN m.sender_id = ? THEN m.recipient_id
                ELSE m.sender_id
            END = u.id
        )
        WHERE m.sender_id = ? OR m.recipient_id = ?
        GROUP BY m.conversation_id, other_user_id, u.username
        ORDER BY last_message_time DESC
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param('iiiii', $userId, $userId, $userId, $userId, $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $conversations = [];
    while ($row = $result->fetch_assoc()) {
        $conversations[] = [
            'conversation_id' => $row['conversation_id'],
            'other_user_id' => (int)$row['other_user_id'],
            'other_user_name' => $row['other_user_name'],
            'last_message' => $row['last_message'],
            'last_message_time' => $row['last_message_time'],
            'unread_count' => (int)$row['unread_count']
        ];
    }
    
    Response::success([
        'conversations' => $conversations,
        'count' => count($conversations)
    ]);
    
} catch (Exception $e) {
    error_log("Error fetching conversations: " . $e->getMessage());
    Response::error('An error occurred while fetching conversations', 500);
}
