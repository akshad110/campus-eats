import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Navigation } from "@/components/ui/navigation";
import { MinimalFooter } from "@/components/ui/minimal-footer";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ApiService } from "@/lib/api";
import { Shop, MenuItem } from "@/lib/types";
import {
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  Clock,
  DollarSign,
  Package,
  ChefHat,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import { Link } from "react-router-dom";

const menuItemSchema = z.object({
  name: z.string().min(2, "Item name must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  price: z.number().min(0.01, "Price must be greater than 0"),
  category: z.string().min(1, "Please select a category"),
  preparationTime: z
    .number()
    .min(1, "Preparation time must be at least 1 minute"),
  stockQuantity: z.number().min(0, "Stock quantity cannot be negative"),
  image: z.string().optional(),
  ingredients: z.string().optional(),
  allergens: z.string().optional(),
});

type MenuItemForm = z.infer<typeof menuItemSchema>;

const MenuManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [userShops, setUserShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<MenuItemForm>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "",
      preparationTime: 5,
      stockQuantity: 50,
      image: "",
      ingredients: "",
      allergens: "",
    },
  });

  useEffect(() => {
    if (user?.role !== "shopkeeper") {
      navigate("/");
      return;
    }

    loadUserShops();
  }, [user, navigate]);

  useEffect(() => {
    if (selectedShop) {
      loadMenuItems();
    }
  }, [selectedShop]);

  const loadUserShops = async () => {
    if (!user) return;

    try {
      const shops = await ApiService.getShopsByOwner(user.id);
      setUserShops(shops);
      if (shops.length > 0) {
        setSelectedShop(shops[0]);
      }
    } catch (error) {
      console.error("Failed to load shops:", error);
    }
  };

  const loadMenuItems = async () => {
    if (!selectedShop) return;

    try {
      const items = await ApiService.getMenuItems(selectedShop.id);
      setMenuItems(items);
    } catch (error) {
      console.error("Failed to load menu items:", error);
    }
  };

  const onSubmit = async (data: MenuItemForm) => {
    if (!selectedShop) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No shop selected. Please select a shop first.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const menuItemData = {
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        preparationTime: data.preparationTime,
        stockQuantity: data.stockQuantity,
        shopId: selectedShop.id,
        ingredients: data.ingredients?.split(",").map((i) => i.trim()) || [],
        allergens: data.allergens?.split(",").map((a) => a.trim()) || [],
        image: data.image || "",
      };

      console.log(
        "Creating/updating menu item for shop:",
        selectedShop.id,
        menuItemData,
      );

      if (editingItem) {
        // Update existing item
        const updatedItem = await ApiService.updateMenuItem(
          editingItem.id,
          menuItemData,
        );
        console.log("Updated menu item:", updatedItem);
        toast({
          title: "Menu item updated!",
          description: "Your menu item has been updated successfully.",
        });
      } else {
        // Create new item
        const newItem = await ApiService.createMenuItem(menuItemData);
        console.log("Created new menu item:", newItem);
        toast({
          title: "Menu item created!",
          description: `"${data.name}" has been added to ${selectedShop.name}'s menu.`,
        });
      }

      // Reset form and reload items
      form.reset();
      setEditingItem(null);
      setIsDialogOpen(false);

      // Small delay to ensure data is persisted
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Reload menu items for this shop
      await loadMenuItems();

      // Verify the menu items were loaded
      const verifyItems = await ApiService.getMenuItems(selectedShop.id);
      console.log(
        `Verified ${verifyItems.length} menu items for shop ${selectedShop.name}`,
      );
    } catch (error: any) {
      console.error("Menu item save error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || (error && error.toString()) || "Failed to save menu item. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const editItem = (item: MenuItem) => {
    setEditingItem(item);
    form.reset({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      preparationTime: item.preparationTime,
      stockQuantity: 50, // Mock stock quantity
      image: item.image,
      ingredients: "tomatoes, cheese, basil", // Mock ingredients
      allergens: "dairy, gluten", // Mock allergens
    });
    setIsDialogOpen(true);
  };

  const deleteItem = async (item: MenuItem) => {
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      try {
        await ApiService.deleteMenuItem(item.id);
        toast({
          title: "Menu item deleted",
          description: "The menu item has been removed successfully.",
        });
        await loadMenuItems();
      } catch (error: any) {
        console.error("Failed to delete menu item:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error?.message || (error && error.toString()) || "Failed to delete menu item.",
        });
      }
    }
  };

  const toggleItemAvailability = async (item: MenuItem) => {
    try {
      await ApiService.updateMenuItem(item.id, {
        is_available: item.isAvailable ? 0 : 1,
      });
      await loadMenuItems();
    } catch (error: any) {
      console.error("Failed to update item availability:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || (error && error.toString()) || "Failed to update item availability.",
      });
    }
  };

  const categories = [
    "Appetizers",
    "Main Course",
    "Pizzas",
    "Burgers",
    "Salads",
    "Sides",
    "Desserts",
    "Beverages",
    "Coffee",
    "Snacks",
  ];

  const resetForm = () => {
    form.reset();
    setEditingItem(null);
  };

  if (userShops.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-600 mb-4">
            No Shops Found
          </h2>
          <p className="text-gray-500 mb-8">
            You need to create a shop before managing menu items.
          </p>
          <Link to="/admin/shop-setup">
            <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
              Create Your First Shop
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/admin"
            className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <ChefHat className="h-8 w-8 mr-3 text-orange-600" />
            Menu Management
          </h1>
          <p className="text-gray-600">
            Add and manage menu items for your shops
          </p>
        </div>

        {/* Shop Selector */}
        <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="shop-select" className="text-base font-medium">
                  Select Shop:
                </Label>
                <Select
                  value={selectedShop?.id || ""}
                  onValueChange={(value) => {
                    const shop = userShops.find((s) => s.id === value);
                    setSelectedShop(shop || null);
                  }}
                >
                  <SelectTrigger className="w-64 mt-2">
                    <SelectValue placeholder="Choose a shop" />
                  </SelectTrigger>
                  <SelectContent>
                    {userShops.map((shop) => (
                      <SelectItem key={shop.id} value={shop.id}>
                        {shop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Dialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) resetForm();
                }}
              >
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Menu Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
                    </DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Item Name *</Label>
                        <Input
                          id="name"
                          placeholder="e.g., Margherita Pizza"
                          {...form.register("name")}
                        />
                        {form.formState.errors.name && (
                          <p className="text-sm text-red-600">
                            {form.formState.errors.name.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select
                          value={form.watch("category")}
                          onValueChange={(value) =>
                            form.setValue("category", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
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
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe the item, ingredients, taste..."
                        rows={3}
                        {...form.register("description")}
                      />
                      {form.formState.errors.description && (
                        <p className="text-sm text-red-600">
                          {form.formState.errors.description.message}
                        </p>
                      )}
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price" className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Price *
                        </Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...form.register("price", { valueAsNumber: true })}
                        />
                        {form.formState.errors.price && (
                          <p className="text-sm text-red-600">
                            {form.formState.errors.price.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="preparationTime"
                          className="flex items-center"
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Prep Time (min) *
                        </Label>
                        <Input
                          id="preparationTime"
                          type="number"
                          placeholder="5"
                          {...form.register("preparationTime", {
                            valueAsNumber: true,
                          })}
                        />
                        {form.formState.errors.preparationTime && (
                          <p className="text-sm text-red-600">
                            {form.formState.errors.preparationTime.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="stockQuantity"
                          className="flex items-center"
                        >
                          <Package className="h-4 w-4 mr-1" />
                          Stock Quantity *
                        </Label>
                        <Input
                          id="stockQuantity"
                          type="number"
                          placeholder="50"
                          {...form.register("stockQuantity", {
                            valueAsNumber: true,
                          })}
                        />
                        {form.formState.errors.stockQuantity && (
                          <p className="text-sm text-red-600">
                            {form.formState.errors.stockQuantity.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image" className="flex items-center">
                        <ImageIcon className="h-4 w-4 mr-1" />
                        Image URL (Optional)
                      </Label>
                      <Input
                        id="image"
                        placeholder="https://example.com/item-image.jpg"
                        {...form.register("image")}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ingredients">
                          Ingredients (comma-separated)
                        </Label>
                        <Input
                          id="ingredients"
                          placeholder="tomatoes, cheese, basil"
                          {...form.register("ingredients")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="allergens">
                          Allergens (comma-separated)
                        </Label>
                        <Input
                          id="allergens"
                          placeholder="dairy, gluten, nuts"
                          {...form.register("allergens")}
                        />
                      </div>
                    </div>

                    <div className="flex space-x-4 pt-4">
                      <Button
                        type="submit"
                        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 flex-1"
                        disabled={isLoading}
                      >
                        {isLoading
                          ? "Saving..."
                          : editingItem
                            ? "Update Item"
                            : "Add Item"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Menu Items */}
        {selectedShop && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  Menu Items for {selectedShop.name} ({menuItems.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {menuItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ChefHat className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold mb-2">No menu items</h3>
                  <p>Add your first menu item to get started</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {menuItems.map((item) => (
                    <Card
                      key={item.id}
                      className={`border transition-all duration-300 hover:shadow-lg ${
                        item.isAvailable
                          ? "border-gray-200"
                          : "border-red-200 bg-red-50/50"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 line-clamp-1">
                              {item.name}
                            </h3>
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {item.category}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleItemAvailability(item)}
                              className="h-8 w-8 p-0"
                            >
                              {item.isAvailable ? (
                                <Eye className="h-4 w-4 text-green-600" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-red-600" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => editItem(item)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteItem(item)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {item.description}
                        </p>

                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-lg text-orange-600">
                            ${item.price.toFixed(2)}
                          </span>
                          <div className="flex items-center text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {item.preparationTime}m
                          </div>
                        </div>

                        {!item.isAvailable && (
                          <div className="mt-2 text-center">
                            <Badge variant="destructive" className="text-xs">
                              Unavailable
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <MinimalFooter />
    </div>
  );
};

export default MenuManagement;
