import { useEffect, useState } from "react";
import { X, Ticket, Clock, Users, Calendar } from "lucide-react";
import { Order } from "@/lib/types";
import { ApiService } from "@/lib/api";

interface PaymentApprovedCardProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentApprovedCard = ({ order, isOpen, onClose }: PaymentApprovedCardProps) => {
  const [activeTokens, setActiveTokens] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && order.shopId) {
      fetchActiveTokens();
    }
  }, [isOpen, order.shopId]);

  const fetchActiveTokens = async () => {
    try {
      setLoading(true);
      const shop = await ApiService.getShopById(order.shopId);
      if (shop) {
        setActiveTokens(shop.activeTokens || 0);
      }
    } catch (error) {
      console.error("Error fetching active tokens:", error);
    } finally {
      setLoading(false);
    }
  };

  const preparationTime = order.preparationTime || 15; // Default to 15 minutes if not set
  const estimatedPickupTime = order.estimatedPickupTime
    ? new Date(order.estimatedPickupTime).toLocaleTimeString()
    : order.updatedAt && preparationTime
    ? new Date(new Date(order.updatedAt).getTime() + preparationTime * 60000).toLocaleTimeString()
    : 'N/A';

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
        style={{
          animation: isOpen ? 'fadeIn 0.3s ease-out' : 'fadeOut 0.3s ease-out',
        }}
      />
      
      {/* Animated Card */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative transform transition-all duration-500 ease-out"
          style={{
            animation: isOpen ? 'slideUpScale 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'slideDownScale 0.3s ease-in',
            transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)',
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 group"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 mb-4 shadow-lg animate-pulse">
              <Ticket className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Approved!</h2>
            <p className="text-gray-600">Your order is now being prepared</p>
          </div>

          {/* Content */}
          <div className="space-y-4">
            {/* Your Token */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border-2 border-orange-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center">
                  <Ticket className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Your Token</p>
                  <p className="text-2xl font-bold text-orange-600">
                    #{order.tokenNumber || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Active Tokens */}
            <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Current Ongoing Tokens</p>
                  {loading ? (
                    <p className="text-xl font-bold text-blue-600">Loading...</p>
                  ) : (
                    <p className="text-2xl font-bold text-blue-600">{activeTokens}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Time to Prepare */}
            <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Time to Prepare</p>
                  <p className="text-xl font-bold text-purple-600">
                    {preparationTime} minutes
                  </p>
                </div>
              </div>
            </div>

            {/* Time to Pickup */}
            <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Estimated Pickup Time</p>
                  <p className="text-xl font-bold text-green-600">
                    {estimatedPickupTime}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              We'll notify you when your order is ready!
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes slideUpScale {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(30px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes slideDownScale {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
        }
      `}</style>
    </>
  );
};

