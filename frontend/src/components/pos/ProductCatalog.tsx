import React, { useState, useEffect } from 'react';
import { Product, CartItem } from '@/types/pos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, ImageOff, ChefHat, Utensils, Package } from 'lucide-react';
import { apiConfig } from '@/config/api';

interface ProductCatalogProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  cart: CartItem[];
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({ 
  products, 
  onAddToCart,
  cart 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [lowStockThreshold, setLowStockThreshold] = useState(5); // Default value

  // Load alert settings from localStorage on component mount
  useEffect(() => {
    const savedAlertSettings = localStorage.getItem('alertSettings');
    if (savedAlertSettings) {
      try {
        const settings = JSON.parse(savedAlertSettings);
        setLowStockThreshold(settings.lowStockThreshold || 5);
      } catch (error) {
        console.error('Error parsing alert settings:', error);
      }
    }
  }, []);

  // Calculate cartCounts from the cart prop
  const cartCounts = React.useMemo(() => {
    const counts: { [key: string]: number } = {};
    cart.forEach(item => {
      counts[item.product.id] = item.quantity;
    });
    return counts;
  }, [cart]);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatPrice = (price: number) => `KES ${price.toFixed(2)}`;

  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http') || imagePath.startsWith('blob:')) {
      return imagePath;
    }
    return `${apiConfig.baseURL}${imagePath}`;
  };

  const handleAddToCart = (product: Product) => {
    if ((cartCounts[product.id] || 0) < product.stock) {
      onAddToCart(product);
    }
  };

  // Check if there are no products in the database
  if (products.length === 0) {
    return (
      <div className="h-full flex flex-col p-3 md:p-6">
        <div className="flex-shrink-0 mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">
            Menu Items
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
            <div className="relative mb-6">
              <Package className="h-16 w-16 text-orange-300 mx-auto" />
              <ChefHat className="h-8 w-8 text-amber-400 absolute -bottom-2 -right-2" />
            </div>
            <p className="text-center text-lg font-medium text-gray-600 mb-2">No Products Available</p>
            <p className="text-sm text-center text-gray-500 max-w-md">
              There are no products in the database. Please add some products to get started.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-3 md:p-6">
      {/* Header */}
      <div className="flex-shrink-0 mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">
          Menu Items
        </h2>

        <div className="flex flex-col gap-3 md:gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm md:text-base border-orange-200 focus:border-orange-400 focus:ring-orange-400"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4 overflow-x-auto pb-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={`text-xs whitespace-nowrap flex-shrink-0 ${
                selectedCategory === category 
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0' 
                  : 'border-orange-200 text-orange-700 hover:bg-orange-50'
              }`}
            >
              {category}
              {category !== 'All' && (
                <Badge variant="secondary" className="ml-2 bg-orange-200 text-orange-800">
                  {products.filter(p => p.category === category).length}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
            <div className="relative mb-6">
              <ChefHat className="h-16 w-16 text-orange-300 mx-auto" />
              <Utensils className="h-8 w-8 text-amber-400 absolute -bottom-2 -right-2" />
            </div>
            <p className="text-center text-lg font-medium text-gray-600 mb-2">No menu items found</p>
            <p className="text-sm text-center text-gray-500 max-w-md">
              Try adjusting your search or select a different category
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4 pb-4">
            {filteredProducts.map(product => {
              const imageUrl = getImageUrl(product.image);
              const addedCount = cartCounts[product.id] || 0;
              const isOutOfStock = product.stock <= 0 || addedCount >= product.stock;
              const availableStock = product.stock - addedCount;
              const isLowStock = availableStock > 0 && availableStock <= lowStockThreshold;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-md border border-orange-100 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col group"
                >
                  <div className="aspect-square bg-gradient-to-br from-orange-50 to-amber-50 relative overflow-hidden">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '';
                          target.className = 'hidden';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 text-orange-300">
                        <ChefHat className="h-10 w-10 mb-2" />
                        <span className="text-xs text-orange-400">No image</span>
                      </div>
                    )}
                    <Badge
                      variant="secondary"
                      className="absolute top-2 right-2 bg-white/90 text-xs border-orange-200 text-orange-700"
                    >
                      {product.category}
                    </Badge>
                  </div>

                  <div className="p-3 md:p-4 flex flex-col flex-grow">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 text-sm md:text-base">
                      {product.name}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 mb-2 line-clamp-2 flex-grow">
                      {product.description || 'Delicious menu item'}
                    </p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-base md:text-lg font-bold text-orange-600">
                        {formatPrice(product.price)}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs md:text-sm shadow-md hover:shadow-lg transition-all"
                        disabled={isOutOfStock}
                      >
                        <Plus className="h-3 md:h-4 w-3 md:w-4 mr-1" />
                        {isOutOfStock ? 'Max Added' : 'Add'}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        Available: {availableStock}
                      </div>
                      {isLowStock && (
                        <Badge variant="outline" className="text-xs text-orange-600 bg-orange-50 border-orange-200">
                          Low Stock
                        </Badge>
                      )}
                      {availableStock === 0 && (
                        <Badge variant="outline" className="text-xs text-red-600 bg-red-50 border-red-200">
                          Sold Out
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};