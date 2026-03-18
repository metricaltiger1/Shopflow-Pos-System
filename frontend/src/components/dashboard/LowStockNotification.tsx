import React, { useState, useEffect } from 'react';
import { Product } from '@/types/pos';
import { 
  Bell, 
  AlertTriangle, 
  Package, 
  RefreshCw
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/stores/appStore';

interface LowStockNotificationProps {
  onViewProduct?: (product: Product) => void;
  onRefresh?: () => void;
}

export const LowStockNotification: React.FC<LowStockNotificationProps> = ({
  onViewProduct,
  onRefresh
}) => {
  const { products, settings } = useAppStore();
  const [open, setOpen] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(5); // Default value

  // Get alert settings from app store settings
  useEffect(() => {
    if (settings?.lowStockThreshold !== undefined) {
      setLowStockThreshold(settings.lowStockThreshold);
    }
  }, [settings]);

  // Check if alerts are enabled
  const alertsEnabled = settings?.enableLowStockAlerts !== false; // Default to true if not set

  // Filter products that are below the threshold
  const lowStockProducts = alertsEnabled ? products.filter(
    product => product.stock <= lowStockThreshold && product.stock > 0
  ) : [];

  // Sort by stock level (lowest first)
  const sortedLowStockProducts = [...lowStockProducts].sort((a, b) => a.stock - b.stock);

  const getStockLevelColor = (stock: number) => {
    if (stock <= 2) return 'text-red-600 bg-red-100';
    if (stock <= 5) return 'text-amber-600 bg-amber-100';
    return 'text-blue-600 bg-blue-100';
  };

  const getStockLevelText = (stock: number) => {
    if (stock === 1) return 'Last item';
    if (stock <= 2) return 'Critical';
    if (stock <= 5) return 'Low';
    return 'Getting low';
  };

  if (sortedLowStockProducts.length === 0 || !alertsEnabled) {
    return null;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 bg-white/20 hover:bg-white/30">
          <Bell className="h-5 w-5 text-white" />
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white border-0"
          >
            {sortedLowStockProducts.length}
          </Badge>
          <span className="sr-only">Low stock notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0" align="end" forceMount>
        <DropdownMenuLabel className="p-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-amber-100">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-semibold">Low Stock Alert</h4>
                <p className="text-sm text-muted-foreground">
                  {sortedLowStockProducts.length} product{sortedLowStockProducts.length !== 1 ? 's' : ''} need{sortedLowStockProducts.length === 1 ? 's' : ''} restocking
                </p>
              </div>
            </div>
            {onRefresh && (
              <Button variant="ghost" size="icon" onClick={onRefresh} className="h-8 w-8">
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-80">
          {sortedLowStockProducts.map(product => (
            <DropdownMenuItem 
              key={product.id} 
              className="p-3 focus:bg-muted/50 cursor-pointer"
              onSelect={(e) => {
                e.preventDefault();
                if (onViewProduct) {
                  onViewProduct(product);
                  setOpen(false);
                }
              }}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-amber-100">
                    <Package className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{product.name}</h4>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={`font-medium text-xs ${getStockLevelColor(product.stock)}`}
                  >
                    {getStockLevelText(product.stock)}
                  </Badge>
                  <div className="text-right text-xs font-semibold">
                    {product.stock} left
                  </div>
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </ScrollArea>
        
        <DropdownMenuSeparator />
        <div className="p-2">
          <p className="text-xs text-muted-foreground flex items-center">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Products with stock levels at or below {lowStockThreshold} units
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};