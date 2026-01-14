import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Product, WishlistItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface WishlistContextType {
  items: (WishlistItem & { product: Product })[];
  isLoading: boolean;
  addToWishlist: (productId: number) => Promise<void>;
  removeFromWishlist: (productId: number) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "eps_wishlist";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localWishlist, setLocalWishlist] = useState<number[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // Fetch wishlist from API for logged in users
  const { data: apiWishlist = [], isLoading } = useQuery<
    (WishlistItem & { product: Product })[]
  >({
    queryKey: ["/api/wishlist"],
    queryFn: async () => {
      const res = await fetch("/api/wishlist", {
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 401) return [];
        throw new Error("Ошибка загрузки избранного");
      }
      return res.json();
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Save local wishlist to localStorage
  useEffect(() => {
    if (!user) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localWishlist));
    }
  }, [localWishlist, user]);

  // Add to wishlist mutation
  const addMutation = useMutation({
    mutationFn: async (productId: number) => {
      const res = await fetch(`/api/wishlist/${productId}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Ошибка добавления в избранное");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Добавлено в избранное",
        description: "Товар добавлен в список избранного",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить товар в избранное",
        variant: "destructive",
      });
    },
  });

  // Remove from wishlist mutation
  const removeMutation = useMutation({
    mutationFn: async (productId: number) => {
      const res = await fetch(`/api/wishlist/${productId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Ошибка удаления из избранного");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Удалено из избранного",
        description: "Товар удален из списка избранного",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить товар из избранного",
        variant: "destructive",
      });
    },
  });

  const addToWishlist = useCallback(
    async (productId: number) => {
      if (user) {
        await addMutation.mutateAsync(productId);
      } else {
        setLocalWishlist((prev) => {
          if (prev.includes(productId)) return prev;
          return [...prev, productId];
        });
        toast({
          title: "Добавлено в избранное",
          description: "Войдите для сохранения списка",
        });
      }
    },
    [user, addMutation, toast]
  );

  const removeFromWishlist = useCallback(
    async (productId: number) => {
      if (user) {
        await removeMutation.mutateAsync(productId);
      } else {
        setLocalWishlist((prev) => prev.filter((id) => id !== productId));
        toast({
          title: "Удалено из избранного",
        });
      }
    },
    [user, removeMutation, toast]
  );

  const isInWishlist = useCallback(
    (productId: number) => {
      if (user) {
        return apiWishlist.some((item) => item.productId === productId);
      }
      return localWishlist.includes(productId);
    },
    [user, apiWishlist, localWishlist]
  );

  const wishlistCount = user ? apiWishlist.length : localWishlist.length;

  return (
    <WishlistContext.Provider
      value={{
        items: apiWishlist,
        isLoading,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        wishlistCount,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
