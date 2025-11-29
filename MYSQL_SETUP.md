# 🗄️ MySQL Database Integration Guide

This guide will help you set up and run CampusEats with MySQL database backend.

## 📋 Prerequisites

1. **MySQL Server** installed and running on your system
2. **Node.js** (v16 or higher)
3. **npm** package manager

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Test MySQL Connection

First, verify your MySQL connection works:

```bash
node server/test-db.js
```

This will test:

- ✅ Connection to MySQL server
- ✅ Database creation permissions
- ✅ Table listing and record counts

**Expected Output:**

```
🔗 Testing MySQL connection...
✅ Connected to MySQL successfully!
📊 MySQL Version: 8.0.x
🗄️ CampusEats database exists: ❌ No
🎉 Database test completed successfully!
```

### 3. Start the Backend Server

The backend will automatically:

- Create the `campuseats` database
- Set up all required tables
- Insert fallback data

```bash
npm run dev:server
```

**Expected Output:**

```
🔌 Connecting to MySQL...
✅ Connected to MySQL successfully
📋 All tables created successfully
✅ Fallback data created successfully
🚀 CampusEats API Server running on http://localhost:3001
```

### 4. Start the Frontend

In a new terminal:

```bash
npm run dev
```

Or start both together:

```bash
npm run dev:full
```

## 🗃️ Database Schema

The system creates these tables automatically:

### Core Tables

- **users** - Student/Shopkeeper accounts
- **shops** - Restaurant/food shop information
- **menu_items** - Food items for each shop
- **orders** - Customer orders with approval workflow

### Supporting Tables

- **order_status_updates** - Order status change history
- **notifications** - User notifications system

## 🚀 API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Shops

- `GET /api/shops` - Get all active shops
- `GET /api/shops/:id` - Get specific shop
- `POST /api/shops` - Create new shop
- `GET /api/shops/owner/:ownerId` - Get shops by owner

### Menu Items

- `GET /api/shops/:shopId/menu` - Get menu for shop
- `POST /api/menu-items` - Create menu item
- `PUT /api/menu-items/:id` - Update menu item
- `DELETE /api/menu-items/:id` - Delete menu item

### Orders

- `POST /api/orders` - Create new order
- `GET /api/shops/:shopId/orders/pending` - Get pending approval orders
- `PUT /api/orders/:id/status` - Approve/reject order
- `GET /api/orders/:id` - Get specific order

## 🔄 Real-time Features

### Order Approval System

- ✅ Orders require shopkeeper approval
- ✅ Real-time polling (15-second intervals)
- ✅ Dropdown rejection reasons
- ✅ Custom preparation time setting

### Database Updates

- ✅ All data persisted to MySQL
- ✅ Automatic table creation
- ✅ Transaction safety
- ✅ Connection pooling

## 🛠️ Development Commands

| Command                  | Description                      |
| ------------------------ | -------------------------------- |
| `npm run dev`            | Start frontend only              |
| `npm run dev:server`     | Start backend only               |
| `npm run dev:full`       | Start both frontend and backend  |
| `npm run server`         | Start backend in production mode |
| `node server/test-db.js` | Test database connection         |

## 🐛 Troubleshooting

### Connection Issues

**Error: ER_ACCESS_DENIED_ERROR**

```bash
# Check credentials in server/index.js
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "WJ28@krhps", // ← Verify this
  database: "campuseats"
};
```

**Error: ECONNREFUSED**

```bash
# Start MySQL service
sudo service mysql start
# or
brew services start mysql
```

**Error: Database doesn't exist**

```bash
# The system creates it automatically, but you can also:
mysql -u root -p
CREATE DATABASE campuseats;
```

### Port Conflicts

- Backend runs on port **3001**
- Frontend runs on port **8080**
- MySQL runs on port **3306**

Change ports in:

- `server/index.js` (backend)
- `vite.config.ts` (frontend)

### API Request Issues

Check browser console for:

- ❌ Network errors (backend not running)
- ❌ CORS errors (backend CORS config)
- ❌ 404 errors (wrong endpoint URLs)

## 📊 Database Monitoring

### View Database Content

```sql
USE campuseats;

-- Check all tables
SHOW TABLES;

-- View shops
SELECT id, name, category, owner_id FROM shops;

-- View orders
SELECT id, token_number, status, total_amount FROM orders;

-- View menu items
SELECT id, shop_id, name, price FROM menu_items;
```

### Performance Monitoring

```sql
-- Check active connections
SHOW PROCESSLIST;

-- Monitor queries
SHOW STATUS LIKE 'Queries';

-- Check table sizes
SELECT
  table_name,
  round(((data_length + index_length) / 1024 / 1024), 2) as size_mb
FROM information_schema.tables
WHERE table_schema = 'campuseats';
```

## 🔒 Security Notes

- Database password is hardcoded for development
- In production, use environment variables
- Enable SSL for database connections
- Implement proper authentication tokens
- Add input validation and sanitization

## 🎯 Next Steps

1. **WebSocket Integration** - Real-time order updates
2. **Database Indexing** - Optimize query performance
3. **Backup Strategy** - Automated database backups
4. **Connection Monitoring** - Health checks and alerting
5. **Migration System** - Database schema versioning

## 📞 Support

If you encounter issues:

1. Check the console logs (both frontend and backend)
2. Verify MySQL is running: `mysql -u root -p`
3. Test API endpoints: `curl http://localhost:3001/api/health`
4. Review this guide for common solutions

---

**Happy coding! 🚀**
