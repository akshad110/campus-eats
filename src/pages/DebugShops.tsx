import React, { useEffect, useState } from "react";
import { ApiService } from "@/lib/api";
import { Shop } from "@/lib/types";
import { Button } from "@/components/ui/button";

const DebugShops = () => {
  const [shops, setShops] = useState<Shop[]>([]);

  const loadShops = async () => {
    const allShops = await ApiService.getShops();
    setShops(allShops);
  };

  const deleteShopById = async (id: string) => {
    try {
      const success = await ApiService.deleteShop(id);
      if (success) {
        alert(`Shop with ID ${id} deleted successfully.`);
        await loadShops();
      } else {
        alert(`Failed to delete shop with ID ${id}.`);
      }
    } catch (error) {
      console.error("Error deleting shop:", error);
      alert("An error occurred while deleting the shop.");
    }
  };

  // New function to delete shops by their names
  const deleteShopsByName = async (names: string[]) => {
    const shopsToDelete = shops.filter((shop) => names.includes(shop.name));
    for (const shop of shopsToDelete) {
      await deleteShopById(shop.id);
    }
  };

  // Forced cleanup utility to delete orphan shops not in ShopSetup
  const forcedCleanupOrphanShops = async () => {
    try {
      // Fetch all shops
      const allShops = await ApiService.getShops();

      // For this utility, consider shops with no owner or with ownerId not matching any user as orphan
      // Since we don't have user list here, consider shops with empty or null ownerId as orphan
      const orphanShops = allShops.filter(shop => !shop.ownerId);

      // Delete orphan shops
      for (const orphanShop of orphanShops) {
        await ApiService.deleteShop(orphanShop.id);
        console.log(`Forced cleanup: Deleted orphan shop '${orphanShop.name}'`);
      }
    } catch (error) {
      console.error("Forced cleanup error:", error);
    }
  };

  useEffect(() => {
    const cleanupAndDelete = async () => {
      await forcedCleanupOrphanShops();
      await loadShops();
    };
    cleanupAndDelete();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Debug Shops</h1>
      {shops.length === 0 ? (
        <p>No shops found.</p>
      ) : (
        <ul>
          {shops.map((shop) => (
            <li key={shop.id} className="mb-2 flex items-center justify-between">
              <span>{shop.name}</span>
              <Button
                variant="destructive"
                onClick={() => deleteShopById(shop.id)}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DebugShops;
