
const API_BASE_URL = 'http://localhost:3001/api';

export const apiConfig = {
  baseURL: API_BASE_URL,
  endpoints: {
    auth: {
      login: '/auth/login',
      users: '/auth/users',
    },
    products: '/products',
    shifts: '/shifts',
    orders: '/orders',
    reports: '/reports',
  },
};

// Create API client with auth headers
export const createAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const createFormDataHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};
