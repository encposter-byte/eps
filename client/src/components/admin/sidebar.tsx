import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package2,
  ShoppingCart,
  Tag,
  Users,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  active?: boolean;
}

function SidebarItem({ icon: Icon, label, href, active }: SidebarItemProps) {
  return (
    <Link href={href}>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start",
          active ? "bg-primary/10 text-primary hover:bg-primary/20" : "hover:bg-gray-100"
        )}
      >
        <Icon className="mr-2 h-5 w-5" />
        {label}
      </Button>
    </Link>
  );
}

export default function AdminSidebar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const menuItems = [
    {
      icon: LayoutDashboard,
      label: "Панель управления",
      href: "/admin",
    },
    {
      icon: Package2,
      label: "Товары",
      href: "/admin/products",
    },
    {
      icon: Tag,
      label: "Категории",
      href: "/admin/categories",
    },
    {
      icon: ShoppingCart,
      label: "Заказы",
      href: "/admin/orders",
    },
    {
      icon: Users,
      label: "Клиенты",
      href: "/admin/users",
    },
  ];
  
  return (
    <>
      {/* Mobile Menu Button */}
      <div className="fixed top-4 right-4 z-30 md:hidden">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={toggleMobileMenu}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-20 w-64 bg-white shadow-sm transition-transform duration-200 ease-in-out md:static md:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/admin" className="flex items-center">
            <span className="text-xl font-extrabold text-eps-gradient">ЭПС</span>
            <span className="ml-2 text-xs text-gray-500">Администратор</span>
          </Link>
        </div>
        
        <div className="space-y-1 p-3">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={item.href === location || location.startsWith(`${item.href}/`)}
            />
          ))}
        </div>
        
        <div className="absolute bottom-0 w-full border-t p-3">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start text-gray-500 hover:text-gray-900">
              <LogOut className="mr-2 h-5 w-5" />
              Вернуться в магазин
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-10 bg-black bg-opacity-50 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}
    </>
  );
}
