const db = require('../config/database');

/**
 * Middleware to verify admin authentication
 * Checks for session_token cookie and validates user is admin
 */
async function requireAdmin(req, res, next) {
    try {
        const sessionToken = req.cookies.session_token;
        
        if (!sessionToken) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized - No session token'
            });
        }

        // Query to get user from session token
        const [sessions] = await db.query(`
            SELECT us.user_id, u.role, u.username, u.name, u.email
            FROM user_sessions us
            JOIN users u ON u.id = us.user_id
            WHERE us.session_token = ? 
            AND us.expires_at > NOW()
            LIMIT 1
        `, [sessionToken]);

        if (sessions.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized - Invalid or expired session'
            });
        }

        const user = sessions[0];

        // Check if user is admin
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Forbidden - Admin access required'
            });
        }

        // Attach user info to request
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    }
}

module.exports = { requireAdmin };
