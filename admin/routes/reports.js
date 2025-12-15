const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAdmin } = require('../middleware/auth');

// Apply admin authentication to all routes
router.use(requireAdmin);

/**
 * GET /api/reports/transactions
 * Get transaction history (accepted bids)
 */
router.get('/transactions', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        // Get accepted bids with product and user information
        const [transactions] = await db.query(`
            SELECT 
                b.id as transaction_id,
                b.bid_amount as price,
                b.created_at as transaction_date,
                p.id as product_id,
                p.title as item_name,
                seller.id as seller_id,
                seller.name as seller_name,
                seller.username as seller_username,
                buyer.id as buyer_id,
                buyer.name as buyer_name,
                buyer.username as buyer_username
            FROM bids b
            JOIN products p ON b.product_id = p.id
            JOIN users seller ON p.user_id = seller.id
            JOIN users buyer ON b.user_id = buyer.id
            WHERE b.status = 'accepted'
            ORDER BY b.created_at DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        // Get total count
        const [countResult] = await db.query(`
            SELECT COUNT(*) as total
            FROM bids
            WHERE status = 'accepted'
        `);

        res.json({
            success: true,
            data: transactions.map(t => ({
                transaction_id: t.transaction_id,
                item: {
                    id: t.product_id,
                    name: t.item_name
                },
                seller: {
                    id: t.seller_id,
                    name: t.seller_name,
                    username: t.seller_username
                },
                buyer: {
                    id: t.buyer_id,
                    name: t.buyer_name,
                    username: t.buyer_username
                },
                price: parseFloat(t.price).toFixed(2),
                date: t.transaction_date
            })),
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(countResult[0].total / limit),
                totalItems: countResult[0].total,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch transactions'
        });
    }
});

/**
 * GET /api/reports/activity
 * Get recent activity report
 */
router.get('/activity', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;

        // Get recent user registrations
        const [newUsers] = await db.query(`
            SELECT id, username, name, email, created_at, 'user_registered' as type
            FROM users
            ORDER BY created_at DESC
            LIMIT ?
        `, [limit]);

        // Get recent product listings
        const [newProducts] = await db.query(`
            SELECT p.id, p.title, p.created_at, u.username, 'product_listed' as type
            FROM products p
            JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
            LIMIT ?
        `, [limit]);

        // Get recent sales
        const [sales] = await db.query(`
            SELECT p.id, p.title, p.price, p.updated_at as created_at, 
                   u.username, 'product_sold' as type
            FROM products p
            JOIN users u ON p.user_id = u.id
            WHERE p.status = 'sold'
            ORDER BY p.updated_at DESC
            LIMIT ?
        `, [limit]);

        // Combine and sort all activities
        const activities = [...newUsers, ...newProducts, ...sales]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, limit);

        res.json({
            success: true,
            data: activities
        });
    } catch (error) {
        console.error('Activity report error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch activity report'
        });
    }
});

/**
 * GET /api/reports/revenue
 * Get revenue report by time period
 */
router.get('/revenue', async (req, res) => {
    try {
        const period = req.query.period || 'month'; // day, week, month, year
        
        let dateFormat;
        let interval;
        
        switch(period) {
            case 'day':
                dateFormat = '%Y-%m-%d %H:00:00';
                interval = '24 HOUR';
                break;
            case 'week':
                dateFormat = '%Y-%m-%d';
                interval = '7 DAY';
                break;
            case 'year':
                dateFormat = '%Y-%m';
                interval = '12 MONTH';
                break;
            default:
                dateFormat = '%Y-%m-%d';
                interval = '30 DAY';
        }

        const [results] = await db.query(`
            SELECT 
                DATE_FORMAT(updated_at, ?) as period,
                COUNT(*) as sales_count,
                COALESCE(SUM(price), 0) as revenue
            FROM products
            WHERE status = 'sold'
            AND updated_at >= DATE_SUB(NOW(), INTERVAL ${interval})
            GROUP BY DATE_FORMAT(updated_at, ?)
            ORDER BY period ASC
        `, [dateFormat, dateFormat]);

        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('Revenue report error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch revenue report'
        });
    }
});

module.exports = router;
