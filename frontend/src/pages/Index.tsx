import React, { useEffect, useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { useAppStore } from '@/stores/appStore';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom'; // ADDED: Import useNavigate

const Index = () => {
  const { 
    user, 
    isAuthenticated, 
    activeShift, 
    refreshData, 
    logout: storeLogout 
  } = useAppStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate(); // ADDED: Get navigate function

  useEffect(() => {
    if (isAuthenticated && user) {
      refreshData();
    }
  }, [isAuthenticated, user, refreshData]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    try {
      const canLogout = await storeLogout();
      
      if (!canLogout) {
        toast.error('Cannot logout with an active shift', {
          description: 'Please end your current shift before logging out.',
          duration: 5000
        });
        return;
      }
      
      toast.success('Logged out successfully');
      // ADDED: Optional - navigate to login page after logout
      navigate('/');
    } catch (error) {
      toast.error('Logout failed');
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <LoginForm />
      </div>
    );
  }

  return (
    <Dashboard 
      user={user} 
      onLogout={handleLogout}
      isLoggingOut={isLoggingOut}
    />
  );
};

export default Index;