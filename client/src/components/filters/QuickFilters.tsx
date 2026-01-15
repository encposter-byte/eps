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
    <div className="bg-white border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Supplier Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {SUPPLIERS.map((s) => (
              <Button
                key={s.id || "all"}
                variant={supplier === s.id ? "default" : "ghost"}
                size="sm"
                onClick={() => onSupplierChange(s.id)}
                className={`
                  whitespace-nowrap px-4
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

          {/* Right side: Sort + Filters button (mobile) */}
          <div className="flex items-center gap-2">
            {/* Product count */}
            {totalProducts !== undefined && (
              <span className="text-sm text-gray-500 hidden sm:inline">
                {totalProducts} {getProductWord(totalProducts)}
              </span>
            )}

            {/* Sort Dropdown */}
            <Select value={sort} onValueChange={(v) => onSortChange(v as SortOption)}>
              <SelectTrigger className="w-[180px] h-9 text-sm">
                <ArrowUpDown className="h-4 w-4 mr-2 text-gray-500" />
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
                className="lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Фильтры
              </Button>
            )}
          </div>
        </div>

        {/* Search Bar - под фильтрами поставщиков */}
        {onSearchChange && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Поиск товаров..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="pl-10 pr-10 h-10"
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
              <Button type="submit" className="h-10 px-6">
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
