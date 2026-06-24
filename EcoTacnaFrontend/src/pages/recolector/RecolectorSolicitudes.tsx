import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Download } from "lucide-react";
import { recolectorApi } from "@/services/recolectorApi";
import { getStoredAuth } from "@/services/authStorage";
import { recolectorNav } from "./recolectorNav";
import { formatDateTime, formatDate } from "@/utils/date";
import { toast } from "sonner";
import { getEstadoLabel, getEstadoBadge } from "@/lib/utils";
import { PickupIncidentSection } from "@/components/pickup/PickupIncidentSection";
export default function RecolectorSolicitudes() {
  const auth = getStoredAuth();
  const [user, setUser] = useState({ name: auth?.companyName || "Recolector", sub: auth?.email || "No autenticado" });
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedSolicitud, setSelectedSolicitud] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportDesde, setExportDesde] = useState("");
  const [exportHasta, setExportHasta] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const openModal = (solicitud: any) => {
    setSelectedSolicitud(solicitud);
    setIsModalOpen(true);
  };
  
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
      const blob = await recolectorApi.exportarHistorialExcel(exportDesde, exportHasta);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `historial-recolector-ecotacna-${exportDesde}-${exportHasta}.xlsx`;
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

  useEffect(() => {
    const loadData = async () => {
      try {
        const [resPerfil, resSolicitudes] = await Promise.all([
          recolectorApi.getPerfil(),
          recolectorApi.getSolicitudes(),
        ]);

        if (resPerfil.success && resPerfil.data) {
          setUser({ name: resPerfil.data.razonSocial, sub: resPerfil.data.correo || `RUC ${resPerfil.data.ruc}` });
          import("@/services/authStorage").then(({ saveAuth, getStoredAuth }) => {
            const currentAuth = getStoredAuth();
            if (currentAuth && currentAuth.companyName !== resPerfil.data.razonSocial) {
              saveAuth({ ...currentAuth, companyName: resPerfil.data.razonSocial });
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

  return (
    <DashboardShell role="Recolector" user={user} nav={recolectorNav}>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="font-display text-3xl font-bold">Historial de recojos</h1>
          <p className="text-sm text-muted-foreground">Historial completo de recojos y servicios completados.</p>
        </div>
        <Button onClick={() => setIsExportModalOpen(true)} variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Exportar Excel
        </Button>
      </div>

      <Card className="p-1 sm:p-5 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>F. Programada</TableHead>
              <TableHead>Volumen</TableHead>
              <TableHead>Precio/L</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {message ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">No se pudieron cargar las solicitudes: {message}</TableCell></TableRow>
            ) : solicitudes.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">No hay solicitudes registradas.</TableCell></TableRow>
            ) : (
              solicitudes.map((solicitud) => (
                <TableRow key={solicitud.id}>
                  <TableCell className="font-mono text-xs">{solicitud.id}</TableCell>
                  <TableCell>{solicitud.empresaRazonSocial || "Restaurante"}</TableCell>
                  <TableCell>{formatDate(solicitud.fechaProgramada)}</TableCell>
                  <TableCell className="font-mono">{solicitud.volumenAproximado?.toFixed(2)} L</TableCell>
                  <TableCell className="font-mono">{solicitud.precioOfertadoPorLitro != null ? `S/ ${Number(solicitud.precioOfertadoPorLitro).toFixed(2)}` : "-"}</TableCell>
                  <TableCell><Badge className={getEstadoBadge(solicitud.estado)}>{getEstadoLabel(solicitud.estado)}</Badge></TableCell>
                  <TableCell><Badge variant={solicitud.estadoPago === "PAGADO" ? "default" : "secondary"}>{solicitud.estadoPago || "PENDIENTE"}</Badge></TableCell>
                  <TableCell className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openModal(solicitud)}>
                      Ver detalle
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

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
                  <span className="font-medium text-muted-foreground">Empresa:</span>
                  <span className="line-clamp-1" title={selectedSolicitud.empresaRazonSocial}>{selectedSolicitud.empresaRazonSocial || "Restaurante"}</span>
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
                <h4 className="font-semibold text-primary border-b pb-1">2. Pago operativo</h4>
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

              {selectedSolicitud.estado === "CANCELADO" && (
                <div className="mt-4">
                  <PickupIncidentSection 
                    incidents={selectedSolicitud.incidencias} 
                    observaciones={selectedSolicitud.observaciones} 
                  />
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
                        const blob = await recolectorApi.descargarConstancia(selectedSolicitud.id);
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `constancia-recolector-ecotacna-solicitud-${selectedSolicitud.id}.pdf`;
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
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Generando PDF...
                      </span>
                    ) : (
                      "Descargar constancia PDF"
                    )}
                  </Button>
                ) : (
                  <div className="text-center text-sm text-muted-foreground italic bg-muted/30 p-2 rounded-md">
                    {selectedSolicitud.estado === "CANCELADO" 
                      ? "Constancia no disponible porque la solicitud fue cancelada."
                      : "Constancia no disponible hasta completar y pagar el recojo."}
                  </div>
                )}
                <div className="flex justify-end pt-2">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cerrar</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
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
