import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/ui/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users,
  Store,
  ShoppingBag,
  TrendingUp,
  Activity,
  Database,
  Server,
  AlertTriangle,
  BarChart3,
  Settings,
} from "lucide-react";

const DeveloperDashboard = () => {
  const { user } = useAuth();

  const systemStats = [
    {
      title: "Total Users",
      value: "5,247",
      change: "+12%",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Active Shops",
      value: "31",
      change: "+2 this week",
      icon: Store,
      color: "text-green-600",
    },
    {
      title: "Daily Orders",
      value: "1,456",
      change: "+18%",
      icon: ShoppingBag,
      color: "text-orange-600",
    },
    {
      title: "Platform Revenue",
      value: "$12,890",
      change: "+25%",
      icon: TrendingUp,
      color: "text-purple-600",
    },
  ];

  const systemHealth = [
    {
      service: "API Server",
      status: "healthy",
      uptime: "99.9%",
      latency: "45ms",
    },
    {
      service: "Database",
      status: "healthy",
      uptime: "99.8%",
      latency: "12ms",
    },
    {
      service: "Payment Gateway",
      status: "warning",
      uptime: "98.5%",
      latency: "120ms",
    },
    {
      service: "Notification Service",
      status: "healthy",
      uptime: "99.7%",
      latency: "28ms",
    },
  ];

  const topShops = [
    {
      name: "Burger Palace",
      orders: 89,
      revenue: "$1,245",
      rating: 4.8,
    },
    {
      name: "Pizza Corner",
      orders: 76,
      revenue: "$1,120",
      rating: 4.6,
    },
    {
      name: "Healthy Bites",
      orders: 65,
      revenue: "$890",
      rating: 4.9,
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Healthy
          </Badge>
        );
      case "warning":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Warning
          </Badge>
        );
      case "error":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Developer Dashboard 🛠️
          </h1>
          <p className="text-gray-600">
            System overview and platform analytics for CampusEats
          </p>
        </div>

        {/* System Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {systemStats.map((stat, index) => (
            <Card
              key={index}
              className="border-0 shadow-lg bg-white/80 backdrop-blur-sm"
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
                  <div className={`${stat.color}`}>
                    <stat.icon className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* System Health */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-orange-600" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemHealth.map((service, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-gray-100 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {service.status === "healthy" ? (
                            <Server className="h-5 w-5 text-green-600" />
                          ) : service.status === "warning" ? (
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                          )}
                          <span className="font-medium text-gray-900">
                            {service.service}
                          </span>
                        </div>
                        {getStatusBadge(service.status)}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Uptime: {service.uptime}</span>
                        <span>Latency: {service.latency}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2 text-orange-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full justify-start bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
                  <Users className="h-4 w-4 mr-2" />
                  User Management
                </Button>
                <Button className="w-full justify-start bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                  <Store className="h-4 w-4 mr-2" />
                  Shop Moderation
                </Button>
                <Button className="w-full justify-start bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  System Analytics
                </Button>
                <Button className="w-full justify-start bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  <Database className="h-4 w-4 mr-2" />
                  Database Tools
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Performing Shops */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-orange-600" />
                Top Performing Shops
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topShops.map((shop, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-gray-100 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{shop.name}</p>
                      <p className="text-sm text-gray-600">
                        {shop.orders} orders today
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {shop.revenue}
                      </p>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-1">★</span>
                        {shop.rating}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-orange-600" />
                Recent System Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      New shop "Taco Bell Express" registered
                    </p>
                    <p className="text-xs text-gray-500">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      System backup completed successfully
                    </p>
                    <p className="text-xs text-gray-500">15 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      Payment gateway latency increased
                    </p>
                    <p className="text-xs text-gray-500">1 hour ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      Daily analytics report generated
                    </p>
                    <p className="text-xs text-gray-500">3 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DeveloperDashboard;
