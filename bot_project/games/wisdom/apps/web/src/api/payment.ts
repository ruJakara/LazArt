import api from './client';

export type PaymentCurrency = 'stars' | 'blood';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface PaymentRequest {
  amount: number;
  currency: PaymentCurrency;
  description?: string;
  itemId?: string;
}

export interface PaymentResponse {
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  invoiceUrl?: string;
  expiresAt?: number;
}

export interface PaymentHistoryItem {
  id: string;
  userId: number;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  createdAt: string;
  completedAt?: string;
}

export const paymentApi = {
  createPayment: async (request: PaymentRequest): Promise<PaymentResponse> => {
    const response = await api.post<PaymentResponse>('/payment/create', request);
    return response.data;
  },

  getPaymentStatus: async (paymentId: string): Promise<PaymentResponse> => {
    const response = await api.get<PaymentResponse>(`/payment/status/${paymentId}`);
    return response.data;
  },

  getPaymentHistory: async (): Promise<PaymentHistoryItem[]> => {
    const response = await api.get<{ history: PaymentHistoryItem[] }>('/payment/history');
    return response.data.history;
  },
};
