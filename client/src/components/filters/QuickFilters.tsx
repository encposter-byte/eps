import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal, ArrowUpDown } from "lucide-react";

export type SortOption = "featured" | "price_asc" | "price_desc" | "name_asc" | "name_desc";

interface QuickFiltersProps {
  supplier: string | null;
  onSupplierChange: (supplier: string | null) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  onOpenFilters?: () => void;
  totalProducts?: number;
}

const SUPPLIERS = [
  { id: null, name: "Все поставщики" },
  { id: "DCK", name: "DCK" },
  { id: "TSS", name: "TSS" },
  { id: "HUGONGWELD", name: "HUGONG WELD" },
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
}: QuickFiltersProps) {
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
