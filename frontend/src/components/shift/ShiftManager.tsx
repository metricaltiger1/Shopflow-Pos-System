import React, { useState, useEffect } from 'react';
import { User } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Square, Calendar, DollarSign, ShoppingBag, History, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/services/apiService';
import { useAppStore } from '@/stores/appStore';

interface ShiftManagerProps {
  user: User;
  onShiftUpdate?: (shift: any) => void;
}

export const ShiftManager: React.FC<ShiftManagerProps> = ({ user, onShiftUpdate }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [shiftHistory, setShiftHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [shiftDuration, setShiftDuration] = useState('00:00:00');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { setActiveShift, settings, refreshData } = useAppStore();

  // Get the active shift from history (this will always be in sync)
  const activeShift = shiftHistory.find(shift => shift.status === 'ACTIVE');

  // Update current time every second for the timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate shift duration in real-time
  useEffect(() => {
    if (!activeShift) return;

    const updateShiftDuration = () => {
      const startTime = new Date(activeShift.startTime);
      const now = new Date();
      const diff = now.getTime() - startTime.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setShiftDuration(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    const timer = setInterval(updateShiftDuration, 1000);
    updateShiftDuration(); // Initial call
    
    return () => clearInterval(timer);
  }, [activeShift]);

  // Load shift history when component mounts
  useEffect(() => {
    loadShiftHistory();
  }, [user.id]);

  // Function to manually refresh all data
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadShiftHistory();
      toast.success('Data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadShiftHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const history = await apiService.getShiftHistory(user.id);
      setShiftHistory(history || []);
      
      // Also update the store with the active shift if it exists
      const active = history.find(shift => shift.status === 'active');
      if (active) {
        setActiveShift(active);
      }
    } catch (error) {
      toast.error('Failed to load shift history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const startShift = async () => {
    if (isStarting) return;
    
    setIsStarting(true);
    try {
      const newShift = await apiService.startShift(user.id);
      // Refresh history to include the new shift
      await loadShiftHistory();
      onShiftUpdate?.(newShift);
      toast.success('Shift started successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to start shift');
    } finally {
      setIsStarting(false);
    }
  };

  const endShift = async () => {
    if (!activeShift || isEnding) return;
    
    setIsEnding(true);
    try {
      const endedShift = await apiService.endShift(activeShift.id);
      // Refresh history to include the ended shift
      await loadShiftHistory();
      onShiftUpdate?.(null);
      toast.success(`Shift ended! Total sales: ${settings?.currency || 'KES'} ${endedShift.totalSales?.toFixed(2) || '0.00'}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to end shift');
    } finally {
      setIsEnding(false);
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-KE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-KE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatShortDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-KE', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const calculateShiftDuration = (start: Date, end?: Date) => {
    const endTime = end || currentTime;
    const duration = Math.floor((endTime.getTime() - start.getTime()) / (1000 * 60)); // minutes
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Shift Management</h1>
            <p className="text-gray-600 text-sm md:text-base">Track your work hours and shift performance</p>
          </div>
          <Button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-4 md:pb-6">
        {/* Active Shift Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="flex items-center text-lg md:text-xl">
                <Clock className="h-5 w-5 mr-2" />
                Current Shift
              </span>
              {activeShift && (
                <Badge className="bg-green-100 text-green-800 w-fit">
                  Active
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-sm md:text-base">
              {activeShift ? 'Your current shift is in progress' : 'No active shift'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeShift ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Calendar className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-900">Started</span>
                    </div>
                    <p className="text-xs md:text-sm text-blue-700">{formatDate(new Date(activeShift.startTime))}</p>
                    <p className="font-semibold text-blue-900">{formatTime(new Date(activeShift.startTime))}</p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <DollarSign className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-green-900">Sales</span>
                    </div>
                    <p className="text-lg font-bold text-green-900">
                      {settings?.currency || 'KES'} {(activeShift.totalSales || 0).toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <ShoppingBag className="h-4 w-4 text-purple-600 mr-2" />
                      <span className="text-sm font-medium text-purple-900">Orders</span>
                    </div>
                    <p className="text-lg font-bold text-purple-900">{activeShift.ordersCount || 0}</p>
                  </div>

                  <div className="bg-amber-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Clock className="h-4 w-4 text-amber-600 mr-2" />
                      <span className="text-sm font-medium text-amber-900">Duration</span>
                    </div>
                    <p className="text-lg font-bold text-amber-900">{shiftDuration}</p>
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={endShift}
                    disabled={isEnding}
                    className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    {isEnding ? 'Ending...' : 'End Shift'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4 text-sm md:text-base">No active shift. Start your shift to begin tracking.</p>
                <Button
                  onClick={startShift}
                  disabled={isStarting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isStarting ? 'Starting...' : 'Start Shift'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shift History Section - Only shows if there are previous shifts */}
        {shiftHistory.filter(shift => shift.status !== 'ACTIVE').length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg md:text-xl">
                <History className="h-5 w-5 mr-2" />
                Shift History
              </CardTitle>
              <CardDescription className="text-sm md:text-base">
                Your previous shifts and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {shiftHistory
                    .filter(shift => shift.status !== 'ACTIVE') // Exclude active shift from history
                    .map((shift) => (
                    <div key={shift.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center">
                          <Badge variant="outline" className="mr-3">
                            {formatShortDate(new Date(shift.startTime))}
                          </Badge>
                          <div>
                            <span className="font-medium">{formatTime(new Date(shift.startTime))}</span>
                            {shift.endTime && (
                              <>
                                <span className="mx-2 text-gray-400">-</span>
                                <span className="font-medium">{formatTime(new Date(shift.endTime))}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Duration</p>
                            <p className="font-medium">
                              {calculateShiftDuration(
                                new Date(shift.startTime),
                                shift.endTime ? new Date(shift.endTime) : undefined
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Sales</p>
                            <p className="font-medium text-green-600">
                              {settings?.currency || 'KES'} {(shift.totalSales || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <ShoppingBag className="h-4 w-4 mr-1" />
                          <span>{shift.ordersCount || 0} orders</span>
                        </div>
                        <Badge variant="default">
                          Completed
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};