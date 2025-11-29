import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { MenuItem } from "@/lib/types";
import { ApiService } from "@/lib/api";

interface ShopMenuContextType {
  menuItems: MenuItem[];
  selectedShopId: string | null;
  setSelectedShopId: (shopId: string | null) => void;
  refreshMenuItems: () => Promise<void>;
}

const ShopMenuContext = createContext<ShopMenuContextType | undefined>(undefined);

export const ShopMenuProvider = ({ children }: { children: ReactNode }) => {
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const refreshMenuItems = async () => {
    if (!selectedShopId) {
      setMenuItems([]);
      return;
    }
    try {
      const items = await ApiService.getMenuItems(selectedShopId);
      setMenuItems(items);
    } catch (error) {
      console.error("Failed to refresh menu items:", error);
      setMenuItems([]);
    }
  };

  useEffect(() => {
    refreshMenuItems();
  }, [selectedShopId]);

  return (
    <ShopMenuContext.Provider
      value={{ menuItems, selectedShopId, setSelectedShopId, refreshMenuItems }}
    >
      {children}
    </ShopMenuContext.Provider>
  );
};

export const useShopMenu = (): ShopMenuContextType => {
  const context = useContext(ShopMenuContext);
  if (!context) {
    throw new Error("useShopMenu must be used within a ShopMenuProvider");
  }
  return context;
};
