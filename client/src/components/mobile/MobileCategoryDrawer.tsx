import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryWithImage } from "@shared/schema";
import { ChevronRight, Package } from "lucide-react";

interface MobileCategoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategorySelect?: (slug: string) => void;
}

export default function MobileCategoryDrawer({
  open,
  onOpenChange,
  onCategorySelect,
}: MobileCategoryDrawerProps) {
  const { data: categories = [], isLoading } = useQuery<CategoryWithImage[]>({
    queryKey: ["/api/categories/with-images"],
    queryFn: async () => {
      const res = await fetch("/api/categories/with-images");
      if (!res.ok) throw new Error("Ошибка загрузки категорий");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleCategoryClick = (slug: string) => {
    onCategorySelect?.(slug);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="text-left">Категории товаров</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(80vh-80px)] mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {/* All products option */}
              <Link href="/">
                <a
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Все товары</p>
                    <p className="text-sm text-gray-500">Полный каталог</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </a>
              </Link>

              {/* Category list */}
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.slug)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{category.name}</p>
                    <p className="text-sm text-gray-500">
                      {category.productCount} {getProductWord(category.productCount)}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
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
