import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Category } from "@shared/schema";
import { Filter, X, RotateCcw } from "lucide-react";

export interface FilterState {
  categories: string[];
  suppliers: string[];
  minPrice: number;
  maxPrice: number;
  inStock: boolean;
}

interface FilterSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onReset: () => void;
  className?: string;
}

const BRANDS = [
  { id: "DCK", name: "DCK" },
  { id: "TSS", name: "TSS" },
  { id: "HUGONGWELD", name: "HUGONG WELD" },
  { id: "Mitsudiesel", name: "Mitsudiesel" },
];

const DEFAULT_MAX_PRICE = 500000;

export default function FilterSidebar({
  filters,
  onFiltersChange,
  onReset,
  className = "",
}: FilterSidebarProps) {
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>([
    filters.minPrice,
    filters.maxPrice,
  ]);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Ошибка загрузки категорий");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    setLocalPriceRange([filters.minPrice, filters.maxPrice]);
  }, [filters.minPrice, filters.maxPrice]);

  const handleCategoryToggle = (slug: string) => {
    const newCategories = filters.categories.includes(slug)
      ? filters.categories.filter((c) => c !== slug)
      : [...filters.categories, slug];
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const handleSupplierToggle = (id: string) => {
    const newSuppliers = filters.suppliers.includes(id)
      ? filters.suppliers.filter((s) => s !== id)
      : [...filters.suppliers, id];
    onFiltersChange({ ...filters, suppliers: newSuppliers });
  };

  const handlePriceChange = (value: number[]) => {
    setLocalPriceRange([value[0], value[1]]);
  };

  const handlePriceCommit = () => {
    onFiltersChange({
      ...filters,
      minPrice: localPriceRange[0],
      maxPrice: localPriceRange[1],
    });
  };

  const handleInStockToggle = () => {
    onFiltersChange({ ...filters, inStock: !filters.inStock });
  };

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.suppliers.length > 0 ||
    filters.minPrice > 0 ||
    filters.maxPrice < DEFAULT_MAX_PRICE ||
    filters.inStock;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ru-RU").format(price);
  };

  return (
    <aside className={`bg-white rounded-lg border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Фильтры</h3>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-gray-500 hover:text-gray-700"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Сбросить
          </Button>
        )}
      </div>

      <ScrollArea className="h-[calc(100vh-250px)]">
        <Accordion
          type="multiple"
          defaultValue={["price", "suppliers", "categories"]}
          className="space-y-2"
        >
          {/* Цена */}
          <AccordionItem value="price" className="border-none">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="font-medium text-sm">Цена, ₽</span>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="px-1">
                <Slider
                  value={localPriceRange}
                  min={0}
                  max={DEFAULT_MAX_PRICE}
                  step={1000}
                  onValueChange={handlePriceChange}
                  onValueCommit={handlePriceCommit}
                  className="mt-2"
                />
                <div className="flex justify-between mt-3 text-sm text-gray-600">
                  <span>{formatPrice(localPriceRange[0])}</span>
                  <span>{formatPrice(localPriceRange[1])}</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <Separator />

          {/* Бренды */}
          <AccordionItem value="suppliers" className="border-none">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="font-medium text-sm">Бренд</span>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-2">
                {BRANDS.map((brand) => (
                  <div key={brand.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`brand-${brand.id}`}
                      checked={filters.suppliers.includes(brand.id)}
                      onCheckedChange={() => handleSupplierToggle(brand.id)}
                    />
                    <Label
                      htmlFor={`brand-${brand.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {brand.name}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <Separator />

          {/* Категории */}
          <AccordionItem value="categories" className="border-none">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="font-medium text-sm">Категории</span>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category.slug}`}
                      checked={filters.categories.includes(category.slug)}
                      onCheckedChange={() => handleCategoryToggle(category.slug)}
                    />
                    <Label
                      htmlFor={`category-${category.slug}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {category.name}
                    </Label>
                    <span className="text-xs text-gray-400">
                      {category.productCount || 0}
                    </span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <Separator />

          {/* Наличие */}
          <div className="py-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="in-stock"
                checked={filters.inStock}
                onCheckedChange={handleInStockToggle}
              />
              <Label
                htmlFor="in-stock"
                className="text-sm font-medium cursor-pointer"
              >
                Только в наличии
              </Label>
            </div>
          </div>
        </Accordion>
      </ScrollArea>
    </aside>
  );
}
