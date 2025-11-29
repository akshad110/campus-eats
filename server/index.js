import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
// Stripe removed - using UPI payment
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
dayjs.extend(utc);
dayjs.extend(timezone);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;


// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true
}));
app.use(express.json());

// MySQL Configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "WJ28@krhps",
  database: process.env.DB_NAME || "campuseats",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Add SSL configuration for cloud MySQL providers (PlanetScale, etc.)
if (process.env.DB_SSL === 'true' || process.env.DB_HOST?.includes('psdb.cloud') || process.env.DB_HOST?.includes('planetscale')) {
  dbConfig.ssl = {
    rejectUnauthorized: false
  };
}

const pool = mysql.createPool(dbConfig);

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
    credentials: true
  },
});

// Socket.io connection
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// Stripe removed - using UPI payment with screenshot verification

async function createTables(connection) {
  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role ENUM('student', 'shopkeeper', 'developer') NOT NULL,
        phone VARCHAR(20),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS shops (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        image VARCHAR(500),
        category VARCHAR(100) NOT NULL,
        owner_id VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        location VARCHAR(255),
        phone VARCHAR(20),
        upi_id VARCHAR(255),
        payment_screenshot LONGTEXT,
        crowd_level ENUM('low', 'medium', 'high') DEFAULT 'low',
        estimated_wait_time INT DEFAULT 10,
        rating DECIMAL(3,2) DEFAULT 4.0,
        total_ratings INT DEFAULT 0,
        current_orders INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Add payment_screenshot column if it doesn't exist, or modify if it exists but is wrong type
    try {
      // First check if column exists by trying to modify it
      await connection.execute(`
        ALTER TABLE shops MODIFY COLUMN payment_screenshot LONGTEXT
      `);
      console.log("✅ Updated shops.payment_screenshot column to LONGTEXT");
    } catch (err) {
      // If column doesn't exist, add it
      if (err.message.includes("Unknown column")) {
        try {
          await connection.execute(`
            ALTER TABLE shops ADD COLUMN payment_screenshot LONGTEXT NULL
          `);
          console.log("✅ Added payment_screenshot column to shops table");
        } catch (addErr) {
          console.log("ℹ️ Could not add payment_screenshot column:", addErr.message);
        }
      } else {
        console.log("ℹ️ shops.payment_screenshot column update:", err.message);
      }
    }

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id VARCHAR(255) PRIMARY KEY,
        shop_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        image VARCHAR(500),
        category VARCHAR(100) NOT NULL,
        is_available BOOLEAN DEFAULT TRUE,
        preparation_time INT DEFAULT 10,
        ingredients JSON,
        allergens JSON,
        nutritional_info JSON,
        stock_quantity INT DEFAULT 50,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        shop_id VARCHAR(255) NOT NULL,
        items JSON NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        status ENUM('pending_approval', 'approved', 'rejected', 'payment_pending', 'payment_completed', 'payment_failed', 'preparing', 'ready', 'fulfilled', 'cancelled') DEFAULT 'pending_approval',
        token_number INT NULL,
        estimated_pickup_time TIMESTAMP NULL,
        actual_pickup_time TIMESTAMP NULL,
        payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
        payment_method ENUM('cash', 'card', 'digital_wallet', 'upi') NULL,
        payment_screenshot LONGTEXT NULL,
        notes TEXT,
        rejection_reason TEXT,
        rating INT NULL,
        review TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
      )
    `);
    
    // Add payment_screenshot column if it doesn't exist, or modify if it exists but is wrong type
    try {
      // First check if column exists by trying to modify it
      await connection.execute(`
        ALTER TABLE orders MODIFY COLUMN payment_screenshot LONGTEXT
      `);
      console.log("✅ Updated orders.payment_screenshot column to LONGTEXT");
    } catch (err) {
      // If column doesn't exist, add it
      if (err.message.includes("Unknown column")) {
        try {
          await connection.execute(`
            ALTER TABLE orders ADD COLUMN payment_screenshot LONGTEXT NULL
          `);
          console.log("✅ Added payment_screenshot column to orders table");
        } catch (addErr) {
          console.log("ℹ️ Could not add payment_screenshot column:", addErr.message);
        }
      } else {
        console.log("ℹ️ orders.payment_screenshot column update:", err.message);
      }
    }

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS order_status_updates (
        id VARCHAR(255) PRIMARY KEY,
        order_id VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        message TEXT,
        updated_by VARCHAR(255),
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('order_update', 'token_ready', 'promotional', 'system') NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log("📋 All tables created successfully");
  } catch (err) {
    console.error("❌ Error creating tables:", err);
    throw err;
  }
}

async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    await connection.execute("CREATE DATABASE IF NOT EXISTS campuseats");
    await connection.changeUser({ database: "campuseats" });
    await createTables(connection);
    connection.release();
    console.log("🗄️ Database initialized successfully");
    return true;
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    console.log(
      "⚠️ Server will continue without MySQL - API calls will return errors",
    );
    return false;
  }
}

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CampusEats API is running",
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  try {
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      console.log("🔄 Starting server without MySQL database...");
    }
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(
        `🚀 CampusEats API Server (with WebSocket) running on port ${PORT}`,
      );
      if (!dbInitialized) {
        console.log(
          "⚠️ MySQL not available - frontend will use localStorage fallback",
        );
      }
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Helper to generate unique IDs
function generateId(prefix = "") {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}${timestamp}_${random}`;
}

// ======================== AUTH ROUTES =========================

// Register User or Shopkeeper
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    const id = generateId("user_");

    await pool.execute(
      "INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)",
      [id, email, password, name, role],
    );

    const [users] = await pool.execute("SELECT * FROM users WHERE id = ?", [
      id,
    ]);
    const user = users[0];

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token: `token_${id}_${Date.now()}`,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Login (email + role based)
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, role } = req.body;

    const [users] = await pool.execute(
      "SELECT * FROM users WHERE email = ? AND role = ?",
      [email, role],
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const user = users[0];

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token: `token_${user.id}_${Date.now()}`,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Change password
app.put("/api/users/:id/change-password", async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: "Current password and new password are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, error: "New password must be at least 8 characters long" });
    }

    // Get user from database
    const [users] = await pool.execute("SELECT * FROM users WHERE id = ?", [id]);
    
    if (users.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const user = users[0];

    // Verify current password (in a real app, you'd hash and compare)
    // For now, we'll just check if it matches (since passwords are stored as plain text in this demo)
    if (user.password !== currentPassword) {
      return res.status(401).json({ success: false, error: "Current password is incorrect" });
    }

    // Update password
    await pool.execute(
      "UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?",
      [newPassword, id]
    );

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post("/api/shops", async (req, res) => {
  try {
    const { name, description, category, location, phone, image, ownerId, upiId, closed } = req.body;

    const id = `shop_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    await pool.execute(
      `
      INSERT INTO shops (id, name, description, category, location, phone, image, owner_id, upi_id, closed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [id, name, description, category, location, phone, image, ownerId, upiId || null, closed === true]
    );

    const [shops] = await pool.execute("SELECT * FROM shops WHERE id = ?", [
      id,
    ]);

    res.json({ success: true, data: shops[0] });
  } catch (error) {
    console.error("Create shop error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.put("/api/shops/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, location, phone, image, upiId, closed, payment_screenshot } = req.body;
    console.log('Shop update payload:', { 
      id, 
      hasUpiId: upiId !== undefined, 
      hasScreenshot: payment_screenshot !== undefined,
      screenshotLength: payment_screenshot ? payment_screenshot.length : 0
    }); // DEBUG LOG
    let updateFields = [];
    let params = [];
    if (name) { updateFields.push("name = ?"); params.push(name); }
    if (description) { updateFields.push("description = ?"); params.push(description); }
    if (category) { updateFields.push("category = ?"); params.push(category); }
    if (location) { updateFields.push("location = ?"); params.push(location); }
    if (phone) { updateFields.push("phone = ?"); params.push(phone); }
    if (image) { updateFields.push("image = ?"); params.push(image); }
    if (upiId !== undefined) { 
      updateFields.push("upi_id = ?"); 
      params.push(upiId || null); // Allow empty string to be set to null
    }
    if (payment_screenshot !== undefined) { 
      updateFields.push("payment_screenshot = ?"); 
      params.push(payment_screenshot || null); // Allow null/empty to clear the screenshot
    }
    if (closed !== undefined) { updateFields.push("closed = ?"); params.push(closed ? 1 : 0); }
    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, error: "No fields to update" });
    }
    params.push(id);
    console.log('SQL Update:', `UPDATE shops SET ${updateFields.join(", ")}, updated_at = NOW() WHERE id = ?`);
    await pool.execute(
      `UPDATE shops SET ${updateFields.join(", ")}, updated_at = NOW() WHERE id = ?`,
      params
    );
    const [shops] = await pool.execute("SELECT * FROM shops WHERE id = ?", [id]);
    if (shops.length === 0) {
      return res.status(404).json({ success: false, error: "Shop not found" });
    }
    res.json({ success: true, data: shops[0] });
  } catch (error) {
    console.error("Update shop error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get("/api/shops/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.user_id;
    const [shops] = await pool.execute("SELECT * FROM shops WHERE id = ?", [id]);
    if (shops.length === 0) {
      return res.status(404).json({ success: false, error: "Shop not found" });
    }
    let shop = shops[0];
    res.json({ success: true, data: shop });
  } catch (error) {
    console.error("Get shop error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/shops/owner/:ownerId", async (req, res) => {
  try {
    const { ownerId } = req.params;
    const [shops] = await pool.execute(
      "SELECT * FROM shops WHERE owner_id = ? AND is_active = TRUE",
      [ownerId],
    );
    res.json({ success: true, data: shops });
  } catch (error) {
    console.error("Get shops by owner error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/shops", async (req, res) => {
  try {
    // Fetch all shops and calculate tokens dynamically
    const [shops] = await pool.execute(
      `SELECT s.*, 
        (SELECT COUNT(*) FROM orders o WHERE o.shop_id = s.id AND o.status IN ('preparing', 'ready', 'fulfilled', 'collected') AND DATE(o.created_at) = CURDATE()) AS tokens
      FROM shops s WHERE s.is_active = TRUE`
    );
    // Remove upi_id from all shops in public list
    const sanitized = shops.map((shop) => ({ ...shop, upi_id: undefined, tokens: shop.tokens || 0 }));
    res.json({ success: true, data: sanitized });
  } catch (error) {
    console.error("Get all shops error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/api/shops/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Soft delete: set is_active to false
    const [result] = await pool.execute(
      "UPDATE shops SET is_active = FALSE WHERE id = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Shop not found" });
    }
    res.json({ success: true, message: "Shop deleted successfully" });
  } catch (error) {
    console.error("Delete shop error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ======================== MENU ITEMS ROUTES =========================

// Get all menu items for a shop
app.get("/api/shops/:shopId/menu", async (req, res) => {
  try {
    const { shopId } = req.params;
    const [items] = await pool.execute(
      "SELECT * FROM menu_items WHERE shop_id = ? ORDER BY created_at DESC",
      [shopId],
    );
    res.json({ success: true, data: items });
  } catch (err) {
    console.error("Get menu items error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add a new menu item
app.post("/api/menu-items", async (req, res) => {
  try {
    const {
      shop_id,
      name,
      description,
      price,
      image,
      category,
      is_available,
      preparation_time,
      ingredients,
      allergens,
      nutritional_info,
      stock_quantity,
    } = req.body;

    const id = `menu_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    await pool.execute(
      `
      INSERT INTO menu_items (
        id, shop_id, name, description, price, image, category,
        is_available, preparation_time, ingredients, allergens,
        nutritional_info, stock_quantity
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        id,
        shop_id,
        name,
        description,
        price,
        image,
        category,
        is_available ?? true,
        preparation_time ?? 10,
        JSON.stringify(ingredients || []),
        JSON.stringify(allergens || []),
        JSON.stringify(nutritional_info || {}),
        stock_quantity ?? 50,
      ],
    );

    const [items] = await pool.execute(
      "SELECT * FROM menu_items WHERE id = ?",
      [id],
    );

    res.json({ success: true, data: items[0] });
  } catch (err) {
    console.error("Add menu item error:", err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update a menu item (including hide/unhide)
app.put("/api/menu-items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    let updateFields = [];
    let params = [];
    // Only allow updating certain fields
    const allowedFields = [
      "name", "description", "price", "image", "category", "is_available",
      "preparation_time", "ingredients", "allergens", "nutritional_info", "stock_quantity"
    ];
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        if (["ingredients", "allergens", "nutritional_info"].includes(field)) {
          updateFields.push(`${field} = ?`);
          params.push(JSON.stringify(updateData[field]));
        } else if (field === "is_available") {
          // Convert boolean to 1/0 for MySQL
          updateFields.push(`${field} = ?`);
          params.push(updateData[field] ? 1 : 0);
        } else {
          updateFields.push(`${field} = ?`);
          params.push(updateData[field]);
        }
      }
    }
    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, error: "No fields to update" });
    }
    params.push(id);
    console.log('Updating menu item:', id, updateFields, params);
    await pool.execute(
      `UPDATE menu_items SET ${updateFields.join(", ")}, updated_at = NOW() WHERE id = ?`,
      params
    );
    const [items] = await pool.execute("SELECT * FROM menu_items WHERE id = ?", [id]);
    console.log('Menu item after update:', items);
    if (!items || items.length === 0) {
      return res.status(404).json({ success: false, error: "Menu item not found" });
    }
    res.json({ success: true, data: items[0] });
  } catch (err) {
    console.error("Update menu item error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete a menu item
app.delete("/api/menu-items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute("DELETE FROM menu_items WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Menu item not found" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Delete menu item error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get notifications for a user
app.get("/api/notifications", async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res.status(400).json({ success: false, error: "Missing user_id" });
    }
    const [notifications] = await pool.execute(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
      [user_id],
    );
    res.json({ success: true, data: notifications });
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create notification
app.post("/api/notifications", async (req, res) => {
  try {
    const { id, user_id, title, message, type, metadata } = req.body;
    if (!id || !user_id || !title || !message || !type) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }
    await pool.execute(
      "INSERT INTO notifications (id, user_id, title, message, type, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())",
      [id, user_id, title, message, type, metadata ? JSON.stringify(metadata) : null]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Create notification error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mark a notification as read
app.put("/api/notifications/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute(
      "UPDATE notifications SET is_read = true WHERE id = ?",
      [id],
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Mark notification as read error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/shops/:shopId/orders/all", async (req, res) => {
  try {
    const { shopId } = req.params;
    const [orders] = await pool.execute(
      `SELECT * FROM orders WHERE shop_id = ? ORDER BY created_at DESC`,
      [shopId]
    );
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get active orders for a shop
app.get("/api/shops/:shopId/orders/active", async (req, res) => {
  try {
    const { shopId } = req.params;
    const [orders] = await pool.execute(
      `SELECT * FROM orders WHERE shop_id = ? AND status IN ('approved', 'preparing', 'ready') ORDER BY created_at DESC`,
      [shopId]
    );
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get pending orders for a shop
app.get("/api/shops/:shopId/orders/pending", async (req, res) => {
  try {
    const { shopId } = req.params;
    const [orders] = await pool.execute(
      `SELECT * FROM orders WHERE shop_id = ? AND status = 'pending_approval' ORDER BY created_at DESC`,
      [shopId]
    );
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// === AUTO-CANCEL UNPAID APPROVED ORDERS ===
setInterval(async () => {
  try {
    const [orders] = await pool.execute(
      `SELECT * FROM orders WHERE status = 'approved' AND payment_status = 'pending' AND TIMESTAMPDIFF(MINUTE, updated_at, NOW()) >= 5`
    );
    for (const order of orders) {
      // Cancel the order
      await pool.execute(
        `UPDATE orders SET status = 'cancelled', payment_status = 'failed', updated_at = NOW() WHERE id = ?`,
        [order.id]
      );
      // Insert notification for the user
      await pool.execute(
        `INSERT INTO notifications (id, user_id, title, message, type, is_read, metadata, created_at) VALUES (?, ?, ?, ?, ?, false, ?, NOW())`,
        [
          `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          order.user_id,
          'Order Cancelled',
          'Your order was cancelled because payment was not completed within 5 minutes.',
          'order_update',
          JSON.stringify({ order_id: order.id, status: 'cancelled', reason: 'payment timeout' }),
        ]
      );
      // Emit socket event for real-time update
      io.emit('order_status_update', { orderId: order.id, status: 'cancelled', userId: order.user_id, order: { ...order, status: 'cancelled', payment_status: 'failed' } });
      console.log(`[AUTO-CANCEL] Order ${order.id} cancelled due to payment timeout.`);
    }
  } catch (err) {
    console.error('[AUTO-CANCEL] Error auto-cancelling unpaid orders:', err);
  }
}, 60 * 1000); // Check every 1 minute

// === SHOP ANALYTICS AGGREGATION ===
async function getShopAnalytics({ shopId, startDate, endDate }) {
  // Default to today if not provided
  const today = new Date();
  const defaultStart = startDate || today.toISOString().slice(0, 10) + ' 00:00:00';
  const defaultEnd = endDate || today.toISOString().slice(0, 10) + ' 23:59:59';
  // 1. Order Status Breakdown
  const [orderStatusRows] = await pool.execute(
    `SELECT status, COUNT(*) as count FROM orders WHERE shop_id = ? AND created_at BETWEEN ? AND ? GROUP BY status`,
    [shopId, defaultStart, defaultEnd]
  );
  // 2. Payment Method Breakdown
  const [paymentRows] = await pool.execute(
    `SELECT payment_method, COUNT(*) as count FROM orders WHERE shop_id = ? AND created_at BETWEEN ? AND ? GROUP BY payment_method`,
    [shopId, defaultStart, defaultEnd]
  );
  // 3. Revenue Trend (hourly for day, daily for week/month, monthly for year)
  const [revenueRows] = await pool.execute(
    `SELECT HOUR(created_at) as hour, SUM(total_amount) as revenue, COUNT(*) as orders FROM orders WHERE shop_id = ? AND created_at BETWEEN ? AND ? GROUP BY hour ORDER BY hour`,
    [shopId, defaultStart, defaultEnd]
  );
  // 4. Average Order Value
  const [avgOrderRow] = await pool.execute(
    `SELECT AVG(total_amount) as avg_order_value FROM orders WHERE shop_id = ? AND created_at BETWEEN ? AND ?`,
    [shopId, defaultStart, defaultEnd]
  );
  // 5. Top/Least Selling Items
  const [topItems] = await pool.execute(
    `SELECT JSON_UNQUOTE(JSON_EXTRACT(items, '$[*].menuItemId')) as item_ids FROM orders WHERE shop_id = ? AND created_at BETWEEN ? AND ?`,
    [shopId, defaultStart, defaultEnd]
  );
  // 6. Top Customers
  const [topCustomers] = await pool.execute(
    `SELECT o.user_id, u.name as username, COUNT(*) as orders, SUM(o.total_amount) as spent
     FROM orders o
     JOIN users u ON o.user_id = u.id
     WHERE o.shop_id = ? AND o.created_at BETWEEN ? AND ?
     GROUP BY o.user_id, u.name
     ORDER BY orders DESC LIMIT 5`,
    [shopId, defaultStart, defaultEnd]
  );
  // 7. Repeat vs New Customers
  const [repeatRows] = await pool.execute(
    `SELECT user_id, COUNT(*) as order_count FROM orders WHERE shop_id = ? GROUP BY user_id`,
    [shopId]
  );
  // 8. Average Preparation/Fulfillment Time
  const [prepRows] = await pool.execute(
    `SELECT AVG(TIMESTAMPDIFF(MINUTE, created_at, actual_pickup_time)) as avg_fulfillment FROM orders WHERE shop_id = ? AND status = 'fulfilled' AND created_at BETWEEN ? AND ?`,
    [shopId, defaultStart, defaultEnd]
  );
  // 9. Peak Hours
  const [peakRows] = await pool.execute(
    `SELECT HOUR(created_at) as hour, COUNT(*) as orders FROM orders WHERE shop_id = ? AND created_at BETWEEN ? AND ? GROUP BY hour ORDER BY orders DESC LIMIT 1`,
    [shopId, defaultStart, defaultEnd]
  );
  // 10. Day of Week Trends
  const [dowRows] = await pool.execute(
    `SELECT DAYOFWEEK(created_at) as day, COUNT(*) as orders FROM orders WHERE shop_id = ? AND created_at BETWEEN ? AND ? GROUP BY day`,
    [shopId, defaultStart, defaultEnd]
  );
  // 11. Ratings/Reviews
  const [ratingRows] = await pool.execute(
    `SELECT AVG(rating) as avg_rating, COUNT(*) as num_reviews FROM orders WHERE shop_id = ? AND rating IS NOT NULL AND created_at BETWEEN ? AND ?`,
    [shopId, defaultStart, defaultEnd]
  );
  // 12. Low Stock Alerts
  const [lowStockRows] = await pool.execute(
    `SELECT id, name, stock_quantity FROM menu_items WHERE shop_id = ? AND stock_quantity < 10`,
    [shopId]
  );
  // 13. Order Spike Alerts (orders > 2x avg in any hour)
  // (Calculate avg orders per hour, then flag hours with > 2x avg)
  // ... (for brevity, can be added if needed)
  return {
    orderStatus: orderStatusRows,
    paymentMethods: paymentRows,
    revenueTrend: revenueRows,
    avgOrderValue: avgOrderRow[0]?.avg_order_value || 0,
    topItems: topItems, // Needs further processing for item names
    topCustomers: topCustomers,
    repeatStats: repeatRows,
    avgFulfillment: prepRows[0]?.avg_fulfillment ?? null,
    peakHour: peakRows[0] || null,
    dayOfWeek: dowRows,
    ratings: ratingRows[0] || {},
    lowStock: lowStockRows,
  };
}

// Analytics route for frontend
app.get('/api/analytics/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    const { startDate, endDate } = req.query;
    const analytics = await getShopAnalytics({ shopId, startDate, endDate });
    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ======================== ORDER ROUTES =========================

app.post("/api/orders", async (req, res) => {
  try {
    const {
      user_id,
      shop_id,
      items,
      total_amount,
      status,
      payment_status,
      token_number,
      estimated_pickup_time,
      notes
    } = req.body;
    const id = `order_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    // Get the current max order_number for this shop
    const [rows] = await pool.execute(
      "SELECT MAX(order_number) as maxOrder FROM orders WHERE shop_id = ?",
      [shop_id]
    );
    const nextOrderNumber = (rows[0].maxOrder || 0) + 1;

    await pool.execute(
      `INSERT INTO orders (id, user_id, shop_id, items, total_amount, status, payment_status, token_number, estimated_pickup_time, notes, order_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
      [
        id,
        user_id ?? null,
        shop_id ?? null,
        JSON.stringify(items ?? []),
        total_amount ?? 0,
        status ?? 'pending_approval',
        payment_status ?? 'pending',
        token_number ?? null,
        estimated_pickup_time ?? null,
        notes ?? null,
        nextOrderNumber
      ]
    );
    const [orders] = await pool.execute("SELECT * FROM orders WHERE id = ?", [id]);
    res.json({ success: true, data: orders[0] });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Upload payment screenshot
app.post("/api/orders/:id/payment-screenshot", async (req, res) => {
  try {
    const { id } = req.params;
    const { screenshot } = req.body;
    
    await pool.execute(
      "UPDATE orders SET payment_screenshot = ?, payment_status = 'pending', updated_at = NOW() WHERE id = ?",
      [screenshot, id]
    );
    
    // Create notification for shopkeeper
    const [orders] = await pool.execute("SELECT * FROM orders WHERE id = ?", [id]);
    const order = orders[0];
    
    // Get shop owner
    const [shops] = await pool.execute("SELECT owner_id FROM shops WHERE id = ?", [order.shop_id]);
    const shopOwnerId = shops[0]?.owner_id;
    
    if (shopOwnerId) {
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      await pool.execute(
        `INSERT INTO notifications (id, user_id, title, message, type, is_read, metadata, created_at) VALUES (?, ?, ?, ?, ?, false, ?, NOW())`,
        [
          notifId,
          shopOwnerId,
          'Payment Screenshot Received',
          `Order #${order.order_number || order.id} - Payment screenshot uploaded. Please review and approve.`,
          'order_update',
          JSON.stringify({ order_id: order.id, type: 'payment_screenshot' }),
        ]
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Upload payment screenshot error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.put("/api/orders/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payment_status, estimated_pickup_time, rejection_reason, transaction_id, preparation_time, payment_screenshot } = req.body;
    let updateFields = [];
    let params = [];
    // DEBUG LOG: Print incoming payload
    console.log('[DEBUG] /api/orders/:id/status payload:', req.body);
    let tokenNumberToSet = null;
    if (status !== undefined) { updateFields.push("status = ?"); params.push(status); }
    if (payment_status !== undefined) { updateFields.push("payment_status = ?"); params.push(payment_status); }
    if (estimated_pickup_time !== undefined) { updateFields.push("estimated_pickup_time = ?"); params.push(estimated_pickup_time ?? null); }
    if (rejection_reason !== undefined) { updateFields.push("rejection_reason = ?"); params.push(rejection_reason ?? null); }
    if (transaction_id !== undefined) { updateFields.push("transaction_id = ?"); params.push(transaction_id ?? null); }
    if (preparation_time !== undefined) { updateFields.push("preparation_time = ?"); params.push(preparation_time ?? null); }
    if (payment_screenshot !== undefined) { updateFields.push("payment_screenshot = ?"); params.push(payment_screenshot ?? null); }

    // If moving to 'preparing', assign next token_number if not already set
    if (status === 'preparing') {
      // Get the order to check if token_number is already set
      const [orders] = await pool.execute("SELECT * FROM orders WHERE id = ?", [id]);
      const order = orders[0];
      if (!order.token_number) {
        // Get current max token_number for this shop for today
        const [rows] = await pool.execute(
          "SELECT MAX(token_number) as maxToken FROM orders WHERE shop_id = ? AND DATE(created_at) = CURDATE()",
          [order.shop_id]
        );
        tokenNumberToSet = (rows[0].maxToken || 0) + 1;
        updateFields.push("token_number = ?");
        params.push(tokenNumberToSet);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, error: "No fields to update" });
    }
    params.push(id);
    // DEBUG LOG: Print SQL update
    console.log('[DEBUG] SQL:', `UPDATE orders SET ${updateFields.join(", ")}, updated_at = NOW() WHERE id = ?`, params);
    await pool.execute(
      `UPDATE orders SET ${updateFields.join(", ")}, updated_at = NOW() WHERE id = ?`,
      params
    );
    const [orders] = await pool.execute("SELECT * FROM orders WHERE id = ?", [id]);
    res.json({ success: true, data: orders[0] });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get all orders for a user
app.get("/api/orders", async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res.status(400).json({ success: false, error: "Missing user_id" });
    }
    const [orders] = await pool.execute(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
      [user_id]
    );
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("Get orders by user error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/feedback', async (req, res) => {
  const { orderId, shopId, userId, rating, feedback } = req.body;
  if (!orderId || !shopId || !userId || !rating) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  try {
    // Check how many ratings this user has submitted for this order
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM order_ratings WHERE order_id = ? AND user_id = ?',
      [orderId, userId]
    );
    if (rows[0].count >= 2) {
      return res.status(400).json({ success: false, error: 'You have reached the rating limit for this order.' });
    }
    // Insert new rating
    const id = `rating_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    await pool.execute(
      'INSERT INTO order_ratings (id, order_id, user_id, shop_id, rating, review) VALUES (?, ?, ?, ?, ?, ?)',
      [id, orderId, userId, shopId, rating, feedback]
    );
    // Optionally, update the latest rating/review in the orders table for analytics
    await pool.execute(
      'UPDATE orders SET rating = ?, review = ? WHERE id = ? AND shop_id = ?',
      [rating, feedback, orderId, shopId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving feedback:', err);
    res.status(500).json({ success: false, error: 'Failed to save feedback' });
  }
});

app.get('/api/shops/:shopId/average-rating', async (req, res) => {
  const { shopId } = req.params;
  try {
    const [rows] = await pool.execute(
      'SELECT AVG(rating) as avgRating, COUNT(rating) as numRatings FROM orders WHERE shop_id = ? AND rating IS NOT NULL',
      [shopId]
    );
    let avgRating = rows[0].avgRating;
    if (avgRating === null || isNaN(Number(avgRating))) avgRating = 0;
    else avgRating = Number(avgRating);
    res.json({ success: true, avgRating, numRatings: rows[0].numRatings || 0 });
  } catch (err) {
    console.error('Error fetching average rating:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch average rating' });
  }
});

// Endpoint to get the number of ratings a user has submitted for an order
app.get('/api/orders/:orderId/ratings/count', async (req, res) => {
  const { orderId } = req.params;
  const { userId } = req.query;
  if (!orderId || !userId) {
    return res.status(400).json({ success: false, error: 'Missing orderId or userId' });
  }
  try {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM order_ratings WHERE order_id = ? AND user_id = ?',
      [orderId, userId]
    );
    res.json({ success: true, count: rows[0].count });
  } catch (err) {
    console.error('Error fetching rating count:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch rating count' });
  }
});

startServer();

process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down server...");
  await pool.end();
  process.exit(0);
});

export { io };
