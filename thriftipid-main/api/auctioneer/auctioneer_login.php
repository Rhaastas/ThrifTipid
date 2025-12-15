<?php
include '../config.php';

header("Content-Type: application/json");

// Read POST data
$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';

$stmt = $conn->prepare("SELECT * FROM auctioneers WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if ($user && password_verify($password, $user['password'])) {
    echo json_encode([
        "status" => "success",
        "message" => "Login successful",
        "data" => $user
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Invalid username or password"
    ]);
}
