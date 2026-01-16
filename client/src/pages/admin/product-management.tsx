import AdminSidebar from "@/components/admin/sidebar";
import ProductTable from "@/components/admin/product-table";
import { Button } from "@/components/ui/button";
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
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function ProductManagement() {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Новая версия функции удаления всех товаров с защитой от сбоев
  const handleDeleteAllProducts = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    
    try {
      // Показываем дополнительное уведомление во время удаления
      toast({
        title: "Выполняется удаление товаров...",
        description: "Пожалуйста, подождите и не закрывайте страницу",
      });
      
      // Используем параметр запроса для предотвращения кэширования
      const noCacheToken = `nocache=${new Date().getTime()}-${Math.random().toString(36).substring(2, 15)}`;
      const deleteUrl = `/api/admin/products/delete-all?${noCacheToken}`;
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Request-Time': new Date().toISOString()
        },
        cache: 'no-store'
      });
      
      // Проверяем ответ
      if (response.ok) {
        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          data = { message: "Товары удалены, но сервер вернул некорректный ответ" };
        }
        
        toast({
          title: "Все товары удалены",
          description: `Операция выполнена успешно. Было товаров: ${data.before || 'неизвестно'}, осталось: ${data.after || '0'}`
        });
        
        // Полностью очищаем кэш для всех запросов
        queryClient.clear();
        queryClient.resetQueries();
        
        // Чистим localStorage от сохраненных запросов
        try {
          Object.keys(localStorage).forEach(key => {
            if (key.includes('query') || key.includes('products')) {
              localStorage.removeItem(key);
            }
          });
        } catch (storageError) {
          // Игнорируем ошибки очистки localStorage
        }

        // Принудительная перезагрузка всей страницы, чтобы гарантировать обновление данных
        setTimeout(() => {
          window.location.href = `/admin?t=${Date.now()}`;
        }, 1000);
      } else {
        
        // Пытаемся получить сообщение об ошибке из ответа
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || `Ошибка сервера (${response.status})`;
        } catch (e) {
          errorMessage = `Не удалось удалить товары. Код ошибки: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      toast({
        title: "Ошибка при удалении",
        description: error instanceof Error ? error.message : "Не удалось удалить все товары. Попробуйте позже.",
        variant: "destructive"
      });
      
      // В случае ошибки, всё равно перезагружаем страницу через больший интервал
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Управление товарами</h1>
          <Button 
            variant="destructive" 
            className="flex items-center gap-2"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Удалить все товары
          </Button>
        </div>
        <ProductTable />
        
        {/* Диалог подтверждения удаления всех товаров */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить все товары</AlertDialogTitle>
              <AlertDialogDescription>
                Вы действительно хотите удалить ВСЕ товары? Это действие необратимо!
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-red-500 hover:bg-red-600" 
                onClick={handleDeleteAllProducts}
                disabled={isDeleting}
              >
                {isDeleting ? "Удаление..." : "Удалить все"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
