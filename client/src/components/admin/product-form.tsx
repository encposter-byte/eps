import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Product, Category, insertProductSchema } from "@shared/schema";

// Форма подтверждения успешного действия
const SuccessMessage = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
      <h3 className="text-lg font-semibold mb-2">Успешно!</h3>
      <p className="mb-4">{message}</p>
      <div className="flex justify-end">
        <Button onClick={onClose}>Закрыть</Button>
      </div>
    </div>
  </div>
);

// Расширенная схема для формы
const productFormSchema = z.object({
  name: z.string().min(2, "Название должно содержать не менее 2 символов"),
  slug: z.string().min(2, "URL должен содержать не менее 2 символов"),
  sku: z.string().min(2, "Артикул должен содержать не менее 2 символов"),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  price: z.coerce.number().min(0, "Цена должна быть больше или равна 0"),
  originalPrice: z.coerce.number().min(0, "Цена должна быть больше или равна 0").optional().nullable(),
  stock: z.coerce.number().min(0, "Количество должно быть положительным").optional().nullable(),
  categoryId: z.coerce.number().min(1, "Выберите категорию"),
  imageUrl: z.string().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  productId?: number;
}

export default function ProductForm({ productId }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [_, navigate] = useLocation();
  const isEditing = !!productId;

  // Загрузка категорий
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Загрузка данных товара при редактировании
  const { data: productData, isLoading: isLoadingProduct } = useQuery<Product>({
    queryKey: [`/api/products/${productId}`],
    enabled: isEditing,
  });

  // Форма
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      sku: "",
      description: "",
      shortDescription: "",
      price: 0,
      originalPrice: null,
      stock: 0,
      categoryId: 0,
      imageUrl: "",
      isActive: true,
      isFeatured: false,
    }
  });

  // Заполнение формы при редактировании
  useEffect(() => {
    if (productData && isEditing) {
      form.reset({
        name: productData.name,
        slug: productData.slug,
        sku: productData.sku,
        description: productData.description || "",
        shortDescription: productData.shortDescription || "",
        price: typeof productData.price === 'string' ? parseFloat(productData.price) : productData.price,
        originalPrice: productData.originalPrice !== null ? 
          (typeof productData.originalPrice === 'string' ? parseFloat(productData.originalPrice) : productData.originalPrice) : null,
        stock: productData.stock !== null ?
          (typeof productData.stock === 'string' ? parseInt(productData.stock, 10) : productData.stock) : 0,
        categoryId: productData.categoryId,
        imageUrl: productData.imageUrl || "",
        isActive: !!productData.isActive,
        isFeatured: !!productData.isFeatured,
      });
    }
  }, [productData, form, isEditing]);

  // Обработка формы
  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);

    try {
      // Преобразуем числовые поля
      const formattedData = {
        ...data,
        price: Number(data.price),
        originalPrice: data.originalPrice ? Number(data.originalPrice) : null,
        stock: data.stock ? Number(data.stock) : 0,
        categoryId: Number(data.categoryId),
        isActive: Boolean(data.isActive),
        isFeatured: Boolean(data.isFeatured)
      };

      // Выполняем запрос напрямую вместо использования mutation
      if (isEditing && productId) {
        await apiRequest("PATCH", `/api/products/${productId}`, formattedData);

        setSuccessMessage("Товар успешно обновлен");
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        setSuccess(true);
      } else {
        await apiRequest("POST", "/api/products", formattedData);

        setSuccessMessage("Товар успешно создан");
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        setSuccess(true);
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: `Не удалось ${isEditing ? "обновить" : "создать"} товар: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Обработка закрытия уведомления об успехе
  const handleSuccessClose = () => {
    setSuccess(false);
    navigate("/admin/products");
  };

  // Генерация slug
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\sа-яё]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[а-яё]/g, (char) => {
        const transliterationMap: { [key: string]: string } = {
          а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo",
          ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
          н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
          ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "",
          ы: "y", ь: "", э: "e", ю: "yu", я: "ya"
        };
        return transliterationMap[char] || char;
      });
  };

  // Обновление slug при изменении названия
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name);
    if (!isEditing || !productData?.slug) {
      form.setValue("slug", generateSlug(name));
    }
  };

  if (isEditing && isLoadingProduct) {
    return <div className="p-8 text-center">Загрузка данных товара...</div>;
  }

  return (
    <>
      {success && (
        <SuccessMessage 
          message={successMessage} 
          onClose={handleSuccessClose} 
        />
      )}
    
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название товара</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Введите название товара"
                        {...field}
                        onChange={handleNameChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Артикул</FormLabel>
                    <FormControl>
                      <Input placeholder="Артикул товара" {...field} />
                    </FormControl>
                    <FormDescription>
                      Уникальный идентификатор товара
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL-адрес (slug)</FormLabel>
                    <FormControl>
                      <Input placeholder="url-adres-tovara" {...field} />
                    </FormControl>
                    <FormDescription>
                      Используется в URL товара. Только латинские буквы, цифры и дефисы.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Категория</FormLabel>
                    <Select
                      value={field.value ? field.value.toString() : ""}
                      onValueChange={(value) => field.onChange(parseInt(value, 10))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите категорию" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Цена (₽)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="originalPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Старая цена (₽)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={field.value === null ? "" : field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === "" ? null : Number(value));
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Для отображения скидки (необязательно)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Количество на складе</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={field.value === null ? "" : field.value}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? null : Number(value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="shortDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Краткое описание</FormLabel>
                    <FormControl>
                      <Input 
                        value={field.value || ""} 
                        onChange={(e) => field.onChange(e.target.value)} 
                      />
                    </FormControl>
                    <FormDescription>
                      Отображается в карточке товара (необязательно)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Полное описание</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Подробное описание товара"
                        className="min-h-[120px]"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL изображения</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/image.jpg" 
                        value={field.value || ""} 
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>
                      Ссылка на изображение товара (необязательно)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4 pt-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Активен</FormLabel>
                        <FormDescription>
                          Отображается в каталоге
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Рекомендуемый</FormLabel>
                        <FormDescription>
                          Показывать на главной
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/products")}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Сохранение..."
                : isEditing
                  ? "Сохранить изменения"
                  : "Создать товар"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}