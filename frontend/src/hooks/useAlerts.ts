
import { useState, useEffect } from 'react';
import { Product } from '@/types/pos';
import { toast } from 'sonner';

interface AlertSettings {
  lowStockThreshold: number;
  enableLowStockAlerts: boolean;
}

export const useAlerts = (products: Product[], userRole: string) => {
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    lowStockThreshold: 10,
    enableLowStockAlerts: true
  });

  useEffect(() => {
    const saved = localStorage.getItem('alertSettings');
    if (saved) {
      setAlertSettings(JSON.parse(saved));
    }
  }, []);

  const saveAlertSettings = (settings: AlertSettings) => {
    setAlertSettings(settings);
    localStorage.setItem('alertSettings', JSON.stringify(settings));
  };

  const checkLowStock = () => {
    if (!alertSettings.enableLowStockAlerts || userRole !== 'Admin') return;

    const lowStockProducts = products.filter(
      product => product.stock <= alertSettings.lowStockThreshold && product.stock > 0
    );

    const outOfStockProducts = products.filter(product => product.stock === 0);

    if (lowStockProducts.length > 0) {
      toast.warning(`${lowStockProducts.length} products are running low on stock`, {
        description: lowStockProducts.slice(0, 3).map(p => p.name).join(', ') + 
                    (lowStockProducts.length > 3 ? '...' : ''),
        duration: 6000
      });
    }

    if (outOfStockProducts.length > 0) {
      toast.error(`${outOfStockProducts.length} products are out of stock`, {
        description: outOfStockProducts.slice(0, 3).map(p => p.name).join(', ') + 
                    (outOfStockProducts.length > 3 ? '...' : ''),
        duration: 8000
      });
    }
  };

  return {
    alertSettings,
    saveAlertSettings,
    checkLowStock
  };
};
