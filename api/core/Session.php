<?php
/**
 * Session Helper - User session management
 */

class Session {
    public static function start() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }
    
    public static function set($key, $value) {
        self::start();
        $_SESSION[$key] = $value;
    }
    
    public static function get($key, $default = null) {
        self::start();
        return $_SESSION[$key] ?? $default;
    }
    
    public static function has($key) {
        self::start();
        return isset($_SESSION[$key]);
    }
    
    public static function remove($key) {
        self::start();
        unset($_SESSION[$key]);
    }
    
    public static function destroy() {
        self::start();
        session_destroy();
        $_SESSION = [];
    }
    
    public static function getUser() {
        return self::get('user', null);
    }
    
    public static function setUser($user) {
        self::set('user', $user);
    }
    
    public static function isLoggedIn() {
        return self::has('user') && self::get('user') !== null;
    }
    
    public static function logout() {
        self::destroy();
    }
}
?>
