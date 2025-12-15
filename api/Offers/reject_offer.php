<?php
require_once __DIR__ . '/../bootstrap.php';

// Disable HTML error output
ini_set('display_errors', 0);
error_reporting(E_ALL);

try {
    // Verify user is authenticated
    $userId = Auth::userId();
    if (!$userId) {
        Response::unauthorized('Please log in to decline offers');
    }

    // Get offer ID from request
    $data = json_decode(file_get_contents('php://input'), true);
    $offerId = $data['offer_id'] ?? null;

    if (!$offerId) {
        Response::badRequest('Offer ID is required');
    }

    $db = Database::getInstance();
    $conn = $db->getConnection();

    // Get offer details and verify ownership
    $stmt = $conn->prepare("
        SELECT b.*, p.user_id as seller_id 
        FROM bids b
        JOIN products p ON b.product_id = p.id
        WHERE b.id = ? AND b.bid_type = 'offer'
    ");
    $stmt->bind_param('i', $offerId);
    $stmt->execute();
    $result = $stmt->get_result();
    $offer = $result->fetch_assoc();

    if (!$offer) {
        Response::notFound('Offer not found');
    }

    // Verify user owns the product
    if ($offer['seller_id'] != $userId) {
        Response::forbidden('You do not have permission to decline this offer');
    }

    // Verify offer is still pending
    if ($offer['status'] !== 'pending') {
        Response::badRequest('This offer has already been ' . $offer['status']);
    }

    // Update the offer status to 'rejected'
    $rejectOffer = $conn->prepare("
        UPDATE bids 
        SET status = 'rejected' 
        WHERE id = ?
    ");
    $rejectOffer->bind_param('i', $offerId);
    $rejectOffer->execute();

    if ($rejectOffer->affected_rows > 0) {
        Response::success([
            'message' => 'Offer declined successfully',
            'offer_id' => $offerId
        ]);
    } else {
        Response::error('Failed to decline offer');
    }

} catch (Exception $e) {
    error_log("Decline offer error: " . $e->getMessage());
    Response::error('Failed to decline offer: ' . $e->getMessage());
}
