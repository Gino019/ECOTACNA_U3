import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import RegisterCompanyPage from "./pages/RegisterCompanyPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminEmpresas from "./pages/admin/AdminEmpresas";
import AdminRecolectores from "./pages/admin/AdminRecolectores";
import AdminTransportes from "./pages/admin/AdminTransportes";
import EmpresaDashboard from "./pages/EmpresaDashboard";
import EmpresaSolicitarRecojo from "./pages/empresa/EmpresaSolicitarRecojo";
import EmpresaMisSolicitudes from "./pages/empresa/EmpresaMisSolicitudes";
import EmpresaSeguimiento from "./pages/empresa/EmpresaSeguimiento";
import EmpresaMiEmpresa from "./pages/empresa/EmpresaMiEmpresa";
import RecolectorDashboard from "./pages/RecolectorDashboard";
import RecolectorMapaOperativo from "./pages/recolector/RecolectorMapaOperativo";
import RecolectorSolicitudes from "./pages/recolector/RecolectorSolicitudes";
import RecolectorRecojosDia from "./pages/recolector/RecolectorRecojosDia";
import RecolectorMiEmpresa from "./pages/recolector/RecolectorMiEmpresa";
import RecolectorTransportes from "./pages/recolector/RecolectorTransportes";

import NotFound from "./pages/NotFound";
import SubscriptionStatusPage from "./pages/SubscriptionStatusPage";
import PaymentCheckoutPage from "./pages/PaymentCheckoutPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<RegisterCompanyPage />} />
          <Route path="/suscripcion/estado" element={<SubscriptionStatusPage />} />
          <Route path="/pagos/checkout" element={<PaymentCheckoutPage />} />

          <Route path="/admin" element={<Navigate to="/admin/resumen" replace />} />
          <Route path="/admin/resumen" element={<AdminDashboard />} />
          <Route path="/admin/empresas" element={<AdminEmpresas />} />
          <Route path="/admin/recolectores" element={<AdminRecolectores />} />
          <Route path="/admin/transportes" element={<AdminTransportes />} />
          <Route path="/empresa" element={<Navigate to="/empresa/resumen" replace />} />
          <Route path="/empresa/resumen" element={<EmpresaDashboard />} />
          <Route path="/empresa/solicitar-recojo" element={<EmpresaSolicitarRecojo />} />
          <Route path="/empresa/mis-solicitudes" element={<EmpresaMisSolicitudes />} />
          <Route path="/empresa/seguimiento" element={<EmpresaSeguimiento />} />
          <Route path="/empresa/mi-empresa" element={<EmpresaMiEmpresa />} />
          <Route path="/recolector" element={<Navigate to="/recolector/resumen" replace />} />
          <Route path="/recolector/resumen" element={<RecolectorDashboard />} />
          <Route path="/recolector/mapa-operativo" element={<RecolectorMapaOperativo />} />
          <Route path="/recolector/solicitudes" element={<RecolectorSolicitudes />} />
          <Route path="/recolector/recojos-dia" element={<RecolectorRecojosDia />} />
          <Route path="/recolector/mi-empresa" element={<RecolectorMiEmpresa />} />
          <Route path="/recolector/transportes" element={<RecolectorTransportes />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
