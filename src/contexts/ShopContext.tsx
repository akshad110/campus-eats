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
      console.log(`🔄 Fetching shops for user: ${user.name} (${user.role})`);
      let loadedShops: Shop[] = [];
      if (user.role === "shopkeeper") {
        loadedShops = await ApiService.getShopsByOwner(user.id);
        console.log(`✅ Loaded ${loadedShops.length} shops for shopkeeper`);
      } else {
        loadedShops = await ApiService.getShops();
        console.log(`✅ Loaded ${loadedShops.length} shops for user`);
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
      console.log("🧹 Checking for mock shops to remove...");

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
              console.log(`🗑️ Deleted mock shop: ${shop.name}`);
              hasChanges = true;
            } catch (error) {
              console.error(`Failed to delete mock shop ${shop.name}:`, error);
            }
          }
        }

        if (hasChanges) {
          console.log("✅ Mock shops cleanup completed");
        } else {
          console.log("✅ No mock shops found to remove");
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
