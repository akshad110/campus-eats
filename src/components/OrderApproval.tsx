import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { OrderManagement } from "@/lib/orderManagement";
import { DatabaseOrder } from "@/lib/database";
import { ApiService } from "@/lib/api";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  ShoppingBag,
  Timer,
  Package,
  RefreshCw,
  Bell,
} from "lucide-react";

interface OrderApprovalProps {
  shopId: string;
  onOrderUpdate?: () => void;
}

// Predefined rejection reasons
const REJECTION_REASONS = [
  { value: "food_unavailable", label: "Food Unavailable" },
  { value: "time_up", label: "Time Up - Kitchen Closed" },
  { value: "ingredients_out", label: "Out of Ingredients" },
  { value: "equipment_issue", label: "Equipment Issue" },
  { value: "staff_shortage", label: "Staff Shortage" },
  { value: "high_demand", label: "Too Many Orders" },
  { value: "other", label: "Other Reason" },
];

export const OrderApproval = ({
  shopId,
  onOrderUpdate,
}: OrderApprovalProps) => {
  const [pendingOrders, setPendingOrders] = useState<DatabaseOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<DatabaseOrder | null>(
    null,
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [approvalTime, setApprovalTime] = useState(15);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const { toast } = useToast();

  useEffect(() => {
    loadPendingOrders();
    // Poll for new orders every 15 seconds for real-time updates
    const interval = setInterval(() => {
      loadPendingOrders();
      setLastRefresh(new Date());
    }, 15000);
    return () => clearInterval(interval);
  }, [shopId]);

  const loadPendingOrders = async () => {
    try {
      // Fetch from backend API
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/shops/${shopId}/orders/pending`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "Failed to fetch pending orders");
      setPendingOrders(result.data);
      console.log(`Loaded ${result.data.length} pending orders for shop ${shopId}`);
    } catch (error) {
      console.error("Failed to load pending orders:", error);
    }
  };

  const handleOrderApproval = async (orderId: string, approved: boolean) => {
    setIsProcessing(true);
    try {
      const shopkeeperId = JSON.parse(
        localStorage.getItem("user_data") || "{}",
      ).id;

      let finalReason = "";
      if (!approved) {
        if (rejectionReason === "other") {
          finalReason = customReason.trim();
        } else {
          const selectedReasonObj = REJECTION_REASONS.find(
            (r) => r.value === rejectionReason,
          );
          finalReason = selectedReasonObj
            ? selectedReasonObj.label
            : "Order rejected";
        }
      }

      const pickupTime = approved
        ? new Date(Date.now() + approvalTime * 60000).toISOString()
        : undefined;

      await ApiService.updateOrderStatus(
        orderId,
        approved ? "approved" : "rejected",
        approved ? undefined : finalReason,
        undefined,
        undefined,
        approved ? approvalTime : undefined
      );

      toast({
        title: approved ? "✅ Order Approved" : "❌ Order Rejected",
        description: approved
          ? `Order approved! Customer will pick up in ${approvalTime} minutes.`
          : `Order rejected: ${finalReason}`,
      });

      // Reset form state
      setSelectedOrder(null);
      setRejectionReason("");
      setCustomReason("");
      setApprovalTime(15);

      // Optimistically update UI immediately
      setPendingOrders(prevOrders => 
        prevOrders.filter(order => order.id !== orderId)
      );
      
      console.log('🔄 OrderApproval: Order processed, calling onOrderUpdate immediately');
      if (onOrderUpdate) {
        onOrderUpdate();
      } else {
        console.warn('⚠️ OrderApproval: onOrderUpdate function not provided');
      }
      
      // Refresh data in background
      setTimeout(() => {
        loadPendingOrders();
      }, 1000);
    } catch (error) {
      console.error("Failed to process order approval:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process order. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openApprovalDialog = (order: DatabaseOrder) => {
    setSelectedOrder(order);
    setRejectionReason("");
    setCustomReason("");
    setApprovalTime(15);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const orderTime = new Date(dateString);
    const diffMinutes = Math.floor(
      (now.getTime() - orderTime.getTime()) / 60000,
    );

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ${diffMinutes % 60}m ago`;
  };

  // Normalize orderNumber for all pending orders
  const normalizedPendingOrders = pendingOrders.map(order => {
    const o: any = order;
    return {
      ...order,
      orderNumber: o.orderNumber || o.order_number || '-',
    };
  });

  if (normalizedPendingOrders.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="flex items-center justify-center mb-4">
          <ShoppingBag className="h-12 w-12 text-gray-300 mr-3" />
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-600">
              No Pending Orders
            </h3>
            <p className="text-sm text-gray-500">
              All caught up! New orders will appear here for approval.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center text-xs text-gray-400">
          <RefreshCw className="h-3 w-3 mr-1" />
          Last checked: {lastRefresh.toLocaleTimeString()}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with live update indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Bell className="h-5 w-5 text-orange-500" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Pending Approvals ({normalizedPendingOrders.length})
          </h3>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <RefreshCw className="h-3 w-3" />
          Auto-refreshing • Last: {lastRefresh.toLocaleTimeString()}
        </div>
      </div>

      {/* Orders List */}
      <Dialog>
        <div className="space-y-3">
        {normalizedPendingOrders.map((order) => (
          <Card
            key={order.id}
            className="border-l-4 border-orange-500 bg-orange-50/30 hover:bg-orange-50/50 transition-colors"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Order Header */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm">
                      #{order.orderNumber}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Order Details
                      </h4>
                      <div className="flex items-center space-x-3 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatRelativeTime((order as any).created_at || order.createdAt)}
                        </span>
                        <span>${Number((order as any).total_amount || order.totalAmount).toFixed(2)}</span>
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                          NEEDS APPROVAL
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="bg-white/80 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      Order Items:
                    </h5>
                    {order.items.map((item: any, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between text-sm mb-1"
                      >
                        <span>
                          {item.quantity}x Item #{item.menuItemId ? item.menuItemId.slice(-8) : "-"}
                        </span>
                        <span className="font-medium">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-2 ml-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => openApprovalDialog(order)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          Approve Order
                        </DialogTitle>
                      </DialogHeader>

                      {selectedOrder && (
                        <div className="space-y-4">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-sm">
                              <strong>Total:</strong> $
                              {Number((selectedOrder as any).total_amount || selectedOrder?.totalAmount).toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {selectedOrder.items.length} items
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Preparation Time (minutes)</Label>
                            <Select
                              value={approvalTime.toString()}
                              onValueChange={(value) =>
                                setApprovalTime(parseInt(value))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5">5 minutes</SelectItem>
                                <SelectItem value="10">10 minutes</SelectItem>
                                <SelectItem value="15">15 minutes</SelectItem>
                                <SelectItem value="20">20 minutes</SelectItem>
                                <SelectItem value="25">25 minutes</SelectItem>
                                <SelectItem value="30">30 minutes</SelectItem>
                                <SelectItem value="45">45 minutes</SelectItem>
                                <SelectItem value="60">1 hour</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500">
                              Customer will be notified to pick up at:{" "}
                              {new Date(
                                Date.now() + approvalTime * 60000,
                              ).toLocaleTimeString()}
                            </p>
                          </div>

                          <Button
                            onClick={() =>
                              handleOrderApproval(selectedOrder.id, true)
                            }
                            className="w-full bg-green-600 hover:bg-green-700"
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            Confirm Approval
                          </Button>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="whitespace-nowrap"
                        onClick={() => openApprovalDialog(order)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          Reject Order
                        </DialogTitle>
                      </DialogHeader>
                      {selectedOrder && (
                        <div className="space-y-4">
                          <div className="bg-gray-50 p-3 rounded-lg mb-3">
                            <div className="text-sm">
                              <strong>Order:</strong> #{selectedOrder.orderNumber || selectedOrder.id}
                            </div>
                            <div className="text-sm text-gray-600">
                              {selectedOrder.items.length} items
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Reason for Rejection</Label>
                            <Select
                              value={rejectionReason}
                              onValueChange={(value) =>
                                setRejectionReason(value)
                              }
                              required
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a reason..." />
                              </SelectTrigger>
                              <SelectContent>
                                {REJECTION_REASONS.map((reason) => (
                                  <SelectItem
                                    key={reason.value}
                                    value={reason.value}
                                  >
                                    {reason.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {rejectionReason === "other" && (
                            <div className="space-y-2">
                              <Label>Custom Reason</Label>
                              <Input
                                value={customReason}
                                onChange={(e) =>
                                  setCustomReason(e.target.value)
                                }
                                placeholder="Please specify reason for rejection"
                                required
                              />
                            </div>
                          )}

                          <Button
                            onClick={() =>
                              handleOrderApproval(selectedOrder.id, false)
                            }
                            variant="destructive"
                            className="w-full"
                            disabled={isProcessing || (!rejectionReason || (rejectionReason === "other" && !customReason))}
                          >
                            {isProcessing ? (
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-2" />
                            )}
                            Confirm Rejection
                          </Button>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      </Dialog>
    </div>
  );
};
