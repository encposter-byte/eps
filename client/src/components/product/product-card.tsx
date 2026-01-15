import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const { addToCart, isLoading } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const isWishlisted = isInWishlist(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product.id);
  };

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product.id);
    }
  };

  // Форматирование цены без копеек
  const formatPrice = (price: string | number | null | undefined) => {
    if (price == null) return "0 ₽";
    const num = Number(price);
    return Math.round(num).toLocaleString('ru-RU') + " ₽";
  };

  const hasDiscount = product.originalPrice && Number(product.originalPrice) > Number(product.price);
  const hasPrice = Number(product.price) > 0;

  return (
    <Card className="product-card group h-full flex flex-col bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200">
      <Link href={`/product/${product.slug}`} className="flex flex-col h-full">
        {/* Изображение */}
        <div className="relative bg-gray-50 p-2 sm:p-4">
          {/* Кнопка избранного */}
          <button
            onClick={toggleWishlist}
            className="absolute top-1 right-1 sm:top-2 sm:right-2 z-10 p-1 sm:p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
          >
            <Heart className={`h-3.5 w-3.5 sm:h-5 sm:w-5 ${isWishlisted ? 'fill-eps-red text-eps-red' : 'text-gray-400'}`} />
          </button>

          {/* Бейдж скидки */}
          {hasDiscount && (
            <span className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-eps-red text-white text-[9px] sm:text-xs font-bold px-1 sm:px-2 py-0.5 rounded-full">
              -{Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)}%
            </span>
          )}

          {/* Картинка */}
          <div className="h-20 sm:h-32 flex items-center justify-center">
            {product.imageUrl && !imageError ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="max-w-full max-h-full object-contain"
                onError={() => setImageError(true)}
                loading="lazy"
              />
            ) : (
              <div className="w-12 h-12 sm:w-20 sm:h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-10 sm:h-10 text-gray-400" viewBox="0 0 24 24" fill="none">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Контент */}
        <CardContent className="p-2 sm:p-4 flex flex-col flex-grow">
          {/* Название */}
          <h3 className="text-xs sm:text-base font-medium text-gray-900 line-clamp-2 mb-0.5 sm:mb-2 leading-tight">
            {product.name}
          </h3>

          {/* Артикул */}
          <p className="text-[10px] sm:text-xs text-gray-400 mb-1.5 sm:mb-3">
            Арт: {product.sku}
          </p>

          {/* Цена и кнопка */}
          <div className="mt-auto">
            {/* Цена */}
            <div className="mb-1.5 sm:mb-3">
              {hasPrice ? (
                <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
                  <span className={`text-sm sm:text-lg font-bold whitespace-nowrap ${hasDiscount ? 'text-eps-red' : 'text-gray-900'}`}>
                    {formatPrice(product.price)}
                  </span>
                  {hasDiscount && (
                    <span className="text-[10px] sm:text-sm text-gray-400 line-through whitespace-nowrap">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs sm:text-sm font-medium text-eps-red">По запросу</span>
              )}
            </div>

            {/* Кнопка в корзину */}
            <Button
              className="w-full bg-eps-red hover:bg-red-600 text-white text-[10px] sm:text-sm h-7 sm:h-10 rounded-lg font-medium"
              onClick={handleAddToCart}
              disabled={isLoading}
            >
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              В корзину
            </Button>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
