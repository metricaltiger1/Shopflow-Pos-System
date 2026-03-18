import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/auth';
import { Product } from '@/types/pos';
import { apiService } from '@/services/apiService';

// Update the AppSettings interface to include the new fields
export interface AppSettings {
  id: string;
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
  createdAt: Date;
  updatedAt: Date;
}

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  
  // Data
  products: Product[];
  users: User[];
  settings: AppSettings | null;
  activeShift: any | null;
  
  // Loading states
  isLoading: boolean;
  isInitialized: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setProducts: (products: Product[]) => void;
  setUsers: (users: User[]) => void;
  setSettings: (settings: AppSettings) => void;
  setActiveShift: (shift: any) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  
  // Data fetching
  initializeApp: () => Promise<void>;
  refreshData: () => Promise<void>;
  logout: () => Promise<boolean>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      products: [],
      users: [],
      settings: null,
      activeShift: null,
      isLoading: false,
      isInitialized: false,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setProducts: (products) => set({ products }),
      setUsers: (users) => set({ users }),
      setSettings: (settings) => set({ settings }),
      setActiveShift: (activeShift) => set({ activeShift }),
      setLoading: (isLoading) => set({ isLoading }),
      setInitialized: (isInitialized) => set({ isInitialized }),

      // Initialize app data
      initializeApp: async () => {
        const { setLoading, setInitialized } = get();
        try {
          setLoading(true);
          
          // Fetch all initial data in parallel
          const [settingsData, productsData] = await Promise.allSettled([
            apiService.getSettings().catch(() => null),
            apiService.getProducts().catch(() => [])
          ]);

          if (settingsData.status === 'fulfilled' && settingsData.value) {
            // Ensure all required fields exist with defaults
            const completeSettings: AppSettings = {
              id: settingsData.value.id || '1',
              shopName: settingsData.value.shopName || 'MAMA LIAM FRIES',
              address: settingsData.value.address || 'P.O.BOX 20, KENDU BAY',
              phone: settingsData.value.phone || '+254 720 172 292',
              email: settingsData.value.email || 'ojolo@gmail.com',
              vatRate: settingsData.value.vatRate || 0,
              vatInclusive: settingsData.value.vatInclusive || false,
              currency: settingsData.value.currency || 'KES',
              logo: settingsData.value.logo,
              enableLowStockAlerts: settingsData.value.enableLowStockAlerts !== undefined ? settingsData.value.enableLowStockAlerts : true,
              lowStockThreshold: settingsData.value.lowStockThreshold || 5,
              createdAt: settingsData.value.createdAt ? new Date(settingsData.value.createdAt) : new Date(),
              updatedAt: settingsData.value.updatedAt ? new Date(settingsData.value.updatedAt) : new Date()
            };
            set({ settings: completeSettings });
          } else {
            // Set default settings if none exist
            const currentDate = new Date();
            const defaultSettings: AppSettings = {
              id: '1',
              shopName: 'MAMA LIAM FRIES',
              address: 'P.O.BOX 20, KENDU BAY',
              phone: '+254 720 172 292',
              email: 'ojolo@gmail.com',
              vatRate: 0,
              vatInclusive: false,
              currency: 'KES',
              enableLowStockAlerts: true,
              lowStockThreshold: 5,
              createdAt: currentDate,
              updatedAt: currentDate
            };
            set({ settings: defaultSettings });
          }

          if (productsData.status === 'fulfilled') {
            set({ products: productsData.value });
          }

          setInitialized(true);
        } catch (error) {
          console.error('Failed to initialize app:', error);
          setInitialized(true); // Set initialized even on error
        } finally {
          setLoading(false);
        }
      },

      // Refresh authenticated data
      refreshData: async () => {
        const { user, setLoading } = get();
        if (!user) return;

        try {
          setLoading(true);
          
          const [usersData, activeShiftData] = await Promise.allSettled([
            user.role === 'Admin' ? apiService.getUsers().catch(() => []) : Promise.resolve([]),
            apiService.getActiveShift(user.id).catch(() => null)
          ]);

          if (usersData.status === 'fulfilled') {
            set({ users: usersData.value });
          }

          if (activeShiftData.status === 'fulfilled') {
            set({ activeShift: activeShiftData.value });
          }
        } catch (error) {
          console.error('Failed to refresh data:', error);
        } finally {
          setLoading(false);
        }
      },

      // Enhanced logout with shift validation
      logout: async () => {
        const { activeShift } = get();
        
        if (activeShift && activeShift.status === 'ACTIVE') {
          return false; // Cannot logout with active shift
        }

        set({
          user: null,
          isAuthenticated: false,
          users: [],
          activeShift: null
        });
        
        localStorage.removeItem('authToken');
        return true;
      }
    }),
    {
      name: 'app-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        settings: state.settings,
        activeShift: state.activeShift
      })
    }
  )
);