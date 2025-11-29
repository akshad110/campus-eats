import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useShop } from "@/contexts/ShopContext";
import { useAuth } from "@/contexts/AuthContext";
import { ApiService } from "@/lib/api";
import {
  RefreshCw,
  Eye,
  Database,
  User,
  Store,
  AlertTriangle,
  CheckCircle,
  Settings,
} from "lucide-react";

interface DebugInfo {
  totalShops: number;
  userShops: number;
  activeShops: number;
  shopsList: any[];
  userInfo: any;
  contextShops: number;
  lastRefresh: string;
}

const ShopDebugger = () => {
  const { user } = useAuth();
  const { shops, forceRefresh } = useShop();
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadDebugInfo = async () => {
    setIsLoading(true);
    try {
      // Get all shops from API
      const allShops = await ApiService.getShops();

      // Get user's shops if logged in
      let userShops: any[] = [];
      if (user?.id) {
        userShops = await ApiService.getShopsByOwner(user.id);
      }

      const debugData: DebugInfo = {
        totalShops: allShops.length,
        userShops: userShops.length,
        activeShops: allShops.filter((shop) => shop.isActive).length,
        shopsList: allShops.map((shop) => ({
          id: shop.id,
          name: shop.name,
          ownerId: shop.ownerId,
          isActive: shop.isActive,
          category: shop.category,
          crowdLevel: shop.crowdLevel,
          estimatedWaitTime: shop.estimatedWaitTime,
        })),
        userInfo: {
          id: user?.id,
          name: user?.name,
          role: user?.role,
          isLoggedIn: !!user,
        },
        contextShops: shops.length,
        lastRefresh: new Date().toLocaleTimeString(),
      };

      setDebugInfo(debugData);
    } catch (error) {
      console.error("Failed to load debug info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      loadDebugInfo();
    }
  }, [isVisible, user, shops]);

  const handleRefresh = async () => {
    setIsLoading(true);
    await forceRefresh();
    await loadDebugInfo();
    setIsLoading(false);
  };

  const getShopStatusBadge = (shop: any) => {
    if (!shop.isActive) {
      return <Badge variant="destructive">Inactive</Badge>;
    }

    switch (shop.crowdLevel) {
      case "low":
        return <Badge className="bg-green-100 text-green-800">Low Crowd</Badge>;
      case "medium":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">Medium Crowd</Badge>
        );
      case "high":
        return <Badge className="bg-red-100 text-red-800">High Crowd</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          size="sm"
          variant="outline"
          className="bg-white shadow-lg hover:bg-gray-50"
        >
          <Settings className="h-4 w-4 mr-2" />
          Debug Shops
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2 text-blue-600" />
              Shop Debug Information
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleRefresh}
                size="sm"
                variant="outline"
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                onClick={() => setIsVisible(false)}
                size="sm"
                variant="outline"
              >
                <Eye className="h-4 w-4 mr-2" />
                Hide
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Stats */}
          {debugInfo && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Store className="h-5 w-5 text-blue-600 mr-2" />
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {debugInfo.totalShops}
                    </div>
                    <div className="text-sm text-blue-700">Total Shops</div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {debugInfo.activeShops}
                    </div>
                    <div className="text-sm text-green-700">Active Shops</div>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-purple-600 mr-2" />
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {debugInfo.userShops}
                    </div>
                    <div className="text-sm text-purple-700">Your Shops</div>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <RefreshCw className="h-5 w-5 text-orange-600 mr-2" />
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {debugInfo.contextShops}
                    </div>
                    <div className="text-sm text-orange-700">In Context</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Information */}
          {debugInfo && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center">
                <User className="h-4 w-4 mr-2" />
                User Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">ID:</span>{" "}
                  {debugInfo.userInfo.id || "Not logged in"}
                </div>
                <div>
                  <span className="font-medium">Name:</span>{" "}
                  {debugInfo.userInfo.name || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Role:</span>{" "}
                  {debugInfo.userInfo.role || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  {debugInfo.userInfo.isLoggedIn ? (
                    <Badge className="ml-1 bg-green-100 text-green-800">
                      Logged In
                    </Badge>
                  ) : (
                    <Badge className="ml-1 bg-red-100 text-red-800">
                      Not Logged In
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Issues Detection */}
          {debugInfo && (
            <div className="space-y-2">
              {debugInfo.totalShops === 0 && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-center">
                  <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                  <span className="text-red-700">
                    No shops found in the database!
                  </span>
                </div>
              )}

              {debugInfo.contextShops !== debugInfo.totalShops && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex items-center">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                  <span className="text-yellow-700">
                    Context shows {debugInfo.contextShops} shops but database
                    has {debugInfo.totalShops}. Try refreshing.
                  </span>
                </div>
              )}

              {debugInfo.userInfo.role === "shopkeeper" &&
                debugInfo.userShops === 0 && (
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center">
                    <AlertTriangle className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-blue-700">
                      You're a shopkeeper but have no shops. Create one to get
                      started!
                    </span>
                  </div>
                )}
            </div>
          )}

          {/* Shops List */}
          {debugInfo && debugInfo.shopsList.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center">
                <Store className="h-4 w-4 mr-2" />
                All Shops ({debugInfo.shopsList.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {debugInfo.shopsList.map((shop, index) => (
                  <div
                    key={shop.id}
                    className="bg-white p-3 rounded border flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{shop.name}</div>
                      <div className="text-sm text-gray-600">
                        ID: {shop.id} | Owner: {shop.ownerId} | Category:{" "}
                        {shop.category}
                      </div>
                      <div className="text-sm text-gray-500">
                        Wait: {shop.estimatedWaitTime}min
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getShopStatusBadge(shop)}
                      {shop.ownerId === debugInfo.userInfo.id && (
                        <Badge variant="outline">Your Shop</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last Refresh Time */}
          {debugInfo && (
            <div className="text-sm text-gray-500 text-center">
              Last refreshed: {debugInfo.lastRefresh}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ShopDebugger;
