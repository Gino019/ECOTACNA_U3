import { apiClient, ApiError } from "./apiClient";

export interface RucLookupData {
  ruc: string;
  razonSocial: string;
  nombreComercial: string;
  direccionFiscal: string;
  distrito: string;
  provincia: string;
  departamento: string;
  estadoContribuyente: string;
  condicionDomicilio: string;
  fuente: string;
}

export const rucApi = {
  consultarRuc: async (ruc: string): Promise<RucLookupData> => {
    try {
      const response = await apiClient<RucLookupData>(`/ruc/${ruc}`);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Error al consultar el RUC");
      }
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          throw new Error("No se encontraron datos para el RUC ingresado.");
        }
        if (error.status === 400) {
          throw new Error("El RUC debe tener 11 dígitos numéricos.");
        }
        if (error.status === 401 || error.status === 403) {
          throw new Error(error.message || "Token de ApiPeruDev inválido o no autorizado.");
        }
        if (error.status === 429) {
          throw new Error(error.message || "El servicio externo de RUC alcanzó el límite de consultas. Intenta nuevamente en unos segundos.");
        }
        if (error.status === 502 || error.status === 503) {
          throw new Error(error.message || "Servicio RUC no disponible o no configurado.");
        }
        throw new Error(error.message || "No se pudo consultar el RUC. Intenta nuevamente.");
      }
      throw error;
    }
  },
};
