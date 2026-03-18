import React, { useState, useEffect } from 'react';
import { User } from '@/types/auth';
import { Header } from './Header';
import { POSInterface } from '../pos/POSInterface';
import { AdminPanel } from '../admin/AdminPanel';
import { Reports } from '../reports/Reports';
import { ShiftManager } from '../shift/ShiftManager';
import { useAppStore } from '@/stores/appStore';
import { CartItem } from '@/types/pos';
import { apiService } from '@/services/apiService';
import { Button } from '@/components/ui/button';
import { DayPickerProvider } from 'react-day-picker';
import { ChefHat, Utensils, Coffee, ShoppingBag } from 'lucide-react';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  isLoggingOut?: boolean;
}

type ActiveView = 'pos' | 'admin' | 'reports' | 'shifts';

// Default DayPicker props configuration
import { DayPickerProps } from 'react-day-picker';

const dayPickerInitialProps: DayPickerProps = {
  mode: 'single',
  defaultMonth: new Date(),
  styles: {
    root: {
      margin: 0
    }
  },
  modifiersClassNames: {},
  modifiersStyles: {}
};

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, isLoggingOut = false }) => {
  const [activeView, setActiveView] = useState<ActiveView>('pos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const { 
    activeShift, 
    setActiveShift, 
    products, 
    setProducts, 
    isLoading,
    setLoading,
    refreshData
  } = useAppStore();
  const [hasData, setHasData] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      if (products.length === 0) {
        setLoading(true);
        try {
          const [loadedProducts] = await Promise.all([
            apiService.getProducts(),
            refreshData() // Refresh all authenticated data
          ]);
          setProducts(loadedProducts);
          setHasData(true);
          setLoadError(null);
        } catch (error: any) {
          setHasData(false);
          setLoadError(error.message || 'Failed to load data');
        } finally {
          setLoading(false);
        }
      }
    };

    loadInitialData();
  }, [setProducts, products.length, setLoading, refreshData]);

  const handleShiftUpdate = (shift: any) => {
    setActiveShift(shift);
  };

  const renderContent = () => {
    if (isLoading && products.length === 0) {
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
            <div className="absolute bottom-1/3 right-1/3">
              <ShoppingBag className="h-16 w-16 text-orange-700" />
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

    if (loadError) {
      return (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md w-full">
            <div className="text-red-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load menu</h3>
            <p className="text-gray-600 mb-4">{loadError}</p>
            <Button 
              onClick={async () => {
                setLoading(true);
                setLoadError(null);
                try {
                  const loadedProducts = await apiService.getProducts();
                  setProducts(loadedProducts);
                  await refreshData();
                } catch (error: any) {
                  setLoadError(error.message || 'Failed to load products');
                } finally {
                  setLoading(false);
                }
              }}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    switch (activeView) {
      case 'pos':
        return <POSInterface user={user} cart={cart} setCart={setCart} />;
      case 'admin':
        return user.role === 'Admin' ? (
          <AdminPanel />
        ) : (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md w-full">
              <div className="text-orange-500 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
              <p className="text-gray-600">Admin privileges required for this section</p>
            </div>
          </div>
        );
      case 'reports':
        return (
         <DayPickerProvider initialProps={dayPickerInitialProps}>
            <Reports user={user} />
        </DayPickerProvider>
        );
      case 'shifts':
        return <ShiftManager user={user} onShiftUpdate={handleShiftUpdate} />;
      default:
        return <POSInterface user={user} cart={cart} setCart={setCart} />;
    }
  };

  // Check if current view is POS to apply special styling
  const isPosView = activeView === 'pos';

  return (
    <div className={`min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 ${isPosView ? 'h-screen overflow-hidden' : ''}`}>
      <Header 
        activeView={activeView}
        onViewChange={setActiveView}
        onLogout={onLogout}
        isLoggingOut={isLoggingOut}
      />
      <main className="pt-12">
        <div className={`w-full px-4 md:px-8 py-6 ${isPosView ? 'h-[calc(100vh-4rem)]' : ''}`}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};