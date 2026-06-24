import { LayoutDashboard, MapPinned, Package, Receipt, FileCheck2, Settings, Truck } from "lucide-react";

export const recolectorNav = [
  { to: "/recolector/resumen", label: "Resumen", icon: LayoutDashboard },
  { to: "/recolector/mapa-operativo", label: "Mapa operativo", icon: MapPinned },
  { to: "/recolector/recojos-dia", label: "Recojos disponibles", icon: Truck },
  { to: "/recolector/solicitudes", label: "Historial de recojos", icon: FileCheck2 },
  { to: "/recolector/transportes", label: "Mis unidades", icon: Truck },
  { to: "/recolector/mi-empresa", label: "Mi empresa", icon: Settings },
];

export const recolectorUser = {
  name: "Recolector",
  sub: "No autenticado",
};
