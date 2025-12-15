<?php
include '../config.php';

header("Content-Type: application/json");

$auction_id = $_GET['auction_id'] ?? '';

if (!$auction_id) {
    echo json_encode([
        "status" => "error",
        "message" => "auction_id required"
    ]);
    exit;
}

$stmt = $conn->prepare("
    SELECT bids.id, bids.bid_amount, bidders.name AS bidder_name, bids.bidder_id
    FROM bids
    INNER JOIN bidders ON bids.bidder_id = bidders.id
    WHERE bids.auction_id = ?
    ORDER BY bids.bid_amount DESC
");
$stmt->bind_param("i", $auction_id);
$stmt->execute();

$result = $stmt->get_result();
$bids = [];

while ($row = $result->fetch_assoc()) {
    $bids[] = $row;
}

echo json_encode([
    "status" => "success",
    "data" => $bids
]);
