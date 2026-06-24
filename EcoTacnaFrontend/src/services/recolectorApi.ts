import { apiClient } from "./apiClient";
import type { PickupRequest, TransportUnit } from "../types";

export const recolectorApi = {
  getPerfil: async () => {
    return await apiClient<Record<string, unknown>>("/recolector/perfil", { method: "GET" });
  },

  actualizarContacto: async (body: import("../types").ContactUpdateRequest) => {
    return await apiClient<import("../types").ProfileUpdateResponse>("/recolector/perfil/contacto", {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  getResumen: async () => {
    return await apiClient<Record<string, unknown>>("/recolector/resumen", { method: "GET" });
  },

  getDashboard: async () => {
    return await apiClient<Record<string, unknown>>("/recolector/dashboard", { method: "GET" });
  },

  getDashboardGeneral: async () => {
    return await apiClient<any>("/recolector/dashboard-general", { method: "GET" });
  },

  getSolicitudes: async () => {
    return await apiClient<PickupRequest[]>("/recolector/solicitudes", { method: "GET" });
  },

  getSolicitudesAceptadas: async () => {
    return await apiClient<PickupRequest[]>("/recolector/solicitudes-aceptadas", { method: "GET" });
  },

  getRecojosDia: async () => {
    return await apiClient<PickupRequest[]>("/recolector/recojos-dia", { method: "GET" });
  },

  getTransportes: async () => {
    return await apiClient<TransportUnit[]>("/recolector/transportes", { method: "GET" });
  },

  getUnidades: async () => {
    return await apiClient<TransportUnit[]>("/recolector/unidades", { method: "GET" });
  },

  crearUnidad: async (body: {
    placa: string;
    marca?: string;
    modelo?: string;
    tipoUnidad?: string;
    capacidadLitros: number;
    estado?: string;
    observaciones?: string;
  }) => {
    return apiClient<TransportUnit>("/recolector/unidades", {
      method: "POST",
      body: JSON.stringify(body)
    });
  },

  actualizarUnidad: async (id: number, body: {
    placa: string;
    marca?: string;
    modelo?: string;
    tipoUnidad?: string;
    capacidadLitros: number;
    estado?: string;
    observaciones?: string;
  }) => {
    return apiClient<TransportUnit>(`/recolector/unidades/${id}`, {
      method: "PUT",
      body: JSON.stringify(body)
    });
  },

  iniciarRuta: async (solicitudId: number) => {
    return apiClient<PickupRequest>(`/recolector/recojos/${solicitudId}/en-ruta`, {
      method: "PUT"
    });
  },

  marcarLlegada: async (solicitudId: number) => {
    return apiClient<PickupRequest>(`/recolector/recojos/${solicitudId}/en-sitio`, {
      method: "PUT"
    });
  },

  confirmarRecojo: async (solicitudId: number, volumenReal: number, precioPorLitro: number) => {
    return apiClient<PickupRequest>(`/recolector/recojos/${solicitudId}/confirmar`, {
      method: "PUT",
      body: JSON.stringify({ volumenReal, precioPorLitro }),
    });
  },

  getSolicitudesDisponibles: async () => {
    return await apiClient<PickupRequest[]>("/recolector/solicitudes-disponibles", { method: "GET" });
  },

  aceptarSolicitud: async (solicitudId: number, precioPorLitro?: number) => {
    const url = precioPorLitro 
      ? `/recolector/solicitudes/${solicitudId}/aceptar?precioPorLitro=${precioPorLitro}`
      : `/recolector/solicitudes/${solicitudId}/aceptar`;
    return await apiClient<PickupRequest>(url, { method: "POST" });
  },

  rechazarSolicitud: async (solicitudId: number, data?: { motivo: string; observacion?: string; tipoRechazo: string }) => {
    return await apiClient<void>(`/recolector/solicitudes/${solicitudId}/rechazar`, { 
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  getRecojoActivo: async () => {
    return await apiClient<PickupRequest>("/recolector/recojo-activo", { method: "GET" });
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
    const response = await fetch(`${BASE_URL}/recolector/solicitudes/${solicitudId}/constancia`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("No se pudo descargar la constancia. Verifique el estado de la solicitud.");
    }
    
    return response.blob();
  },

  exportarHistorialExcel: async (desde: string, hasta: string) => {
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
    const response = await fetch(`${BASE_URL}/recolector/solicitudes/exportar?desde=${desde}&hasta=${hasta}`, {
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
