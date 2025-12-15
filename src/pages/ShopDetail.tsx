import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/ui/navigation";
import { PaymentGatewayComponent } from "@/components/PaymentGateway";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ApiService } from "@/lib/api";
import { Shop, MenuItem, Order } from "@/lib/types";
import {
  Plus,
  Minus,
  ShoppingCart,
  Star,
  Clock,
  Users,
  MapPin,
  ArrowLeft,
  Sparkles,
  CheckCircle,
  Heart,
  Bell,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useShop } from "@/contexts/ShopContext";

const ShopDetail = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { refreshShops } = useShop();

  const [shop, setShop] = useState<Shop | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [localCart, setLocalCart] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('localCart');
    return saved ? JSON.parse(saved) : {};
  });
  const [orderStatus, setOrderStatus] = useState<string>("cart");
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    if (!shopId) {
      navigate("/home");
      return;
    }

    loadShopData();
  }, [shopId, navigate]);

  useEffect(() => {
    localStorage.setItem('localCart', JSON.stringify(localCart));
  }, [localCart]);

  const loadShopData = async () => {
    try {
      setLoading(true);
      let shopData = await ApiService.getShopById(shopId!);

      if (shopData) {
        const menuData = await ApiService.getMenuItems(shopId!);
        setShop(shopData);
        setMenuItems(menuData);
        setLoading(false);
        return;
      }

      toast({
        variant: "destructive",
        title: "Shop Not Found",
        description:
          "This shop might have been recently created. Please check the shop list and try again.",
      });
      navigate("/home");
    } catch (error) {
      console.error("Failed to load shop data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load shop data. Redirecting to home...",
      });
      navigate("/home");
    } finally {
      setLoading(false);
    }
  };

  const updateLocalCart = (itemId: string, change: number) => {
    setLocalCart((prev) => {
      const newQuantity = (prev[itemId] || 0) + change;
      if (newQuantity <= 0) {
        const { [itemId]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: newQuantity };
    });
  };

  const getTotalItems = () => {
    return Object.values(localCart).reduce(
      (sum, quantity) => sum + quantity,
      0,
    );
  };

  const getTotalPrice = () => {
    return menuItems
      .reduce((total, item) => {
        const quantity = localCart[item.id] || 0;
        return total + item.price * quantity;
      }, 0)
      .toFixed(2);
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to sign in to place an order.",
      });
      navigate("/auth");
      return;
    }

    if (getTotalItems() === 0) {
      toast({
        variant: "destructive",
        title: "Empty cart",
        description: "Please add items to your cart before placing an order.",
      });
      return;
    }

    if (!shop) {
      toast({
        variant: "destructive",
        title: "Shop not found",
        description: "Unable to place order. Please try again.",
      });
      return;
    }

    try {
      // Place order as before
      const orderItems = Object.entries(localCart)
        .filter(([itemId, quantity]) => quantity > 0)
        .map(([itemId, quantity]) => {
          const menuItem = menuItems.find((item) => item.id === itemId);
          if (!menuItem) {
            throw new Error(`Menu item not found: ${itemId}`);
          }
          return {
            menuItem: {
              id: menuItem.id,
              name: menuItem.name,
              price: menuItem.price,
            },
            quantity,
            notes: "",
          };
        });

      if (orderItems.length === 0) {
        throw new Error("No valid items in cart");
      }

      // Use backend API for order placement
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          shop_id: shop.id,
          items: orderItems,
          total_amount: parseFloat(getTotalPrice()),
          notes: "",
        }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "Order failed");
      const order = result.data;
      setLocalCart({});
      localStorage.removeItem('localCart');
      setOrderStatus("cart");
      toast({
        title: "Order Placed!",
        description: `Your order number is #${order.orderNumber}. It will appear in My Orders.`,
      });
      navigate("/home"); // redirect to the user dashboard
    } catch (error: any) {
      setOrderStatus("cart");
      toast({
        variant: "destructive",
        title: "Order Failed",
        description: error.message || "Could not place order. Please try again.",
      });
    }
  };

  const pollOrderStatus = async (orderId: string) => {
    let attempts = 0;
    const maxAttempts = 30; // Poll for 5 minutes (30 * 10s)

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setOrderStatus("cart"); // Reset on timeout
        toast({
          variant: "destructive",
          title: "Order Timeout",
          description: "No response from the shop. Please try again later.",
        });
        return;
      }

      try {
        const order = await ApiService.getOrderById(orderId);
        if (order) {
          if ((order.status as any) === "approved") {
            setOrderStatus("approved");
            setShowPaymentGateway(true);
            return; // Stop polling
          }
          if ((order.status as any) === "rejected") {
            setOrderStatus("rejected");
            setRejectionReason(order.rejectionReason || "No reason specified.");
            return; // Stop polling
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
      }

      attempts++;
      setTimeout(poll, 10000); // Poll every 10 seconds
    };

    setTimeout(poll, 2000); // Start polling after 2 seconds
  };

  const handlePaymentSuccess = (transactionId: string) => {
    setOrderStatus("completed");
    setShowPaymentGateway(false);
    toast({
      title: "Payment Successful! 🎉",
      description: `Your transaction ID is ${transactionId}.`,
    });
    refreshShops();
  };

  const handlePaymentFailed = (error: string) => {
    toast({
      variant: "destructive",
      title: "Payment Failed",
      description: error,
    });
  };

  const resetOrder = () => {
    setOrderStatus("cart");
    setLocalCart({});
    setCurrentOrder(null);
    localStorage.removeItem('localCart');
  };

  const getCrowdBadge = (level: string) => {
    switch (level) {
      case "low":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <Users className="h-3 w-3 mr-1" />
            Low Crowd
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Users className="h-3 w-3 mr-1" />
            Medium Crowd
          </Badge>
        );
      case "high":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <Users className="h-3 w-3 mr-1" />
            High Crowd
          </Badge>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    if (orderStatus === "completed" && !feedbackSubmitted) {
      setShowFeedback(true);
    }
  }, [orderStatus, feedbackSubmitted]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">Shop not found</h2>
        <p className="text-gray-600">
          The requested shop could not be found.
        </p>
        <Button onClick={() => navigate("/home")} className="mt-4">
          Go to Homepage
        </Button>
      </div>
    );
  }

  // Remove the full-page state for pending approval
  // if (orderStatus === "pending") {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex flex-col">
  //       <Navigation />
  //       <div className="container mx-auto px-4 py-8 flex-grow flex items-center justify-center">
  //         <Card className="w-full max-w-md shadow-lg">
  //           <CardContent className="p-6">
  //             <div className="flex flex-col items-center justify-center p-8 text-center bg-yellow-50 rounded-lg">
  //               <Loader2 className="h-12 w-12 text-yellow-500 animate-spin mb-4" />
  //               <h2 className="text-xl font-semibold text-yellow-800">
  //                 Waiting for shop approval...
  //               </h2>
  //               <p className="text-gray-600 mt-2">
  //                 Your order has been sent. We'll notify you once the shop
  //                 confirms it.
  //               </p>
  //             </div>
  //           </CardContent>
  //         </Card>
  //       </div>
  //       <ModernFooter />
  //     </div>
  //   );
  // }

  // Payment UI
  if (orderStatus === "payment" && currentOrder && user) {
    return (
      <PaymentGatewayComponent
        isOpen={showPaymentGateway}
        onClose={() => setShowPaymentGateway(false)}
        orderDetails={{
          orderId: currentOrder.id,
          amount: currentOrder.totalAmount,
          items: currentOrder.items.map((item: any) => ({
            name: item.menuItem.name || "Unknown Item",
            quantity: item.quantity,
            price: item.menuItem.price,
          })),
          shopName: shop?.name || "Unknown Shop",
          tokenNumber: currentOrder.tokenNumber,
          shopId: shop?.id || "",
        }}
        customerDetails={{
          email: user.email,
          name: user.name,
        }}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentFailed={handlePaymentFailed}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex flex-col">
      <Navigation />
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8 flex-grow">
        <div className="max-w-6xl mx-auto">
          {/* Back button */}
          <Button
            variant="outline"
            onClick={() => navigate("/home")}
            className="mb-4 sm:mb-6 text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shops
          </Button>

          {/* Shop Header */}
          <Card className="mb-6 sm:mb-8 overflow-hidden border-0 shadow-lg">
            <div className="h-32 sm:h-40 md:h-48 bg-gray-200">
              {shop.image && (
                <img
                  src={shop.image}
                  alt={shop.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <CardContent className="p-4 sm:p-6 bg-white/80 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 break-words">
                    {shop.name}
                  </CardTitle>
                  <p className="text-sm sm:text-base text-gray-600 mt-1 break-words">{shop.description}</p>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-500">
                    <span className="flex items-center">
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-yellow-500" /> 4.5
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      {shop.estimatedWaitTime} min wait
                    </span>
                    {getCrowdBadge(shop.crowdLevel)}
                  </div>
                </div>
                <Button variant="outline" className="mt-4 md:mt-0 w-full md:w-auto text-sm sm:text-base">
                  <Heart className="h-4 w-4 mr-2" />
                  Favorite
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {/* Menu Items */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Menu</h2>
              {menuItems.filter(item => item.isAvailable !== false).map((item) => (
                <Card
                  key={item.id}
                  className="border-0 shadow-md hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center flex-1 min-w-0 w-full sm:w-auto">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-lg mr-3 sm:mr-4 overflow-hidden flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base text-gray-800 truncate">
                          {item.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">
                          {item.description}
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-orange-600 mt-1">
                          ₹{item.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 sm:h-10 sm:w-10"
                        onClick={() => updateLocalCart(item.id, -1)}
                        disabled={!localCart[item.id]}
                      >
                        <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <span className="w-8 text-center text-sm sm:text-base">
                        {localCart[item.id] || 0}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 sm:h-10 sm:w-10"
                        onClick={() => updateLocalCart(item.id, 1)}
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Cart and Order Status */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 sm:top-24">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center text-base sm:text-lg">
                      <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Your Order
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    {getTotalItems() === 0 ? (
                      <div className="text-center py-8">
                        <p>Your cart is empty.</p>
                        <p>Add items to get started</p>
                      </div>
                    ) : orderStatus === "approved" ? (
                      <div className="text-center p-8 bg-green-50 rounded-lg shadow-inner">
                        <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800">
                          Order Approved!
                        </h2>
                        <p className="text-gray-600 mt-2 mb-6">
                          Your order is confirmed and is now waiting for payment.
                        </p>
                        <Button
                          onClick={() => setShowPaymentGateway(true)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Sparkles className="mr-2 h-4 w-4" /> Proceed to Payment
                        </Button>
                      </div>
                    ) : orderStatus === "rejected" ? (
                      <div className="text-center py-8">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
                        <p className="text-lg font-medium mb-2 text-red-700">
                          Order Rejected
                        </p>
                        <div className="bg-red-50 p-3 rounded-lg mb-4">
                          <p className="text-sm text-red-700">
                            Reason: {rejectionReason}
                          </p>
                        </div>
                        <Button
                          onClick={resetOrder}
                          variant="outline"
                          className="w-full border-red-200 text-red-700 hover:bg-red-50"
                        >
                          Try Again
                        </Button>
                      </div>
                    ) : orderStatus === "completed" ? (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                        <p className="text-lg font-medium mb-2 text-green-700">
                          Order Confirmed! 🎉
                        </p>
                        <p className="text-sm text-gray-600 mb-4">
                          Your payment was successful. Your food is being
                          prepared!
                        </p>
                        <div className="bg-green-50 p-3 rounded-lg mb-4">
                          <p className="text-sm text-green-700">
                            Token #{currentOrder?.tokenNumber}
                          </p>
                        </div>
                        {/* Feedback Modal/Section */}
                        {showFeedback && !feedbackSubmitted && (
                          <div className="mt-6 p-4 bg-white rounded shadow-md inline-block">
                            <h3 className="text-lg font-semibold mb-2">Rate your experience</h3>
                            <div className="flex justify-center mb-2">
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
                              className="w-full border rounded p-2 mb-2"
                              rows={3}
                              placeholder="Leave feedback (optional)"
                              value={feedback}
                              onChange={e => setFeedback(e.target.value)}
                            />
                            <button
                              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
                              disabled={rating === 0}
                              onClick={async () => {
                                // Call API to save feedback
                                await fetch("/api/feedback", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    orderId: currentOrder?.id,
                                    shopId: shop?.id,
                                    rating,
                                    feedback,
                                  }),
                                });
                                setFeedbackSubmitted(true);
                                setShowFeedback(false);
                              }}
                            >
                              Submit
                            </button>
                          </div>
                        )}
                        {feedbackSubmitted && (
                          <div className="mt-4 text-green-600 font-semibold">Thank you for your feedback!</div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {Object.entries(localCart).map(([itemId, quantity]) => {
                          const item = menuItems.find((m) => m.id === itemId);
                          if (!item) return null;
                          return (
                            <div
                              key={itemId}
                              className="flex justify-between items-center text-sm"
                            >
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-xs text-gray-500">
                                  x {quantity}
                                </p>
                              </div>
                              <p>₹{(item.price * quantity).toFixed(2)}</p>
                            </div>
                          );
                        })}
                        <hr className="my-2" />
                        <div className="flex justify-between font-bold text-lg">
                          <p>Total</p>
                          <p>₹{getTotalPrice()}</p>
                        </div>
                        <Button
                          onClick={handlePlaceOrder}
                          className="w-full mt-4"
                          disabled={orderStatus === "pending"}
                        >
                          {orderStatus === "pending" ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4 mr-2" />
                          )}
                          Place Order & Get Token
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopDetail;
