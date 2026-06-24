import { apiClient } from './apiClient';

export interface PaymentInitRequest {
  planId: number;
}

export interface PaymentInitResponse {
  paymentId: number;
  amount: number;
  currency: string;
  status: string;
  providerPaymentId?: string;
}

export interface MockPaymentRequest {
  paymentId: number;
  simulateApproval: boolean;
}

export interface PaymentResponse {
  id: number;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  confirmedAt?: string;
}

export interface SimulatedTokenRequest {
  cardNumber: string;
  cvv: string;
  expiry: string;
  email: string;
  cardholderName: string;
}

export interface SimulatedTokenResponse {
  id: string;
  object: string;
  cardLast4: string;
  brand: string;
  email: string;
  created: string;
}

export interface SimulatedPaymentConfirmRequest {
  paymentMethod: string;
  simulatedToken: string;
  email: string;
}

export interface SimulatedPaymentResponse {
  success: boolean;
  companyId: number;
  companyName: string;
  companyType: string;
  planName: string;
  subscriptionStatus: string;
  todayAmount: number;
  monthlyAmount: number;
  trialDays: number;
  providerTokenId: string;
  providerChargeId: string;
  message: string;
}

export const paymentApi = {
  initPayment: async (data: PaymentInitRequest): Promise<PaymentInitResponse> => {
    const response = await apiClient<PaymentInitResponse>('/payments/init', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!response.data) throw new Error(response.message || 'Error al inicializar pago');
    return response.data;
  },

  confirmMockPayment: async (data: MockPaymentRequest): Promise<PaymentResponse> => {
    const response = await apiClient<PaymentResponse>('/payments/mock/confirm', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!response.data) throw new Error(response.message || 'Error al confirmar pago mock');
    return response.data;
  },

  createSimulatedToken: async (data: SimulatedTokenRequest): Promise<SimulatedTokenResponse> => {
    const response = await apiClient<SimulatedTokenResponse>('/public/payments/simulated/tokens', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!response.data) throw new Error(response.message || 'Error al crear token simulado');
    return response.data;
  },

  confirmSimulatedPayment: async (
    companyId: number | string,
    data: SimulatedPaymentConfirmRequest
  ): Promise<SimulatedPaymentResponse> => {
    const response = await apiClient<SimulatedPaymentResponse>(`/public/payments/simulated/company/${companyId}/confirm`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!response.data) throw new Error(response.message || 'Error al confirmar pago simulado');
    return response.data;
  }
};
