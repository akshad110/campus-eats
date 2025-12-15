import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import { Resend } from "resend";
import Razorpay from "razorpay";

dayjs.extend(utc);
dayjs.extend(timezone);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Debug: Check if Razorpay env vars are loaded
console.log("🔍 Checking Razorpay environment variables...");
console.log("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID ? "✅ SET" : "❌ NOT SET");
console.log("RAZORPAY_KEY_SECRET:", process.env.RAZORPAY_KEY_SECRET ? "✅ SET" : "❌ NOT SET");

const app = express();
const PORT = process.env.PORT || 3001;


// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Increased limit for image uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Razorpay Configuration
let razorpay;
try {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn("⚠️ Razorpay keys not configured. Payment features will be disabled.");
    razorpay = null;
  } else {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log("✅ Razorpay initialized successfully");
  }
} catch (error) {
  console.error("❌ Razorpay initialization error:", error);
  razorpay = null;
}

// Configure multer for memory storage (we'll upload directly to Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

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

// Add SSL configuration for cloud MySQL providers
// Aiven requires SSL, Railway usually doesn't
const requiresSSL = process.env.DB_SSL === 'true' || 
                    process.env.DB_HOST?.includes('aivencloud.com') || 
                    process.env.DB_HOST?.includes('psdb.cloud') || 
                    process.env.DB_HOST?.includes('planetscale');

if (requiresSSL) {
  dbConfig.ssl = {
    rejectUnauthorized: false
  };
  console.log("🔒 SSL enabled for database connection");
}

// Log connection details (without password)
console.log("🔗 Database Configuration:");
console.log(`   Host: ${dbConfig.host}`);
console.log(`   Port: ${dbConfig.port}`);
console.log(`   Database: ${dbConfig.database}`);
console.log(`   User: ${dbConfig.user}`);
console.log(`   SSL: ${requiresSSL ? 'Enabled' : 'Disabled'}`);

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
        closed BOOLEAN DEFAULT FALSE,
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
    
    // Add closed column if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE shops ADD COLUMN closed BOOLEAN DEFAULT FALSE
      `);
      console.log("✅ Added closed column to shops table");
    } catch (err) {
      if (!err.message.includes("Duplicate column name")) {
        console.log("ℹ️ Could not add closed column:", err.message);
      }
    }
    
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
        status ENUM('pending_approval', 'approved', 'rejected', 'payment_pending', 'payment_completed', 'payment_failed', 'preparing', 'ready', 'fulfilled', 'cancelled', 'expired') DEFAULT 'pending_approval',
        token_number INT NULL,
        order_number INT NULL,
        estimated_pickup_time TIMESTAMP NULL,
        actual_pickup_time TIMESTAMP NULL,
        payment_status ENUM('pending', 'completed', 'failed', 'refunded') NULL DEFAULT NULL,
        payment_transaction_id VARCHAR(255) NULL,
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
    
    // Add order_number column if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE orders ADD COLUMN order_number INT NULL
      `);
      console.log("✅ Added order_number column to orders table");
    } catch (err) {
      if (!err.message.includes("Duplicate column name")) {
        console.log("ℹ️ Could not add order_number column:", err.message);
      }
    }
    
    // Modify payment_status to allow NULL (for approved orders before payment)
    // This is critical: ENUM columns need explicit NULL permission
    try {
      // Always try to modify the column to allow NULL
      // This will work even if the column already allows NULL (MySQL will just say "same as current")
      await connection.execute(`
        ALTER TABLE orders MODIFY COLUMN payment_status ENUM('pending', 'completed', 'failed', 'refunded') NULL DEFAULT NULL
      `);
      console.log("✅ Modified payment_status column to allow NULL");
    } catch (err) {
      // Check if error is because column already has the correct definition
      if (err.message.includes("same as current") || err.message.includes("Duplicate")) {
        console.log("✅ payment_status column already allows NULL");
      } else {
        // Try to check current state and provide helpful message
        try {
          const [columnInfo] = await connection.execute(`
            SELECT COLUMN_TYPE, IS_NULLABLE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'orders' 
            AND COLUMN_NAME = 'payment_status'
          `);
          
          if (columnInfo.length > 0) {
            const isNullable = columnInfo[0].IS_NULLABLE === 'YES';
            const currentType = columnInfo[0].COLUMN_TYPE;
            console.log(`📊 payment_status column: ${currentType}, NULL allowed: ${isNullable}`);
            
            if (!isNullable) {
              console.error("❌ CRITICAL: payment_status column does NOT allow NULL. Manual database fix required!");
              console.error("   Run this SQL manually: ALTER TABLE orders MODIFY COLUMN payment_status ENUM('pending', 'completed', 'failed', 'refunded') NULL DEFAULT NULL;");
            }
          }
        } catch (checkErr) {
          console.log("⚠️ Could not check payment_status column state:", checkErr.message);
        }
        console.log("⚠️ Could not modify payment_status column:", err.message);
      }
    }
    
    // Add 'expired' to status ENUM if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE orders MODIFY COLUMN status ENUM('pending_approval', 'approved', 'rejected', 'payment_pending', 'payment_completed', 'payment_failed', 'preparing', 'ready', 'fulfilled', 'cancelled', 'expired') DEFAULT 'pending_approval'
      `);
      console.log("✅ Added 'expired' to orders.status ENUM");
    } catch (err) {
      if (!err.message.includes("same as current") && !err.message.includes("Duplicate")) {
        console.log("ℹ️ Could not modify status ENUM:", err.message);
        console.error("   Run this SQL manually: ALTER TABLE orders MODIFY COLUMN status ENUM('pending_approval', 'approved', 'rejected', 'payment_pending', 'payment_completed', 'payment_failed', 'preparing', 'ready', 'fulfilled', 'cancelled', 'expired') DEFAULT 'pending_approval';");
      }
    }

    // Add payment_transaction_id column if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE orders ADD COLUMN payment_transaction_id VARCHAR(255) NULL
      `);
      console.log("✅ Added payment_transaction_id column to orders table");
    } catch (err) {
      if (!err.message.includes("Duplicate column name")) {
        console.log("ℹ️ Could not add payment_transaction_id column:", err.message);
      }
    }

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
        type ENUM('order_update', 'token_ready', 'promotional', 'system', 'order_expired') NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Add 'order_expired' to notifications.type ENUM if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE notifications MODIFY COLUMN type ENUM('order_update', 'token_ready', 'promotional', 'system', 'order_expired') NOT NULL
      `);
      console.log("✅ Added 'order_expired' to notifications.type ENUM");
    } catch (err) {
      if (!err.message.includes("same as current") && !err.message.includes("Duplicate")) {
        console.log("ℹ️ Could not modify notifications.type ENUM:", err.message);
        console.error("   Run this SQL manually: ALTER TABLE notifications MODIFY COLUMN type ENUM('order_update', 'token_ready', 'promotional', 'system', 'order_expired') NOT NULL;");
      }
    }

    console.log("📋 All tables created successfully");
  } catch (err) {
    console.error("❌ Error creating tables:", err);
    throw err;
  }
}

async function initializeDatabase() {
  try {
    console.log("🔄 Attempting to connect to database...");
    
    // Test connection first
    const connection = await pool.getConnection();
    console.log("✅ Database connection established");
    
    // For Aiven and other cloud providers, database already exists
    // Only create if it doesn't exist (for local development)
    if (process.env.DB_HOST === "localhost" || !process.env.DB_HOST?.includes('aivencloud.com')) {
      try {
        await connection.execute("CREATE DATABASE IF NOT EXISTS campuseats");
        await connection.changeUser({ database: "campuseats" });
      } catch (dbError) {
        // Database might already exist or we might not have CREATE permission
        console.log("ℹ️  Using existing database or no CREATE permission");
        if (dbConfig.database) {
          await connection.changeUser({ database: dbConfig.database });
        }
      }
    } else {
      // For cloud providers, use the database from config
      if (dbConfig.database) {
        await connection.changeUser({ database: dbConfig.database });
      }
    }
    
    await createTables(connection);
    connection.release();
    console.log("🗄️ Database initialized successfully");
    return true;
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    console.error("   Error code:", error.code);
    console.error("   Error message:", error.message);
    
    // Provide helpful error messages
    if (error.code === 'ENOTFOUND') {
      console.error("   ⚠️  DNS lookup failed - check DB_HOST is correct");
      console.error("   ⚠️  Ensure database service is running and accessible");
    } else if (error.code === 'ECONNREFUSED') {
      console.error("   ⚠️  Connection refused - check DB_HOST and DB_PORT");
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error("   ⚠️  Access denied - check DB_USER and DB_PASSWORD");
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error("   ⚠️  Database doesn't exist - check DB_NAME");
    }
    
    console.log(
      "⚠️  Server will continue without MySQL - API calls will return errors",
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

// ======================== IMAGE UPLOAD ROUTE =========================
// Upload image to Cloudinary and return URL
app.post("/api/upload-image", upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: "No image file provided" 
      });
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      console.warn("⚠️ Cloudinary not configured - returning base64 fallback");
      // Fallback: return base64 if Cloudinary not configured
      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      return res.json({
        success: true,
        data: {
          url: base64,
          secure_url: base64,
          public_id: null,
        },
        warning: "Cloudinary not configured - using base64 fallback"
      });
    }

    // Upload to Cloudinary
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'campuseats', // Organize images in a folder
          resource_type: 'auto', // Auto-detect image type
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            return reject(error);
          }
          
          res.json({
            success: true,
            data: {
              url: result.secure_url,
              public_id: result.public_id,
            },
          });
          resolve();
        }
      );

      // Pipe the buffer to Cloudinary
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });
  } catch (error) {
    console.error("Image upload error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to upload image" 
    });
  }
});

// Alternative: Accept base64 image and upload to Cloudinary
app.post("/api/upload-image-base64", async (req, res) => {
  try {
    const { image } = req.body; // Base64 string (data:image/...;base64,...)
    
    if (!image) {
      return res.status(400).json({ 
        success: false, 
        error: "No image data provided" 
      });
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      // Fallback: return the base64 as-is
      return res.json({
        success: true,
        data: {
          url: image,
          secure_url: image,
          public_id: null,
        },
        warning: "Cloudinary not configured - using base64 fallback"
      });
    }

    // Upload base64 to Cloudinary
    const result = await cloudinary.uploader.upload(image, {
      folder: 'campuseats',
      resource_type: 'auto',
    });

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        public_id: result.public_id,
      },
    });
  } catch (error) {
    console.error("Base64 image upload error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to upload image" 
    });
  }
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

    // Handle port already in use error
    httpServer.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use.`);
        console.log('💡 Waiting for port to be released... (nodemon will retry automatically)');
        // Don't exit - let nodemon handle the restart after file changes
      } else {
        console.error("❌ Server error:", error);
        process.exit(1);
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
    console.log("📝 Shop creation request received:", {
      body: { ...req.body, image: req.body.image ? '[image provided]' : null }
    });

    const { name, description, category, location, phone, image, ownerId, upiId, closed } = req.body;

    // Validate required fields
    if (!name || !category || !ownerId) {
      const missing = [];
      if (!name) missing.push('name');
      if (!category) missing.push('category');
      if (!ownerId) missing.push('ownerId');
      
      console.error("❌ Missing required fields:", missing);
      return res.status(400).json({ 
        success: false, 
        error: `Missing required fields: ${missing.join(', ')}` 
      });
    }

    // Remove category validation - accept any category value
    // The database will accept any VARCHAR(100) value
    console.log("✅ Required fields validated");

    // Verify owner exists
    try {
      const [users] = await pool.execute("SELECT id FROM users WHERE id = ?", [ownerId]);
      if (users.length === 0) {
        console.error("❌ Owner not found:", ownerId);
        return res.status(400).json({ 
          success: false, 
          error: "Invalid ownerId: User not found" 
        });
      }
      console.log("✅ Owner verified:", ownerId);
    } catch (dbError) {
      console.error("❌ Database error checking owner:", dbError);
      return res.status(500).json({ 
        success: false, 
        error: "Database error while verifying owner" 
      });
    }

    const id = `shop_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    console.log("🆔 Generated shop ID:", id);

    // Convert closed to MySQL boolean (0 or 1)
    const closedValue = closed === true ? 1 : 0;

    // Prepare values for insertion
    const insertValues = [
      id, 
      name, 
      description || null, 
      category, 
      location || null, 
      phone || null, 
      image || null, 
      ownerId, 
      upiId || null, 
      closedValue
    ];

    console.log("💾 Inserting shop with values:", {
      id,
      name,
      category,
      ownerId,
      hasDescription: !!description,
      hasLocation: !!location,
      hasPhone: !!phone,
      hasImage: !!image,
      hasUpiId: !!upiId,
      closed: closedValue
    });

    await pool.execute(
      `
      INSERT INTO shops (id, name, description, category, location, phone, image, owner_id, upi_id, closed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      insertValues
    );

    console.log("✅ Shop inserted successfully");

    const [shops] = await pool.execute("SELECT * FROM shops WHERE id = ?", [id]);

    if (shops.length === 0) {
      console.error("❌ Shop created but not found after insertion");
      return res.status(500).json({ 
        success: false, 
        error: "Shop created but could not be retrieved" 
      });
    }

    console.log("✅ Shop retrieved successfully:", shops[0].name);
    res.json({ success: true, data: shops[0] });
  } catch (error) {
    console.error("❌ Create shop error:", error);
    console.error("Error details:", {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      message: error.message,
      stack: error.stack
    });
    
    // Provide more specific error messages
    let errorMessage = error.message || "Unknown error occurred";
    
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      errorMessage = "Invalid ownerId: User does not exist";
    } else if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = "Shop with this name already exists";
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      errorMessage = `Invalid field in request: ${error.sqlMessage || error.message}`;
    } else if (error.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
      errorMessage = `Invalid value for field: ${error.sqlMessage || error.message}`;
    } else if (error.code === 'ER_DATA_TOO_LONG') {
      errorMessage = `Data too long for field: ${error.sqlMessage || error.message}`;
    }
    
    res.status(400).json({ 
      success: false, 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      } : undefined
    });
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
    // Calculate active tokens (only orders with payment completed - not just approved)
    const [shops] = await pool.execute(
      `SELECT s.*, 
        (SELECT COUNT(*) FROM orders o WHERE o.shop_id = s.id AND o.status IN ('approved', 'preparing', 'ready') AND o.payment_status = 'completed' AND DATE(o.created_at) = CURDATE()) AS tokens
      FROM shops s WHERE s.id = ?`,
      [id]
    );
    if (shops.length === 0) {
      return res.status(404).json({ success: false, error: "Shop not found" });
    }
    let shop = shops[0];
    shop.activeTokens = shop.tokens || 0;
    res.json({ success: true, data: shop });
  } catch (error) {
    console.error("Get shop error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/shops/owner/:ownerId", async (req, res) => {
  try {
    const { ownerId } = req.params;
    // Calculate active tokens (only orders with payment completed - not just approved)
    const [shops] = await pool.execute(
      `SELECT s.*, 
        (SELECT COUNT(*) FROM orders o WHERE o.shop_id = s.id AND o.status IN ('approved', 'preparing', 'ready') AND o.payment_status = 'completed' AND DATE(o.created_at) = CURDATE()) AS tokens
      FROM shops s WHERE s.owner_id = ? AND s.is_active = TRUE`,
      [ownerId],
    );
    const shopsWithTokens = shops.map((shop) => ({ ...shop, activeTokens: shop.tokens || 0 }));
    res.json({ success: true, data: shopsWithTokens });
  } catch (error) {
    console.error("Get shops by owner error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/shops", async (req, res) => {
  try {
    // Fetch all shops and calculate tokens dynamically - only count orders with payment completed
    const [shops] = await pool.execute(
      `SELECT s.*, 
        (SELECT COUNT(*) FROM orders o WHERE o.shop_id = s.id AND o.status IN ('approved', 'preparing', 'ready') AND o.payment_status = 'completed' AND DATE(o.created_at) = CURDATE()) AS tokens
      FROM shops s WHERE s.is_active = TRUE`
    );
    // Remove upi_id from all shops in public list
    const sanitized = shops.map((shop) => ({ ...shop, upi_id: undefined, tokens: shop.tokens || 0, activeTokens: shop.tokens || 0 }));
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

// === AUTO-EXPIRE / AUTO-CANCEL UNPAID APPROVED ORDERS ===
// After 5 minutes in "approved" without successful payment, move orders out of the active queue
// so they appear in history for both students and shopkeepers.
setInterval(async () => {
  try {
    const [orders] = await pool.execute(
      `SELECT * FROM orders 
       WHERE status = 'approved' 
         AND (payment_status IS NULL OR payment_status = 'pending')
         AND TIMESTAMPDIFF(MINUTE, updated_at, NOW()) >= 5`
    );

    for (const order of orders) {
      const isNeverPaid = order.payment_status === null;
      const newStatus = isNeverPaid ? 'expired' : 'cancelled';

      // Update order status + payment status
      await pool.execute(
        `UPDATE orders 
           SET status = ?, 
               payment_status = 'failed', 
               updated_at = NOW() 
         WHERE id = ?`,
        [newStatus, order.id]
      );

      const notificationTitle = isNeverPaid ? 'Order Expired' : 'Order Cancelled';
      const notificationMessage = isNeverPaid
        ? 'Your order expired because payment was not completed within 5 minutes.'
        : 'Your order was cancelled because payment was not completed within 5 minutes.';
      const notificationType = isNeverPaid ? 'order_expired' : 'order_update';

      // Insert notification for the user
      await pool.execute(
        `INSERT INTO notifications (id, user_id, title, message, type, is_read, metadata, created_at) 
         VALUES (?, ?, ?, ?, ?, false, ?, NOW())`,
        [
          `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          order.user_id,
          notificationTitle,
          notificationMessage,
          notificationType,
          JSON.stringify({ order_id: order.id, status: newStatus, reason: 'payment timeout' }),
        ]
      );

      // Emit socket event for real-time update on the student dashboard
      io.emit('order_status_update', {
        orderId: order.id,
        status: newStatus,
        userId: order.user_id,
        order: { ...order, status: newStatus, payment_status: 'failed' },
      });

      console.log(`[AUTO-EXPIRE] Order ${order.id} moved to status: ${newStatus} due to payment timeout.`);
    }
  } catch (err) {
    console.error('[AUTO-EXPIRE] Error auto-updating unpaid approved orders:', err);
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
  // Calculate from created_at to actual_pickup_time (if available), or updated_at (when marked as fulfilled), or use preparation_time field
  const [prepRows] = await pool.execute(
    `SELECT AVG(
      CASE 
        WHEN actual_pickup_time IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, created_at, actual_pickup_time)
        WHEN updated_at IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, created_at, updated_at)
        WHEN preparation_time IS NOT NULL THEN preparation_time
        ELSE NULL
      END
    ) as avg_fulfillment 
     FROM orders 
     WHERE shop_id = ? AND status = 'fulfilled' AND created_at BETWEEN ? AND ?`,
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
    console.log("📝 Order creation request received:", {
      body: { ...req.body, items: req.body.items ? `[${req.body.items.length} items]` : null }
    });

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

    // Validate required fields
    if (!user_id || !shop_id || !items || items.length === 0) {
      const missing = [];
      if (!user_id) missing.push('user_id');
      if (!shop_id) missing.push('shop_id');
      if (!items || items.length === 0) missing.push('items');
      
      console.error("❌ Missing required fields:", missing);
      return res.status(400).json({ 
        success: false, 
        error: `Missing required fields: ${missing.join(', ')}` 
      });
    }

    // Validate shop exists
    const [shops] = await pool.execute("SELECT id FROM shops WHERE id = ?", [shop_id]);
    if (shops.length === 0) {
      console.error("❌ Shop not found:", shop_id);
      return res.status(400).json({ 
        success: false, 
        error: "Shop not found" 
      });
    }

    // Validate user exists
    const [users] = await pool.execute("SELECT id FROM users WHERE id = ?", [user_id]);
    if (users.length === 0) {
      console.error("❌ User not found:", user_id);
      return res.status(400).json({ 
        success: false, 
        error: "User not found" 
      });
    }

    const id = `order_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    console.log("🆔 Generated order ID:", id);

    // Get the current max order_number for this shop
    let nextOrderNumber = 1;
    try {
      const [rows] = await pool.execute(
        "SELECT MAX(order_number) as maxOrder FROM orders WHERE shop_id = ?",
        [shop_id]
      );
      nextOrderNumber = (rows[0]?.maxOrder || 0) + 1;
      console.log("🔢 Next order number for shop:", nextOrderNumber);
    } catch (err) {
      console.warn("⚠️ Could not get max order_number, using 1:", err.message);
      // If order_number column doesn't exist yet, it will be added by migration
      // Continue with order_number = 1
    }

    const insertValues = [
      id,
      user_id,
      shop_id,
      JSON.stringify(items),
      total_amount ?? 0,
      status ?? 'pending_approval',
      payment_status ?? 'pending',
      token_number ?? null,
      estimated_pickup_time ?? null,
      notes ?? null,
      nextOrderNumber
    ];

    console.log("💾 Inserting order with values:", {
      id,
      user_id,
      shop_id,
      itemsCount: items.length,
      total_amount,
      order_number: nextOrderNumber
    });

    await pool.execute(
      `INSERT INTO orders (id, user_id, shop_id, items, total_amount, status, payment_status, token_number, estimated_pickup_time, notes, order_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
      insertValues
    );

    console.log("✅ Order inserted successfully");

    const [orders] = await pool.execute("SELECT * FROM orders WHERE id = ?", [id]);
    
    if (orders.length === 0) {
      console.error("❌ Order created but not found after insertion");
      return res.status(500).json({ 
        success: false, 
        error: "Order created but could not be retrieved" 
      });
    }

    console.log("✅ Order retrieved successfully:", orders[0].id);
    res.json({ success: true, data: orders[0] });
  } catch (error) {
    console.error("❌ Create order error:", error);
    console.error("Error details:", {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      message: error.message
    });
    
    // Provide more specific error messages
    let errorMessage = error.message || "Unknown error occurred";
    
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      errorMessage = "Invalid user_id or shop_id: User or shop does not exist";
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      errorMessage = `Invalid field in request: ${error.sqlMessage || error.message}`;
    } else if (error.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
      errorMessage = `Invalid value for field: ${error.sqlMessage || error.message}`;
    }
    
    res.status(400).json({ 
      success: false, 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      } : undefined
    });
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
    
    console.log("📝 Order status update request:", {
      orderId: id,
      status,
      payment_status: payment_status === null ? 'NULL' : payment_status,
      payment_status_type: typeof payment_status,
      preparation_time,
      hasEstimatedPickupTime: !!estimated_pickup_time,
      hasRejectionReason: !!rejection_reason,
      hasPaymentScreenshot: !!payment_screenshot,
      fullBody: req.body
    });

    let updateFields = [];
    let params = [];
    let tokenNumberToSet = null;

    // Handle status update
    if (status !== undefined) { 
      updateFields.push("status = ?"); 
      params.push(status); 
    }

    // Handle payment_status update
    // null means reset payment status (for approved orders before payment)
    // This allows Pay Now button to show (payment_status is null, not 'pending')
    if (payment_status !== undefined) { 
      if (payment_status === null) {
        // For NULL values, we MUST use SQL NULL directly (not as parameter)
        // MySQL ENUM columns don't accept NULL via parameters even if column allows NULL
        // This is a MySQL limitation - we must use literal NULL in SQL
        updateFields.push("payment_status = NULL");
        // Don't add to params array for NULL - this is critical!
        console.log("🔧 Setting payment_status to NULL (using SQL literal)");
      } else {
        // For actual enum values, use parameterized query
        updateFields.push("payment_status = ?");
        params.push(payment_status);
        console.log(`🔧 Setting payment_status to: ${payment_status}`);
      }
      // NULL means payment not started yet (show Pay Now button)
      // 'pending' means payment screenshot uploaded (waiting for approval)
      // 'completed' means payment approved
    }

    // Handle estimated_pickup_time - can be provided directly or calculated from preparation_time
    if (estimated_pickup_time !== undefined) {
      updateFields.push("estimated_pickup_time = ?");
      // Convert ISO 8601 format to MySQL DATETIME format (YYYY-MM-DD HH:mm:ss)
      let mysqlDateTime = estimated_pickup_time;
      if (estimated_pickup_time && typeof estimated_pickup_time === 'string') {
        try {
          const date = new Date(estimated_pickup_time);
          if (!isNaN(date.getTime())) {
            // Format as MySQL DATETIME: YYYY-MM-DD HH:mm:ss
            mysqlDateTime = date.toISOString().slice(0, 19).replace('T', ' ');
          }
        } catch (e) {
          console.warn("⚠️ Could not parse estimated_pickup_time:", e);
        }
      }
      params.push(mysqlDateTime ?? null);
    } else if (preparation_time !== undefined && preparation_time !== null) {
      // Convert preparation_time (minutes) to estimated_pickup_time (timestamp)
      const pickupDate = new Date(Date.now() + preparation_time * 60000);
      // Format as MySQL DATETIME: YYYY-MM-DD HH:mm:ss (no milliseconds, no timezone)
      const pickupTime = pickupDate.toISOString().slice(0, 19).replace('T', ' ');
      updateFields.push("estimated_pickup_time = ?");
      params.push(pickupTime);
      console.log(`⏰ Calculated pickup time: ${pickupTime} from ${preparation_time} minutes`);
    }

    // Handle rejection_reason
    if (rejection_reason !== undefined) { 
      updateFields.push("rejection_reason = ?"); 
      params.push(rejection_reason ?? null); 
    }

    // Handle payment_screenshot
    if (payment_screenshot !== undefined) { 
      updateFields.push("payment_screenshot = ?"); 
      params.push(payment_screenshot ?? null); 
    }

    // Note: transaction_id and preparation_time columns don't exist in orders table
    // preparation_time is converted to estimated_pickup_time above
    // transaction_id is ignored (not stored in orders table)

    // If moving to 'preparing', assign next token_number if not already set
    if (status === 'preparing') {
      try {
        // Get the order to check if token_number is already set
        const [orders] = await pool.execute("SELECT * FROM orders WHERE id = ?", [id]);
        if (orders.length === 0) {
          return res.status(404).json({ success: false, error: "Order not found" });
        }
        const order = orders[0];
        if (!order.token_number) {
          // Get current max token_number for this shop for today
          const [rows] = await pool.execute(
            "SELECT MAX(token_number) as maxToken FROM orders WHERE shop_id = ? AND DATE(created_at) = CURDATE()",
            [order.shop_id]
          );
          tokenNumberToSet = (rows[0]?.maxToken || 0) + 1;
          updateFields.push("token_number = ?");
          params.push(tokenNumberToSet);
          console.log(`🎫 Assigned token number: ${tokenNumberToSet}`);
        }
      } catch (err) {
        console.warn("⚠️ Could not assign token number:", err.message);
        // Continue without token number assignment
      }
    }

    if (updateFields.length === 0) {
      console.error("❌ No fields to update");
      return res.status(400).json({ success: false, error: "No fields to update" });
    }

    params.push(id);
    
    // Build the SQL query
    const sqlQuery = `UPDATE orders SET ${updateFields.join(", ")}, updated_at = NOW() WHERE id = ?`;
    
    console.log("💾 Updating order with SQL:", sqlQuery);
    console.log("📊 Parameters count:", params.length);
    console.log("📊 Parameters:", params.map((p, i) => {
      if (p === null) return `[${i}]: NULL`;
      if (typeof p === 'string' && p.length > 50) return `[${i}]: ${p.substring(0, 50)}...`;
      return `[${i}]: ${p}`;
    }));

    try {
      await pool.execute(sqlQuery, params);
    } catch (sqlError) {
      console.error("❌ SQL Execution Error:", {
        code: sqlError.code,
        errno: sqlError.errno,
        sqlState: sqlError.sqlState,
        sqlMessage: sqlError.sqlMessage,
        sql: sqlQuery,
        params: params
      });
      throw sqlError;
    }

    console.log("✅ Order updated successfully");

    const [orders] = await pool.execute("SELECT * FROM orders WHERE id = ?", [id]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, error: "Order not found after update" });
    }

    const updatedOrder = orders[0];
    
    // Emit socket event for order status update
    io.emit('order_status_update', {
      orderId: id,
      status: updatedOrder.status,
      userId: updatedOrder.user_id,
      shopId: updatedOrder.shop_id,
      order: updatedOrder
    });

    // If order was completed/cancelled, or payment status was just changed to completed, update and broadcast token count
    // We need to check if payment_status was updated to 'completed' (it will be in the request body)
    const paymentJustCompleted = payment_status === 'completed' && ['approved', 'preparing', 'ready'].includes(updatedOrder.status);
    const shouldUpdateTokens = 
      ['fulfilled', 'cancelled', 'collected'].includes(updatedOrder.status) ||
      paymentJustCompleted;
    
    if (shouldUpdateTokens) {
      try {
        // Calculate new active token count for this shop (only orders with payment completed)
        const [tokenRows] = await pool.execute(
          `SELECT COUNT(*) as activeTokens FROM orders 
           WHERE shop_id = ? AND status IN ('approved', 'preparing', 'ready') 
           AND payment_status = 'completed' AND DATE(created_at) = CURDATE()`,
          [updatedOrder.shop_id]
        );
        const activeTokens = tokenRows[0]?.activeTokens || 0;
        
        // Broadcast token count update to all clients
        io.emit('shop_tokens_update', {
          shopId: updatedOrder.shop_id,
          activeTokens: activeTokens
        });
        console.log(`🎫 Updated token count for shop ${updatedOrder.shop_id}: ${activeTokens}`);
      } catch (tokenError) {
        console.error("Error updating token count:", tokenError);
      }
    }

    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error("❌ Update order status error:", error);
    console.error("Error details:", {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      message: error.message
    });
    
    // Provide more specific error messages
    let errorMessage = error.message || "Unknown error occurred";
    
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      errorMessage = `Invalid field in request: ${error.sqlMessage || error.message}`;
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      errorMessage = "Database table not found";
    } else if (error.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
      if (error.sqlMessage?.includes('datetime') || error.sqlMessage?.includes('estimated_pickup_time')) {
        errorMessage = `Invalid datetime format: ${error.sqlMessage || error.message}. Please ensure datetime values are in MySQL format (YYYY-MM-DD HH:mm:ss).`;
      } else if (error.sqlMessage?.includes('ENUM')) {
        errorMessage = `Invalid ENUM value: ${error.sqlMessage || error.message}. The payment_status column may not allow NULL. Please check database migration.`;
      } else {
        errorMessage = `Invalid value format: ${error.sqlMessage || error.message}`;
      }
    }
    
    // Always include error details for debugging
    res.status(400).json({ 
      success: false, 
      error: errorMessage,
      details: {
        code: error.code,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        sqlQuery: (typeof sqlQuery !== 'undefined' ? sqlQuery : 'N/A')
      }
    });
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

// Developer Dashboard - Get all users (students and shopkeepers)
app.get("/api/developer/users", async (req, res) => {
  try {
    const { role } = req.query;
    let query = "SELECT * FROM users WHERE 1=1";
    const params = [];
    
    if (role) {
      query += " AND role = ?";
      params.push(role);
    }
    
    query += " ORDER BY created_at DESC";
    
    const [users] = await pool.execute(query, params);
    
    // Get last login info and order stats for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      // Get user's orders
      const [orders] = await pool.execute(
        "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
        [user.id]
      );
      
      const totalAmount = orders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
      const totalOrders = orders.length;
      
      // Get last login (we'll use updated_at or created_at as proxy since we don't track logins)
      const lastLogin = user.updated_at || user.created_at;
      
      return {
        ...user,
        totalOrders,
        totalAmount,
        lastLogin,
        orders: orders.slice(0, 10), // Last 10 orders
      };
    }));
    
    res.json({ success: true, data: usersWithStats });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Developer Dashboard - Get user details with full order history
app.get("/api/developer/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Get user
    const [users] = await pool.execute("SELECT * FROM users WHERE id = ?", [userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    
    const user = users[0];
    
    // Get all orders for user
    let ordersQuery = "SELECT * FROM orders WHERE user_id = ?";
    const params = [userId];
    
    if (startDate && endDate) {
      ordersQuery += " AND created_at BETWEEN ? AND ?";
      params.push(startDate, endDate);
    }
    
    ordersQuery += " ORDER BY created_at DESC";
    
    const [orders] = await pool.execute(ordersQuery, params);
    
    const totalAmount = orders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
    const totalOrders = orders.length;
    
    res.json({
      success: true,
      data: {
        ...user,
        totalOrders,
        totalAmount,
        orders,
        lastLogin: user.updated_at || user.created_at,
      },
    });
  } catch (error) {
    console.error("Get user details error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Developer Dashboard - Block/Unblock user
app.put("/api/developer/users/:userId/block", async (req, res) => {
  try {
    const { userId } = req.params;
    const { isBlocked, reason } = req.body;
    
    // Update user's isActive status
    await pool.execute(
      "UPDATE users SET is_active = ? WHERE id = ?",
      [isBlocked ? 0 : 1, userId]
    );
    
    res.json({
      success: true,
      message: isBlocked ? "User blocked successfully" : "User unblocked successfully",
    });
  } catch (error) {
    console.error("Block user error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Developer Dashboard - Get shop owners with stats
app.get("/api/developer/shopowners", async (req, res) => {
  try {
    const [shopOwners] = await pool.execute(
      "SELECT * FROM users WHERE role = 'shopkeeper' ORDER BY created_at DESC"
    );
    
    // Get stats for each shop owner
    const ownersWithStats = await Promise.all(shopOwners.map(async (owner) => {
      // Get shops owned by this owner
      const [shops] = await pool.execute(
        "SELECT * FROM shops WHERE owner_id = ?",
        [owner.id]
      );
      
      // Get all orders from all shops
      let totalOrders = 0;
      let totalRevenue = 0;
      
      for (const shop of shops) {
        const [orders] = await pool.execute(
          "SELECT * FROM orders WHERE shop_id = ? AND status = 'fulfilled'",
          [shop.id]
        );
        totalOrders += orders.length;
        totalRevenue += orders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
      }
      
      return {
        ...owner,
        shopsCount: shops.length,
        totalOrders,
        totalRevenue,
        lastLogin: owner.updated_at || owner.created_at,
        shops: shops,
      };
    }));
    
    res.json({ success: true, data: ownersWithStats });
  } catch (error) {
    console.error("Get shop owners error:", error);
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

// ======================== RAZORPAY PAYMENT ROUTES =========================
// Create Razorpay order
app.post("/api/razorpay/create-order", async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(500).json({
        success: false,
        error: "Razorpay is not configured. Please check your environment variables.",
      });
    }

    const { amount, currency = "INR", orderId, customerName, customerEmail } = req.body;

    if (!amount || !orderId) {
      return res.status(400).json({
        success: false,
        error: "Amount and orderId are required",
      });
    }

    // Convert amount to paise (Razorpay expects amount in smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    // Generate receipt (max 40 characters as per Razorpay requirement)
    // Format: order_<last8chars>_<timestamp> (ensures it's always <= 40 chars)
    const orderIdShort = orderId.length > 8 ? orderId.slice(-8) : orderId;
    const timestamp = Date.now().toString().slice(-10); // Last 10 digits of timestamp
    const receipt = `ord_${orderIdShort}_${timestamp}`.substring(0, 40); // Ensure max 40 chars

    const options = {
      amount: amountInPaise,
      currency: currency,
      receipt: receipt,
      notes: {
        orderId: orderId,
        customerName: customerName || "Customer",
        customerEmail: customerEmail || "",
      },
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.json({
      success: true,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
      },
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create payment order",
      details: error.message,
    });
  }
});

// Verify Razorpay payment
app.post("/api/razorpay/verify-payment", async (req, res) => {
  try {
    if (!razorpay || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        error: "Razorpay is not configured. Please check your environment variables.",
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({
        success: false,
        error: "Missing required payment verification parameters",
      });
    }

    // Create signature for verification
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: "Payment verification failed - Invalid signature",
      });
    }

    // Update order status in database - set payment_status to completed and status to preparing
    const connection = await pool.getConnection();
    try {
      // Get order details to set preparation time
      const [orderRows] = await connection.execute(
        `SELECT shop_id, preparation_time FROM orders WHERE id = ?`,
        [orderId]
      );
      
      const shopId = orderRows.length > 0 ? orderRows[0].shop_id : null;
      const prepTime = orderRows[0]?.preparation_time || 15; // Default 15 minutes
      
      // Calculate estimated pickup time
      const pickupDate = new Date(Date.now() + prepTime * 60000);
      const pickupTime = pickupDate.toISOString().slice(0, 19).replace('T', ' ');

      // Update order: payment completed and status to preparing
      await connection.execute(
        `UPDATE orders 
         SET payment_status = 'completed', 
             status = 'preparing',
             payment_transaction_id = ?,
             estimated_pickup_time = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [razorpay_payment_id, pickupTime, orderId]
      );

      // Create notification for user
      const [userRows] = await connection.execute(
        `SELECT user_id FROM orders WHERE id = ?`,
        [orderId]
      );
      const userId = userRows[0]?.user_id;
      
      if (userId) {
        await connection.execute(
          `INSERT INTO notifications (id, user_id, title, message, type, is_read, metadata, created_at) 
           VALUES (?, ?, ?, ?, ?, false, ?, NOW())`,
          [
            `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            userId,
            'Payment Successful',
            `Your payment has been confirmed! Your order is now being prepared. Estimated time: ${prepTime} minutes.`,
            'order_update',
            JSON.stringify({ order_id: orderId, status: 'preparing', payment_status: 'completed', preparation_time: prepTime }),
          ]
        );
      }

      // Emit socket event for real-time update
      io.emit("order_status_update", {
        orderId: orderId,
        status: "preparing",
        payment_status: "completed",
        payment_transaction_id: razorpay_payment_id,
        userId: userId,
        shopId: shopId,
        order: {
          id: orderId,
          shop_id: shopId,
          status: 'preparing',
          payment_status: 'completed',
          payment_transaction_id: razorpay_payment_id,
        },
      });

      // Emit token update
      if (shopId) {
        io.emit("shop_tokens_update", { shopId });
      }
    } finally {
      connection.release();
    }

    res.json({
      success: true,
      message: "Payment verified successfully",
      payment_id: razorpay_payment_id,
    });
  } catch (error) {
    console.error("Razorpay payment verification error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify payment",
      details: error.message,
    });
  }
});

// ======================== FEEDBACK EMAIL ROUTE =========================
// Send feedback email using Resend API
app.post("/api/send-feedback", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate input
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: "Name, email, and message are required",
      });
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API) {
      console.error("⚠️ RESEND_API not configured");
      return res.status(500).json({
        success: false,
        error: "Email service not configured",
      });
    }

    // Initialize Resend
    const resend = new Resend(process.env.RESEND_API);

    // Send email
    const { data, error } = await resend.emails.send({
      from: "TakeAway Feedback <onboarding@resend.dev>", // You can change this to your verified domain
      to: ["akshadvengurlekar35@gmail.com"],
      subject: `New Feedback from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f97316;">New Feedback Received</h2>
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <p style="background-color: white; padding: 15px; border-left: 4px solid #f97316; margin-top: 10px;">
              ${message.replace(/\n/g, "<br>").replace(/</g, "&lt;").replace(/>/g, "&gt;")}
            </p>
          </div>
          <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
            This feedback was submitted through the TakeAway website.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to send email",
        details: error.message,
      });
    }

    res.json({
      success: true,
      message: "Feedback sent successfully",
      data: data,
    });
  } catch (err) {
    console.error("Error sending feedback email:", err);
    res.status(500).json({
      success: false,
      error: "Failed to send feedback email",
      details: err.message,
    });
  }
});

// Translation endpoint removed - now using react-i18next with static translation files

// Serve static files from dist (if frontend is built and served from backend)
// Uncomment the following lines if you want to serve frontend from backend:
// app.use(express.static('dist'));
// app.get(/^(?!\/api).*/, (req, res) => {
//   res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
// });

// Note: On Render, frontend is served separately, so this catch-all is not needed

startServer();

process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down server...");
  await pool.end();
  process.exit(0);
});

export { io };
