import { apiClient } from "./apiClient";

export interface AuthData {
  token:              string;
  userId:             number;
  email:              string;
  role:               "ADMIN" | "GENERADOR" | "RECOLECTOR";
  companyId:          number | null;
  companyName:        string | null;
  companyType:        "GENERADORA" | "RECOLECTORA" | null;
  subscriptionStatus: "PENDIENTE" | "PENDIENTE_PAGO" | "ACTIVA" | "PRUEBA_ACTIVA" | "VENCIDA" | "SUSPENDIDA" | "CANCELADA" | null;
}

export const authApi = {
  login: async (email: string, password: string, captchaToken?: string) => {
    return apiClient<AuthData>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, captchaToken }),
    });
  },

  register: async (body: Record<string, unknown>) => {
    return apiClient("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  logout: async () => {
    // Elimina el token localmente, no requiere backend
    return Promise.resolve();
  },

  checkRegistrationStatus: async (ruc: string) => {
    return apiClient<import("@/types").RegistrationStatusData>(`/auth/registration-status/${ruc}`, {
      method: "GET",
    });
  },
};
