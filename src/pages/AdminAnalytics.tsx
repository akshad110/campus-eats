import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Calendar, Clock, TrendingUp, PieChart, Users, Star, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Pie, PieChart as RePieChart, Cell, Legend } from "recharts";
import dayjs from "dayjs";

const COLORS = ["#fb923c", "#60a5fa", "#34d399", "#f472b6", "#facc15", "#a78bfa", "#f87171", "#38bdf8"];

const AdminAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [shops, setShops] = useState<any[]>([]);
  const [selectedShop, setSelectedShop] = useState<string>("");
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({start: dayjs().startOf('day').format('YYYY-MM-DD'), end: dayjs().endOf('day').format('YYYY-MM-DD')});

  useEffect(() => {
    if (!user) return;
    // Fetch all shops for shopkeeper
    fetch(`/api/shops/owner/${user.id}`)
      .then(res => res.json())
      .then(data => {
        setShops(data.data || []);
        if (data.data && data.data.length > 0) setSelectedShop(data.data[0].id);
      });
  }, [user]);

  useEffect(() => {
    if (!selectedShop) return;
    setLoading(true);
    const fetchAnalytics = () => {
      fetch(`/api/analytics/${selectedShop}?startDate=${dateRange.start} 00:00:00&endDate=${dateRange.end} 23:59:59`)
        .then(res => res.json())
        .then(data => {
          setAnalytics(data.data);
          setLoading(false);
        });
    };
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 15000); // Poll every 15 seconds
    return () => clearInterval(interval);
  }, [selectedShop, dateRange]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-orange-500" />
          Shop Analytics
        </h1>
        {/* Shop Selector and Date Range Picker */}
        <div className="flex flex-wrap gap-4 mb-8 items-center">
          <select value={selectedShop} onChange={e => setSelectedShop(e.target.value)} className="px-4 py-2 rounded border">
            {shops.map(shop => <option key={shop.id} value={shop.id}>{shop.name}</option>)}
          </select>
          <input type="date" value={dateRange.start} onChange={e => setDateRange(r => ({...r, start: e.target.value}))} className="px-2 py-1 rounded border" />
          <span>to</span>
          <input type="date" value={dateRange.end} onChange={e => setDateRange(r => ({...r, end: e.target.value}))} className="px-2 py-1 rounded border" />
        </div>
        {loading ? (
          <div className="text-center text-lg text-gray-500 py-24">Loading analytics...</div>
        ) : analytics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Revenue & Orders */}
            <Card className="bg-white/90 shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-green-600">
                  ₹{(
                    Array.isArray(analytics.revenueTrend)
                      ? analytics.revenueTrend.reduce((sum: number, r: any) => sum + (Number(r.revenue) || 0), 0)
                      : 0
                  ).toFixed(2)}
                </div>
                <div className="text-gray-500 text-sm mt-2">Avg Order Value: ₹{Number(analytics.avgOrderValue).toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card className="bg-white/90 shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-blue-600">{analytics.revenueTrend?.reduce((sum: number, r: any) => sum + (r.orders || 0), 0)}</div>
                <div className="text-gray-500 text-sm mt-2">Peak Hour: {analytics.peakHour ? `${analytics.peakHour.hour}:00` : 'N/A'}</div>
              </CardContent>
            </Card>
            {/* Order Status Pie */}
            <Card className="bg-white/90 shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <PieChart className="h-5 w-5 text-orange-500" />
                  Order Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie data={analytics.orderStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} label>
                        {analytics.orderStatus?.map((entry: any, idx: number) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                      </Pie>
                      <Legend />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            {/* Payment Methods Pie */}
            <Card className="bg-white/90 shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <PieChart className="h-5 w-5 text-blue-500" />
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie data={analytics.paymentMethods} dataKey="count" nameKey="payment_method" cx="50%" cy="50%" outerRadius={70} label>
                        {analytics.paymentMethods?.map((entry: any, idx: number) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                      </Pie>
                      <Legend />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            {/* Revenue Trend Bar Chart */}
            <Card className="bg-white/90 shadow-xl border-0 col-span-1 md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  Orders Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.revenueTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="orders" fill="#fb923c" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            {/* Top Customers */}
            <Card className="bg-white/90 shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <Users className="h-5 w-5 text-blue-500" />
                  Top Customers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-gray-700 text-sm">
                  {analytics.topCustomers?.map((c: any, idx: number) => (
                    <li key={c.user_id} className="mb-1">{idx + 1}. {c.username || c.user_id} - {c.orders} orders, ₹{c.spent}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            {/* Average Fulfillment Time */}
            <Card className="bg-white/90 shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <Clock className="h-5 w-5 text-green-500" />
                  Avg Fulfillment Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">
                  {analytics.avgFulfillment !== null && analytics.avgFulfillment !== undefined
                    ? `${Number(analytics.avgFulfillment).toFixed(1)} min`
                    : 'N/A'}
                </div>
              </CardContent>
            </Card>
            {/* Ratings & Reviews */}
            <Card className="bg-white/90 shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Ratings & Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {analytics.ratings?.num_reviews > 0 && analytics.ratings?.avg_rating
                    ? Number(analytics.ratings.avg_rating).toFixed(2)
                    : '—'}
                </div>
                <div className="text-gray-500 text-sm">
                  {analytics.ratings?.num_reviews > 0
                    ? `${analytics.ratings.num_reviews} reviews`
                    : 'No ratings yet'}
                </div>
              </CardContent>
            </Card>
            {/* Low Stock Alerts */}
            <Card className="bg-white/90 shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Low Stock Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.lowStock?.length === 0 ? (
                  <div className="text-green-600">All items sufficiently stocked.</div>
                ) : (
                  <ul className="text-red-600 text-sm">
                    {analytics.lowStock?.map((item: any) => (
                      <li key={item.id}>{item.name}: {item.stock_quantity} left</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center text-lg text-gray-500 py-24">No analytics data found.</div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics; 