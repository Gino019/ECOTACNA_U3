export interface UserSession {
  id?: number;
  email: string;
  role: string;
  token?: string;
  companyId?: number;
  companyName?: string;
}

export interface Company {
  id: number;
  ruc: string;
  businessName: string;
  tradeName?: string;
  email?: string;
  phone?: string;
  legalRepresentative?: string;
  contactPerson?: string;
  industry?: string;
  taxPayerType?: string;
  taxPayerStatus?: string;
  address?: string;
  department?: string;
  province?: string;
  district?: string;
  registrationDate?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
}

export interface PickupRequest {
  id: number;
  empresaId: number;
  empresaRazonSocial: string;
  empresaRuc?: string;
  contactoNombre?: string;
  contactoTelefono?: string;
  contactoCorreo?: string;
  volumenAproximado: number;
  estado: string;
  fechaSolicitud: string;
  fechaProgramada: string;
  volumenReal?: number;
  fechaRecoleccion?: string;
  direccion?: string;
  observaciones?: string;
  createdAt?: string;
  updatedAt?: string;
  transportePlaca?: string;
  transporteCapacidadLitros?: number;
  recolectorAsignado?: string;
  precioOfertadoPorLitro?: number;
  montoEstimado?: number;
  pickupLatitude?: number | null;
  pickupLongitude?: number | null;
  companyLatitude?: number | null;
  companyLongitude?: number | null;
  collectorLatitude?: number | null;
  collectorLongitude?: number | null;
  evidenciaUrl?: string;
  segundosRestantes?: number;
  distanceKm?: number;
  incidencias?: any[];

  // Campos de IA / Recomendación
  aiRecommended?: boolean;
  aiRank?: number;
  aiScore?: number;
  aiReason?: string;
  aiTags?: string[];
  recommendationSource?: 'GEMINI' | 'BASE_SCORE' | 'NONE';
  exceedsCollectorCapacity?: boolean;
  capacityMessage?: string;
}

export interface TransportUnit {
  id: number;
  empresaRecolectoraId: number;
  empresaRazonSocial: string;
  placa: string;
  marca: string;
  modelo: string;
  capacidadLitros: number;
  tipoUnidad: string;
  estado: string;
  observaciones?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriptionStatusResponse {
  active: boolean;
  subscriptionId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  planName?: string;
  planMaxLiters?: number;
  currentCycleLiters?: number;
  daysRemaining?: number;
  litersRemaining?: number;
  nextBillingDate?: string;
}

export interface CheckoutSummary {
  planId?: number;
  planName?: string;
  price?: number;
  currency?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  status?: string;
  message?: string;
}

export interface RucLookupResponse {
  success: boolean;
  ruc?: string;
  businessName?: string;
  tradeName?: string;
  taxPayerType?: string;
  taxPayerStatus?: string;
  address?: string;
  department?: string;
  province?: string;
  district?: string;
  error?: string;
}

export interface RegistrationStatusData {
  exists: boolean;
  ruc: string;
  companyId?: number;
  razonSocial?: string;
  tipoEmpresa?: string;
  correoContacto?: string;
  subscriptionStatus?: string;
  nextStep: 'NEW_REGISTRATION' | 'REVIEW_PENDING' | 'PAYMENT_PENDING' | 'ACTIVE_LOGIN' | 'REJECTED' | 'UNKNOWN_STATE';
  message?: string;
}

export interface PickupTrackingResponse {
  solicitudId: number;
  estado: string;
  empresaGeneradora: string;
  direccion: string;
  volumenAproximado: number;
  fechaSolicitud: string;
  fechaProgramada: string;
  observaciones?: string;
  recolector?: {
    empresaRecolectoraId: number;
    razonSocial: string;
    ruc: string;
    correo: string;
    telefono: string;
  };
  unidad?: {
    placa: string;
    marca: string;
    modelo: string;
    tipoUnidad: string;
    capacidadLitros: number;
  };
  precioOfertadoPorLitro?: number;
  montoEstimado?: number;
  pickupLatitude?: number | null;
  pickupLongitude?: number | null;
  companyLatitude?: number | null;
  companyLongitude?: number | null;
  collectorLatitude?: number | null;
  collectorLongitude?: number | null;
}

export interface ContactUpdateRequest {
  contactPerson: string;
  email: string;
  phone: string;
}

export interface ProfileUpdateResponse {
  message: string;
  newToken?: string;
  updatedProfile: Record<string, any>;
}

export interface CompanyGeneralDashboardResponse {
  company: {
    id: number;
    businessName: string;
    ruc: string;
    companyType: string;
    status: string;
    address: string;
    email: string;
    phone: string;
    contactPerson: string;
    createdAt: string;
  };
  kpis: {
    totalLitersRecycled: number;
    totalRequests: number;
    completedRequests: number;
    pendingRequests: number;
    totalPaidToCollectors: number;
    activeRequest: boolean;
  };
  monthlyEvolution: Array<{
    month: string;
    liters: number;
  }>;
  operationalSummary: {
    type: string;
    ruc: string;
    address: string;
    email: string;
    phone: string;
    status: string;
    memberSince: string;
  };
  requestDistribution: Array<{
    label: string;
    value: number;
    liters: number;
  }>;
  recentRequests: Array<{
    id: number;
    requestDate: string;
    scheduledDate: string;
    liters: number;
    pricePerLiter: number;
    totalAmount: number;
    status: string;
    paymentStatus: string;
    collectorName: string;
    collectorRuc: string;
    vehiclePlate: string;
    pickupAddress: string;
  }>;
  subscription: {
    planName: string;
    monthlyAmount: number;
    status: string;
    startDate: string;
    trialEndDate: string;
    endDate: string;
    daysRemaining: number;
    cancellationScheduled: boolean;
    message: string;
  };
}
