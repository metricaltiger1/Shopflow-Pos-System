import React, { useState, useEffect } from 'react';
import { User } from '@/types/auth';
import { Product, CartItem } from '@/types/pos';
import { ProductCatalog } from './ProductCatalog';
import { Cart } from './Cart';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { generatePDFReceipt } from '@/utils/pdfGenerator';
import { toast } from 'sonner';
import { apiService } from '@/services/apiService';
import { useAppStore } from '@/stores/appStore';
import { ChefHat, Utensils, Coffee } from 'lucide-react';

interface POSInterfaceProps {
  user: User;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

export const POSInterface: React.FC<POSInterfaceProps> = ({ user, cart, setCart }) => {
  const [clearCartConfirm, setClearCartConfirm] = useState(false);
  const [processOrderConfirm, setProcessOrderConfirm] = useState<{
    open: boolean;
    paymentMethod: 'cash' | 'card' | 'mobile';
  }>({
    open: false,
    paymentMethod: 'cash'
  });
  const [isLoading, setIsLoading] = useState(true);

  const { activeShift, settings, products, setProducts } = useAppStore();
  const vatRate = settings?.vatRate || 0;
  const vatInclusive = settings?.vatInclusive || false;

  useEffect(() => {
    const loadProductsData = async () => {
      try {
        setIsLoading(true);
        const productsData = await apiService.getProducts();
        setProducts(productsData);
      } catch (error) {
        toast.error('Failed to load products');
        console.error('Error loading products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProductsData();
  }, [setProducts]);

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        // Check if we can add more (stock limit)
        if (existingItem.quantity >= product.stock) {
          toast.error(`Cannot add more ${product.name}. Max stock reached.`);
          return prevCart;
        }
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
    toast.success(`${product.name} added to cart`);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    // Check stock limit
    const product = products.find(p => p.id === productId);
    if (product && quantity > product.stock) {
      toast.error(`Cannot add more than ${product.stock} items of ${product.name}`);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
    toast.info('Item removed from cart');
  };

  const clearCart = () => {
    setCart([]);
    toast.info('Cart cleared');
    setClearCartConfirm(false);
  };

  const initiateProcessOrder = (paymentMethod: 'cash' | 'card' | 'mobile') => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (!activeShift || activeShift.status !== 'ACTIVE') {
      toast.error('Please start a shift before processing orders');
      return;
    }

    setProcessOrderConfirm({ open: true, paymentMethod });
  };

  const processOrder = async () => {
    try {
      const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      
      // CORRECTED: Calculate tax only when VAT is NOT inclusive
      const tax = vatInclusive ? 0 : subtotal * (vatRate / 100);
      const total = vatInclusive ? subtotal : subtotal + tax;

      const orderData = {
        shiftId: activeShift!.id,
        userId: user.id,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price
        })),
        subtotal,
        tax,
        total,
        paymentMethod: processOrderConfirm.paymentMethod,
        vatRate,
        vatInclusive
      };

      const newOrder = await apiService.createOrder(orderData);
      
      // Refresh products to update stock levels
      try {
        const updatedProducts = await apiService.getProducts();
        setProducts(updatedProducts);
      } catch (error) {
        toast.error('Order processed but failed to refresh products');
      }
      
      // Generate receipt
      const orderWithItems = {
        ...newOrder,
        items: cart,
        timestamp: new Date(newOrder.timestamp),
        cashierName: user.fullName
      };
      generatePDFReceipt(orderWithItems);
      
      // Clear cart and close dialog
      clearCart();
      setProcessOrderConfirm({ open: false, paymentMethod: 'cash' });
      toast.success(`Order processed successfully! Total: ${settings?.currency || 'KES'} ${total.toFixed(2)}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to process order');
      setProcessOrderConfirm({ open: false, paymentMethod: 'cash' });
    }
  };

  // Calculate total for confirmation dialog - CORRECTED
  const confirmationTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    return vatInclusive ? subtotal : subtotal * (1 + vatRate / 100);
  };

  // Show loading state only when products are actually loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="absolute top-1/4 left-1/4">
            <Utensils className="h-16 w-16 text-amber-600" />
          </div>
          <div className="absolute top-1/3 right-1/4">
            <ChefHat className="h-16 w-16 text-orange-600" />
          </div>
          <div className="absolute bottom-1/4 left-1/3">
            <Coffee className="h-16 w-16 text-amber-800" />
          </div>
        </div>
        
        <div className="text-center z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Menu</h3>
          <p className="text-gray-600">Preparing delicious options for you...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] bg-gradient-to-br from-orange-50 to-amber-50">
        {/* Product Catalog Section */}
        <div className="flex-1 order-1 lg:order-1 h-1/2 lg:h-full overflow-hidden">
          <ProductCatalog 
            products={products} 
            onAddToCart={addToCart}
            cart={cart}
          />
        </div>
        
        {/* Cart Section */}
        <div className="w-full lg:w-96 order-2 lg:order-2 h-1/2 lg:h-full bg-white border-t lg:border-t-0 lg:border-l border-orange-200 shadow-lg">
          <Cart
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onClearCart={() => setClearCartConfirm(true)}
            onProcessOrder={initiateProcessOrder}
            hasActiveShift={!!activeShift && activeShift.status === 'ACTIVE'}
            vatRate={vatRate}
            vatInclusive={vatInclusive}
            currency={settings?.currency || 'KES'}
          />
        </div>
      </div>

      {/* Clear Cart Confirmation Dialog */}
      <ConfirmationDialog
        open={clearCartConfirm}
        onOpenChange={setClearCartConfirm}
        title="Clear Cart"
        description="Are you sure you want to clear all items from the cart? This action cannot be undone."
        confirmText="Clear Cart"
        onConfirm={clearCart}
        variant="destructive"
      />

      {/* Process Order Confirmation Dialog */}
      <ConfirmationDialog
        open={processOrderConfirm.open}
        onOpenChange={(open) => setProcessOrderConfirm(prev => ({ ...prev, open }))}
        title="Process Order"
        description={`Confirm processing this order with ${processOrderConfirm.paymentMethod} payment. Total amount: ${settings?.currency || 'KES'} ${confirmationTotal().toFixed(2)}`}
        confirmText="Process Order"
        onConfirm={processOrder}
      />
    </>
  );
};