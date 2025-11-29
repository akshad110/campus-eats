import { useEffect, useState, useRef } from "react";
import { ApiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { io as socketIOClient } from "socket.io-client";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const REJECTION_REASONS = [
  "Out of stock",
  "Shop closed",
  "Invalid order",
  "Other"
];

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

export default function AdminOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>(REJECTION_REASONS[0]);
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

  if (!user) return <div className="p-8">Please log in as a shopkeeper to manage orders.</div>;
  if (loading) return <div className="p-8">Loading orders...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex items-center mb-4">
        <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>{"< Back"}</Button>
        <h2 className="text-2xl font-bold ml-4">All Orders</h2>
      </div>
      {orders.length === 0 ? (
        <div className="text-gray-500">No orders found.</div>
      ) : (
        <div ref={scrollRef} style={{ maxHeight: "80vh", overflowY: "auto" }}>
          {orders.map((order) => (
            <Card key={order.id} className="mb-4">
              <CardHeader>
                <CardTitle>Order #{order.tokenNumber || order.orderNumber || order.id}</CardTitle>
                <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</span>
              </CardHeader>
              <CardContent>
                <div className="mb-2">User: {order.userId}</div>
                <div className="mb-2">Status: <Badge>{order.status.replace(/_/g, ' ').toUpperCase()}</Badge></div>
                <div className="mb-2">Total: ₹{Number(order.totalAmount).toFixed(2)}</div>
                <div className="mb-2">Items: {order.items && order.items.map((item: any) => `${item.menuItem?.name || item.name || "Unknown Item"} x${item.quantity}`).join(", ")}</div>
                {order.notes && <div className="mb-2">Notes: {order.notes}</div>}
                {order.transactionId && (
                  <div className="mb-2 text-xs text-gray-600">Transaction ID: <span className="font-mono">{order.transactionId}</span></div>
                )}
                <div className="mb-2">Order ID: <span className="font-mono">{order.id}</span></div>
                {/* Rejection Reason Dropdown and Confirm/Cancel Buttons */}
                {rejectingOrderId === order.id ? (
                  <div className="my-4 p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="mb-2 font-semibold text-red-700">Select Reason for Rejection:</div>
                    <select
                      className="w-full p-2 border border-red-300 rounded mb-2"
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
                ) : order.status === "pending_approval" ? (
                  <div className="flex gap-2 mt-2">
                    <Button variant="default" size="sm" onClick={() => handleApprove(order.id)}>
                      Approve
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setRejectingOrderId(order.id)}>
                      Reject
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 