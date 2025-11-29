import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ApiService } from "@/lib/api";
import { Order } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, CookingPot, ShoppingBag, XCircle, History, CreditCard } from "lucide-react";
import { Socket } from "socket.io-client";
import { QRPaymentScanner } from './QRPaymentScanner';
import { useShop } from "@/contexts/ShopContext";
import React from "react";
import { useRef } from 'react';

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
  return <span className="text-orange-600 font-semibold">{min}:{sec.toString().padStart(2, '0')} left to pay</span>;
}


const OrderStatusStepper = ({ status }: { status: Order["status"] }) => {
  const steps = [
    { name: "Pending", status: "pending_approval", icon: <Clock size={18} /> },
    { name: "Approved", status: "approved", icon: <CheckCircle size={18} /> },
    { name: "Preparing", status: "preparing", icon: <CookingPot size={18} /> },
    { name: "Ready", status: "ready", icon: <ShoppingBag size={18} /> },
    { name: "Collected", status: "fulfilled", icon: <CheckCircle size={18} /> },
  ];

  const currentStepIndex = steps.findIndex((step) => step.status === status);

  return (
    <div className="w-full max-w-sm pt-2">
      <div className="relative h-1.5 bg-gray-200 rounded-full">
        <div
          className="absolute top-0 left-0 h-full bg-green-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
        ></div>
        <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between">
          {steps.map((step, index) => (
            <div
              key={step.name}
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-500 ${
                index <= currentStepIndex ? "bg-green-500" : "bg-gray-300"
              }`}
            >
               <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between mt-2">
        {steps.map((step) => (
          <p key={step.name} className="text-xs text-gray-500 w-1/5 text-center">
            {step.name}
          </p>
        ))}
      </div>
    </div>
  );
};

export const ActiveOrders = ({ socket }: { socket: Socket | null }) => {
  const { user } = useAuth();
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [rejectedOrders, setRejectedOrders] = useState<Order[]>([]);
  const [pastOrders, setPastOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payingOrder, setPayingOrder] = useState<Order | null>(null);
  const [paymentUsed, setPaymentUsed] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [shopUpiId, setShopUpiId] = useState<string>('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const { refreshShops } = useShop();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [debugOrders, setDebugOrders] = useState<Order[] | null>(null);
  const [feedbackOrderId, setFeedbackOrderId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [ratingCounts, setRatingCounts] = useState<{ [orderId: string]: number }>({});
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<{ [orderId: string]: boolean }>({});
  const [noMoreRatingMsg, setNoMoreRatingMsg] = useState<{ [orderId: string]: boolean }>({});
  const [expandedPastOrder, setExpandedPastOrder] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [modalOrder, setModalOrder] = useState<Order | null>(null);
  // On mount, fetch rating count for each past order
  useEffect(() => {
    if (user?.id && pastOrders.length > 0) {
      pastOrders.forEach(order => {
        fetch(`/api/orders/${order.id}/ratings/count?userId=${user.id}`)
          .then(res => res.json())
          .then(data => {
            setRatingCounts(prev => ({ ...prev, [order.id]: data.count }));
          });
      });
    }
  }, [user, pastOrders]);
  useEffect(() => {
    if (user) {
      ApiService.getOrdersByUser(user.id).then(setDebugOrders);
    }
  }, [user]);

  // DEBUG: Show all orders for diagnosis
  // Remove or comment this block after debugging
  // if (user && debugOrders) {
  //   return (
  //     <div className="p-8">
  //       <h2 className="text-2xl font-bold mb-4">DEBUG: All Orders for User</h2>
  //       <pre style={{background:'#f5f5f5',padding:'1em',borderRadius:'8px',overflowX:'auto'}}>
  //         {JSON.stringify(debugOrders, null, 2)}
  //       </pre>
  //       <div className="text-gray-500 mt-4">If you see your approved order here, but not in the main UI, please share this output with your developer.</div>
  //     </div>
  //   );
  // }

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const allOrders = await ApiService.getOrdersByUser(user.id);
      console.log('DEBUG: All orders fetched for user:', allOrders.map(o => ({id: o.id, status: o.status, paymentStatus: o.paymentStatus, items: o.items})));
      const active = allOrders.filter(
        (o) => !["fulfilled", "cancelled", "rejected", "expired"].includes(o.status) &&
          [
            "pending_approval",
            "approved",
            "preparing",
            "ready",
            "payment_pending",
            "payment_completed"
          ].includes(o.status)
      );
      // Include rejected orders in past orders
      const past = allOrders.filter((o) => ["fulfilled", "cancelled", "expired", "rejected"].includes(o.status));
      setActiveOrders(active.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      // Empty the rejected orders array
      setRejectedOrders([]);
      setPastOrders(past.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err: any) {
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    if (socket) {
      socket.on("order_status_update", (data) => {
        if (data.userId === user?.id) {
          fetchOrders();
        }
      });
    }
    // eslint-disable-next-line
  }, [user, socket]);

  useEffect(() => {
    if (!user) return;
    ApiService.getNotifications(user.id).then(setNotifications);
  }, [user, activeOrders]);

  // Add a callback to refresh shops and notifications after payment
  const handlePaymentSuccess = async () => {
    await refreshShops();
    if (user) {
      ApiService.getNotifications(user.id).then(setNotifications);
    }
    fetchOrders();
  };

  if (loading) return <div className="text-center p-8">Loading your orders...</div>;
  if (error) return <div className="text-red-500 p-8 text-center">{error}</div>;

  const hasAnyOrders = activeOrders.length > 0 || rejectedOrders.length > 0 || pastOrders.length > 0;

  if (!hasAnyOrders) {
    return (
      <div>
        {/* No Orders Yet UI */}
        <div className="flex flex-col items-center justify-center py-16">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-6 opacity-80">
            <rect x="10" y="30" width="100" height="60" rx="12" fill="#FFF7ED" stroke="#FDBA74" strokeWidth="3" />
            <rect x="30" y="50" width="60" height="20" rx="6" fill="#FDBA74" fillOpacity="0.2" />
            <circle cx="40" cy="60" r="4" fill="#FDBA74" />
            <circle cx="60" cy="60" r="4" fill="#FDBA74" />
            <circle cx="80" cy="60" r="4" fill="#FDBA74" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">No Orders Yet</h2>
          <p className="text-gray-500 mb-4">You haven't placed any orders. Start by exploring the menu and placing your first order!</p>
        </div>
        {/* Recent Orders Card (always shown) */}
        <div className="max-w-4xl mx-auto mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span role="img" aria-label="orders">🛒</span>
                <span className="text-xl font-bold">Recent Orders</span>
              </div>
              <button className="border px-4 py-1 rounded">View All</button>
            </div>
            <div className="text-center text-gray-400 py-8">
              No recent orders.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const firstApprovedOrder = activeOrders.find(order => order.status === 'approved');
  const approvedOrders = activeOrders.filter(order => order.status === 'approved');
  const selectedOrder = approvedOrders.find(order => order.id === selectedOrderId) || approvedOrders[0];

  return (
    <div className="my-12">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <ShoppingBag className="text-orange-500"/>
        My Orders
      </h2>
      {/* Remove or comment out the debug block: */}
      {/* {user && debugOrders && (
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-4">DEBUG: All Orders for User</h2>
          <pre style={{background:'#f5f5f5',padding:'1em',borderRadius:'8px',overflowX:'auto'}}>
            {JSON.stringify(debugOrders, null, 2)}
          </pre>
          <div className="text-gray-500 mt-4">If you see your approved order here, but not in the main UI, please share this output with your developer.</div>
        </div>
      )} */}
      {(activeOrders.length === 0 && rejectedOrders.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-8">
          <svg width="80" height="80" viewBox="0 0 120 120" fill="none" className="mb-4 opacity-70">
            <rect x="10" y="30" width="100" height="60" rx="12" fill="#FFF7ED" stroke="#FDBA74" strokeWidth="3" />
            <rect x="30" y="50" width="60" height="20" rx="6" fill="#FDBA74" fillOpacity="0.2" />
            <circle cx="40" cy="60" r="4" fill="#FDBA74" />
            <circle cx="60" cy="60" r="4" fill="#FDBA74" />
            <circle cx="80" cy="60" r="4" fill="#FDBA74" />
          </svg>
          <p className="text-gray-500">No active or rejected orders. All your past orders are shown below.</p>
        </div>
      ) : (
        <>
          {activeOrders.map((order, idx) => {
            // Find token_ready notification for this order
            const tokenNotif = notifications.find(
              (n) => n.type === 'token_ready' && n.metadata && n.metadata.order_id === order.id
            );
            // Find ready notification for this order
            const readyNotif = notifications.find(
              (n) => n.title && n.title.toLowerCase().includes('ready for pickup') && n.metadata && n.metadata.order_id === order.id
            );
            return (
              <Card key={order.id} className="bg-gray-50 shadow-sm border-l-4 border-gray-300">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm">
                        #{order.orderNumber || '-'}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Order #{order.orderNumber || order.id} (from {new Date(order.createdAt).toLocaleDateString()})</p>
                        <h3 className="text-md font-semibold text-gray-600">
                          {order.items.map((item) => `${item.menuItem?.name || "Unknown Item"} x${item.quantity}`).join(", ")}
                        </h3>
                        <OrderStatusStepper status={order.status} />
                        {/* Countdown timer for approved orders */}
                        {order.status === 'approved' && order.paymentStatus !== 'completed' && order.updatedAt && (
                          <div className="my-2">
                            <Timer approvedAt={order.updatedAt} />
                            <div className="text-xs text-gray-500">If not paid in 5 minutes, your order will be cancelled automatically.</div>
                          </div>
                        )}
                        {/* Show only one token card per order */}
                        {order.status === 'preparing' ? (
                          <div className="my-4">
                            <div className="bg-orange-50 border-l-4 border-orange-400 rounded-lg p-4 shadow">
                              <div className="font-bold text-orange-700 text-lg mb-1">
                                🎟️ Your Token: {order.tokenNumber || (tokenNotif && tokenNotif.metadata?.token_number) || 'N/A'}
                              </div>
                              <div className="text-gray-700 mb-1">
                                Estimated preparation time: {order.preparationTime ? order.preparationTime : 'N/A'} minutes
                              </div>
                              <div className="text-xs text-gray-500">
                                Estimated pickup: {
                                  order.estimatedPickupTime
                                    ? new Date(order.estimatedPickupTime).toLocaleTimeString()
                                    : (order.updatedAt && order.preparationTime
                                        ? new Date(new Date(order.updatedAt).getTime() + order.preparationTime * 60000).toLocaleTimeString()
                                        : 'N/A')
                                }
                              </div>
                            </div>
                          </div>
                        ) : tokenNotif ? (
                          <div className="my-4">
                            <div className="bg-orange-50 border-l-4 border-orange-400 rounded-lg p-4 shadow">
                              <div className="font-bold text-orange-700 text-lg mb-1">🎟️ Your Token: {tokenNotif.metadata?.token_number || order.tokenNumber || 'N/A'}</div>
                              <div className="text-gray-700 mb-1">Your food will take approximately {order.preparationTime ? order.preparationTime : 'N/A'} minutes to prepare.</div>
                              <div className="text-xs text-gray-500">Token issued at: {tokenNotif.metadata?.estimated_pickup_time ? new Date(tokenNotif.metadata?.estimated_pickup_time).toLocaleTimeString() : (order.updatedAt && order.preparationTime ? new Date(new Date(order.updatedAt).getTime() + order.preparationTime * 60000).toLocaleTimeString() : 'N/A')}</div>
                            </div>
                          </div>
                        ) : null}
                        {/* Show ready card when order is ready */}
                        {order.status === 'ready' && readyNotif && (
                          <div className="my-4">
                            <div className="bg-green-50 border-l-4 border-green-400 rounded-lg p-4 shadow">
                              <div className="font-bold text-green-700 text-lg mb-1">🍽️ Food Ready!</div>
                              <div className="text-gray-700 mb-1">Your food is ready! Please collect it within 30 minutes.</div>
                              <div className="text-xs text-gray-500">Ready at: {new Date(readyNotif.created_at).toLocaleTimeString()}</div>
                            </div>
                          </div>
                        )}
                        {/* Show Pay Now button or waiting message */}
                        {order.status === 'approved' && order.paymentStatus !== 'completed' && (
                          <div className="mt-4">
                            {order.paymentStatus === 'pending' && (order as any).payment_screenshot ? (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <p className="text-sm text-yellow-800 font-semibold">
                                  Waiting for shopkeeper to approve your payment
                                </p>
                              </div>
                            ) : order.paymentStatus !== 'pending' ? (
                              <button
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold shadow"
                                onClick={async () => {
                                  // Fetch shop UPI ID
                                  try {
                                    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
                                    const shopResponse = await fetch(`${API_URL}/shops/${order.shopId}`);
                                    const shopData = await shopResponse.json();
                                    if (shopData.success && shopData.data.upi_id) {
                                      setShopUpiId(shopData.data.upi_id);
                                      setSelectedOrderForPayment(order);
                                      setShowQRScanner(true);
                                    } else {
                                      alert('Shop UPI ID not found. Please contact the shopkeeper.');
                                    }
                                  } catch (error) {
                                    console.error('Error fetching shop UPI ID:', error);
                                    alert('Failed to load payment details. Please try again.');
                                  }
                                }}
                              >
                                Pay Now
                              </button>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant={order.status === 'cancelled' ? 'destructive' : 'default'} className={order.status === 'fulfilled' ? 'bg-green-100 text-green-800' : ''}>
                      {order.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}

        </>
      )}
      {pastOrders.filter(order => order.status !== "rejected").length > 0 && (
        <div className="mt-12">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-8 flex items-center gap-3">
            <History className="text-orange-500 h-8 w-8"/>
            Past Orders
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pastOrders.slice(0, 3).map((order) => {
              const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
              // If you have price info, you can sum total price here
              // const totalPrice = order.items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
              return (
                <div
                  key={order.id}
                  className={`bg-white/95 rounded-2xl shadow-lg border-l-8 border-orange-400 p-6 flex flex-col gap-3 relative group transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:shadow-2xl${(expandedPastOrder === order.id) ? ' ring-4 ring-orange-200 scale-105' : ''}`}
                  onClick={() => setExpandedPastOrder(expandedPastOrder === order.id ? null : order.id)}
                  onMouseEnter={e => {
                    const popup = e.currentTarget.querySelector('.order-popup');
                    if (popup) popup.classList.remove('opacity-0','pointer-events-none');
                  }}
                  onMouseLeave={e => {
                    const popup = e.currentTarget.querySelector('.order-popup');
                    if (popup) popup.classList.add('opacity-0','pointer-events-none');
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm">
                        #{order.orderNumber || '-'}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-lg text-gray-800">Order #{order.orderNumber || order.id}</span>
                        <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className={`px-4 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200 flex items-center gap-1 shadow-sm transition-all duration-300 ${expandedPastOrder === order.id ? 'scale-110 animate-pulse' : 'group-hover:scale-105'}`}>
                      <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {order.items.map((item, idx) => (
                      <span key={idx} className="inline-flex items-center bg-orange-50 px-3 py-1 rounded-full text-sm font-medium text-orange-700 group-hover:bg-orange-100 transition-colors shadow-sm">
                        <svg className="h-4 w-4 mr-1 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 2l1.5 4.5L12 2l4.5 4.5L18 2" /></svg>
                        {item.menuItem?.name || "Unknown Item"} x{item.quantity}
                      </span>
                    ))}
                  </div>
                  {order.status === 'rejected' && (
                    <div className="mt-2 text-sm text-red-600 font-semibold">
                      Reason: {order.rejectionReason || 'No reason specified'}
                    </div>
                  )}
                  {/* Interactive popup summary on hover */}
                  <div className="order-popup absolute top-2 right-2 bg-white border border-orange-200 rounded-lg shadow-lg px-4 py-2 text-xs text-gray-700 opacity-0 pointer-events-none transition-all duration-300 z-20">
                    <div className="font-bold text-orange-600 mb-1">Quick Summary</div>
                    <div>Total Items: {totalItems}</div>
                    {/* <div>Total Price: ₹{totalPrice.toFixed(2)}</div> */}
                    <div>Status: <span className="capitalize">{order.status}</span></div>
                  </div>
                  {/* Expandable details */}
                  {expandedPastOrder === order.id && (
                    <div className="mt-4 bg-orange-50 rounded-lg p-4 text-sm text-gray-700 animate-fade-in">
                      <div><span className="font-semibold">Order Date:</span> {new Date(order.createdAt).toLocaleString()}</div>
                      <div><span className="font-semibold">Order Status:</span> <span className="capitalize">{order.status}</span></div>
                      {/* Add more details here if needed */}
                    </div>
                  )}
                  <div className="flex flex-col items-start mt-2">
                    {!(feedbackSubmitted[order.id] && (ratingCounts[order.id] || 0) < 2) && (
                      <Button size="sm" className="ml-0 mb-1 bg-orange-500 hover:bg-orange-600 text-white" variant="default" onClick={e => {
                        e.stopPropagation();
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
                    )}
                    {noMoreRatingMsg[order.id] && (
                      <div className="text-red-600 font-semibold p-0 m-0 mt-1">No more rating for this order.</div>
                    )}
                    {feedbackSubmitted[order.id] && (ratingCounts[order.id] || 0) < 2 && (
                      <div className="text-green-600 font-semibold flex items-center gap-2 mt-1">
                        Thank you for your feedback!
                        <Button size="sm" variant="outline" className="ml-2" onClick={e => { e.stopPropagation(); setModalOrder(order); setShowRatingModal(true); }}>
                          Rate Again
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {pastOrders.length > 3 && (
            <div className="flex justify-end mt-4">
              <button
                onClick={() => window.location.href = '/user/orders'}
                className="text-orange-600 hover:underline hover:text-orange-700 px-4 py-2 rounded-full text-base font-semibold transition-all duration-200 focus:outline-none focus:ring-0 bg-transparent shadow-none border-none"
                style={{ minWidth: '100px', background: 'none', boxShadow: 'none', border: 'none' }}
              >
                Show More
              </button>
            </div>
          )}
        </div>
      )}
      {/* QR Payment Scanner Modal */}
      {showQRScanner && selectedOrderForPayment && shopUpiId && (
        <QRPaymentScanner
          isOpen={showQRScanner}
          onClose={() => {
            setShowQRScanner(false);
            setSelectedOrderForPayment(null);
            setShopUpiId('');
          }}
          orderId={selectedOrderForPayment.id}
          amount={selectedOrderForPayment.totalAmount}
          upiId={shopUpiId}
          onSuccess={() => {
            handlePaymentSuccess();
            setShowQRScanner(false);
            setSelectedOrderForPayment(null);
            setShopUpiId('');
          }}
        />
      )}
      {/* Modal for rating */}
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
                onClick={async () => {
                  // Save feedback
                  if (!modalOrder) return;
                  const orderId = modalOrder.id;
                  const shopId = modalOrder.shopId;
                  // Prevent more than 2 ratings
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