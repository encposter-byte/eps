import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, Grid3X3, Search, ShoppingCart, User, Heart } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useAuth } from "@/hooks/use-auth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MobileNavigationProps {
  onCategoriesClick?: () => void;
}

export default function MobileNavigation({ onCategoriesClick }: MobileNavigationProps) {
  const [location, setLocation] = useLocation();
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/?query=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const navItems = [
    {
      icon: Home,
      label: "Главная",
      href: "/",
      active: location === "/",
    },
    {
      icon: Grid3X3,
      label: "Категории",
      onClick: onCategoriesClick,
      active: false,
    },
    {
      icon: Search,
      label: "Поиск",
      onClick: () => setSearchOpen(true),
      active: false,
    },
    {
      icon: ShoppingCart,
      label: "Корзина",
      href: "/cart",
      badge: itemCount > 0 ? itemCount : undefined,
      active: location === "/cart",
    },
    {
      icon: user ? User : Heart,
      label: user ? "Профиль" : "Избранное",
      href: user ? "/profile" : "/auth",
      badge: !user && wishlistCount > 0 ? wishlistCount : undefined,
      active: location === "/profile" || location === "/auth",
    },
  ];

  return (
    <>
      {/* Fixed bottom navigation - only visible on mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 lg:hidden safe-area-bottom" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-center justify-around h-14 sm:h-16">
          {navItems.map((item, index) => {
            const Icon = item.icon;

            if (item.onClick) {
              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-primary transition-colors"
                >
                  <div className="relative">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    {item.badge !== undefined && (
                      <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-primary text-primary-foreground text-[10px] sm:text-xs rounded-full h-3.5 sm:h-4 min-w-[14px] sm:min-w-[16px] flex items-center justify-center px-0.5 sm:px-1">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] sm:text-xs mt-0.5 sm:mt-1">{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={index}
                href={item.href!}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  item.active
                    ? "text-primary"
                    : "text-gray-600 hover:text-primary"
                }`}
              >
                <div className="relative">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  {item.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-primary text-primary-foreground text-[10px] sm:text-xs rounded-full h-3.5 sm:h-4 min-w-[14px] sm:min-w-[16px] flex items-center justify-center px-0.5 sm:px-1">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] sm:text-xs mt-0.5 sm:mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Search Sheet */}
      <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
        <SheetContent side="top" className="h-auto">
          <SheetHeader>
            <SheetTitle>Поиск товаров</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSearch} className="mt-4">
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Введите название товара..."
                autoFocus
                className="flex-1"
              />
              <Button type="submit">Найти</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Spacer to prevent content from being hidden behind navigation */}
      <div className="h-14 sm:h-16 lg:hidden" />
    </>
  );
}
