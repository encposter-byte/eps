import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SimpleRegisterForm } from "@/components/simple-register-form";

const loginSchema = z.object({
  username: z.string().min(1, "Введите логин"),
  password: z.string().min(1, "Введите пароль"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("login");

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  const onLogin = (data: LoginForm) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        setLocation("/");
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      {/* Mobile: только форма, Desktop: форма + hero */}
      <div className="flex flex-col lg:flex-row min-h-screen">

        {/* Форма авторизации */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-2">
                <img src="/logo.png" alt="ЭПС" className="h-12 sm:h-14" />
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">
                Вход в аккаунт
              </CardTitle>
              <CardDescription className="text-sm">
                Профессиональные инструменты для мастеров
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login" className="text-sm">Вход</TabsTrigger>
                  <TabsTrigger value="register" className="text-sm">Регистрация</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4 mt-0">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Логин или телефон</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Введите логин"
                                className="h-11"
                                {...field}
                              />
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
                            <FormLabel className="text-sm">Пароль</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Введите пароль"
                                className="h-11"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full h-11 bg-eps-red hover:bg-red-700 text-base font-medium"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Вход...
                          </>
                        ) : (
                          "Войти"
                        )}
                      </Button>
                    </form>
                  </Form>

                  {/* Забыли пароль */}
                  <div className="text-center pt-2">
                    <a
                      href="/password-reset"
                      className="text-sm text-gray-500 hover:text-eps-red transition-colors"
                    >
                      Забыли пароль?
                    </a>
                  </div>
                </TabsContent>

                <TabsContent value="register" className="mt-0">
                  <SimpleRegisterForm />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Hero секция - только на десктопе */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-eps-red to-orange-500 p-8 items-center justify-center text-white">
          <div className="max-w-lg text-center">
            <h1 className="text-4xl font-bold mb-4">
              Добро пожаловать в ЭПС
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Крупнейший поставщик профессионального инструмента в России
            </p>

            <div className="space-y-4 text-left bg-white/10 rounded-xl p-6">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span>Более 1000 товаров в каталоге</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span>Быстрая доставка по всей России</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span>Гарантия качества на все товары</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span>Техническая поддержка 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
