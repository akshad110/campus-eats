import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, CheckCircle, AlertTriangle, X } from "lucide-react";
import { RazorpayService } from "@/lib/razorpay";
import { ApiService } from "@/lib/api";

// Declare Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  orderDetails: {
    orderId: string;
    amount: number;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    shopName: string;
    tokenNumber: number;
    shopId: string;
  };
  customerDetails: {
    email: string;
    name: string;
  };
  onPaymentSuccess: (transactionId: string) => void;
  onPaymentFailed: (error: string) => void;
}

export const RazorpayPayment = ({
  isOpen,
  onClose,
  orderDetails,
  customerDetails,
  onPaymentSuccess,
  onPaymentFailed,
}: RazorpayPaymentProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<
    "loading" | "ready" | "processing" | "success" | "failed"
  >("loading");
  const [transactionId, setTransactionId] = useState("");
  const [razorpayOrderId, setRazorpayOrderId] = useState("");
  const { toast } = useToast();

  // Load Razorpay script
  useEffect(() => {
    if (!isOpen) return;

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      setPaymentStep("ready");
    };
    script.onerror = () => {
      setPaymentStep("failed");
      onPaymentFailed("Failed to load Razorpay payment gateway");
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup script when component unmounts
      const existingScript = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, [isOpen, onPaymentFailed]);

  const handlePayment = async () => {
    if (!window.Razorpay) {
      toast({
        variant: "destructive",
        title: "Payment gateway not loaded",
        description: "Please wait for the payment gateway to load",
      });
      return;
    }

    setIsProcessing(true);
    setPaymentStep("processing");

    try {
      // Create Razorpay order
      const orderResponse = await RazorpayService.createOrder(
        orderDetails.amount,
        orderDetails.orderId,
        customerDetails.name,
        customerDetails.email
      );

      if (!orderResponse.success || !orderResponse.order) {
        const errorMsg = orderResponse.error || "Failed to create payment order";
        console.error("Razorpay order creation failed:", errorMsg);
        setIsProcessing(false);
        setPaymentStep("failed");
        onPaymentFailed(errorMsg);
        return;
      }

      setRazorpayOrderId(orderResponse.order.id);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
        amount: orderResponse.order.amount,
        currency: orderResponse.order.currency,
        name: "TakeAway",
        description: `Payment for Order #${orderDetails.tokenNumber}`,
        order_id: orderResponse.order.id,
        handler: async function (response: any) {
          // Verify payment on backend
          const verificationResponse = await RazorpayService.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderId: orderDetails.orderId,
          });

          if (verificationResponse.success) {
            setTransactionId(response.razorpay_payment_id);
            setPaymentStep("success");

            // Update order status - payment completed and status to preparing
            // The backend will handle setting status to 'preparing' automatically
            await ApiService.updateOrderStatus(
              orderDetails.orderId,
              "preparing", // Set status to preparing after payment
              undefined,
              "completed", // Set payment_status to completed
              response.razorpay_payment_id
            );

            toast({
              title: "Payment successful!",
              description: `Transaction ID: ${response.razorpay_payment_id}`,
            });

            onPaymentSuccess(response.razorpay_payment_id);
          } else {
            setPaymentStep("failed");
            onPaymentFailed(
              verificationResponse.error || "Payment verification failed"
            );
          }
          setIsProcessing(false);
        },
        prefill: {
          name: customerDetails.name,
          email: customerDetails.email,
        },
        theme: {
          color: "#f97316", // Orange color matching TakeAway theme
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            setPaymentStep("ready");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response: any) {
        setIsProcessing(false);
        setPaymentStep("failed");
        onPaymentFailed(
          response.error?.description || "Payment failed. Please try again."
        );
      });

      razorpay.open();
    } catch (error: any) {
      console.error("Payment error:", error);
      setIsProcessing(false);
      setPaymentStep("failed");
      onPaymentFailed(error.message || "Payment processing failed");
    }
  };

  const resetPayment = () => {
    setPaymentStep("ready");
    setTransactionId("");
    setRazorpayOrderId("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Lock className="h-5 w-5 mr-2 text-green-600" />
            Secure Payment
          </DialogTitle>
        </DialogHeader>

        {/* Order Summary */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {orderDetails.shopName}
                </span>
                <Badge>Token #{orderDetails.tokenNumber}</Badge>
              </div>
              <Separator />
              {orderDetails.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>
                    {item.name} x{item.quantity}
                  </span>
                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-green-600">
                  ₹{orderDetails.amount.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {paymentStep === "loading" && (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <h3 className="text-lg font-semibold">Loading Payment Gateway...</h3>
            <p className="text-sm text-gray-500">Please wait</p>
          </div>
        )}

        {/* Ready State */}
        {paymentStep === "ready" && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                You will be redirected to Razorpay secure payment gateway to complete your payment.
              </p>
            </div>
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handlePayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ₹${orderDetails.amount.toFixed(2)}`
              )}
            </Button>
          </div>
        )}

        {/* Processing State */}
        {paymentStep === "processing" && (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <h3 className="text-lg font-semibold">Processing Payment...</h3>
            <p className="text-sm text-gray-500">
              Please complete the payment in the popup window.
            </p>
          </div>
        )}

        {/* Success State */}
        {paymentStep === "success" && (
          <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
            <CheckCircle className="h-16 w-16 text-green-600" />
            <h3 className="text-xl font-bold">Payment Successful!</h3>
            <p className="text-sm text-gray-600">
              Transaction ID: <br />
              <span className="font-mono bg-gray-100 p-1 rounded text-xs">
                {transactionId}
              </span>
            </p>
            <Button onClick={onClose} className="w-full">
              Done
            </Button>
          </div>
        )}

        {/* Failed State */}
        {paymentStep === "failed" && (
          <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
            <AlertTriangle className="h-16 w-16 text-red-600" />
            <h3 className="text-xl font-bold">Payment Failed</h3>
            <p className="text-sm text-gray-600">
              {transactionId ? 
                "Unfortunately, we couldn't process your payment. Please try again." :
                "Payment gateway is not configured. Please contact support."
              }
            </p>
            {transactionId && (
              <Button onClick={resetPayment} variant="outline" className="w-full">
                Try Again
              </Button>
            )}
            {!transactionId && (
              <Button onClick={onClose} variant="outline" className="w-full">
                Close
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

