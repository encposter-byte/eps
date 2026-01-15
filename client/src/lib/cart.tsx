import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Browser-compatible UUID generator
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Types
type CartItem = {
  id: number;
  productId: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: number;
    originalPrice?: number;
    imageUrl?: string;
    shortDescription?: string;
    slug: string;
  };
};

type CartContextType = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  cartId: string;
  isLoading: boolean;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
};

// Create context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider component
export function CartProvider({ children }: { children: ReactNode }) {
  const [cartId, setCartId] = useState<string>("");
  const [items, setItems] = useState<CartItem[]>([]);
  const [itemCount, setItemCount] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();
  
  // Initialize cart ID from localStorage or create new one
  useEffect(() => {
    let storedCartId = localStorage.getItem("cartId");
    
    if (!storedCartId) {
      storedCartId = generateUUID();
      localStorage.setItem("cartId", storedCartId);
    }
    
    setCartId(storedCartId || "");
  }, []);
  
  // Fetch cart data when cartId is available
  useEffect(() => {
    if (cartId) {
      fetchCart();
    }
  }, [cartId]);
  
  // Fetch cart data from API
  const fetchCart = async () => {
    if (!cartId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/cart/${cartId}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data.items);
        setItemCount(data.itemCount);
        setSubtotal(data.subtotal);
      }
    } catch (error) {
      console.error("Failed to fetch cart", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add item to cart
  const addToCart = async (productId: number, quantity = 1) => {
    if (!cartId) return;

    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/cart", {
        cartId,
        productId,
        quantity
      });
      
      await fetchCart();
      
      toast({
        title: "Добавлено в корзину",
        description: "Товар успешно добавлен в вашу корзину",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить товар в корзину",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update item quantity
  const updateQuantity = async (itemId: number, quantity: number) => {
    if (!cartId) return;

    setIsLoading(true);
    try {
      await apiRequest("PUT", `/api/cart/${itemId}`, { quantity });
      await fetchCart();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить количество товара",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Remove item from cart
  const removeItem = async (itemId: number) => {
    if (!cartId) return;

    setIsLoading(true);
    try {
      await apiRequest("DELETE", `/api/cart/${itemId}`);
      await fetchCart();
      
      toast({
        title: "Товар удален",
        description: "Товар был удален из вашей корзины",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить товар из корзины",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Clear cart
  const clearCart = async () => {
    if (!cartId) return;

    setIsLoading(true);
    try {
      await apiRequest("DELETE", `/api/cart/clear/${cartId}`);
      await fetchCart();

      toast({
        title: "Корзина очищена",
        description: "Все товары удалены из корзины",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось очистить корзину",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const value = {
    items,
    itemCount,
    subtotal,
    cartId,
    isLoading,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
  };
  
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Hook for using the cart context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
