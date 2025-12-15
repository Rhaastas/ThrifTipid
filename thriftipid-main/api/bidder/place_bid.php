<?php
include '../config.php';

$bidder_id = $_POST['bidder_id'];
$auction_id = $_POST['auction_id'];
$amount = $_POST['amount'];

$stmt = $conn->prepare("INSERT INTO bids (bidder_id, auction_id, bid_amount) VALUES (?, ?, ?)");
$stmt->bind_param("iid", $bidder_id, $auction_id, $amount);

if ($stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "Bid placed successfully"]);
} else {
    echo json_encode(["status" => "error"]);
}
