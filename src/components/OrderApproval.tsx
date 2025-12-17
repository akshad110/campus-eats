import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
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
import { MenuItem } from "@/lib/types";
import { formatTimeIST, calculatePickupTimeIST } from "@/lib/utils";
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
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    loadPendingOrders();
    loadMenuItems();
    // Poll for new orders every 15 seconds for real-time updates
    const interval = setInterval(() => {
      loadPendingOrders();
      setLastRefresh(new Date());
    }, 15000);
    return () => clearInterval(interval);
  }, [shopId]);

  const loadMenuItems = async () => {
    try {
      const items = await ApiService.getMenuItems(shopId);
      setMenuItems(items);
    } catch (error) {
      console.error("Failed to load menu items:", error);
    }
  };

  const loadPendingOrders = async () => {
    try {
      // Fetch from backend API
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/shops/${shopId}/orders/pending`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "Failed to fetch pending orders");
      setPendingOrders(result.data);
      // Loaded pending orders
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

      // When approving, set payment_status to null (not 'pending') so Pay Now button shows
      // payment_status will be set to 'pending' when user uploads payment screenshot
      await ApiService.updateOrderStatus(
        orderId,
        approved ? "approved" : "rejected",
        approved ? undefined : finalReason,
        approved ? null : undefined, // Set payment_status to null for approved orders (not 'pending')
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
      
      // Order processed
      if (onOrderUpdate) {
        onOrderUpdate();
      } else {
        // onOrderUpdate function not provided
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
              {t("orderApproval.noPendingOrders")}
            </h3>
            <p className="text-sm text-gray-500">
              {t("orderApproval.allCaughtUp")}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center text-xs text-gray-400">
          <RefreshCw className="h-3 w-3 mr-1" />
          {t("orderApproval.lastChecked")}: {lastRefresh.toLocaleTimeString()}
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
            {t("orderApproval.pendingApprovals")} ({normalizedPendingOrders.length})
          </h3>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <RefreshCw className="h-3 w-3" />
          {t("orderApproval.autoRefreshing")} • {t("orderApproval.last")}: {lastRefresh.toLocaleTimeString()}
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
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
                <div className="flex-1">
                  {/* Order Header */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm">
                      #{order.orderNumber}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {t("orderApproval.orderDetails")}
                      </h4>
                      <div className="flex items-center space-x-3 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatRelativeTime((order as any).created_at || order.createdAt)}
                        </span>
                        <span>₹{Number((order as any).total_amount || order.totalAmount).toFixed(2)}</span>
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                          {t("orderApproval.needsApproval")}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                    <div className="bg-white/80 rounded-lg p-3 space-y-2">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      {t("orderApproval.items")}:
                    </h5>
                    {order.items.map((item: any, index: number) => {
                      // Get price from item.price, item.menuItem?.price, or default to 0
                      const itemPrice = Number(item.price) || Number(item.menuItem?.price) || 0;
                      const quantity = Number(item.quantity) || 1;
                      const totalPrice = itemPrice * quantity;
                      const isValidPrice = !isNaN(totalPrice) && isFinite(totalPrice);
                      
                      // Get menu item name from menuItems array or item data
                      const menuItem = menuItems.find(mi => mi.id === item.menu_item_id || mi.id === item.menuItemId);
                      const itemName = menuItem?.name || item.name || item.menuItem?.name || (item.menuItemId ? `Item #${item.menuItemId.slice(-8)}` : "Item");
                      
                      return (
                      <div
                        key={index}
                        className="flex justify-between text-sm mb-1"
                      >
                        <span>
                            {quantity}x {itemName}
                        </span>
                        <span className="font-medium">
                            ₹{isValidPrice ? totalPrice.toFixed(2) : '0.00'}
                        </span>
                      </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-2 mt-4 md:mt-0 md:ml-4 w-full md:w-auto">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => openApprovalDialog(order)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {t("orderApproval.approve")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          {t("orderApproval.approveOrder")}
                        </DialogTitle>
                      </DialogHeader>

                      {selectedOrder && (
                        <div className="space-y-4">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-sm">
                              <strong>{t("orderApproval.total")}:</strong> ₹
                              {Number((selectedOrder as any).total_amount || selectedOrder?.totalAmount).toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {selectedOrder.items.length} {t("orderApproval.items")}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>{t("orderApproval.preparationTime")}</Label>
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
                                <SelectItem value="5">5 {t("orders.minutes")}</SelectItem>
                                <SelectItem value="10">10 {t("orders.minutes")}</SelectItem>
                                <SelectItem value="15">15 {t("orders.minutes")}</SelectItem>
                                <SelectItem value="20">20 {t("orders.minutes")}</SelectItem>
                                <SelectItem value="25">25 {t("orders.minutes")}</SelectItem>
                                <SelectItem value="30">30 {t("orders.minutes")}</SelectItem>
                                <SelectItem value="45">45 {t("orders.minutes")}</SelectItem>
                                <SelectItem value="60">1 {t("orderApproval.hour")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500">
                              {t("orderApproval.customerWillBeNotified")}:{" "}
                              {calculatePickupTimeIST(new Date(), approvalTime)}
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
                            {t("orderApproval.confirmApproval")}
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
                        {t("orderApproval.reject")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          {t("orderApproval.rejectOrder")}
                        </DialogTitle>
                      </DialogHeader>
                      {selectedOrder && (
                        <div className="space-y-4">
                          <div className="bg-gray-50 p-3 rounded-lg mb-3">
                            <div className="text-sm">
                              <strong>{t("orderApproval.order")}:</strong> #{(selectedOrder as any).orderNumber || (selectedOrder as any).order_number || selectedOrder.id}
                            </div>
                            <div className="text-sm text-gray-600">
                              {selectedOrder.items.length} {t("orderApproval.items")}
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
