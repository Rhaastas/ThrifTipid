# ThrifTipid Admin Backend

Node.js/Express backend server for the ThrifTipid admin dashboard.

## Setup

### 1. Install Dependencies

```bash
cd admin
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env`:
```
PORT=3001
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=thriftipid
```

### 3. Update Database

Make sure your MySQL database has the `role` column in the `users` table. Run the updated SQL file:

```bash
# In phpMyAdmin or MySQL CLI
mysql -u root thriftipid < ../thriftipid.sql
```

### 4. Create an Admin User

In phpMyAdmin or MySQL CLI, update a user's role to 'admin':

```sql
UPDATE users SET role = 'admin' WHERE username = 'YourUsername';
```

### 5. Start the Server

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will run on **http://localhost:3001**

## Access

1. Make sure WAMP/MySQL is running
2. Start the Node.js admin server: `npm start`
3. Login to ThrifTipid with an admin account
4. You'll be automatically redirected to the admin dashboard

## API Endpoints

### Stats
- `GET /api/stats/overview` - Dashboard overview statistics
- `GET /api/stats/chart/revenue` - Revenue chart data
- `GET /api/stats/chart/categories` - Category distribution

### Users
- `GET /api/users` - List all users (with pagination)
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id/role` - Update user role
- `DELETE /api/users/:id` - Delete user

### Products
- `GET /api/products` - List all products (with filters)
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id/status` - Update product status
- `DELETE /api/products/:id` - Delete product

### Reports
- `GET /api/reports/activity` - Recent activity
- `GET /api/reports/revenue` - Revenue report

All endpoints require admin authentication via session cookie.

## Authentication

The admin backend uses the same session system as the main PHP application:
- Reads `session_token` cookie
- Validates against `user_sessions` table
- Checks user has `role = 'admin'`

## Tech Stack

- **Node.js** - Runtime
- **Express** - Web framework
- **MySQL2** - Database driver
- **dotenv** - Environment configuration
- **cors** - Cross-origin support
- **cookie-parser** - Cookie handling
