import React from "react";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status?.toString().toUpperCase() || "PENDIENTE";

  let label = normalizedStatus;
  let colorClass = "bg-gray-100 text-gray-800 border-gray-200";

  switch (normalizedStatus) {
    case "PENDIENTE":
      label = "Pendiente";
      colorClass = "bg-amber-100 text-amber-800 border-amber-300";
      break;
    case "PENDIENTE_PAGO":
      label = "Pendiente de pago";
      colorClass = "bg-blue-100 text-blue-800 border-blue-300";
      break;
    case "PRUEBA_ACTIVA":
      label = "Prueba activa";
      colorClass = "bg-emerald-100 text-emerald-800 border-emerald-300";
      break;
    case "ACTIVA":
    case "ACTIVO":
      label = "Activa";
      colorClass = "bg-green-100 text-green-800 border-green-300";
      break;
    case "RECHAZADA":
      label = "Rechazada";
      colorClass = "bg-red-100 text-red-800 border-red-300";
      break;
    case "CANCELADA":
      label = "Cancelada";
      colorClass = "bg-stone-100 text-stone-800 border-stone-300";
      break;
    case "SUSPENDIDA":
      label = "Suspendida";
      colorClass = "bg-orange-100 text-orange-800 border-orange-300";
      break;
    case "VENCIDA":
      label = "Vencida";
      colorClass = "bg-rose-100 text-rose-800 border-rose-300";
      break;
    default:
      label = status;
      break;
  }

  return (
    <Badge variant="outline" className={`font-medium rounded-full px-2.5 py-0.5 ${colorClass}`}>
      {label}
    </Badge>
  );
}