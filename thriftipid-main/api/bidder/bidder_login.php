<?php
include '../config.php';

$username = $_POST['username'];
$password = $_POST['password'];

$stmt = $conn->prepare("SELECT * FROM bidders WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$userdata = $stmt->get_result()->fetch_assoc();

if ($userdata && password_verify($password, $userdata['password'])) {
    echo json_encode(["status"=>"success","user"=>$userdata]);
} else {
    echo json_encode(["status"=>"error","message"=>"Invalid login"]);
}
