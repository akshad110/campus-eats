import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Store,
  Settings,
  Menu,
  X,
  LogOut,
  Search,
  Filter,
  Calendar,
  Download,
  Ban,
  CheckCircle,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

type ViewType = "students" | "shopowners" | "settings";

interface Student {
  id: string;
  name: string;
  email: string;
  role: string;
  totalOrders: number;
  totalAmount: number;
  lastLogin: string;
  orders: any[];
  is_active: number;
  created_at: string;
}

interface ShopOwner {
  id: string;
  name: string;
  email: string;
  role: string;
  shopsCount: number;
  totalOrders: number;
  totalRevenue: number;
  lastLogin: string;
  shops: any[];
  is_active: number;
  created_at: string;
}

const DeveloperDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>("students");
  const [students, setStudents] = useState<Student[]>([]);
  const [shopOwners, setShopOwners] = useState<ShopOwner[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Student | ShopOwner | null>(null);

  useEffect(() => {
    if (currentView === "students") {
      fetchStudents();
    } else if (currentView === "shopowners") {
      fetchShopOwners();
    }
  }, [currentView, dateRange]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/developer/users?role=student`;
      if (dateRange?.from && dateRange?.to) {
        url += `&startDate=${format(dateRange.from, "yyyy-MM-dd")}&endDate=${format(dateRange.to, "yyyy-MM-dd")}`;
      }
      const response = await fetch(url);
      const result = await response.json();
      if (result.success) {
        setStudents(result.data);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShopOwners = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/developer/shopowners`);
      const result = await response.json();
      if (result.success) {
        setShopOwners(result.data);
      }
    } catch (error) {
      console.error("Error fetching shop owners:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: string, isBlocked: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/developer/users/${userId}/block`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBlocked: !isBlocked }),
      });
      const result = await response.json();
      if (result.success) {
        if (currentView === "students") {
          fetchStudents();
        } else {
          fetchShopOwners();
        }
      }
    } catch (error) {
      console.error("Error blocking user:", error);
    }
  };

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredShopOwners = shopOwners.filter((owner) =>
    owner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    owner.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get last 5 logged in students
  const lastLoggedInStudents = [...students]
    .sort((a, b) => new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime())
    .slice(0, 5);

  const lastLoggedInShopOwners = [...shopOwners]
    .sort((a, b) => new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime())
    .slice(0, 5);

  const handleLogout = () => {
    logout(() => navigate("/auth"));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } bg-gray-900 text-white transition-all duration-300 overflow-hidden fixed h-full z-40`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-orange-400">Developer Dashboard</h2>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-gray-800"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setCurrentView("students")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === "students"
                  ? "bg-orange-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <Users className="h-5 w-5" />
              <span>Manage Students</span>
            </button>

            <button
              onClick={() => setCurrentView("shopowners")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === "shopowners"
                  ? "bg-orange-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <Store className="h-5 w-5" />
              <span>Manage ShopOwners</span>
            </button>

            <button
              onClick={() => setCurrentView("settings")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === "settings"
                  ? "bg-orange-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </button>
          </nav>

          <div className="mt-8 pt-8 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0"}`}>
        {/* Navbar */}
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <h1 className="text-2xl font-bold text-gray-900">
                {currentView === "students" && "Manage Students"}
                {currentView === "shopowners" && "Manage ShopOwners"}
                {currentView === "settings" && "Settings"}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{user?.name || "Developer"}</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Content Area */}
        <div className="p-6">
          {currentView === "students" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Students</p>
                        <p className="text-2xl font-bold text-gray-900">{students.length}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Orders</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {students.reduce((sum, s) => sum + s.totalOrders, 0)}
                        </p>
                      </div>
                      <ShoppingBag className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ₹{students.reduce((sum, s) => sum + s.totalAmount, 0).toFixed(2)}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Active Students</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {students.filter((s) => s.is_active === 1).length}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full md:w-auto">
                          <Calendar className="h-4 w-4 mr-2" />
                          {dateRange?.from
                            ? dateRange.to
                              ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
                              : format(dateRange.from, "LLL dd, y")
                            : "Select date range"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <CalendarComponent
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange?.from}
                          selected={dateRange}
                          onSelect={setDateRange}
                          numberOfMonths={2}
                        />
                        <div className="p-2 flex justify-between">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setDateRange(undefined);
                              setIsCalendarOpen(false);
                            }}
                          >
                            Clear
                          </Button>
                          <Button onClick={() => setIsCalendarOpen(false)}>
                            Apply
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardContent>
              </Card>

              {/* Last 5 Logged In Students */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-orange-500" />
                    Last 5 Logged In Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {lastLoggedInStudents.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{student.name}</p>
                            <p className="text-sm text-gray-600">{student.email}</p>
                            <p className="text-xs text-gray-500">
                              Last login: {new Date(student.lastLogin).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {student.totalOrders} orders
                            </p>
                            <p className="text-sm text-gray-600">
                              ₹{student.totalAmount.toFixed(2)}
                            </p>
                          </div>
                          <Badge
                            className={student.is_active === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                          >
                            {student.is_active === 1 ? "Active" : "Blocked"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* All Students Table */}
              <Card>
                <CardHeader>
                  <CardTitle>All Students</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No students found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Orders</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Total Amount</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Login</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((student) => (
                            <tr
                              key={student.id}
                              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  <User className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">{student.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-gray-600">{student.email}</td>
                              <td className="py-3 px-4">{student.totalOrders}</td>
                              <td className="py-3 px-4 font-medium">₹{student.totalAmount.toFixed(2)}</td>
                              <td className="py-3 px-4 text-sm text-gray-500">
                                {new Date(student.lastLogin).toLocaleString()}
                              </td>
                              <td className="py-3 px-4">
                                <Badge
                                  className={student.is_active === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                                >
                                  {student.is_active === 1 ? "Active" : "Blocked"}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                <Button
                                  size="sm"
                                  variant={student.is_active === 1 ? "destructive" : "default"}
                                  onClick={() => handleBlockUser(student.id, student.is_active === 0)}
                                >
                                  {student.is_active === 1 ? (
                                    <>
                                      <Ban className="h-4 w-4 mr-1" />
                                      Block
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Unblock
                                    </>
                                  )}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {currentView === "shopowners" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Shop Owners</p>
                        <p className="text-2xl font-bold text-gray-900">{shopOwners.length}</p>
                      </div>
                      <Store className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Shops</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {shopOwners.reduce((sum, o) => sum + o.shopsCount, 0)}
                        </p>
                      </div>
                      <Store className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Orders</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {shopOwners.reduce((sum, o) => sum + o.totalOrders, 0)}
                        </p>
                      </div>
                      <ShoppingBag className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ₹{shopOwners.reduce((sum, o) => sum + o.totalRevenue, 0).toFixed(2)}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Last 5 Logged In Shop Owners */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-orange-500" />
                    Last 5 Logged In Shop Owners
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {lastLoggedInShopOwners.map((owner) => (
                      <div
                        key={owner.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <Store className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{owner.name}</p>
                            <p className="text-sm text-gray-600">{owner.email}</p>
                            <p className="text-xs text-gray-500">
                              Last login: {new Date(owner.lastLogin).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              Shops: {owner.shopsCount} | Orders: {owner.totalOrders}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              ₹{owner.totalRevenue.toFixed(2)}
                            </p>
                          </div>
                          <Badge
                            className={owner.is_active === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                          >
                            {owner.is_active === 1 ? "Active" : "Blocked"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* All Shop Owners Table */}
              <Card>
                <CardHeader>
                  <CardTitle>All Shop Owners</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : filteredShopOwners.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No shop owners found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Shops</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Orders</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Revenue</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Login</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredShopOwners.map((owner) => (
                            <tr
                              key={owner.id}
                              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  <Store className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">{owner.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-gray-600">{owner.email}</td>
                              <td className="py-3 px-4">{owner.shopsCount}</td>
                              <td className="py-3 px-4">{owner.totalOrders}</td>
                              <td className="py-3 px-4 font-medium">₹{owner.totalRevenue.toFixed(2)}</td>
                              <td className="py-3 px-4 text-sm text-gray-500">
                                {new Date(owner.lastLogin).toLocaleString()}
                              </td>
                              <td className="py-3 px-4">
                                <Badge
                                  className={owner.is_active === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                                >
                                  {owner.is_active === 1 ? "Active" : "Blocked"}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                <Button
                                  size="sm"
                                  variant={owner.is_active === 1 ? "destructive" : "default"}
                                  onClick={() => handleBlockUser(owner.id, owner.is_active === 0)}
                                >
                                  {owner.is_active === 1 ? (
                                    <>
                                      <Ban className="h-4 w-4 mr-1" />
                                      Block
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Unblock
                                    </>
                                  )}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {currentView === "settings" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-orange-500" />
                    User Management Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Block/Unblock Users</h3>
                    <p className="text-gray-600 mb-4">
                      Use the "Manage Students" and "Manage ShopOwners" sections to block or unblock users who misbehave.
                      Blocked users will not be able to log in or use the platform.
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-yellow-800">Important</p>
                          <p className="text-sm text-yellow-700">
                            Blocking a user will immediately prevent them from accessing the platform. 
                            Unblocking will restore their access.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Platform Statistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Total Students</p>
                        <p className="text-2xl font-bold text-blue-900">{students.length}</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-purple-600 font-medium">Total Shop Owners</p>
                        <p className="text-2xl font-bold text-purple-900">{shopOwners.length}</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Total Orders</p>
                        <p className="text-2xl font-bold text-green-900">
                          {students.reduce((sum, s) => sum + s.totalOrders, 0) +
                            shopOwners.reduce((sum, o) => sum + o.totalOrders, 0)}
                        </p>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-lg">
                        <p className="text-sm text-orange-600 font-medium">Total Revenue</p>
                        <p className="text-2xl font-bold text-orange-900">
                          ₹{(
                            students.reduce((sum, s) => sum + s.totalAmount, 0) +
                            shopOwners.reduce((sum, o) => sum + o.totalRevenue, 0)
                          ).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeveloperDashboard;
