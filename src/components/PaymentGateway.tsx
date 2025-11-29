import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { PaymentGateway, PaymentDetails, PAYMENT_METHODS } from "@/lib/payment";
import { OrderManagement } from "@/lib/orderManagement";
import {
  CreditCard,
  Smartphone,
  Wallet,
  DollarSign,
  Lock,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { ApiService } from "@/lib/api";
import QRCode from 'react-qr-code';

interface PaymentGatewayProps {
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

export const PaymentGatewayComponent = ({
  isOpen,
  onClose,
  orderDetails,
  customerDetails,
  onPaymentSuccess,
  onPaymentFailed,
}: PaymentGatewayProps) => {
  const [selectedMethod, setSelectedMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<
    "select" | "details" | "processing" | "success" | "failed"
  >("select");
  const [transactionId, setTransactionId] = useState("");
  const { toast } = useToast();

  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });

  const [upiId, setUpiId] = useState("");
  const [shopUpiId, setShopUpiId] = useState<string | null>(null);
  const [upiStep, setUpiStep] = useState<'input' | 'waiting' | 'done'>('input');

  useEffect(() => {
    if (isOpen && selectedMethod === "upi") {
      // Fetch shop UPI ID using the correct shopId
      ApiService.getShopById(orderDetails.shopId)
        .then(shop => setShopUpiId(shop?.upiId || null));
    }
  }, [isOpen, selectedMethod, orderDetails.shopId]);

  const handlePaymentSubmit = async () => {
    if (!selectedMethod) return;

    // Validate payment details based on method
    if (selectedMethod === "card") {
      if (
        !cardDetails.number ||
        !cardDetails.expiry ||
        !cardDetails.cvv ||
        !cardDetails.name
      ) {
        toast({
          variant: "destructive",
          title: "Invalid card details",
          description: "Please fill in all card information",
        });
        return;
      }
    } else if (selectedMethod === "upi") {
      if (!shopUpiId) {
        toast({
          variant: "destructive",
          title: "Invalid UPI ID",
          description: "This shop has not set a valid UPI ID for payments.",
        });
        return;
      }
    }

    setIsProcessing(true);
    setPaymentStep("processing");

    try {
      const paymentDetails: PaymentDetails = {
        amount: orderDetails.amount,
        currency: "INR",
        orderId: orderDetails.orderId,
        customerEmail: customerDetails.email,
        customerName: customerDetails.name,
      };

      const result = await PaymentGateway.processPayment(paymentDetails);

      if (result.success && result.transactionId) {
        setTransactionId(result.transactionId);
        setPaymentStep("success");

        // Update order status in backend with transaction_id
        await ApiService.updateOrderStatus(orderDetails.orderId, undefined, undefined, 'completed', result.transactionId);

        toast({
          title: "Payment successful!",
          description: `Transaction ID: ${result.transactionId}`,
        });

        onPaymentSuccess(result.transactionId);
      } else {
        setPaymentStep("failed");
        await ApiService.updateOrderStatus(orderDetails.orderId, undefined, undefined, 'failed');
        onPaymentFailed(result.error || "Payment failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentStep("failed");
      onPaymentFailed("Payment processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetPayment = () => {
    setPaymentStep("select");
    setTransactionId("");
    setCardDetails({ number: "", expiry: "", cvv: "", name: "" });
    setUpiId("");
  };

  const getPaymentIcon = (methodId: string) => {
    switch (methodId) {
      case "card":
        return <CreditCard className="h-5 w-5" />;
      case "upi":
        return <Smartphone className="h-5 w-5" />;
      case "wallet":
        return <Wallet className="h-5 w-5" />;
      case "cash":
        return <DollarSign className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
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
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-green-600">
                  ${orderDetails.amount.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Selection */}
        {paymentStep === "select" && (
          <div className="space-y-4">
            <h3 className="font-medium">Select Payment Method</h3>
            <RadioGroup
              value={selectedMethod}
              onValueChange={setSelectedMethod}
            >
              {PAYMENT_METHODS.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <RadioGroupItem value={method.id} id={method.id} />
                  <div className="flex items-center space-x-3 flex-1">
                    <span className="text-2xl">{getPaymentIcon(method.id)}</span>
                    <div>
                      <Label
                        htmlFor={method.id}
                        className="font-medium cursor-pointer"
                      >
                        {method.name}
                      </Label>
                      <p className="text-xs text-gray-500">
                        {method.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => setPaymentStep("details")}
            >
              Continue
            </Button>
          </div>
        )}

        {/* Payment Details Form */}
        {paymentStep === "details" && (
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPaymentStep("select")}
              className="mb-4"
            >
              &larr; Back to methods
            </Button>
            {selectedMethod === "card" && (
              <div className="space-y-3">
                <h3 className="font-medium">Enter Card Details</h3>
                <Input
                  placeholder="Card Number"
                  value={cardDetails.number}
                  onChange={(e) =>
                    setCardDetails({ ...cardDetails, number: e.target.value })
                  }
                />
                <div className="flex space-x-2">
                  <Input
                    placeholder="MM/YY"
                    value={cardDetails.expiry}
                    onChange={(e) =>
                      setCardDetails({ ...cardDetails, expiry: e.target.value })
                    }
                  />
                  <Input
                    placeholder="CVV"
                    value={cardDetails.cvv}
                    onChange={(e) =>
                      setCardDetails({ ...cardDetails, cvv: e.target.value })
                    }
                  />
                </div>
                <Input
                  placeholder="Name on Card"
                  value={cardDetails.name}
                  onChange={(e) =>
                    setCardDetails({ ...cardDetails, name: e.target.value })
                  }
                />
              </div>
            )}
            {selectedMethod === "upi" && (
              <div className="space-y-3">
                <h3 className="font-medium">Pay via UPI</h3>
                {shopUpiId ? (
                  <>
                    <div className="flex flex-col items-center space-y-2">
                      <span className="font-mono text-lg">{shopUpiId}</span>
                      <QRCode value={`upi://pay?pa=${shopUpiId}&pn=${encodeURIComponent(orderDetails.shopName)}&am=${orderDetails.amount}&cu=INR`} size={128} />
                    </div>
                    <p className="text-sm text-gray-600">Scan this QR code or use the UPI ID above in your UPI app (GPay, PhonePe, Paytm, etc.) to pay <b>₹{orderDetails.amount}</b> to the shopkeeper.</p>
                    <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => setUpiStep('done')}>
                      I have paid
                    </Button>
                  </>
                ) : (
                  <p className="text-xs text-red-500">This shop has not set a UPI ID for payments.</p>
                )}
                {upiStep === 'done' && (
                  <div className="space-y-2 text-center">
                    <p className="text-green-700 font-semibold">Thank you! Your payment will be verified by the shopkeeper.</p>
                    <p className="text-sm text-gray-600">If you face any issues, please contact the shop directly.</p>
                    <Button className="w-full mt-2" onClick={onClose}>Close</Button>
                  </div>
                )}
              </div>
            )}
             {selectedMethod === 'wallet' && (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">Campus Wallet</p>
                <p className="text-sm text-gray-600">You will be redirected to complete the payment.</p>
              </div>
            )}
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handlePaymentSubmit}
            >
              Pay ${orderDetails.amount.toFixed(2)}
            </Button>
          </div>
        )}

        {/* Processing State */}
        {paymentStep === "processing" && (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <h3 className="text-lg font-semibold">Processing Payment...</h3>
            <p className="text-sm text-gray-500">Please wait, do not close this window.</p>
          </div>
        )}

        {/* Success State */}
        {paymentStep === "success" && (
          <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
            <CheckCircle className="h-16 w-16 text-green-600" />
            <h3 className="text-xl font-bold">Payment Successful!</h3>
            <p className="text-sm text-gray-600">
              Transaction ID: <br />
              <span className="font-mono bg-gray-100 p-1 rounded text-xs">{transactionId}</span>
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
              Unfortunately, we couldn't process your payment. Please try again.
            </p>
            <Button onClick={resetPayment} variant="outline" className="w-full">
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
