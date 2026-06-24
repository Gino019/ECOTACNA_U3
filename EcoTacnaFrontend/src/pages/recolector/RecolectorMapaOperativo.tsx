import { DashboardShell } from "@/components/DashboardShell";
import { RouteMapView } from "@/components/maps/RouteMapView";
import { MapErrorBoundary } from "@/components/maps/MapErrorBoundary";
import { EcoMapMarker } from "@/components/maps/mapTypes";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MapPinned, User, Phone, Navigation, Clock, Droplet, CheckCircle, Mail, Building } from "lucide-react";
import { recolectorNav } from "./recolectorNav";
import { getStoredAuth } from "@/services/authStorage";
import { useState, useEffect } from "react";
import { recolectorApi } from "@/services/recolectorApi";
import type { PickupRequest } from "@/types";
import { getEstadoLabel, getEstadoBadge } from "@/lib/utils";

export default function RecolectorMapaOperativo() {
  const auth = getStoredAuth();
  const [user, setUser] = useState({ name: auth?.companyName || "Recolector", sub: auth?.email || "No autenticado" });
  const [activeRequest, setActiveRequest] = useState<PickupRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recolectorApi.getPerfil().then((res) => {
      if (res.success && res.data) {
        setUser({ name: res.data.razonSocial, sub: res.data.correo || `RUC ${res.data.ruc}` });
        import("@/services/authStorage").then(({ saveAuth, getStoredAuth }) => {
          const currentAuth = getStoredAuth();
          if (currentAuth && currentAuth.companyName !== res.data.razonSocial) {
            saveAuth({ ...currentAuth, companyName: res.data.razonSocial });
          }
        });
      }
    }).catch(() => { });

    recolectorApi.getRecojoActivo().then((res) => {
      if (res.success && res.data) {
        setActiveRequest(res.data);
      }
    }).catch(() => { }).finally(() => setLoading(false));
  }, []);

  const pins: EcoMapMarker[] = activeRequest ? [
    {
      id: activeRequest.id.toString(),
      label: activeRequest.empresaRazonSocial || "Empresa",
      description: activeRequest.direccion || "Punto de recojo",
      latitude: activeRequest.pickupLatitude ?? null,
      longitude: activeRequest.pickupLongitude ?? null,
      type: "pickup"
    }
  ] : [];

  return (
    <DashboardShell role="Recolector" user={user} nav={recolectorNav}>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge className="bg-accent text-accent-foreground">Logística</Badge>
          <Badge variant="outline" className="border-info text-info"><MapPinned className="h-3 w-3 mr-1" /> Referencial</Badge>
        </div>
        <h1 className="font-display text-3xl font-bold">Mapa Operativo</h1>
        <p className="text-sm text-muted-foreground">Monitoreo de recojos activos.</p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm mb-6">
        <div className="mb-4">
          <h3 className="font-display font-bold text-xl">Mapa Operativo</h3>
          <p className="text-sm text-muted-foreground">Visualización de ubicaciones registradas.</p>
        </div>
        
        <div className="h-[320px] md:h-[420px] lg:h-[520px] xl:h-[580px] 2xl:h-[640px] w-full overflow-hidden rounded-xl border border-border shadow-inner">
          {activeRequest?.pickupLatitude && activeRequest?.pickupLongitude ? (
            <MapErrorBoundary>
              <RouteMapView 
                destinationLat={activeRequest.pickupLatitude}
                destinationLng={activeRequest.pickupLongitude}
                destinationAddress={activeRequest.direccion}
                restaurantName={activeRequest.empresaRazonSocial || "Restaurante asignado"}
                height="100%"
              />
            </MapErrorBoundary>
          ) : (
            <div className="h-full w-full bg-muted/20 flex flex-col items-center justify-center p-6 text-center border-dashed">
              <MapPinned className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium text-foreground">Mapa en espera</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                Acepta un recojo desde tu panel para visualizar la ruta de navegación.
              </p>
            </div>
          )}
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Navigation className="h-5 w-5 text-primary" /> Recojo en curso
      </h2>

      {loading ? (
        <Card className="p-8 animate-pulse bg-muted/50 h-40" />
      ) : activeRequest ? (
        <Card className="overflow-hidden border-primary/20 shadow-md">
          <div className="bg-primary/5 p-4 border-b border-border flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg text-primary">{activeRequest.empresaRazonSocial || "Restaurante"}</h3>
            </div>
            <Badge className={getEstadoBadge(activeRequest.estado)}>
              {getEstadoLabel(activeRequest.estado)}
            </Badge>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Dirección de Recojo</p>
                <div className="flex items-start gap-2">
                  <MapPinned className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="font-medium">{activeRequest.direccion || "No especificada"}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Contacto</p>
                <div className="space-y-1.5 bg-muted/30 p-3 rounded-md border border-border/50">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span><span className="font-medium text-muted-foreground">Responsable:</span> {activeRequest.contactoNombre || "No registrado"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span><span className="font-medium text-muted-foreground">Teléfono:</span> {activeRequest.contactoTelefono || "No registrado"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span><span className="font-medium text-muted-foreground">Correo:</span> {activeRequest.contactoCorreo || "No registrado"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span><span className="font-medium text-muted-foreground">RUC:</span> {activeRequest.empresaRuc || "No registrado"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 md:border-l md:border-border md:pl-6">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Detalles Operativos</p>
                <div className="flex items-center gap-2 mb-2">
                  <Droplet className="h-4 w-4 text-blue-500 shrink-0" />
                  <p className="text-sm font-medium">{activeRequest.volumenAproximado?.toLocaleString('es-PE')} L <span className="text-muted-foreground font-normal">estimados</span></p>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="text-sm">Creada: {activeRequest.fechaSolicitud ? new Date(activeRequest.fechaSolicitud).toLocaleDateString('es-PE', { hour: '2-digit', minute: '2-digit' }) : "Sin fecha"}</p>
                </div>
                {activeRequest.transportePlaca && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    <p className="text-sm">Unidad: <span className="font-mono bg-muted px-1 py-0.5 rounded text-xs">{activeRequest.transportePlaca}</span></p>
                  </div>
                )}

              </div>

              {activeRequest.observaciones && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Observaciones</p>
                  <p className="text-sm italic text-muted-foreground bg-muted/30 p-2 rounded border border-border/50">"{activeRequest.observaciones}"</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-8 flex flex-col items-center justify-center text-center border-dashed">
          <CheckCircle className="h-10 w-10 text-emerald-500/50 mb-3" />
          <p className="text-lg font-medium text-foreground">No tienes recojos en curso actualmente.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Ve a "Recojos del día" para aceptar nuevas solicitudes.
          </p>
        </Card>
      )}
    </DashboardShell>
  );
}
