import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Plus, Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Product, Category } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("0");
  const [page, setPage] = useState(1);
  const limit = 10;
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Build query parameters
  const queryParams = new URLSearchParams();
  if (searchTerm) queryParams.append("query", searchTerm);
  if (categoryFilter) queryParams.append("categoryId", categoryFilter);
  queryParams.append("page", page.toString());
  queryParams.append("limit", limit.toString());
  
  // Fetch products
  const { data, isLoading, refetch } = useQuery<{
    products: Product[],
    pagination: {
      page: number,
      limit: number,
      total: number,
      totalPages: number
    }
  }>({ 
    queryKey: [`/api/products?${queryParams.toString()}`],
  });
  
  // Fetch categories
  const { data: categoriesData } = useQuery<{ categories: Category[] }>({
    queryKey: ["/api/categories"],
  });
  
  const categories = categoriesData?.categories || [];
  
  // State for product being deleted
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Полностью переработанный метод принудительного удаления через SQL
  const handleDeleteProduct = async (id: number) => {
    if (!id || isDeleting) return;
    
    setIsDeleting(true);
    
    try {
      
      // Визуально удаляем элемент немедленно
      if (data && data.products) {
        const updatedProducts = data.products.filter(product => product.id !== id);
        
        // Обновляем UI мгновенно
        queryClient.setQueryData(
          [`/api/products?${queryParams.toString()}`], 
          {
            ...data,
            products: updatedProducts,
            pagination: {
              ...data.pagination,
              total: Math.max(0, data.pagination.total - 1)
            }
          }
        );
      }
      
      // Используем SQL маршрут удаления, который гарантированно работает
      const response = await fetch(`/api/admin/hard-delete-product/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Успешно удалено",
          description: "Товар был успешно удален из базы данных."
        });
      } else {
        throw new Error(result.message || "Ошибка при удалении товара");
      }
      
      // Обновляем все возможные запросы, связанные с продуктами
      setTimeout(() => {
        // Инвалидируем все запросы, связанные с продуктами
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] }); // Обновляем счетчики категорий
        // Принудительно обновляем текущий запрос
        refetch();
      }, 500);
      
    } catch (error) {
      toast({
        title: "Ошибка при удалении",
        description: error instanceof Error ? error.message : "Ошибка при удалении товара из базы данных",
        variant: "destructive"
      });
      
      // В любом случае обновляем данные
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        refetch();
      }, 500);
    } finally {
      setIsDeleting(false);
      setDeletingProductId(null);
    }
  };
  
  // Toggle product status (active/inactive)
  const toggleProductStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: number, isActive: boolean }) => {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ isActive })
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (updatedProduct) => {
      queryClient.invalidateQueries({ queryKey: [`/api/products?${queryParams.toString()}`] });
      toast({
        title: "Статус изменен",
        description: `Товар теперь ${updatedProduct.isActive ? 'активен' : 'неактивен'}.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось изменить статус товара",
        variant: "destructive",
      });
    }
  });
  
  // Helper functions for product status display
  const getStatusBadgeClass = (product: Product) => {
    if (!product.isActive) return "bg-gray-100 text-gray-800";
    if (!product.stock || product.stock <= 0) return "bg-red-100 text-red-800";
    if (product.stock <= 5) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };
  
  const getStatusText = (product: Product) => {
    if (!product.isActive) return "Неактивен";
    if (!product.stock || product.stock <= 0) return "Нет в наличии";
    if (product.stock <= 5) return "Мало на складе";
    return "Активен";
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
  };

  // Периодически обновляем данные для синхронизации с БД
  useEffect(() => {
    const intervalId = setInterval(() => {
      refetch();
    }, 30000); // Каждые 30 секунд
    
    return () => clearInterval(intervalId);
  }, [refetch]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Управление товарами</h2>
        <Link href="/admin/import">
          <Button className="bg-red-500 hover:bg-red-600">
            <Plus className="mr-2 h-4 w-4" /> Импорт товаров
          </Button>
        </Link>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Поиск товаров..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </form>
        
        <div className="w-full md:w-64">
          <Select 
            value={categoryFilter} 
            onValueChange={(value) => {
              setCategoryFilter(value);
              setPage(1); // Reset to first page on new filter
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Все категории" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Все категории</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Link href="/admin/products/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Добавить товар
          </Button>
        </Link>
      </div>
      
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Товар</TableHead>
              <TableHead className="hidden md:table-cell">Категория</TableHead>
              <TableHead>Цена</TableHead>
              <TableHead className="hidden md:table-cell">Остаток</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton rows
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-6 w-6" /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded" />
                      <Skeleton className="h-6 w-40" />
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : data?.products && data.products.length > 0 ? (
              data.products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img 
                        src={product.imageUrl || "https://placehold.co/100x100?text=Нет+изображения"} 
                        alt={product.name} 
                        className="w-10 h-10 rounded object-cover bg-gray-100" 
                      />
                      <span className="font-medium text-gray-900">{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {categories.find(c => c.id === product.categoryId)?.name || "Не указана"}
                  </TableCell>
                  <TableCell>{Number(product.price).toFixed(2)} ₽</TableCell>
                  <TableCell className="hidden md:table-cell">{product.stock}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(product)}`}>
                      {getStatusText(product)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end items-center gap-2">
                      <Select 
                        defaultValue={product.isActive ? "active" : "inactive"}
                        onValueChange={(value) => {
                          toggleProductStatus.mutate({ 
                            id: product.id, 
                            isActive: value === "active" 
                          });
                        }}
                      >
                        <SelectTrigger className="w-[110px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Активен</SelectItem>
                          <SelectItem value="inactive">Неактивен</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Link href={`/admin/products/edit/${product.id}`}>
                        <Button variant="outline" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="text-red-500 hover:text-red-600"
                        onClick={() => setDeletingProductId(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6">
                  <p className="text-gray-500">Товары не найдены</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <p className="text-sm text-gray-500">
           Показано {(page - 1) * limit + 1}-
            {Math.min(page * limit, data.pagination.total)} из {data.pagination.total} товаров
          </p>
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Назад
            </Button>
            <Button 
              variant="outline"
              onClick={() => setPage(Math.min(data.pagination.totalPages, page + 1))}
              disabled={page === data.pagination.totalPages}
            >
              Вперед
            </Button>
          </div>
        </div>
      )}
      
      {/* Глобальный диалог подтверждения удаления */}
      <AlertDialog open={deletingProductId !== null} onOpenChange={(open) => !open && setDeletingProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить товар</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить этот товар? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingProductId(null)}>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600"
              onClick={() => {
                if (deletingProductId !== null) {
                  handleDeleteProduct(deletingProductId);
                }
              }}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Удаление...
                </>
              ) : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}