// Database models and interfaces for the TakeAway application

export interface DatabaseUser {
  id: string;
  email: string;
  password: string; // hashed
  name: string;
  role: "student" | "shopkeeper" | "developer";
  phone?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface DatabaseShop {
  id: string;
  name: string;
  description: string;
  image?: string;
  category: string;
  ownerId: string; // references User.id
  isActive: boolean;
  closed: boolean; // <-- Added this line
  location: string;
  phone?: string;
  openingHours: {
    monday: { open: string; close: string; isOpen: boolean };
    tuesday: { open: string; close: string; isOpen: boolean };
    wednesday: { open: string; close: string; isOpen: boolean };
    thursday: { open: string; close: string; isOpen: boolean };
    friday: { open: string; close: string; isOpen: boolean };
    saturday: { open: string; close: string; isOpen: boolean };
    sunday: { open: string; close: string; isOpen: boolean };
  };
  crowdLevel: "low" | "medium" | "high";
  estimatedWaitTime: number;
  activeTokens: number;
  rating: number;
  totalRatings: number;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseMenuItem {
  id: string;
  shopId: string; // references Shop.id
  name: string;
  description: string;
  price: number;
  image?: string;
  category: string;
  isAvailable: boolean;
  preparationTime: number; // in minutes
  ingredients?: string[];
  allergens?: string[];
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  stockQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseOrder {
  id: string;
  userId: string; // references User.id
  shopId: string; // references Shop.id
  items: {
    menuItemId: string;
    quantity: number;
    price: number; // price at time of order
    notes?: string;
  }[];
  totalAmount: number;
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "fulfilled"
    | "cancelled"
    | "rejected";
  tokenNumber: number;
  estimatedPickupTime: string;
  actualPickupTime?: string;
  paymentStatus: "pending" | "completed" | "failed" | "refunded";
  paymentMethod?: "cash" | "card" | "digital_wallet";
  notes?: string;
  rating?: number;
  review?: string;
  createdAt: string;
  updatedAt: string;
  rejection_reason?: string;
}

export interface DatabaseToken {
  id: string;
  shopId: string;
  orderId: string;
  tokenNumber: number;
  status: "active" | "called" | "fulfilled" | "expired";
  estimatedTime: string;
  actualTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "order_update" | "token_ready" | "promotional" | "system";
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface DatabaseShopAnalytics {
  id: string;
  shopId: string;
  date: string; // YYYY-MM-DD
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  averagePreparationTime: number;
  customerRating: number;
  peakHours: string[];
  popularItems: {
    itemId: string;
    quantity: number;
  }[];
  createdAt: string;
}

// API Response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Database connection and utility functions
export class Database {
  private static instance: Database;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async connect(): Promise<void> {
    try {
      // In a real application, this would connect to MongoDB or your preferred database
      // Connecting to database

      // Initialize database tables/collections if they don't exist
      await this.initializeTables();

      this.isConnected = true;
      // Database connected successfully
    } catch (error) {
      console.error("Database connection failed:", error);
      throw new Error("Failed to connect to database");
    }
  }

  private async initializeTables(): Promise<void> {
    // Initialize database schemas/tables
    // In a real app, this would create database tables or MongoDB collections

    const tables = [
      "users",
      "shops",
      "menu_items",
      "orders",
      "tokens",
      "notifications",
      "shop_analytics",
    ];

    for (const table of tables) {
      // Initializing table
      // Create table schema here
    }
  }

  isConnectionActive(): boolean {
    return this.isConnected;
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    // Database disconnected
  }
}

// Minimal MockDatabase for localStorage-based mock data
export const MockDatabase = {
  async update(table, id, data) {
    const key = `campuseats_${table}`;
    const items = JSON.parse(localStorage.getItem(key) || "[]");
    const idx = items.findIndex((item) => item.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...data };
      localStorage.setItem(key, JSON.stringify(items));
      return items[idx];
    }
    return null;
  },
  async create(table, data) {
    const key = `campuseats_${table}`;
    const items = JSON.parse(localStorage.getItem(key) || "[]");
    items.push(data);
    localStorage.setItem(key, JSON.stringify(items));
    return data;
  },
  async findMany(table, query = {}) {
    const key = `campuseats_${table}`;
    const items = JSON.parse(localStorage.getItem(key) || "[]");
    return items.filter((item) =>
      Object.entries(query).every(([k, v]) => item[k] === v)
    );
  },
  async findById(table, id) {
    const key = `campuseats_${table}`;
    const items = JSON.parse(localStorage.getItem(key) || "[]");
    return items.find((item) => item.id === id) || null;
  },
};
