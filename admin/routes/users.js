const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAdmin } = require('../middleware/auth');

// Apply admin authentication to all routes
router.use(requireAdmin);

/**
 * GET /api/users
 * Get all users with pagination and filters
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const role = req.query.role || '';

        let query = `
            SELECT id, name, username, email, role, display_name,
                   last_login_at, created_at
            FROM users
            WHERE 1=1
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
        let params = [];

        if (role && role !== 'all') {
            query += ' AND role = ?';
            countQuery += ' AND role = ?';
            params.push(role);
        }

        if (search) {
            query += ' AND (name LIKE ? OR username LIKE ? OR email LIKE ?)';
            countQuery += ' AND (name LIKE ? OR username LIKE ? OR email LIKE ?)';
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        const queryParams = [...params, limit, offset];

        const [users] = await db.query(query, queryParams);
        const [totalResult] = await db.query(countQuery, params);

        // Get product counts for each user
        const userIds = users.map(u => u.id);
        let productCounts = {};
        
        if (userIds.length > 0) {
            const [counts] = await db.query(`
                SELECT user_id, COUNT(*) as count
                FROM products
                WHERE user_id IN (${userIds.join(',')})
                GROUP BY user_id
            `);
            
            counts.forEach(c => {
                productCounts[c.user_id] = c.count;
            });
        }

        const usersWithCounts = users.map(user => ({
            ...user,
            items_count: productCounts[user.id] || 0
        }));

        res.json({
            success: true,
            users: usersWithCounts,
            totalPages: Math.ceil(totalResult[0].total / limit),
            currentPage: page,
            total: totalResult[0].total
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users'
        });
    }
});

/**
 * GET /api/users/:id
 * Get specific user details
 */
router.get('/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        const [users] = await db.query(`
            SELECT id, name, username, email, role, display_name,
                   last_login_at, created_at, updated_at
            FROM users
            WHERE id = ?
        `, [userId]);

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Get user's products
        const [products] = await db.query(`
            SELECT id, title, price, status, created_at
            FROM products
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 10
        `, [userId]);

        res.json({
            success: true,
            data: {
                user: users[0],
                recentProducts: products
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user details'
        });
    }
});

/**
 * POST /api/users
 * Create a new user
 */
router.post('/', async (req, res) => {
    try {
        const { name, username, email, password, role } = req.body;

        // Validate required fields
        if (!name || !username || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Name, username, email, and password are required'
            });
        }

        // Validate role
        const userRole = role && ['user', 'admin'].includes(role) ? role : 'user';

        // Check if username or email already exists
        const [existing] = await db.query(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Username or email already exists'
            });
        }

        // Hash password using bcrypt (assuming bcrypt is available)
        const bcrypt = require('bcrypt');
        const password_hash = await bcrypt.hash(password, 10);

        // Insert new user
        const [result] = await db.query(
            'INSERT INTO users (name, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
            [name, username, email, password_hash, userRole]
        );

        res.json({
            success: true,
            message: 'User created successfully',
            userId: result.insertId
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create user'
        });
    }
});

/**
 * PUT /api/users/:id
 * Update user information
 */
router.put('/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { name, username, email, role, password } = req.body;

        // Build update query dynamically
        let updates = [];
        let params = [];

        if (name) {
            updates.push('name = ?');
            params.push(name);
        }
        if (username) {
            updates.push('username = ?');
            params.push(username);
        }
        if (email) {
            updates.push('email = ?');
            params.push(email);
        }
        if (role && ['user', 'admin'].includes(role)) {
            updates.push('role = ?');
            params.push(role);
        }
        if (password) {
            const bcrypt = require('bcrypt');
            const password_hash = await bcrypt.hash(password, 10);
            updates.push('password_hash = ?');
            params.push(password_hash);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No fields to update'
            });
        }

        params.push(userId);
        await db.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        res.json({
            success: true,
            message: 'User updated successfully'
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            error: error.code === 'ER_DUP_ENTRY' ? 'Username or email already exists' : 'Failed to update user'
        });
    }
});

/**
 * DELETE /api/users/:id
 * Delete user (soft delete or hard delete)
 */
router.delete('/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        // Prevent admin from deleting themselves
        if (userId === req.user.user_id) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete your own account'
            });
        }

        await db.query('DELETE FROM users WHERE id = ?', [userId]);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete user'
        });
    }
});

module.exports = router;
