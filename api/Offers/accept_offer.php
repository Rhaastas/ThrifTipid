<?php
require_once __DIR__ . '/../bootstrap.php';

// Disable HTML error output
ini_set('display_errors', 0);
error_reporting(E_ALL);

try {
    // Verify user is authenticated
    $userId = Auth::userId();
    if (!$userId) {
        Response::unauthorized('Please log in to accept offers');
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
        Response::forbidden('You do not have permission to accept this offer');
    }

    // Verify offer is still pending
    if ($offer['status'] !== 'pending') {
        Response::badRequest('This offer has already been ' . $offer['status']);
    }

    // Start transaction
    $conn->begin_transaction();

    try {
        // 1. Update the product status to 'sold' and set buyer_id to the bidder
        $updateProduct = $conn->prepare("
            UPDATE products 
            SET status = 'sold', buyer_id = ?, sold_at = NOW()
            WHERE id = ?
        ");
        $updateProduct->bind_param('ii', $offer['bidder_id'], $offer['product_id']);
        $updateProduct->execute();

        // 2. Mark the accepted offer as 'accepted'
        $acceptOffer = $conn->prepare("
            UPDATE bids 
            SET status = 'accepted' 
            WHERE id = ?
        ");
        $acceptOffer->bind_param('i', $offerId);
        $acceptOffer->execute();

        // 3. Reject all other pending offers for this product
        $rejectOthers = $conn->prepare("
            UPDATE bids 
            SET status = 'rejected' 
            WHERE product_id = ? 
            AND id != ? 
            AND status = 'pending'
            AND bid_type = 'offer'
        ");
        $rejectOthers->bind_param('ii', $offer['product_id'], $offerId);
        $rejectOthers->execute();

        // Commit transaction
        $conn->commit();

        Response::success([
            'message' => 'Offer accepted successfully',
            'product_id' => $offer['product_id'],
            'buyer_id' => $offer['bidder_id'],
            'offer_amount' => $offer['bid_amount']
        ]);

    } catch (Exception $e) {
        // Rollback on error
        $conn->rollback();
        throw $e;
    }

} catch (Exception $e) {
    error_log("Accept offer error: " . $e->getMessage());
    Response::error('Failed to accept offer: ' . $e->getMessage());
}
