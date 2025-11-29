import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ApiService } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { History, ArrowLeft, Receipt, CalendarDays, ShoppingBag, CheckCircle, XCircle } from "lucide-react";
import socketIOClient from "socket.io-client";
import * as React from 'react';
import { useRef } from 'react';

const statusColors: Record<string, string> = {
  fulfilled: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

const UserOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [menus, setMenus] = useState<Record<string, any>>({});
  const navigate = useNavigate();
  const socketCreated = React.useRef(false);
  const socket = React.useRef<any>(null);
  const [feedbackOrderId, setFeedbackOrderId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [ratingCounts, setRatingCounts] = useState<{ [orderId: string]: number }>({});
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<{ [orderId: string]: boolean }>({});
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [modalOrder, setModalOrder] = useState<any>(null);
  const [noMoreRatingMsg, setNoMoreRatingMsg] = useState<{ [orderId: string]: boolean }>({});

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
          // refreshShops(); // This line was removed as per the edit hint
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
  }, []); // <-- Only run once

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-100 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-30 absolute -top-32 -left-32" />
        <div className="w-96 h-96 bg-amber-100 rounded-full blur-3xl opacity-20 absolute -bottom-32 -right-32" />
      </div>
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="flex items-center mb-10 gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mr-2">
            <ArrowLeft className="h-5 w-5 mr-1" /> Back
          </Button>
          <h1 className="text-4xl font-extrabold text-gray-900 flex items-center gap-3">
            <History className="h-8 w-8 mr-2 text-orange-500" />
            Your Past Orders
          </h1>
        </div>
        {orders.length === 0 ? (
          <div className="text-center text-gray-500 py-24 text-xl font-medium">No past orders found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {orders.map((order) => (
              <Card key={order.id} className="bg-white/90 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-0 right-0 m-4">
                  <Badge className={`px-4 py-1 rounded-full font-semibold text-sm border ${statusColors[order.status] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                    {order.status === 'fulfilled' ? <CheckCircle className="inline h-4 w-4 mr-1 text-green-500" /> : <XCircle className="inline h-4 w-4 mr-1 text-red-500" />}
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
                <CardHeader className="pb-2 flex flex-row items-center gap-3">
                  <Receipt className="h-7 w-7 text-orange-400 flex-shrink-0" />
                  <CardTitle className="text-xl font-bold text-gray-900">
                    Order #{order.orderNumber || order.id}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-4">
                  <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <CalendarDays className="h-4 w-4" />
                    <span className="text-sm">{new Date(order.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <ShoppingBag className="h-4 w-4" />
                    <span className="text-sm">{order.shopName || order.shop_id}</span>
                  </div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {order.items.map((item: any, idx: number) => {
                      const shopId = order.shopId || order.shop_id;
                      const price = getItemPrice(item, shopId);
                      const total = price * item.quantity;
                      return (
                        <span key={idx} className="inline-flex items-center bg-orange-50 px-3 py-1 rounded-full text-sm font-medium text-orange-700 group-hover:bg-orange-100 transition-colors shadow-sm">
                          <svg className="h-4 w-4 mr-1 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 2l1.5 4.5L12 2l4.5 4.5L18 2" /></svg>
                          {item.menuItem?.name || item.name || item.menuItemId || "Item"} x{item.quantity} = <span className="ml-1 text-gray-700 font-semibold">₹{total.toFixed(2)}</span>
                        </span>
                      );
                    })}
                  </div>
                  {order.status === 'rejected' && (
                    <div className="mt-2 text-sm text-red-600 font-semibold">
                      Reason: {order.rejectionReason || 'No reason specified'}
                    </div>
                  )}
                  <div className="font-semibold text-lg text-gray-900 mt-2 flex items-center gap-2 justify-end">
                    <span>Total:</span> <span className="text-orange-600">₹{order.totalAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                  {/* Feedback/Rating UI for fulfilled orders */}
                  {order.status === 'fulfilled' && (
                    <>
                      <Button className="mt-2" onClick={() => {
                        if ((ratingCounts[order.id] || 0) >= 2) {
                          setNoMoreRatingMsg(prev => ({ ...prev, [order.id]: true }));
                          setTimeout(() => {
                            setNoMoreRatingMsg(prev => ({ ...prev, [order.id]: false }));
                          }, 5000);
                        } else {
                          setModalOrder(order);
                          setShowRatingModal(true);
                        }
                      }}>
                        Rate
                      </Button>
                      {noMoreRatingMsg[order.id] && (
                        <div className="mt-2 text-red-600 font-semibold">You can't rate this order anymore.</div>
                      )}
                      {feedbackSubmitted[order.id] && (ratingCounts[order.id] || 0) < 2 && (
                        <div className="mt-2 text-green-600 font-semibold flex items-center gap-2">
                          Thank you for your feedback!
                          <Button size="sm" variant="outline" className="ml-2" onClick={() => { setModalOrder(order); setShowRatingModal(true); }}>
                            Rate Again
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
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
                    body: JSON.stringify({ orderId, shopId, userId: user.id, rating, feedback })
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
            {/* Close modal on outside click */}
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