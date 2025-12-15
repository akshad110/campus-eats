import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from 'qrcode.react';
import { Upload, X, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface QRPaymentScannerProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  amount: number;
  upiId: string;
  onSuccess: () => void;
}

export const QRPaymentScanner: React.FC<QRPaymentScannerProps> = ({
  isOpen,
  onClose,
  orderId,
  amount,
  upiId,
  onSuccess,
}) => {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // Timer countdown
  useEffect(() => {
    if (!isOpen || isSubmitted) return;
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isSubmitted]);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(300);
      setScreenshot(null);
      setScreenshotPreview(null);
      setIsSubmitted(false);
    }
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setScreenshot(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setScreenshotPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        alert('Please select an image file');
      }
    }
  };

  const handleSubmit = async () => {
    if (!screenshot) {
      alert('Please upload a payment screenshot');
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload image to Cloudinary (or get base64 fallback)
      const { uploadImage } = await import('@/lib/imageUpload');
      const imageUrl = await uploadImage(screenshot);
      
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      
      // Upload screenshot to backend and update order status
      const response = await fetch(`${API_URL}/orders/${orderId}/payment-screenshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screenshot: imageUrl,
          payment_status: 'pending',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to upload screenshot');
      }

      // Update order status to payment_pending
      const statusResponse = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_status: 'pending',
          payment_screenshot: imageUrl,
        }),
      });

      if (!statusResponse.ok) {
        throw new Error('Failed to update order status');
      }

      setIsSubmitted(true);
      setIsSubmitting(false);
      
      // Call onSuccess callback to refresh orders list
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      alert('Failed to submit payment screenshot. Please try again.');
      setIsSubmitting(false);
    }
  };

  const upiString = `upi://pay?pa=${upiId}&am=${amount}&cu=INR&tn=TakeAway Order Payment`;

  if (isSubmitted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Payment Submitted
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800 font-semibold">
                Waiting for shopkeeper to approve your payment
              </p>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Your payment screenshot has been submitted. The shopkeeper will review it and approve your order.
            </p>
            <Button onClick={() => {
              onClose();
              // Small delay to ensure state updates are processed
              setTimeout(() => {
                if (onSuccess) onSuccess();
              }, 100);
            }} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Scan QR Code to Pay</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Timer */}
          <div className="flex items-center justify-center gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
            <Clock className="h-5 w-5 text-orange-600" />
            <span className="text-lg font-bold text-orange-600">
              {formatTime(timeLeft)}
            </span>
            <span className="text-sm text-gray-600">remaining</span>
          </div>

          {timeLeft === 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              <p className="text-sm text-red-800 font-semibold">
                Time expired! Please try again.
              </p>
            </div>
          )}

          {/* QR Code */}
          {timeLeft > 0 && (
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                <QRCodeSVG value={upiString} size={200} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">Amount: ₹{amount.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Scan with your UPI app</p>
              </div>
            </div>
          )}

          {/* Screenshot Upload */}
          {timeLeft > 0 && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Upload Payment Screenshot
              </label>
              {screenshotPreview ? (
                <div className="relative">
                  <img
                    src={screenshotPreview}
                    alt="Payment screenshot"
                    className="w-full h-48 object-contain border border-gray-300 rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setScreenshot(null);
                      setScreenshotPreview(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-orange-500 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Click to upload payment screenshot
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PNG, JPG up to 5MB
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Submit Button */}
          {timeLeft > 0 && screenshot && (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !screenshot}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Payment'}
            </Button>
          )}

          {timeLeft === 0 && (
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

