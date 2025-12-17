export interface User {
  id: string;
  email: string;
  role: "student" | "shopkeeper" | "developer";
  name: string;
  createdAt: string;
}

export interface Shop {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  ownerId: string;
  isActive: boolean;
  closed: boolean;
  crowdLevel: "low" | "medium" | "high";
  estimatedWaitTime: number; // in minutes
  activeTokens: number;
  upiId?: string;
  createdAt: string;
  current_orders?: number;
}

export interface MenuItem {
  id: string;
  shopId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isAvailable: boolean;
  preparationTime: number; // in minutes
  createdAt: string;
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export type OrderStatus = 'pending_approval' | 'approved' | 'rejected' | 'preparing' | 'ready' | 'fulfilled' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refund_processing' | 'refunded';

export interface Order {
  id: string;
  userId: string;
  shopId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  tokenNumber: number;
  estimatedPickupTime?: string;
  actualPickupTime?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  rejectionReason?: string;
  preparationTime?: number;
  orderNumber?: number;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: User["role"]) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    role: User["role"],
  ) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export interface ShopContextType {
  shops: Shop[];
  selectedShop: Shop | null;
  selectShop: (shop: Shop | null) => void;
  menuItems: MenuItem[];
  cart: CartItem[];
  addToCart: (item: MenuItem, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  placeOrder: (notes?: string) => Promise<Order>;
  getShopById: (id: string) => Shop | undefined;
  getMenuItemsByShopId: (shopId: string) => MenuItem[];
  getSuggestedShops: () => Shop[];
  forceRefresh: () => Promise<void>;
  loading: boolean;
}
