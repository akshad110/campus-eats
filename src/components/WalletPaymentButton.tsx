import React, { useEffect, useState } from 'react';
import { useStripe, useElements, PaymentRequestButtonElement } from '@stripe/react-stripe-js';

export function WalletPaymentButton({ amount, orderId, onSuccess }: { amount: number, orderId: string, onSuccess?: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!stripe) return;
    setLoading(true);
    // 1. Create PaymentIntent on backend
    fetch('http://localhost:3001/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency: 'gbp' }),
    })
      .then(res => res.json())
      .then(data => {
        setClientSecret(data.clientSecret);
        setLoading(false);
      })
      .catch(() => {
        setMessage('Failed to load payment options.');
        setLoading(false);
      });
  }, [stripe, amount]);

  useEffect(() => {
    if (!stripe || !clientSecret) return;
    // 2. Setup PaymentRequest
    const pr = stripe.paymentRequest({
      country: 'GB',
      currency: 'gbp',
      total: {
        label: 'Total',
        amount: amount,
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });
    pr.canMakePayment().then(result => {
      if (result) setPaymentRequest(pr);
      else setPaymentRequest(null);
    });
    // 3. Handle payment
    pr.on('paymentmethod', async (ev: any) => {
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret!,
        { payment_method: ev.paymentMethod.id },
        { handleActions: false }
      );
      if (error) {
        ev.complete('fail');
        setMessage(error.message);
      } else {
        ev.complete('success');
        setMessage('Payment successful!');
        // Update paymentStatus in backend
        if (orderId) {
          await fetch(`http://localhost:3001/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_status: 'completed' }),
          });
        }
        if (onSuccess) onSuccess();
      }
    });
  }, [stripe, clientSecret, amount, orderId, onSuccess]);

  if (loading) return <div>Loading payment options...</div>;
  if (message) return <div>{message}</div>;
  if (!paymentRequest) return <div>Wallet payment methods are not available on this device/browser.</div>;

  return (
    <div>
      <PaymentRequestButtonElement options={{ paymentRequest }} />
    </div>
  );
} 