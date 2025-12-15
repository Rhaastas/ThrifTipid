<?php
$servername = "localhost"; 
$username = "root"; 
$password = ""; 
$database = "mx_satt";  // ← make sure this matches your actual DB name

$conn = new mysqli($servername, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    die(json_encode([
        "status" => "error",
        "message" => "Database connection failed: " . $conn->connect_error
    ]));
}
?>
