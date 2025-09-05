import api from './api';

export interface Payment {
  _id: string;
  userId: {
    _id: string;
    name: string;
  };
  orderId?: {
    _id: string;
    totalAmount: number;
    status: string;
  };
  bookingId?: {
    _id: string;
    totalAmount: number;
    status: string;
  };
  amount: number;
  method: 'card' | 'paypal' | 'mobile_money' | 'bank_transfer';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  currency: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentsResponse {
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
}

export const paymentsService = {
  getAllPayments: async (page = 1, limit = 10, status?: string, method?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) params.append('status', status);
    if (method) params.append('method', method);
    
    const response = await api.get(`/admin/payments?${params}`);
    return response.data;
  },

  getPaymentById: async (id: string) => {
    const response = await api.get(`/admin/payments/${id}`);
    return response.data;
  },

  refundPayment: async (id: string, reason: string) => {
    const response = await api.patch(`/admin/payments/${id}/refund`, { reason });
    return response.data;
  },

  getPaymentsStats: async () => {
    const response = await api.get('/admin/payments/stats');
    return response.data;
  },

  getRevenueStats: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/admin/payments/revenue?${params}`);
    return response.data;
  },
};
