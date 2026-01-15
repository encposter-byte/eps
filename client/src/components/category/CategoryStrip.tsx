import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryWithImage } from "@shared/schema";
import {
  Wrench, Hammer, Drill, Zap, Cog, Package,
  Ruler, Scissors, PaintBucket, Fan, Thermometer,
  Settings, Box, CircuitBoard
} from "lucide-react";

interface CategoryStripProps {
  selectedCategory?: string;
  supplier?: string;
  onCategorySelect?: (slug: string | undefined) => void;
}

// Иконки для разных типов категорий
const categoryIcons: Record<string, React.ElementType> = {
  "tool": Wrench,
  "hammer": Hammer,
  "drill": Drill,
  "electric": Zap,
  "gear": Cog,
  "package": Package,
  "ruler": Ruler,
  "scissors": Scissors,
  "paint": PaintBucket,
  "fan": Fan,
  "temperature": Thermometer,
  "settings": Settings,
  "box": Box,
  "circuit": CircuitBoard,
};

function getCategoryIcon(iconName: string | null): React.ElementType {
  if (!iconName) return Wrench;
  return categoryIcons[iconName.toLowerCase()] || Wrench;
}

export default function CategoryStrip({
  selectedCategory,
  supplier,
  onCategorySelect
}: CategoryStripProps) {
  const { data: categories = [], isLoading } = useQuery<CategoryWithImage[]>({
    queryKey: ["/api/categories/with-images", supplier],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (supplier) params.append("supplier", supplier);
      const res = await fetch(`/api/categories/with-images?${params}`);
      if (!res.ok) throw new Error("Ошибка загрузки категорий");
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 минут
  });

  if (isLoading) {
    return (
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex gap-3 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-24 rounded-lg flex-shrink-0" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="border-b bg-white sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 py-3">
            {/* Кнопка "Все категории" */}
            <button
              onClick={() => onCategorySelect?.(undefined)}
              className={`
                flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg
                min-w-[80px] transition-all duration-200
                ${!selectedCategory
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                }
              `}
            >
              <Package className="h-6 w-6" />
              <span className="text-xs font-medium whitespace-nowrap">Все</span>
            </button>

            {/* Категории */}
            {categories.map((category) => {
              const IconComponent = getCategoryIcon(category.icon);
              const isSelected = selectedCategory === category.slug;

              return (
                <button
                  key={category.id}
                  onClick={() => onCategorySelect?.(category.slug)}
                  className={`
                    flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg
                    min-w-[80px] max-w-[100px] transition-all duration-200
                    ${isSelected
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                    }
                  `}
                >
                  {category.imageUrl ? (
                    <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100">
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement?.classList.add("flex", "items-center", "justify-center");
                          const icon = document.createElement("div");
                          icon.innerHTML = `<svg class="h-6 w-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;
                          e.currentTarget.parentElement?.appendChild(icon);
                        }}
                      />
                    </div>
                  ) : (
                    <IconComponent className="h-6 w-6" />
                  )}
                  <span className="text-xs font-medium text-center line-clamp-2 whitespace-normal leading-tight">
                    {category.name}
                  </span>
                  <span className={`text-[10px] ${isSelected ? "text-primary-foreground/80" : "text-gray-500"}`}>
                    {category.productCount}
                  </span>
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" className="h-2" />
        </ScrollArea>
      </div>
    </div>
  );
}
