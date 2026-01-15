import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Heart, ShoppingCart, Star, Eye } from "lucide-react";
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

  const handleAddToCart = () => {
    addToCart(product.id);
  };

  const toggleWishlist = async () => {
    if (isWishlisted) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product.id);
    }
  };

  // Безопасное форматирование цены с проверкой на null/undefined
  // Округляем до целых для больших сумм
  const formatPrice = (price: string | number | null | undefined) => {
    if (price == null) return "0 ₽";
    const num = Number(price);
    return Math.round(num).toLocaleString('ru-RU') + " ₽";
  };

  return (
    <Card className="product-card group h-full flex flex-col bg-white border-0 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <Link href={`/product/${product.slug}`}>
          <div className="relative min-h-[220px] flex items-center justify-center p-6 group-hover:scale-105 transition-transform duration-300">
            {/* Декоративные элементы */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            {/* Изображение товара */}
            <div className="relative z-10 text-center">
              <div className="w-full h-32 mx-auto mb-4 flex items-center justify-center">
                {product.imageUrl && !imageError ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="max-w-full max-h-full object-contain"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-eps-red/10 to-eps-yellow/10 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-eps-red" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">{product.name}</h3>
              <p className="text-sm text-gray-500">Артикул: {product.sku}</p>
            </div>
          </div>
        </Link>

        {/* Действия в правом верхнем углу */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="bg-white/90 backdrop-blur-sm shadow-lg text-gray-600 hover:text-eps-red h-10 w-10 rounded-full border border-white/20"
                  onClick={toggleWishlist}
                >
                  <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-eps-red text-eps-red' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isWishlisted ? 'Удалить из избранного' : 'Добавить в избранное'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="bg-white/90 backdrop-blur-sm shadow-lg text-gray-600 hover:text-eps-red h-10 w-10 rounded-full border border-white/20"
                  asChild
                >
                  <Link href={`/product/${product.slug}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Быстрый просмотр</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Бейджи для скидок */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
            <div className="inline-block">
              <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                -{Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-6 flex flex-col flex-grow bg-white">
        {/* Отзывы и рейтинг */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star 
                key={i} 
                className={`h-4 w-4 ${i < (Number(product.rating) || 0) ? 'fill-eps-yellow text-eps-yellow' : 'text-gray-200'}`} 
              />
            ))}
            <span className="text-xs text-gray-500 ml-2">{product.rating || 0}</span>
          </div>
          {product.reviewCount && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {product.reviewCount} отзывов
            </span>
          )}
        </div>

        {/* Короткое описание */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow leading-relaxed">
          {product.shortDescription || (product.description ? product.description.substring(0, 120) + "..." : "Профессиональный инструмент высокого качества")}
        </p>

        {/* Цена и кнопка в корзину */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 gap-3">
          {/* Показываем цену только если она больше 0 */}
          {Number(product.price) > 0 ? (
            <div className="flex flex-col min-w-0">
              {product.originalPrice && Number(product.originalPrice) > Number(product.price) ? (
                <>
                  <span className="text-lg font-bold text-eps-red whitespace-nowrap">{formatPrice(product.price)}</span>
                  <span className="text-xs text-gray-400 line-through whitespace-nowrap">{formatPrice(product.originalPrice)}</span>
                </>
              ) : (
                <span className="text-lg font-bold text-gray-900 whitespace-nowrap">{formatPrice(product.price)}</span>
              )}
            </div>
          ) : (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-eps-red">По запросу</span>
            </div>
          )}

          <Button
            className="bg-gradient-to-r from-eps-red to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-4 py-2 rounded-lg font-medium flex-shrink-0"
            onClick={handleAddToCart}
            disabled={isLoading}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            В корзину
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}