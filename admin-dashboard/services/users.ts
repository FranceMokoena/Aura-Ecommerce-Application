import api from './api';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'seller' | 'seeker';
  profilePicture?: string;
  location?: {
    city?: string;
    country?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export const usersService = {
  getAllUsers: async (page = 1, limit = 10, role?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (role) params.append('role', role);
    
    const response = await api.get(`/admin/users?${params}`);
    return response.data;
  },

  getUserById: async (id: string) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  updateUser: async (id: string, data: Partial<User>) => {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  suspendUser: async (id: string) => {
    const response = await api.patch(`/admin/users/${id}/suspend`);
    return response.data;
  },

  activateUser: async (id: string) => {
    const response = await api.patch(`/admin/users/${id}/activate`);
    return response.data;
  },

  getUsersStats: async () => {
    const response = await api.get('/admin/users/stats');
    return response.data;
  },
};
