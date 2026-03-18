import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  LayoutDashboard, 
  BarChart3, 
  Clock, 
  Settings, 
  LogOut,
  ChefHat,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { LowStockNotification } from './LowStockNotification';
import { Product } from '@/types/pos';
import { CustomAvatar } from './CustomAvatar';

interface HeaderProps {
  activeView: string;
  onViewChange: (view: 'pos' | 'admin' | 'reports' | 'shifts') => void;
  onLogout: () => void;
  isLoggingOut?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onViewChange,
  onLogout,
  isLoggingOut = false
}) => {
  const { user, activeShift, refreshData } = useAppStore();
  
  // Safety check - if no user, return null or loading state
  if (!user) {
    return null;
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const navItems = [
    { id: 'pos', label: 'POS', icon: LayoutDashboard, show: true },
    { id: 'admin', label: 'Admin', icon: Settings, show: user.role === 'Admin' },
    { id: 'reports', label: 'Reports', icon: BarChart3, show: true },
    { id: 'shifts', label: 'Shifts', icon: Clock, show: true },
  ];

  const handleRefreshLowStock = async () => {
    try {
      await refreshData();
      // Optional: Show success message
    } catch (error) {
      console.error('Failed to refresh products:', error);
    }
  };

  const handleViewProduct = (product: Product) => {
    // Switch to admin view and potentially focus on the product
    if (activeView !== 'admin') {
      onViewChange('admin');
    }
    // You could emit an event or use a state management solution
    // to highlight the specific product in the admin view
    console.log('View product in admin:', product);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg">
      <div className="flex items-center justify-between px-4 md:px-6 h-16">
        {/* Logo and Navigation */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <ChefHat className="h-7 w-7 text-white" />
            <span className="text-lg md:text-xl font-bold text-white">MAMA LIAM FRIES</span>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navItems.filter(item => item.show).map(item => (
              <Button
                key={item.id}
                variant={activeView === item.id ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onViewChange(item.id as any)}
                className={`flex items-center space-x-2 ${
                  activeView === item.id 
                    ? 'bg-white text-orange-600 hover:bg-white/90' 
                    : 'text-white hover:bg-white/20 hover:text-white'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Button>
            ))}
          </nav>
        </div>

        {/* User Menu and Shift Status */}
        <div className="flex items-center space-x-2">
          {/* Shift Status */}
          {activeShift && activeShift.status === 'ACTIVE' && (
            <Badge className="bg-white text-orange-600 hidden sm:flex border-0">
              <Clock className="h-3 w-3 mr-1" />
              Shift Active
            </Badge>
          )}

          {/* Low Stock Notification */}
          <LowStockNotification 
            onViewProduct={handleViewProduct}
            onRefresh={handleRefreshLowStock}
          />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 bg-white/20 hover:bg-white/30">
                <CustomAvatar
                  src={user.profileImage}
                  alt={user.fullName}
                  fallback={getInitials(user.fullName)}
                  className="h-10 w-10"
                />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center gap-2 p-2">
                <CustomAvatar
                  src={user.profileImage}
                  alt={user.fullName}
                  fallback={getInitials(user.fullName)}
                  className="h-10 w-10"
                />
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{user.fullName}</p>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                  <Badge variant="outline" className="w-fit text-xs bg-orange-100 text-orange-800 border-orange-200">
                    {user.role}
                  </Badge>
                </div>
              </div>
              <DropdownMenuSeparator />
              
              {/* Mobile Navigation */}
              <div className="md:hidden">
                {navItems.filter(item => item.show).map(item => (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={() => onViewChange(item.id as any)}
                    className={`flex items-center ${activeView === item.id ? "bg-orange-100 text-orange-800" : ""}`}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </div>

              <DropdownMenuItem 
                onClick={onLogout} 
                disabled={isLoggingOut}
                className="text-red-600 focus:text-red-700"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  ); 
};