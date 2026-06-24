import { AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Incident {
  id: number;
  reasonCode: string;
  reasonLabel: string;
  customReason?: string;
  description?: string;
  status: string;
  createdAt: string;
  reporterRole?: string;
}

interface PickupIncidentSectionProps {
  incidents?: Incident[];
  observaciones?: string;
  showWhenEmpty?: boolean;
}

export const PickupIncidentSection = ({ incidents, observaciones, showWhenEmpty = false }: PickupIncidentSectionProps) => {
  const safeIncidents = incidents || [];
  
  if (safeIncidents.length === 0 && !observaciones && !showWhenEmpty) {
    return null;
  }

  const getFriendlyRole = (role?: string) => {
    if (!role) return "";
    const cleanRole = role.replace("ROLE_", "");
    if (cleanRole === "GENERADOR") return "Generador";
    if (cleanRole === "RECOLECTOR") return "Recolector";
    if (cleanRole === "ADMIN") return "Administrador";
    return cleanRole;
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "";
    return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: es });
  };

  return (
    <div className="space-y-2 mt-4">
      <h4 className="font-semibold text-destructive border-b border-destructive/30 pb-1">
        Incidencias reportadas
      </h4>
      <div className="space-y-3 mt-2">
        {safeIncidents.length > 0 ? (
          safeIncidents.map((inc) => (
            <div key={inc.id} className="bg-destructive/5 border border-destructive/20 p-3 rounded-md text-sm">
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-destructive">
                  Motivo: {(inc.reasonCode === "OTRO" || inc.reasonCode === "OTROS") ? `Otro motivo${inc.customReason ? ` - ${inc.customReason}` : ""}` : (inc.reasonLabel || inc.reason || "Motivo no especificado")}
                </span>
                <span className="text-xs text-muted-foreground">{formatDateTime(inc.createdAt)}</span>
              </div>
              {inc.description && <p className="text-muted-foreground italic mb-1">{inc.description}</p>}
              <div className="text-xs font-medium bg-white px-2 py-0.5 rounded border inline-block text-muted-foreground">
                Estado: {inc.status} {inc.reporterRole ? `| Reportado por: ${getFriendlyRole(inc.reporterRole)}` : ""}
              </div>
            </div>
          ))
        ) : observaciones ? (
          <div className="space-y-2">
            {observaciones.split('|').map((obsPart: string, idx: number) => {
               if (obsPart.includes('Motivo de rechazo:')) {
                 const parts = obsPart.split('Motivo de rechazo:');
                 return <p key={idx}><span className="font-semibold text-foreground">Motivo de rechazo:</span> {parts[1]?.trim()}</p>
               }
               return <p key={idx} className="italic text-muted-foreground">{obsPart.trim()}</p>
            })}
          </div>
        ) : (
          <p>Motivo no especificado.</p>
        )}
        <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded text-xs border border-blue-100 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
          <p>Si deseas continuar, registra una nueva solicitud corrigiendo la información observada.</p>
        </div>
      </div>
    </div>
  );
};
