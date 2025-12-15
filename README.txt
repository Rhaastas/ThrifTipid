================================================================================
                           THRIFTIPID MARKETPLACE
                          Installation & Setup Guide
================================================================================

PROJECT OVERVIEW
================================================================================
ThrifTipid is a web-based marketplace application that allows users to buy, 
sell, and make offers on items. It features an admin panel for managing 
products, users, categories, and transactions.

SYSTEM REQUIREMENTS
================================================================================
- WAMP Server (or equivalent LAMP/MAMP stack)
  * Apache 2.4+
  * PHP 8.3.14 or higher
  * MySQL 9.1.0 or higher

- Node.js v14+ and npm (for admin panel)

- Modern web browser (Chrome, Firefox, Edge, Safari)

PROJECT STRUCTURE
================================================================================
thriftipid/
├── index.php                  # Root redirect to public site
├── thriftipid.sql            # Database schema and sample data
├── GUIDE.md                  # Development guide
├── README.txt                # This file
│
├── public/                   # Main public-facing website
│   ├── pages/               # HTML pages
│   │   ├── index.html       # Home page
│   │   ├── browse.html      # Browse products
│   │   ├── product.html     # Product details
│   │   ├── profile.html     # User profile
│   │   ├── sell.html        # List new item
│   │   ├── login.html       # User login
│   │   └── signup.html      # User registration
│   │
│   └── assets/              # Static assets
│       ├── css/             # Stylesheets
│       ├── js/              # JavaScript files
│       └── images/          # Image files
│
├── api/                      # PHP Backend API
│   ├── bootstrap.php        # API initialization
│   ├── core/                # Core classes (Auth, Database, Response, Session)
│   ├── models/              # Data models
│   ├── routes/              # API route handlers
│   ├── Offers/              # Offer management endpoints
│   ├── messages/            # Messaging system
│   ├── notifications/       # Notifications
│   └── profile/             # User profile endpoints
│
├── admin/                    # Admin Dashboard (Node.js)
│   ├── server.js            # Express server
│   ├── package.json         # Node dependencies
│   ├── index.html           # Admin dashboard UI
│   ├── config/              # Database configuration
│   ├── middleware/          # Authentication middleware
│   ├── routes/              # Admin API routes
│   ├── scripts/             # Admin JavaScript
│   └── styles/              # Admin CSS
│
└── migrations/              # Database migrations

INSTALLATION INSTRUCTIONS
================================================================================

STEP 1: Install WAMP Server
----------------------------
1. Download and install WAMP Server from https://www.wampserver.com/
2. Install to default location: C:\wamp64\
3. Start WAMP Server (icon should turn green in system tray)

STEP 2: Install Node.js
-----------------------
1. Download Node.js from https://nodejs.org/ (LTS version recommended)
2. Install with default settings
3. Verify installation:
   - Open Command Prompt or PowerShell
   - Run: node --version
   - Run: npm --version

STEP 3: Setup Project Files
---------------------------
1. Extract/copy the thriftipid folder to: C:\wamp64\www\
   Final path should be: C:\wamp64\www\thriftipid\

STEP 4: Setup Database
---------------------
1. Open phpMyAdmin: http://localhost/phpmyadmin
2. Create a new database named: thriftipid
   - Click "New" in left sidebar
   - Database name: thriftipid
   - Collation: utf8mb4_unicode_ci
   - Click "Create"

3. Import the database schema:
   - Click on "thriftipid" database in left sidebar
   - Click "Import" tab
   - Click "Choose File"
   - Select: C:\wamp64\www\thriftipid\thriftipid.sql
   - Click "Go" at the bottom
   - Wait for success message

STEP 5: Install Admin Panel Dependencies
----------------------------------------
1. Open Command Prompt or PowerShell
2. Navigate to admin folder:
   cd C:\wamp64\www\thriftipid\admin

3. Install Node.js dependencies:
   npm install

4. Wait for installation to complete

STEP 6: Configure Database Connection
-------------------------------------
The project should work with default WAMP settings, but verify:

PHP API (api/core/Database.php):
- Host: 127.0.0.1 or localhost
- Port: 3306
- User: root
- Password: (empty by default)
- Database: thriftipid

Admin Panel (admin/config/database.js):
- Host: 127.0.0.1
- Port: 3306
- User: root
- Password: (empty by default)
- Database: thriftipid

RUNNING THE APPLICATION
================================================================================

START SERVICES
--------------
1. Start WAMP Server
   - Click WAMP icon in system tray
   - Ensure it's green (all services running)
   - If orange/red, click and select "Start All Services"

2. Start Admin Panel Server
   - Open Command Prompt or PowerShell
   - Navigate to admin folder:
     cd C:\wamp64\www\thriftipid\admin
   
   - Start the server:
     node server.js
   
   - You should see:
     ThrifTipid Admin Server
     Server running on: http://localhost:3001
   
   - Keep this terminal window open while using the admin panel

ACCESSING THE APPLICATION
--------------------------

Main Website (Public):
  http://localhost/public/pages/index.html
  or
  http://localhost/thriftipid/public/pages/index.html
  (depends on WAMP virtual host configuration)

Admin Dashboard:
  http://localhost:3001

  Default Admin Login:
  - Check database users table for admin account
  - Or create admin user via signup and manually set role='admin' in database

IMPORTANT URLS & ENDPOINTS
================================================================================

PUBLIC WEBSITE PAGES:
---------------------
Home Page:        http://localhost/public/pages/index.html
Browse Products:  http://localhost/public/pages/browse.html
Product Details:  http://localhost/public/pages/product.html?id=1
User Profile:     http://localhost/public/pages/profile.html
Sell Item:        http://localhost/public/pages/sell.html
Login:            http://localhost/public/pages/login.html
Sign Up:          http://localhost/public/pages/signup.html

ADMIN PANEL:
-----------
Dashboard:        http://localhost:3001
Items:            http://localhost:3001 (click Items Management)
Users:            http://localhost:3001 (click Users)
Categories:       http://localhost:3001 (click Categories)
Transactions:     http://localhost:3001 (click Transaction History)

API ENDPOINTS (Backend):
-----------------------
All API endpoints are under: http://localhost/api/

Authentication:
- POST   /api/routes/auth.php?action=login
- POST   /api/routes/auth.php?action=register
- POST   /api/routes/auth.php?action=logout

Products:
- GET    /api/get_products.php
- GET    /api/get_product.php?id=1
- POST   /api/add_product.php

Offers:
- POST   /api/Offers/place_offer.php
- GET    /api/Offers/get_offers.php?product_id=1
- POST   /api/Offers/accept_offer.php
- POST   /api/Offers/reject_offer.php

User:
- GET    /api/get_profile.php
- GET    /api/get_purchased_items.php
- POST   /api/profile/upload_avatar.php

Categories:
- GET    /api/get_categories.php

Buyout:
- POST   /api/buyout.php

ADMIN API ENDPOINTS:
-------------------
Base URL: http://localhost:3001/admin/api/

- GET    /admin/api/session
- POST   /admin/api/logout
- GET    /admin/api/products
- GET    /admin/api/products/:id
- DELETE /admin/api/products/:id
- GET    /admin/api/users
- DELETE /admin/api/users/:id
- GET    /admin/api/categories
- POST   /admin/api/categories
- DELETE /admin/api/categories/:id
- GET    /admin/api/stats

DATABASE STRUCTURE
================================================================================

Main Tables:
- users              # User accounts
- products           # Listed items
- bids               # Offers and bids (bidder_id = buyer, user_id = seller)
- categories         # Product categories
- product_images     # Product photos
- user_sessions      # Authentication sessions
- notifications      # User notifications
- messages           # User messaging
- auctions           # Auction listings
- auctioneers        # Auctioneer accounts
- bidders            # Bidder accounts (legacy)

Important Fields:
products.buyer_id    # ID of user who purchased the item
products.user_id     # ID of seller (owner)
products.status      # 'active', 'sold', 'pending', 'removed'

bids.bidder_id       # ID of person making offer/bid (BUYER)
bids.user_id         # ID of product owner (SELLER)
bids.bid_type        # 'offer', 'buyout', 'auction'
bids.status          # 'pending', 'accepted', 'rejected'

DEFAULT CATEGORIES
================================================================================
The system comes with 7 default categories:
1. Electronics
2. Fashion
3. Home & Garden
4. Sports & Outdoors
5. Collectibles
6. Books & Media
7. Toys & Games

Categories are managed through the admin panel and stored in the 
categories table.

TROUBLESHOOTING
================================================================================

Issue: WAMP icon is orange/red
Solution: Click icon → Start All Services
          Check if port 80 is not used by another application

Issue: Admin panel won't start
Solution: Check if port 3001 is available
          Run: netstat -ano | findstr :3001
          Kill process if needed: taskkill /PID <process_id> /F
          Ensure Node.js is installed: node --version

Issue: Database connection failed
Solution: Verify MySQL is running in WAMP
          Check credentials in Database.php and database.js
          Ensure database "thriftipid" exists

Issue: 404 errors on public site
Solution: Check WAMP virtual hosts configuration
          Correct URL format:
          - http://localhost/public/pages/index.html
          - http://localhost/thriftipid/public/pages/index.html

Issue: CORS errors in browser console
Solution: Ensure bootstrap.php has correct CORS headers
          Admin panel (port 3001) and main site must be in allowed origins

Issue: Images not loading
Solution: Check that product_images table has records
          Verify /api/image.php endpoint is accessible
          Check file permissions in uploads folder (if used)

Issue: Offers not showing for seller
Solution: Ensure you're logged in as the product owner
          Check bids table has records with correct product_id
          Verify bidder_id and user_id are set correctly

Issue: Items not appearing in "Items Bought" tab
Solution: Verify products.buyer_id is set correctly
          Check bids.bidder_id matches the buyer's user ID
          Ensure product status is 'sold'

DEVELOPMENT TIPS
================================================================================

1. Always keep the admin panel terminal running while working
2. Check browser console (F12) for JavaScript errors
3. Check PHP error logs: C:\wamp64\logs\php_error.log
4. Use phpMyAdmin to inspect database tables
5. Clear browser cache if changes don't appear
6. Use incognito mode to test without cached data

FILE PERMISSIONS
================================================================================
On Windows with WAMP, file permissions are usually fine by default.
If you encounter permission issues:
- Ensure WAMP is running as administrator
- Check that www folder is not read-only

SECURITY NOTES
================================================================================
FOR DEVELOPMENT ONLY:
- Database has no password (root with empty password)
- Error display is enabled
- CORS allows localhost origins

FOR PRODUCTION:
1. Set strong MySQL root password
2. Create dedicated database user with limited privileges
3. Disable error display (display_errors = 0)
4. Update CORS headers to allow only production domain
5. Use HTTPS
6. Enable PHP session security settings
7. Implement rate limiting
8. Sanitize all user inputs
9. Use prepared statements (already implemented)
10. Regular security updates

BACKUP
================================================================================
To backup your database:
1. Open phpMyAdmin
2. Select "thriftipid" database
3. Click "Export" tab
4. Keep default settings (Quick, SQL format)
5. Click "Go"
6. Save the .sql file

To restore:
1. Create new database or drop existing tables
2. Import the saved .sql file

SUPPORT & DOCUMENTATION
================================================================================
- GUIDE.md: Development guide with API documentation
- Database schema: See thriftipid.sql
- Code comments: Inline documentation in source files

API Response Format:
All API endpoints return JSON with this structure:
{
  "success": true/false,
  "message": "Status message",
  "data": { ... }  // Response data
}

CREDITS
================================================================================
ThrifTipid Marketplace
Built with PHP, MySQL, JavaScript, and Node.js

Technologies Used:
- Backend: PHP 8.3, MySQL 9.1
- Frontend: HTML5, CSS3, Vanilla JavaScript
- Admin: Node.js, Express.js
- Charts: Chart.js
- Icons: Font Awesome

================================================================================
