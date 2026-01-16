import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ShoppingBag, Truck } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function OrderComplete() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await apiRequest("GET", `/api/orders/${id}`);
        setOrder(data);
      } catch (error: any) {
        setError(error.message || "Не удалось загрузить информацию о заказе");
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить информацию о заказе",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    } else {
      setLoading(false);
      setError("Номер заказа не указан");
    }
  }, [id, toast]);

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

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[400px] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-t-4 border-eps-orange border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-gray-50 py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
            <h1 className="text-2xl font-bold text-red-600">Ошибка</h1>
            <p>{error}</p>
            <Button onClick={() => setLocation("/")}>Вернуться на главную</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-center">
          <div className="relative mb-8 rounded-full bg-green-100 p-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Заказ успешно оформлен!</h1>
          <p className="mt-2 text-gray-600">
            Спасибо за ваш заказ. Мы отправили подтверждение на email{" "}
            <span className="font-medium">{order?.customerEmail}</span>
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Информация о заказе №{order?.id}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Статус заказа</p>
                  <p className="font-medium">{order?.status === "pending" ? "Ожидает обработки" : order?.status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Дата заказа</p>
                  <p className="font-medium">{formatDate(order?.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Способ оплаты</p>
                  <p className="font-medium">{order?.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Статус оплаты</p>
                  <p className="font-medium">{order?.paymentStatus}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="mb-2 text-sm font-medium text-gray-500">Данные получателя</p>
                <div className="space-y-1">
                  <p className="font-medium">{order?.customerName}</p>
                  <p>{order?.customerEmail}</p>
                  <p>{order?.customerPhone}</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-500">Адрес доставки</p>
                <div className="space-y-1">
                  <p>{order?.address}</p>
                  <p>
                    {order?.city}, {order?.postalCode}
                  </p>
                </div>
              </div>

              {order?.notes && (
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-500">Примечание к заказу</p>
                  <p>{order?.notes}</p>
                </div>
              )}

              <Separator />

              <div>
                <p className="mb-4 text-sm font-medium text-gray-500">Товары в заказе</p>
                <div className="space-y-4">
                  {order?.items?.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-gray-500">
                          {item.quantity} × {formatPrice(item.productPrice)}
                        </p>
                      </div>
                      <p className="font-medium">{formatPrice(item.totalPrice)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <p className="text-lg font-bold">Итого</p>
                <p className="text-lg font-bold">{formatPrice(order?.totalAmount)}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => setLocation("/")}>
              Вернуться к покупкам
            </Button>
          </CardFooter>
        </Card>

        <div className="rounded-lg bg-blue-50 p-6">
          <div className="flex items-start">
            <div className="mr-4 rounded-full bg-blue-100 p-2">
              <Truck className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-blue-900">Информация о доставке</h3>
              <p className="mt-1 text-blue-700">
                Ваш заказ будет обработан в ближайшее время. Наш менеджер свяжется с вами для
                подтверждения заказа и уточнения деталей доставки.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}