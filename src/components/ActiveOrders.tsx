import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ApiService } from "@/lib/api";
import { Order } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, CookingPot, ShoppingBag, XCircle, History, CreditCard, FileText, Truck } from "lucide-react";
import { Socket } from "socket.io-client";
import { RazorpayPayment } from './RazorpayPayment';
import { useShop } from "@/contexts/ShopContext";
import React from "react";
import { useRef } from 'react';
import { PaymentApprovedCard } from './PaymentApprovedCard';
import { formatTimeIST, calculatePickupTimeIST } from "@/lib/utils";
import { useTranslation } from "react-i18next";

function getTimeLeft(approvedAt: string) {
  const FIVE_MIN = 5 * 60 * 1000;
  const approvedTime = new Date(approvedAt).getTime();
  const now = Date.now();
  const diff = FIVE_MIN - (now - approvedTime);
  return diff > 0 ? diff : 0;
}

function Timer({ approvedAt, orderId, onExpired }: { approvedAt: string; orderId: string; onExpired?: () => void }) {
  const [timeLeft, setTimeLeft] = React.useState(getTimeLeft(approvedAt));
  const [hasExpired, setHasExpired] = React.useState(false);
  
  React.useEffect(() => {
    if (timeLeft <= 0 && !hasExpired) {
      setHasExpired(true);
      // Mark order as expired in backend
      ApiService.updateOrderStatus(orderId, 'expired', undefined, 'failed').then(() => {
        if (onExpired) onExpired();
      }).catch(err => {
        console.error('Failed to mark order as expired:', err);
      });
      return;
    }
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      const newTimeLeft = getTimeLeft(approvedAt);
      setTimeLeft(newTimeLeft);
      if (newTimeLeft <= 0 && !hasExpired) {
        setHasExpired(true);
        ApiService.updateOrderStatus(orderId, 'expired', undefined, 'failed').then(() => {
          if (onExpired) onExpired();
        }).catch(err => {
          console.error('Failed to mark order as expired:', err);
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [approvedAt, timeLeft, hasExpired, orderId, onExpired]);
  
  if (timeLeft <= 0 || hasExpired) return <span className="text-red-600 font-semibold">Expired</span>;
  const min = Math.floor(timeLeft / 60000);
  const sec = Math.floor((timeLeft % 60000) / 1000);
  return <span className="text-orange-600 font-semibold">{min}:{sec.toString().padStart(2, '0')} left to pay</span>;
}


const OrderStatusStepper = ({ status, paymentStatus }: { status: Order["status"], paymentStatus?: Order["paymentStatus"] }) => {
  const steps = [
    { 
      name: "Pending", 
      subtitle: "Order created",
      status: "pending_approval", 
      icon: FileText,
    },
    { 
      name: "Approved", 
      subtitle: "Order approved",
      status: "approved", 
      icon: CheckCircle,
    },
    { 
      name: "Preparing", 
      subtitle: "Food preparing",
      status: "preparing", 
      icon: CookingPot,
    },
    { 
      name: "Ready", 
      subtitle: "Ready for pickup",
      status: "ready", 
      icon: ShoppingBag,
    },
    { 
      name: "Collected", 
      subtitle: "Order collected",
      status: "fulfilled", 
      icon: CheckCircle,
    },
  ];

  // Determine current step index based on status and payment
  const getCurrentStepIndex = () => {
    if (status === "fulfilled") return 4; // Collected
    if (status === "ready") return 3; // Ready
    if (status === "preparing") return 2; // Preparing
    if (status === "approved") return 1; // Approved
    return 0; // Pending
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="w-full py-3">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-0 relative px-1">
        {/* Connecting line - only visible on wider screens */}
        <div className="hidden sm:block absolute top-5 left-8 right-8 h-0.5 bg-gray-200 -z-10">
        <div
            className="absolute top-0 left-0 h-full bg-orange-500 transition-all duration-500 ease-out"
            style={{ width: currentStepIndex > 0 ? `${(currentStepIndex / (steps.length - 1)) * 100}%` : '0%' }}
        ></div>
        </div>

        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isActive = isCompleted || isCurrent;

          return (
            <div
              key={step.name}
              className={`flex flex-col items-start sm:items-center flex-1 relative w-full sm:w-auto ${
                isCurrent ? 'z-10' : ''
              }`}
            >
              {/* Step container with border for current step */}
              <div
                className={`flex flex-col items-start sm:items-center transition-all duration-300 rounded-lg p-2 ${
                  isCurrent
                    ? 'border-2 border-orange-500 bg-orange-50/40 shadow-md'
                    : 'border-2 border-transparent'
                }`}
              >
                {/* Icon square - orange for active, gray for inactive */}
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-gray-200 text-gray-400'
              }`}
            >
                  <StepIcon size={20} strokeWidth={2} />
                </div>

                {/* Step title and subtitle */}
                <div className="mt-2 text-center">
                  <p
                    className={`text-xs font-semibold transition-colors ${
                      isActive ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
                    {step.name}
                  </p>
                  <p
                    className={`text-[10px] mt-0.5 transition-colors ${
                      isActive ? 'text-gray-600' : 'text-gray-400'
                    }`}
                  >
                    {step.subtitle}
                  </p>
            </div>
        </div>
      </div>
          );
        })}
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const { refreshShops } = useShop();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [debugOrders, setDebugOrders] = useState<Order[] | null>(null);
  const [feedbackOrderId, setFeedbackOrderId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [paymentApprovedCardOpen, setPaymentApprovedCardOpen] = useState<{ [orderId: string]: boolean }>({});
  const [paymentApprovedShown, setPaymentApprovedShown] = useState<Set<string>>(new Set());
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
      // Filter active orders - exclude expired, cancelled, rejected, fulfilled
      // Also exclude approved orders that have expired (more than 5 minutes since approval)
      const active = allOrders.filter((o) => {
        // Exclude orders with these statuses
        if (["fulfilled", "cancelled", "rejected", "expired"].includes(o.status)) {
          return false;
        }
        
        // Check if approved order has expired (more than 5 minutes since updatedAt)
        if (o.status === 'approved' && o.paymentStatus !== 'completed' && o.updatedAt) {
          const approvedTime = new Date(o.updatedAt).getTime();
          const now = Date.now();
          const fiveMinutes = 5 * 60 * 1000;
          if (now - approvedTime >= fiveMinutes) {
            return false; // Exclude expired approved orders
          }
        }
        
        // Include only these statuses
        return [
            "pending_approval",
            "approved",
            "preparing",
            "ready",
            "payment_pending",
            "payment_completed"
        ].includes(o.status);
      });
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
          // Show payment approved card ONLY when payment is first completed and order is preparing
          // This happens in real-time when shopkeeper approves payment
          if (data.order && data.order.payment_status === 'completed' && 
              (data.order.status === 'preparing' || data.status === 'preparing')) {
            const orderId = data.order.id || data.orderId;
            if (orderId && !paymentApprovedShown.has(orderId)) {
              // Small delay for smooth animation
              setTimeout(() => {
                setPaymentApprovedCardOpen(prev => ({ ...prev, [orderId]: true }));
                setPaymentApprovedShown(prev => new Set(prev).add(orderId));
              }, 500);
            }
          }
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
          <div className="space-y-4">
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
              <Card 
                key={order.id} 
                className="bg-white shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300 hover:border-orange-300"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                      {/* Order number badge */}
                      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        #{order.orderNumber || '-'}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Status indicator */}
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            order.status === 'preparing' ? 'bg-orange-500 animate-pulse' :
                            order.status === 'ready' ? 'bg-green-500' :
                            order.status === 'approved' && order.paymentStatus === 'completed' ? 'bg-blue-500' :
                            'bg-gray-400'
                          }`}></div>
                          <span className="text-xs font-medium text-gray-700">
                            {order.status === 'preparing' ? 'Preparing your order' :
                             order.status === 'ready' ? 'Ready for pickup' :
                             order.status === 'approved' && order.paymentStatus === 'completed' ? 'Payment confirmed' :
                             order.status === 'approved' ? 'Waiting for payment' :
                             order.status === 'pending_approval' ? 'Waiting for approval' :
                             'Processing'}
                          </span>
                          {/* Status badge */}
                          <Badge className="ml-auto text-[10px] px-2 py-0.5 bg-orange-100 text-orange-700 border-orange-200">
                            {order.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-gray-500 mb-1">Order #{order.orderNumber || order.id.slice(-8)}</p>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2.5">
                          {order.items.map((item) => `${item.menuItem?.name || "Unknown Item"} x${item.quantity}`).join(", ")}
                        </h3>
                        <OrderStatusStepper status={order.status} paymentStatus={order.paymentStatus} />
                        {/* Countdown timer for approved orders */}
                        {order.status === 'approved' && order.paymentStatus !== 'completed' && order.updatedAt && (
                          <div className="mt-2 mb-3">
                            <Timer 
                              approvedAt={order.updatedAt} 
                              orderId={order.id}
                              onExpired={() => {
                                // Refresh orders when timer expires
                                fetchOrders();
                              }}
                            />
                            <div className="text-xs text-gray-500 mt-1">If not paid in 5 minutes, your order will be cancelled automatically.</div>
                          </div>
                        )}
                        {/* Show only one token card per order */}
                        {order.status === 'preparing' ? (
                          <div 
                            className="mt-3 cursor-pointer transform transition-all duration-200 hover:scale-[1.01] inline-block"
                            onClick={() => {
                              setPaymentApprovedCardOpen(prev => ({ ...prev, [order.id]: true }));
                            }}
                          >
                            <div className="bg-orange-50 border-l-4 border-orange-400 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow max-w-xs">
                              <div className="font-bold text-orange-700 text-sm mb-1">
                                🎟️ {t("orders.yourToken")}: {order.tokenNumber || (tokenNotif && tokenNotif.metadata?.token_number) || 'N/A'}
                              </div>
                              <div className="text-gray-700 text-xs mb-1">
                                {t("orders.estimatedPreparationTime")}: {order.preparationTime || 15} {t("orders.minutes")}
                              </div>
                              <div className="text-xs text-gray-500">
                                {t("orders.estimatedPickup")}: {
                                  order.estimatedPickupTime
                                    ? formatTimeIST(order.estimatedPickupTime)
                                    : (order.updatedAt && order.preparationTime
                                        ? calculatePickupTimeIST(order.updatedAt, order.preparationTime)
                                        : 'N/A')
                                }
                              </div>
                              <div className="text-xs text-orange-600 mt-1.5 font-medium flex items-center gap-1">
                                👆 {t("orders.clickToViewDetails")}
                              </div>
                            </div>
                          </div>
                        ) : tokenNotif ? (
                          <div className="mt-3 inline-block">
                            <div className="bg-orange-50 border-l-4 border-orange-400 rounded-lg p-3 shadow-sm max-w-xs">
                              <div className="font-bold text-orange-700 text-sm mb-1">🎟️ {t("orders.yourToken")}: {tokenNotif.metadata?.token_number || order.tokenNumber || 'N/A'}</div>
                              <div className="text-gray-700 text-xs mb-1">{t("orders.foodWillTake", { minutes: order.preparationTime || 15 })}</div>
                              <div className="text-xs text-gray-500">{t("orders.tokenIssuedAt")}: {tokenNotif.metadata?.estimated_pickup_time ? formatTimeIST(tokenNotif.metadata.estimated_pickup_time) : (order.updatedAt && order.preparationTime ? calculatePickupTimeIST(order.updatedAt, order.preparationTime) : 'N/A')}</div>
                            </div>
                          </div>
                        ) : null}
                        {/* Show ready card when order is ready */}
                        {order.status === 'ready' && readyNotif && (
                          <div className="mt-3">
                            <div className="bg-green-50 border-l-4 border-green-400 rounded-lg p-3 shadow-sm">
                              <div className="font-bold text-green-700 text-sm mb-1">🍽️ {t("orders.foodReady")}</div>
                              <div className="text-gray-700 text-xs mb-1">{t("orders.foodReadyDesc")}</div>
                              <div className="text-xs text-gray-500">{t("orders.readyAt")}: {new Date(readyNotif.created_at).toLocaleTimeString()}</div>
                            </div>
                          </div>
                        )}
                        {/* Show Pay Now button or waiting message */}
                        {order.status === 'approved' && order.paymentStatus !== 'completed' && (
                          <div className="mt-3">
                            {/* Show waiting message if payment screenshot exists and payment is pending */}
                            {order.paymentStatus === 'pending' && (order as any).payment_screenshot ? (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2.5">
                                <p className="text-xs text-yellow-800 font-semibold">
                                  ⏳ {t("orders.waitingForPayment")}
                                </p>
                              </div>
                            ) : (
                              /* Show Pay Now button if payment is not pending and not completed */
                              /* This handles: null, undefined, or any other status */
                              <button
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-sm font-semibold shadow transition-colors w-auto inline-block"
                                onClick={() => {
                                      setSelectedOrderForPayment(order);
                                  setShowPaymentModal(true);
                                }}
                              >
                                💳 {t("orders.payNow")}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          </div>

        </>
      )}

      {/* Payment Approved Cards */}
      {activeOrders
        .filter(order => order.status === 'preparing' && order.paymentStatus === 'completed')
        .map(order => (
          <PaymentApprovedCard
            key={order.id}
            order={order}
            isOpen={paymentApprovedCardOpen[order.id] || false}
            onClose={() => {
              setPaymentApprovedCardOpen(prev => ({ ...prev, [order.id]: false }));
            }}
          />
        ))}

      {/* Payment Approved Cards */}
      {activeOrders
        .filter(order => order.status === 'preparing' && order.paymentStatus === 'completed')
        .map(order => (
          <PaymentApprovedCard
            key={order.id}
            order={order}
            isOpen={paymentApprovedCardOpen[order.id] || false}
            onClose={() => {
              setPaymentApprovedCardOpen(prev => ({ ...prev, [order.id]: false }));
            }}
          />
        ))}
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
                    <span className={`px-4 py-1 rounded-full text-xs font-bold ${
                      order.status === 'cancelled' && order.paymentStatus === 'refunded' 
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : order.status === 'cancelled' && order.paymentStatus !== 'refunded'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : order.status === 'rejected'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-green-100 text-green-800 border border-green-200'
                    } flex items-center gap-1 shadow-sm transition-all duration-300 ${expandedPastOrder === order.id ? 'scale-110 animate-pulse' : 'group-hover:scale-105'}`}>
                      {order.status === 'cancelled' && order.paymentStatus === 'refunded' ? (
                        <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : order.status === 'cancelled' && order.paymentStatus !== 'refunded' ? (
                        <svg className="h-4 w-4 text-blue-500 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : order.status === 'rejected' ? (
                        <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {order.status === 'cancelled' && order.paymentStatus === 'refunded' 
                        ? 'Amount Refunded' 
                        : order.status === 'cancelled' && order.paymentStatus !== 'refunded'
                        ? 'Refund Processing'
                        : order.status}
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
                  {order.status === 'cancelled' && order.paymentStatus !== 'refunded' && (
                    <div className="mt-3 bg-blue-50 border-l-4 border-blue-400 rounded-lg p-3 shadow-sm">
                      <div className="flex items-start gap-2">
                        <svg className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <div className="font-bold text-blue-800 text-sm mb-1">Order Not Collected - Refund Processing</div>
                          <div className="text-blue-700 text-xs">
                            Your order was not collected. A refund (after deducting ₹5 preparation fee) is being processed and will be credited to your account within <span className="font-semibold">3-5 working days</span>.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {order.status === 'cancelled' && order.paymentStatus === 'refunded' && (
                    <div className="mt-3 bg-green-50 border-l-4 border-green-400 rounded-lg p-3 shadow-sm">
                      <div className="flex items-start gap-2">
                        <svg className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <div className="font-bold text-green-800 text-sm mb-1">Amount Refunded</div>
                          <div className="text-green-700 text-xs">
                            Your refund has been successfully processed and credited to your account.
                          </div>
                        </div>
                      </div>
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
      {/* Razorpay Payment Modal */}
      {showPaymentModal && selectedOrderForPayment && (
        <RazorpayPayment
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedOrderForPayment(null);
          }}
          orderDetails={{
            orderId: selectedOrderForPayment.id,
            amount: selectedOrderForPayment.totalAmount + 5, // Add ₹5 platform fee
            baseAmount: selectedOrderForPayment.totalAmount, // Store base amount for display
            items: selectedOrderForPayment.items.map(item => ({
              name: item.menuItem?.name || "Unknown Item",
              quantity: item.quantity,
              price: item.menuItem?.price || 0,
            })),
            shopName: "Shop", // Shop name can be fetched separately if needed
            tokenNumber: selectedOrderForPayment.tokenNumber || 0,
            shopId: selectedOrderForPayment.shopId,
          }}
          customerDetails={{
            email: user?.email || "",
            name: user?.name || "Customer",
          }}
          onPaymentSuccess={(transactionId) => {
            setShowPaymentModal(false);
            setSelectedOrderForPayment(null);
            // Refresh orders
            fetchOrders();
            handlePaymentSuccess();
          }}
          onPaymentFailed={(error) => {
            console.error("Payment failed:", error);
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