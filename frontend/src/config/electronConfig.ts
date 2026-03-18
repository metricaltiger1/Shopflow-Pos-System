// frontend/src/config/electronConfig.ts

declare global {
  interface Window {
    electronAPI: {
      getBackendUrl: () => Promise<string>;
      getIsElectron: () => Promise<boolean>;
      isBackendReady: () => Promise<boolean>;
    };
    backendReady?: boolean;
    onBackendReady?: () => void;
  }
}

export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.process !== 'undefined' && 
         (window.process as any).type === 'renderer';
};

let backendUrl: string | null = null;
let backendReady = false;

// Wait for backend to be ready
export const waitForBackend = async (): Promise<void> => {
  if (backendReady) return;
  
  if (isElectron() && window.electronAPI) {
    // Check if backend is ready via Electron API
    const isReady = await window.electronAPI.isBackendReady();
    if (isReady) {
      backendReady = true;
      return;
    }
    
    // Wait for backend ready signal
    await new Promise<void>((resolve) => {
      if (typeof window !== 'undefined') {
        window.onBackendReady = resolve;
        
        // Timeout after 30 seconds
        setTimeout(() => {
          console.warn('Backend ready timeout exceeded');
          resolve();
        }, 30000);
      } else {
        resolve();
      }
    });
  } else {
    // Not in Electron, assume backend is ready
    backendReady = true;
  }
};

export const getBackendUrl = async (): Promise<string> => {
  if (backendUrl) return backendUrl;
  
  if (isElectron() && window.electronAPI) {
    backendUrl = await window.electronAPI.getBackendUrl();
  } else {
    backendUrl = 'http://localhost:3001';
  }
  
  return backendUrl;
};

export const getApiUrl = async (endpoint: string): Promise<string> => {
  await waitForBackend(); // Wait for backend to be ready
  const baseUrl = await getBackendUrl();
  return `${baseUrl}/api${endpoint}`;
};

// Enhanced fetch with retry logic
export const apiFetch = async (endpoint: string, options: RequestInit = {}, retries = 3): Promise<any> => {
  try {
    await waitForBackend();
    const url = await getApiUrl(endpoint);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...createAuthHeaders(),
        ...options.headers,
      },
    });
    
    if (response.status === 401) {
      localStorage.removeItem('authToken');
      if (typeof window !== 'undefined') {
        window.location.href = '#/login';
      }
      throw new Error('Authorization required');
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    if (retries > 0) {
      console.warn(`API request failed, retrying (${retries} left):`, error);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return apiFetch(endpoint, options, retries - 1);
    }
    throw error;
  }
};

export const createAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};