import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { User, ShoppingCart, Menu, LogIn, LogOut, Phone, Clock, Home, FileText, MapPin, Building2 } from "lucide-react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location, navigate] = useLocation();

  const { itemCount } = useCart();
  const { user, logoutMutation } = useAuth();

  // Close mobile menu when navigating
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/");
      }
    });
  };

  return (
    <header className="bg-white z-50 shadow-sm border-b border-red-100 sticky top-0">
      {/* Основная шапка */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex h-14 sm:h-20 items-center justify-between relative">

            {/* Левая часть: Телефон, график и О компании (только десктоп) */}
            <div className="hidden md:flex items-center flex-1">
              <div className="flex items-center space-x-3">
                <a href="tel:88001013835" className="flex items-center text-gray-700 hover:text-eps-red group">
                  <div className="p-2 bg-gray-100 rounded-full group-hover:bg-red-50 transition-colors">
                    <Phone className="h-5 w-5" />
                  </div>
                  <span className="ml-2 font-medium text-sm">8 800 101 38 35</span>
                </a>
                <div className="flex items-center text-gray-700">
                  <div className="p-2 bg-gray-100 rounded-full">
                    <Clock className="h-5 w-5" />
                  </div>
                  <span className="ml-2 font-medium text-sm">пн–пт 8:00–18:00</span>
                </div>
              </div>
              <div className="flex-1 flex justify-end pr-8">
                <Link href="/about" className="text-gray-700 hover:text-eps-red font-medium text-sm transition-colors">
                  О компании
                </Link>
              </div>
            </div>

            {/* Центр: Логотип */}
            <div className="flex-shrink-0 md:flex-shrink-0 absolute left-1/2 -translate-x-1/2 md:relative md:left-auto md:translate-x-0">
              <Link href="/" className="flex items-center">
                <img
                  src="/logo.png"
                  alt="ЭПС"
                  className="h-8 sm:h-14 w-auto"
                />
              </Link>
            </div>

            {/* Правая часть: Контакты, Корзина и авторизация (только десктоп) */}
            <div className="hidden md:flex items-center flex-1">
              <div className="flex-1 flex justify-start pl-8">
                <Link href="/contacts" className="text-gray-700 hover:text-eps-red font-medium text-sm transition-colors">
                  Контакты
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                {/* Корзина */}
                <Link href="/cart" className="flex items-center text-gray-700 hover:text-eps-red relative group" data-cart-icon>
                  <div className="relative">
                    <div className="p-2 bg-gray-100 rounded-full group-hover:bg-red-50 transition-colors">
                      <ShoppingCart className="h-5 w-5" />
                    </div>
                    {itemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-eps-red text-white text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
                        {itemCount}
                      </span>
                    )}
                  </div>
                  <span className="ml-2 font-medium text-sm">Корзина</span>
                </Link>

                {user ? (
                  <>
                    <Link href="/profile" className="flex items-center text-gray-700 hover:text-eps-red group">
                      <div className="p-2 bg-gray-100 rounded-full group-hover:bg-red-50 transition-colors">
                        <User className="h-5 w-5" />
                      </div>
                      <span className="ml-2 font-medium text-sm">Профиль</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center text-gray-700 hover:text-eps-red group"
                      disabled={logoutMutation.isPending}
                    >
                      <div className="p-2 bg-gray-100 rounded-full group-hover:bg-red-50 transition-colors">
                        <LogOut className="h-5 w-5" />
                      </div>
                      <span className="ml-2 font-medium text-sm">
                        {logoutMutation.isPending ? "..." : "Выйти"}
                      </span>
                    </button>
                  </>
                ) : (
                  <Link href="/auth" className="flex items-center text-gray-700 hover:text-eps-red group">
                    <div className="p-2 bg-gray-100 rounded-full group-hover:bg-red-50 transition-colors">
                      <LogIn className="h-5 w-5" />
                    </div>
                    <span className="ml-2 font-medium text-sm">Войти</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Мобильные элементы в шапке: слева меню, справа корзина */}
            <div className="flex md:hidden items-center absolute left-3">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-700 h-9 w-9 sm:h-10 sm:w-10"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </div>

            <div className="flex md:hidden items-center absolute right-3">
              <Link href="/cart" className="text-gray-700 relative p-1.5 sm:p-2">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 sm:top-0 sm:right-0 bg-eps-red text-white text-[10px] sm:text-xs font-bold w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full">
                    {itemCount > 99 ? "99" : itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Мобильное выдвигающееся меню слева */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-left">Меню</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-1 overflow-y-auto max-h-[calc(100vh-80px)]">
            {/* Авторизация/Профиль */}
            <div className="px-4 mb-3">
              {user ? (
                <div className="flex items-center justify-between py-3 px-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-eps-red/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-eps-red" />
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{user.username}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-500 hover:text-eps-red"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth"
                  className="flex items-center justify-center w-full py-3 bg-eps-red text-white font-medium rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  Войти
                </Link>
              )}
            </div>

            {/* Пункты меню */}
            <Link
              href="/"
              className="flex items-center px-7 py-3 text-gray-700 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home className="h-5 w-5 mr-3 text-gray-400" />
              <span className="font-medium">Главная</span>
            </Link>

            {user && (
              <Link
                href="/profile"
                className="flex items-center px-7 py-3 text-gray-700 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="h-5 w-5 mr-3 text-gray-400" />
                <span className="font-medium">Мой профиль</span>
              </Link>
            )}

            <Link
              href="/publications"
              className="flex items-center px-7 py-3 text-gray-700 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              <FileText className="h-5 w-5 mr-3 text-gray-400" />
              <span className="font-medium">Новости</span>
            </Link>

            <Link
              href="/contacts"
              className="flex items-center px-7 py-3 text-gray-700 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              <MapPin className="h-5 w-5 mr-3 text-gray-400" />
              <span className="font-medium">Контакты</span>
            </Link>

            <Link
              href="/about"
              className="flex items-center px-7 py-3 text-gray-700 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Building2 className="h-5 w-5 mr-3 text-gray-400" />
              <span className="font-medium">О компании</span>
            </Link>

            {user?.role === 'admin' && (
              <Link
                href="/admin"
                className="flex items-center px-7 py-3 text-eps-red hover:bg-red-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="font-medium">Админ-панель</span>
              </Link>
            )}

            {/* Контакты */}
            <div className="pt-4 mt-4 border-t border-gray-100 px-4">
              <a
                href="tel:88001013835"
                className="flex items-center px-3 py-2 text-gray-600"
              >
                <Phone className="h-4 w-4 mr-3 text-eps-red" />
                <span className="text-sm">8 800 101 38 35</span>
              </a>
              <div className="flex items-center px-3 py-2 text-gray-500">
                <Clock className="h-4 w-4 mr-3" />
                <span className="text-sm">пн–пт 8:00–18:00</span>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
