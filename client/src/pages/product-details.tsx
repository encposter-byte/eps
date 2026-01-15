import { useEffect, useState } from 'react';
import { useParams, Link } from 'wouter';
import { Heart, ShoppingCart, Star, Truck, Shield, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../components/ui/breadcrumb';
import { useCart } from '../lib/cart';
import { useAuth } from '../hooks/use-auth';
import { formatPrice } from '../lib/format';
import ImageGallery from '../components/product/ImageGallery';

interface Product {
  id: number;
  name: string;
  shortDescription?: string;
  description?: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  sku: string;
  tag?: string;
  categoryId: number;
  category?: {
    id: number;
    name: string;
  };
  specifications?: Record<string, string>;
}

export default function ProductDetails() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/products/${slug}`);
        if (!response.ok) {
          throw new Error('Product not found');
        }
        const data = await response.json();
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product.id);
    }
  };

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-10 bg-gray-200 rounded w-1/3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-8">{error || 'The product you are looking for does not exist.'}</p>
          <Link to="/">
            <Button>На главную</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6 text-sm">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/" className="transition-colors hover:text-foreground/80">
                  Главная
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {product.category && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link 
                      to={`/category/${product.categoryId}`}
                      className="transition-colors hover:text-foreground/80"
                    >
                      {product.category.name}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium">
                {product.name.length > 30 ? `${product.name.substring(0, 30)}...` : product.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Product Content */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 md:p-8">
            {/* Product Image Gallery */}
            <div className="space-y-4">
              <ImageGallery
                mainImage={product.imageUrl}
                additionalImages={product.specifications?.['Картинки2']}
                productName={product.name}
              />

              {/* Product Features */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg">
                  <Truck className="h-5 w-5 text-blue-600 mb-1" />
                  <span className="text-xs text-blue-800 font-medium">Быстрая доставка</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-green-50 rounded-lg">
                  <Shield className="h-5 w-5 text-green-600 mb-1" />
                  <span className="text-xs text-green-800 font-medium">Гарантия</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-orange-50 rounded-lg">
                  <RotateCcw className="h-5 w-5 text-orange-600 mb-1" />
                  <span className="text-xs text-orange-800 font-medium">Возврат</span>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Header */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    {product.tag && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {product.tag}
                      </Badge>
                    )}
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                      {product.name}
                    </h1>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleWishlist}
                    className="shrink-0"
                  >
                    <Heart 
                      className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} 
                    />
                  </Button>
                </div>

                {product.sku && (
                  <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                )}

                {/* Rating */}
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">(4.0) 128 reviews</span>
                </div>
              </div>

              <Separator />

              {/* Price */}
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-lg text-gray-500 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>
                {product.originalPrice && product.originalPrice > product.price && (
                  <Badge variant="destructive" className="bg-red-100 text-red-800">
                    Save {formatPrice(product.originalPrice - product.price)}
                  </Badge>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {product.stock > 0 ? `В наличии (${product.stock} шт.)` : 'Нет в наличии'}
                </span>
              </div>

              <Separator />

              {/* Description */}
              {product.shortDescription && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Описание</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {product.shortDescription}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-4 pt-4">
                <div className="flex space-x-4">
                  <Button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 text-base"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Добавить в корзину
                  </Button>
                  <Button
                    variant="outline"
                    className="px-6 py-3"
                  >
                    Купить сейчас
                  </Button>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Бесплатная доставка при заказе от 5000₽
                </p>
              </div>
            </div>
          </div>

          {/* Specifications / Характеристики */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="border-t border-gray-100 p-6 md:p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Характеристики</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                {Object.entries(product.specifications)
                  .filter(([key]) => !['Картинки2', 'Описание товара', 'Детальное описание товара2'].includes(key))
                  .map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between py-2 border-b border-gray-100 last:border-b-0"
                  >
                    <span className="text-gray-600 text-sm">{key}</span>
                    <span className="text-gray-900 font-medium text-sm text-right ml-4">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Описание товара - в конце */}
          {(product.description || product.specifications?.['Описание товара']) && (
            <div className="border-t border-gray-100 p-6 md:p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Описание товара</h3>
              <div className="prose max-w-none text-gray-600 whitespace-pre-line">
                {product.specifications?.['Описание товара'] || product.description}
              </div>
            </div>
          )}

          {/* Детальное описание товара2 - в самом конце */}
          {product.specifications?.['Детальное описание товара2'] && (
            <div className="border-t border-gray-100 p-6 md:p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Подробное описание</h3>
              <div className="prose max-w-none text-gray-600 whitespace-pre-line">
                {product.specifications['Детальное описание товара2']}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}