import { LayoutDashboard, Building2, Truck, Receipt, FileCheck2, Settings, Users, BarChart3, Bus } from "lucide-react";

export const adminNav = [
  { to: "/admin/resumen", label: "Resumen", icon: LayoutDashboard },
  { to: "/admin/empresas", label: "Empresas", icon: Building2 },
  { to: "/admin/recolectores", label: "Recolectores", icon: Truck },
  { to: "/admin/transportes", label: "Transportes", icon: Bus },
];

export const adminUser = {
  name: "Administrador EcoTacna",
  sub: "admin@ecotacna.com",
};
