import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/ui/navigation";
import { OrderApproval } from "@/components/OrderApproval";
import { useAuth } from "@/contexts/AuthContext";
import { ApiService } from "@/lib/api";
import { OrderManagement } from "@/lib/orderManagement";
import { io as socketIOClient, Socket } from "socket.io-client";
import {
  Store,
  Menu,
  ShoppingBag,
  TrendingUp,
  Clock,
  Users,
  Plus,
  Settings,
  BarChart3,
  CheckCircle,
  Bell,
  AlertTriangle,
  Package,
  Lock,
  History,
  Eye,
  EyeOff,
} from "lucide-react";
import { Link } from "react-router-dom";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import React from "react";
import { useShop } from "@/contexts/ShopContext";

// Safely extend dayjs with timezone support
try {
  dayjs.extend(utc);
  dayjs.extend(timezone);
  console.log('✅ Dayjs timezone plugins loaded successfully');
} catch (error) {
  console.warn('⚠️ Failed to load dayjs timezone plugins:', error);
}

function getTimeLeft(approvedAt: string) {
  const FIVE_MIN = 5 * 60 * 1000;
  const approvedTime = new Date(approvedAt).getTime();
  const now = Date.now();
  const diff = FIVE_MIN - (now - approvedTime);
  return diff > 0 ? diff : 0;
}

function Timer({ approvedAt }: { approvedAt: string }) {
  const [timeLeft, setTimeLeft] = React.useState(getTimeLeft(approvedAt));
  React.useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(approvedAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [approvedAt, timeLeft]);
  if (timeLeft <= 0) return <span className="text-red-600 font-semibold">Expired</span>;
  const min = Math.floor(timeLeft / 60000);
  const sec = Math.floor((timeLeft % 60000) / 1000);
  return <span className="text-orange-600 font-semibold">{min}:{sec.toString().padStart(2, '0')} left for user to pay</span>;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [userShops, setUserShops] = useState<any[]>([]);
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [activeTokens, setActiveTokens] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [activeShopOrders, setActiveShopOrders] = useState<any[]>([]);
  const [pastShopOrders, setPastShopOrders] = useState<any[]>([]);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const [completedOrdersCount, setCompletedOrdersCount] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const { refreshShops } = useShop();
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [numRatings, setNumRatings] = useState<number>(0);

  // Helper function to safely format dates with timezone
  const safeFormatDate = (dateString: string, format: string = 'YYYY-MM-DD') => {
    try {
      return dayjs(dateString).tz('Asia/Kolkata').format(format);
    } catch (error) {
      console.warn('⚠️ Timezone formatting failed, using local:', error);
      return dayjs(dateString).format(format);
    }
  };

  // Helper function to get today's date safely
  const getTodayDate = () => {
    try {
      return dayjs().tz('Asia/Kolkata').format('YYYY-MM-DD');
    } catch (error) {
      console.warn('⚠️ Timezone error, using local date:', error);
      return dayjs().format('YYYY-MM-DD');
    }
  };

  // Dedicated function to update Active Tokens count
  const updateActiveTokensCount = async () => {
    if (!selectedShop) return;
    
    try {
      const orders = await ApiService.getOrdersByShop(selectedShop.id);
      // Only count orders with payment completed (not just approved)
      const activeTokensCount = orders.filter((o: any) => 
        ['approved', 'preparing', 'ready'].includes(o.status) && 
        o.payment_status === 'completed'
      ).length;
      
      console.log('🎫 updateActiveTokensCount:');
      console.log('  - Shop ID:', selectedShop.id);
      console.log('  - Total orders:', orders.length);
      console.log('  - Orders by status:');
      console.log('    * approved:', orders.filter((o: any) => o.status === 'approved').length);
      console.log('    * preparing:', orders.filter((o: any) => o.status === 'preparing').length);
      console.log('    * ready:', orders.filter((o: any) => o.status === 'ready').length);
      console.log('  - Orders with payment completed:', orders.filter((o: any) => o.payment_status === 'completed').length);
      console.log('  - Active Tokens count:', activeTokensCount);
      
      setActiveTokens(activeTokensCount);
    } catch (error) {
      console.error('❌ Error updating Active Tokens count:', error);
    }
  };

  // Socket.io connection for real-time updates
  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
    const newSocket = socketIOClient(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("🔌 Socket connected for AdminDashboard");
    });

    newSocket.on("order_status_update", (data) => {
      console.log("📡 Received order status update:", data);
      // Update stats immediately when order status changes
      if (selectedShop && data.order && data.order.shop_id === selectedShop.id) {
        console.log("🔄 Order update for current shop, updating stats...");
        updateStats();
      }
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (user?.role === "shopkeeper") {
      loadUserShops();
    }
  }, [user]);

  useEffect(() => {
    if (selectedShop) {
      loadPendingOrdersCount();
    }
  }, [selectedShop]);

  useEffect(() => {
    // Fetch and show completed orders count
    ApiService.getAllOrders().then((orders) => {
      setCompletedOrdersCount(orders.filter((o: any) => o.status === 'fulfilled').length);
    });
  }, []);

  useEffect(() => {
    if (selectedShop) {
      fetch(`/api/shops/${selectedShop.id}/average-rating`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setAvgRating(Number(data.avgRating));
            setNumRatings(Number(data.numRatings));
          }
        });
    }
  }, [selectedShop]);

  const loadUserShops = async () => {
    if (!user) return;

    try {
      // Load user shops directly without creating fallback data to preserve user shops
      const shops = await ApiService.getShopsByOwner(user.id);
      console.log("Loaded shops for user:", user.id, shops);
      setUserShops(shops);
      if (shops.length > 0) {
        setSelectedShop(shops[0]);
      }

      // Only create fallback data if absolutely no shops exist anywhere
      if (shops.length === 0) {
        const allShops = await ApiService.getShops();
        if (allShops.length === 0) {
          console.log("No shops exist at all, creating fallback shops...");
          await ApiService.createFallbackShops();
        }
      }
    } catch (error) {
      console.error("Failed to load shops:", error);
    }
  };

  const loadPendingOrdersCount = async () => {
    if (!selectedShop) return;

    try {
      console.log("Loading pending orders for shop:", selectedShop.id);
      const pendingOrders = await OrderManagement.getPendingApprovalOrders(
        selectedShop.id,
      );
      console.log("Loaded pending orders:", pendingOrders.length);
      setPendingOrdersCount(pendingOrders.length);
    } catch (error) {
      console.error("Failed to load pending orders:", error);
      setPendingOrdersCount(0);
    }
  };

  // Replace fetchDashboardData with updateStats
  const updateStats = async () => {
    if (!selectedShop) return;
    setIsUpdating(true);
    try {
      // Fetch all orders for the shop (not just active)
      const allOrders = await ApiService.getAllOrdersByShop(selectedShop.id);
      // Only show completed/cancelled/rejected orders in Recent Orders
      const completedOrders = allOrders.filter(
        (o) => ['fulfilled', 'cancelled', 'rejected'].includes(o.status)
      );
      setRecentOrders(completedOrders.slice(0, 3)); // Show latest 3 completed/cancelled/rejected orders
      setActiveShopOrders(allOrders.filter((o: any) => ['approved', 'preparing', 'ready'].includes(o.status)));
      setPastShopOrders(allOrders.filter((o: any) => ['fulfilled', 'cancelled'].includes(o.status)));
      setPendingOrdersCount(allOrders.filter((o: any) => o.status === 'pending_approval').length);
      const today = getTodayDate();
      const fulfilledToday = allOrders.filter((o: any) =>
        o.status === 'fulfilled' && safeFormatDate(o.createdAt) === today
      );
      setOrdersCount(fulfilledToday.length);
      setRevenue(fulfilledToday.reduce((sum: number, o: any) => sum + o.totalAmount, 0));
      await updateActiveTokensCount();
    } catch (error) {
      console.error('❌ Error updating stats:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    if (!selectedShop) return;
    updateStats();
    
    // Set up automatic polling every 30 seconds as backup (optimistic updates handle immediate changes)
    const interval = setInterval(() => {
      updateStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [selectedShop]);

  const handleSetStatus = async (orderId: string, status: string) => {
    setProcessingOrderId(orderId);
    // Remove from active immediately if completed/cancelled
    if (["fulfilled", "cancelled"].includes(status)) {
      setActiveShopOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
      // Optimistically increment Today's Orders if fulfilled
      if (status === "fulfilled") {
        const currentOrder = activeShopOrders.find(o => o.id === orderId);
        if (currentOrder && currentOrder.status !== "fulfilled") {
          setOrdersCount(prev => prev + 1);
        }
      }
    } else {
      setActiveShopOrders(prevOrders => prevOrders.map(order => order.id === orderId ? { ...order, status } : order));
    }
    setActiveTokens(prevCount => {
      const currentOrder = activeShopOrders.find(o => o.id === orderId);
      if (!currentOrder) return prevCount;
      // Only count as active if payment is completed
      const wasActive = ["approved", "preparing", "ready"].includes(currentOrder.status) && currentOrder.payment_status === 'completed';
      // For status updates: preparing/ready means payment is already completed, approved needs payment check
      // We'll rely on the backend to update the count correctly via socket events
      // For now, just check if the new status would be active with payment completed
      const willBeActive = ["approved", "preparing", "ready"].includes(status) && 
        (status === 'preparing' || status === 'ready' ? true : currentOrder.payment_status === 'completed');
      if (wasActive && !willBeActive) {
        return prevCount - 1;
      } else if (!wasActive && willBeActive) {
        return prevCount + 1;
      }
      return prevCount;
    });
    try {
    await ApiService.updateOrderStatus(orderId, status);
      updateStats(); // Force refresh instantly after status change
    } catch (error) {
      updateStats();
    } finally {
      setProcessingOrderId(null);
    }
  };

  const stats = [
    {
      title: "Pending Approvals",
      value: pendingOrdersCount.toString(),
      change: "Needs attention",
      icon: AlertTriangle,
      color: pendingOrdersCount > 0 ? "text-red-600" : "text-green-600",
    },
    {
      title: "Today's Orders",
      value: ordersCount.toString(),
      change: ordersCount === 0 ? "" : "+0%",
      icon: ShoppingBag,
      color: "text-blue-600",
    },
    {
      title: "Active Tokens",
      value: activeTokens.toString(),
      change: "Current queue",
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "Revenue Today",
      value: `₹${revenue.toFixed(2)}`,
      change: revenue === 0 ? "" : "+0%",
      icon: TrendingUp,
      color: "text-green-600",
    },
  ];


  const getStatusBadge = (status: string) => {
    switch (status) {
      case "preparing":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Preparing
          </Badge>
        );
      case "ready":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Ready
          </Badge>
        );
      case "fulfilled":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            Fulfilled
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <Navigation />

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">
        {/* Welcome Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}! 👨‍🍳
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage your shop and track orders in real-time
          </p>
            </div>
          </div>
        </div>

        {/* No Shops Warning */}
        {userShops.length === 0 && (
          <Card className="mb-6 sm:mb-8 border-orange-200 bg-orange-50">
            <CardContent className="p-4 sm:p-6">
              <div className="text-center">
                <Store className="h-12 w-12 sm:h-16 sm:w-16 text-orange-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-orange-800 mb-2">
                  No Shops Setup Yet
                </h3>
                <p className="text-sm sm:text-base text-orange-700 mb-4 sm:mb-6 px-2">
                  You haven't created any shops yet. Set up your first shop to
                  start selling!
                </p>
                <Link to="/admin/shop-setup">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white text-sm sm:text-base">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Shop
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shops List */}
        {userShops.length > 0 && (
          <Card className="mb-6 sm:mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <span className="flex items-center text-base sm:text-lg">
                  <Store className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-orange-600" />
                  Your Shops ({userShops.length})
                </span>
                <Link to="/admin/shop-setup">
                  <Button size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Add New Shop
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userShops.map((shop) => (
                  <Card
                    key={shop.id}
                    className={`cursor-pointer transition-all ${
                      selectedShop?.id === shop.id
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-orange-300"
                    } ${shop.closed ? 'opacity-50' : ''}`}
                    onClick={() => setSelectedShop(shop)}
                  >
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {shop.name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {shop.category}
                      </p>
                      <div className="flex items-center justify-between">
                        {shop.closed ? (
                          <Badge className="bg-red-100 text-red-800">Unavailable</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          ID: {shop.id}
                        </span>
                      </div>
                      {/* Toggle button for open/close shop */}
                      <div className="mt-4 flex justify-end">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              // Reverse the logic: default closed=true, toggle to closed=false, and vice versa
                              await ApiService.updateShop(shop.id, { closed: shop.closed ? false : true });
                              await loadUserShops();
                              const latestShops = await ApiService.getShopsByOwner(user.id);
                              const latestShop = latestShops.find((s) => s.id === shop.id);
                              if (latestShop) setSelectedShop(latestShop);
                            } catch (error) {
                              console.error("Failed to toggle shop availability:", error);
                            }
                          }}
                          aria-label={shop.closed ? "Open Shop" : "Close Shop"}
                        >
                          {shop.closed ? (
                            <EyeOff className="h-5 w-5 text-red-600" />
                          ) : (
                            <Eye className="h-5 w-5 text-green-600" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Link to="/admin/shop-setup">
            <Button className="w-full h-16 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 flex-col">
              <Store className="h-6 w-6 mb-1" />
              Shop Setup
            </Button>
          </Link>
          <Link to="/admin/menu">
            <Button className="w-full h-16 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 flex-col">
              <Menu className="h-6 w-6 mb-1" />
              Manage Menu
            </Button>
          </Link>
          <Link to="/admin/orders">
            <Button className="w-full h-16 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 flex-col">
              <ShoppingBag className="h-6 w-6 mb-1" />
              View Orders
            </Button>
          </Link>
          <Link to="/admin/analytics">
            <Button className="w-full h-16 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 flex-col">
              <BarChart3 className="h-6 w-6 mb-1" />
              Analytics
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className={`border-0 shadow-lg bg-white/80 backdrop-blur-sm transition-all duration-300 ${
                isUpdating ? 'animate-pulse' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <p className="text-sm text-gray-500">{stat.change}</p>
                  </div>
                  <div className={`${stat.color} ${isUpdating ? 'animate-spin' : ''}`}>
                    <stat.icon className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Approval Section - Always visible when shop is selected */}
        {selectedShop && (
          <div className="mb-8">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Bell className="h-5 w-5 mr-2 text-orange-600" />
                    Order Approvals for {selectedShop.name}
                  </span>
                  {pendingOrdersCount > 0 && (
                    <Badge className="bg-red-100 text-red-800 animate-pulse">
                      {pendingOrdersCount} Pending
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                <OrderApproval
                  shopId={selectedShop.id}
                  onOrderUpdate={updateStats}
                />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Orders */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <ShoppingBag className="h-5 w-5 mr-2 text-orange-600" />
                Recent Orders
              </span>
              <Link to="/admin/orders">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No recent orders.</div>
              ) : (
                recentOrders.slice(0, 3).map((order) => (
                  <div key={order.id} className="border-b pb-2 mb-2">
                    <div className="flex justify-between items-center">
                        <div>
                        <div className="font-semibold">Order #{order.tokenNumber || order.orderNumber || order.id}</div>
                        <div className="text-xs text-gray-500">{order.status} | {new Date(order.createdAt).toLocaleTimeString()}</div>
                        <div className="text-xs text-gray-500">Amount: ₹{order.totalAmount}</div>
                      </div>
                      <Badge>{order.status.replace(/_/g, ' ').toUpperCase()}</Badge>
                      </div>
                    </div>
                  ))
              )}
            </div>
            {recentOrders.length > 3 && (
              <div className="flex justify-center mt-4">
                <Link to="/admin/orders">
                  <Button variant="outline">Show More</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shop Status */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Store className="h-5 w-5 mr-2 text-orange-600" />
                Shop Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Shop Status</span>
                  <span className="font-medium">
                    {selectedShop?.closed ? (
                      <Badge className="bg-red-100 text-red-800">Closed</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800">Open</Badge>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Current Queue</span>
                  <span className="font-medium">{activeTokens} orders</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Avg. Prep Time</span>
                  <span className="font-medium">12 minutes</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today's Performance */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-orange-600" />
                Today's Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Orders Completed</span>
                  <span className="font-medium">{ordersCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Customer Rating</span>
                  <div className="flex items-center">
                    <span className="font-medium mr-1">{typeof avgRating === 'number' && !isNaN(avgRating) ? avgRating.toFixed(1) : ''}</span>
                    <div className="flex">
                      {[1,2,3,4,5].map((star) => {
                        if (typeof avgRating === 'number' && !isNaN(avgRating)) {
                          if (avgRating >= star) {
                            // Full star
                            return <span key={star} className="text-2xl text-yellow-400">★</span>;
                          } else if (avgRating >= star - 0.5) {
                            // Half star (use a half-star unicode or custom SVG for better look)
                            return <span key={star} className="text-2xl text-yellow-400">☆</span>;
                          } else {
                            // Empty star
                            return <span key={star} className="text-2xl text-gray-300">★</span>;
                          }
                        } else {
                          // No rating, all gray
                          return <span key={star} className="text-2xl text-gray-300">★</span>;
                        }
                      })}
                    </div>
                    {numRatings > 0 && (
                      <span className="ml-2 text-xs text-gray-500">({numRatings})</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Peak Hours</span>
                  <span className="font-medium">12:00 - 2:00 PM</span>
                </div>
                <Link to="/admin/analytics">
                  <Button variant="outline" className="w-full">
                    View Detailed Analytics
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {activeShopOrders.length > 0 && (
          <div className="mt-8">
             <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2 text-blue-500" />
              Active Orders
            </h3>
            <div className="space-y-3">
              {activeShopOrders.map((order) => (
                <Card key={order.id} className="border-l-4 border-blue-500 bg-blue-50/30">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm">
                             #{order.orderNumber || '-'}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              Order Details
                            </h4>
                            <div className="flex items-center space-x-3 text-sm text-gray-600">
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {new Date(order.createdAt).toLocaleTimeString()}
                              </span>
                              <span>₹{Number(order.totalAmount).toFixed(2)}</span>
                              <Badge className="bg-blue-100 text-blue-800 text-xs">
                                {order.status.replace(/_/g, ' ').toUpperCase()}
                              </Badge>
                            </div>
                            {/* Countdown timer for approved orders */}
                            {order.status === 'approved' && order.paymentStatus !== 'completed' && order.updatedAt && (
                              <div className="my-2">
                                <Timer approvedAt={order.updatedAt} />
                                <div className="text-xs text-gray-500">If not paid in 5 minutes, the order will be cancelled automatically.</div>
                              </div>
                            )}
                            {/* Payment Screenshot Display */}
                            {order.status === 'approved' && order.paymentStatus === 'pending' && (order as any).payment_screenshot && (
                              <div className="my-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <p className="text-sm font-semibold text-yellow-800 mb-2">Payment Screenshot Received</p>
                                <img
                                  src={(order as any).payment_screenshot}
                                  alt="Payment screenshot"
                                  className="w-full max-w-xs h-auto border border-gray-300 rounded-lg mb-2"
                                />
                                <p className="text-xs text-yellow-700">Please verify the payment and approve to proceed</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        {order.status === 'approved' && order.paymentStatus === 'pending' && (order as any).payment_screenshot && (
                          <Button 
                            size="sm" 
                            onClick={async () => {
                              try {
                                setProcessingOrderId(order.id);
                                // Approve payment and update status using ApiService
                                const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
                                
                                // Get preparation time from order or default to 15
                                const prepTime = (order as any).preparation_time || 15;
                                
                                // Update payment status to completed and status to preparing using ApiService
                                await ApiService.updateOrderStatus(
                                  order.id,
                                  'preparing', // status
                                  undefined, // rejection_reason
                                  'completed', // payment_status
                                  undefined, // transaction_id
                                  prepTime // preparation_time
                                );
                              
                                // Create notification for user
                                const notifId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
                                await fetch(`${API_URL}/notifications`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    id: notifId,
                                    user_id: order.userId,
                                    title: 'Payment Successful',
                                    message: `Your payment has been approved! Your order will be prepared in ${prepTime} minutes.`,
                                    type: 'order_update',
                                    metadata: JSON.stringify({ order_id: order.id, status: 'payment_approved', preparation_time: prepTime }),
                                  }),
                                });
                                
                                // Emit socket event
                                if (socket) {
                                  socket.emit('order_status_update', {
                                    orderId: order.id,
                                    status: 'preparing',
                                    userId: order.userId,
                                    order: { ...order, payment_status: 'completed', status: 'preparing' },
                                  });
                                }
                                
                                // Refresh orders by reloading
                                loadUserShops();
                                
                                // Show success message
                                alert(`Payment approved! Order is now being prepared. Estimated time: ${prepTime} minutes.`);
                              } catch (error: any) {
                                console.error('Error approving payment:', error);
                                alert(`Error: ${error.message || 'Failed to approve payment. Please try again.'}`);
                              } finally {
                                setProcessingOrderId(null);
                              }
                            }}
                            className="bg-green-600 hover:bg-green-700"
                            disabled={processingOrderId === order.id}
                          >
                            {processingOrderId === order.id ? 'Processing...' : 'Approve Payment & Start Preparing'}
                          </Button>
                        )}
                        {order.status === 'approved' && order.paymentStatus === 'completed' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleSetStatus(order.id, 'preparing')}
                            disabled={processingOrderId === order.id}
                            title="Order paid. Ready to prepare."
                          >
                            {processingOrderId === order.id ? 'Updating...' : 'Mark as Preparing'}
                          </Button>
                        )}
                        {order.status === 'preparing' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleSetStatus(order.id, 'ready')}
                            disabled={processingOrderId === order.id}
                          >
                            {processingOrderId === order.id ? 'Updating...' : 'Mark as Ready'}
                          </Button>
                        )}
                        {order.status === 'ready' && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => handleSetStatus(order.id, 'fulfilled')}
                              disabled={processingOrderId === order.id}
                            >
                              {processingOrderId === order.id ? 'Updating...' : 'Collected'}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleSetStatus(order.id, 'cancelled')}
                              disabled={processingOrderId === order.id}
                            >
                              {processingOrderId === order.id ? 'Updating...' : 'Not Collected'}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
  