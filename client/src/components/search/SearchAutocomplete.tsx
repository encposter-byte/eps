import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { Product } from "@shared/schema";

interface ProductsResponse {
  products: Product[];
  total: number;
}

interface SearchAutocompleteProps {
  className?: string;
  inputClassName?: string;
  placeholder?: string;
}

export default function SearchAutocomplete({
  className = "",
  inputClassName = "",
  placeholder = "Поиск товаров...",
}: SearchAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [, navigate] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch search suggestions
  const { data, isLoading, isFetching } = useQuery<ProductsResponse>({
    queryKey: ["/api/products/search-suggestions", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return { products: [], total: 0 };
      }
      const params = new URLSearchParams();
      params.append("query", debouncedQuery);
      params.append("limit", "6");
      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30 * 1000,
  });

  const suggestions = data?.products || [];
  const showDropdown = isOpen && debouncedQuery.length >= 2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsOpen(false);
      navigate(`/?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
  };

  const handleSuggestionClick = () => {
    setIsOpen(false);
    setSearchQuery("");
  };

  const formatPrice = (price: number | string | null) => {
    if (!price) return "Цена по запросу";
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            className={`pr-10 ${inputClassName}`}
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
          />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-eps-red transition-colors"
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>

      {/* Dropdown with suggestions */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[400px] overflow-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
              Поиск...
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Ничего не найдено по запросу "{debouncedQuery}"
            </div>
          ) : (
            <>
              {suggestions.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  onClick={handleSuggestionClick}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                >
                  {/* Product image */}
                  <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Search className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {product.sku && `Артикул: ${product.sku}`}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-eps-red">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </Link>
              ))}

              {/* Show all results link */}
              {data && data.total > suggestions.length && (
                <Link
                  href={`/?query=${encodeURIComponent(debouncedQuery)}`}
                  onClick={handleSuggestionClick}
                  className="block p-3 text-center text-sm text-eps-red hover:bg-red-50 transition-colors font-medium"
                >
                  Показать все результаты ({data.total})
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
