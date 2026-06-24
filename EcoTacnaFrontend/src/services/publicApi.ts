import { apiClient } from "./apiClient";
import { rucApi, RucLookupData } from "./rucApi";

export type RucLookupResponse = RucLookupData;

export interface CaptchaChallengeResponse {
  captchaToken: string;
  backgroundImage: string;
  puzzlePieceImage: string;
  y: number;
}

export interface PublicStatsResponse {
  litrosRecolectados: number;
  empresasActivas: number;
  recolectoresActivos: number;
  pagosProcesados: number;
}

export const publicApi = {
  lookupRuc: async (ruc: string): Promise<RucLookupResponse> => {
    return rucApi.consultarRuc(ruc);
  },
  getLandingStats: async (): Promise<PublicStatsResponse> => {
    const res = await apiClient<PublicStatsResponse>("/public/landing-stats");
    if (!res.success || !res.data) {
      throw new Error(res.message || "Error al cargar estadísticas");
    }
    return res.data;
  },
  getCaptchaChallenge: async (): Promise<CaptchaChallengeResponse> => {
    const res = await apiClient<CaptchaChallengeResponse>("/public/captcha/challenge");
    if (!res.success || !res.data) {
      throw new Error(res.message || "Error al cargar el captcha");
    }
    return res.data;
  },
  verifyCaptchaChallenge: async (captchaToken: string, userX: number): Promise<boolean> => {
    const res = await apiClient<void>("/public/captcha/verify", {
      method: "POST",
      body: JSON.stringify({ captchaToken, userX })
    });
    return res.success;
  }
};
