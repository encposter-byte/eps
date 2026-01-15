import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearch, useLocation } from "wouter";
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
  // Use useSearch hook to properly track query string changes
  const searchString = useSearch();
  const [, setLocation] = useLocation();

  // Parse URL params
  const { searchQuery, urlCategory } = useMemo(() => {
    const params = new URLSearchParams(searchString);
    return {
      searchQuery: params.get("query") || "",
      urlCategory: params.get("category") || undefined,
    };
  }, [searchString]);

  // States
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(urlCategory);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("featured");
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync category from URL
  useEffect(() => {
    setSelectedCategory(urlCategory);
    setPage(1);
  }, [urlCategory]);

  // Reset page when search query changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

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
      if (selectedCategory) params.append("categorySlug", selectedCategory);
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
    // Clear search query from URL
    setLocation("/");
  };

  const handleSearchChange = (query: string) => {
    if (query) {
      setLocation(`/?query=${encodeURIComponent(query)}`);
    } else {
      setLocation("/");
    }
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

      {/* Quick Filters + Search */}
      <QuickFilters
        supplier={selectedSupplier}
        onSupplierChange={handleSupplierChange}
        sort={sort}
        onSortChange={handleSortChange}
        onOpenFilters={() => setMobileFiltersOpen(true)}
        totalProducts={totalProducts}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />

      {/* Main Content */}
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="flex gap-4 sm:gap-6">
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
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-2 sm:p-4">
                    <Skeleton className="aspect-square w-full mb-2 sm:mb-4" />
                    <Skeleton className="h-3 sm:h-4 w-3/4 mb-1 sm:mb-2" />
                    <Skeleton className="h-3 sm:h-4 w-1/2 mb-2 sm:mb-4" />
                    <Skeleton className="h-6 sm:h-8 w-full" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 sm:py-20 text-center px-4">
                <PackageX className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
                  Товары не найдены
                </h3>
                <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6 max-w-md">
                  Попробуйте изменить параметры фильтрации или сбросить фильтры
                </p>
                <Button onClick={handleResetFilters} variant="outline" size="sm">
                  Сбросить фильтры
                </Button>
              </div>
            ) : (
              <>
                {/* Products Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Loading indicator for pagination */}
                {isFetching && !isLoading && (
                  <div className="flex justify-center py-3 sm:py-4">
                    <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary" />
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-1 sm:gap-2 mt-6 sm:mt-8 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="h-8 sm:h-9 px-2 sm:px-4 text-xs sm:text-sm"
                    >
                      Назад
                    </Button>
                    <div className="flex items-center gap-0.5 sm:gap-1">
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
                            className="w-7 h-7 sm:w-9 sm:h-9 p-0 text-xs sm:text-sm"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="h-8 sm:h-9 px-2 sm:px-4 text-xs sm:text-sm"
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
