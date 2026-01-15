import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Trash2, Minus, Plus } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";

interface CartItemProps {
  item: {
    id: number;
    productId: number;
    quantity: number;
    product: {
      id: number;
      name: string;
      price: number;
      originalPrice?: number;
      imageUrl?: string;
      shortDescription?: string;
      slug: string;
    };
  };
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();
  const [isUpdating, setIsUpdating] = useState(false);
  const [localQuantity, setLocalQuantity] = useState(item.quantity);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Синхронизируем локальное значение с props
  useEffect(() => {
    setLocalQuantity(item.quantity);
  }, [item.quantity]);

  // Обновление количества с debounce
  const updateQuantityDebounced = (newQuantity: number) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      if (newQuantity !== item.quantity && newQuantity >= 1) {
        setIsUpdating(true);
        await updateQuantity(item.id, newQuantity);
        setIsUpdating(false);
      }
    }, 500);
  };

  const handleQuantityDecrease = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (localQuantity > 1) {
      const newQuantity = localQuantity - 1;
      setLocalQuantity(newQuantity);
      updateQuantityDebounced(newQuantity);
    }
  };

  const handleQuantityIncrease = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newQuantity = localQuantity + 1;
    setLocalQuantity(newQuantity);
    updateQuantityDebounced(newQuantity);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Разрешаем пустую строку для удобства ввода
    if (value === '') {
      setLocalQuantity(0);
      return;
    }
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setLocalQuantity(numValue);
      if (numValue >= 1) {
        updateQuantityDebounced(numValue);
      }
    }
  };

  const handleQuantityBlur = () => {
    // При потере фокуса, если значение 0 или пустое, вернуть 1
    if (localQuantity < 1) {
      setLocalQuantity(1);
      updateQuantityDebounced(1);
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsUpdating(true);
    await removeItem(item.id);
    setIsUpdating(false);
  };
  
  // Calculate item total
  const itemTotal = Number(item.product.price) * item.quantity;
  
  return (
    <div className="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-0">
      {/* Product Image */}
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
        <Link href={`/product/${item.product.slug}`}>
          <img
            src={item.product.imageUrl || "https://placehold.co/100x100?text=No+Image"}
            alt={item.product.name}
            className="h-full w-full object-cover object-center"
          />
        </Link>
      </div>
      
      {/* Product Details */}
      <div className="flex flex-1 flex-col">
        <div className="flex justify-between">
          <div>
            <Link href={`/product/${item.product.slug}`}>
              <h3 className="text-base font-medium text-gray-900 hover:text-primary">
                {item.product.name}
              </h3>
            </Link>
            <p className="mt-1 text-sm text-gray-500 line-clamp-1">
              {item.product.shortDescription}
            </p>
          </div>
          <p className="text-right font-medium text-gray-900">
            {formatPrice(itemTotal)}
          </p>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          {/* Quantity Controls */}
          <div className="flex items-center border border-gray-300 rounded-md">
            <button
              type="button"
              className="h-8 w-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleQuantityDecrease}
              disabled={isUpdating || localQuantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </button>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={localQuantity || ''}
              onChange={handleQuantityChange}
              onBlur={handleQuantityBlur}
              className="w-12 text-center text-sm border-x border-gray-300 h-8 focus:outline-none focus:ring-1 focus:ring-primary"
              disabled={isUpdating}
            />
            <button
              type="button"
              className="h-8 w-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleQuantityIncrease}
              disabled={isUpdating}
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          
          {/* Unit Price + Remove */}
          <div className="flex items-center space-x-2">
            <p className="text-sm text-gray-500">
              {formatPrice(item.product.price)} за шт.
            </p>
            <button
              type="button"
              className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-red-500 disabled:opacity-50"
              onClick={handleRemove}
              disabled={isUpdating}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
