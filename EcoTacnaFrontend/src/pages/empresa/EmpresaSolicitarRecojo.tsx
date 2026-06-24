import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Droplets, MapPinned, Send, Info, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/DashboardShell";
import { GoogleMapView } from "@/components/maps/GoogleMapView";
import { MapLatLng } from "@/components/maps/mapTypes";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { empresaApi } from "@/services/empresaApi";
import { getStoredAuth } from "@/services/authStorage";
import { empresaNav } from "./empresaNav";
import { formatDateTime, formatDate } from "@/utils/date";
import { PickupAvailabilityTimer } from "@/components/pickup/PickupAvailabilityTimer";

export default function EmpresaSolicitarRecojo() {
  const auth = getStoredAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: auth?.companyName || "Empresa", sub: auth?.email || "No autenticado" });
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Active request state
  const [activeRequest, setActiveRequest] = useState<any | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Mandatory fields
  const [volumen, setVolumen] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [confirmacion, setConfirmacion] = useState(false);
  const [selectedPickupLocation, setSelectedPickupLocation] = useState<MapLatLng | null>(null);

  const [companyLocations, setCompanyLocations] = useState<any[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");

  // Optional fields
  const [cantidadEnvases, setCantidadEnvases] = useState("");
  const [observaciones, setObservaciones] = useState("");

  // Hidden / Default payload fields
  const [direccionPerfil, setDireccionPerfil] = useState("Ubicación referencial pendiente de precisión");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [resPerfil, resActiva] = await Promise.all([
          empresaApi.getPerfil(),
          empresaApi.getSolicitudActiva()
        ]);
        
        if (resPerfil.success && resPerfil.data) {
          setUser({ name: resPerfil.data.razonSocial, sub: resPerfil.data.correo || `RUC ${resPerfil.data.ruc}` });
          import("@/services/authStorage").then(({ saveAuth, getStoredAuth }) => {
            const currentAuth = getStoredAuth();
            if (currentAuth && currentAuth.companyName !== resPerfil.data.razonSocial) {
              saveAuth({ ...currentAuth, companyName: resPerfil.data.razonSocial });
            }
          });
          if (resPerfil.data.direccion && resPerfil.data.direccion !== "No registrado") {
            setDireccionPerfil(resPerfil.data.direccion);
          }
          if (resPerfil.data.locations && Array.isArray(resPerfil.data.locations) && resPerfil.data.locations.length > 0) {
            setCompanyLocations(resPerfil.data.locations);
            const primary = resPerfil.data.locations.find((l: any) => l.isPrimary) || resPerfil.data.locations[0];
            setSelectedLocationId(String(primary.id ?? primary.name));
            
            const lat = primary.latitude;
            const lng = primary.longitude;
            if (typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)) {
              setSelectedPickupLocation({ latitude: lat, longitude: lng });
            } else {
              setSelectedPickupLocation(null);
            }
          }
        }
        
        if (resActiva.success && resActiva.data?.tieneActiva && resActiva.data.solicitud) {
          const s = resActiva.data.solicitud;
          const ACTIVE_STATUSES = ["PENDIENTE", "PROGRAMADO", "EN_RUTA", "EN_SITIO"];
          if (ACTIVE_STATUSES.includes(s.estado || s.status)) {
            setActiveRequest(s);
            if (s.segundosRestantes) {
              setTimeLeft(s.segundosRestantes);
            }
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (activeRequest && activeRequest.estado === "PENDIENTE" && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setActiveRequest(null);
            toast.info("La solicitud pendiente ha expirado. Ahora puedes crear una nueva.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeRequest, timeLeft]);

  const handleCancelarActiva = async (id: number) => {
    if (!window.confirm("¿Seguro que deseas cancelar esta solicitud? Esta acción no se puede deshacer.")) return;
    setLoading(true);
    try {
      const res = await empresaApi.cancelarSolicitud(id);
      if (res.success) {
        toast.success("Solicitud cancelada correctamente.");
        setActiveRequest(null);
        setTimeLeft(0);
      } else {
        toast.error(res.message || "Error al cancelar la solicitud");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al cancelar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleValidate = () => {
    const volNum = Number(volumen);
    if (!volumen || volNum <= 0) {
      toast.error("La cantidad estimada debe ser mayor a 0.");
      return;
    }
    if (volNum > 5000) {
      toast.error("La cantidad estimada no puede superar los 5000 litros.");
      return;
    }
    if (!foto) {
      toast.error("Debe adjuntar una foto del aceite.");
      return;
    }
    if (!confirmacion) {
      toast.error("Debe confirmar que el residuo es aceite vegetal usado de cocina.");
      return;
    }
    if (!selectedPickupLocation) {
      toast.error("Selecciona en el mapa el punto donde se recogerá el aceite.");
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    const volNum = Number(volumen);
    try {
      let obsFinal = observaciones;
      if (cantidadEnvases) {
        obsFinal = `Envases: ${cantidadEnvases}. ${observaciones}`.trim();
      }

      const today = new Date().toISOString().split('T')[0];


      const MAX_SIZE_MB = 5;
      if (foto.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`La foto no debe superar los ${MAX_SIZE_MB}MB.`);
        setLoading(false);
        return;
      }
      
      const validTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!validTypes.includes(foto.type)) {
        toast.error("Formato de imagen no válido. Use JPG o PNG.");
        setLoading(false);
        return;
      }

      const res = await empresaApi.crearSolicitud({
        volumenAproximado: volNum,
        direccion: direccionPerfil,
        fechaProgramada: `${today}T00:00:00`,
        observaciones: obsFinal,

        pickupLatitude: selectedPickupLocation!.latitude,
        pickupLongitude: selectedPickupLocation!.longitude,
      }, foto);

      if (!res.success) {
        toast.error(res.message || "No se pudo registrar la solicitud");
        return;
      }

      toast.success(res.message || "Solicitud reportada exitosamente");
      navigate("/empresa/mis-solicitudes");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  if (activeRequest) {
    const isPendiente = activeRequest.estado === "PENDIENTE";
    return (
      <DashboardShell role="Empresa" user={user} nav={empresaNav}>
        <div className="mb-6">
          <Badge className="bg-amber-500 text-white mb-2">Solicitud Activa</Badge>
          <h1 className="font-display text-3xl font-bold text-foreground">Tienes una solicitud activa</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mientras exista una solicitud activa, no puedes registrar una nueva solicitud.
          </p>
        </div>

        <div className="max-w-2xl">
          <Card className="p-6 rounded-xl border-border/50 shadow-sm space-y-6">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <p className="text-xs text-muted-foreground">ID de Solicitud: #{activeRequest.id}</p>
                <p className="text-sm text-muted-foreground mt-1">Reportado el: {formatDateTime(activeRequest.fechaSolicitud || activeRequest.createdAt)}</p>
              </div>
              <Badge variant="outline" className={activeRequest.estado === "PENDIENTE" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-primary/10 text-primary border-primary/20"}>
                {activeRequest.estado}
              </Badge>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-muted/40 p-3 rounded-lg border">
                <span className="text-xs text-muted-foreground block mb-0.5">Cantidad reportada</span>
                <span className="font-bold text-foreground">{activeRequest.volumenAproximado?.toFixed(2)} Litros</span>
              </div>
              <div className="bg-muted/40 p-3 rounded-lg border">
                <span className="text-xs text-muted-foreground block mb-0.5">Precio de recolección</span>
                <span className="font-bold text-foreground">
                  {activeRequest.precioPorLitro ? `S/ ${activeRequest.precioPorLitro.toFixed(2)} / L` : "Pendiente de confirmación"}
                </span>
              </div>
              <div className="bg-muted/40 p-3 rounded-lg border sm:col-span-2">
                <span className="text-xs text-muted-foreground block mb-0.5">Dirección de recojo</span>
                <span className="font-medium text-foreground">{activeRequest.direccion || direccionPerfil}</span>
              </div>
            </div>

            {isPendiente && timeLeft > 0 && (
              <PickupAvailabilityTimer 
                availableUntil={activeRequest.availableUntil}
                createdAt={activeRequest.createdAt || activeRequest.fechaSolicitud}
              />
            )}

            {!isPendiente && activeRequest.recolectorAsignado && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 space-y-2">
                <p className="text-sm font-semibold text-primary">Recolector asignado</p>
                <div className="grid grid-cols-2 text-xs gap-y-1">
                  <span className="text-muted-foreground">Empresa Recolectora:</span>
                  <span className="font-semibold">{activeRequest.recolectorAsignado}</span>
                  {activeRequest.transportePlaca && (
                    <>
                      <span className="text-muted-foreground">Placa Unidad:</span>
                      <span className="font-semibold">{activeRequest.transportePlaca}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t justify-end">
              {isPendiente ? (
                <Button 
                  variant="destructive" 
                  onClick={() => handleCancelarActiva(activeRequest.id)}
                  disabled={loading}
                  className="sm:w-auto"
                >
                  {loading ? "Cancelando..." : "Cancelar solicitud"}
                </Button>
              ) : (
                <Button 
                  onClick={() => navigate("/empresa/mis-solicitudes")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground sm:w-auto"
                >
                  Ver seguimiento
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => navigate("/empresa/mis-solicitudes")}
                className="sm:w-auto"
              >
                Ver historial
              </Button>
            </div>
          </Card>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="Empresa" user={user} nav={empresaNav}>
      <div className="mb-6">
        <Badge className="bg-primary text-primary-foreground mb-2">Nueva operación</Badge>
        <h1 className="font-display text-3xl font-bold text-foreground">Reportar solicitud de recojo</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Reporta el aceite vegetal usado de cocina para que sea recolectado de manera segura y responsable.
        </p>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 rounded-xl border-border/50 shadow-sm">
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                
                <div className="space-y-2">
                  <Label className="text-foreground font-semibold flex items-center gap-1">
                    Foto del aceite <span className="text-destructive">*</span>
                  </Label>
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setFoto(e.target.files?.[0] || null)} 
                    className="cursor-pointer file:cursor-pointer file:bg-primary/10 file:text-primary file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3 hover:file:bg-primary/20 transition-colors"
                  />
                  <p className="text-xs text-muted-foreground">Sube una foto clara de los envases.</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground font-semibold flex items-center gap-1">
                    Cantidad estimada (L) <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      placeholder="Ej. 20" 
                      value={volumen} 
                      onChange={(e) => setVolumen(e.target.value)} 
                      max={5000}
                      className="pl-9"
                    />
                    <Droplets className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground font-semibold">Cantidad de envases</Label>
                  <Input 
                    type="number" 
                    placeholder="Ej. 2 bidones" 
                    value={cantidadEnvases} 
                    onChange={(e) => setCantidadEnvases(e.target.value)} 
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-foreground font-semibold">Observaciones</Label>
                  <Textarea 
                    rows={3} 
                    placeholder="Alguna indicación adicional para el recolector..."
                    value={observaciones} 
                    onChange={(e) => setObservaciones(e.target.value)} 
                    className="resize-none"
                  />
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-muted/30 p-4 rounded-lg border border-border/50">
                <Checkbox 
                  id="confirmacion" 
                  checked={confirmacion} 
                  onCheckedChange={(checked) => setConfirmacion(checked as boolean)} 
                  className="mt-1"
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="confirmacion"
                    className="text-sm font-medium leading-tight cursor-pointer"
                  >
                    Confirmo que el residuo corresponde a aceite vegetal usado de cocina. <span className="text-destructive">*</span>
                  </label>
                  <p className="text-xs text-muted-foreground">
                    No se aceptan aceites de motor, minerales, químicos u otros residuos peligrosos.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => { setVolumen(""); setFoto(null); setCantidadEnvases(""); setObservaciones(""); setConfirmacion(false); setSelectedPickupLocation(null); }}
                >
                  Limpiar
                </Button>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6" onClick={handleValidate} disabled={loading}>
                  <Send className="h-4 w-4 mr-2" /> {loading ? "Enviando..." : "Reportar solicitud"}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-5 rounded-xl border-blue-200 bg-blue-50/50">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">¿Qué sucede después de reportar?</h3>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2 p-3 bg-white rounded-lg shadow-sm border border-blue-100">
                <div className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1">1</div>
                <p className="text-sm font-medium text-slate-700 leading-tight">Visible para recolectores cercanos.</p>
              </div>
              <div className="flex flex-col gap-2 p-3 bg-white rounded-lg shadow-sm border border-blue-100">
                <div className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1">2</div>
                <p className="text-sm font-medium text-slate-700 leading-tight">Revisión de la evidencia.</p>
              </div>
              <div className="flex flex-col gap-2 p-3 bg-white rounded-lg shadow-sm border border-blue-100">
                <div className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1">3</div>
                <p className="text-sm font-medium text-slate-700 leading-tight">Estimación de precio.</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5 rounded-xl border-border/50 shadow-sm flex flex-col h-full">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              Ubicación del recojo <span className="text-destructive">*</span>
            </h3>
            
            {companyLocations.length > 0 ? (
              <div className="mb-4 space-y-3">
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Seleccionar sede</Label>
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedLocationId}
                    onChange={(e) => {
                      const locId = e.target.value;
                      setSelectedLocationId(locId);
                      const loc = companyLocations.find(l => String(l.id ?? l.name) === locId);
                      if (loc) {
                        setSelectedPickupLocation({ latitude: loc.latitude, longitude: loc.longitude });
                      }
                    }}
                  >
                    <option value="" disabled>Selecciona una sede...</option>
                    {companyLocations.map(loc => (
                      <option key={String(loc.id ?? loc.name)} value={String(loc.id ?? loc.name)}>
                        {loc.isPrimary ? "Sede principal" : `Sede adicional - ${loc.name}`}
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedLocationId && (
                  <div className="bg-muted/40 p-3 rounded-lg border text-sm">
                    {(() => {
                      const loc = companyLocations.find(l => String(l.id ?? l.name) === selectedLocationId);
                      if (!loc) return null;
                      
                      const hasValidCoords = typeof loc.latitude === 'number' && typeof loc.longitude === 'number' && !Number.isNaN(loc.latitude) && !Number.isNaN(loc.longitude);
                      
                      return (
                        <>
                          <div className="flex justify-between items-start mb-1.5">
                            <span className="font-semibold text-foreground">{loc.isPrimary ? 'Sede principal' : loc.name}</span>
                            <Badge variant="outline" className={loc.isPrimary ? "bg-primary/10 text-primary border-primary/20" : "bg-blue-100 text-blue-700 border-blue-200"}>
                              {loc.isPrimary ? 'Principal' : 'Adicional'}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-xs">{loc.referenceAddress || loc.name}</p>
                          {hasValidCoords ? (
                            <p className="text-muted-foreground text-[11px] font-mono mt-1.5">Lat: {loc.latitude.toFixed(6)} | Lng: {loc.longitude.toFixed(6)}</p>
                          ) : (
                            <p className="text-amber-600 text-[11px] mt-1.5">No tiene coordenadas válidas. Seleccione un punto en el mapa.</p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-4 p-3 bg-amber-50 text-amber-800 rounded-lg text-sm border border-amber-200 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>No tienes sedes registradas. Registra una ubicación en "Mi empresa" o marca manualmente el punto de recojo en el mapa.</p>
              </div>
            )}

            {!companyLocations.length && (
              <div className="p-3 mb-4 rounded-lg border bg-blue-50 text-blue-700 text-sm border-blue-100 flex items-start gap-2">
                <MapPinned className="h-4 w-4 mt-0.5 shrink-0" />
                <p>Haz clic en el mapa para indicar el punto exacto de recojo.</p>
              </div>
            )}
            
            <div className="w-full h-[380px] rounded-xl overflow-hidden border border-border mt-auto">
              <GoogleMapView 
                markers={[]}
                height="100%"
                showMissingCoordinatesWarning={false}
                selectable={true}
                selectedPosition={selectedPickupLocation}
                onSelectPosition={setSelectedPickupLocation}
              />
            </div>

            {selectedPickupLocation && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg border flex justify-between items-center">
                <div className="flex items-start gap-2">
                  <MapPinned className="w-4 h-4 text-primary mt-0.5" />
                  <div className="text-xs text-muted-foreground font-mono">
                    <div>Lat: {selectedPickupLocation.latitude.toFixed(6)}</div>
                    <div>Lng: {selectedPickupLocation.longitude.toFixed(6)}</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedPickupLocation(null)} className="h-8 px-2 text-destructive hover:bg-destructive/10">
                  Limpiar
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>¿Confirmar reporte de solicitud?</DialogTitle>
            <DialogDescription>
              Verifica la información antes de enviar la solicitud al sistema.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="text-sm space-y-2">
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-muted-foreground">Foto del aceite:</span>
                <span>{foto ? "Imagen cargada correctamente" : "Pendiente"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-muted-foreground">Cantidad estimada:</span>
                <span>{volumen} Litros</span>
              </div>
              {cantidadEnvases && (
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-muted-foreground">Envases:</span>
                  <span>{cantidadEnvases}</span>
                </div>
              )}
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-muted-foreground">Ubicación referencial:</span>
                <span className="text-right pl-4 line-clamp-2">{direccionPerfil}</span>
              </div>
              {observaciones && (
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-muted-foreground">Observaciones:</span>
                  <span className="text-right pl-4 line-clamp-2">{observaciones}</span>
                </div>
              )}
            </div>


          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmSubmit} className="bg-green-600 hover:bg-green-700 text-white">
              Sí, reportar solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
