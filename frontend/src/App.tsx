import React, { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom"; // CHANGED: BrowserRouter → HashRouter
import { useAppStore } from '@/stores/appStore';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { ChefHat, Utensils, Coffee, ShoppingBag } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 5 * 60 * 1000, // 5 minutes
      staleTime: 2 * 60 * 1000, // 2 minutes
    },
  },
});

const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { initializeApp, isInitialized, isLoading } = useAppStore();

  useEffect(() => {
    if (!isInitialized) {
      initializeApp();
    }
  }, [initializeApp, isInitialized]);

  if (isLoading && !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50">
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
          <div className="mx-auto mb-6 w-24 h-24 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
            <ShoppingBag className="h-12 w-12 text-white" />
          </div>
          
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">
            MAMA LIAM FRIES
          </h2>
          <p className="text-gray-600 text-lg">Preparing your delicious experience...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter> {/* CHANGED: BrowserRouter → HashRouter */}
        <AppInitializer>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppInitializer>
      </HashRouter> {/* CHANGED: BrowserRouter → HashRouter */}
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;