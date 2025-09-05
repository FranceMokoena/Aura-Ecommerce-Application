import api from './api';

export interface AdminLoginData {
  email: string;
  password: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const authService = {
  login: async (data: AdminLoginData) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  },

  getCurrentUser: (): AdminUser | null => {
    const user = localStorage.getItem('adminUser');
    return user ? JSON.parse(user) : null;
  },

  setAuthData: (token: string, user: AdminUser) => {
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', JSON.stringify(user));
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('adminToken');
  },
};
