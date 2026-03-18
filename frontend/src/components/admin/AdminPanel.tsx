import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserManagement } from './UserManagement';
import { ProductManagement } from './ProductManagement';
import { 
  Users, 
  Package, 
  Settings, 
  Bell,
  Store,
  Calculator
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/apiService';
import { useAppStore } from '@/stores/appStore';
import { Skeleton } from '@/components/ui/skeleton'; // Add skeleton component

// Use the same interface as the app store
interface ShopSettings {
  id?: string;
  shopName: string;
  address: string;
  phone: string;
  email: string;
  vatRate: number;
  vatInclusive: boolean;
  currency: string;
  logo?: string;
  enableLowStockAlerts: boolean;
  lowStockThreshold: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');
  const queryClient = useQueryClient();
  const { settings, setSettings } = useAppStore();
  
  // Fetch shop settings from API - remove isLoading and use isFetching for background updates
  const { data: shopSettings, isFetching } = useQuery({
    queryKey: ['shopSettings'],
    queryFn: () => apiService.getSettings(),
    // Keep stale data while fetching in background
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Initialize local state with proper structure
  const [localShopSettings, setLocalShopSettings] = useState<ShopSettings>({
    shopName: '',
    address: '',
    phone: '',
    email: '',
    vatRate: 16.0,
    vatInclusive: false,
    currency: 'KES',
    enableLowStockAlerts: true,
    lowStockThreshold: 5
  });

  // Update local state when API data loads or Zustand store changes
  useEffect(() => {
    const currentSettings = shopSettings || settings;
    if (currentSettings) {
      setLocalShopSettings({
        shopName: currentSettings.shopName || '',
        address: currentSettings.address || '',
        phone: currentSettings.phone || '',
        email: currentSettings.email || '',
        vatRate: currentSettings.vatRate || 16.0,
        vatInclusive: currentSettings.vatInclusive || false,
        currency: currentSettings.currency || 'KES',
        logo: currentSettings.logo,
        enableLowStockAlerts: currentSettings.enableLowStockAlerts !== undefined ? currentSettings.enableLowStockAlerts : true,
        lowStockThreshold: currentSettings.lowStockThreshold || 5
      });
    }
  }, [shopSettings, settings]);

  // Mutation for updating shop settings
  const updateSettingsMutation = useMutation({
    mutationFn: (settings: Partial<ShopSettings>) => apiService.updateSettings(settings),
    onSuccess: (updatedSettings) => {
      toast.success('Settings updated successfully');
      // Update both the query cache and Zustand store
      queryClient.setQueryData(['shopSettings'], updatedSettings);
      setSettings(updatedSettings as any);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    }
  });

  const saveShopSettings = () => {
    updateSettingsMutation.mutate(localShopSettings);
  };

  const saveAlertSettings = () => {
    updateSettingsMutation.mutate({
      enableLowStockAlerts: localShopSettings.enableLowStockAlerts,
      lowStockThreshold: localShopSettings.lowStockThreshold
    });
  };

  // Show skeleton loading instead of a blank loading message
  const renderSkeletonLoader = () => (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>
      
      <div className="mb-6">
        <Skeleton className="h-10 w-full" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
            <Skeleton className="h-10 w-full mt-4" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
            <Skeleton className="h-10 w-full mt-4" />
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Show loading indicator in the background without blocking UI */}
      {isFetching && (
        <div className="fixed top-4 right-4 bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm z-50">
          Updating settings...
        </div>
      )}
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
        <p className="text-gray-600">Manage users, products, and system settings</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center">
            <Package className="h-4 w-4 mr-2" />
            Products
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <ProductManagement />
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Alert Settings
              </CardTitle>
              <CardDescription>Configure inventory alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableAlerts" className="text-base font-medium">
                    Enable Low Stock Alerts
                  </Label>
                  <p className="text-sm text-gray-600">
                    Receive notifications when products are running low
                  </p>
                </div>
                <Switch
                  id="enableAlerts"
                  checked={localShopSettings.enableLowStockAlerts}
                  onCheckedChange={(checked) => 
                    setLocalShopSettings({...localShopSettings, enableLowStockAlerts: checked})
                  }
                />
              </div>
              
              <div>
                <Label htmlFor="threshold">Low Stock Threshold</Label>
                <div className="mt-2">
                  <Input
                    id="threshold"
                    type="number"
                    value={localShopSettings.lowStockThreshold}
                    onChange={(e) => 
                      setLocalShopSettings({...localShopSettings, lowStockThreshold: parseInt(e.target.value) || 0})
                    }
                    className="w-24"
                    min="1"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Alert when stock falls below this number
                  </p>
                </div>
              </div>

              <Button 
                onClick={saveAlertSettings}
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? 'Saving...' : 'Save Alert Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Store className="h-5 w-5 mr-2" />
                  Shop Information
                </CardTitle>
                <CardDescription>Basic shop details and configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="shopName">Shop Name</Label>
                  <Input
                    id="shopName"
                    value={localShopSettings.shopName}
                    onChange={(e) => setLocalShopSettings({...localShopSettings, shopName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={localShopSettings.address}
                    onChange={(e) => setLocalShopSettings({...localShopSettings, address: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={localShopSettings.phone}
                    onChange={(e) => setLocalShopSettings({...localShopSettings, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={localShopSettings.email}
                    onChange={(e) => setLocalShopSettings({...localShopSettings, email: e.target.value})}
                  />
                </div>
                <Button 
                  onClick={saveShopSettings} 
                  className="w-full"
                  disabled={updateSettingsMutation.isPending}
                >
                  {updateSettingsMutation.isPending ? 'Saving...' : 'Save Shop Info'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Tax Settings
                </CardTitle>
                <CardDescription>Configure tax rates and calculations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="vatRate">VAT Rate (%)</Label>
                  <Input
                    id="vatRate"
                    type="number"
                    step="0.01"
                    value={localShopSettings.vatRate}
                    onChange={(e) => setLocalShopSettings({...localShopSettings, vatRate: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="vatInclusive">VAT Inclusive Pricing</Label>
                    <p className="text-sm text-gray-600">
                      Prices include VAT in calculations
                    </p>
                  </div>
                  <Switch
                    id="vatInclusive"
                    checked={localShopSettings.vatInclusive}
                    onCheckedChange={(checked) => 
                      setLocalShopSettings({...localShopSettings, vatInclusive: checked})
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={localShopSettings.currency}
                    onChange={(e) => setLocalShopSettings({...localShopSettings, currency: e.target.value})}
                    placeholder="KES"
                  />
                </div>
                <Button 
                  onClick={saveShopSettings} 
                  className="w-full"
                  disabled={updateSettingsMutation.isPending}
                >
                  {updateSettingsMutation.isPending ? 'Saving...' : 'Save Tax Settings'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};