import { apiClient } from "./apiClient";
import type { PickupRequest } from "../types";

export const empresaApi = {
  getPerfil: async () => {
    return await apiClient<Record<string, unknown>>("/empresa/perfil", { method: "GET" });
  },

  actualizarContacto: async (body: import("../types").ContactUpdateRequest) => {
    return await apiClient<import("../types").ProfileUpdateResponse>("/empresa/perfil/contacto", {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  updateCompanyLocation: async (id: number, payload: any) => {
    return await apiClient<any>(`/empresa/ubicaciones/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  getResumen: async () => {
    return await apiClient<Record<string, unknown>>("/empresa/resumen", { method: "GET" });
  },

  getCompanyGeneralDashboard: async () => {
    return await apiClient<import("../types").CompanyGeneralDashboardResponse>("/empresa/dashboard-general", { method: "GET" });
  },

  getSolicitudes: async () => {
    return await apiClient<PickupRequest[]>("/empresa/solicitudes", { method: "GET" });
  },

  crearSolicitud: async (
    body: {
      volumenAproximado: number;
      direccion: string;
      fechaProgramada: string;
      observaciones?: string;
      precioOfertadoPorLitro: number;
      pickupLatitude?: number | null;
      pickupLongitude?: number | null;
    },
    foto: File
  ) => {
    const formData = new FormData();
    formData.append("solicitud", new Blob([JSON.stringify(body)], { type: "application/json" }));
    formData.append("foto", foto);

    return apiClient<PickupRequest>("/empresa/solicitudes", {
      method: "POST",
      body: formData,
      // When using FormData, we should NOT set Content-Type header to application/json. 
      // apiClient might be setting it by default, so we might need a workaround or ensure apiClient doesn't override it.
      // Assuming apiClient removes Content-Type if body is FormData or we can override it via headers if needed.
    });
  },

  getSolicitudActiva: async () => {
    return await apiClient<{ tieneActiva: boolean; solicitud: PickupRequest | null }>("/empresa/solicitudes/activa", { method: "GET" });
  },

  getSeguimientoActivo: async () => {
    return await apiClient<import("../types").PickupTrackingResponse>("/empresa/seguimiento-activo", { method: "GET" });
  },

  confirmarPago: async (solicitudId: number, payload: { litrosConfirmados: number; observacionPago?: string }) => {
    return apiClient<import("../types").PickupTrackingResponse>(`/empresa/solicitudes/${solicitudId}/confirmar-pago`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  cancelarSolicitud: async (solicitudId: number) => {
    return apiClient<import("../types").PickupRequest>(`/empresa/solicitudes/${solicitudId}/cancelar`, {
      method: "POST",
    });
  },

  descargarConstancia: async (solicitudId: number) => {
    const authStr = localStorage.getItem("ecotacna_auth");
    let token = "";
    if (authStr) {
      try {
        const auth = JSON.parse(authStr);
        if (auth && auth.token) token = auth.token;
      } catch (e) {
        console.warn("Error leyendo auth storage local", e);
      }
    }

    const { BASE_URL } = await import("./apiClient");
    const response = await fetch(`${BASE_URL}/empresa/solicitudes/${solicitudId}/constancia`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("No se pudo descargar la constancia. Verifique el estado de la solicitud.");
    }
    
    return response.blob();
  },

  createCompanyLocation: async (data: { name: string, reference: string, latitude: number, longitude: number, address?: string, placeId?: string }) => {
    return await apiClient<string>('/empresa/ubicaciones', {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  crearIncidenciaSolicitud: async (solicitudId: number, payload: { reasonCode: string; customReason?: string; description?: string }) => {
    return apiClient<any>(`/empresa/solicitudes/${solicitudId}/incidencias`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  listarIncidenciasSolicitud: async (solicitudId: number) => {
    return apiClient<any[]>(`/empresa/solicitudes/${solicitudId}/incidencias`, {
      method: "GET"
    });
  },

  exportarSolicitudesExcel: async (desde: string, hasta: string) => {
    const authStr = localStorage.getItem("ecotacna_auth");
    let token = "";
    if (authStr) {
      try {
        const auth = JSON.parse(authStr);
        if (auth && auth.token) token = auth.token;
      } catch (e) {
        console.warn("Error leyendo auth storage local", e);
      }
    }

    const { BASE_URL } = await import("./apiClient");
    const response = await fetch(`${BASE_URL}/empresa/solicitudes/exportar?desde=${desde}&hasta=${hasta}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("No se pudo exportar el historial de solicitudes.");
    }
    return response.blob();
  }
};
