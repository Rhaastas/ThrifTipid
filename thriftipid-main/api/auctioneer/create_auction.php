<?php
include '../config.php';

$title = $_POST['title'];
$description = $_POST['description'];
$start_price = $_POST['start_price'];
$auctioneer_id = $_POST['auctioneer_id'];

$stmt = $conn->prepare("INSERT INTO auctions (title, description, start_price, auctioneer_id) VALUES (?, ?, ?, ?)");
$stmt->bind_param("ssdi", $title, $description, $start_price, $auctioneer_id);

if ($stmt->execute()) {
    echo json_encode(["status"=>"success","message"=>"Auction created"]);
} else {
    echo json_encode(["status"=>"error"]);
}
