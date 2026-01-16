import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminSidebar from "@/components/admin/sidebar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Package, 
  Truck, 
  Search, 
  Calendar, 
  Filter, 
  Download,
  ArrowUp,
  ArrowDown,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// Импорт компонентов UI
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious 
} from "../../components/ui/custom-pagination";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Badge,
} from "@/components/ui/badge";

// Типы
interface Order {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  postalCode: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  paymentMethod: string;
}

interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  productPrice: string;
  quantity: number;
  totalPrice: string;
  product?: {
    id: number;
    name: string;
    slug: string;
    sku: string;
    imageUrl: string | null;
  };
}

interface OrderDetails extends Order {
  items: OrderItem[];
}

// Основные функции форматирования
const formatPrice = (price: number | string) => {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
  }).format(Number(price));
};

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

const getOrderStatusColor = (status: string) => {
  const statusColorMap: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    processing: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    shipped: "bg-purple-100 text-purple-800 hover:bg-purple-200",
    delivered: "bg-green-100 text-green-800 hover:bg-green-200",
    cancelled: "bg-red-100 text-red-800 hover:bg-red-200",
  };
  return statusColorMap[status] || "bg-gray-100 text-gray-800 hover:bg-gray-200";
};

export default function OrderManagement() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useState({
    query: "",
    status: "all",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 10,
  });
  
  // Состояние для модальных окон
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isUpdateStatusOpen, setIsUpdateStatusOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Получение списка заказов с оптимизированным кешированием
  const { 
    data, 
    isLoading: isOrdersLoading, 
    refetch 
  } = useQuery({
    queryKey: ["/api/orders", searchParams],
    queryFn: async () => {
      const queryString = new URLSearchParams({
        ...searchParams,
        page: searchParams.page.toString(),
        limit: searchParams.limit.toString(),
      }).toString();

      const response = await apiRequest("GET", `/api/orders?${queryString}`);
      return response;
    },
    // Заказы могут меняться чаще, поэтому используем меньшее время кеширования
    staleTime: 30000, // 30 секунд
    gcTime: 120000, // 2 минуты
  });

  const orders = data?.orders || [];
  const totalOrders = data?.total || 0;
  const totalPages = Math.ceil(totalOrders / searchParams.limit);

  // Обработчики событий
  const handleSearch = () => {
    setSearchParams({
      ...searchParams,
      page: 1, // Сбрасываем страницу при поиске
    });
    refetch();
  };

  const handlePageChange = (page: number) => {
    setSearchParams({
      ...searchParams,
      page,
    });
  };

  const handleStatusChange = (status: string) => {
    setSearchParams({
      ...searchParams,
      status,
      page: 1, // Сбрасываем страницу при изменении фильтра
    });
  };

  const handleReset = () => {
    setSearchParams({
      query: "",
      status: "all",
      startDate: "",
      endDate: "",
      page: 1,
      limit: 10,
    });
  };

  // Получение деталей заказа
  const fetchOrderDetails = async (orderId: number) => {
    try {
      setIsLoading(true);
      const response = await apiRequest("GET", `/api/orders/${orderId}`);
      setSelectedOrder(response);
      setIsDetailsOpen(true);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить детали заказа",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Обновление статуса заказа
  const openUpdateStatusDialog = (order: Order) => {
    setSelectedOrder(order as OrderDetails);
    setNewStatus(order.status);
    setIsUpdateStatusOpen(true);
  };

  const updateOrderStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      setIsLoading(true);
      await apiRequest("PATCH", `/api/orders/${selectedOrder.id}/status`, {
        status: newStatus,
      });
      
      toast({
        title: "Статус обновлен",
        description: `Заказ #${selectedOrder.id} теперь ${getOrderStatusName(newStatus)}`,
      });
      
      setIsUpdateStatusOpen(false);
      refetch(); // Обновляем список заказов
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус заказа",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Управление заказами</h1>
            <p className="text-gray-500">Просмотр и управление заказами клиентов</p>
          </div>
        </div>

        {/* Поиск и фильтры */}
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle>Поиск и фильтры</CardTitle>
            <CardDescription>Поиск заказов по различным параметрам</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Поиск по имени, email или телефону"
                  className="pl-8"
                  value={searchParams.query}
                  onChange={(e) => setSearchParams({ ...searchParams, query: e.target.value })}
                />
              </div>
              
              <Select
                defaultValue={searchParams.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Статус заказа" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="pending">Ожидает обработки</SelectItem>
                  <SelectItem value="processing">В обработке</SelectItem>
                  <SelectItem value="shipped">Отправлен</SelectItem>
                  <SelectItem value="delivered">Доставлен</SelectItem>
                  <SelectItem value="cancelled">Отменен</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="date"
                    className="pl-8"
                    placeholder="Дата с"
                    value={searchParams.startDate}
                    onChange={(e) => setSearchParams({ ...searchParams, startDate: e.target.value })}
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="date"
                    className="pl-8"
                    placeholder="Дата по"
                    value={searchParams.endDate}
                    onChange={(e) => setSearchParams({ ...searchParams, endDate: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={handleSearch}
                  className="flex-1"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Применить
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                >
                  Сбросить
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Таблица заказов */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Список заказов</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Экспорт
            </Button>
          </CardHeader>
          <CardContent>
            {isOrdersLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : orders.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Номер</TableHead>
                        <TableHead>Клиент</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Сумма</TableHead>
                        <TableHead>Дата</TableHead>
                        <TableHead className="text-right">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order: Order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.id}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{order.customerName}</p>
                              <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getOrderStatusColor(order.status)}>
                              {getOrderStatusName(order.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatPrice(order.totalAmount)}</TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchOrderDetails(order.id)}
                              >
                                Детали
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openUpdateStatusDialog(order)}
                              >
                                Статус
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Пагинация */}
                {totalPages > 1 && (
                  <div className="mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => handlePageChange(Math.max(1, searchParams.page - 1))}
                            className={searchParams.page === 1 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                          const pageNum = i + 1;
                          return (
                            <PaginationItem key={i}>
                              <PaginationLink
                                onClick={() => handlePageChange(pageNum)}
                                isActive={pageNum === searchParams.page}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        
                        {totalPages > 5 && (
                          <>
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationLink
                                onClick={() => handlePageChange(totalPages)}
                                isActive={totalPages === searchParams.page}
                              >
                                {totalPages}
                              </PaginationLink>
                            </PaginationItem>
                          </>
                        )}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => handlePageChange(Math.min(totalPages, searchParams.page + 1))}
                            className={searchParams.page === totalPages ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center space-y-4 text-center">
                <Package className="h-12 w-12 text-gray-300" />
                <div>
                  <p className="text-lg font-medium">Нет заказов</p>
                  <p className="text-sm text-gray-500">
                    Заказы будут отображаться здесь, как только появятся
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Модальное окно с деталями заказа */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Детали заказа #{selectedOrder?.id}</DialogTitle>
              <DialogDescription>
                {selectedOrder?.createdAt && `Создан: ${formatDate(selectedOrder.createdAt)}`}
              </DialogDescription>
            </DialogHeader>
            
            {selectedOrder ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Информация о клиенте</h3>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">Имя:</span> {selectedOrder.customerName}</p>
                    <p><span className="font-medium">Email:</span> {selectedOrder.customerEmail}</p>
                    <p><span className="font-medium">Телефон:</span> {selectedOrder.customerPhone}</p>
                  </div>
                  
                  <h3 className="mt-6 text-sm font-medium text-gray-500">Адрес доставки</h3>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">Адрес:</span> {selectedOrder.address}</p>
                    <p><span className="font-medium">Город:</span> {selectedOrder.city}</p>
                    <p><span className="font-medium">Индекс:</span> {selectedOrder.postalCode}</p>
                  </div>
                  
                  <h3 className="mt-6 text-sm font-medium text-gray-500">Информация о заказе</h3>
                  <div className="mt-2 space-y-2">
                    <p>
                      <span className="font-medium">Статус:</span>{" "}
                      <Badge className={getOrderStatusColor(selectedOrder.status)}>
                        {getOrderStatusName(selectedOrder.status)}
                      </Badge>
                    </p>
                    <p>
                      <span className="font-medium">Способ оплаты:</span>{" "}
                      {selectedOrder.paymentMethod}
                    </p>
                    {selectedOrder.notes && (
                      <p>
                        <span className="font-medium">Примечание:</span>{" "}
                        {selectedOrder.notes}
                      </p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Товары в заказе</h3>
                  <div className="mt-2 max-h-[30vh] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Наименование</TableHead>
                          <TableHead className="text-right">Кол-во</TableHead>
                          <TableHead className="text-right">Цена</TableHead>
                          <TableHead className="text-right">Сумма</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              {formatPrice(item.productPrice)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatPrice(item.totalPrice)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="mt-4 space-y-2 text-right">
                    <p className="font-medium text-lg">
                      Итого: {formatPrice(selectedOrder.totalAmount)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => openUpdateStatusDialog(selectedOrder as Order)}
              >
                Изменить статус
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Закрыть
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Модальное окно обновления статуса */}
        <Dialog open={isUpdateStatusOpen} onOpenChange={setIsUpdateStatusOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Обновить статус заказа</DialogTitle>
              <DialogDescription>
                Изменение статуса заказа #{selectedOrder?.id}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <Select
                defaultValue={newStatus}
                onValueChange={setNewStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выбрать новый статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Ожидает обработки</SelectItem>
                  <SelectItem value="processing">В обработке</SelectItem>
                  <SelectItem value="shipped">Отправлен</SelectItem>
                  <SelectItem value="delivered">Доставлен</SelectItem>
                  <SelectItem value="cancelled">Отменен</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setIsUpdateStatusOpen(false)}
              >
                Отмена
              </Button>
              <Button 
                onClick={updateOrderStatus} 
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Сохранить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}