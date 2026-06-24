import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const estadoRecojoLabel: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  PROGRAMADO: 'Programado',
  EN_RUTA: 'En ruta',
  EN_SITIO: 'En sitio',
  RECOGIDO: 'Esperando confirmación',
  COMPLETADO: 'Completado',
  CANCELADO: 'Cancelado',
  RECHAZADO: 'Rechazado'
};

export const estadoRecojoBadgeClass: Record<string, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200',
  PROGRAMADO: 'bg-primary/10 text-primary hover:bg-primary/10 border-primary/20',
  EN_RUTA: 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200',
  EN_SITIO: 'bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200',
  RECOGIDO: 'bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200',
  COMPLETADO: 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200',
  CANCELADO: 'bg-destructive/10 text-destructive hover:bg-destructive/10 border-destructive/20',
  RECHAZADO: 'bg-destructive/10 text-destructive hover:bg-destructive/10 border-destructive/20'
};

export function getEstadoLabel(estado: string | undefined | null): string {
  if (!estado) return "Desconocido";
  const up = estado.toUpperCase();
  return estadoRecojoLabel[up] || estado;
}

export function getEstadoBadge(estado: string | undefined | null): string {
  if (!estado) return "bg-muted text-muted-foreground border-border";
  const up = estado.toUpperCase();
  return estadoRecojoBadgeClass[up] || "bg-muted text-muted-foreground border-border";
}
