import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Navigation } from "@/components/ui/navigation";
import { ModernFooter } from "@/components/ui/modern-footer";
import { useAuth } from "@/contexts/AuthContext";
import { useShop } from "@/contexts/ShopContext";
import { useToast } from "@/hooks/use-toast";
import { ApiService } from "@/lib/api";
import {
  Clock,
  MapPin,
  Star,
  TrendingDown,
  Users,
  ShoppingCart,
  Bell,
  Search,
  Filter,
  Sparkles,
  Zap,
  ArrowRight,
  AlertCircle,
  History,
} from "lucide-react";
import { io as socketIOClient, Socket } from "socket.io-client";
import { ActiveOrders } from "@/components/ActiveOrders";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

const UserDashboard = () => {
  const { user } = useAuth();
  const { shops, loading, refreshShops } = useShop();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [animateCards, setAnimateCards] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketCreated = useRef(false);
  const [pastOrders, setPastOrders] = useState<any[]>([]);
  const navigate = useNavigate();
  // Add state to store ratings for each shop
  const [shopRatings, setShopRatings] = useState<{ [shopId: string]: { avg: number, count: number } }>({});

  useEffect(() => {
    setAnimateCards(true);
  }, []);

  useEffect(() => {
    if (user) {
      refreshShops();
    }
  }, [user, refreshShops]);

  useEffect(() => {
    // Only create socket once on mount
    if (!socket && !socketCreated.current) {
      const newSocket = socketIOClient(SOCKET_URL);
      setSocket(newSocket);
      socketCreated.current = true;

      // WebSocket: Listen for order status updates
      newSocket.on("order_status_update", (data) => {
        // Use latest user and refreshShops via closure or ref if needed
        if (data.userId === user?.id) {
          refreshShops();
        }
      });
    }

    return () => {
      if (socket) {
        socket.disconnect();
        socketCreated.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  useEffect(() => {
    if (user?.id) {
      ApiService.getOrdersByUser(user.id).then((orders) => {
        const past = orders
          .filter((o: any) => ["fulfilled", "cancelled"].includes(o.status))
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPastOrders(past);
      });
    }
  }, [user]);

  // Fetch ratings for all shops on mount or when shops change
  useEffect(() => {
    if (shops && shops.length > 0) {
      shops.forEach(shop => {
        fetch(`/api/shops/${shop.id}/average-rating`)
          .then(res => res.json())
          .then(data => {
            setShopRatings(prev => ({
              ...prev,
              [shop.id]: {
                avg: data.success ? Number(data.avgRating) : 0,
                count: data.success ? Number(data.numRatings) : 0
              }
            }));
          });
      });
    }
  }, [shops]);

  console.log("All shops from context:", shops);
  console.log("User:", user);
  console.log("Loading state:", loading);
  
  const filteredShops = shops
    .filter((shop) => {
      if (!user) return false;
      // For shopkeepers, show only shops owned by them (regardless of closed status)
      if (user.role === "shopkeeper") return shop.ownerId === user.id;
      // For users, show only open shops (closed === false or 0)
      return shop.closed === false;
    })
    .filter((shop) => {
      const matchesSearch =
        shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || shop.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  console.log("Filtered shops:", filteredShops);

  // Debug effect to track shops changes
  useEffect(() => {
    console.log("🔄 Shops changed:", {
      totalShops: shops.length,
      user: user?.name,
      userRole: user?.role,
      loading
    });
  }, [shops, user, loading]);

  const categories = [
    "all",
    ...Array.from(new Set(shops.map((shop) => shop.category))),
  ];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const getCrowdBadge = (level: string) => {
    switch (level) {
      case "low":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <TrendingDown className="h-3 w-3 mr-1" />
            Low Crowd
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Users className="h-3 w-3 mr-1" />
            Medium Crowd
          </Badge>
        );
      case "high":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <Users className="h-3 w-3 mr-1" />
            High Crowd
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleViewMenu = (shopId: string) => {
    navigate(`/shops/${shopId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-600">
            Ready to order from your favorite campus shops?
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm transform hover:scale-[1.02] transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search for shops, food items..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-10 pr-4 py-3 border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {shops.length === 0 && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                  <div>
                    <h3 className="font-medium text-yellow-800">
                      No Shops Available
                    </h3>
                    <p className="text-sm text-yellow-700">
                      Shops are being loaded or none have been created yet. Try
                      refreshing to see newly created shops.
                    </p>
                  </div>
                </div>
        <Button
          onClick={refreshShops}
          variant="outline"
          size="sm"
          className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
        >
          Refresh Shops
        </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Suggested Shops */}

        {/* All Shops */}
        {shops.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                🍽️ All Campus Shops
                <Badge className="ml-3 bg-gray-100 text-gray-600">
                  {filteredShops.length} shops
                </Badge>
              </h2>
              {/* Remove the Refresh Shops button from the home page */}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredShops.map((shop, index) => (
                <Card
                  key={`all-${shop.id}`}
                  className={`border-0 shadow-lg hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-500 bg-white/80 backdrop-blur-sm group transform hover:scale-105 hover:-translate-y-2 ${
                    animateCards ? "animate-slide-up" : ""
                  } ${shop.closed ? "opacity-50" : ""}`}
                  style={{ animationDelay: `${(index + 3) * 100}ms` }}
                >
                  {/* Flash message for unavailable shop */}
                  {shop.closed && (
                    <div className="w-full bg-red-100 text-red-700 text-center py-2 font-bold rounded-t">
                      This shop is currently unavailable.
                    </div>
                  )}
                  <CardHeader className="pb-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition-colors flex items-center">
                          {shop.name}
                          {shop.closed && (
                            <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">Unavailable</span>
                          )}
                          <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          {shop.category}
                        </p>
                      </div>
                      {getCrowdBadge(shop.crowdLevel)}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Clock className="mr-1" size={14} />
                      <span>{shop.estimatedWaitTime} min wait</span>
                    </div>
                    {/* Token Section */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">Tokens:</span>
                      <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">{typeof shop.activeTokens === "number" ? shop.activeTokens : 0}</span>
                    </div>
                    <div className="space-y-3">
                      {/* Shop rating section in shop card */}
                      <div className="flex items-center text-gray-600">
                        <Star className="h-4 w-4 mr-1 text-yellow-500 group-hover:animate-bounce" />
                        {shopRatings[shop.id]?.avg ? shopRatings[shop.id].avg.toFixed(1) : '—'}
                      </div>
                      <Button
                        className={`w-full transform group-hover:scale-105 transition-all duration-300 ${
                          shop.closed
                            ? "bg-gray-300 text-gray-400 cursor-not-allowed opacity-60"
                            : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 group-hover:shadow-lg group-hover:shadow-orange-500/50"
                        }`}
                        disabled={shop.closed || shop.crowdLevel === "high"}
                        onClick={() => handleViewMenu(shop.id)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2 group-hover:animate-bounce" />
                        {shop.closed
                          ? "Unavailable"
                          : shop.crowdLevel === "high"
                          ? "Very Busy"
                          : "View Menu"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredShops.length === 0 && shops.length > 0 && (
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No shops found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </div>
        )}

        <ActiveOrders socket={socket} />
      </div>

      <ModernFooter />
    </div>
  );
};

export default UserDashboard;
