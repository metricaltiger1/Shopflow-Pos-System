import React, { useState, useMemo } from 'react';
import { User } from '@/types/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Calendar, Download, DollarSign, ShoppingBag, Users, FileText, Package, CreditCard, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/services/apiService';
import { useQuery } from '@tanstack/react-query';
import { 
  SalesReportResponse, 
  OrderResponse, 
  TopProductResponse, 
  StaffPerformanceResponse,
  PaymentMethodSummary,
  CategorySales
} from '@/types/api';

type ReportPeriod = 'all' | 'today' | 'yesterday' | 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'custom';

interface ReportsProps {
  user: User;
}

export const Reports: React.FC<ReportsProps> = ({ user }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('today');
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Map UI period values to API expected values
  const getApiFilters = (period: ReportPeriod) => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // This week: Sunday to today
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    // Last week: Previous Sunday to Saturday
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
    const endOfLastWeek = new Date(startOfLastWeek);
    endOfLastWeek.setDate(endOfLastWeek.getDate() + 6);
    endOfLastWeek.setHours(23, 59, 59, 999);
    
    // This month: 1st to today
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Last month: 1st to last day of previous month
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    endOfLastMonth.setHours(23, 59, 59, 999);

    switch (period) {
      case 'today':
        return {
          period: 'custom' as const,
          startDate: today.toISOString(),
          endDate: now.toISOString()
        };
      case 'yesterday':
        return {
          period: 'custom' as const,
          startDate: yesterday.toISOString(),
          endDate: new Date(yesterday.getTime() + 86400000 - 1).toISOString() // End of yesterday
        };
      case 'this-week':
        return {
          period: 'custom' as const,
          startDate: startOfWeek.toISOString(),
          endDate: now.toISOString()
        };
      case 'last-week':
        return {
          period: 'custom' as const,
          startDate: startOfLastWeek.toISOString(),
          endDate: endOfLastWeek.toISOString()
        };
      case 'this-month':
        return {
          period: 'custom' as const,
          startDate: startOfMonth.toISOString(),
          endDate: now.toISOString()
        };
      case 'last-month':
        return {
          period: 'custom' as const,
          startDate: startOfLastMonth.toISOString(),
          endDate: endOfLastMonth.toISOString()
        };
      case 'custom':
        // For custom, we'll need to add date pickers - for now return empty to show all
        return {};
      default:
        // 'all' - return empty object to get all data
        return {};
    }
  };

  // Fetch sales report data from backend
  const { data: reportData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['salesReport', selectedPeriod, selectedStaff, refreshTrigger],
    queryFn: () => {
      const filters: any = {
        ...getApiFilters(selectedPeriod),
      };
      
      // Only add userId filter if a specific staff is selected and it's not 'all'
      if (selectedStaff !== 'all') {
        filters.userId = selectedStaff;
      }
      
      return apiService.getSalesReport(filters);
    },
  });

  // Fetch users for staff filter (admin only)
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiService.getUsers(),
    enabled: user.role === 'Admin',
  });

  // Safely extract data from reportData with fallbacks
  const summary = reportData?.summary || {
    totalOrders: 0,
    totalRevenue: 0,
    averageOrder: 0,
    totalTax: 0
  };
  
  const orders: OrderResponse[] = reportData?.orders || [];
  const topProducts: TopProductResponse[] = reportData?.topProducts || [];
  const staffPerformance: StaffPerformanceResponse[] = reportData?.staffPerformance || [];
  const paymentMethods: PaymentMethodSummary[] = reportData?.paymentMethods || [];
  const categorySales: CategorySales[] = reportData?.categorySales || [];

  // Filter staff performance data based on selected staff
  const filteredStaffPerformance = useMemo(() => {
    if (selectedStaff === 'all') {
      return staffPerformance;
    }
    
    // Find the selected staff member in the performance data
    return staffPerformance.filter(staff => staff.id === selectedStaff);
  }, [staffPerformance, selectedStaff]);

  const { totalOrders, totalRevenue, averageOrder, totalTax } = summary;

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    toast.success('Report data refreshed');
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const filters: any = {
        ...getApiFilters(selectedPeriod),
      };
      
      if (selectedStaff !== 'all') {
        filters.userId = selectedStaff;
      }

      if (format === 'pdf') {
        await apiService.downloadSalesReport(filters);
        toast.success('PDF report generated successfully');
      } else {
        // CSV export logic
        const csvData = [
          ['Order ID', 'Date', 'Time', 'Cashier', 'Items', 'Subtotal', 'Tax', 'Total', 'Payment Method'],
          ...orders.map((order: OrderResponse) => [
            order.id,
            new Date(order.timestamp).toLocaleDateString(),
            new Date(order.timestamp).toLocaleTimeString(),
            order.cashierName || 'Unknown',
            order.items?.map((item) => `${item.productName || 'Unknown'} x${item.quantity}`).join('; ') || '',
            order.subtotal.toFixed(2),
            order.tax.toFixed(2),
            order.total.toFixed(2),
            order.paymentMethod
          ])
        ];
        
        const csvContent = csvData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast.success('CSV report exported successfully');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to export report');
    }
  };

  // Handle staff filter change
  const handleStaffChange = (value: string) => {
    setSelectedStaff(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sales report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Sales Reports</h1>
          <p className="text-gray-600 text-sm md:text-base">Analyze your business performance and trends</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          className="flex items-center gap-2"
          disabled={isRefetching}
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center text-lg md:text-xl">
            <BarChart3 className="h-5 w-5 mr-2" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 min-w-48">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Time Period</label>
              <Select value={selectedPeriod} onValueChange={(value: ReportPeriod) => setSelectedPeriod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="this-week">This Week</SelectItem>
                  <SelectItem value="last-week">Last Week</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {user.role === 'Admin' && (
              <div className="flex-1 min-w-48">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Staff Member</label>
                <Select value={selectedStaff} onValueChange={handleStaffChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    {users?.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                onClick={() => handleExport('csv')}
                className="flex items-center text-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="default"
                onClick={() => handleExport('pdf')}
                className="flex items-center text-sm bg-blue-600 hover:bg-blue-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate PDF Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-green-600">
              KES {totalRevenue.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">{totalOrders} orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-blue-600">
              {totalOrders}
            </div>
            <p className="text-xs text-gray-500 mt-1">Transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Avg Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-purple-600">
              KES {averageOrder.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">Per transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <CreditCard className="h-4 w-4 mr-2" />
              Total Tax
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-orange-600">
              KES {totalTax.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">Collected</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Top Selling Products
            </CardTitle>
            <CardDescription>Best performing products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No product data available</p>
            ) : (
              <div className="space-y-3">
                {topProducts.slice(0, 5).map((product, index) => (
                  <div key={product.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Badge variant="secondary" className="mr-3">
                        #{index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium text-gray-900 text-sm md:text-base">{product.name}</p>
                        <p className="text-xs text-gray-600">{product.sales} units sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        KES {product.revenue?.toLocaleString('en-KE') || '0'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Staff Performance */}
        {user.role === 'Admin' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Staff Performance
              </CardTitle>
              <CardDescription>
                {selectedStaff === 'all' 
                  ? 'Sales by staff member' 
                  : `Performance for selected staff`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredStaffPerformance.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No staff data available</p>
              ) : (
                <div className="space-y-3">
                  {filteredStaffPerformance.map((staff, index) => (
                    <div key={staff.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Badge variant="secondary" className="mr-3">
                          #{index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium text-gray-900 text-sm md:text-base">{staff.name}</p>
                          <p className="text-xs text-gray-600">{staff.sales} orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-blue-600">
                          KES {staff.revenue?.toLocaleString('en-KE') || '0'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Additional Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Payment Methods</CardTitle>
            <CardDescription>Distribution by payment type</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentMethods.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No payment data available</p>
            ) : (
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div key={method.method} className="flex justify-between items-center p-2">
                    <span className="text-sm font-medium capitalize">{method.method.toLowerCase()}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{method.count} orders</span>
                      <span className="font-semibold text-green-600">
                        KES {method.amount?.toLocaleString('en-KE') || '0'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Sales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Sales by Category</CardTitle>
            <CardDescription>Revenue across product categories</CardDescription>
          </CardHeader>
          <CardContent>
            {categorySales.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No category data available</p>
            ) : (
              <div className="space-y-3">
                {categorySales.map((category) => (
                  <div key={category.name} className="flex justify-between items-center p-2">
                    <span className="text-sm font-medium">{category.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{category.itemsSold} items</span>
                      <span className="font-semibold text-blue-600">
                        KES {category.revenue?.toLocaleString('en-KE') || '0'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Recent Transactions</CardTitle>
          <CardDescription>Latest orders from the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No orders found for the selected period</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Order ID</th>
                    <th className="text-left py-2">Date & Time</th>
                    <th className="text-left py-2">Cashier</th>
                    <th className="text-right py-2">Amount</th>
                    <th className="text-left py-2">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 10).map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 font-mono text-xs">{order.id.slice(-8)}</td>
                      <td className="py-2">
                        {new Date(order.timestamp).toLocaleDateString()} {' '}
                        {new Date(order.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2">{order.cashierName || 'Unknown'}</td>
                      <td className="py-2 text-right font-medium">
                        KES {order.total?.toLocaleString('en-KE') || '0'}
                      </td>
                      <td className="py-2 capitalize">{order.paymentMethod?.toLowerCase()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};