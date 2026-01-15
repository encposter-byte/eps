import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/product/product-card";
import { Product } from "@shared/schema";

interface ProductListProps {
  query?: string;
  categoryId?: number;
  categoryName?: string;
  limit?: number;
  supplier?: string;
  showHeader?: boolean;
}

export default function ProductList({ query, categoryId, categoryName, limit = 12, supplier, showHeader = true }: ProductListProps) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<string>("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (query) queryParams.append("query", query);
  if (categoryId) queryParams.append("categoryId", categoryId.toString());
  queryParams.append("sort", sort);
  queryParams.append("page", page.toString());
  queryParams.append("limit", limit.toString());
  if (supplier) queryParams.append("supplier", supplier);

  // Параметры поиска в консоль для отладки
  console.log("Search params:", Object.fromEntries(queryParams.entries()));

  // Fetch products с оптимизированным кешированием
  const { data, isLoading } = useQuery<{
    products: Product[],
    total: number,
    page: number,
    totalPages: number,
    hasNextPage: boolean,
    hasPrevPage: boolean
  }>({ 
    queryKey: [`/api/products?${queryParams.toString()}`],
    staleTime: 60000, // 1 минута - разумное время для кеширования списка товаров
    gcTime: 300000, // 5 минут - сохраняем в памяти после исчезновения со страницы
  });

  const handleSortChange = (value: string) => {
    setSort(value);
    setPage(1); // Reset to first page when sort changes
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // Scroll to products section
    const productsSection = document.getElementById('products') || document.querySelector('[data-component-name="section"]');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      // Fallback to top if section not found
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Определяем заголовок
  const getTitle = () => {
    if (query) return `Результаты поиска: "${query}"`;
    if (categoryName) return categoryName;
    return "Все товары";
  };

  return (
    <div>
      {/* Header Section with Beautiful Gradient Background */}
      {showHeader && (
        <div className="bg-gradient-to-r from-eps-red via-red-600 to-red-700 rounded-2xl p-8 mb-8 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start">
            <div className="text-white">
              <h2 className="text-3xl font-bold mb-2">
                {getTitle()}
              </h2>
              <p className="text-red-100 text-lg">
                {isLoading ? "Загрузка товаров..." :
                 `Найдено ${data?.total || 0} ${data?.total === 1 ? 'товар' :
                   (data?.total && data.total >= 2 && data.total <= 4) ? 'товара' : 'товаров'}`}
              </p>
            </div>

            <div className="w-full md:w-auto mt-4 md:mt-0 flex items-center space-x-4">
              {/* Sort Options */}
              <div className="relative w-full md:w-auto">
                <Select value={sort} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-full md:w-[180px] bg-white/20 border-white/30 text-white backdrop-blur-sm hover:bg-white/30">
                    <SelectValue placeholder="Сортировка" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Рекомендуемые</SelectItem>
                    <SelectItem value="price-low">Цена: по возрастанию</SelectItem>
                    <SelectItem value="price-high">Цена: по убыванию</SelectItem>
                    <SelectItem value="newest">Новинки</SelectItem>
                    <SelectItem value="popular">Популярные</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Toggle Grid/List View */}
              <div className="flex border border-white/30 rounded-lg overflow-hidden backdrop-blur-sm">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  className={viewMode === "grid" ? "bg-white/20 text-white border-r border-white/30 hover:bg-white/30" : "bg-white/10 text-white border-r border-white/30 hover:bg-white/20"}
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  className={viewMode === "list" ? "bg-white/20 text-white hover:bg-white/30" : "bg-white/10 text-white hover:bg-white/20"}
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        // Loading skeleton
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg overflow-hidden shadow">
              <Skeleton className="w-full h-56" />
              <div className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-5/6 mb-1" />
                <Skeleton className="h-4 w-full mb-3" />
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-9 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : data?.products && data.products.length > 0 ? (
        <>
          <div className={`grid ${
            viewMode === "grid" 
              ? "grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6" 
              : "grid-cols-1 gap-4"
          }`}>
            {data.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Пагинация */}
          {data.totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <nav className="flex items-center space-x-2">
                {/* Предыдущая страница */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={!data.hasPrevPage}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Назад
                </Button>

                {/* Номера страниц */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(data.totalPages, 7) }, (_, i) => {
                    let pageNum: number;

                    if (data.totalPages <= 7) {
                      // Если страниц мало, показываем все
                      pageNum = i + 1;
                    } else {
                      // Логика для большого количества страниц
                      if (page <= 4) {
                        pageNum = i + 1;
                      } else if (page >= data.totalPages - 3) {
                        pageNum = data.totalPages - 6 + i;
                      } else {
                        pageNum = page - 3 + i;
                      }
                    }

                    // Показываем многоточие
                    if (data.totalPages > 7 && 
                        ((i === 6 && page < data.totalPages - 3) || 
                         (i === 0 && page > 4))) {
                      return (
                        <span key={`ellipsis-${i}`} className="px-2 text-gray-500">
                          ...
                        </span>
                      );
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className={`min-w-[40px] ${
                          pageNum === page 
                            ? "bg-eps-red text-white hover:bg-eps-red/90" 
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                {/* Следующая страница */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={!data.hasNextPage}
                  className="flex items-center gap-1"
                >
                  Вперед
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </nav>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h3 className="text-xl font-medium text-eps-gradient mb-2">Товары не найдены</h3>
          <p className="text-gray-500 max-w-md">
            Мы не смогли найти товары, соответствующие вашему запросу. Попробуйте изменить параметры поиска или фильтры.
          </p>
        </div>
      )}
    </div>
  );
}