import { useState, useEffect } from "react";
import { X, Download, Building2, User, CreditCard, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/services/adminApi";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";

interface AdminCompanyDetailModalProps {
  companyId: number | null;
  onClose: () => void;
}

export function AdminCompanyDetailModal({ companyId, onClose }: AdminCompanyDetailModalProps) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (companyId) {
      setLoading(true);
      adminApi.getCompanyDetail(companyId)
        .then(res => setDetail(res.data))
        .catch(() => toast.error("Error al obtener detalle de la empresa"))
        .finally(() => setLoading(false));
    }
  }, [companyId]);

  if (!companyId) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await adminApi.downloadCompanyPdf(companyId, detail?.ruc || "desconocido");
      toast.success("PDF descargado correctamente");
    } catch (err: any) {
      toast.error(err.message || "Error al descargar la ficha PDF");
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "No registrado";
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-eco" />
            Detalle de Empresa
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="h-8 w-8 border-4 border-eco border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : detail ? (
            <div className="space-y-6">
              
              {/* Seccion 1 */}
              <div className="space-y-3">
                <h3 className="font-bold text-base flex items-center gap-2 text-primary border-b pb-2">
                  <Building2 className="h-4 w-4" /> Datos de Empresa
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground block text-xs">Razón Social</span><span className="font-medium">{detail.businessName || "No registrado"}</span></div>
                  <div><span className="text-muted-foreground block text-xs">RUC</span><span className="font-mono">{detail.ruc || "No registrado"}</span></div>
                  <div><span className="text-muted-foreground block text-xs">Tipo</span><span>{detail.companyType || "No registrado"}</span></div>
                  <div><span className="text-muted-foreground block text-xs mb-1">Estado de Cuenta</span><StatusBadge status={detail.subscriptionStatus} /></div>
                  <div className="md:col-span-2"><span className="text-muted-foreground block text-xs">Dirección</span><span>{detail.address || "No registrado"}</span></div>
                  <div className="md:col-span-2"><span className="text-muted-foreground block text-xs">Ubicación</span><span>{detail.district}, {detail.province}, {detail.department}</span></div>
                </div>
              </div>

              {/* Seccion 2 */}
              <div className="space-y-3">
                <h3 className="font-bold text-base flex items-center gap-2 text-primary border-b pb-2">
                  <User className="h-4 w-4" /> Datos de Contacto
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground block text-xs">Contacto</span><span className="font-medium">{detail.contactName || "No registrado"}</span></div>
                  <div><span className="text-muted-foreground block text-xs">Fecha de Inscripción</span><span>{formatDate(detail.registrationDate)}</span></div>
                  <div><span className="text-muted-foreground block text-xs">Correo Electrónico</span><span>{detail.contactEmail || "No registrado"}</span></div>
                  <div><span className="text-muted-foreground block text-xs">Número de Teléfono</span><span>{detail.contactPhone || "No registrado"}</span></div>
                </div>
              </div>

              {/* Seccion 3 */}
              <div className="space-y-3">
                <h3 className="font-bold text-base flex items-center gap-2 text-primary border-b pb-2">
                  <CreditCard className="h-4 w-4" /> Suscripción / Licencia
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground block text-xs">Plan Actual</span><span className="font-medium text-eco">{detail.planName || "Sin suscripción"}</span></div>
                  <div><span className="text-muted-foreground block text-xs">Monto Mensual</span><span>{detail.monthlyAmount ? `S/ ${detail.monthlyAmount}` : "No registrado"}</span></div>
                  <div><span className="text-muted-foreground block text-xs mb-1">Estado de Suscripción</span><StatusBadge status={detail.subscriptionStatus} /></div>
                  <div><span className="text-muted-foreground block text-xs">Fecha Inicio</span><span>{formatDate(detail.startDate)}</span></div>
                  <div><span className="text-muted-foreground block text-xs">Fecha Vencimiento</span><span>{formatDate(detail.currentPeriodEnd)}</span></div>
                  <div><span className="text-muted-foreground block text-xs">Último Pago</span><span>{detail.lastPaymentAmount ? `S/ ${detail.lastPaymentAmount}` : "No registrado"}</span></div>
                  <div><span className="text-muted-foreground block text-xs">Fecha Último Pago</span><span>{formatDate(detail.lastPaymentDate)}</span></div>
                </div>
              </div>

              {/* Seccion 4 */}
              <div className="space-y-3">
                <h3 className="font-bold text-base flex items-center gap-2 text-primary border-b pb-2">
                  <Activity className="h-4 w-4" /> Actividad
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div><span className="text-muted-foreground block text-xs">Solicitudes Totales</span><span className="font-medium">{detail.totalRequests ?? 0}</span></div>
                  <div><span className="text-muted-foreground block text-xs">Litros Acumulados</span><span className="font-medium text-eco">{detail.totalLitersCollected ?? 0} L</span></div>
                  <div><span className="text-muted-foreground block text-xs">Última Actividad</span><span>{formatDate(detail.lastActivityDate)}</span></div>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">No se pudo cargar la información.</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          <Button 
            className="bg-gradient-eco" 
            onClick={handleDownload} 
            disabled={loading || !detail || downloading}
          >
            <Download className="h-4 w-4 mr-2" /> 
            {downloading ? "Descargando..." : "Descargar ficha PDF"}
          </Button>
        </div>

      </div>
    </div>
  );
}
