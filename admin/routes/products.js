const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAdmin } = require('../middleware/auth');

// Apply admin authentication to all routes
router.use(requireAdmin);

/**
 * GET /api/products
 * Get all products with pagination and filters
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const status = req.query.status || '';
        const category = req.query.category || '';
        const search = req.query.search || '';

        let query = `
            SELECT 
                p.id, 
                p.title, 
                p.description, 
                p.price_cents, 
                p.status, 
                p.category,
                p.product_condition,
                p.location,
                p.created_at,
                p.sold_at,
                u.name as seller_name,
                u.username as seller_username,
                buyer.name as buyer_name
            FROM products p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN users buyer ON p.buyer_id = buyer.id
            WHERE 1=1
        `;
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM products p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE 1=1
        `;
        let params = [];

        if (status && status !== 'all') {
            query += ' AND p.status = ?';
            countQuery += ' AND p.status = ?';
            params.push(status);
        }

        if (category && category !== 'all') {
            query += ' AND p.category = ?';
            countQuery += ' AND p.category = ?';
            params.push(category);
        }

        if (search) {
            query += ' AND (p.title LIKE ? OR p.description LIKE ? OR u.name LIKE ? OR u.username LIKE ?)';
            countQuery += ' AND (p.title LIKE ? OR p.description LIKE ? OR u.name LIKE ? OR u.username LIKE ?)';
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam, searchParam);
        }

        query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
        const queryParams = [...params, limit, offset];
        
        const [products] = await db.query(query, queryParams);
        const [totalResult] = await db.query(countQuery, params);

        // Convert price_cents to regular price
        const formattedProducts = products.map(product => ({
            ...product,
            price: product.price_cents / 100
        }));

        res.json({
            success: true,
            products: formattedProducts,
            totalPages: Math.ceil(totalResult[0].total / limit),
            currentPage: page,
            total: totalResult[0].total
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch products'
        });
    }
});

/**
 * GET /api/products/categories/list
 * Get all categories from categories table
 */
router.get('/categories/list', async (req, res) => {
    try {
        const [categories] = await db.query(`
            SELECT name 
            FROM categories 
            ORDER BY name ASC
        `);

        res.json({
            success: true,
            categories: categories.map(c => c.name)
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch categories'
        });
    }
});

/**
 * GET /api/products/:id
 * Get specific product details
 */
router.get('/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);

        const [products] = await db.query(`
            SELECT p.*, u.username as seller_username, u.name as seller_name, u.email as seller_email
            FROM products p
            JOIN users u ON p.user_id = u.id
            WHERE p.id = ?
        `, [productId]);

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Get product images
        const [images] = await db.query(`
            SELECT id, image_url, display_order
            FROM product_images
            WHERE product_id = ?
            ORDER BY display_order
        `, [productId]);

        // Get bids if any
        const [bids] = await db.query(`
            SELECT b.id, b.bid_amount as amount, b.created_at, u.username as bidder_username
            FROM bids b
            JOIN users u ON b.bidder_id = u.id
            WHERE b.product_id = ?
            ORDER BY b.created_at DESC
        `, [productId]);

        res.json({
            success: true,
            data: {
                product: products[0],
                images,
                bids
            }
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch product details'
        });
    }
});

/**
 * PUT /api/products/:id/status
 * Update product status (approve, reject, etc.)
 */
router.put('/:id/status', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const { status } = req.body;

        const validStatuses = ['active', 'sold', 'pending', 'removed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        await db.query('UPDATE products SET status = ? WHERE id = ?', [status, productId]);

        res.json({
            success: true,
            message: 'Product status updated successfully'
        });
    } catch (error) {
        console.error('Update product status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update product status'
        });
    }
});

/**
 * DELETE /api/products/:id
 * Delete product and all related records
 */
router.delete('/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        
        // Start transaction to ensure all deletes succeed or none do
        const connection = await db.getConnection();
        await connection.beginTransaction();
        
        try {
            // Delete related records first (due to foreign key constraints)
            await connection.query('DELETE FROM bids WHERE product_id = ?', [productId]);
            await connection.query('DELETE FROM product_images WHERE product_id = ?', [productId]);
            await connection.query('DELETE FROM auctions WHERE product_id = ?', [productId]);
            
            // Finally delete the product
            await connection.query('DELETE FROM products WHERE id = ?', [productId]);
            
            // Commit transaction
            await connection.commit();
            connection.release();
            
            res.json({
                success: true,
                message: 'Product deleted successfully'
            });
        } catch (error) {
            // Rollback on error
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete product'
        });
    }
});

module.exports = router;
