// Payment Gateway Service
import { ApiService } from "./api";

export interface PaymentDetails {
  amount: number;
  currency: string;
  orderId: string;
  customerEmail: string;
  customerName: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  message: string;
  error?: string;
}

export class PaymentGateway {
  private static readonly GATEWAY_URL =
    import.meta.env.VITE_PAYMENT_GATEWAY_URL ||
    "https://mock-payment-gateway.com";

  // Mock payment gateway for demo purposes
  static async processPayment(details: PaymentDetails): Promise<PaymentResult> {
    return new Promise((resolve) => {
      // Simulate payment processing delay
      setTimeout(() => {
        // Mock payment logic - in real app, this would integrate with Stripe, PayPal, etc.
        const isSuccess = Math.random() > 0.1; // 90% success rate for demo

        if (isSuccess) {
          resolve({
            success: true,
            transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            message: "Payment processed successfully",
          });
        } else {
          resolve({
            success: false,
            message: "Payment failed",
            error: "Insufficient funds or card declined",
          });
        }
      }, 2000); // 2 second delay to simulate processing
    });
  }

  // Create payment session (for real payment gateways)
  static async createPaymentSession(
    details: PaymentDetails,
  ): Promise<{ sessionId: string; url: string }> {
    // In a real implementation, this would create a session with your payment provider
    return {
      sessionId: `session_${Date.now()}`,
      url: `${this.GATEWAY_URL}/checkout?session=session_${Date.now()}`,
    };
  }

  // Verify payment status
  static async verifyPayment(transactionId: string): Promise<boolean> {
    // In real implementation, verify with payment provider
    return Math.random() > 0.05; // 95% verification success for demo
  }
}

// Mock payment methods for UI
export const PAYMENT_METHODS = [
  {
    id: "card",
    name: "Credit/Debit Card",
    icon: "💳",
    description: "Visa, Mastercard, American Express",
  },
  {
    id: "upi",
    name: "UPI",
    icon: "📱",
    description: "Google Pay, PhonePe, Paytm",
  },
  {
    id: "wallet",
    name: "Digital Wallet",
    icon: "💰",
    description: "Campus wallet, PayPal",
  },
];
