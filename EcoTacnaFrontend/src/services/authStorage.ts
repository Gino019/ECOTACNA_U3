export interface EcotacnaAuth {
  token: string;
  userId: number;
  email: string;
  role: string;
  companyId: number | null;
  companyName: string | null;
  companyType: string | null;
  subscriptionStatus?: string | null;
}

export const authStorageKey = "ecotacna_auth";

export const saveAuth = (auth: EcotacnaAuth) => {
  localStorage.setItem(authStorageKey, JSON.stringify(auth));
};

export const getStoredAuth = (): EcotacnaAuth | null => {
  try {
    const raw = localStorage.getItem(authStorageKey);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const clearStoredAuth = () => {
  localStorage.removeItem(authStorageKey);
};
