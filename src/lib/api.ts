import { User, Shop, MenuItem, Order, CartItem } from "./types";
import { API_BASE_URL } from "./config";

class ApiService {
  // ==============================================================================
  // AUTHENTICATION API
  // ==============================================================================

  static async login(
    email: string,
    password: string,
    role: User["role"],
  ): Promise<{ user: User; token: string }> {
    // Only use real backend API for login
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.error || "Failed to login");
    return result.data;
  }

  static async register(
    email: string,
    password: string,
    name: string,
    role: User["role"],
  ): Promise<{ user: User; token: string }> {
    // Only use real backend API for registration
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, role }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.error || "Failed to register");
    return result.data;
  }

  // ==============================================================================
  // SHOP API
  // ==============================================================================

  static async getShops(): Promise<Shop[]> {
      console.log("🏪 Loading shops from backend API");
      try {
        const response = await fetch(`${API_BASE_URL}/shops`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Failed to fetch shops");
        }
        const dbShops = result.data;
        const shops = dbShops.map((dbShop: any) => ({
          id: dbShop.id,
          name: dbShop.name,
          description: dbShop.description,
          image: dbShop.image || "/placeholder.svg",
          category: dbShop.category,
          ownerId: dbShop.owner_id,
          isActive: dbShop.is_active,
          closed: dbShop.closed === true || dbShop.closed === 1 || dbShop.closed === '1',
          crowdLevel: dbShop.crowd_level || "low",
          estimatedWaitTime: dbShop.estimated_wait_time || 10,
          activeTokens: dbShop.tokens || 0,
          createdAt: dbShop.created_at,
          upiId: dbShop.upi_id,
        }));
        console.log(`✅ Loaded ${shops.length} shops from backend API`);
        return shops;
      } catch (error) {
        console.error("❌ Failed to fetch shops from backend:", error);
        return [];
    }
  }

  static async deleteShop(id: string): Promise<boolean> {
      try {
        const response = await fetch(`${API_BASE_URL}/shops/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Failed to delete shop");
        }
        console.log("✅ Shop deleted successfully from backend");
        return true;
      } catch (error) {
        console.error("❌ Failed to delete shop from backend:", error);
        return false;
    }
  }

  static async getShopById(id: string): Promise<Shop | null> {
      console.log(`🔍 Fetching shop with ID: ${id} from backend API`);
      try {
        const response = await fetch(`${API_BASE_URL}/shops/${id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Failed to fetch shop");
        }
        const dbShop = result.data;
        return {
          id: dbShop.id,
          name: dbShop.name,
          description: dbShop.description,
          image: dbShop.image || "/placeholder.svg",
          category: dbShop.category,
          ownerId: dbShop.owner_id,
          isActive: dbShop.is_active,
          closed: typeof dbShop.closed === 'boolean' ? dbShop.closed : false,
          crowdLevel: dbShop.crowd_level || "low",
          estimatedWaitTime: dbShop.estimated_wait_time || 10,
        activeTokens: dbShop.tokens || 0,
          createdAt: dbShop.created_at,
          upiId: dbShop.upi_id,
        };
      } catch (error) {
        console.error("❌ Failed to fetch shop from backend:", error);
        return null;
    }
  }

  static async createShop(shopData: {
    name: string;
    description: string;
    category: string;
    location: string;
    phone?: string;
    image?: string;
    upiId?: string;
  }): Promise<Shop> {
    // Only use real backend API for creating a shop
    const userData = localStorage.getItem("user_data");
    if (!userData) {
      throw new Error("User not logged in");
    }
    const user = JSON.parse(userData);
    const response = await fetch(`${API_BASE_URL}/shops`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: shopData.name,
        description: shopData.description,
        category: shopData.category,
        location: shopData.location || "Unknown Location",
        phone: shopData.phone || "",
        image: shopData.image || "/placeholder.svg",
        ownerId: user.id,
        upiId: shopData.upiId || "",
      }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.error || "Failed to create shop");
    const dbShop = result.data;
    return {
      id: dbShop.id,
      name: dbShop.name,
      description: dbShop.description,
      image: dbShop.image || "/placeholder.svg",
      category: dbShop.category,
      ownerId: dbShop.owner_id,
      isActive: dbShop.is_active,
      closed: typeof dbShop.closed === 'boolean' ? dbShop.closed : false,
      crowdLevel: dbShop.crowd_level || "low",
      estimatedWaitTime: dbShop.estimated_wait_time || 10,
      activeTokens: dbShop.tokens || 0,
      createdAt: dbShop.created_at,
      upiId: dbShop.upi_id || "",
    };
  }

  static async updateShop(
    id: string,
    shopData: Partial<Shop>,
  ): Promise<Shop | null> {
    const response = await fetch(`${API_BASE_URL}/shops/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(shopData),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.error || "Failed to update shop");
    const dbShop = result.data;
    return {
      id: dbShop.id,
      name: dbShop.name,
      description: dbShop.description,
      image: dbShop.image || "/placeholder.svg",
      category: dbShop.category,
      ownerId: dbShop.owner_id,
      isActive: dbShop.is_active,
      closed: typeof dbShop.closed === 'boolean' ? dbShop.closed : false,
      crowdLevel: dbShop.crowd_level || "low",
      estimatedWaitTime: dbShop.estimated_wait_time || 10,
      activeTokens: dbShop.tokens || 0,
      createdAt: dbShop.created_at,
      upiId: dbShop.upi_id || "",
    };
  }

  static async getShopsByOwner(ownerId: string): Promise<Shop[]> {
      console.log("👤 Loading shops for owner from backend API:", ownerId);
      try {
        const response = await fetch(`${API_BASE_URL}/shops/owner/${ownerId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Failed to fetch shops for owner");
        }
        const dbShops = result.data;
        const shops = dbShops.map((dbShop: any) => ({
          id: dbShop.id,
          name: dbShop.name,
          description: dbShop.description,
          image: dbShop.image || "/placeholder.svg",
          category: dbShop.category,
          ownerId: dbShop.owner_id,
          isActive: dbShop.is_active,
          closed: dbShop.closed === true || dbShop.closed === 1 || dbShop.closed === '1',
          crowdLevel: dbShop.crowd_level || "low",
          estimatedWaitTime: dbShop.estimated_wait_time || 10,
        activeTokens: dbShop.tokens || 0,
          createdAt: dbShop.created_at,
          upiId: dbShop.upi_id,
        }));
        console.log(`✅ Found ${shops.length} shops for owner`);
        return shops;
      } catch (error) {
        console.error("❌ Failed to fetch shops for owner from backend:", error);
        return [];
    }
  }

  // ==============================================================================
  // MENU ITEM API
  // ==============================================================================

  static async getMenuItems(shopId: string): Promise<MenuItem[]> {
    const response = await fetch(`${API_BASE_URL}/shops/${shopId}/menu`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.error || "Failed to fetch menu items");
    return result.data.map((dbItem: any) => ({
      id: dbItem.id,
      shopId: dbItem.shop_id,
      name: dbItem.name,
      description: dbItem.description,
      price: Number(dbItem.price),
      image: dbItem.image || "/placeholder.svg",
      category: dbItem.category,
      isAvailable: dbItem.is_available === true || dbItem.is_available === 1 || dbItem.is_available === '1',
      preparationTime: dbItem.preparation_time,
      createdAt: dbItem.created_at,
    }));
  }

  static async createMenuItem(menuItemData: {
    shopId: string;
    name: string;
    description: string;
    price: number;
    category: string;
    preparationTime: number;
    stockQuantity: number;
    image?: string;
    ingredients?: string[];
    allergens?: string[];
  }): Promise<MenuItem> {
    const response = await fetch(`${API_BASE_URL}/menu-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shop_id: menuItemData.shopId,
        name: menuItemData.name,
        description: menuItemData.description,
        price: menuItemData.price,
        category: menuItemData.category,
        preparation_time: menuItemData.preparationTime,
        stock_quantity: menuItemData.stockQuantity,
        image: menuItemData.image || "/placeholder.svg",
        ingredients: menuItemData.ingredients || [],
        allergens: menuItemData.allergens || [],
        is_available: true,
        nutritional_info: {},
      }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.error || "Failed to create menu item");
    const dbMenuItem = result.data;
    return {
      id: dbMenuItem.id,
      shopId: dbMenuItem.shop_id,
      name: dbMenuItem.name,
      description: dbMenuItem.description,
      price: dbMenuItem.price,
      image: dbMenuItem.image || "/placeholder.svg",
      category: dbMenuItem.category,
      isAvailable: dbMenuItem.is_available,
      preparationTime: dbMenuItem.preparation_time,
      createdAt: dbMenuItem.created_at,
    };
  }

  static async updateMenuItem(id: string, menuItemData: any): Promise<MenuItem | null> {
    const response = await fetch(`${API_BASE_URL}/menu-items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(menuItemData),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.error || "Failed to update menu item");
    const dbMenuItem = result.data;
    return {
      id: dbMenuItem.id,
      shopId: dbMenuItem.shop_id,
      name: dbMenuItem.name,
      description: dbMenuItem.description,
      price: dbMenuItem.price,
      image: dbMenuItem.image || "/placeholder.svg",
      category: dbMenuItem.category,
      isAvailable: dbMenuItem.is_available,
      preparationTime: dbMenuItem.preparation_time,
      createdAt: dbMenuItem.created_at,
    };
  }

  static async deleteMenuItem(id: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/menu-items/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.error || "Failed to delete menu item");
    return true;
  }

  // ==============================================================================
  // ORDER API
  // ==============================================================================

  static async createOrder(orderData: {
    shopId: string;
    items: CartItem[];
    notes?: string;
  }): Promise<Order> {
    const userData = localStorage.getItem("user_data");
    if (!userData) {
      throw new Error("User not logged in");
    }

    const user = JSON.parse(userData);
    const totalAmount = orderData.items.reduce(
      (total, item) => total + item.menuItem.price * item.quantity,
      0,
    );

    const tokenNumber = Math.floor(Math.random() * 999) + 1;
    const estimatedPickupTime = new Date(Date.now() + 15 * 60000).toISOString();

    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        shop_id: orderData.shopId,
        items: orderData.items.map((item) => ({
          menu_item_id: item.menuItem.id,
          quantity: item.quantity,
          price: item.menuItem.price,
          notes: item.notes,
        })),
        total_amount: totalAmount,
        status: "pending",
        payment_status: "pending",
        token_number: tokenNumber,
        estimated_pickup_time: estimatedPickupTime,
        notes: orderData.notes,
      }),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.error || "Failed to create order");
    const dbOrder = result.data;
    return {
      id: dbOrder.id,
      userId: dbOrder.user_id,
      shopId: dbOrder.shop_id,
      items: dbOrder.items as any[],
      totalAmount: dbOrder.total_amount,
      status: dbOrder.status,
      paymentStatus: dbOrder.payment_status,
      tokenNumber: dbOrder.token_number,
      orderNumber: dbOrder.order_number,
      estimatedPickupTime: dbOrder.estimated_pickup_time,
      actualPickupTime: dbOrder.actual_pickup_time,
      notes: dbOrder.notes,
      createdAt: dbOrder.created_at,
      updatedAt: dbOrder.updated_at || dbOrder.created_at || "",
      rejectionReason: dbOrder.rejection_reason,
      preparationTime: dbOrder.preparation_time,
    };
  }

  static async getOrdersByUser(userId: string): Promise<Order[]> {
      console.log("🛍️ Loading orders by user from backend API");
      try {
        const response = await fetch(`${API_BASE_URL}/orders?user_id=${userId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Failed to fetch orders");
        }
        return result.data.map(this.convertDbOrderToFrontendOrder);
      } catch (error) {
        console.error("❌ Failed to fetch orders from backend:", error);
        return [];
    }
  }

  static async getOrdersByShop(shopId: string): Promise<Order[]> {
      console.log("🛍️ Loading orders by shop from backend API");
      try {
        const response = await fetch(
          `${API_BASE_URL}/shops/${shopId}/orders/active`,
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Failed to fetch orders");
        }
        return result.data.map(this.convertDbOrderToFrontendOrder);
      } catch (error) {
        console.error("❌ Failed to fetch orders from backend:", error);
        return [];
    }
  }

  static async getPendingOrdersByShop(shopId: string): Promise<Order[]> {
      console.log("🛍️ Loading pending orders by shop from backend API");
      try {
        const response = await fetch(
          `${API_BASE_URL}/shops/${shopId}/orders/pending`,
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Failed to fetch pending orders");
        }
        return result.data.map(this.convertDbOrderToFrontendOrder);
      } catch (error) {
        console.error("❌ Failed to fetch pending orders from backend:", error);
        return [];
    }
  }

  static async getOrderById(id: string): Promise<Order | null> {
    console.log("🔍 Getting order by ID:", id);
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch order");
      }
      const dbOrder = result.data;
      const order: any = {
        id: dbOrder.id,
        userId: dbOrder.user_id,
        shopId: dbOrder.shop_id,
        items: typeof dbOrder.items === 'string' ? JSON.parse(dbOrder.items) : dbOrder.items,
        totalAmount: Number(dbOrder.total_amount),
        status: dbOrder.status,
        paymentStatus: dbOrder.payment_status,
        tokenNumber: dbOrder.token_number,
        orderNumber: dbOrder.order_number,
        estimatedPickupTime: dbOrder.estimated_pickup_time,
        actualPickupTime: dbOrder.actual_pickup_time,
        notes: dbOrder.notes,
        createdAt: dbOrder.created_at,
        updatedAt: dbOrder.updated_at || dbOrder.created_at || "",
        rejectionReason: dbOrder.rejection_reason,
        preparationTime: dbOrder.preparation_time,
      };
      // Include payment_screenshot if present
      if (dbOrder.payment_screenshot) {
        order.payment_screenshot = dbOrder.payment_screenshot;
      }
      return order;
    } catch (error) {
      console.error("❌ Failed to fetch order from backend:", error);
      return null;
    }
  }

  static async updateOrderStatus(
    id: string,
    status?: string,
    rejection_reason?: string,
    payment_status?: string | null,
    transaction_id?: string,
    preparationTime?: number,
  ): Promise<Order | null> {
    try {
      // Build payload, only including defined values (null is allowed for payment_status)
      const payload: { [key: string]: string | number | null | undefined } = {};
      if (status !== undefined) payload.status = status;
      if (rejection_reason !== undefined) payload.rejection_reason = rejection_reason;
      if (payment_status !== undefined) payload.payment_status = payment_status; // null is allowed
      if (transaction_id !== undefined) payload.transaction_id = transaction_id;
      if (preparationTime !== undefined) payload.preparation_time = preparationTime;
      
      console.log("📤 Sending order status update:", { orderId: id, payload });
      
      const response = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to update order status");
      }
      const dbOrder = result.data;
      const order: any = {
        id: dbOrder.id,
        userId: dbOrder.user_id,
        shopId: dbOrder.shop_id,
        items: typeof dbOrder.items === 'string' ? JSON.parse(dbOrder.items) : dbOrder.items,
        totalAmount: Number(dbOrder.total_amount),
        status: dbOrder.status,
        paymentStatus: dbOrder.payment_status,
        tokenNumber: dbOrder.token_number,
        orderNumber: dbOrder.order_number,
        estimatedPickupTime: dbOrder.estimated_pickup_time,
        actualPickupTime: dbOrder.actual_pickup_time,
        notes: dbOrder.notes,
        createdAt: dbOrder.created_at,
        updatedAt: dbOrder.updated_at || dbOrder.created_at || "",
        rejectionReason: dbOrder.rejection_reason,
        preparationTime: dbOrder.preparation_time,
      };
      // Include payment_screenshot if present
      if (dbOrder.payment_screenshot) {
        order.payment_screenshot = dbOrder.payment_screenshot;
      }
      return order;
    } catch (error) {
      console.error("❌ Failed to update order status via backend:", error);
      throw error;
    }
  }

  static async getAllOrders(): Promise<Order[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/all`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch all orders");
      }
      return result.data.map(this.convertDbOrderToFrontendOrder);
    } catch (error) {
      console.error("❌ Failed to fetch all orders from backend:", error);
      return [];
    }
  }

  static async getAllOrdersByShop(shopId: string): Promise<Order[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/shops/${shopId}/orders/all`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "Failed to fetch all orders");
      return result.data.map(this.convertDbOrderToFrontendOrder);
    } catch (error) {
      console.error("❌ Failed to fetch all orders for shop from backend:", error);
      return [];
    }
  }

  // ==============================================================================
  // UTILITY FUNCTIONS
  // ==============================================================================

  static async initializeMockData(forceReset: boolean = false): Promise<void> {
    console.log("🔄 Initializing localStorage data...");
    // await this.ensureLocalStorageData(); // Removed as per edit hint
    console.log("✅ LocalStorage initialized successfully");
  }

  static async createFallbackShops(): Promise<void> {
    console.log(
      "ℹ️ Fallback shops are created automatically by ensureLocalStorageData",
    );
  }

  static async resetAllData(): Promise<void> {
    const tables = ["shops", "menu_items", "users", "orders"];
    for (const table of tables) {
      localStorage.removeItem(`campuseats_${table}`);
    }
    console.log("✅ All localStorage data cleared");
  }

  private static async createStarterMenuItems(
    shopId: string,
    category: string,
  ): Promise<void> {
    console.log(`🍽️ Creating starter menu items for ${shopId} (${category})`);

    // Define starter menu items based on shop category
    const starterMenus: Record<string, any[]> = {
      "Fast Food": [
        {
          name: "Classic Burger",
          description:
            "Juicy beef patty with lettuce, tomato, and special sauce",
          price: 8.99,
          category: "Burgers",
          preparationTime: 10,
          stockQuantity: 50,
        },
        {
          name: "Crispy Fries",
          description: "Golden crispy potato fries",
          price: 3.99,
          category: "Sides",
          preparationTime: 5,
          stockQuantity: 100,
        },
        {
          name: "Soft Drink",
          description: "Refreshing cold beverage",
          price: 1.99,
          category: "Beverages",
          preparationTime: 1,
          stockQuantity: 200,
        },
      ],
      Italian: [
        {
          name: "Margherita Pizza",
          description: "Fresh tomatoes, mozzarella, and basil",
          price: 12.99,
          category: "Pizzas",
          preparationTime: 15,
          stockQuantity: 30,
        },
        {
          name: "Caesar Salad",
          description: "Crisp romaine lettuce with parmesan and croutons",
          price: 7.99,
          category: "Salads",
          preparationTime: 5,
          stockQuantity: 40,
        },
        {
          name: "Garlic Bread",
          description: "Toasted bread with garlic and herbs",
          price: 4.99,
          category: "Appetizers",
          preparationTime: 8,
          stockQuantity: 60,
        },
      ],
      "Healthy Food": [
        {
          name: "Green Smoothie",
          description: "Spinach, banana, apple, and honey blend",
          price: 5.99,
          category: "Beverages",
          preparationTime: 3,
          stockQuantity: 50,
        },
        {
          name: "Quinoa Bowl",
          description: "Nutritious quinoa with fresh vegetables",
          price: 9.99,
          category: "Bowls",
          preparationTime: 8,
          stockQuantity: 30,
        },
        {
          name: "Protein Bar",
          description: "High-protein energy bar",
          price: 3.49,
          category: "Snacks",
          preparationTime: 1,
          stockQuantity: 100,
        },
      ],
    };

    // Default menu items for any category not specifically defined
    const defaultItems = [
      {
        name: "Signature Dish",
        description: "Our chef's special recommendation",
        price: 10.99,
        category: "Specialties",
        preparationTime: 12,
        stockQuantity: 25,
      },
      {
        name: "House Beverage",
        description: "Refreshing drink of the house",
        price: 2.99,
        category: "Beverages",
        preparationTime: 2,
        stockQuantity: 75,
      },
    ];

    const menuItems = starterMenus[category] || defaultItems;

    // Create each menu item
    for (const item of menuItems) {
      try {
        await this.createMenuItem({
          shopId,
          ...item,
          ingredients: [],
          allergens: [],
        });
        console.log(`✅ Created menu item: ${item.name}`);
      } catch (error) {
        console.error(`❌ Failed to create menu item ${item.name}:`, error);
      }
    }

    console.log(`✅ Starter menu created for shop ${shopId}`);
  }

  // ==============================================================================
  // DATA CONVERSION HELPERS
  // ==============================================================================

  private static convertLocalShopToFrontend(dbShop: Shop): Shop {
    return {
      id: dbShop.id,
      name: dbShop.name,
      description: dbShop.description,
      image: dbShop.image || "/placeholder.svg",
      category: dbShop.category,
      ownerId: dbShop.ownerId,
      isActive: dbShop.isActive,
      closed: dbShop.closed, // <-- Added this line
      crowdLevel: dbShop.crowdLevel || "low",
      estimatedWaitTime: dbShop.estimatedWaitTime || 10,
      activeTokens: dbShop.activeTokens || 0,
      createdAt: dbShop.createdAt,
      upiId: dbShop.upiId,
    };
  }

  private static convertLocalMenuItemToFrontend(
    dbMenuItem: MenuItem,
  ): MenuItem {
    return {
      id: dbMenuItem.id,
      shopId: dbMenuItem.shopId,
      name: dbMenuItem.name,
      description: dbMenuItem.description,
      price: Number(dbMenuItem.price) || 0,
      category: dbMenuItem.category,
      image: dbMenuItem.image || "/placeholder.svg",
      isAvailable: dbMenuItem.isAvailable,
      preparationTime: dbMenuItem.preparationTime,
      createdAt: dbMenuItem.createdAt,
    };
  }

  private static convertLocalOrderToFrontend(dbOrder: Order): Order {
    return {
      id: dbOrder.id,
      userId: dbOrder.userId,
      shopId: dbOrder.shopId,
      items: dbOrder.items as any[],
      totalAmount: dbOrder.totalAmount,
      status: dbOrder.status,
      paymentStatus: dbOrder.paymentStatus,
      tokenNumber: dbOrder.tokenNumber,
      orderNumber: dbOrder.orderNumber,
      estimatedPickupTime: dbOrder.estimatedPickupTime,
      actualPickupTime: dbOrder.actualPickupTime,
      notes: dbOrder.notes,
      createdAt: dbOrder.createdAt,
      updatedAt: dbOrder.updatedAt || dbOrder.createdAt || "",
      rejectionReason: dbOrder.rejectionReason,
      preparationTime: dbOrder.preparationTime,
    };
  }

  private static convertDbOrderToFrontendOrder(dbOrder: any): Order {
    const order: any = {
      id: dbOrder.id,
      userId: dbOrder.user_id,
      shopId: dbOrder.shop_id,
      items: typeof dbOrder.items === 'string' ? JSON.parse(dbOrder.items) : dbOrder.items,
      totalAmount: Number(dbOrder.total_amount),
      status: dbOrder.status,
      // Handle payment_status: null/undefined means not paid yet (show Pay Now), 'pending' means waiting for approval, 'completed' means paid
      paymentStatus: dbOrder.payment_status || (dbOrder.status === 'approved' ? null : 'pending'),
      tokenNumber: dbOrder.token_number,
      orderNumber: dbOrder.order_number,
      estimatedPickupTime: dbOrder.estimated_pickup_time,
      actualPickupTime: dbOrder.actual_pickup_time,
      notes: dbOrder.notes,
      createdAt: dbOrder.created_at,
      updatedAt: dbOrder.updated_at || dbOrder.created_at || "",
      rejectionReason: dbOrder.rejection_reason,
      preparationTime: dbOrder.preparation_time,
    };
    // Include payment_screenshot if present
    if (dbOrder.payment_screenshot) {
      order.payment_screenshot = dbOrder.payment_screenshot;
    }
    return order;
  }

  private static async ensureLocalStorageData(): Promise<void> {
    const hasData = localStorage.getItem("db_initialized");
    // MIGRATION: Ensure all shops have 'closed' property
    const shopKey = "campuseats_shops";
    const shops = JSON.parse(localStorage.getItem(shopKey) || "[]");
    let changed = false;
    for (const shop of shops) {
      if (typeof shop.closed === "undefined") {
        shop.closed = false;
        changed = true;
      }
    }
    if (changed) {
      localStorage.setItem(shopKey, JSON.stringify(shops));
      console.log("🔄 Migrated shops: added 'closed' property to all shops");
    }
    if (hasData) {
      console.log("✅ LocalStorage initialized with existing data");
      return;
    }
    console.log("✅ LocalStorage initialized without existing data");
    await this.createLocalStorageFallbackData();
    localStorage.setItem("db_initialized", "true");
  }

  private static async createLocalStorageFallbackData(): Promise<void> {
    try {
      // Create fallback owner
      const ownerId = `user_${Date.now()}_fallback`;
      // MockDatabase.create<DatabaseUser>("users", { // Removed as per edit hint
      //   email: "fallback@campuseats.com",
      //   password: "hashed_password",
      //   name: "Fallback Owner",
      //   role: "shopkeeper",
      //   isActive: true,
      //   phone: "+1-555-FALLBACK",
      // });

      // Create fallback shops - empty array means no mock shops will be created
      const fallbackShops = [];

      for (const shopData of fallbackShops) {
        // MockDatabase.create<DatabaseShop>("shops", { // Removed as per edit hint
        //   ...shopData,
        //   ownerId,
        //   isActive: true,
        //   openingHours: {
        //     monday: { open: "09:00", close: "22:00", isOpen: true },
        //     tuesday: { open: "09:00", close: "22:00", isOpen: true },
        //     wednesday: { open: "09:00", close: "22:00", isOpen: true },
        //     thursday: { open: "09:00", close: "22:00", isOpen: true },
        //     friday: { open: "09:00", close: "22:00", isOpen: true },
        //     saturday: { open: "10:00", close: "23:00", isOpen: true },
        //     sunday: { open: "10:00", close: "21:00", isOpen: true },
        //   },
        //   crowdLevel: "low" as const,
        //   estimatedWaitTime: Math.floor(Math.random() * 15) + 5,
        //   activeTokens: Math.floor(Math.random() * 5),
        //   rating: 4 + Math.random() * 1,
        //   totalRatings: Math.floor(Math.random() * 100) + 50,
        // });

        // Create sample menu items
        await this.createLocalStorageMenuItems(shopData.id);
      }

      console.log("✅ LocalStorage fallback data created");
    } catch (error) {
      console.error("❌ Failed to create localStorage fallback data:", error);
    }
  }

  private static async createLocalStorageMenuItems(
    shopId: string,
  ): Promise<void> {
    const menuItemsMap: Record<string, any[]> = {
      shop_healthy_bites: [
        {
          name: "Caesar Salad",
          description: "Crisp romaine, parmesan, croutons",
          price: 9.99,
          category: "Salads",
          preparationTime: 5,
        },
        {
          name: "Green Smoothie",
          description: "Spinach, banana, apple, honey",
          price: 6.99,
          category: "Beverages",
          preparationTime: 3,
        },
      ],
      shop_pizza_corner: [
        {
          name: "Margherita Pizza",
          description: "Fresh tomatoes, mozzarella, basil",
          price: 12.99,
          category: "Pizzas",
          preparationTime: 15,
        },
        {
          name: "Pepperoni Pizza",
          description: "Pepperoni, mozzarella, tomato sauce",
          price: 14.99,
          category: "Pizzas",
          preparationTime: 15,
        },
      ],
      shop_burger_palace: [
        {
          name: "Classic Burger",
          description: "Beef patty, lettuce, tomato, cheese",
          price: 11.99,
          category: "Burgers",
          preparationTime: 12,
        },
        {
          name: "Crispy Fries",
          description: "Golden crispy potato fries",
          price: 4.99,
          category: "Sides",
          preparationTime: 8,
        },
      ],
    };

    const items = menuItemsMap[shopId] || [];
    for (const item of items) {
      const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      // MockDatabase.create<DatabaseMenuItem>("menu_items", { // Removed as per edit hint
      //   ...item,
      //   shopId,
      //   isAvailable: true,
      //   nutritionalInfo: {},
      // });
    }
  }

  static async getNotifications(userId: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications?user_id=${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch notifications");
      }
      return result.data;
    } catch (error) {
      console.error("❌ Failed to fetch notifications from backend:", error);
      return [];
    }
  }
}

export { ApiService };
