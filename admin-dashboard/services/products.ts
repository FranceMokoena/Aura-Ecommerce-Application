import api from './api';

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
  images: string[];
  location: string;
  status: 'active' | 'inactive' | 'out_of_stock';
  sellerId: {
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

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

export const productsService = {
  getAllProducts: async (page = 1, limit = 10, status?: string, category?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) params.append('status', status);
    if (category) params.append('category', category);
    
    const response = await api.get(`/admin/products?${params}`);
    return response.data;
  },

  getProductById: async (id: string) => {
    const response = await api.get(`/admin/products/${id}`);
    return response.data;
  },

  updateProduct: async (id: string, data: Partial<Product>) => {
    const response = await api.put(`/admin/products/${id}`, data);
    return response.data;
  },

  deleteProduct: async (id: string) => {
    const response = await api.delete(`/admin/products/${id}`);
    return response.data;
  },

  approveProduct: async (id: string) => {
    const response = await api.patch(`/admin/products/${id}/approve`);
    return response.data;
  },

  rejectProduct: async (id: string, reason: string) => {
    const response = await api.patch(`/admin/products/${id}/reject`, { reason });
    return response.data;
  },

  getProductsStats: async () => {
    const response = await api.get('/admin/products/stats');
    return response.data;
  },
};
