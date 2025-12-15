<?php
include '../config.php';

$name = $_POST['name'];
$username = $_POST['username'];
$password = password_hash($_POST['password'], PASSWORD_DEFAULT);

$stmt = $conn->prepare("INSERT INTO auctioneers (name, username, password) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $name, $username, $password);

if ($stmt->execute()) {
    echo json_encode(["status"=>"success","message"=>"Auctioneer registered"]);
} else {
    echo json_encode(["status"=>"error"]);
}
