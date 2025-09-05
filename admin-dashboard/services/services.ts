import api from './api';

export interface Service {
  _id: string;
  title: string;
  description: string;
  rate: number;
  rateType: 'hourly' | 'daily' | 'fixed';
  availability: boolean;
  location: string;
  category: string;
  skills: string[];
  status: 'active' | 'inactive';
  seekerId: {
    _id: string;
    name: string;
  };
  ratings: Array<{
    customerId: string;
    stars: number;
    review: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ServicesResponse {
  services: Service[];
  total: number;
  page: number;
  limit: number;
}

export const servicesService = {
  getAllServices: async (page = 1, limit = 10, status?: string, category?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) params.append('status', status);
    if (category) params.append('category', category);
    
    const response = await api.get(`/admin/services?${params}`);
    return response.data;
  },

  getServiceById: async (id: string) => {
    const response = await api.get(`/admin/services/${id}`);
    return response.data;
  },

  updateService: async (id: string, data: Partial<Service>) => {
    const response = await api.put(`/admin/services/${id}`, data);
    return response.data;
  },

  deleteService: async (id: string) => {
    const response = await api.delete(`/admin/services/${id}`);
    return response.data;
  },

  approveService: async (id: string) => {
    const response = await api.patch(`/admin/services/${id}/approve`);
    return response.data;
  },

  rejectService: async (id: string, reason: string) => {
    const response = await api.patch(`/admin/services/${id}/reject`, { reason });
    return response.data;
  },

  getServicesStats: async () => {
    const response = await api.get('/admin/services/stats');
    return response.data;
  },
};
