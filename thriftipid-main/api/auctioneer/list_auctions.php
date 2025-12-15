<?php
include '../config.php';

header("Content-Type: application/json");

$sql = "SELECT * FROM auctions ORDER BY id DESC";
$result = $conn->query($sql);

$auctions = [];

while ($row = $result->fetch_assoc()) {
    $auctions[] = $row;
}

echo json_encode([
    "status" => "success",
    "data" => $auctions
]);
