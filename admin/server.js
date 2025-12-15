const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: ['http://localhost', 'http://localhost:3001'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from admin folder
app.use(express.static(path.join(__dirname)));

// Import routes
const statsRoutes = require('./routes/stats');
const usersRoutes = require('./routes/users');
const productsRoutes = require('./routes/products');
const reportsRoutes = require('./routes/reports');
const categoriesRoutes = require('./routes/categories');

// API routes
app.use('/api/stats', statsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/categories', categoriesRoutes);

// Serve admin dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
ThrifTipid Admin Server

Server running on: http://localhost:${PORT}
Environment: ${process.env.NODE_ENV}

Admin Dashboard: http://localhost:${PORT}
    `);
});

module.exports = app;
