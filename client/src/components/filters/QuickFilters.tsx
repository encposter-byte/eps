import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal, ArrowUpDown, Search, X } from "lucide-react";

export type SortOption = "featured" | "price_asc" | "price_desc" | "name_asc" | "name_desc";

interface QuickFiltersProps {
  supplier: string | null;
  onSupplierChange: (supplier: string | null) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  onOpenFilters?: () => void;
  totalProducts?: number;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const SUPPLIERS = [
  { id: null, name: "Все бренды" },
  { id: "DCK", name: "DCK" },
  { id: "TSS", name: "TSS" },
  { id: "HUGONGWELD", name: "HUGONG WELD" },
  { id: "MITSUDIESEL", name: "Mitsudiesel" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "featured", label: "По популярности" },
  { value: "price_asc", label: "Сначала дешевые" },
  { value: "price_desc", label: "Сначала дорогие" },
  { value: "name_asc", label: "По названию А-Я" },
  { value: "name_desc", label: "По названию Я-А" },
];

export default function QuickFilters({
  supplier,
  onSupplierChange,
  sort,
  onSortChange,
  onOpenFilters,
  totalProducts,
  searchQuery = "",
  onSearchChange,
}: QuickFiltersProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Sync local search with external searchQuery
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange?.(localSearch);
  };

  const handleClearSearch = () => {
    setLocalSearch("");
    onSearchChange?.("");
  };

  return (
    <div className="bg-white border-b overflow-hidden">
      <div className="container mx-auto px-4 py-3">
        {/* Mobile: Stacked layout, Desktop: Row layout */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3">
          {/* Supplier Tabs - horizontally scrollable on mobile */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            {SUPPLIERS.map((s) => (
              <Button
                key={s.id || "all"}
                variant={supplier === s.id ? "default" : "ghost"}
                size="sm"
                onClick={() => onSupplierChange(s.id)}
                className={`
                  whitespace-nowrap px-3 sm:px-4 text-xs sm:text-sm flex-shrink-0
                  ${supplier === s.id
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }
                `}
              >
                {s.name}
              </Button>
            ))}
          </div>

          {/* Right side: Sort + Filters button */}
          <div className="flex items-center gap-2 justify-between sm:justify-end">
            {/* Product count */}
            {totalProducts !== undefined && (
              <span className="text-xs sm:text-sm text-gray-500">
                {totalProducts} {getProductWord(totalProducts)}
              </span>
            )}

            {/* Sort Dropdown - smaller on mobile */}
            <Select value={sort} onValueChange={(v) => onSortChange(v as SortOption)}>
              <SelectTrigger className="w-[140px] sm:w-[180px] h-8 sm:h-9 text-xs sm:text-sm">
                <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-gray-500" />
                <SelectValue placeholder="Сортировка" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Mobile Filters Button */}
            {onOpenFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenFilters}
                className="lg:hidden h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
              >
                <SlidersHorizontal className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Фильтры</span>
              </Button>
            )}
          </div>
        </div>

        {/* Search Bar - под фильтрами поставщиков */}
        {onSearchChange && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Поиск товаров..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="pl-9 pr-9 h-9 sm:h-10 text-sm"
                />
                {localSearch && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button type="submit" className="h-9 sm:h-10 px-4 sm:px-6 text-sm flex-shrink-0">
                Найти
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function getProductWord(count: number): string {
  const lastTwo = count % 100;
  const lastOne = count % 10;

  if (lastTwo >= 11 && lastTwo <= 19) {
    return "товаров";
  }

  if (lastOne === 1) {
    return "товар";
  }

  if (lastOne >= 2 && lastOne <= 4) {
    return "товара";
  }

  return "товаров";
}
