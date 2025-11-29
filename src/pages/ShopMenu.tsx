import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ApiService } from "@/lib/api";
import { MenuItem } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const ShopMenu = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shopId) {
      setError("Invalid shop ID");
      setLoading(false);
      return;
    }

    const fetchMenuItems = async () => {
      setLoading(true);
      try {
        const items = await ApiService.getMenuItems(shopId);
        setMenuItems(items);
      } catch (err) {
        setError("Failed to load menu items");
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, [shopId]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="outline"
        className="mb-4"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2" />
        Back to Shops
      </Button>

      <h1 className="text-3xl font-bold mb-6">Menu</h1>

      {loading && <p>Loading menu items...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && menuItems.length === 0 && (
        <p>No menu items available for this shop.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <Card key={item.id} className={`shadow-md ${item.isAvailable === false ? 'opacity-50' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center">
                {item.name}
                {item.isAvailable === false && (
                  <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">Unavailable</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2">{item.description}</p>
              <p className="font-semibold">${item.price.toFixed(2)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ShopMenu;
