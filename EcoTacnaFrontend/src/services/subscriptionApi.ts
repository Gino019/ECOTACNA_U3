import { apiClient } from './apiClient';

export interface Plan {
  id: number;
  code: string;
  name: string;
  companyType: string;
  monthlyAmount: number;
  currency: string;
  trialDays: number;
}

export interface PublicCheckoutResponse {
  companyId: number;
  companyName: string;
  companyType: string;
  planId: number;
  planCode: string;
  planName: string;
  monthlyAmount: number;
  currency: string;
  trialDays: number;
  todayAmount: number;
  status: string;
}

export interface SubscriptionStatusResponse {
  companyName: string;
  companyType: string;
  status: string;
  planName?: string;
  monthlyAmount?: number;
  currency?: string;
  trialEndsAt?: string;
  currentPeriodEnd?: string;
  canOperate: boolean;
  message?: string;
}

export interface Subscription {
  id: number;
  planId: number;
  planName: string;
  status: string;
  startDate: string;
  trialEndsAt: string;
  nextBillingDate: string;
}

export interface ProfileSubscriptionStatusResponse {
  tipoEmpresa: string;
  planNombre: string;
  precioMensual: number;
  estadoSuscripcion: string;
  fechaInicio: string;
  fechaFinPrueba: string | null;
  fechaVencimiento: string | null;
  diasRestantes: number;
  pruebaActiva: boolean;
  cancelacionProgramada: boolean;
  puedeCancelar: boolean;
  puedeRenovar: boolean;
  mensajeEstado: string;
}

export const subscriptionApi = {
  getPublicPlans: async (): Promise<Plan[]> => {
    const response = await apiClient<Plan[]>('/public/plans', { method: 'GET' });
    return response.data || [];
  },

  getMySubscriptionStatus: async (): Promise<SubscriptionStatusResponse> => {
    const response = await apiClient<SubscriptionStatusResponse>('/subscriptions/me', { method: 'GET' });
    if (!response.data) throw new Error(response.message || 'Error al obtener estado de suscripcion');
    return response.data;
  },

  getProfileSubscriptionStatus: async (): Promise<ProfileSubscriptionStatusResponse> => {
    const response = await apiClient<ProfileSubscriptionStatusResponse>('/profile/subscription/status', { method: 'GET' });
    if (!response.data) throw new Error(response.message || 'Error al obtener estado de suscripción de perfil');
    return response.data;
  },

  cancelProfileSubscription: async (): Promise<{ message: string }> => {
    const response = await apiClient<{ message: string }>('/profile/subscription/cancel', { method: 'POST' });
    if (!response.data) throw new Error(response.message || 'Error al cancelar suscripción');
    return response.data;
  },

  renewProfileSubscription: async (): Promise<{ message: string }> => {
    const response = await apiClient<{ message: string }>('/profile/subscription/renew', { method: 'POST' });
    if (!response.data) throw new Error(response.message || 'Error al renovar suscripción');
    return response.data;
  },

  activateTrial: async (): Promise<Subscription> => {
    const response = await apiClient<Subscription>('/subscriptions/trial', { method: 'POST' });
    if (!response.data) throw new Error(response.message || 'Error al activar prueba');
    return response.data;
  },

  getPublicCheckout: async (companyId: number): Promise<PublicCheckoutResponse> => {
    const response = await apiClient<PublicCheckoutResponse>(`/public/checkout/company/${companyId}`, { method: 'GET' });
    if (!response.data) throw new Error(response.message || 'Error al obtener checkout');
    return response.data;
  }
};
