import { ApiService } from "./api";
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(timezone);

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "fulfilled"
  | "cancelled";

export interface OrderApproval {
  orderId: string;
  shopkeeperId: string;
  status: "approved" | "rejected";
  reason?: string;
  estimatedPreparationTime?: number;
  itemAvailability?: {
    itemId: string;
    availableQuantity: number;
    isAvailable: boolean;
  }[];
}

export class OrderManagement {
  private static readonly API_BASE_URL = "/api"; // Fallback, using localStorage mode

  // ==============================================================================
  // ORDER SUBMISSION
  // ==============================================================================

  static async submitOrderForApproval(orderData: {
    shopId: string;
    items: Array<{
      menuItemId: string;
      quantity: number;
      price: number;
      notes?: string;
    }>;
    userId: string;
    totalAmount: number;
    notes?: string;
  }): Promise<any> {
    // Submitting order for approval

    // Use localStorage directly
    const { MockDatabase } = await import("./database");
    const tokenNumber = Math.floor(Math.random() * 999) + 1;

    const order = await MockDatabase.create("orders", {
      userId: orderData.userId,
      shopId: orderData.shopId,
      items: orderData.items,
      totalAmount: orderData.totalAmount,
      status: "pending",
      tokenNumber,
      estimatedPickupTime: "",
      paymentStatus: "pending",
      notes: orderData.notes,
    }) as any;

    // Order submitted successfully
    return order;
  }

  // ==============================================================================
  // ORDER APPROVAL/REJECTION
  // ==============================================================================

  static async processOrderApproval(approval: {
    orderId: string;
    shopkeeperId: string;
    status: "approved" | "rejected";
    reason?: string;
    estimatedPreparationTime?: number;
    itemAvailability?: Array<{
      itemId: string;
      availableQuantity: number;
      isAvailable: boolean;
    }>;
  }): Promise<any> {
    // Processing order approval

    // Use localStorage directly
    const { MockDatabase } = await import("./database");
    const updateData: any = { status: approval.status };

    if (approval.status === "approved" && approval.estimatedPreparationTime) {
      const pickupTime = new Date(
        Date.now() + approval.estimatedPreparationTime * 60000,
      );
      updateData.estimatedPickupTime = pickupTime.toISOString();
    }

    const order = await MockDatabase.update(
      "orders",
      approval.orderId,
      updateData,
    ) as any;

    if (!order) {
      throw new Error("Order not found");
    }

    // Order processed successfully
    return order;
  }

  // ==============================================================================
  // ORDER RETRIEVAL
  // ==============================================================================

  static async getPendingApprovalOrders(shopId: string): Promise<any[]> {
    try {
      // Use backend API only
      const orders = await ApiService.getPendingOrdersByShop(shopId);
      return orders.sort(
        (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } catch (error) {
      console.error("❌ Failed to load pending orders from backend:", error);
      return [];
    }
  }

  static async getOrdersByStatus(
    shopId: string,
    status: OrderStatus,
  ): Promise<any[]> {
    try {
      // Loading orders for shop

      // Use localStorage directly
      const { MockDatabase } = await import("./database");
      const orders = await MockDatabase.findMany("orders", {
        shopId,
        status,
      });

      // Found orders from localStorage
      return orders.sort(
        (a: any, b: any) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    } catch (error) {
      console.error(
        `❌ Failed to load ${status} orders from localStorage:`,
        error,
      );
      return [];
    }
  }

  static async getOrderById(orderId: string): Promise<any | null> {
    try {
      // Loading order by ID

      // Use localStorage directly
      const { MockDatabase } = await import("./database");
      const order = await MockDatabase.findById("orders", orderId);

      if (!order) {
        // Order not found
        return null;
      }

      // Order loaded successfully
      return order;
    } catch (error) {
      console.error("❌ Failed to load order from localStorage:", error);
      return null;
    }
  }

  // ==============================================================================
  // ORDER STATUS UPDATES
  // ==============================================================================

  static async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    message?: string,
    metadata?: any,
  ): Promise<any> {
    try {
      // Updating order status

      // Use localStorage directly
      const { MockDatabase } = await import("./database");
      const updateData: any = { status };

      if (message) {
        updateData.statusMessage = message;
      }

      if (metadata) {
        updateData.metadata = metadata;
      }

      const order = await MockDatabase.update("orders", orderId, updateData);

      if (!order) {
        throw new Error("Order not found");
      }

      // Order status updated successfully
      return order;
    } catch (error) {
      console.error("❌ Failed to update order status in localStorage:", error);
      throw error;
    }
  }

  // ==============================================================================
  // HELPER FUNCTIONS
  // ==============================================================================

  static async getShopOwnerId(shopId: string): Promise<string> {
    try {
      // Getting shop owner ID

      // Use localStorage directly
      const { MockDatabase } = await import("./database");
    const shop = await MockDatabase.findById("shops", shopId) as any;

    const ownerId = shop?.ownerId || "";
    // Shop owner ID retrieved
    return ownerId;
  } catch (error) {
    console.error("❌ Failed to get shop owner ID from localStorage:", error);
    return "";
  }
  }

  static async getUserName(userId: string): Promise<string> {
    // This would need to be implemented with a user endpoint
    return "Customer";
  }

  // ==============================================================================
  // REAL-TIME UPDATES (WebSocket placeholder)
  // ==============================================================================

  static setupRealTimeUpdates(shopId: string, callback: (order: any) => void) {
    // TODO: Implement WebSocket connection for real-time updates
    // Setting up real-time updates for shop

    // For now, use polling as fallback
    const interval = setInterval(async () => {
      try {
        const pendingOrders = await this.getPendingApprovalOrders(shopId);
        if (pendingOrders.length > 0) {
          // Notify callback of new orders
          pendingOrders.forEach(callback);
        }
      } catch (error) {
        console.error("❌ Real-time update failed:", error);
      }
    }, 10000); // Poll every 10 seconds

    return () => {
      clearInterval(interval);
      // Real-time updates disconnected
    };
  }

  // ==============================================================================
  // ANALYTICS AND REPORTING
  // ==============================================================================

  static async getOrderAnalytics(
    shopId: string,
    dateRange?: {
      start: string;
      end: string;
    },
  ) {
    try {
      // Loading order analytics for shop

      const orders = await this.getOrdersByShop(shopId);

      // Calculate basic analytics
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce(
        (sum: number, order: any) => sum + parseFloat(order.total_amount || 0),
        0,
      );
      const averageOrderValue =
        totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const statusBreakdown = orders.reduce((acc: any, order: any) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      // Analytics calculated successfully

      return {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        statusBreakdown,
        orders,
      };
    } catch (error) {
      console.error("❌ Failed to load analytics:", error);
      return {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        statusBreakdown: {},
        orders: [],
      };
    }
  }

  static async getOrdersByShop(shopId: string): Promise<any[]> {
    try {
      // Loading all orders for shop

      // Use localStorage directly
      const { MockDatabase } = await import("./database");
      const orders = await MockDatabase.findMany("orders", { shopId });

      // Found orders for shop
      return orders.sort(
        (a: any, b: any) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    } catch (error) {
      console.error("❌ Failed to load shop orders from localStorage:", error);
      return [];
    }
  }
}
