import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Package, Truck, User, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Profile() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await apiRequest("GET", "/api/orders/my-orders");
        setOrders(data.orders || []);
      } catch (error) {
        console.error("Ошибка при загрузке заказов:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить историю заказов",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [toast]);

  // Функция для форматирования цены
  const formatPrice = (price: number | string) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
    }).format(Number(price));
  };

  // Функция для форматирования даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Функция для получения русского названия статуса заказа
  const getOrderStatusName = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "Ожидает обработки",
      processing: "В обработке",
      shipped: "Отправлен",
      delivered: "Доставлен",
      cancelled: "Отменен",
    };
    return statusMap[status] || status;
  };

  // Функция для получения цвета статуса заказа
  const getOrderStatusColor = (status: string) => {
    const statusColorMap: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return statusColorMap[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="bg-gray-50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Личный кабинет</h1>
          <p className="mt-2 text-gray-600">
            Управляйте своими данными и просматривайте историю заказов
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {/* Боковая панель с информацией о пользователе */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Профиль
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!user ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-eps-orange" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-500">Имя пользователя</div>
                      <div className="font-medium">{user.username}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Email</div>
                      <div className="font-medium">{user.email || "Не указан"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Дата регистрации</div>
                      <div className="font-medium">
                        {new Date(user.createdAt || Date.now()).toLocaleDateString("ru-RU")}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => toast({
                    title: "Функция в разработке",
                    description: "Редактирование профиля будет доступно в ближайшее время"
                  })}
                >
                  Редактировать профиль
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Основной контент */}
          <div className="md:col-span-3">
            <Tabs defaultValue="orders" className="w-full">
              <TabsList className="mb-4 grid w-full grid-cols-2">
                <TabsTrigger value="orders">История заказов</TabsTrigger>
                <TabsTrigger value="addresses">Адреса доставки</TabsTrigger>
              </TabsList>

              {/* История заказов */}
              <TabsContent value="orders">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Package className="mr-2 h-5 w-5" />
                      История заказов
                    </CardTitle>
                    <CardDescription>
                      Просмотр всех ваших заказов и их статусов
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex h-40 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                      </div>
                    ) : orders.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>№ заказа</TableHead>
                              <TableHead>Дата</TableHead>
                              <TableHead>Сумма</TableHead>
                              <TableHead>Статус</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {orders.map((order) => (
                              <TableRow key={order.id}>
                                <TableCell className="font-medium">
                                  {order.id}
                                </TableCell>
                                <TableCell>
                                  {formatDate(order.createdAt)}
                                </TableCell>
                                <TableCell>
                                  {formatPrice(order.totalAmount)}
                                </TableCell>
                                <TableCell>
                                  <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getOrderStatusColor(
                                      order.status
                                    )}`}
                                  >
                                    {getOrderStatusName(order.status)}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      setLocation(`/order-complete/${order.id}`)
                                    }
                                  >
                                    Подробнее
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="flex h-40 flex-col items-center justify-center space-y-4 text-center">
                        <Package className="h-10 w-10 text-gray-400" />
                        <div>
                          <p className="text-lg font-medium text-gray-900">
                            У вас еще нет заказов
                          </p>
                          <p className="text-gray-500">
                            Когда вы сделаете заказ, он появится здесь
                          </p>
                        </div>
                        <Button onClick={() => setLocation("/")}>
                          Начать покупки
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Адреса доставки */}
              <TabsContent value="addresses">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Truck className="mr-2 h-5 w-5" />
                      Адреса доставки
                    </CardTitle>
                    <CardDescription>
                      Управление вашими адресами доставки
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Truck className="mb-4 h-12 w-12 text-gray-300" />
                      <p className="text-lg font-medium text-gray-900">
                        У вас нет сохранённых адресов
                      </p>
                      <p className="mb-4 text-gray-500">
                        Добавьте адрес для быстрого оформления заказов
                      </p>
                      <Button variant="outline">
                        Добавить адрес
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}