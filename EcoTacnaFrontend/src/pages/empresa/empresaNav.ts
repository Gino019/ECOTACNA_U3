import { LayoutDashboard, Plus, Receipt, FileCheck2, Settings, Package, MapPinned } from "lucide-react";

export const empresaNav = [
  { to: "/empresa/resumen", label: "Resumen", icon: LayoutDashboard },
  { to: "/empresa/solicitar-recojo", label: "Solicitar recojo", icon: Plus },
  { to: "/empresa/mis-solicitudes", label: "Mis solicitudes", icon: Package },
  { to: "/empresa/seguimiento", label: "Seguimiento", icon: MapPinned },
  { to: "/empresa/mi-empresa", label: "Mi empresa", icon: Settings },
];

export const empresaUser = {
  name: "Pollería El Dorado",
  sub: "Carlos Mendoza · responsable@eldorado.com.pe",
};
