import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Check, X, MapPin, Calendar, Droplet, ArrowLeft, CameraOff, Clock, ExternalLink, Sparkles } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getStoredAuth } from "@/services/authStorage";
import { recolectorApi } from "@/services/recolectorApi";
import { recolectorNav } from "./recolectorNav";
import { BASE_URL } from "@/services/apiClient";
import { RouteMapView } from "@/components/maps/RouteMapView";
import { PickupAvailabilityTimer } from "@/components/pickup/PickupAvailabilityTimer";
import { GoogleMapView } from "@/components/maps/GoogleMapView";
import { getEstadoLabel, getEstadoBadge } from "@/lib/utils";
import type { PickupRequest } from "@/types";

const isValidPriceInput = (val: string) => {
  return /^$|^2(\.\d{0,2})?$|^3(\.0{0,2})?$/.test(val);
};

const parseObservaciones = (obs: string | undefined | null) => {
  if (!obs) return { envases: "No registrado", text: "" };
  const match = obs.match(/^Envases:\s*([^.]+)(?:\.\s*(.*))?/i);
  if (match) {
    let envasesCount = match[1].trim();
    const cleanText = match[2] ? match[2].trim() : "";
    if (/^\d+$/.test(envasesCount)) {
      envasesCount = parseInt(envasesCount, 10) === 1 ? `${envasesCount} envase` : `${envasesCount} envases`;
    }
    return { envases: envasesCount, text: cleanText };
  }
  return { envases: "No registrado", text: obs };
};

interface AvailableRequestCardProps {
  recojo: PickupRequest;
  onSelect: (recojo: PickupRequest) => void;
  onExpired: (id: number) => void;
  collectorCapacity?: number | null;
}

function AvailableRequestCard({ recojo, onSelect, onExpired, collectorCapacity }: AvailableRequestCardProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const DIAS_PUBLICACION = 7;
  const MS_POR_DIA = 24 * 60 * 60 * 1000;
  
  const fechaCreacionStr = recojo.createdAt || recojo.fechaSolicitud || new Date().toISOString();
  const inicio = new Date(fechaCreacionStr);
  const termino = new Date(inicio.getTime() + DIAS_PUBLICACION * MS_POR_DIA);
  const diferencia = termino.getTime() - now.getTime();
  
  const vencido = diferencia <= 0;
  const horas = vencido ? 0 : Math.floor(diferencia / (1000 * 60 * 60));
  const minutos = vencido ? 0 : Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));

  const exceedsCapacity = collectorCapacity && recojo.volumenAproximado && recojo.volumenAproximado > collectorCapacity;

  const formatearFechaRecojo = (fecha: Date) => {
    return fecha.toLocaleString('es-PE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Card className={`flex flex-col h-full hover:shadow-md transition-shadow overflow-hidden border ${recojo.aiRecommended ? 'border-purple-300 shadow-purple-100/50' : 'border-border'}`}>
      <div className="p-5 flex-1 relative">
        {recojo.aiRecommended && (
          <div className="bg-purple-100/80 text-purple-800 text-xs font-semibold px-3 py-1.5 rounded-md mb-3 flex items-center gap-1.5 w-fit border border-purple-200">
            <Sparkles className="h-3.5 w-3.5 text-purple-600" />
            {recojo.recommendationSource === 'GEMINI' ? 'Recomendado por IA' : 'Mejor opción calculada'}
          </div>
        )}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-lg leading-tight line-clamp-2 pr-2">
              {recojo.empresaRazonSocial || "Restaurante"}
            </h3>
            {recojo.aiRank && recojo.aiRank > 1 && !recojo.aiRecommended && (
               <span className="text-xs text-muted-foreground mt-1 block">Ranking #{recojo.aiRank}</span>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge variant="outline" className={getEstadoBadge(recojo.estado)}>
              {getEstadoLabel(recojo.estado)}
            </Badge>
            {exceedsCapacity && (
              <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 font-semibold shadow-none">
                Fuera de capacidad
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-2 mt-4 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span className="line-clamp-2 text-foreground/90">{recojo.direccion || "Dirección no provista"}</span>
          </div>

          <div className="flex items-center gap-2">
            <Droplet className="h-4 w-4 text-blue-500 shrink-0" />
            <span className="font-medium text-foreground/90">{recojo.volumenAproximado?.toLocaleString("es-PE")} L <span className="text-muted-foreground font-normal">aprox.</span></span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">
              {recojo.fechaSolicitud ? new Date(recojo.fechaSolicitud).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : "Sin fecha"}
            </span>
          </div>

          <PickupAvailabilityTimer 
            availableUntil={recojo.availableUntil} 
            createdAt={recojo.createdAt || recojo.fechaSolicitud}
          />
          <div className="mt-4 p-3 bg-primary/5 rounded-md border border-primary/20 text-sm">
            <p className="font-semibold text-primary mb-1">Precio de recolección</p>
            <p className="text-muted-foreground italic">Por definir en el recojo</p>
          </div>
          
          {recojo.aiTags && recojo.aiTags.length > 0 && !exceedsCapacity && (
            <div className="flex flex-wrap gap-1 mt-3">
              {recojo.aiTags.slice(0, 3).map((tag, i) => (
                <Badge key={i} variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-100 text-[10px] py-0">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-muted/30 border-t border-border flex justify-end">
        <Button disabled={vencido || exceedsCapacity} onClick={() => onSelect(recojo)} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50">
          {vencido ? 'Anuncio vencido' : (exceedsCapacity ? 'No puedes aceptar' : 'Evaluar recojo')}
        </Button>
      </div>
    </Card>
  );
}

export default function RecolectorRecojosDia() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const auth = getStoredAuth();
  const [user, setUser] = useState({ name: auth?.companyName || "Recolector", sub: auth?.email || "No autenticado" });
  const [recojos, setRecojos] = useState<PickupRequest[]>([]);
  const [activeRequest, setActiveRequest] = useState<PickupRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState<number | null>(null);
  const [collectorCapacity, setCollectorCapacity] = useState<number | null>(null);

  // States for detail view
  const [selectedRecojo, setSelectedRecojo] = useState<PickupRequest | null>(null);
  const [precioOferta, setPrecioOferta] = useState<string>("");

  // States for Registrar Recojo
  const [isRegistrando, setIsRegistrando] = useState(false);
  const [isConfirmandoRegistro, setIsConfirmandoRegistro] = useState(false);
  const [litrosReales, setLitrosReales] = useState<string>("");
  const [precioAcordadoFinal, setPrecioAcordadoFinal] = useState<string>("");
  const [observacionesRegistro, setObservacionesRegistro] = useState("");
  const [motivoIncidencia, setMotivoIncidencia] = useState("");
  const [obsIncidencia, setObsIncidencia] = useState("");

  const loadData = async (forceDisponibles = false) => {
    setLoading(true);
    try {
      const isDisponiblesView = forceDisponibles || searchParams.get('view') === 'disponibles';
      
      if (isDisponiblesView) {
        const [resPerfil, resRecojos, resUnidades] = await Promise.all([
          recolectorApi.getPerfil(),
          recolectorApi.getSolicitudesDisponibles(),
          recolectorApi.getUnidades()
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
        if (resUnidades.success && resUnidades.data && resUnidades.data.length > 0) {
          setCollectorCapacity(resUnidades.data[0].capacidadLitros);
        }
        setActiveRequest(null);
        if (resRecojos.success && resRecojos.data) {
          setRecojos(resRecojos.data);
        } else {
          setRecojos([]);
        }
        
        if (searchParams.get('view') === 'disponibles') {
           setSearchParams({});
        }
      } else {
        const [resPerfil, resActivo, resUnidades] = await Promise.all([
          recolectorApi.getPerfil(),
          recolectorApi.getRecojoActivo(),
          recolectorApi.getUnidades()
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
        if (resUnidades.success && resUnidades.data && resUnidades.data.length > 0) {
          setCollectorCapacity(resUnidades.data[0].capacidadLitros);
        }

        if (resActivo.success && resActivo.data) {
          setActiveRequest(resActivo.data);
        } else {
          setActiveRequest(null);
          const resRecojos = await recolectorApi.getSolicitudesDisponibles();
          if (resRecojos.success && resRecojos.data) {
            setRecojos(resRecojos.data);
          } else {
            setRecojos([]);
          }
        }
      }
    } catch (error: unknown) {
      setRecojos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenRegistro = () => {
    if (activeRequest) {
      setLitrosReales(activeRequest.volumenAproximado?.toString() || "");
      setPrecioAcordadoFinal(activeRequest.precioOfertadoPorLitro?.toString() || "");
    }
    setIsRegistrando(true);
  };

  const handleLitrosInputChange = (val: string) => {
    if (val === '') {
      setLitrosReales('');
      return;
    }
    // Permite números enteros o con hasta 2 decimales, no bloquea edición en progreso
    if (!/^\d*\.?\d{0,2}$/.test(val)) return;
    
    setLitrosReales(val);
  };

  const handleConfirmarRegistro = async () => {
    if (!litrosReales || Number(litrosReales) <= 0) {
      toast.error("Ingresa los litros reales recogidos");
      return;
    }

    if (!activeRequest) return;

    const capacidadUnidadValida = activeRequest.transporteCapacidadLitros !== null && activeRequest.transporteCapacidadLitros !== undefined && Number.isFinite(Number(activeRequest.transporteCapacidadLitros)) && Number(activeRequest.transporteCapacidadLitros) > 0;

    if (capacidadUnidadValida && Number(litrosReales) > Number(activeRequest.transporteCapacidadLitros)) {
      toast.error(`Los litros reales no pueden superar la capacidad de la unidad asignada: ${activeRequest.transporteCapacidadLitros} L.`);
      return;
    }

    if (!precioAcordadoFinal || Number(precioAcordadoFinal) < 2 || Number(precioAcordadoFinal) > 3) {
      toast.error("El precio por litro debe estar entre S/ 2.00 y S/ 3.00.");
      return;
    }

    setIsConfirmandoRegistro(true);
    try {
      // Confirmar el recojo con el volumen real (pasa de EN_SITIO a RECOGIDO)
      const resConfirmar = await recolectorApi.confirmarRecojo(
        activeRequest.id,
        Number(litrosReales),
        Number(precioAcordadoFinal)
      );
      if (!resConfirmar.success) {
        toast.error(resConfirmar.message || "Error al confirmar recojo");
        return;
      }

      toast.success("Recojo completado correctamente. El pago externo fue registrado como parte del cierre operativo.");
      setIsRegistrando(false);
      setActiveRequest(null); // Limpieza local estricta inmediata
      navigate("/recolector/recojos-dia?view=disponibles", { replace: true });
      await loadData(true);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al confirmar el recojo");
    } finally {
      setIsConfirmandoRegistro(false);
    }
  };

  const handleMarcarLlegada = async () => {
    if (!activeRequest) return;
    try {
      const res = await recolectorApi.marcarLlegada(activeRequest.id);
      if (!res.success) {
        toast.error(res.message || "Error al marcar llegada");
        return;
      }
      toast.success("Llegada al sitio confirmada.");
      await loadData();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al marcar llegada");
    }
  };

  const getTipoRechazo = (motivo: string) => {
    const motivosRecolector = [
      "No puedo asistir",
      "Falla de unidad",
      "Emergencia",
      "Sin disponibilidad",
      "Fuera de zona"
    ];
    return motivosRecolector.includes(motivo) ? "NO_DISPONIBILIDAD_RECOLECTOR" : "PROBLEMA_SOLICITUD";
  };

  const handleRechazarRegistro = async () => {
    if (!motivoIncidencia) {
      toast.error("Selecciona un motivo de incidencia para rechazar");
      return;
    }
    if (motivoIncidencia === "OTROS" && !obsIncidencia.trim()) {
      toast.error("Debes describir el motivo cuando seleccionas Otros.");
      return;
    }
    if (activeRequest) {
      try {
        const tipoRechazo = getTipoRechazo(motivoIncidencia);
        const res = await recolectorApi.rechazarSolicitud(activeRequest.id, {
          motivo: motivoIncidencia,
          observacion: obsIncidencia,
          tipoRechazo
        });
        if (res.success) {
          if (tipoRechazo === "PROBLEMA_SOLICITUD") {
            toast.success("Solicitud rechazada. El restaurante podrá ver el motivo.");
          } else {
            toast.success("Solicitud liberada para otro recolector.");
          }
          setIsRegistrando(false);
          setActiveRequest(null);
          loadData();
        } else {
          toast.error(res.message || "Error al rechazar");
        }
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Error al rechazar");
      }
    }
  };

  const handleAceptar = async (id: number) => {
    setIsAccepting(id);
    try {
      const res = await recolectorApi.aceptarSolicitud(id);
      if (res.success && res.data) {
        toast.success("Solicitud aceptada. Recojo en curso.");
        setActiveRequest(res.data);
        setSelectedRecojo(null);
        setRecojos([]);
      } else {
        toast.error(res.message || "Error al aceptar solicitud");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Esta solicitud ya fue tomada por otro recolector.");
      loadData();
      setSelectedRecojo(null);
    } finally {
      setIsAccepting(null);
    }
  };


  if (isRegistrando && activeRequest) {
    if (activeRequest.estado !== "PROGRAMADO" && activeRequest.estado !== "EN_RUTA" && activeRequest.estado !== "EN_SITIO") {
      return (
        <DashboardShell role="Recolector" user={user} nav={recolectorNav}>
          <div className="mb-6 flex items-center gap-4">
            <Button variant="ghost" onClick={() => setIsRegistrando(false)} className="gap-2 px-0 hover:bg-transparent">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Volver</span>
            </Button>
          </div>
          <h1 className="font-display text-3xl font-bold mb-6">Registrar recojo de aceite</h1>
          <Card className="p-10 flex flex-col items-center justify-center text-center bg-white">
            <MapPin className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-bold mb-2 text-foreground/90">Este recojo no está disponible para cierre</h2>
            <p className="text-muted-foreground mb-6">
              Primero debes aceptar la solicitud para poder registrar el recojo.
            </p>
            <Button onClick={() => setIsRegistrando(false)} variant="outline" className="border-primary/20 text-primary hover:bg-primary/5">
              Volver al recojo
            </Button>
          </Card>
        </DashboardShell>
      );
    }

    const montoTotalCalc = (Number(litrosReales || 0) * Number(precioAcordadoFinal || 0)).toFixed(2);

    return (
      <DashboardShell role="Recolector" user={user} nav={recolectorNav}>
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" onClick={() => setIsRegistrando(false)} className="gap-2 px-0 hover:bg-transparent">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Volver</span>
          </Button>
        </div>

        <h1 className="font-display text-3xl font-bold mb-6">Registrar recojo de aceite</h1>

        <div className="space-y-6 w-full">
          <Card className="p-6 bg-white border-border shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-xl hidden sm:block">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1 text-foreground/90">{activeRequest.empresaRazonSocial || "Restaurante"}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{activeRequest.direccion || "Ubicación referencial"}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap lg:flex-nowrap items-center gap-6 lg:gap-12">
              <div className="flex flex-col items-start lg:items-center gap-1.5">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" /> Estado actual</span>
                <Badge className={getEstadoBadge(activeRequest.estado)}>{getEstadoLabel(activeRequest.estado)}</Badge>
              </div>
              <div className="flex flex-col items-start lg:items-center gap-1.5">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-primary" /> Llegada estimada</span>
                <span className="font-semibold text-sm">10:05 a. m.</span>
              </div>
              <div className="flex flex-col items-start lg:items-center gap-1.5">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" /> Distancia estimada</span>
                <span className="font-semibold text-sm">1.8 km</span>
              </div>
            </div>
          </Card>
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="bg-primary/10 text-primary w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold border border-primary/20">1</span>
                1. Detalles del recojo
              </h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-medium">Litros reales recogidos <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      {(() => {
                        const capacidadUnidadValida = activeRequest?.transporteCapacidadLitros !== null && activeRequest?.transporteCapacidadLitros !== undefined && Number.isFinite(Number(activeRequest?.transporteCapacidadLitros)) && Number(activeRequest?.transporteCapacidadLitros) > 0;
                        const superaCapacidad = capacidadUnidadValida && litrosReales !== '' && Number(litrosReales) > Number(activeRequest?.transporteCapacidadLitros);
                        
                        return (
                          <>
                            <Input
                              type="text"
                              inputMode="decimal"
                              placeholder="20"
                              value={litrosReales}
                              onChange={(e) => handleLitrosInputChange(e.target.value)}
                              className={`pr-12 h-10 ${superaCapacidad ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                            />
                            <div className="absolute right-0 top-0 h-full px-3 flex items-center border-l border-border bg-muted/30 text-muted-foreground text-xs rounded-r-md">litros</div>
                          </>
                        );
                      })()}
                    </div>
                    {(() => {
                        const capacidadUnidadValida = activeRequest?.transporteCapacidadLitros !== null && activeRequest?.transporteCapacidadLitros !== undefined && Number.isFinite(Number(activeRequest?.transporteCapacidadLitros)) && Number(activeRequest?.transporteCapacidadLitros) > 0;
                        const superaCapacidad = capacidadUnidadValida && litrosReales !== '' && Number(litrosReales) > Number(activeRequest?.transporteCapacidadLitros);

                        if (superaCapacidad) {
                          return <p className="text-[10px] text-destructive font-medium mt-1">Los litros reales no pueden superar la capacidad de la unidad asignada: {activeRequest?.transporteCapacidadLitros} L.</p>;
                        }
                        if (!capacidadUnidadValida) {
                          return <p className="text-[10px] text-amber-600 font-medium mt-1">Capacidad de unidad no disponible. Se validará al confirmar.</p>;
                        }
                        return null;
                    })()}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-medium">Precio acordado <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <div className="absolute left-0 top-0 h-full px-3 flex items-center text-muted-foreground text-sm">S/</div>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="2.50"
                        value={precioAcordadoFinal}
                        onChange={(e) => {
                          if (isValidPriceInput(e.target.value)) {
                            setPrecioAcordadoFinal(e.target.value);
                          }
                        }}
                        className="pl-8 h-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 flex flex-col justify-end">
                    <Label className="text-xs text-muted-foreground font-medium mb-1 text-center">Monto total</Label>
                    <div className="flex justify-center items-center h-10">
                      <span className="text-2xl font-bold text-green-600">S/ {montoTotalCalc}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground font-medium">Observaciones (opcional)</Label>
                  <Textarea
                    placeholder="Ej. Se verificó la calidad del aceite, envases en buen estado..."
                    value={observacionesRegistro}
                    onChange={(e) => setObservacionesRegistro(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </Card>

          </div>

          <Card className="p-6 border-border shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-destructive">
              <span className="bg-destructive/10 text-destructive w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold border border-destructive/20">2</span>
              2. Incidencia del recojo
            </h3>

            <div className="grid sm:grid-cols-2 gap-6 mb-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-medium">Motivo <span className="text-destructive">*</span></Label>
                <select
                  className="w-full border border-border rounded-md px-3 h-10 text-sm bg-background focus:ring-2 focus:ring-destructive/20 outline-none"
                  value={motivoIncidencia}
                  onChange={(e) => setMotivoIncidencia(e.target.value)}
                >
                  <option value="">Seleccione un motivo</option>
                  <optgroup label="Problemas con la solicitud/restaurante">
                    <option value="Aceite contaminado con agua">Aceite contaminado con agua</option>
                    <option value="Aceite contaminado con químicos o detergente">Aceite contaminado con químicos o detergente</option>
                    <option value="No corresponde a aceite vegetal usado de cocina">No corresponde a aceite vegetal usado de cocina</option>
                    <option value="Cantidad no coincide con lo reportado">Cantidad no coincide con lo reportado</option>
                    <option value="Envase inadecuado o inseguro">Envase inadecuado o inseguro</option>
                    <option value="Generador no disponible">Generador no disponible</option>
                    <option value="No hubo acuerdo">No hubo acuerdo</option>
                    <option value="Ubicación no accesible">Ubicación no accesible</option>
                  </optgroup>
                  <optgroup label="Problemas operativos del recolector">
                    <option value="No puedo asistir">No puedo asistir</option>
                    <option value="Falla de unidad">Falla de unidad</option>
                    <option value="Emergencia">Emergencia</option>
                    <option value="Sin disponibilidad">Sin disponibilidad</option>
                    <option value="Fuera de zona">Fuera de zona</option>
                  </optgroup>
                  <option value="OTROS">Otros</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-medium">
                  {motivoIncidencia === "OTROS" ? "Observación adicional *" : "Observaciones (opcional)"}
                </Label>
                <Input
                  placeholder={motivoIncidencia === "OTROS" ? "Describe el motivo del rechazo..." : "Describe brevemente la incidencia..."}
                  value={obsIncidencia}
                  onChange={(e) => setObsIncidencia(e.target.value)}
                  className={`h-10 ${motivoIncidencia === "OTROS" && !obsIncidencia.trim() ? "border-destructive ring-destructive/20" : ""}`}
                />
              </div>
            </div>

            <div className="bg-red-50 text-red-600 p-3 rounded-md text-xs flex items-start gap-2 border border-red-100">
              <span className="font-bold border border-red-600 rounded-full w-4 h-4 flex items-center justify-center text-[10px] shrink-0 mt-0.5">i</span>
              <p>Si tienes algún problema en el sitio (aceite en mal estado, litros diferentes, falta de acceso, entre otros), puedes rechazar el recojo seleccionando un motivo.</p>
            </div>
          </Card>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
            <Button variant="destructive" onClick={handleRechazarRegistro} className="sm:w-auto">
              Rechazar recojo
            </Button>
            <Button onClick={handleConfirmarRegistro} className="bg-green-600 hover:bg-green-700 text-white sm:w-auto">
              Confirmar recojo y pago
            </Button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (selectedRecojo) {
    const estimado = (parseFloat(precioOferta || '0') * (selectedRecojo.volumenAproximado || 0)).toFixed(2);

    return (
      <DashboardShell role="Recolector" user={user} nav={recolectorNav}>
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" onClick={() => setSelectedRecojo(null)} className="gap-2 px-0 hover:bg-transparent">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Volver a solicitudes</span>
          </Button>
        </div>

        <h1 className="font-display text-3xl font-bold mb-6">Detalle de solicitud de recojo</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
                {selectedRecojo.aiRecommended && (
                  <div className="mb-4 bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      <h3 className="font-bold text-purple-800">
                        {selectedRecojo.recommendationSource === 'GEMINI' ? 'Recomendación IA' : 'Mejor opción calculada'}
                      </h3>
                    </div>
                    <p className="text-sm text-purple-900/80 mb-3">{selectedRecojo.aiReason}</p>
                    {selectedRecojo.aiTags && selectedRecojo.aiTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedRecojo.aiTags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none font-medium text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground/90">{selectedRecojo.empresaRazonSocial || "Restaurante"}</h2>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <Badge variant="outline" className={getEstadoBadge(selectedRecojo.estado)}>
                      {getEstadoLabel(selectedRecojo.estado)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {selectedRecojo.fechaSolicitud ? new Date(selectedRecojo.fechaSolicitud).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Fecha no registrada"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-6">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="font-semibold text-primary mb-3">Residuo reportado: aceite vegetal usado de fritura.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-md border border-border/50">
                      <p className="text-sm text-muted-foreground mb-1">Cantidad estimada</p>
                      <p className="font-medium text-lg">{selectedRecojo.volumenAproximado?.toLocaleString("es-PE")} Litros</p>
                    </div>
                    <div className="bg-white p-3 rounded-md border border-border/50">
                      <p className="text-sm text-muted-foreground mb-1">Cantidad de envases</p>
                      <p className="font-medium text-lg">{parseObservaciones(selectedRecojo.observaciones).envases}</p>
                    </div>
                  </div>
                </div>

                {parseObservaciones(selectedRecojo.observaciones).text && (
                  <div>
                    <p className="text-sm font-medium mb-2">Observaciones del generador</p>
                    <div className="p-3 bg-muted/50 rounded-md text-sm italic text-muted-foreground border border-border/50">
                      "{parseObservaciones(selectedRecojo.observaciones).text}"
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium mb-2">Evidencia fotográfica</p>
                  {selectedRecojo.evidenciaUrl ? (
                    <div className="w-full max-h-[320px] rounded-lg overflow-hidden bg-muted/20 flex items-center justify-center border border-border/50">
                      <img
                        src={`${BASE_URL.replace('/api', '')}${selectedRecojo.evidenciaUrl}`}
                        alt="Evidencia del aceite"
                        className="w-full h-full max-h-[320px] object-contain rounded-md"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-muted/30 rounded-md flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20">
                      <CameraOff className="h-8 w-8 text-muted-foreground/50 mb-2" />
                      <span className="text-muted-foreground text-sm">Sin evidencia fotográfica disponible.</span>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Ubicación del recojo</h3>
                  <p className="text-xs text-muted-foreground mb-3">Este es el punto registrado por el restaurante para coordinar el recojo.</p>
                  {(() => {
                    // Normalización obligatoria
                    const pickupLat = Number(selectedRecojo.pickupLatitude ?? selectedRecojo.companyLatitude);
                    const pickupLng = Number(selectedRecojo.pickupLongitude ?? selectedRecojo.companyLongitude);
                    const hasValidPickupCoords =
                      Number.isFinite(pickupLat) &&
                      Number.isFinite(pickupLng) &&
                      pickupLat >= -90 &&
                      pickupLat <= 90 &&
                      pickupLng >= -180 &&
                      pickupLng <= 180;

                    if (hasValidPickupCoords) {
                      return (
                        <div className="h-[450px] w-full border border-border rounded-xl overflow-hidden shadow-sm bg-card p-0">
                          <RouteMapView
                            height="100%"
                            destinationLat={pickupLat}
                            destinationLng={pickupLng}
                            restaurantName={selectedRecojo.empresaRazonSocial || "Restaurante"}
                            destinationAddress={selectedRecojo.direccion || "Ubicación del recojo"}
                          />
                        </div>
                      );
                    } else {
                      return (
                        <div className="flex flex-col gap-4">
                          <div className="bg-muted p-4 rounded-xl text-center border border-border mt-2">
                            <MapPin className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                            <p className="text-sm font-medium text-muted-foreground">Esta solicitud no tiene coordenadas registradas.</p>
                            <p className="text-xs text-muted-foreground mt-1">Usa la dirección referencial o comunícate con el restaurante.</p>
                          </div>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/30 rounded-xl border border-border">
                            <div className="flex-1">
                              <h4 className="font-bold text-sm text-foreground">{selectedRecojo.empresaRazonSocial || "Restaurante"}</h4>
                              <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1.5">
                                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                                {selectedRecojo.direccion || "Dirección no disponible"}
                              </p>
                            </div>
                            <Button variant="outline" className="w-full sm:w-auto gap-2 bg-background shrink-0" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selectedRecojo.direccion}`, '_blank', 'noopener,noreferrer')}>
                              <ExternalLink className="h-4 w-4" />
                              Abrir en Maps
                            </Button>
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 border-primary/20 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
              <h3 className="text-lg font-bold mb-4">Evaluar y responder solicitud</h3>

              <div className="space-y-4 mb-6">
                <div className="p-4 bg-amber-50 text-amber-700 rounded-md border border-amber-200 text-sm">
                  <p>Al aceptar la solicitud, te comprometes a ir al punto de recolección.</p>
                  <p className="mt-1 font-medium">El precio por litro se acordará con el restaurante al momento del recojo (entre S/ 2.00 y S/ 3.00).</p>
                </div>
              </div>

              {(() => {
                const exceedsCapacity = collectorCapacity && selectedRecojo.volumenAproximado && selectedRecojo.volumenAproximado > collectorCapacity;

                return (
                  <>
                    {exceedsCapacity && (
                      <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20 text-sm font-medium flex items-start gap-2">
                        <span className="font-bold border border-destructive rounded-full w-4 h-4 flex items-center justify-center text-[10px] shrink-0 mt-0.5">!</span>
                        <div>
                          <p>Este pedido supera la capacidad de tu unidad vehicular ({collectorCapacity} L).</p>
                          <p className="mt-1 font-normal text-destructive/80">Toma otro pedido compatible con tu capacidad.</p>
                        </div>
                      </div>
                    )}
                    <Button
                      className={`w-full ${exceedsCapacity ? 'bg-muted text-muted-foreground border border-border cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white shadow-sm'} mb-3 py-6 text-base font-medium transition-all`}
                      onClick={() => handleAceptar(selectedRecojo.id)}
                      disabled={isAccepting !== null || exceedsCapacity || false}
                    >
                      {isAccepting === selectedRecojo.id ? (
                        <span className="flex items-center"><Check className="h-5 w-5 mr-2 animate-pulse" /> Aceptando...</span>
                      ) : (
                        <span className="flex items-center"><Check className="h-5 w-5 mr-2" /> Aceptar recojo</span>
                      )}
                    </Button>
                  </>
                );
              })()}
              <div className="bg-green-50 text-green-700 p-3 rounded-md border border-green-100 text-sm flex items-start gap-2">
                <Check className="h-4 w-4 mt-0.5 shrink-0" />
                <p>Al aceptar, se notificará al restaurante que irás a realizar el recojo.</p>
              </div>
            </Card>

          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="Recolector" user={user} nav={recolectorNav}>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">Recojos disponibles</h1>
        <p className="text-sm text-muted-foreground">Solicitudes pendientes de restaurantes y generadores.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="p-5 h-48 animate-pulse bg-muted/50" />
          ))}
        </div>
      ) : activeRequest ? (
        <div className="max-w-2xl mx-auto">
          <Card className="flex flex-col h-full hover:shadow-md transition-shadow overflow-hidden border-primary/20 shadow-md">
            <div className="bg-primary/5 p-4 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-primary">
                  {activeRequest.estado === "RECOGIDO" ? "Esperando confirmación" : (activeRequest.estado === "EN_RUTA" ? "Recojo en ruta" : (activeRequest.estado === "PROGRAMADO" ? "Recojo programado" : "Recojo en sitio"))}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {activeRequest.estado === "RECOGIDO"
                    ? "Solicitud completada. Puedes revisar los detalles en tu Historial."
                    : (activeRequest.estado === "EN_RUTA" ? "Aceptaste esta solicitud. Debes dirigirte al punto." : (activeRequest.estado === "PROGRAMADO" ? "Recojo aceptado, a la espera del inicio de ruta." : "Ya estás en el punto de recojo."))}
                </p>
              </div>
              <Badge className={getEstadoBadge(activeRequest.estado)}>
                {getEstadoLabel(activeRequest.estado)}
              </Badge>
            </div>

            <div className="p-5">
              <h3 className="font-bold text-lg leading-tight line-clamp-2 mb-4">
                {activeRequest.empresaRazonSocial || "Restaurante"}
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground/90 text-base">{activeRequest.direccion || "Dirección no provista"}</span>
                </div>

                <div className="flex items-center gap-3">
                  <Droplet className="h-5 w-5 text-blue-500 shrink-0" />
                  <span className="font-medium text-foreground/90 text-base">{activeRequest.volumenAproximado?.toLocaleString("es-PE")} L <span className="text-muted-foreground font-normal">aprox.</span></span>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground text-base">
                    {activeRequest.fechaProgramada ? new Date(activeRequest.fechaProgramada).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : "Sin fecha programada"}
                  </span>
                </div>



                {parseObservaciones(activeRequest.observaciones).text && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-md text-sm italic text-muted-foreground border border-border/50">
                    "{parseObservaciones(activeRequest.observaciones).text}"
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-muted/30 border-t border-border flex flex-col sm:flex-row justify-center gap-3">
              {activeRequest.estado === "RECOGIDO" ? (
                  <div className="bg-primary/5 p-4 rounded-lg mt-6 border border-primary/20 text-center">
                    <p className="font-semibold text-primary mb-2">Recojo Registrado</p>
                    <p className="text-sm text-muted-foreground">
                      Esta solicitud ya fue registrada y el pago externo completado.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4 bg-white"
                      onClick={() => window.location.href = '/recolector/solicitudes'}
                    >
                      Ir al Historial
                    </Button>
                  </div>
              ) : (activeRequest.estado === "PROGRAMADO" || activeRequest.estado === "EN_RUTA" || activeRequest.estado === "EN_SITIO") ? (
                <>
                  <Button asChild variant="outline" className="w-full sm:w-auto border border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                    <a href="/recolector/mapa-operativo">Ver en mapa operativo</a>
                  </Button>
                  <Button onClick={handleOpenRegistro} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                    Registrar recojo
                  </Button>
                </>
              ) : null}
            </div>
          </Card>
        </div>
      ) : recojos.length === 0 ? (
        <Card className="p-10 flex flex-col items-center justify-center text-center">
          <Calendar className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">
            No hay recojos disponibles actualmente.
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Revisa más tarde para nuevas solicitudes.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {recojos.map((recojo) => (
            <AvailableRequestCard
              key={recojo.id}
              recojo={recojo}
              collectorCapacity={collectorCapacity}
              onSelect={(r) => {
                setSelectedRecojo(r);
                setPrecioOferta(r.precioOfertadoPorLitro?.toString() || "");
                setMotivoRechazo("");
              }}
              onExpired={(id) => {
                setRecojos((prev) => prev.filter((item) => item.id !== id));
              }}
            />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

