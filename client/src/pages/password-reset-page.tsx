import { useState, useEffect } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation, Link } from "wouter";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Схема для валидации данных формы запроса сброса пароля
const requestResetSchema = z.object({
  email: z.string().email({ message: "Введите корректный email" }),
});

// Схема для валидации данных формы сброса пароля
const resetPasswordSchema = z.object({
  password: z.string().min(6, { message: "Пароль должен содержать минимум 6 символов" }),
  confirmPassword: z.string().min(1, { message: "Подтвердите пароль" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type RequestResetForm = z.infer<typeof requestResetSchema>;
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

function RequestResetForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  
  const form = useForm<RequestResetForm>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: RequestResetForm) {
    setIsLoading(true);
    try {
      const result = await apiRequest("POST", "/api/password-reset/request", data);
      
      setRequestSent(true);

      // Проверяем, если это тестовый режим Resend
      if (result && result.note) {
        toast({
          title: "Тестовый режим",
          description: result.message || "Инструкции отправлены на тестовый email разработчика.",
        });
      } else {
        toast({
          title: "Запрос отправлен",
          description: "Инструкции по восстановлению пароля отправлены на ваш email.",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при отправке запроса",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (requestSent) {
    return (
      <Alert className="bg-green-50 border-green-200 text-green-800">
        <AlertDescription>
          <p>
            Запрос на восстановление пароля отправлен. Пожалуйста, следуйте инструкциям в полученном письме.
          </p>
          
          <p className="mt-2 text-amber-600 text-sm font-semibold">
            Важно: В тестовом режиме письма отправляются на тестовый почтовый ящик разработчика.
            Используйте токен из консоли для тестирования функции.
          </p>
          
          <div className="mt-4">
            <Link href="/auth">
              <span className="text-blue-600 hover:underline">Вернуться на страницу входа</span>
            </Link>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Введите ваш email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Отправка...
            </>
          ) : "Восстановить пароль"}
        </Button>
      </form>
    </Form>
  );
}

function ResetPasswordForm({ token }: { token: string }) {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  
  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Проверяем валидность токена при загрузке компонента
  useEffect(() => {
    verifyToken();
  }, [token]);

  async function verifyToken() {
    setIsVerifying(true);
    try {
      const result = await apiRequest("GET", `/api/password-reset/verify?token=${token}`);
      
      if (result && result.success) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
        toast({
          title: "Недействительная ссылка",
          description: result?.message || "Ссылка для восстановления пароля недействительна или истекла",
          variant: "destructive",
        });
      }
    } catch (error) {
      setTokenValid(false);
      toast({
        title: "Ошибка",
        description: "Не удалось проверить ссылку восстановления",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  }

  async function onSubmit(data: ResetPasswordForm) {
    setIsLoading(true);
    try {
      const { confirmPassword, ...resetData } = data;
      
      // Обязательно отправляем только токен и пароль, без confirmPassword
      const result = await apiRequest("POST", "/api/password-reset/reset", {
        token,
        password: resetData.password
      });
      
      if (result && result.success) {
        toast({
          title: "Пароль изменен",
          description: "Ваш пароль был успешно изменен. Теперь вы можете войти с новым паролем.",
        });
        setTimeout(() => {
          setLocation("/auth");
        }, 1500);
      } else {
        toast({
          title: "Ошибка",
          description: result?.message || "Не удалось сбросить пароль",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при сбросе пароля",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p>Проверка ссылки восстановления...</p>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <Alert className="bg-red-50 border-red-200 text-red-800">
        <AlertDescription>
          Ссылка для восстановления пароля недействительна или истекла. Пожалуйста, запросите новую ссылку.
          <div className="mt-4">
            <Link href="/password-reset">
              <span className="text-blue-600 hover:underline">Запросить новую ссылку</span>
            </Link>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Новый пароль</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Введите новый пароль" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Подтверждение нового пароля</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Подтвердите новый пароль" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Сохранение...
            </>
          ) : "Сохранить новый пароль"}
        </Button>
      </form>
    </Form>
  );
}

export default function PasswordResetPage() {
  // Проверяем наличие token в URL для определения, какую форму показать
  const [, params] = window.location.search.match(/token=([^&]+)/) || [];
  const token = params;

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {token ? "Сброс пароля" : "Восстановление пароля"}
          </CardTitle>
          <CardDescription>
            {token 
              ? "Введите и подтвердите новый пароль" 
              : "Введите ваш email для получения инструкций по восстановлению пароля"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {token ? <ResetPasswordForm token={token} /> : <RequestResetForm />}
        </CardContent>
      </Card>
    </div>
  );
}