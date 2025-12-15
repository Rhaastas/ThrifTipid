const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAdmin } = require('../middleware/auth');

// Apply admin authentication to all routes
router.use(requireAdmin);

/**
 * GET /api/categories
 * Get all categories with product counts
 */
router.get('/', async (req, res) => {
    try {
        // Get all categories with product counts
        const [categories] = await db.query(`
            SELECT 
                c.id,
                c.name,
                c.description,
                c.created_at,
                COUNT(p.id) as product_count
            FROM categories c
            LEFT JOIN products p ON p.category = c.name
            GROUP BY c.id, c.name, c.description, c.created_at
            ORDER BY c.name ASC
        `);

        res.json({
            success: true,
            data: categories
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
 * POST /api/categories
 * Add a new category
 */
router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Category name is required'
            });
        }

        // Check if category already exists
        const [existing] = await db.query(
            'SELECT id FROM categories WHERE name = ?',
            [name]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Category already exists'
            });
        }

        // Insert new category
        const [result] = await db.query(
            'INSERT INTO categories (name, description) VALUES (?, ?)',
            [name, description || null]
        );

        // Fetch the newly created category
        const [newCategory] = await db.query(
            'SELECT id, name, description, created_at FROM categories WHERE id = ?',
            [result.insertId]
        );
        
        res.json({
            success: true,
            data: { ...newCategory[0], product_count: 0 },
            message: 'Category created successfully'
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create category'
        });
    }
});

/**
 * DELETE /api/categories/:id
 * Remove a category (only if not used by any products)
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Get category details
        const [category] = await db.query(
            'SELECT name FROM categories WHERE id = ?',
            [id]
        );

        if (category.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        // Check if category is being used by products
        const [products] = await db.query(
            'SELECT COUNT(*) as count FROM products WHERE category = ?',
            [category[0].name]
        );

        if (products[0].count > 0) {
            return res.status(400).json({
                success: false,
                error: `Cannot delete category. It is being used by ${products[0].count} product(s)`
            });
        }

        // Delete the category
        await db.query('DELETE FROM categories WHERE id = ?', [id]);
        
        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete category'
        });
    }
});

module.exports = router;
