<?php
/**
 * Auth Helper - User authentication utilities
 */

class Auth {
    /**
     * Hash a password
     */
    public static function hashPassword($password) {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
    }
    
    /**
     * Verify a password against a hash
     */
    public static function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }
    
    /**
     * Validate email format
     */
    public static function isValidEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
    
    /**
     * Validate username
     */
    public static function isValidUsername($username) {
        return strlen($username) >= 3 && strlen($username) <= 32 && 
               preg_match('/^[a-zA-Z0-9_-]+$/', $username);
    }
    
    /**
     * Check if user is logged in
     */
    public static function isLoggedIn() {
        if (Session::isLoggedIn()) return true;
        // Fallback: check session_token cookie in DB
        $token = $_COOKIE['session_token'] ?? '';
        if ($token === '') return false;
        $conn = Database::getInstance()->getConnection();
        $stmt = $conn->prepare('SELECT u.* FROM user_sessions s JOIN users u ON u.id = s.user_id WHERE s.session_token = ? AND s.expires_at > NOW() LIMIT 1');
        if (!$stmt) return false;
        $stmt->bind_param('s', $token);
        $stmt->execute();
        $res = $stmt->get_result();
        $user = $res->fetch_assoc();
        if ($user) {
            Session::setUser($user);
            return true;
        }
        return false;
    }
    
    /**
     * Require authentication
     */
    public static function requireLogin() {
        if (!self::isLoggedIn()) {
            Response::unauthorized('You must be logged in to access this resource');
        }
    }
    
    /**
     * Get current user
     */
    public static function user() {
        if (Session::isLoggedIn()) return Session::getUser();
        // Try lazy-loading from cookie
        $token = $_COOKIE['session_token'] ?? '';
        if ($token === '') return null;
        $conn = Database::getInstance()->getConnection();
        $stmt = $conn->prepare('SELECT u.* FROM user_sessions s JOIN users u ON u.id = s.user_id WHERE s.session_token = ? AND s.expires_at > NOW() LIMIT 1');
        if (!$stmt) return null;
        $stmt->bind_param('s', $token);
        $stmt->execute();
        $res = $stmt->get_result();
        $user = $res->fetch_assoc();
        if ($user) {
            Session::setUser($user);
        }
        return $user;
    }
    
    /**
     * Get current user ID
     */
    public static function userId() {
        $user = self::user();
        return $user ? $user['id'] : null;
    }
}
?>
