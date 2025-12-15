import React from "react";
import { useShop } from "@/contexts/ShopContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

const ShopList = () => {
  const { t } = useTranslation();
  const { shops, loading, refreshShops } = useShop();
  const navigate = useNavigate();

  const handleViewMenu = (shopId: string) => {
    navigate(`/shop/${shopId}/menu`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t("shopList.title")}</h1>
      <Button onClick={refreshShops} className="mb-4">
        {t("shopList.refreshShops")}
      </Button>
      {loading ? (
        <p>{t("shopList.loadingShops")}</p>
      ) : shops.length === 0 ? (
        <p>{t("shopList.noShops")}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {shops.filter(shop => shop.closed === false).map((shop) => {
            console.log("Shop data in ShopList:", shop);
            return (
              <Card key={shop.id} className="shadow-md">
                <CardHeader>
                  <CardTitle>{shop.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-2">{shop.category}</p>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Clock className="mr-1" size={14} />
                    <span>{shop.estimatedWaitTime} {t("common.minWait")}</span>
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{t("shopList.activeTokens")}</span>
                      <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">
                        {typeof shop.activeTokens === "number" ? shop.activeTokens : 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{t("shopList.currentOrders")}</span>
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {typeof shop.current_orders === "number" ? shop.current_orders : 0}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleViewMenu(shop.id)}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {t("shopList.viewMenu")}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ShopList;
