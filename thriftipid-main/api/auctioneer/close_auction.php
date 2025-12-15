<?php
include '../config.php';

$auction_id = $_POST['auction_id'];

$stmt = $conn->prepare("UPDATE auctions SET status='closed' WHERE id=?");
$stmt->bind_param("i", $auction_id);

if ($stmt->execute()) {
    echo json_encode(["status"=>"success","message"=>"Auction closed"]);
} else {
    echo json_encode(["status"=>"error"]);
}
