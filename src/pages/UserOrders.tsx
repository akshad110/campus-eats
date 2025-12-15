import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ApiService } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import { History, CheckCircle, XCircle, ChevronRight, Calendar, Download } from "lucide-react";
import socketIOClient from "socket.io-client";
import * as React from 'react';
import { useRef } from 'react';
import { Navigation } from "@/components/ui/navigation";
import { useTranslation } from "react-i18next";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

type FilterType = 'all' | 'in_progress' | 'delivered' | 'cancelled';

const UserOrders = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [orders, setOrders] = useState<any[]>([]);
  const [menus, setMenus] = useState<Record<string, any>>({});
  const [filter, setFilter] = useState<FilterType>('all');
  const navigate = useNavigate();
  const socketCreated = React.useRef(false);
  const socket = React.useRef<any>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [ratingCounts, setRatingCounts] = useState<{ [orderId: string]: number }>({});
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<{ [orderId: string]: boolean }>({});
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [modalOrder, setModalOrder] = useState<any>(null);
  const [noMoreRatingMsg, setNoMoreRatingMsg] = useState<{ [orderId: string]: boolean }>({});
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Load feedbackSubmitted from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('feedbackSubmitted');
    if (saved) {
      setFeedbackSubmitted(JSON.parse(saved));
    }
  }, []);
  // Save feedbackSubmitted to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('feedbackSubmitted', JSON.stringify(feedbackSubmitted));
  }, [feedbackSubmitted]);

  // Load ratingCount from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ratingCount');
    if (saved) {
      setRatingCounts(JSON.parse(saved));
    }
  }, []);
  // Save ratingCount to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('ratingCount', JSON.stringify(ratingCounts));
  }, [ratingCounts]);

  useEffect(() => {
    if (user?.id) {
      ApiService.getOrdersByUser(user.id).then(async (all) => {
        const sorted = all.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(sorted);
        // Fetch menus for all unique shopIds in orders
        const shopIds = Array.from(new Set(all.map((o: any) => o.shopId || o.shop_id)));
        const menusObj: Record<string, any> = {};
        await Promise.all(shopIds.map(async (shopId) => {
          const menu = await ApiService.getMenuItems(shopId);
          menusObj[shopId] = menu;
        }));
        setMenus(menusObj);
      });
    }
  }, [user]);

  useEffect(() => {
    if (!socket && !socketCreated.current) {
      const newSocket = socketIOClient(SOCKET_URL);
      socket.current = newSocket;
      socketCreated.current = true;

      newSocket.on("order_status_update", (data) => {
        if (data.userId === user?.id) {
          // Refresh orders when status updates
          if (user?.id) {
            ApiService.getOrdersByUser(user.id).then(async (all) => {
              const sorted = all.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
              setOrders(sorted);
            });
          }
        }
      });
    }
    return () => {
      if (socket.current) {
        socket.current.disconnect();
        socketCreated.current = false;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On mount, fetch rating count for each order
  useEffect(() => {
    if (user?.id && orders.length > 0) {
      orders.forEach(order => {
        fetch(`/api/orders/${order.id}/ratings/count?userId=${user.id}`)
          .then(res => res.json())
          .then(data => {
            setRatingCounts(prev => ({ ...prev, [order.id]: data.count }));
          });
      });
    }
  }, [user, orders]);

  const getItemPrice = (item: any, shopId: string) => {
    if (typeof item.price === 'number' && item.price > 0) return item.price;
    if (typeof item.price === 'string' && !isNaN(Number(item.price)) && Number(item.price) > 0) return Number(item.price);
    // Fallback: look up price from menu
    const menu = menus[shopId] || [];
    const menuItem = menu.find((m: any) => m.id === item.menuItemId || m.id === item.menuItem?.id);
    return menuItem?.price || 0;
  };

  // Map order status to filter categories
  const getOrderFilterCategory = (order: any): FilterType => {
    if (order.status === 'cancelled' || order.status === 'rejected') return 'cancelled';
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

  // Format date as "DD MMM YYYY"
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-gray-600">
          <span className="cursor-pointer hover:text-orange-600" onClick={() => navigate('/home')}>Home</span>
          <span className="mx-2">/</span>
          <span className="cursor-pointer hover:text-orange-600" onClick={() => navigate('/profile')}>My Account</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">My Orders</span>
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
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const filterCategory = getOrderFilterCategory(order);
              const isInProgress = filterCategory === 'in_progress';
              const isDelivered = filterCategory === 'delivered';
              
              return (
                <Card 
                  key={order.id} 
                  className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={(e) => {
                    // Only open modal if clicking on the card, not on the chevron
                    if ((e.target as HTMLElement).closest('.chevron-click')) {
                      e.stopPropagation();
                      setSelectedOrder(order);
                      setShowOrderSummary(true);
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
                        {/* Status and Date */}
                        <div className="flex items-center gap-3 mb-2">
                          <Badge 
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              isInProgress 
                                ? 'bg-orange-100 text-orange-700 border-orange-300' 
                                : isDelivered
                                ? 'bg-green-100 text-green-700 border-green-300'
                                : 'bg-red-100 text-red-700 border-red-300'
                            }`}
                          >
                            {isInProgress ? 'In progress' : isDelivered ? 'Delivered' : 'Cancelled'}
                  </Badge>
                          <span className="text-xs text-gray-500">
                            {formatDate(order.createdAt)}
                          </span>
                        </div>
                        
                        {/* Order ID */}
                        <p className="text-sm font-semibold text-red-600 mb-1">
                          Order ID: {order.orderNumber || order.id.slice(-12).toUpperCase()}
                        </p>
                        
                        {/* Description */}
                        <p className="text-sm text-red-600 mb-2">
                          {getOrderDescription(order)}
                        </p>
                        
                        {/* Price */}
                        <p className="text-sm font-semibold text-red-600">
                          ₹ {Number(order.totalAmount || 0).toFixed(2)}
                        </p>
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
                  <h2 className="text-2xl font-bold text-gray-900 uppercase">History of Order</h2>
                </div>

                {/* Order ID */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Order ID</p>
                  <p className="text-sm text-gray-700 font-mono">
                    {selectedOrder.orderNumber || selectedOrder.id.slice(-12).toUpperCase()}
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

                {/* Status */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">STATUS</p>
                  <p className={`text-base font-bold ${
                    modalIsInProgress 
                      ? 'text-orange-600' 
                      : modalIsDelivered
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {modalIsInProgress ? 'Ongoing' : modalIsDelivered ? 'Delivered' : 'Cancelled'}
                  </p>
                </div>

                {/* Delivery Information (if in progress) */}
                {modalIsInProgress && selectedOrder.estimatedPickupTime && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500">
                      Your order will be delivered by {formatDate(selectedOrder.estimatedPickupTime)}
                    </p>
                  </div>
                )}

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
                      const shopId = selectedOrder.shopId || selectedOrder.shop_id;
                      const price = getItemPrice(item, shopId);
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

                {/* Action Buttons */}
                <div className="mt-6 flex justify-between items-center">
                  <Button
                    onClick={() => {
                      // Generate and download PDF
                      const generatePDF = () => {
                        // Create a temporary element with order details
                        const printWindow = window.open('', '_blank');
                        if (!printWindow) return;

                        const orderFilterCategory = getOrderFilterCategory(selectedOrder);
                        const modalIsInProgress = orderFilterCategory === 'in_progress';
                        const modalIsDelivered = orderFilterCategory === 'delivered';
                        const statusText = modalIsInProgress ? 'Ongoing' : modalIsDelivered ? 'Delivered' : 'Cancelled';
                        const statusColor = modalIsInProgress ? 'orange' : modalIsDelivered ? 'green' : 'red';

                        const orderId = selectedOrder.orderNumber || selectedOrder.id.slice(-12).toUpperCase();
                        const itemsList = selectedOrder.items?.map((item: any, idx: number) => {
                          const shopId = selectedOrder.shopId || selectedOrder.shop_id;
                          const price = getItemPrice(item, shopId);
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
                                body {
                                  font-family: Arial, sans-serif;
                                  padding: 40px;
                                  color: #333;
                                }
                                h1 {
                                  text-align: center;
                                  text-transform: uppercase;
                                  font-size: 24px;
                                  margin-bottom: 30px;
                                  color: #000;
                                }
                                .section {
                                  margin-bottom: 20px;
                                }
                                .label {
                                  font-size: 11px;
                                  color: #666;
                                  margin-bottom: 5px;
                                }
                                .value {
                                  font-size: 14px;
                                  color: #000;
                                  font-weight: bold;
                                }
                                .status {
                                  color: ${statusColor};
                                  font-weight: bold;
                                }
                                table {
                                  width: 100%;
                                  border-collapse: collapse;
                                  margin-top: 20px;
                                }
                                th, td {
                                  padding: 8px;
                                  text-align: left;
                                  border-bottom: 1px solid #ddd;
                                }
                                th {
                                  background-color: #f5f5f5;
                                  font-weight: bold;
                                }
                                .total {
                                  font-weight: bold;
                                  font-size: 16px;
                                }
                                .grid {
                                  display: grid;
                                  grid-template-columns: 1fr 1fr;
                                  gap: 20px;
                                  margin-bottom: 20px;
                                }
                              </style>
                            </head>
                            <body>
                              <h1>History of Order</h1>
                              
                              <div class="section">
                                <div class="label">Order ID</div>
                                <div class="value">${orderId}</div>
                              </div>

                              <div class="section">
                                <div class="value" style="font-size: 18px; margin-bottom: 10px;">
                                  ${selectedOrder.items?.map((item: any) => {
                                    return item.menuItem?.name || item.name || "Item";
                                  }).join(', ') || "Order Items"}
                                </div>
                              </div>

                              <div class="section">
                                <div class="label">ORDERED ON</div>
                                <div class="value">${formatDate(selectedOrder.createdAt)}</div>
                              </div>

                              <div class="section">
                                <div class="label">STATUS</div>
                                <div class="value status">${statusText}</div>
                              </div>

                              ${modalIsInProgress && selectedOrder.estimatedPickupTime ? `
                              <div class="section">
                                <div style="font-size: 11px; color: #666;">
                                  Your order will be delivered by ${formatDate(selectedOrder.estimatedPickupTime)}
                                </div>
                              </div>
                              ` : ''}

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
                                    <tr>
                                      <th>Item</th>
                                      <th style="text-align: right;">Price</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    ${itemsList}
                                  </tbody>
                                </table>
                  </div>
                              ` : ''}

                            </body>
                          </html>
                        `;

                        printWindow.document.write(htmlContent);
                        printWindow.document.close();
                        printWindow.focus();
                        
                        // Wait for content to load, then print
                          setTimeout(() => {
                          printWindow.print();
                          // Optionally close after printing
                          // printWindow.close();
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

      {/* Rating Modal */}
      {showRatingModal && modalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <h3 className="text-lg font-semibold mb-4">Rate your experience</h3>
            <div className="flex justify-center mb-4">
              {[1,2,3,4,5].map((star) => (
                <span
                  key={star}
                  onClick={() => setRating(star)}
                  className={`cursor-pointer text-3xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                  role="button"
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                  ★
                </span>
              ))}
            </div>
            <textarea
              className="w-full border rounded p-2 mb-4"
              rows={4}
              placeholder="Leave feedback (optional)"
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 transition"
                disabled={rating === 0 || (ratingCounts[modalOrder.id] || 0) >= 2}
                onClick={async () => {
                  if (!modalOrder) return;
                  const orderId = modalOrder.id;
                  const shopId = modalOrder.shopId || modalOrder.shop_id;
                  if ((ratingCounts[orderId] || 0) >= 2) return;
                  await fetch('/api/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId, shopId, userId: user?.id, rating, feedback })
                  });
                  setFeedbackSubmitted(prev => ({ ...prev, [orderId]: true }));
                  setRatingCounts(prev => ({ ...prev, [orderId]: (prev[orderId] || 0) + 1 }));
                  setShowRatingModal(false);
                  setModalOrder(null);
                  setRating(0);
                  setFeedback("");
                }}
              >
                Submit
              </button>
              <button
                className="ml-2 px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={() => { setShowRatingModal(false); setModalOrder(null); }}
              >
                Cancel
              </button>
            </div>
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
              onClick={() => { setShowRatingModal(false); setModalOrder(null); }}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserOrders; 
