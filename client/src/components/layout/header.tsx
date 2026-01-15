import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { User, ShoppingCart, Menu, X, Package, LogIn, LogOut, Phone, Clock } from "lucide-react";
import { Category } from "@shared/schema";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location, navigate] = useLocation();

  const { itemCount } = useCart();
  const { user, logoutMutation } = useAuth();

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"]
  });

  // Close mobile menu when navigating
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/");
      }
    });
  };

  return (
    <header className="bg-white z-30 shadow-sm border-b border-red-100">
      {/* Основная шапка: Телефон | График | Логотип (центр) | Корзина | Вход */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Левая часть: Телефон, график и О компании (только десктоп) */}
            <div className="hidden md:flex items-center flex-1">
              <div className="flex items-center space-x-3">
                <a href="tel:88001013835" className="flex items-center text-gray-700 hover:text-eps-red group">
                  <div className="flex items-center">
                    <div className="p-2 bg-gray-100 rounded-full group-hover:bg-red-50 transition-colors duration-300">
                      <Phone className="h-5 w-5" />
                    </div>
                    <span className="ml-2 font-medium text-sm">8 800 101 38 35</span>
                  </div>
                </a>
                <div className="flex items-center text-gray-700 group">
                  <div className="flex items-center">
                    <div className="p-2 bg-gray-100 rounded-full transition-colors duration-300">
                      <Clock className="h-5 w-5" />
                    </div>
                    <span className="ml-2 font-medium text-sm">пн–пт 8:00–18:00</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 flex justify-end pr-8">
                <Link href="/about" className="text-gray-700 hover:text-eps-red font-medium text-sm transition-colors">
                  О компании
                </Link>
              </div>
            </div>

            {/* Центр: Логотип */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center group">
                <img
                  src="/logo.png"
                  alt="ЭПС"
                  className="h-14 w-auto transition-transform duration-300 group-hover:scale-105"
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
                <Link href="/cart" className="flex items-center text-gray-700 hover:text-eps-red relative group">
                  <div className="flex items-center">
                    <div className="relative">
                      <div className="p-2 bg-gray-100 rounded-full group-hover:bg-red-50 transition-colors duration-300">
                        <ShoppingCart className="h-5 w-5" />
                      </div>
                      {itemCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-eps-red text-white text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                          {itemCount}
                        </span>
                      )}
                    </div>
                    <span className="ml-2 font-medium text-sm">Корзина</span>
                  </div>
                </Link>

                {user ? (
                  <>
                    <Link href="/profile" className="flex items-center text-gray-700 hover:text-orange-600 group">
                      <div className="flex items-center">
                        <div className="p-2 bg-gray-100 rounded-full group-hover:bg-orange-50 transition-colors duration-300">
                          <User className="h-5 w-5" />
                        </div>
                        <span className="ml-2 font-medium text-sm">Профиль</span>
                      </div>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="flex items-center text-gray-700 hover:text-orange-600 group"
                      disabled={logoutMutation.isPending}
                    >
                      <div className="flex items-center">
                        <div className="p-2 bg-gray-100 rounded-full group-hover:bg-orange-50 transition-colors duration-300">
                          <LogOut className="h-5 w-5" />
                        </div>
                        <span className="ml-2 font-medium text-sm">
                          {logoutMutation.isPending ? "Выход..." : "Выйти"}
                        </span>
                      </div>
                    </button>
                  </>
                ) : (
                  <Link href="/auth" className="flex items-center text-gray-700 hover:text-orange-600 group">
                    <div className="flex items-center">
                      <div className="p-2 bg-gray-100 rounded-full group-hover:bg-orange-50 transition-colors duration-300">
                        <LogIn className="h-5 w-5" />
                      </div>
                      <span className="ml-2 font-medium text-sm">Войти</span>
                    </div>
                  </Link>
                )}
              </div>
            </div>

            {/* Мобильные элементы */}
            <div className="flex items-center space-x-4 md:hidden">
              <Link href="/cart" className="text-gray-700 relative">
                <ShoppingCart className="h-6 w-6" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-eps-red text-white text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full">
                    {itemCount}
                  </span>
                )}
              </Link>

              <Button
                variant="ghost"
                size="icon"
                className="text-gray-700 hover:text-eps-red hover:bg-gray-100"
                onClick={toggleMobileMenu}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
      </div>


      {/* Мобильное меню с обновленным дизайном */}
      <div 
        className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'} bg-white fixed top-0 w-full shadow-lg z-40 border-t border-orange-100 max-h-screen overflow-y-auto pb-20`}
      >
        <div className="px-2 pt-4 pb-6">
          {/* Профиль в мобильном меню */}
          {user ? (
            <div className="flex items-center justify-between mb-4 px-3 py-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  <User className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-800">{user.username}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href="/profile" className="p-2 rounded-full bg-gray-100 text-gray-700">
                  <Package className="h-4 w-4" />
                </Link>
                <button onClick={handleLogout} className="p-2 rounded-full bg-gray-100 text-gray-700">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-4 px-3">
              <Link href="/auth" className="flex items-center justify-center w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors">
                <LogIn className="h-4 w-4 mr-2" />
                Войти или зарегистрироваться
              </Link>
            </div>
          )}

          {/* Навигационные ссылки в мобильном меню */}
          <div className="space-y-0.5">
            <Link href="/" className="block px-3 py-2.5 text-base font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors">
              Главная
            </Link>

            {/* Категории в мобильном меню */}
            <div className="px-3 py-2.5">
              <p className="text-base font-medium text-gray-700">Товары:</p>
              <div className="mt-1.5 pl-4 space-y-1.5">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/?category=${category.slug}`}
                    className="block py-1.5 text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    {category.name}
                  </Link>
                ))}
                <Link
                  href="/"
                  className="block py-1.5 text-gray-700 font-medium hover:text-orange-600 transition-colors"
                >
                  Все товары
                </Link>
              </div>
            </div>

            <Link href="/publications" className="block px-3 py-2.5 text-base font-medium text-gray-700 hover:bg-red-50 hover:text-eps-red rounded-lg transition-colors">
              Новости
            </Link>

            <Link href="/contacts" className="block px-3 py-2.5 text-base font-medium text-gray-700 hover:bg-red-50 hover:text-eps-red rounded-lg transition-colors">
              Контакты
            </Link>

            <Link href="/about" className="block px-3 py-2.5 text-base font-medium text-gray-700 hover:bg-red-50 hover:text-eps-red rounded-lg transition-colors">
              О компании
            </Link>

            {user?.role === 'admin' && (
              <Link href="/admin" className="block px-3 py-2.5 text-base font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
                Админ-панель
              </Link>
            )}
          </div>

          {/* Контактная информация в мобильном меню */}
          <div className="mt-6 px-3 pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-600 mb-2">Контактная информация:</p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>Телефон: 8 800 101 38 35</p>
              <p>Адрес: г. Волгоград, ул. им. Маршала Еременко 44</p>
              <p>Режим работы: пн–пт 8:00–18:00, сб, вс — выходные</p>
            </div>
          </div>
        </div>
      </div>

      {/* Фиксированное мобильное меню внизу */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:hidden z-30">
        <div className="flex justify-around py-2">
          <Link href="/" className="flex flex-col items-center p-2 text-gray-600 hover:text-eps-red transition-colors">
            <div className="p-1.5 rounded-full bg-gray-50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-xs mt-1">Главная</span>
          </Link>

          <Link href="/" className="flex flex-col items-center p-2 text-gray-600 hover:text-eps-red transition-colors">
            <div className="p-1.5 rounded-full bg-gray-50">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-xs mt-1">Каталог</span>
          </Link>

          <Link href="/cart" className="flex flex-col items-center p-2 text-gray-600 hover:text-eps-red transition-colors">
            <div className="p-1.5 rounded-full bg-gray-50 relative">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-eps-red text-white text-xs font-medium w-4 h-4 flex items-center justify-center rounded-full shadow-sm">
                  {itemCount}
                </span>
              )}
            </div>
            <span className="text-xs mt-1">Корзина</span>
          </Link>

          {user ? (
            <Link href="/profile" className="flex flex-col items-center p-2 text-gray-600 hover:text-eps-red transition-colors">
              <div className="p-1.5 rounded-full bg-gray-50">
                <User className="w-5 h-5" />
              </div>
              <span className="text-xs mt-1">Профиль</span>
            </Link>
          ) : (
            <Link href="/auth" className="flex flex-col items-center p-2 text-gray-600 hover:text-eps-red transition-colors">
              <div className="p-1.5 rounded-full bg-gray-50">
                <LogIn className="w-5 h-5" />
              </div>
              <span className="text-xs mt-1">Войти</span>
            </Link>
          )}

          <Link href="/publications" className="flex flex-col items-center p-2 text-gray-600 hover:text-eps-red transition-colors">
            <div className="p-1.5 rounded-full bg-gray-50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <span className="text-xs mt-1">Новости</span>
          </Link>
        </div>
      </div>
    </header>
  );
}