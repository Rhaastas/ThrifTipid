const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAdmin } = require('../middleware/auth');

// Apply admin authentication to all routes
router.use(requireAdmin);

/**
 * GET /api/stats
 * Get comprehensive statistics for dashboard
 */
router.get('/', async (req, res) => {
    try {
        // Get total products (all items including sold)
        const [productCount] = await db.query('SELECT COUNT(*) as count FROM products');
        
        // Get active users (only role='user', not admins)
        const [userCount] = await db.query(`
            SELECT COUNT(*) as count FROM users WHERE role = 'user'
        `);
        
        // Get total transactions (accepted bids)
        const [transactionCount] = await db.query(`
            SELECT COUNT(*) as count FROM bids WHERE status = 'accepted'
        `);

        // Get transactions per month for the last 12 months
        const [transactionsPerMonth] = await db.query(`
            SELECT 
                DATE_FORMAT(updated_at, '%b %Y') as month,
                DATE_FORMAT(updated_at, '%Y-%m') as month_key,
                COUNT(*) as count
            FROM bids
            WHERE status = 'accepted'
            AND updated_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(updated_at, '%Y-%m'), DATE_FORMAT(updated_at, '%b %Y')
            ORDER BY month_key ASC
        `);

        // Get category distribution (count of products per category)
        const [categoryData] = await db.query(`
            SELECT 
                category,
                COUNT(*) as count
            FROM products
            GROUP BY category
            ORDER BY count DESC
        `);

        res.json({
            success: true,
            totalProducts: productCount[0].count,
            totalUsers: userCount[0].count,
            totalTransactions: transactionCount[0].count,
            salesData: {
                labels: transactionsPerMonth.map(row => row.month),
                values: transactionsPerMonth.map(row => row.count)
            },
            categoryData: categoryData.map((cat, idx) => {
                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];
                return {
                    name: cat.category || 'Uncategorized',
                    count: cat.count,
                    color: colors[idx % colors.length]
                };
            })
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics'
        });
    }
});

/**
 * GET /api/stats/recent-activity
 * Get recent activity from user_sessions
 */
router.get('/recent-activity', async (req, res) => {
    try {
        const [sessions] = await db.query(`
            SELECT 
                us.session_token,
                us.created_at,
                u.name,
                u.username,
                u.email,
                u.role
            FROM user_sessions us
            JOIN users u ON us.user_id = u.id
            ORDER BY us.created_at DESC
            LIMIT 10
        `);

        const activities = sessions.map(session => {
            const user = session.name || session.username;
            const timeAgo = getTimeAgo(new Date(session.created_at));
            
            return {
                icon: session.role === 'admin' ? 'fas fa-user-shield' : 'fas fa-user',
                iconColor: session.role === 'admin' ? '#8b5cf6' : '#3b82f6',
                text: `${user} logged in`,
                time: timeAgo
            };
        });

        res.json({
            success: true,
            activities
        });
    } catch (error) {
        console.error('Recent activity error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch recent activity'
        });
    }
});

// Helper function to calculate time ago
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' year' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' month' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' day' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hour' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minute' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';
    
    return Math.floor(seconds) + ' second' + (Math.floor(seconds) > 1 ? 's' : '') + ' ago';
}

module.exports = router;
