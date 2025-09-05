import api from './api';

export interface Order {
  _id: string;
  customerId: {
    _id: string;
    name: string;
  };
  sellerId: {
    _id: string;
    name: string;
  };
  products: Array<{
    productId: {
      _id: string;
      name: string;
      price: number;
      images: string[];
    };
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  paymentId?: {
    _id: string;
    status: string;
  };
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  trackingNumber?: string;
  estimatedDelivery?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

export const ordersService = {
  getAllOrders: async (page = 1, limit = 10, status?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) params.append('status', status);
    
    const response = await api.get(`/admin/orders?${params}`);
    return response.data;
  },

  getOrderById: async (id: string) => {
    const response = await api.get(`/admin/orders/${id}`);
    return response.data;
  },

  updateOrderStatus: async (id: string, status: string, trackingNumber?: string) => {
    const response = await api.patch(`/admin/orders/${id}/status`, {
      status,
      trackingNumber,
    });
    return response.data;
  },

  getOrdersStats: async () => {
    const response = await api.get('/admin/orders/stats');
    return response.data;
  },

  getRevenueStats: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/admin/orders/revenue?${params}`);
    return response.data;
  },
};
