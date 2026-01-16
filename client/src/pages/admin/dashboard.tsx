import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  ShoppingBag,
  Package2,
  Users,
  BarChart3,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminSidebar from "@/components/admin/sidebar";
import { Category, Product } from "@shared/schema";

interface Order {
  id: number;
  status: string;
  totalAmount: string | number;
  createdAt: string;
  customerName: string;
}

interface UsersResponse {
  users: any[];
  total: number;
}

interface OrdersResponse {
  orders: Order[];
  total: number;
}

export default function AdminDashboard() {
  // Fetch all products
  const { data: productsData } = useQuery<{ products: Product[], total: number }>({
    queryKey: ["/api/products"],
  });
  const products = productsData?.products || [];

  // Fetch all categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch users count
  const { data: usersData } = useQuery<UsersResponse>({
    queryKey: ["/api/admin/users"],
  });

  // Fetch orders
  const { data: ordersData } = useQuery<OrdersResponse>({
    queryKey: ["/api/admin/orders"],
  });

  // Calculate real stats
  const activeProducts = Array.isArray(products) ? products.filter(p => p.isActive === true).length : 0;
  const categoryCount = categories.length;
  const usersCount = usersData?.total || 0;
  const ordersCount = ordersData?.total || 0;
  const recentOrders = ordersData?.orders?.slice(0, 5) || [];
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Панель управления</h1>
            <p className="text-gray-500">Добро пожаловать в панель администратора.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/admin/products">Управление товарами</Link>
            </Button>
          </div>
        </div>
        
        {/* Обзорные карточки */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Товары</CardTitle>
              <Package2 className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProducts}</div>
              <p className="text-xs text-gray-500 mt-1">активных товаров</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Категории</CardTitle>
              <ShoppingBag className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categoryCount}</div>
              <p className="text-xs text-gray-500 mt-1">категорий товаров</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Заказы</CardTitle>
              <ShoppingCart className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ordersCount}</div>
              <p className="text-xs text-gray-500 mt-1">всего заказов</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Клиенты</CardTitle>
              <Users className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usersCount}</div>
              <p className="text-xs text-gray-500 mt-1">зарегистрированных</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Быстрые действия */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Быстрые действия</CardTitle>
              <CardDescription>
                Часто используемые задачи
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button className="justify-start" asChild>
                <Link href="/admin/products/create">
                  <Package2 className="mr-2 h-4 w-4" />
                  Добавить товар
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/admin/categories">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Управление категориями
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/admin/orders">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Просмотр заказов
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          {/* Последние заказы */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Последние заказы</CardTitle>
              <CardDescription>
                Недавние заказы клиентов
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>Заказов пока нет</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded">
                          <ShoppingBag className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium">Заказ #{order.id}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-right">
                          {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(Number(order.totalAmount))}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.status === 'pending' ? 'Ожидает' :
                           order.status === 'processing' ? 'Обработка' :
                           order.status === 'shipped' ? 'Отправлен' :
                           order.status === 'delivered' ? 'Доставлен' :
                           order.status === 'cancelled' ? 'Отменён' : order.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Эффективность категорий */}
        <Card>
          <CardHeader>
            <CardTitle>Эффективность категорий</CardTitle>
            <CardDescription>
              Количество товаров по категориям
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-sm text-gray-500">
                      {category.productCount || 0} {category.productCount === 1 ? 'товар' : 
                       (category.productCount && category.productCount >= 2 && category.productCount <= 4) ? 'товара' : 'товаров'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-primary h-2.5 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (category.productCount || 0) / (Math.max(...categories.map(c => (c.productCount || 0))) || 1) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
