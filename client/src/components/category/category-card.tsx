import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Category, Product } from "@shared/schema";

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  // Получаем первый товар из категории для изображения
  const { data: productsResponse } = useQuery<{ products: Product[] }>({
    queryKey: [`/api/products?categoryId=${category.id}&limit=1`],
    staleTime: 300000, // 5 минут кеш
    enabled: !!category.id,
  });

  const products = productsResponse?.products || [];

  // Получаем изображение первого товара из категории
  const getCategoryImage = () => {
    // Используем только изображение из товаров данной категории
    if (products.length > 0 && products[0].imageUrl) {
      // Проверяем, что imageUrl не пустой
      const imageUrl = products[0].imageUrl.trim();
      if (imageUrl && imageUrl !== '') {
        return imageUrl;
      }
    }

    // Если в категории нет товаров с изображениями, показываем placeholder
    return `/placeholder-product.svg`;
  };

  // Определим цвет категории на основе ее названия
  const getCategoryColor = () => {
    const colors = ["eps-orange", "eps-red", "eps-yellow"];
    const index = Math.abs(category.id) % 3; // используем ID для определения цвета
    return colors[index];
  };

  const colorClass = getCategoryColor();

  return (
    <Link href={`/?category=${category.slug}`}>
      <Card className="group relative bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 h-64">
        {/* Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-br from-${colorClass}/5 via-transparent to-${colorClass}/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

        {/* Top Border Line */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-${colorClass} to-${colorClass}/70 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>

        <CardContent className="relative p-6 text-center h-full flex flex-col justify-between">
          <div className="flex flex-col items-center flex-1">
            {/* Category Image */}
            <div className={`w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg group-hover:shadow-xl bg-white p-2`}>
              <img 
                src={getCategoryImage()} 
                alt={category.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('placeholder-product.svg')) {
                    target.src = '/placeholder-product.svg';
                  }
                }}
              />
            </div>

            {/* Category Name */}
            <h3 className="font-bold text-lg text-gray-900 group-hover:text-gray-800 transition-colors duration-200 mb-3 min-h-[3.5rem] flex items-center justify-center text-center leading-tight">
              {category.name.length > 20 ? category.name.substring(0, 17) + '...' : category.name}
            </h3>
          </div>

          {/* Product Count with Badge Style */}
          <div className={`inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 group-hover:bg-${colorClass}/10 transition-colors duration-200 self-center`}>
            <span className="text-sm font-medium text-gray-600 group-hover:text-gray-700">
              {category.productCount || 0} {category.productCount === 1 ? 'товар' : 
               (category.productCount && category.productCount >= 2 && category.productCount <= 4) ? 'товара' : 'товаров'}
            </span>
          </div>

          {/* Hover Effect Arrow */}
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className={`w-6 h-6 rounded-full bg-${colorClass} flex items-center justify-center shadow-lg`}>
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}