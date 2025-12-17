// Razorpay payment integration utilities

export interface RazorpayOrderResponse {
  success: boolean;
  order?: {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
  };
  error?: string;
}

export interface RazorpayPaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  orderId: string;
}

export class RazorpayService {
  private static readonly API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

  // Create Razorpay order
  static async createOrder(
    amount: number,
    orderId: string,
    customerName?: string,
    customerEmail?: string
  ): Promise<RazorpayOrderResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/razorpay/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          currency: "INR",
          orderId,
          customerName,
          customerEmail,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Server error" }));
        return {
          success: false,
          error: errorData.error || `Server error: ${response.status}`,
        };
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error("Error creating Razorpay order:", error);
      return {
        success: false,
        error: error.message || "Failed to create payment order",
      };
    }
  }

  // Verify Razorpay payment
  static async verifyPayment(
    verificationData: RazorpayPaymentVerification
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/razorpay/verify-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(verificationData),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error verifying Razorpay payment:", error);
      return {
        success: false,
        error: "Failed to verify payment",
      };
    }
  }

  // Process Razorpay refund
  static async processRefund(
    paymentId: string,
    orderId: string,
    amount?: number // Optional: for partial refunds, if not provided, full refund
  ): Promise<{ success: boolean; refundId?: string; message?: string; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/razorpay/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payment_id: paymentId,
          order_id: orderId,
          amount: amount, // If not provided, backend will do full refund
        }),
      });

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error("Error processing Razorpay refund:", error);
      return {
        success: false,
        error: error.message || "Failed to process refund",
      };
    }
  }
}

