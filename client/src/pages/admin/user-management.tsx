import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

// Компоненты UI
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, MailIcon, PhoneIcon, Search, UserIcon, Users, X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import AdminSidebar from "@/components/admin/sidebar";

// Типы данных
interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  lastLogin?: string | null;
  phone?: string | null;
  fullName?: string | null;
  address?: string | null;
  isActive: boolean;
}

// Схемы валидации форм
const userFormSchema = z.object({
  username: z.string().min(3, "Логин должен содержать не менее 3 символов"),
  email: z.string().email("Укажите правильный email"),
  password: z.string().min(6, "Пароль должен содержать не менее 6 символов").optional(),
  role: z.string().default("user"),
  phone: z.string().optional(),
  fullName: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().default(true),
});

export default function UserManagement() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useState({
    query: "",
    role: "all",
    isActive: "all",
    page: 1,
    limit: 10,
  });
  
  // Модальные окна
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Формы для редактирования и создания
  const editForm = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      email: "",
      role: "user",
      isActive: true,
    },
  });

  const createForm = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      role: "user",
      isActive: true,
    },
  });

  // Запрос на получение списка пользователей с оптимизированным кешированием
  const { 
    data, 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ["/api/admin/users", searchParams],
    queryFn: async () => {
      const queryString = new URLSearchParams({
        ...searchParams,
        page: searchParams.page.toString(),
        limit: searchParams.limit.toString(),
      }).toString();

      const response = await apiRequest("GET", `/api/admin/users?${queryString}`);
      return response;
    },
    // Оптимизация кеширования для списка пользователей
    staleTime: 60000, // 1 минута - список пользователей меняется не так часто
    gcTime: 300000, // 5 минут - сохраняем в памяти
  });

  const users = data?.users || [];
  const totalUsers = data?.total || 0;
  const totalPages = Math.ceil(totalUsers / searchParams.limit);

  // Мутации для управления пользователями
  const createUserMutation = useMutation({
    mutationFn: async (userData: z.infer<typeof userFormSchema>) => {
      return await apiRequest("POST", "/api/admin/users", userData);
    },
    onSuccess: () => {
      toast({
        title: "Пользователь создан",
        description: "Новый пользователь успешно добавлен в систему",
      });
      setIsCreateOpen(false);
      createForm.reset();
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать пользователя",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: number, userData: z.infer<typeof userFormSchema> }) => {
      return await apiRequest("PATCH", `/api/admin/users/${id}`, userData);
    },
    onSuccess: () => {
      toast({
        title: "Пользователь обновлен",
        description: "Данные пользователя успешно обновлены",
      });
      setIsEditOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить данные пользователя",
        variant: "destructive",
      });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number, isActive: boolean }) => {
      return await apiRequest("PATCH", `/api/admin/users/${id}/status`, { isActive });
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.isActive ? "Пользователь активирован" : "Пользователь деактивирован",
        description: variables.isActive 
          ? "Пользователь теперь может войти в систему" 
          : "Доступ пользователя к системе ограничен",
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось изменить статус пользователя",
        variant: "destructive",
      });
    },
  });

  // Обработчики событий
  const handleSearch = () => {
    setSearchParams({
      ...searchParams,
      page: 1, // Сбрасываем страницу при поиске
    });
  };

  const handlePageChange = (page: number) => {
    setSearchParams({
      ...searchParams,
      page,
    });
  };

  const handleReset = () => {
    setSearchParams({
      query: "",
      role: "all",
      isActive: "all",
      page: 1,
      limit: 10,
    });
  };

  const openUserDetails = (user: User) => {
    setSelectedUser(user);
    setIsDetailsOpen(true);
  };

  const openEditUser = (user: User) => {
    setSelectedUser(user);
    editForm.reset({
      username: user.username,
      email: user.email,
      role: user.role,
      phone: user.phone || "",
      fullName: user.fullName || "",
      address: user.address || "",
      isActive: user.isActive,
    });
    setIsEditOpen(true);
  };

  const toggleUserStatus = (user: User) => {
    toggleUserStatusMutation.mutate({
      id: user.id,
      isActive: !user.isActive,
    });
  };

  const onSubmitEdit = (values: z.infer<typeof userFormSchema>) => {
    if (!selectedUser) return;
    
    // Если пароль пустой, удаляем его из данных
    if (!values.password) {
      const { password, ...dataWithoutPassword } = values;
      updateUserMutation.mutate({ id: selectedUser.id, userData: dataWithoutPassword });
    } else {
      updateUserMutation.mutate({ id: selectedUser.id, userData: values });
    }
  };

  const onSubmitCreate = (values: z.infer<typeof userFormSchema>) => {
    createUserMutation.mutate(values);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Н/Д";
    return format(new Date(dateString), "dd MMMM yyyy, HH:mm", { locale: ru });
  };

  const getRoleName = (role: string) => {
    const roleMap: Record<string, string> = {
      user: "Пользователь",
      admin: "Администратор",
      manager: "Менеджер",
    };
    return roleMap[role] || role;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Управление клиентами</h1>
            <p className="text-gray-500">Просмотр и управление учетными записями клиентов</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <UserIcon className="mr-2 h-4 w-4" />
            Добавить клиента
          </Button>
        </div>

        {/* Поиск и фильтры */}
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle>Поиск и фильтры</CardTitle>
            <CardDescription>Поиск клиентов по имени, email или номеру телефона</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Поиск по имени или email"
                  className="pl-8"
                  value={searchParams.query}
                  onChange={(e) => setSearchParams({ ...searchParams, query: e.target.value })}
                />
              </div>
              
              <Select
                value={searchParams.role}
                onValueChange={(role) => setSearchParams({ ...searchParams, role, page: 1 })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Роль" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все роли</SelectItem>
                  <SelectItem value="user">Пользователи</SelectItem>
                  <SelectItem value="admin">Администраторы</SelectItem>
                  <SelectItem value="manager">Менеджеры</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={searchParams.isActive}
                onValueChange={(isActive) => setSearchParams({ ...searchParams, isActive, page: 1 })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все пользователи</SelectItem>
                  <SelectItem value="true">Активные</SelectItem>
                  <SelectItem value="false">Неактивные</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={handleSearch}
                  className="flex-1"
                >
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

        {/* Таблица пользователей */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Список клиентов</CardTitle>
            <div className="text-sm text-muted-foreground">
              Всего: {totalUsers}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : users.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">ID</TableHead>
                        <TableHead>Имя пользователя</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Роль</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Дата регистрации</TableHead>
                        <TableHead className="text-right">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user: User) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.id}</TableCell>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{getRoleName(user.role)}</TableCell>
                          <TableCell>
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              user.isActive 
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                            }`}>
                              {user.isActive ? "Активен" : "Неактивен"}
                            </span>
                          </TableCell>
                          <TableCell>{formatDate(user.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openUserDetails(user)}
                              >
                                Детали
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditUser(user)}
                              >
                                Изменить
                              </Button>
                              <Button
                                variant={user.isActive ? "destructive" : "default"}
                                size="sm"
                                onClick={() => toggleUserStatus(user)}
                              >
                                {user.isActive ? "Блокировать" : "Активировать"}
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
                <Users className="h-12 w-12 text-gray-300" />
                <div>
                  <p className="text-lg font-medium">Нет пользователей</p>
                  <p className="text-sm text-gray-500">
                    Пользователи будут отображаться здесь, когда они появятся
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Детали пользователя */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Информация о клиенте</DialogTitle>
              <DialogDescription>
                Детальная информация о пользователе
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center">
                    <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">ID:</span>
                    <span className="ml-2">{selectedUser.id}</span>
                  </div>
                  <div className="flex items-center">
                    <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Логин:</span>
                    <span className="ml-2">{selectedUser.username}</span>
                  </div>
                  <div className="flex items-center">
                    <MailIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Email:</span>
                    <span className="ml-2">{selectedUser.email}</span>
                  </div>
                  {selectedUser.phone && (
                    <div className="flex items-center">
                      <PhoneIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Телефон:</span>
                      <span className="ml-2">{selectedUser.phone}</span>
                    </div>
                  )}
                  {selectedUser.fullName && (
                    <div className="flex items-center">
                      <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">ФИО:</span>
                      <span className="ml-2">{selectedUser.fullName}</span>
                    </div>
                  )}
                  {selectedUser.address && (
                    <div className="flex items-start">
                      <UserIcon className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm font-medium">Адрес:</span>
                      <span className="ml-2">{selectedUser.address}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Роль:</span>
                    <span className="ml-2">{getRoleName(selectedUser.role)}</span>
                  </div>
                  <div className="flex items-center">
                    <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Статус:</span>
                    <span className={`ml-2 inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      selectedUser.isActive 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {selectedUser.isActive ? "Активен" : "Неактивен"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Дата регистрации:</span>
                    <span className="ml-2">{formatDate(selectedUser.createdAt)}</span>
                  </div>
                  {selectedUser.lastLogin && (
                    <div className="flex items-center">
                      <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Последний вход:</span>
                      <span className="ml-2">{formatDate(selectedUser.lastLogin)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button 
                variant="secondary" 
                onClick={() => setIsDetailsOpen(false)}
              >
                Закрыть
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Редактирование пользователя */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Редактирование пользователя</DialogTitle>
              <DialogDescription>
                Внесите изменения в данные пользователя
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Логин</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Новый пароль (оставьте пустым, чтобы не менять)</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ФИО</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Телефон</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Адрес</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Роль</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите роль" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="user">Пользователь</SelectItem>
                          <SelectItem value="admin">Администратор</SelectItem>
                          <SelectItem value="manager">Менеджер</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">Активен</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="flex space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditOpen(false)}
                  >
                    Отмена
                  </Button>
                  <Button 
                    type="submit"
                    disabled={updateUserMutation.isPending}
                  >
                    {updateUserMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Сохранить
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Создание пользователя */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Создание нового пользователя</DialogTitle>
              <DialogDescription>
                Заполните форму для создания нового пользователя
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onSubmitCreate)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Логин</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
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
                
                <FormField
                  control={createForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ФИО</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Телефон</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Адрес</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Роль</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите роль" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="user">Пользователь</SelectItem>
                          <SelectItem value="admin">Администратор</SelectItem>
                          <SelectItem value="manager">Менеджер</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">Активен</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="flex space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Отмена
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createUserMutation.isPending}
                  >
                    {createUserMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Создать
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}