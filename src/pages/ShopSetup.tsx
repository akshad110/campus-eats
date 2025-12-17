import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Navigation } from "@/components/ui/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useShop } from "@/contexts/ShopContext";
import { useToast } from "@/hooks/use-toast";
import { useShopMenu } from "@/contexts/ShopMenuContext";
import { ApiService } from "@/lib/api";
import { Shop } from "@/lib/types";
import {
  Store,
  Plus,
  Edit,
  Image as ImageIcon,
  MapPin,
  Phone,
  Clock,
  Save,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";

const shopSchema = z.object({
  name: z.string().min(2, "Shop name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Please select a category"),
  location: z.string().min(5, "Location must be at least 5 characters"),
  phone: z.string().optional(),
  image: z.string().optional(),
  upiId: z.string().optional(),
});

type ShopForm = z.infer<typeof shopSchema>;

const ShopSetup = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { forceRefresh } = useShop();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { menuItems, selectedShopId, setSelectedShopId, refreshMenuItems } = useShopMenu();
  const [isLoading, setIsLoading] = useState(false);
  const [existingShops, setExistingShops] = useState<Shop[]>([]);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);

  const form = useForm<ShopForm>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      location: "",
      phone: "",
      image: "",
      upiId: "",
    },
  });

  useEffect(() => {
    if (user?.role !== "shopkeeper") {
      navigate("/");
      return;
    }

    loadUserShops();
  }, [user, navigate]);

  const loadUserShops = async () => {
    if (!user) return;

    try {
      const shops = await ApiService.getShopsByOwner(user.id);
      setExistingShops(shops);
      if (shops.length > 0) {
        setSelectedShopId(shops[0].id);
      }
    } catch (error) {
      console.error("Failed to load shops:", error);
    }
  };

  const onSubmit = async (data: ShopForm) => {
    setIsLoading(true);
    try {
      if (editingShop) {
        // Update existing shop
        await ApiService.updateShop(editingShop.id, data);
        toast({
          title: t("shopSetup.shopUpdated"),
          description: t("shopSetup.shopUpdatedDesc"),
        });
      } else {
        // Create new shop
        const shopData = {
          name: data.name || "",
          description: data.description || "",
          category: data.category || "",
          location: data.location || "",
          phone: data.phone,
          image: data.image,
          upiId: data.upiId,
        };
        const newShop = await ApiService.createShop(shopData);
        // Created new shop

        // Verify the shop was actually created and can be retrieved with retries
        let verifyShop = null;
        const maxRetries = 3;
        const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
        // Starting shop creation verification
        for (let i = 0; i < maxRetries; i++) {
          verifyShop = await ApiService.getShopById(newShop.id);
          // Verification attempt
          if (verifyShop) break;
          await delay(200);
        }
        if (!verifyShop) {
          throw new Error(
            "Shop creation verification failed - shop not found after creation",
          );
        }
        // Shop creation verified

        toast({
          title: t("shopSetup.shopCreated"),
          description: t("shopSetup.shopCreatedDesc", { name: newShop.name }),
        });
      }

      // Reset form and reload shops
      form.reset();
      setEditingShop(null);

      // Wait a moment for the data to be fully persisted
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Reload user shops first
      await loadUserShops();

      // Trigger global shop refresh for all components to ensure new shop appears everywhere
      // Triggering global shop refresh
      await forceRefresh();

      // Removed debug console.log to prevent data leakage in production
    } catch (error) {
      console.error("Shop creation/update error:", error);
      toast({
        variant: "destructive",
        title: t("shopSetup.error"),
        description: t("shopSetup.saveShopError", { error: error instanceof Error ? error.message : String(error) }),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const editShop = (shop: Shop) => {
    setEditingShop(shop);
    form.reset({
      name: shop.name,
      description: shop.description,
      category: shop.category,
      // location: shop.location || "",
      // phone: shop.phone || "",
      image: shop.image,
      upiId: shop.upiId || "",
    });
  };

  const cancelEdit = () => {
    setEditingShop(null);
    form.reset();
  };

  const categories = [
    "Fast Food",
    "Italian",
    "Asian",
    "Healthy Food",
    "Beverages",
    "Mexican",
    "Indian",
    "Mediterranean",
    "Desserts",
    "Quick Bites",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <Navigation />

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link
            to="/admin"
            className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-3 sm:mb-4 text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("shopSetup.backToDashboard")}
          </Link>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <Store className="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3 text-orange-600" />
            {t("shopSetup.shopManagement")}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {t("shopSetup.createManageShop")}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Shop Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  {editingShop ? (
                    <>
                      <Edit className="h-5 w-5 mr-2 text-orange-600" />
                      {t("shopSetup.editShop")}
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5 mr-2 text-orange-600" />
                      {t("shopSetup.createNewShop")}
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t("shopSetup.shopName")} *</Label>
                      <Input
                        id="name"
                        placeholder={t("shopSetup.shopNamePlaceholder")}
                        {...form.register("name")}
                      />
                      {form.formState.errors.name && (
                        <p className="text-sm text-red-600">
                          {form.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">{t("shopSetup.category")} *</Label>
                      <Select
                        value={form.watch("category")}
                        onValueChange={(value) =>
                          form.setValue("category", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("shopSetup.selectCategory")} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.category && (
                        <p className="text-sm text-red-600">
                          {form.formState.errors.category.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">{t("shopSetup.description")} *</Label>
                    <Textarea
                      id="description"
                      placeholder={t("shopSetup.descriptionPlaceholder")}
                      rows={4}
                      {...form.register("description")}
                    />
                    {form.formState.errors.description && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.description.message}
                      </p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="location" className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {t("shopSetup.location")} *
                      </Label>
                      <Input
                        id="location"
                        placeholder={t("shopSetup.locationPlaceholder")}
                        {...form.register("location")}
                      />
                      {form.formState.errors.location && (
                        <p className="text-sm text-red-600">
                          {form.formState.errors.location.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        {t("shopSetup.phoneNumber")}
                      </Label>
                      <Input
                        id="phone"
                        placeholder={t("shopSetup.phonePlaceholder")}
                        {...form.register("phone")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image" className="flex items-center">
                      <ImageIcon className="h-4 w-4 mr-1" />
                      {t("shopSetup.shopImageUrl")}
                    </Label>
                    <Input
                      id="image"
                      placeholder={t("shopSetup.imagePlaceholder")}
                      {...form.register("image")}
                    />
                  </div>

                  <div className="mb-4">
                    <Label htmlFor="upiId" className="flex items-center">
                      <span className="mr-2">{t("shopSetup.upiId")}</span>
                      <span className="text-xs text-gray-500 flex items-center ml-2">
                        <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0-1.104.896-2 2-2s2 .896 2 2-.896 2-2 2-2-.896-2-2zm0 0V7m0 4v4m0 0c0 1.104-.896 2-2 2s-2-.896-2-2 .896-2 2-2 2 .896 2 2 2z" /></svg>
                        <span>{t("shopSetup.upiPrivate")}</span>
                      </span>
                    </Label>
                    <Input id="upiId" placeholder={t("shopSetup.upiPlaceholder")} {...form.register("upiId")} />
                    <p className="text-xs text-gray-500 mt-1">{t("shopSetup.upiDescription")}</p>
                  </div>

                  <div className="flex space-x-4">
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 flex-1"
                      disabled={isLoading}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isLoading
                        ? t("shopSetup.saving")
                        : editingShop
                          ? t("shopSetup.updateShop")
                          : t("shopSetup.createShop")}
                    </Button>

                    {editingShop && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={cancelEdit}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Existing Shops */}
          <div>
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Store className="h-5 w-5 mr-2 text-orange-600" />
                  {t("shopSetup.yourShops")} ({existingShops.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {existingShops.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Store className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="font-medium mb-2">{t("shopSetup.noShopsYet")}</p>
                    <p className="text-sm">
                      {t("shopSetup.createFirstShop")}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <Label htmlFor="shop-select" className="text-base font-medium">
                        {t("shopSetup.selectShop")}
                      </Label>
                    <Select
                      value={selectedShopId || ""}
                      onValueChange={(value) => {
                        setSelectedShopId(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("shopSetup.selectShopPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {existingShops.map((shop) => (
                          <SelectItem key={shop.id} value={shop.id}>
                            {shop.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    </div>

                    {selectedShopId && (
                      <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              {existingShops.find((s) => s.id === selectedShopId)?.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {existingShops.find((s) => s.id === selectedShopId)?.category}
                            </p>
                            <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                              {existingShops.find((s) => s.id === selectedShopId)?.description}
                            </p>
                              <div className="flex items-center mt-3 text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {existingShops.find((s) => s.id === selectedShopId)?.estimatedWaitTime} {t("shopSetup.minWait")}
                              <span className="mx-2">•</span>
                              {existingShops.find((s) => s.id === selectedShopId)?.activeTokens} {t("shopSetup.activeOrders")}
                            </div>

                            {/* Display menu items for selected shop */}
                            <div className="mt-4">
                              <h4 className="font-semibold mb-2">{t("shopSetup.menuItems")} ({menuItems.length})</h4>
                              {menuItems.length === 0 ? (
                                <p className="text-sm text-gray-500">{t("shopSetup.noMenuItems")}</p>
                              ) : (
                                <ul className="list-disc list-inside text-sm text-gray-700 max-h-40 overflow-y-auto">
                                  {menuItems.map((item) => (
                                    <li key={item.id}>
                                      {item.name} - ${item.price.toFixed(2)}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const shop = existingShops.find((s) => s.id === selectedShopId);
                              if (shop) editShop(shop);
                            }}
                            className="ml-4"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="ml-2"
                            onClick={async () => {
                              const confirmed = window.confirm(t("shopSetup.deleteConfirm"));
                              if (!confirmed) return;
                              try {
                                const shop = existingShops.find((s) => s.id === selectedShopId);
                                if (!shop) return;
                                const success = await ApiService.deleteShop(shop.id);
                                if (success) {
                                  alert(t("shopSetup.shopDeleted"));
                                  await loadUserShops();
                                  await forceRefresh();
                                } else {
                                  alert(t("shopSetup.deleteFailed"));
                                }
                              } catch (error) {
                                console.error("Error deleting shop:", error);
                                alert(t("shopSetup.deleteError"));
                              }
                            }}
                          >
                            {t("shopSetup.deleteShop")}
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopSetup;
