import { useState } from "react";
import { Link } from "wouter";
import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ShoppingCart, 
  ArrowLeft, 
  ShoppingBag, 
  CreditCard, 
  Truck, 
  Shield 
} from "lucide-react";
import { useCart } from "@/lib/cart";
import { Separator } from "@/components/ui/separator";
import CartItem from "@/components/cart/cart-item";

export default function Cart() {
  const { items, subtotal, itemCount, clearCart, isLoading } = useCart();
  const [isClearingCart, setIsClearingCart] = useState(false);
  
  const handleClearCart = async () => {
    setIsClearingCart(true);
    await clearCart();
    setIsClearingCart(false);
  };
  
  // Calculate tax and shipping
  const tax = subtotal * 0.2; // 20% НДС
  const shipping = subtotal > 7500 ? 0 : 500; // Бесплатная доставка при заказе от 7500₽
  const total = subtotal + tax + shipping;
  
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-16">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-eps-gradient mb-2">Загрузка корзины...</h2>
          <p className="text-gray-500">Пожалуйста, подождите, мы загружаем информацию о вашей корзине.</p>
        </div>
      </div>
    );
  }
  
  if (!items || items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-16">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-eps-gradient mb-2">Ваша корзина пуста</h2>
          <p className="text-gray-500 mb-8">Похоже, вы ещё не добавили товары в корзину.</p>
          <Button asChild>
            <Link href="/">Продолжить покупки</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-eps-gradient mb-8">Корзина</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-medium flex justify-between items-center">
                <span>Товары ({itemCount})</span>
                <Button 
                  variant="ghost" 
                  className="text-gray-500 text-sm font-normal"
                  onClick={handleClearCart}
                  disabled={isClearingCart}
                >
                  Очистить корзину
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full sm:w-auto" asChild>
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Продолжить покупки
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Order Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-medium">Информация о заказе</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Сумма товаров</span>
                <span className="font-medium">{subtotal.toFixed(0)} ₽</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">НДС (20%)</span>
                <span className="font-medium">{tax.toFixed(0)} ₽</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Доставка</span>
                <span className="font-medium">
                  {shipping === 0 ? 'Бесплатно' : `${shipping.toFixed(0)} ₽`}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-medium text-lg">Итого</span>
                <span className="font-bold text-lg">{total.toFixed(0)} ₽</span>
              </div>
              
              <Button className="w-full mt-6" asChild>
                <Link href="/checkout">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Оформить заказ
                </Link>
              </Button>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3 text-sm text-gray-500">
              <div className="flex items-center">
                <Truck className="h-4 w-4 mr-2 text-primary" />
                <span>Бесплатная доставка при заказе от 7500 ₽</span>
              </div>
              <div className="flex items-center">
                <ShoppingBag className="h-4 w-4 mr-2 text-primary" />
                <span>Возврат в течение 30 дней</span>
              </div>
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2 text-primary" />
                <span>Безопасная оплата</span>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
