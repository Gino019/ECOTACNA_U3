import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, QrCode, Download, CheckCircle2, Clock, AlertTriangle, X, MapPin, User, Droplets, CalendarDays, ClipboardCheck, CircleDot } from "lucide-react";
import { empresaApi } from "@/services/empresaApi";
import { ApiError } from "@/services/apiClient";
import { getStoredAuth } from "@/services/authStorage";
import { empresaNav } from "./empresaNav";
import { toast } from "sonner";
import { formatDateTime, formatDate } from "@/utils/date";
import { PickupIncidentSection } from "@/components/pickup/PickupIncidentSection";

// ─── Helper: mapa estado → paso activo en la línea de seguimiento ───────────
const getStepFromEstado = (estado: string, estadoPago: string, yaConfirmado: boolean): number => {
  const e = (estado || "").toUpperCase();
  const p = (estadoPago || "").toUpperCase();
  if (p === "PAGADO" || e === "COMPLETADO" || yaConfirmado) return 5;
  if (e === "RECOGIDO") return 4;
  if (e === "EN_CAMINO" || e === "EN CAMINO" || e === "EN_RUTA") return 3;
  if (e === "PROGRAMADO" || e === "ACEPTADO" || e === "ASIGNADO") return 2;
  if (e === "PENDIENTE") return 1;
  return 1;
};

const PASOS_SEGUIMIENTO = [
  { label: "Solicitud reportada",        icon: ClipboardCheck },
  { label: "Recolector asignado",        icon: User            },
  { label: "Recolector en camino",       icon: CircleDot       },
  { label: "Recojo confirmado",          icon: CheckCircle2    },
  { label: "Confirmación de pago",       icon: CheckCircle2    },
];

// ─── Colores de estado ────────────────────────────────────────────────────────
const isRequestExpired = (solicitud: any): boolean => {
  if (!solicitud || (solicitud.estado || "").toUpperCase() !== "PENDIENTE") return false;
  const created = new Date(solicitud.fechaSolicitud || solicitud.createdAt).getTime();
  const limit = solicitud.availableUntil 
    ? new Date(solicitud.availableUntil).getTime() 
    : created + 7 * 24 * 60 * 60 * 1000;
  const now = new Date().getTime();
  return now > limit;
};

const estadoColor = (estado: string, isExpired: boolean = false) => {
  if (isExpired) return "bg-red-100 text-red-700 border-red-200";
  const e = (estado || "").toUpperCase();
  if (e === "COMPLETADO") return "bg-green-100 text-green-700 border-green-200";
  if (e === "EN_CAMINO" || e === "EN CAMINO" || e === "EN_RUTA") return "bg-blue-100 text-blue-700 border-blue-200";
  if (e === "PROGRAMADO" || e === "ACEPTADO") return "bg-primary/10 text-primary border-primary/20";
  if (e === "PENDIENTE") return "bg-amber-100 text-amber-700 border-amber-200";
  if (e === "CANCELADO") return "bg-red-100 text-red-700 border-red-200";
  return "bg-muted text-muted-foreground border-border";
};



export default function EmpresaMisSolicitudes() {
  const auth = getStoredAuth();
  const [user, setUser] = useState({ name: auth?.companyName || "Empresa", sub: auth?.email || "No autenticado" });
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  // ── Modal "Ver detalle" (conservado intacto) ────────────────────────────────
  const [selectedSolicitud, setSelectedSolicitud] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [incidencias, setIncidencias] = useState<any[]>([]);

  const openModal = async (solicitud: any) => {
    setSelectedSolicitud(solicitud);
    setIsModalOpen(true);
    try {
      const res = await empresaApi.listarIncidenciasSolicitud(solicitud.id);
      if (res.success && res.data) {
        setIncidencias(res.data);
      } else {
        setIncidencias([]);
      }
    } catch (e) {
      setIncidencias([]);
    }
  };

  // ── Modal "Reportar Incidencia" ───────────────────────────────────────────────
  const [isReportIncidenciaOpen, setIsReportIncidenciaOpen] = useState(false);
  const [incidenciaReasonCode, setIncidenciaReasonCode] = useState("");
  const [incidenciaCustomReason, setIncidenciaCustomReason] = useState("");
  const [incidenciaDescription, setIncidenciaDescription] = useState("");
  const [isEnviandoIncidencia, setIsEnviandoIncidencia] = useState(false);

  const openReportIncidencia = () => {
    setIncidenciaReasonCode("");
    setIncidenciaCustomReason("");
    setIncidenciaDescription("");
    setIsReportIncidenciaOpen(true);
  };

  const handleEnviarIncidencia = async () => {
    const solicitudActiva = isSeguimientoOpen ? selectedSeguimiento : selectedSolicitud;
    if (!solicitudActiva) return;

    if (!incidenciaReasonCode) {
      toast.error("Seleccione un motivo de incidencia.");
      return;
    }
    if (incidenciaReasonCode === "OTRO" && !incidenciaCustomReason.trim()) {
      toast.error("Describa el motivo personalizado.");
      return;
    }
    setIsEnviandoIncidencia(true);
    try {
      const payload = {
        reasonCode: incidenciaReasonCode,
        customReason: incidenciaReasonCode === "OTRO" ? incidenciaCustomReason : undefined,
        description: incidenciaDescription || undefined
      };
      const res = await empresaApi.crearIncidenciaSolicitud(solicitudActiva.id, payload);
      if (res.success) {
        toast.success("Incidencia reportada correctamente.");
        setIsReportIncidenciaOpen(false);
        // Refrescar incidencias
        const resIncidencias = await empresaApi.listarIncidenciasSolicitud(solicitudActiva.id);
        if (resIncidencias.success && resIncidencias.data) setIncidencias(resIncidencias.data);
        
        // Refrescar la lista de solicitudes y la seleccionada para reflejar el estado CANCELADO
        const resSolicitudes = await empresaApi.getSolicitudes();
        if (resSolicitudes.success && resSolicitudes.data) {
          setSolicitudes(resSolicitudes.data);
          const actualizada = resSolicitudes.data.find((s: any) => s.id === solicitudActiva.id);
          if (actualizada) {
            if (isSeguimientoOpen) setSelectedSeguimiento(actualizada);
            else setSelectedSolicitud(actualizada);
          }
        }
      } else {
        toast.error(res.message || "Error al reportar la incidencia.");
      }
    } catch (e: any) {
      toast.error(e.message || "Error al reportar la incidencia.");
    } finally {
      setIsEnviandoIncidencia(false);
    }
  };

  // ── Modal "Exportar Excel" (conservado intacto) ─────────────────────────────
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportDesde, setExportDesde] = useState("");
  const [exportHasta, setExportHasta] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = async () => {
    if (!exportDesde || !exportHasta) {
      toast.error("Debe seleccionar ambas fechas.");
      return;
    }
    if (exportDesde > exportHasta) {
      toast.error("La fecha 'desde' no puede ser mayor a 'hasta'.");
      return;
    }
    try {
      setIsExporting(true);
      const blob = await empresaApi.exportarSolicitudesExcel(exportDesde, exportHasta);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `historial-empresa-ecotacna-${exportDesde}-${exportHasta}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setIsExportModalOpen(false);
      toast.success("Historial exportado correctamente.");
    } catch (error: any) {
      toast.error(error.message || "Error al exportar a Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  // ── Modal "Ver seguimiento" (NUEVO – Fase 3C) ───────────────────────────────
  const [selectedSeguimiento, setSelectedSeguimiento] = useState<any | null>(null);
  const [isSeguimientoOpen, setIsSeguimientoOpen] = useState(false);

  // Confirmación visual de pago (sin endpoint real del restaurante)
  const [pagoConfirmadoVisual, setPagoConfirmadoVisual] = useState<Record<number, boolean>>({});
  const [isConfirmandoPago, setIsConfirmandoPago] = useState(false);

  const [isCancelando, setIsCancelando] = useState(false);

  const openSeguimiento = async (solicitud: any) => {
    setSelectedSeguimiento(solicitud);
    setIsSeguimientoOpen(true);
    try {
      const res = await empresaApi.listarIncidenciasSolicitud(solicitud.id);
      if (res.success && res.data) {
        setIncidencias(res.data);
      } else {
        setIncidencias([]);
      }
    } catch (e) {
      setIncidencias([]);
    }
  };




  const handleCancelarSolicitud = async (solicitudId: number) => {
    if (!window.confirm("¿Seguro que deseas cancelar esta solicitud? Esta acción no se puede deshacer.")) return;
    setIsCancelando(true);
    try {
      const res = await empresaApi.cancelarSolicitud(solicitudId);
      if (res.success) {
        toast.success("Solicitud cancelada correctamente.");
        setIsSeguimientoOpen(false);
        // Recargar listado
        const resSolicitudes = await empresaApi.getSolicitudes();
        if (resSolicitudes.success && resSolicitudes.data) {
          setSolicitudes(resSolicitudes.data);
        }
      } else {
        toast.error(res.message || "Error al cancelar la solicitud");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al cancelar la solicitud");
    } finally {
      setIsCancelando(false);
    }
  };

  // ── Carga de datos ──────────────────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      try {
        const [resPerfil, resSolicitudes] = await Promise.all([
          empresaApi.getPerfil(),
          empresaApi.getSolicitudes(),
        ]);
        if (resPerfil.success && resPerfil.data) {
          setUser({ name: (resPerfil.data as any).razonSocial, sub: (resPerfil.data as any).correo || `RUC ${(resPerfil.data as any).ruc}` });
          import("@/services/authStorage").then(({ saveAuth, getStoredAuth }) => {
            const currentAuth = getStoredAuth();
            if (currentAuth && currentAuth.companyName !== (resPerfil.data as any).razonSocial) {
              saveAuth({ ...currentAuth, companyName: (resPerfil.data as any).razonSocial });
            }
          });
        }
        if (resSolicitudes.success) {
          setSolicitudes(resSolicitudes.data || []);
        } else {
          setMessage(resSolicitudes.message || "No se pudieron cargar las solicitudes");
        }
      } catch (error: any) {
        setMessage(error.message || "Error de red");
      }
    };
    loadData();
  }, []);


  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <DashboardShell role="Empresa" user={user} nav={empresaNav}>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <Badge className="bg-primary text-primary-foreground mb-2">Operaciones</Badge>
          {message ? <Badge variant="outline" className="ml-2 text-destructive border-destructive">{message}</Badge> : null}
          <h1 className="font-display text-3xl font-bold">Mis solicitudes</h1>
          <p className="text-sm text-muted-foreground">Historial real de solicitudes de la empresa.</p>
        </div>
        <Button onClick={() => setIsExportModalOpen(true)} variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Exportar Excel
        </Button>
      </div>

      <Card className="p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>F. Solicitud</TableHead>
              <TableHead>F. Programada</TableHead>
              <TableHead>Volumen</TableHead>
              <TableHead>Precio/L</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Recolector / Placa</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {message ? (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-6">No se pudieron cargar las solicitudes: {message}</TableCell></TableRow>
            ) : solicitudes.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-6">No hay solicitudes registradas.</TableCell></TableRow>
            ) : (
              solicitudes.map((solicitud) => (
                <TableRow key={solicitud.id}>
                  <TableCell className="font-mono text-xs">{solicitud.id}</TableCell>
                  <TableCell>{formatDateTime(solicitud.fechaSolicitud)}</TableCell>
                  <TableCell>{formatDate(solicitud.fechaProgramada)}</TableCell>
                  <TableCell className="font-mono">{solicitud.volumenAproximado.toFixed(2)} L</TableCell>
                  <TableCell className="font-mono">
                    {solicitud.estado === "PENDIENTE" || solicitud.estado === "PROGRAMADO"
                      ? <span className="text-xs italic text-muted-foreground">Pendiente</span> 
                      : (solicitud.precioPorLitro != null ? `S/ ${Number(solicitud.precioPorLitro).toFixed(2)}` : "Pendiente")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={estadoColor(solicitud.estado, isRequestExpired(solicitud))}>
                      {isRequestExpired(solicitud) ? "EXPIRADO" : solicitud.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {solicitud.recolectorAsignado ? (
                      <div className="text-xs">
                        <div className="font-semibold text-primary">{solicitud.recolectorAsignado}</div>
                        <div className="text-muted-foreground">Placa: {solicitud.transportePlaca || "No registrado"}</div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No asignado</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={solicitud.estadoPago === "PAGADO" ? "default" : "secondary"}>
                      {solicitud.estadoPago || "PENDIENTE"}
                    </Badge>
                  </TableCell>
                  {/* ── Dos botones de acción ─────────────────────────────── */}
                  <TableCell>
                    <div className="flex flex-col gap-1.5 min-w-[130px]">
                      {/* Botón original "Ver detalle" — INTACTO */}
                      <Button variant="outline" size="sm" onClick={() => openModal(solicitud)}>
                        Ver detalle
                      </Button>
                      {/* Botón nuevo "Ver seguimiento" — Fase 3C */}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openSeguimiento(solicitud)}
                        className="gap-1 text-xs"
                      >
                        Ver seguimiento
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL VER DETALLE — CONSERVADO INTACTO (constancia PDF incluida)
      ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Detalle de la Solicitud</DialogTitle>
          </DialogHeader>
          {selectedSolicitud && (
            <div className="space-y-4 text-sm mt-4 overflow-y-auto max-h-[70vh] pr-2">
              <div className="space-y-2">
                <h4 className="font-semibold text-primary border-b pb-1">1. Datos del recojo</h4>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  <span className="font-medium text-muted-foreground">ID:</span>
                  <span>{selectedSolicitud.id}</span>
                  <span className="font-medium text-muted-foreground">Estado:</span>
                  <span><Badge variant="outline">{selectedSolicitud.estado}</Badge></span>
                  <span className="font-medium text-muted-foreground">F. Solicitud:</span>
                  <span>{formatDateTime(selectedSolicitud.fechaSolicitud)}</span>
                  <span className="font-medium text-muted-foreground">F. Programada:</span>
                  <span>{formatDate(selectedSolicitud.fechaProgramada)}</span>
                  <span className="font-medium text-muted-foreground">Volumen Aprox:</span>
                  <span>{selectedSolicitud.volumenAproximado?.toFixed(2)} L</span>
                  <span className="font-medium text-muted-foreground">Dirección:</span>
                  <span>{selectedSolicitud.direccion || "No registrado"}</span>
                  <span className="font-medium text-muted-foreground">Observaciones:</span>
                  <span>{selectedSolicitud.observaciones || "-"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-primary border-b pb-1">2. Precio de recolección</h4>
                {selectedSolicitud.estado !== "PENDIENTE" && selectedSolicitud.estado !== "PROGRAMADO" && selectedSolicitud.precioPorLitro != null ? (
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 bg-muted/50 p-2 rounded-md">
                    <span className="font-medium text-muted-foreground">Precio acordado por el recolector:</span>
                    <span>S/ {Number(selectedSolicitud.precioPorLitro).toFixed(2)} / L</span>
                    <span className="font-medium text-muted-foreground">Monto Total:</span>
                    <span>S/ {selectedSolicitud.montoTotal != null ? Number(selectedSolicitud.montoTotal).toFixed(2) : "0.00"}</span>
                  </div>
                ) : (
                  <div className="bg-amber-100 text-amber-700 p-2 rounded-md text-xs italic">
                    Pendiente de confirmación. El recolector definirá el precio al momento del recojo.
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-primary border-b pb-1">3. Pago operativo</h4>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 bg-primary/5 p-2 rounded-md">
                  <span className="font-medium text-muted-foreground">Estado Pago:</span>
                  <span>
                    {selectedSolicitud.estado === "CANCELADO" ? (
                      <Badge variant="secondary">No aplica</Badge>
                    ) : (
                      <Badge variant={selectedSolicitud.estadoPago === "PAGADO" ? "default" : "secondary"}>
                        {selectedSolicitud.estadoPago || "PENDIENTE"}
                      </Badge>
                    )}
                  </span>
                  <span className="font-medium text-muted-foreground">Litros Confirmados:</span>
                  <span>{selectedSolicitud.estado === "CANCELADO" ? "No aplica" : (selectedSolicitud.litrosConfirmados != null ? `${selectedSolicitud.litrosConfirmados.toFixed(2)} L` : "Pendiente")}</span>
                  <span className="font-medium text-muted-foreground">Precio Aplicado:</span>
                  <span>{selectedSolicitud.estado === "CANCELADO" ? "No aplica" : (selectedSolicitud.precioPorLitro != null ? `S/ ${Number(selectedSolicitud.precioPorLitro).toFixed(2)} / L` : "Pendiente")}</span>
                  <span className="font-medium text-muted-foreground">Monto Final:</span>
                  <span className={selectedSolicitud.estado === "CANCELADO" ? "text-muted-foreground" : "font-bold text-primary"}>
                    {selectedSolicitud.estado === "CANCELADO" ? "No aplica" : (selectedSolicitud.montoTotal != null ? `S/ ${Number(selectedSolicitud.montoTotal).toFixed(2)}` : "Pendiente")}
                  </span>
                  {selectedSolicitud.fechaConfirmacionPago && (
                    <>
                      <span className="font-medium text-muted-foreground">F. Confirmación:</span>
                      <span>{formatDateTime(selectedSolicitud.fechaConfirmacionPago)}</span>
                    </>
                  )}
                  {selectedSolicitud.observacionPago && (
                    <>
                      <span className="font-medium text-muted-foreground">Obs. Pago:</span>
                      <span className="italic">{selectedSolicitud.observacionPago}</span>
                    </>
                  )}
                </div>
              </div>

              {selectedSolicitud.recolectorAsignado && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-primary border-b pb-1">4. Recolector asignado</h4>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                    <span className="font-medium text-muted-foreground">Empresa Recolectora:</span>
                    <span>{selectedSolicitud.recolectorAsignado}</span>
                    <span className="font-medium text-muted-foreground">Placa Unidad:</span>
                    <span>{selectedSolicitud.transportePlaca || "No registrado"}</span>
                  </div>
                </div>
              )}

              {incidencias.length > 0 && (
                <div className="space-y-2 mt-4">
                  <h4 className="font-semibold text-destructive border-b border-destructive/30 pb-1">5. Incidencias reportadas</h4>
                  <div className="space-y-3 mt-2">
                    {incidencias.map((inc: any) => (
                      <div key={inc.id} className="bg-destructive/5 border border-destructive/20 p-3 rounded-md text-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-destructive">
                            Motivo: {inc.reasonCode === "OTROS" ? `Otros - ${inc.customReason}` : inc.reasonLabel}
                          </span>
                          <span className="text-xs text-muted-foreground">{formatDateTime(inc.createdAt)}</span>
                        </div>
                        {inc.description && <p className="text-muted-foreground italic mb-1">{inc.description}</p>}
                        <div className="text-xs font-medium bg-white px-2 py-0.5 rounded border inline-block text-muted-foreground">
                          Estado: {inc.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4 mt-2 flex flex-col gap-2">
                {selectedSolicitud.estado === "COMPLETADO" && selectedSolicitud.estadoPago === "PAGADO" ? (
                  <Button
                    className="w-full bg-primary"
                    disabled={isDownloadingPdf}
                    onClick={async () => {
                      try {
                        setIsDownloadingPdf(true);
                        const blob = await empresaApi.descargarConstancia(selectedSolicitud.id);
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `constancia-ecotacna-solicitud-${selectedSolicitud.id}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        window.URL.revokeObjectURL(url);
                        toast.success("Constancia PDF descargada correctamente.");
                      } catch (err: any) {
                        toast.error(err.message || "No se pudo descargar la constancia PDF.");
                      } finally {
                        setIsDownloadingPdf(false);
                      }
                    }}
                  >
                    {isDownloadingPdf ? (
                      <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Generando PDF...</span>
                    ) : (
                      "Descargar constancia PDF"
                    )}
                  </Button>
                ) : (
                  <div className="text-center text-sm text-muted-foreground italic bg-muted/30 p-2 rounded-md">
                    {selectedSolicitud.estado === "CANCELADO" 
                      ? "Constancia no disponible porque la solicitud fue cancelada." 
                      : "Constancia no disponible hasta confirmar el pago."}
                  </div>
                )}
                <div className="flex justify-end items-center pt-2">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cerrar</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL REPORTAR INCIDENCIA
      ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isReportIncidenciaOpen} onOpenChange={setIsReportIncidenciaOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Reportar incidencia
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Motivo de incidencia <span className="text-destructive">*</span></label>
              <select 
                className="w-full border rounded-md p-2 text-sm" 
                value={incidenciaReasonCode} 
                onChange={e => setIncidenciaReasonCode(e.target.value)}
              >
                <option value="">-- Seleccione un motivo --</option>
                <option value="RECOLECTOR_NO_LLEGO">El recolector no llegó</option>
                <option value="RECOLECTOR_LLEGO_TARDE">El recolector llegó tarde</option>
                <option value="RECOLECTOR_NO_ACEPTO_CONDICIONES">El recolector no aceptó las condiciones acordadas</option>
                <option value="RECOLECTOR_NO_TENIA_CAPACIDAD">El recolector no tenía capacidad suficiente</option>
                <option value="RECOLECTOR_NO_TRAJO_UNIDAD_ADECUADA">El recolector no trajo una unidad adecuada</option>
                <option value="NO_SE_CONCRETO_RECOJO">No se concretó el recojo</option>
                <option value="ERROR_EN_DATOS_SOLICITUD">Error en los datos de la solicitud</option>
                <option value="OTRO">Otro motivo</option>
              </select>
            </div>
            {incidenciaReasonCode === "OTRO" && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Describe el motivo <span className="text-destructive">*</span></label>
                <input 
                  type="text" 
                  maxLength={255}
                  className="w-full border rounded-md p-2 text-sm" 
                  value={incidenciaCustomReason} 
                  onChange={e => setIncidenciaCustomReason(e.target.value)}
                  placeholder="Especifique el motivo..."
                />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium">Descripción adicional (opcional)</label>
              <textarea 
                className="w-full border rounded-md p-2 text-sm h-20" 
                maxLength={1000}
                value={incidenciaDescription} 
                onChange={e => setIncidenciaDescription(e.target.value)}
                placeholder="Brinde más detalles sobre lo ocurrido..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReportIncidenciaOpen(false)} disabled={isEnviandoIncidencia}>Cancelar</Button>
            <Button variant="destructive" onClick={handleEnviarIncidencia} disabled={isEnviandoIncidencia}>
              {isEnviandoIncidencia ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Enviar incidencia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL VER SEGUIMIENTO — NUEVO (Fase 3C)
      ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isSeguimientoOpen} onOpenChange={(v) => { setIsSeguimientoOpen(v); }}>
        <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden">
          {selectedSeguimiento && (() => {
            const s = selectedSeguimiento;
            const paso = getStepFromEstado(s.estado, s.estadoPago, false);
            const esPendiente = (s.estado || "").toUpperCase() === "PENDIENTE";

            const hasCollector =
              s.hasAssignedCollector === true ||
              Boolean(s.collectorUserId) ||
              Boolean(s.collectorCompanyId) ||
              Boolean(s.transportUnitId) ||
              Boolean(s.recolectorAsignado);

            const isFinalState = ["CANCELADO", "COMPLETADO", "EXPIRADO"].includes((s.status ?? s.estado ?? "").toUpperCase());
            
            const solicitudIncidencias = Array.isArray(s.incidencias) ? s.incidencias : [];
            const modalIncidencias = Array.isArray(incidencias) ? incidencias : [];
            const hasPriorIncidents = solicitudIncidencias.length > 0 || modalIncidencias.length > 0;

            const canReportIncident = hasCollector && !isFinalState && !hasPriorIncidents &&
              ["PENDIENTE", "PROGRAMADO", "EN_RUTA", "EN_CAMINO", "EN CAMINO", "EN_SITIO"].includes((s.status ?? s.estado ?? "").toUpperCase());

            const canSimpleCancel = !hasCollector && (s.status ?? s.estado ?? "").toUpperCase() === "PENDIENTE";

            const litrosVisual = s.litrosConfirmados != null ? s.litrosConfirmados : s.volumenAproximado;
            const precioVisual = s.precioPorLitro != null ? s.precioPorLitro : s.precioOfertadoPorLitro;
            const montoVisual = s.montoTotal != null ? s.montoTotal : (litrosVisual != null && precioVisual != null ? Number(litrosVisual) * Number(precioVisual) : null);
            
            let fechaVisual = "Sin información disponible";
            if (s.fechaConfirmacionPago) {
              fechaVisual = formatDateTime(s.fechaConfirmacionPago);
            } else if ((s.estado || "").toUpperCase() === "RECOGIDO") {
              fechaVisual = "Pendiente de confirmación final";
            } else if ((s.estado || "").toUpperCase() === "COMPLETADO" || (s.estadoPago || "").toUpperCase() === "PAGADO") {
              fechaVisual = "Confirmado recientemente";
            }

            return (
              <>
                {/* Cabecera */}
                <div className="p-6 border-b border-border bg-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Solicitud creada el {formatDateTime(s.fechaSolicitud)}
                      </p>
                      <h2 className="text-2xl font-bold text-foreground/90">Detalle de solicitud</h2>
                    </div>
                     <Badge variant="outline" className={`px-3 py-1 text-sm font-semibold ${estadoColor(s.estado, isRequestExpired(s))}`}>
                       {isRequestExpired(s) ? "EXPIRADO" : (s.estado?.replace("_", " ") || "PENDIENTE")}
                     </Badge>
                  </div>
                </div>

                <div className="overflow-y-auto max-h-[75vh]">
                  {/* Datos principales */}
                  <div className="p-6 border-b border-border">
                    <div className="flex items-start gap-5">
                      <div className="bg-primary/10 rounded-xl p-3 hidden sm:block shrink-0">
                        <User className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-foreground/90">{s.empresaRazonSocial || "Empresa"}</h3>
                        {s.direccion && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                            <MapPin className="h-3.5 w-3.5 text-primary" />
                            <span>{s.direccion}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-4 gap-4 mt-5">
                      <div className="bg-muted/40 rounded-lg p-3 border border-border">
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Droplets className="h-3 w-3" /> Cantidad reportada</p>
                        <p className="font-bold text-primary">{s.volumenAproximado?.toFixed(2)} litros</p>
                      </div>
                      <div className="bg-muted/40 rounded-lg p-3 border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Tipo de aceite</p>
                        <p className="font-semibold text-sm text-foreground/80">Aceite vegetal usado</p>
                      </div>
                      <div className="bg-muted/40 rounded-lg p-3 border border-border">
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Fecha programada</p>
                        <p className="font-semibold text-sm">{s.fechaProgramada ? formatDate(s.fechaProgramada) : "No definida"}</p>
                      </div>
                      <div className="bg-muted/40 rounded-lg p-3 border border-border">
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><User className="h-3 w-3" /> Recolector asignado</p>
                        {s.recolectorAsignado ? (
                          <>
                            <p className="font-semibold text-sm text-primary">{s.recolectorAsignado}</p>
                            {s.transportePlaca && <p className="text-xs text-muted-foreground">{s.transportePlaca}</p>}
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Sin asignar</p>
                        )}
                      </div>
                    </div>

                    {s.observaciones && (
                      <div className="mt-3 p-3 bg-muted/30 rounded-md border border-border text-sm">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Observación</p>
                        <p className="italic text-foreground/80">"{s.observaciones}"</p>
                      </div>
                    )}
                  </div>

                  {s.estado === "CANCELADO" ? (
                    <PickupIncidentSection 
                      incidents={s.incidencias || incidencias} 
                      observaciones={s.observaciones} 
                    />
                  ) : (
                    <>
                      {/* Línea de seguimiento */}
                      <div className="p-6 border-b border-border">
                        <h4 className="font-bold text-base mb-5">Seguimiento del recojo</h4>
                        <div className="relative">
                          {/* Línea base */}
                          <div className="absolute top-5 left-5 right-5 h-0.5 bg-border" />
                          {/* Línea de progreso */}
                          <div
                            className="absolute top-5 left-5 h-0.5 bg-primary transition-all duration-500"
                            style={{ width: `${Math.min(((paso - 1) / (PASOS_SEGUIMIENTO.length - 1)) * 100, 100)}%` }}
                          />
                          <div className="relative flex justify-between">
                            {PASOS_SEGUIMIENTO.map((p, i) => {
                              const stepNum = i + 1;
                              const activo = stepNum <= paso;
                              const esActual = stepNum === paso;
                              
                              const isLastStepCompleted = stepNum === 5 && paso === 5;
                              const visualEsActual = esActual && !isLastStepCompleted;

                              const Icon = p.icon;
                              return (
                                <div key={i} className="flex flex-col items-center gap-2 w-[19%]">
                                  <div className={`z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                                    ${activo
                                      ? visualEsActual
                                        ? "bg-primary/10 border-primary text-primary"
                                        : "bg-primary border-primary text-white"
                                      : "bg-white border-border text-muted-foreground"
                                    }`}
                                  >
                                    {activo && !visualEsActual
                                      ? <CheckCircle2 className="h-5 w-5" />
                                      : <Icon className={`h-5 w-5 ${visualEsActual ? "animate-pulse" : ""}`} />
                                    }
                                  </div>
                                  <div className="text-center">
                                    <p className={`text-xs font-medium leading-tight ${activo ? "text-foreground" : "text-muted-foreground"}`}>
                                      {p.label}
                                    </p>
                                    {stepNum === 1 && s.fechaSolicitud && (
                                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(s.fechaSolicitud)}</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Bloque de confirmación de pago */}
                      <div className="p-6 border-b border-border">
                        {(s.estado || "").toUpperCase() === "COMPLETADO" ? (
                          <div className="space-y-4">
                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                              <p className="text-sm font-semibold text-primary mb-3">Resumen final del recojo</p>
                              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                                <div>
                                  <p className="text-xs text-muted-foreground">Litros reales recogidos</p>
                                  <p className="font-medium">{litrosVisual != null ? `${Number(litrosVisual).toFixed(2)} L` : "Sin información disponible"}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Precio acordado</p>
                                  <p className="font-medium">{precioVisual != null ? `S/ ${Number(precioVisual).toFixed(2)} / L` : "Sin información disponible"}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Monto total registrado</p>
                                  <p className="font-bold text-primary text-base">{montoVisual != null ? `S/ ${Number(montoVisual).toFixed(2)}` : "Sin información disponible"}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Estado</p>
                                  <p className="font-medium text-green-700">Pago externo registrado</p>
                                </div>
                              </div>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                              El pago fue acordado directamente entre restaurante y recolector. EcoTacna conserva la constancia del recojo para consulta.
                            </div>
                            <Button
                              className="w-full bg-primary"
                              disabled={isDownloadingPdf}
                              onClick={async () => {
                                try {
                                  setIsDownloadingPdf(true);
                                  const blob = await empresaApi.descargarConstancia(s.id);
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = `constancia-ecotacna-solicitud-${s.id}.pdf`;
                                  document.body.appendChild(a);
                                  a.click();
                                  a.remove();
                                  window.URL.revokeObjectURL(url);
                                  toast.success("Constancia PDF descargada correctamente.");
                                } catch (err: any) {
                                  toast.error(err.message || "No se pudo descargar la constancia PDF.");
                                } finally {
                                  setIsDownloadingPdf(false);
                                }
                              }}
                            >
                              {isDownloadingPdf ? (
                                <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Generando PDF...</span>
                              ) : (
                                "Descargar constancia PDF"
                              )}
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                              <span className="font-bold border border-blue-500 rounded-full w-5 h-5 flex items-center justify-center text-[11px] text-blue-600 shrink-0 mt-0.5">i</span>
                              <div>
                                <p className="text-sm font-semibold text-blue-700">Esperando finalización del recojo</p>
                                <p className="text-xs text-blue-600 mt-0.5">Los datos finales de recolección y pago aparecerán aquí cuando el recolector cierre el proceso.</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                  </>
                  )}

                  {/* Botones de acción inferiores */}
                  <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-3">


                    <div className="flex flex-col sm:flex-row justify-between w-full items-center">
                      {canReportIncident ? (
                        <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto mb-3 sm:mb-0" onClick={openReportIncidencia}>
                          Reportar incidencia
                        </Button>
                      ) : (
                        <div />
                      )}
                      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        {/* Cancelar solicitud — solo si PENDIENTE y sin recolector */}
                        {canSimpleCancel ? (
                          <Button
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 underline text-sm w-full sm:w-auto"
                            disabled={isCancelando}
                            onClick={() => handleCancelarSolicitud(s.id)}
                          >
                            {isCancelando ? "Cancelando..." : "Cancelar solicitud"}
                          </Button>
                        ) : null}
                        <Button variant="outline" onClick={() => setIsSeguimientoOpen(false)}>
                          Cerrar
                        </Button>
                      </div>
                    </div>
                  </div>


                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL EXPORTAR EXCEL — CONSERVADO INTACTO
      ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl text-primary font-bold">Exportar a Excel</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Desde:</label>
              <input
                type="date"
                value={exportDesde}
                onChange={(e) => setExportDesde(e.target.value)}
                className="w-full border rounded-md p-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Hasta:</label>
              <input
                type="date"
                value={exportHasta}
                onChange={(e) => setExportHasta(e.target.value)}
                className="w-full border rounded-md p-2"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsExportModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleExportExcel} disabled={isExporting} className="bg-primary gap-2">
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {isExporting ? "Generando..." : "Exportar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardShell>
  );
}
