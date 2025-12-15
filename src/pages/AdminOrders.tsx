import { useEffect, useState, useRef } from "react";
import { ApiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { io as socketIOClient } from "socket.io-client";
import { History, ChevronRight, Calendar, Download, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/ui/navigation";

const REJECTION_REASONS = [
  "Out of stock",
  "Shop closed",
  "Invalid order",
  "Other"
];

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

type FilterType = 'all' | 'in_progress' | 'delivered' | 'cancelled' | 'rejected';

export default function AdminOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>(REJECTION_REASONS[0]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    let lastScroll = 0;
    if (scrollRef.current) lastScroll = scrollRef.current.scrollTop;
    try {
      const shops = await ApiService.getShopsByOwner(user.id);
      let allOrders: any[] = [];
      for (const shop of shops) {
        const shopOrders = await ApiService.getAllOrdersByShop(shop.id);
        allOrders = allOrders.concat(shopOrders);
      }
      // Sort by createdAt DESC
      allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(allOrders);
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = lastScroll;
      }, 0);
    } catch (err: any) {
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchOrders();
    // WebSocket: Listen for new orders
    const socket = socketIOClient(SOCKET_URL);
    socket.on("new_order", () => {
      if (isMounted) fetchOrders();
    });
    socket.on("order_status_update", () => {
      if (isMounted) fetchOrders();
    });
    // Polling: Refresh orders every 5 seconds
    const interval = setInterval(() => {
      if (isMounted) fetchOrders();
    }, 5000);
    return () => {
      isMounted = false;
      socket.disconnect();
      clearInterval(interval);
    };
    // eslint-disable-next-line
  }, [user]);

  const handleApprove = async (orderId: string) => {
    await ApiService.updateOrderStatus(orderId, "approved");
    fetchOrders();
  };

  const handleReject = async (orderId: string) => {
    await ApiService.updateOrderStatus(orderId, "rejected", rejectionReason);
    setRejectingOrderId(null);
    fetchOrders();
  };

  const handleSetStatus = async (orderId: string, status: string) => {
    await ApiService.updateOrderStatus(orderId, status);
    fetchOrders();
  };

  // Map order status to filter categories
  const getOrderFilterCategory = (order: any): FilterType => {
    if (order.status === 'cancelled') return 'cancelled';
    if (order.status === 'rejected') return 'rejected';
    if (order.status === 'fulfilled') return 'delivered';
    if (['pending_approval', 'approved', 'preparing', 'ready'].includes(order.status)) return 'in_progress';
    return 'all';
  };

  // Filter orders based on selected filter and date range
  const filteredOrders = orders.filter(order => {
    // Filter by status
    if (filter !== 'all' && getOrderFilterCategory(order) !== filter) {
      return false;
    }
    
    // Filter by date range if set
    if (dateRange) {
      const orderDate = new Date(order.createdAt);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999); // Include the entire end date
      
      if (orderDate < startDate || orderDate > endDate) {
        return false;
      }
    }
    
    return true;
  });

  // Format date range display
  const formatDateRangeDisplay = () => {
    if (!dateRange) return "Select date range";
    const start = new Date(dateRange.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const end = new Date(dateRange.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${start} - ${end}`;
  };

  // Clear date range
  const clearDateRange = () => {
    setDateRange(null);
    setShowDatePicker(false);
  };

  // Format date as "DD MMM YYYY"
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Get order description (items list)
  const getOrderDescription = (order: any) => {
    const items = order.items || [];
    if (items.length === 0) return "No items";
    
    const firstItem = items[0];
    const firstItemName = firstItem.menuItem?.name || firstItem.name || "Item";
    const remainingCount = items.length - 1;
    
    if (remainingCount === 0) {
      return `${firstItemName} x${firstItem.quantity || 1}`;
    }
    
    return `${firstItemName} x${firstItem.quantity || 1} & ${remainingCount} more item${remainingCount > 1 ? 's' : ''}`;
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    if (status === 'fulfilled') return 'bg-green-100 text-green-700 border-green-300';
    if (status === 'rejected' || status === 'cancelled') return 'bg-red-100 text-red-700 border-red-300';
    if (['pending_approval', 'approved', 'preparing', 'ready'].includes(status)) return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  if (!user) return <div className="p-8">Please log in as a shopkeeper to manage orders.</div>;
  if (loading && orders.length === 0) return <div className="p-8">Loading orders...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/admin")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">All Orders</h1>
        </div>

        {/* Filters and Date Range */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === 'all'
                  ? 'bg-red-50 text-red-600 border-2 border-red-500'
                  : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('in_progress')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === 'in_progress'
                  ? 'bg-red-50 text-red-600 border-2 border-red-500'
                  : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setFilter('delivered')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === 'delivered'
                  ? 'bg-red-50 text-red-600 border-2 border-red-500'
                  : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
              }`}
            >
              Delivered
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === 'cancelled'
                  ? 'bg-red-50 text-red-600 border-2 border-red-500'
                  : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
              }`}
            >
              Cancelled
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === 'rejected'
                  ? 'bg-red-50 text-red-600 border-2 border-red-500'
                  : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
              }`}
            >
              Rejected
            </button>
      </div>
          <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
            <PopoverTrigger asChild>
              <div className="flex items-center gap-2 text-sm text-gray-600 border border-gray-300 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50">
                <Calendar className="h-4 w-4" />
                <span>{formatDateRangeDisplay()}</span>
                {dateRange && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearDateRange();
                    }}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    value={dateRange?.start || ''}
                    onChange={(e) => {
                      const start = e.target.value;
                      setDateRange(prev => ({
                        start,
                        end: prev?.end || start
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    value={dateRange?.end || ''}
                    min={dateRange?.start || ''}
                    onChange={(e) => {
                      setDateRange(prev => ({
                        start: prev?.start || e.target.value,
                        end: e.target.value
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (dateRange?.start && dateRange?.end) {
                        setShowDatePicker(false);
                      }
                    }}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                    disabled={!dateRange?.start || !dateRange?.end}
                  >
                    Apply
                  </Button>
                  {dateRange && (
                    <Button
                      onClick={clearDateRange}
                      variant="outline"
                      className="flex-1"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center text-gray-500 py-24 text-lg font-medium">
            No orders found.
          </div>
        ) : (
          <div className="space-y-4" ref={scrollRef}>
            {filteredOrders.map((order) => {
              const filterCategory = getOrderFilterCategory(order);
              
              return (
                <Card 
                  key={order.id} 
                  className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('.chevron-click') || 
                        (e.target as HTMLElement).closest('.action-buttons')) {
                      e.stopPropagation();
                    } else {
                      setSelectedOrder(order);
                      setShowOrderSummary(true);
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Placeholder for item image */}
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                        <History className="h-8 w-8 text-gray-400" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Order Number and Date */}
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-sm font-semibold text-gray-900">
                            Order #{order.orderNumber || order.tokenNumber || order.id.slice(-8)}
                          </p>
                          <span className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleString()}
                          </span>
                        </div>
                        
                        {/* User ID */}
                        <p className="text-xs text-gray-500 mb-2">
                          User: {order.userId}
                        </p>
                        
                        {/* Status */}
                        <div className="mb-2">
                          <Badge className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                            {order.status.replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                        </div>
                        
                        {/* Total */}
                        <p className="text-sm font-semibold text-red-600 mb-1">
                          Total: ₹ {Number(order.totalAmount || 0).toFixed(2)}
                        </p>
                        
                        {/* Items */}
                        <p className="text-sm text-red-600 mb-2">
                          Items: {getOrderDescription(order)}
                        </p>
                        
                        {/* Order ID */}
                        <p className="text-xs text-gray-500 font-mono mb-2">
                          Order ID: {order.id}
                        </p>

                        {/* Action Buttons for Pending Orders */}
                        {order.status === "pending_approval" && (
                          <div className="mt-3 action-buttons" onClick={(e) => e.stopPropagation()}>
                {rejectingOrderId === order.id ? (
                              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                <div className="mb-2 font-semibold text-red-700 text-sm">Select Reason for Rejection:</div>
                    <select
                                  className="w-full p-2 border border-red-300 rounded mb-2 text-sm"
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                    >
                      {REJECTION_REASONS.map((reason) => (
                        <option key={reason} value={reason}>{reason}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <Button variant="destructive" size="sm" onClick={() => handleReject(order.id)}>
                        Confirm Reject
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setRejectingOrderId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                            ) : (
                              <div className="flex gap-2">
                                <Button 
                                  variant="default" 
                                  size="sm" 
                                  onClick={() => handleApprove(order.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                      Approve
                    </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  onClick={() => setRejectingOrderId(order.id)}
                                >
                      Reject
                    </Button>
                  </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Chevron */}
                      <div 
                        className="flex-shrink-0 flex items-center chevron-click"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                          setShowOrderSummary(true);
                        }}
                      >
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
              </CardContent>
            </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Summary Modal */}
      {showOrderSummary && selectedOrder && (() => {
        const orderFilterCategory = getOrderFilterCategory(selectedOrder);
        const modalIsInProgress = orderFilterCategory === 'in_progress';
        const modalIsDelivered = orderFilterCategory === 'delivered';
        const modalIsRejected = orderFilterCategory === 'rejected';
        const modalIsCancelled = orderFilterCategory === 'cancelled';
        
        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => {
              setShowOrderSummary(false);
              setSelectedOrder(null);
            }}
          >
            <div 
              className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Header */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 uppercase">Order Details</h2>
                </div>

                {/* Order ID */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Order ID</p>
                  <p className="text-sm text-gray-700 font-mono">
                    {selectedOrder.orderNumber || selectedOrder.tokenNumber || selectedOrder.id.slice(-12).toUpperCase()}
                  </p>
                </div>

                {/* Product/Items Name */}
                <div className="mb-4">
                  <p className="text-lg font-bold text-gray-900 mb-2">
                    {selectedOrder.items && selectedOrder.items.length > 0
                      ? selectedOrder.items.map((item: any, idx: number) => {
                          const itemName = item.menuItem?.name || item.name || "Item";
                          return idx === 0 ? itemName : `, ${itemName}`;
                        }).join('')
                      : "Order Items"}
                  </p>
                </div>

                {/* Order Date */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">ORDERED ON</p>
                  <p className="text-sm text-gray-900">{formatDate(selectedOrder.createdAt)}</p>
                </div>

                {/* User ID */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">USER</p>
                  <p className="text-sm text-gray-900 font-mono">{selectedOrder.userId}</p>
                </div>

                {/* Status */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">STATUS</p>
                  <p className={`text-base font-bold ${
                    modalIsInProgress 
                      ? 'text-orange-600' 
                      : modalIsDelivered
                      ? 'text-green-600'
                      : (modalIsRejected || modalIsCancelled)
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}>
                    {selectedOrder.status.replace(/_/g, ' ').toUpperCase()}
                  </p>
                </div>

                {/* Package Details */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">PACKAGE</p>
                    <p className="text-sm text-gray-900">
                      {selectedOrder.items?.reduce((total: number, item: any) => total + (item.quantity || 1), 0) || 0} pcs
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">NO. OF PACKAGES</p>
                    <p className="text-sm text-gray-900">
                      {selectedOrder.items?.length || 0}
                    </p>
                  </div>
                </div>

                {/* Pricing Details */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">PRICE</p>
                      <p className="text-sm text-gray-900">₹ {Number(selectedOrder.totalAmount || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">DPH</p>
                      <p className="text-sm text-gray-900">₹ 0.00</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-1">PRICE (+ DPH)</p>
                    <p className="text-base font-bold text-gray-900">
                      ₹ {Number(selectedOrder.totalAmount || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Order Items Breakdown */}
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div className="mt-6 border-t border-gray-200 pt-4">
                    <p className="text-sm font-semibold text-gray-900 mb-3">Order Items:</p>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item: any, idx: number) => {
                        const price = typeof item.price === 'number' ? item.price : (typeof item.price === 'string' ? parseFloat(item.price) : 0);
                        const quantity = item.quantity || 1;
                        const total = price * quantity;
                        const itemName = item.menuItem?.name || item.name || `Item ${idx + 1}`;
                        
                        return (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="text-gray-700">
                              {itemName} x{quantity}
                            </span>
                            <span className="text-gray-900 font-medium">
                              ₹ {total.toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <p className="text-xs text-gray-500 mb-1">NOTES</p>
                    <p className="text-sm text-gray-900">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Transaction ID */}
                {selectedOrder.transactionId && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <p className="text-xs text-gray-500 mb-1">TRANSACTION ID</p>
                    <p className="text-sm text-gray-900 font-mono">{selectedOrder.transactionId}</p>
        </div>
      )}

                {/* Action Buttons */}
                <div className="mt-6 flex justify-between items-center">
                  <Button
                    onClick={() => {
                      // Generate and download PDF
                      const generatePDF = () => {
                        const printWindow = window.open('', '_blank');
                        if (!printWindow) return;

                        const orderId = selectedOrder.orderNumber || selectedOrder.tokenNumber || selectedOrder.id.slice(-12).toUpperCase();
                        const itemsList = selectedOrder.items?.map((item: any, idx: number) => {
                          const price = typeof item.price === 'number' ? item.price : (typeof item.price === 'string' ? parseFloat(item.price) : 0);
                          const quantity = item.quantity || 1;
                          const total = price * quantity;
                          const itemName = item.menuItem?.name || item.name || `Item ${idx + 1}`;
                          return `<tr><td>${itemName} x${quantity}</td><td style="text-align: right;">₹ ${total.toFixed(2)}</td></tr>`;
                        }).join('') || '';

                        const htmlContent = `
                          <!DOCTYPE html>
                          <html>
                            <head>
                              <title>Order Summary - ${orderId}</title>
                              <style>
                                body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
                                h1 { text-align: center; text-transform: uppercase; font-size: 24px; margin-bottom: 30px; color: #000; }
                                .section { margin-bottom: 20px; }
                                .label { font-size: 11px; color: #666; margin-bottom: 5px; }
                                .value { font-size: 14px; color: #000; font-weight: bold; }
                                .status { color: ${modalIsDelivered ? 'green' : (modalIsRejected || modalIsCancelled) ? 'red' : 'orange'}; font-weight: bold; }
                                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                                th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                                th { background-color: #f5f5f5; font-weight: bold; }
                                .total { font-weight: bold; font-size: 16px; }
                                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                              </style>
                            </head>
                            <body>
                              <h1>Order Details</h1>
                              <div class="section">
                                <div class="label">Order ID</div>
                                <div class="value">${orderId}</div>
                              </div>
                              <div class="section">
                                <div class="value" style="font-size: 18px; margin-bottom: 10px;">
                                  ${selectedOrder.items?.map((item: any) => item.menuItem?.name || item.name || "Item").join(', ') || "Order Items"}
                                </div>
                              </div>
                              <div class="section">
                                <div class="label">ORDERED ON</div>
                                <div class="value">${formatDate(selectedOrder.createdAt)}</div>
                              </div>
                              <div class="section">
                                <div class="label">USER</div>
                                <div class="value" style="font-family: monospace;">${selectedOrder.userId}</div>
                              </div>
                              <div class="section">
                                <div class="label">STATUS</div>
                                <div class="value status">${selectedOrder.status.replace(/_/g, ' ').toUpperCase()}</div>
                              </div>
                              <div class="grid">
                                <div class="section">
                                  <div class="label">PACKAGE</div>
                                  <div class="value">${selectedOrder.items?.reduce((total: number, item: any) => total + (item.quantity || 1), 0) || 0} pcs</div>
                                </div>
                                <div class="section">
                                  <div class="label">NO. OF PACKAGES</div>
                                  <div class="value">${selectedOrder.items?.length || 0}</div>
                                </div>
                              </div>
                              <div class="section">
                                <div class="grid">
                                  <div>
                                    <div class="label">PRICE</div>
                                    <div class="value">₹ ${Number(selectedOrder.totalAmount || 0).toFixed(2)}</div>
                                  </div>
                                  <div>
                                    <div class="label">DPH</div>
                                    <div class="value">₹ 0.00</div>
                                  </div>
                                </div>
                                <div style="margin-top: 15px;">
                                  <div class="label">PRICE (+ DPH)</div>
                                  <div class="value total">₹ ${Number(selectedOrder.totalAmount || 0).toFixed(2)}</div>
                                </div>
                              </div>
                              ${itemsList ? `
                              <div class="section">
                                <div style="font-weight: bold; margin-bottom: 10px;">Order Items:</div>
                                <table>
                                  <thead>
                                    <tr><th>Item</th><th style="text-align: right;">Price</th></tr>
                                  </thead>
                                  <tbody>${itemsList}</tbody>
                                </table>
                              </div>
                              ` : ''}
                            </body>
                          </html>
                        `;

                        printWindow.document.write(htmlContent);
                        printWindow.document.close();
                        printWindow.focus();
                        setTimeout(() => {
                          printWindow.print();
                        }, 250);
                      };
                      generatePDF();
                    }}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download as PDF
                  </Button>
                  <Button
                    onClick={() => {
                      setShowOrderSummary(false);
                      setSelectedOrder(null);
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
} 
