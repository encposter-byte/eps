import React from "react";
import { useCart } from "@/lib/cart";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Компоненты Header и Footer уже добавляются в App.tsx

// Схема валидации формы регистрации
const registerSchema = z.object({
  username: z.string().min(3, {
    message: "Имя пользователя должно содержать не менее 3 символов",
  }),
  email: z.string().email({
    message: "Пожалуйста, введите корректный email",
  }),
  password: z.string().min(6, {
    message: "Пароль должен содержать не менее 6 символов",
  }),
});

// Схема валидации формы входа
const loginSchema = z.object({
  username: z.string().min(3, {
    message: "Имя пользователя должно содержать не менее 3 символов",
  }),
  password: z.string().min(1, {
    message: "Пожалуйста, введите пароль",
  }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;
type LoginFormValues = z.infer<typeof loginSchema>;

// Схема валидации формы оформления заказа
const checkoutFormSchema = z.object({
  customerName: z.string().min(2, {
    message: "Имя должно быть не менее 2 символов",
  }),
  customerEmail: z.string().email({
    message: "Пожалуйста, введите корректный email",
  }),
  customerPhone: z.string().min(5, {
    message: "Пожалуйста, введите корректный номер телефона",
  }),
  address: z.string().min(5, {
    message: "Адрес должен быть не менее 5 символов",
  }),
  city: z.string().min(2, {
    message: "Пожалуйста, введите название города",
  }),
  postalCode: z.string().min(5, {
    message: "Почтовый индекс должен быть не менее 5 символов",
  }),
  paymentMethod: z.enum(["Наличными при получении", "Картой при получении", "Онлайн оплата"], {
    message: "Пожалуйста, выберите способ оплаты",
  }),
  notes: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export default function Checkout() {
  const { items, subtotal, cartId, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, registerMutation, loginMutation } = useAuth();
  
  // Состояние диалогового окна
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("register");
  
  // Данные для заполнения формы после регистрации или входа
  const [orderFormData, setOrderFormData] = useState<CheckoutFormValues | null>(null);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      address: "",
      city: "",
      postalCode: "",
      paymentMethod: "Наличными при получении",
      notes: "",
    },
  });

  // Автозаполнение формы данными пользователя
  useEffect(() => {
    if (user) {
      if (user.email) {
        form.setValue('customerEmail', user.email);
      }
      if (user.username) {
        form.setValue('customerName', user.username);
      }
    }
  }, [user, form]);

  // Обработка отправки формы
  const onSubmit = async (data: CheckoutFormValues) => {
    if (items.length === 0) {
      toast({
        title: "Корзина пуста",
        description: "Добавьте товары в корзину перед оформлением заказа",
        variant: "destructive",
      });
      return;
    }
    
    // Проверяем, авторизован ли пользователь
    if (!user) {
      // Сохраняем данные формы для последующего использования
      setOrderFormData(data);
      // Показываем диалоговое окно авторизации
      setIsAuthDialogOpen(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // Добавляем ID корзины к данным заказа
      const orderData = {
        ...data,
        cartId,
      };

      // Отправляем запрос на создание заказа
      const order = await apiRequest("POST", "/api/orders", orderData);

      // Очищаем корзину после успешного создания заказа
      await clearCart();

      toast({
        title: "Заказ успешно оформлен",
        description: `Номер вашего заказа: ${order.id}`,
      });

      // Перенаправляем пользователя на страницу успешного оформления заказа
      setLocation(`/order-complete/${order.id}`);
    } catch (error: any) {
      console.error("Ошибка при оформлении заказа:", error);
      toast({
        title: "Ошибка при оформлении заказа",
        description: error.message || "Пожалуйста, попробуйте еще раз",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Обработчики для форм авторизации
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });
  
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  // Продолжение оформления заказа после успешной авторизации
  const continueWithOrder = () => {
    if (orderFormData) {
      setIsAuthDialogOpen(false);
      setTimeout(() => {
        onSubmit(orderFormData);
      }, 500);
    }
  };
  
  // Обработка отправки формы регистрации
  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(
      {
        username: data.username,
        password: data.password,
        email: data.email,
      },
      {
        onSuccess: () => {
          toast({
            title: "Регистрация выполнена",
            description: "Теперь вы можете оформить заказ",
          });
          continueWithOrder();
        },
      }
    );
  };
  
  // Обработка отправки формы входа
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Вход выполнен",
          description: "Теперь вы можете оформить заказ",
        });
        continueWithOrder();
      },
    });
  };

  // Функция для форматирования цены
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 bg-gray-50 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Оформление заказа</h1>
            <p className="mt-2 text-gray-600">
              Заполните форму ниже для оформления вашего заказа
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Колонка с формой */}
            <div className="col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Контактная информация</CardTitle>
                  <CardDescription>
                    Введите ваши данные для доставки заказа
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="customerName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Имя *</FormLabel>
                              <FormControl>
                                <Input placeholder="Иван Иванов" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="customerEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email *</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="ivan@example.com"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="customerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Телефон *</FormLabel>
                            <FormControl>
                              <Input placeholder="+7 900 123-45-67" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator className="my-4" />

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Адрес доставки</h3>

                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Адрес *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="ул. Примерная, д. 123, кв. 45"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Город *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Москва" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="postalCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Почтовый индекс *</FormLabel>
                                <FormControl>
                                  <Input placeholder="123456" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Способ оплаты *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Выберите способ оплаты" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Наличными при получении">
                                  Наличными при получении
                                </SelectItem>
                                <SelectItem value="Картой при получении">
                                  Картой при получении
                                </SelectItem>
                                <SelectItem value="Онлайн оплата">
                                  Онлайн оплата
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Примечание к заказу</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Комментарий к заказу, особые пожелания"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end pt-4">
                        <Button
                          type="submit"
                          disabled={isSubmitting || items.length === 0}
                          className="w-full md:w-auto"
                        >
                          {isSubmitting
                            ? "Оформление заказа..."
                            : "Подтвердить заказ"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            {/* Колонка с информацией о заказе */}
            <div className="col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Ваш заказ</CardTitle>
                  <CardDescription>
                    {items.length === 0
                      ? "Корзина пуста"
                      : `${items.length} ${
                          items.length === 1
                            ? "товар"
                            : items.length < 5
                            ? "товара"
                            : "товаров"
                        } в корзине`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {items.length === 0 ? (
                      <p className="text-center text-gray-500">
                        В вашей корзине нет товаров
                      </p>
                    ) : (
                      <>
                        <div className="space-y-3">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between"
                            >
                              <div className="flex-1">
                                <p className="font-medium">{item.product.name}</p>
                                <p className="text-sm text-gray-500">
                                  {item.quantity} × {formatPrice(Number(item.product.price))}
                                </p>
                              </div>
                              <p className="font-medium">
                                {formatPrice(
                                  Number(item.product.price) * item.quantity
                                )}
                              </p>
                            </div>
                          ))}
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <p className="font-medium">Сумма товаров</p>
                          <p className="font-medium">{formatPrice(subtotal)}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-gray-600">НДС (20%)</p>
                          <p className="font-medium">{formatPrice(subtotal * 0.2)}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-gray-600">Доставка</p>
                          <p className="font-medium">
                            {subtotal > 7500 ? 'Бесплатно' : formatPrice(500)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-lg font-bold">Итого</p>
                          <p className="text-lg font-bold">
                            {formatPrice(subtotal + subtotal * 0.2 + (subtotal > 7500 ? 0 : 500))}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-3">
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/cart")}
                    className="w-full"
                  >
                    Вернуться в корзину
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      {/* Диалоговое окно для быстрой регистрации */}
      <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Авторизация</DialogTitle>
            <DialogDescription>
              Для оформления заказа необходимо войти в систему или зарегистрироваться.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue={authTab} onValueChange={(value) => setAuthTab(value as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="register">Регистрация</TabsTrigger>
              <TabsTrigger value="login">Вход</TabsTrigger>
            </TabsList>
            
            <TabsContent value="register" className="mt-4">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Имя пользователя</FormLabel>
                        <FormControl>
                          <Input placeholder="user123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="name@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Пароль</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter className="mt-4">
                    <Button 
                      type="submit" 
                      disabled={registerMutation.isPending}
                      className="w-full"
                    >
                      {registerMutation.isPending ? "Регистрация..." : "Зарегистрироваться"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="login" className="mt-4">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Имя пользователя</FormLabel>
                        <FormControl>
                          <Input placeholder="user123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Пароль</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter className="mt-4">
                    <Button 
                      type="submit" 
                      disabled={loginMutation.isPending}
                      className="w-full"
                    >
                      {loginMutation.isPending ? "Вход..." : "Войти"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}