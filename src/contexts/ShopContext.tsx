import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { Shop } from "@/lib/types";
import { ApiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { io } from "socket.io-client";

interface ShopContextType {
  shops: Shop[];
  loading: boolean;
  refreshShops: () => Promise<void>;
  forceRefresh: () => Promise<void>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchShops = useCallback(async () => {
    if (!user) {
      setShops([]);
      return;
    }
    setLoading(true);
    try {
      // Fetching shops for user
      let loadedShops: Shop[] = [];
      if (user.role === "shopkeeper") {
        loadedShops = await ApiService.getShopsByOwner(user.id);
        // Loaded shops for shopkeeper
      } else {
        loadedShops = await ApiService.getShops();
        // Loaded shops for user
      }
      // Merge closed state from localStorage if present
      setShops(loadedShops);
    } catch (error) {
      console.error("Failed to fetch shops:", error);
      setShops([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Run mock shop cleanup only once when the app starts
  useEffect(() => {
    const removeMockShops = async () => {
      // Checking for mock shops to remove

      const mockShopNames = [
        "Healthy Bites",
        "Pizza Corner",
        "Burger Palace",
        "Akshad",
        "Akshad_6",
      ];

      try {
        const allShops = await ApiService.getShops();
        let hasChanges = false;

        // Remove only mock shops, keep user-created shops
        for (const shop of allShops) {
          if (mockShopNames.includes(shop.name)) {
            try {
              await ApiService.deleteShop(shop.id);
              // Deleted mock shop
              hasChanges = true;
            } catch (error) {
              console.error(`Failed to delete mock shop ${shop.name}:`, error);
            }
          }
        }

        if (hasChanges) {
          // Mock shops cleanup completed
        } else {
          // No mock shops found
        }
      } catch (error) {
        console.error("❌ Error during mock shop cleanup:", error);
      }
    };

    // Only run cleanup once when the app starts
    removeMockShops();
  }, []); // Empty dependency array - runs only once

  // Fetch shops when user changes
  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  // Listen for real-time token count updates
  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
    const socket = io(SOCKET_URL);

    socket.on('shop_tokens_update', (data: { shopId: string; activeTokens: number }) => {
      // Received token count update
      setShops(prevShops => 
        prevShops.map(shop => 
          shop.id === data.shopId 
            ? { ...shop, activeTokens: data.activeTokens }
            : shop
        )
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const refreshShops = useCallback(async () => {
    await fetchShops();
  }, [fetchShops]);

  const forceRefresh = useCallback(async () => {
    await fetchShops();
  }, [fetchShops]);

  return (
    <ShopContext.Provider
      value={{ shops, loading, refreshShops, forceRefresh }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = (): ShopContextType => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within a ShopProvider");
  }
  return context;
};
