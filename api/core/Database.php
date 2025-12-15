<?php
/**
 * Database Connection - MySQL using MySQLi
 * Single connection with proper error handling
 */

class Database {
    private static $instance = null;
    private $connection = null;
    
    private function __construct() {
        $host = 'localhost';
        $user = 'root';
        $pass = '';
        $database = 'thriftipid';
        
        $this->connection = new mysqli($host, $user, $pass, $database);
        
        if ($this->connection->connect_error) {
            die(json_encode([
                'success' => false,
                'error' => 'Database connection failed: ' . $this->connection->connect_error
            ]));
        }
        
        $this->connection->set_charset('utf8mb4');
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->connection;
    }
    
    public function prepare($query) {
        return $this->connection->prepare($query);
    }
    
    public function query($query) {
        return $this->connection->query($query);
    }
    
    public function escape($string) {
        return $this->connection->real_escape_string($string);
    }
    
    public function lastInsertId() {
        return $this->connection->insert_id;
    }
    
    public function close() {
        if ($this->connection) {
            $this->connection->close();
        }
    }
}

function db() {
    return Database::getInstance()->getConnection();
}
?>
