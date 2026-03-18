import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingBag, Utensils, ChefHat, Coffee } from 'lucide-react';
import { LoginResponse } from '@/types/api';
import { toast } from 'sonner';
import { apiService } from '@/services/apiService';
import { useAppStore } from '@/stores/appStore';

export const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await apiService.login({ username, password }) as LoginResponse;
      
      // Store token
      localStorage.setItem('authToken', response.token);
      
      // Update app store
      setUser(response.user);
      
      toast.success(`Welcome, ${response.user.fullName}!`);
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden login-container">
      {/* Background with food theme */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-amber-500/20"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-30"></div>
        
        {/* Animated food icons floating around */}
        <div className="absolute top-1/4 left-1/4 floating-icon">
          <Utensils className="h-8 w-8 text-amber-600" />
        </div>
        <div className="absolute top-1/3 right-1/4 floating-icon animation-delay-1000">
          <ChefHat className="h-8 w-8 text-orange-600" />
        </div>
        <div className="absolute bottom-1/4 left-1/3 floating-icon animation-delay-2000">
          <Coffee className="h-8 w-8 text-amber-800" />
        </div>
        <div className="absolute bottom-1/3 right-1/3 floating-icon animation-delay-1500">
          <ShoppingBag className="h-8 w-8 text-orange-700" />
        </div>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-md z-10 transform transition-all duration-500 hover:shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
            <ShoppingBag className="h-10 w-10 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              MAMA LIAM FRIES
            </CardTitle>
            <CardDescription className="text-gray-600 mt-3 text-lg">
              Delicious meals, seamless service
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-3">
              <Label htmlFor="username" className="text-gray-700 font-medium">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="h-12 border-gray-300 focus:border-orange-400 focus:ring-orange-400 transition-colors"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="h-12 border-gray-300 focus:border-orange-400 focus:ring-orange-400 transition-colors"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-lg transition-all duration-300 transform hover:scale-[1.02] shadow-md"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            Forgot your password? <a href="#" className="text-orange-500 hover:text-orange-600 font-medium transition-colors">Reset here</a>
          </div>
        </CardContent>
      </Card>

      {/* Add custom styles for animation in your global CSS */}
      <style>{`
        @keyframes float {
          0% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(5deg);
          }
          100% {
            transform: translateY(0) rotate(0deg);
          }
        }
        .floating-icon {
          animation: float 4s ease-in-out infinite;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-1500 {
          animation-delay: 1.5s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
};