import { apiClient, BASE_URL } from "./apiClient";
import type { PickupRequest, TransportUnit, Company } from "../types";

export const adminApi = {
  getResumen: async () => {
    return await apiClient<Record<string, unknown>>("/admin/resumen", { method: "GET" });
  },

  getInstitutionalSummary: async () => {
    return await apiClient<any>("/admin/resumen-institucional", { method: "GET" });
  },

  getEmpresas: async () => {
    return await apiClient<Company[]>("/admin/empresas", { method: "GET" });
  },

  getEmpresasRechazadas: async () => {
    return await apiClient<Company[]>("/admin/empresas/rechazadas", { method: "GET" });
  },

  getRecolectores: async () => {
    return await apiClient<Company[]>("/admin/recolectores", { method: "GET" });
  },

  getTransportes: async () => {
    return await apiClient<TransportUnit[]>("/admin/transportes", { method: "GET" });
  },

  actualizarSuscripcion: async (empresaId: number, subscriptionStatus: string) => {
    return await apiClient<Company>(`/admin/suscripciones/${empresaId}`, {
      method: "PUT",
      body: JSON.stringify({ subscriptionStatus })
    });
  },

  approveCompany: async (id: number) => {
    return await apiClient<Record<string, unknown>>(`/admin/empresas/${id}/approve`, {
      method: "POST"
    });
  },

  rejectCompany: async (id: number) => {
    return await apiClient<Record<string, unknown>>(`/admin/empresas/${id}/reject`, {
      method: "POST"
    });
  },

  admitCompany: async (id: number) => {
    return await apiClient<Record<string, unknown>>(`/admin/empresas/${id}/admitir`, {
      method: "POST"
    });
  },

  approveRecolector: async (id: number) => {
    return await apiClient<Record<string, unknown>>(`/admin/recolectores/${id}/approve`, {
      method: "POST"
    });
  },

  rejectRecolector: async (id: number) => {
    return await apiClient<Record<string, unknown>>(`/admin/recolectores/${id}/reject`, {
      method: "POST"
    });
  },

  getCompanyDetail: async (id: number) => {
    return await apiClient<Record<string, unknown>>(`/admin/empresas/${id}/detalle`, { method: "GET" });
  },

  downloadCompanyPdf: async (id: number, ruc: string) => {
    const authStr = localStorage.getItem("ecotacna_auth");
    let token = null;
    if (authStr) {
      try {
        const auth = JSON.parse(authStr);
        if (auth && auth.token) {
          token = auth.token;
        }
      } catch (e) {
        console.error("Auth parse error:", e);
      }
    }

    const response = await fetch(`${BASE_URL}/admin/empresas/${id}/ficha-pdf`, {
      method: "GET",
      headers: {
        Authorization: token ? `Bearer ${token}` : ""
      }
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errJson = await response.json().catch(() => ({}));
        let errMsg = errJson.message || "Error al descargar la ficha PDF";
        if (response.status === 401 || response.status === 403) errMsg = "No tiene permisos para descargar la ficha.";
        if (response.status === 404) errMsg = "No se encontró la empresa seleccionada.";
        if (response.status >= 500) errMsg = "No se pudo generar el PDF de la empresa.";
        throw new Error(errMsg);
      } else {
        throw new Error(`Error en el servidor: ${response.status} ${response.statusText}`);
      }
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ficha_empresa_${ruc}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  getCollectorDetail: async (id: number) => {
    return await apiClient<Record<string, unknown>>(`/admin/recolectores/${id}/detalle`, { method: "GET" });
  },

  downloadCollectorPdf: async (id: number, ruc: string) => {
    const authStr = localStorage.getItem("ecotacna_auth");
    let token = null;
    if (authStr) {
      try {
        const auth = JSON.parse(authStr);
        if (auth && auth.token) {
          token = auth.token;
        }
      } catch (e) {
        console.error("Auth parse error:", e);
      }
    }

    const response = await fetch(`${BASE_URL}/admin/recolectores/${id}/ficha-pdf`, {
      method: "GET",
      headers: {
        Authorization: token ? `Bearer ${token}` : ""
      }
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errJson = await response.json().catch(() => ({}));
        let errMsg = errJson.message || "Error al descargar la ficha PDF";
        if (response.status === 401 || response.status === 403) errMsg = "No tiene permisos para descargar la ficha.";
        if (response.status === 404) errMsg = "No se encontró la recolectora seleccionada.";
        if (response.status >= 500) errMsg = "No se pudo generar el PDF de la recolectora.";
        throw new Error(errMsg);
      } else {
        throw new Error(`Error en el servidor: ${response.status} ${response.statusText}`);
      }
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ficha_recolectora_${ruc}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
};
