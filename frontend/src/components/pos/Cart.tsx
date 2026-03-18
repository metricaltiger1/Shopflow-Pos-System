import React from 'react';
import { CartItem } from '@/types/pos';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Trash2, Minus, Plus, ShoppingCart, CreditCard, Smartphone, Banknote, ChefHat } from 'lucide-react';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onProcessOrder: (paymentMethod: 'cash' | 'card' | 'mobile') => void;
  hasActiveShift: boolean;
  vatRate?: number;
  vatInclusive?: boolean;
  currency?: string;
}

export const Cart: React.FC<CartProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProcessOrder,
  hasActiveShift,
  vatRate = 0,
  vatInclusive = false,
  currency = 'KES'
}) => {
  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  
  // CORRECTED: Calculate tax only if VAT is enabled and NOT inclusive
  // When vatInclusive is FALSE, we need to ADD tax
  // When vatInclusive is TRUE, prices already include tax, so no additional tax calculation
  const tax = vatRate > 0 && !vatInclusive ? subtotal * (vatRate / 100) : 0;
  const total = subtotal + tax;

  const formatPrice = (price: number) => `${currency} ${price.toFixed(2)}`;

  // Reverse the items array to show latest items at the top
  const reversedItems = [...items].reverse();

  return (
    <div className="h-full flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 border-b border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="flex items-center justify-between">
          <h3 className="text-base md:text-lg font-semibold text-orange-900 flex items-center">
            <ShoppingCart className="h-4 md:h-5 w-4 md:w-5 mr-2" />
            Current Order
          </h3>
          <Badge variant="secondary" className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs border-0">
            {items.length} items
          </Badge>
        </div>
      </div>

      {/* Scrollable Cart Items */}
      <div className="flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6">
            <div className="relative mb-4">
              <ShoppingCart className="h-16 w-16 text-orange-200" />
              <ChefHat className="h-8 w-8 text-amber-300 absolute -bottom-2 -right-2" />
            </div>
            <p className="text-center text-base font-medium text-gray-600 mb-1">Your cart is empty</p>
            <p className="text-sm text-center text-gray-500">Add delicious items to start an order</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reversedItems.map(item => {
              const isMaxQuantity = item.quantity >= item.product.stock;
              
              return (
                <div key={item.product.id} className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-100">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 text-sm leading-tight flex-1 pr-2">
                      {item.product.name}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(item.product.id)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        className="h-6 w-6 p-0 text-xs border-orange-200 text-orange-700 hover:bg-orange-50"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium text-orange-800">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="h-6 w-6 p-0 text-xs border-orange-200 text-orange-700 hover:bg-orange-50"
                        disabled={isMaxQuantity}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-orange-600">
                        {formatPrice(item.product.price)} each
                      </div>
                      <div className="font-semibold text-orange-700 text-sm">
                        {formatPrice(item.product.price * item.quantity)}
                      </div>
                      {isMaxQuantity && (
                        <div className="text-xs text-red-500 mt-1">
                          Max stock reached
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed Footer with Totals and Actions */}
      {items.length > 0 && (
        <div className="flex-shrink-0 border-t border-orange-200 p-4 bg-white">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="text-gray-900">{formatPrice(subtotal)}</span>
            </div>
            
            {/* Only show VAT line if VAT is enabled and NOT inclusive */}
            {vatRate > 0 && !vatInclusive && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">VAT ({vatRate}%):</span>
                <span className="text-gray-900">{formatPrice(tax)}</span>
              </div>
            )}
            
            {/* Show note if VAT is inclusive */}
            {vatInclusive && vatRate > 0 && (
              <div className="text-xs text-gray-500 italic">
                Prices include {vatRate}% VAT
              </div>
            )}
            
            <Separator className="bg-orange-200" />
            <div className="flex justify-between text-base md:text-lg font-bold">
              <span className="text-gray-900">Total:</span>
              <span className="text-orange-600">{formatPrice(total)}</span>
            </div>
          </div>

          {!hasActiveShift && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs md:text-sm text-amber-800">
                Please start a shift before processing orders
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Button
              onClick={() => onProcessOrder('cash')}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm md:text-base shadow-md hover:shadow-lg transition-all"
              disabled={!hasActiveShift}
            >
              <Banknote className="h-4 w-4 mr-2" />
              Cash Payment
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => onProcessOrder('card')}
                variant="outline"
                className="border-orange-200 text-orange-700 hover:bg-orange-50 text-xs md:text-sm"
                disabled={!hasActiveShift}
              >
                <CreditCard className="h-4 w-4 mr-1" />
                Card
              </Button>
              <Button
                onClick={() => onProcessOrder('mobile')}
                variant="outline" 
                className="border-amber-200 text-amber-700 hover:bg-amber-50 text-xs md:text-sm"
                disabled={!hasActiveShift}
              >
                <Smartphone className="h-4 w-4 mr-1" />
                M-Pesa
              </Button>
            </div>
            
            <Button
              onClick={onClearCart}
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50 text-sm md:text-base"
            >
              Clear Cart
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};