import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import CategoryStrip from "@/components/category/CategoryStrip";
import FilterSidebar, { FilterState } from "@/components/filters/FilterSidebar";
import QuickFilters, { SortOption } from "@/components/filters/QuickFilters";
import ProductCard from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Product } from "@shared/schema";
import { Loader2, PackageX, SlidersHorizontal } from "lucide-react";

const DEFAULT_FILTERS: FilterState = {
  categories: [],
  suppliers: [],
  minPrice: 0,
  maxPrice: 500000,
  inStock: false,
};

interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function Home() {
  const [location] = useLocation();
  const queryParams = new URLSearchParams(location.split("?")[1] || "");
  const searchQuery = queryParams.get("query") || "";

  // States
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("featured");
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Build query params for products API
  const buildProductParams = useCallback(() => {
    const params = new URLSearchParams();

    if (searchQuery) params.append("query", searchQuery);
    if (selectedSupplier) params.append("supplier", selectedSupplier);
    if (selectedCategory) {
      // Get category ID from slug - for now just use slug
      params.append("categorySlug", selectedCategory);
    }
    if (filters.minPrice > 0) params.append("minPrice", filters.minPrice.toString());
    if (filters.maxPrice < 500000) params.append("maxPrice", filters.maxPrice.toString());
    if (sort) params.append("sort", sort);
    params.append("page", page.toString());
    params.append("limit", "24");

    return params.toString();
  }, [searchQuery, selectedSupplier, selectedCategory, filters, sort, page]);

  // Fetch products
  const {
    data: productsData,
    isLoading,
    isFetching,
  } = useQuery<ProductsResponse>({
    queryKey: [
      "/api/products",
      searchQuery,
      selectedSupplier,
      selectedCategory,
      filters.minPrice,
      filters.maxPrice,
      sort,
      page,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (searchQuery) params.append("query", searchQuery);
      if (selectedSupplier) params.append("supplier", selectedSupplier);
      if (filters.minPrice > 0) params.append("minPrice", filters.minPrice.toString());
      if (filters.maxPrice < 500000) params.append("maxPrice", filters.maxPrice.toString());
      if (sort) params.append("sort", sort);
      params.append("page", page.toString());
      params.append("limit", "24");

      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) throw new Error("Ошибка загрузки товаров");
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
  });

  const handleCategorySelect = (slug: string | undefined) => {
    setSelectedCategory(slug);
    setPage(1);
  };

  const handleSupplierChange = (supplier: string | null) => {
    setSelectedSupplier(supplier);
    setPage(1);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSort(newSort);
    setPage(1);
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSelectedCategory(undefined);
    setSelectedSupplier(null);
    setPage(1);
  };

  const products = productsData?.products || [];
  const totalProducts = productsData?.total || 0;
  const totalPages = productsData?.totalPages || 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>ЭПС - Профессиональные инструменты</title>
        <meta
          name="description"
          content="Профессиональные инструменты и оборудование от компании ЭПС. Широкий ассортимент по выгодным ценам."
        />
      </Helmet>

      {/* Category Strip - всегда видна */}
      <CategoryStrip
        selectedCategory={selectedCategory}
        supplier={selectedSupplier || undefined}
        onCategorySelect={handleCategorySelect}
      />

      {/* Quick Filters */}
      <QuickFilters
        supplier={selectedSupplier}
        onSupplierChange={handleSupplierChange}
        sort={sort}
        onSortChange={handleSortChange}
        onOpenFilters={() => setMobileFiltersOpen(true)}
        totalProducts={totalProducts}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <FilterSidebar
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onReset={handleResetFilters}
              className="sticky top-[180px]"
            />
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-4">
                    <Skeleton className="aspect-square w-full mb-4" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <PackageX className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Товары не найдены
                </h3>
                <p className="text-gray-500 mb-6 max-w-md">
                  Попробуйте изменить параметры фильтрации или сбросить фильтры
                </p>
                <Button onClick={handleResetFilters} variant="outline">
                  Сбросить фильтры
                </Button>
              </div>
            ) : (
              <>
                {/* Products Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Loading indicator for pagination */}
                {isFetching && !isLoading && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Назад
                    </Button>
                    <div className="flex items-center gap-1">
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Вперед
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Sheet */}
      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5" />
              Фильтры
            </SheetTitle>
          </SheetHeader>
          <div className="p-4">
            <FilterSidebar
              filters={filters}
              onFiltersChange={(newFilters) => {
                handleFiltersChange(newFilters);
              }}
              onReset={() => {
                handleResetFilters();
                setMobileFiltersOpen(false);
              }}
            />
            <div className="mt-4 flex gap-2">
              <Button
                className="flex-1"
                onClick={() => setMobileFiltersOpen(false)}
              >
                Применить
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  handleResetFilters();
                  setMobileFiltersOpen(false);
                }}
              >
                Сбросить
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
