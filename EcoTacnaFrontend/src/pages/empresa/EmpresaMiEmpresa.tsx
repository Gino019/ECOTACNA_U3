import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { empresaApi } from "@/services/empresaApi";
import { ApiError } from "@/services/apiClient";
import { getStoredAuth } from "@/services/authStorage";
import { empresaNav } from "./empresaNav";
import { ContactoForm } from "@/components/ContactoForm";
import { SubscriptionStatusCard } from "@/components/profile/SubscriptionStatusCard";
import { GoogleMapView } from "@/components/maps/GoogleMapView";
import { toast } from "sonner";
import { MapPin, Edit3, X, Save, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const Field = ({ label, value, className = "" }: { label: string; value: string; className?: string }) => (
  <div className={className}>
    <Label>{label}</Label>
    <Input value={value} readOnly />
  </div>
);
export interface CompanyLocation {
  id: number | null;
  name: string;
  referenceAddress?: string | null;
  latitude: number | null;
  longitude: number | null;
  isPrimary: boolean;
}

interface PerfilEmpresa {
  razonSocial: string;
  ruc: string;
  correo?: string;
  tipoEmpresa: string;
  direccion: string;
  creadoEn?: string;
  personaContacto?: string;
  telefono?: string;
  locations?: CompanyLocation[];
}

export default function EmpresaMiEmpresa() {
  const auth = getStoredAuth();
  const [user, setUser] = useState({ name: auth?.companyName || "Empresa", sub: auth?.email || "No autenticado" });
  const [perfil, setPerfil] = useState<PerfilEmpresa | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Editor de sedes
  const [isLocationEditorOpen, setIsLocationEditorOpen] = useState(false);
  const [locationMode, setLocationMode] = useState<'EDIT' | 'CREATE_BRANCH'>('EDIT');
  const [editingLocationId, setEditingLocationId] = useState<number | null>(null);
  const [editingPosition, setEditingPosition] = useState<{latitude: number, longitude: number, placeId?: string, formattedAddress?: string} | null>(null);
  const [branchName, setBranchName] = useState('');
  const [branchReference, setBranchReference] = useState('');
  const [isSavingLocation, setIsSavingLocation] = useState(false);

  useEffect(() => {
    const loadPerfil = async () => {
      try {
        const res = await empresaApi.getPerfil();
        if (res.success && res.data) {
          setPerfil(res.data);
          setUser({ name: res.data.razonSocial, sub: res.data.correo || `RUC ${res.data.ruc}` });
          import("@/services/authStorage").then(({ saveAuth, getStoredAuth }) => {
            const currentAuth = getStoredAuth();
            if (currentAuth && currentAuth.companyName !== res.data.razonSocial) {
              saveAuth({ ...currentAuth, companyName: res.data.razonSocial });
            }
          });
          return;
        }
        setMessage(res.message || "Perfil no encontrado en backend");
      } catch (error: unknown) {
        if (error instanceof ApiError) {
          if (error.status === 401) {
            setMessage("Sesión expirada");
            return;
          }
          if (error.status === 403) {
            setMessage("No autorizado");
            return;
          }
        }
        setMessage(error instanceof Error ? error.message : "Error de red");
      }
    };

    loadPerfil();
  }, []);

  return (
    <DashboardShell role="Empresa" user={user} nav={empresaNav}>
      <div className="mb-6">
        <Badge className="bg-primary text-primary-foreground mb-2">Perfil empresarial</Badge>
        {message ? <Badge variant="outline" className="ml-2 text-destructive border-destructive">{message}</Badge> : null}
        <h1 className="font-display text-3xl font-bold">Mi empresa</h1>
        <p className="text-sm text-muted-foreground">Datos reales leídos desde backend.</p>
      </div>

      {perfil ? (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold">{perfil.razonSocial}</h3>
              <p className="text-xs text-muted-foreground">RUC {perfil.ruc}</p>
            </div>
            <Badge className="bg-success text-success-foreground">
              <ShieldCheck className="h-3 w-3 mr-1" /> {perfil.tipoEmpresa}
            </Badge>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Razón social" value={perfil.razonSocial} />
            <Field label="RUC" value={perfil.ruc} />
            <Field label="Tipo de empresa" value={perfil.tipoEmpresa} />
            <Field label="Creado en" value={perfil.creadoEn ? new Date(perfil.creadoEn).toLocaleString("es-PE") : "No registrado"} />
            <Field label="Dirección operativa" value={perfil.direccion} className="sm:col-span-2" />
          </div>
        </Card>
      ) : (
        <Card className="p-5 text-muted-foreground">{message === "Perfil no encontrado" ? "Perfil no encontrado en backend" : (message || "Perfil no encontrado en backend")}</Card>
      )}

      {perfil && (
        <ContactoForm 
          initialData={{
            personaContacto: perfil.personaContacto,
            correo: perfil.correo,
            telefono: perfil.telefono,
          }}
          onSave={async (data) => {
            try {
              const res = await empresaApi.actualizarContacto(data);
              if (res.success && res.data) {
                if (res.data.newToken) {
                  const storedStr = localStorage.getItem("ecotacna_auth");
                  if (storedStr) {
                    const auth = JSON.parse(storedStr);
                    auth.token = res.data.newToken;
                    auth.email = data.email;
                    localStorage.setItem("ecotacna_auth", JSON.stringify(auth));
                  }
                }
                setPerfil(res.data.updatedProfile as PerfilEmpresa);
                setUser({ name: res.data.updatedProfile.razonSocial, sub: res.data.updatedProfile.correo || `RUC ${res.data.updatedProfile.ruc}` });
                return { success: true };
              }
              return { success: false, message: res.message };
            } catch (error: any) {
              return { success: false, message: error.message || "Error de conexión" };
            }
          }}
          onSuccess={() => {}}
        />
      )}

      {perfil && (
        <Card className="p-5 mt-6 mb-6">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Ubicaciones registradas
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Consulta las sedes registradas para coordinar los recojos.
              </p>
            </div>
            <Button variant="outline" className="shrink-0 gap-2" onClick={() => {
              setIsLocationEditorOpen(true);
              setLocationMode('EDIT');
              if (perfil.locations && perfil.locations.length > 0) {
                const primary = perfil.locations.find(l => l.isPrimary) || perfil.locations[0];
                setEditingLocationId(primary.id);
                if (primary.latitude != null && primary.longitude != null) {
                  setEditingPosition({ latitude: Number(primary.latitude), longitude: Number(primary.longitude) });
                } else {
                  setEditingPosition(null);
                }
              } else {
                setEditingPosition(null);
              }
            }}>
              <Edit3 className="h-4 w-4" />
              Editar ubicaciones
            </Button>
          </div>

          {perfil.locations && perfil.locations.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.25fr)_420px]">
              <div className="rounded-xl overflow-hidden border border-border shadow-sm">
                <GoogleMapView 
                  markers={perfil.locations.map(loc => ({
                    id: String(loc.id ?? loc.name),
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    label: loc.name,
                    description: loc.referenceAddress || perfil.direccion,
                    type: loc.isPrimary ? 'company' : 'selected'
                  })) as any[]}
                  height="420px"
                />
              </div>
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-foreground mb-3">Lista de sedes ({perfil.locations.length})</h4>
                <div className="max-h-[380px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {perfil.locations.map((loc, idx) => (
                    <div key={loc.id ?? `loc-${idx}`} className="p-4 rounded-lg border border-border bg-card/50 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm">{loc.name}</span>
                        {loc.isPrimary ? (
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 text-[10px] border-none px-2 py-0.5">Principal</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-dashed border-muted-foreground/30 text-muted-foreground">Adicional</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                        {loc.referenceAddress || (loc.isPrimary ? perfil.direccion : "Sin referencia detallada")}
                      </p>
                      <div className="text-[10px] font-mono text-muted-foreground/70 bg-muted/50 p-1.5 rounded inline-block">
                        {loc.latitude != null && loc.longitude != null ? 
                          `Lat: ${Number(loc.latitude).toFixed(6)} | Lng: ${Number(loc.longitude).toFixed(6)}` 
                          : "Sin coordenadas registradas"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 bg-muted/30 rounded-xl border border-dashed border-border">
              <MapPin className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <h4 className="font-medium text-foreground">No hay ubicaciones registradas</h4>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Las ubicaciones aparecerán aquí cuando se registren desde el formulario inicial o de configuración.
              </p>
            </div>
          )}
        </Card>
      )}

      <SubscriptionStatusCard />

      {/* MODAL EDITOR DE SEDES */}
      {isLocationEditorOpen && perfil && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="max-h-[90vh] w-[95vw] max-w-[1000px] flex flex-col overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl md:p-8 relative">
            <button 
              onClick={() => setIsLocationEditorOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-bold font-display flex items-center gap-2 mb-2">
              <Edit3 className="h-6 w-6 text-primary" /> Editar ubicaciones
            </h2>
            <p className="text-sm text-muted-foreground mb-6">Mueve el pin en el mapa o usa el buscador para actualizar la coordenada exacta de tu sede.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 flex-1 min-h-0">
              <div className="space-y-5 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <Label className="block">
                    {locationMode === 'EDIT' ? "Selecciona la sede a editar" : "Nueva sede adicional"}
                  </Label>
                  {locationMode === 'EDIT' && (
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-primary" onClick={() => {
                      setLocationMode('CREATE_BRANCH');
                      setEditingLocationId(null);
                      setEditingPosition(null);
                      setBranchName('');
                      setBranchReference('');
                    }}>
                      <Plus className="h-3 w-3 mr-1" /> Nueva sede
                    </Button>
                  )}
                  {locationMode === 'CREATE_BRANCH' && (
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground" onClick={() => {
                      setLocationMode('EDIT');
                      if (perfil.locations && perfil.locations.length > 0) {
                        const primary = perfil.locations.find(l => l.isPrimary) || perfil.locations[0];
                        setEditingLocationId(primary.id);
                        if (primary.latitude != null && primary.longitude != null) {
                          setEditingPosition({ latitude: Number(primary.latitude), longitude: Number(primary.longitude) });
                        } else {
                          setEditingPosition(null);
                        }
                      }
                    }}>
                      Cancelar
                    </Button>
                  )}
                </div>

                {locationMode === 'EDIT' ? (
                  <select 
                    className="w-full h-10 border border-input bg-background px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-ring mb-2"
                    value={editingLocationId ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setEditingLocationId(null);
                        setEditingPosition(null);
                        return;
                      }
                      const id = Number(val);
                      setEditingLocationId(id);
                      const loc = perfil.locations?.find(l => l.id === id);
                      if (loc && loc.latitude != null && loc.longitude != null) {
                        setEditingPosition({ latitude: Number(loc.latitude), longitude: Number(loc.longitude) });
                      } else {
                        setEditingPosition(null);
                      }
                    }}
                  >
                    {perfil.locations?.map(l => (
                      <option key={l.id} value={l.id ?? ""}>{l.isPrimary ? "Sede principal: " : "Sede adicional: "}{l.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-3 mb-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Nombre de sede *</Label>
                      <Input 
                        placeholder="Ej. Sucursal Centro" 
                        value={branchName}
                        onChange={(e) => setBranchName(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Referencia / Dirección</Label>
                      <Input 
                        placeholder="Ej. Frente a la plaza principal..." 
                        value={branchReference}
                        onChange={(e) => setBranchReference(e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                )}


                <div className="bg-muted/30 p-4 rounded-xl border border-border mt-auto">
                  <h4 className="font-semibold text-sm mb-1">Coordenadas actuales</h4>
                  <div className="text-xs font-mono text-muted-foreground">
                    Lat: {editingPosition ? editingPosition.latitude.toFixed(6) : "Sin registrar"} <br/>
                    Lng: {editingPosition ? editingPosition.longitude.toFixed(6) : "Sin registrar"}
                  </div>
                </div>
              </div>

              <div className="h-[400px] lg:h-full min-h-[400px] rounded-xl overflow-hidden border border-border">
                  <GoogleMapView 
                    markers={editingPosition ? [{
                      id: "editing-pin",
                      latitude: editingPosition.latitude,
                      longitude: editingPosition.longitude,
                      label: "Mueve este pin",
                      type: "selected"
                    }] : []}
                    height="100%"
                    selectable={true}
                    selectedPosition={editingPosition ? { latitude: editingPosition.latitude, longitude: editingPosition.longitude } : undefined}
                    selectionLabel="Nueva ubicación de la sede"
                    onSelectPosition={(pos) => {
                      setEditingPosition({ latitude: pos.latitude, longitude: pos.longitude });
                    }}
                  />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border">
              <Button variant="outline" onClick={() => setIsLocationEditorOpen(false)}>Cancelar</Button>
              <Button 
                onClick={async () => {
                  if (!editingPosition) {
                    toast.error("Debes seleccionar una ubicación en el mapa");
                    return;
                  }
                  if (locationMode === 'EDIT' && (editingLocationId === null || editingLocationId === undefined)) {
                    toast.error("Debes seleccionar una sede para editar");
                    return;
                  }
                  if (locationMode === 'CREATE_BRANCH' && !branchName.trim()) {
                    toast.error("El nombre de la sede es obligatorio");
                    return;
                  }
                  setIsSavingLocation(true);
                  try {
                    let res;
                    if (locationMode === 'CREATE_BRANCH') {
                      res = await empresaApi.createCompanyLocation({
                        name: branchName,
                        reference: branchReference,
                        latitude: editingPosition.latitude,
                        longitude: editingPosition.longitude,
                        address: editingPosition.formattedAddress,
                        placeId: editingPosition.placeId
                      });
                    } else {
                      res = await empresaApi.updateCompanyLocation(editingLocationId!, {
                        latitude: editingPosition.latitude,
                        longitude: editingPosition.longitude,
                        placeId: editingPosition.placeId,
                        placeName: editingPosition.formattedAddress,
                        formattedAddress: editingPosition.formattedAddress,
                        locationSource: "MANUAL_ADJUSTED"
                      });
                    }
                    if (res.success) {
                      toast.success(locationMode === 'CREATE_BRANCH' ? "Sede agregada con éxito" : "Ubicación guardada con éxito");
                      const profileRes = await empresaApi.getPerfil();
                      if (profileRes.success && profileRes.data) {
                         setPerfil(profileRes.data as PerfilEmpresa);
                      }
                      setIsLocationEditorOpen(false);
                    } else {
                      toast.error(res.message || "Error al guardar la ubicación");
                    }
                  } catch (e: any) {
                    toast.error(e.message || "Error de red al guardar");
                  } finally {
                    setIsSavingLocation(false);
                  }
                }}
                disabled={isSavingLocation}
                className="gap-2 bg-primary hover:bg-primary/90 text-white"
              >
                {isSavingLocation ? "Guardando..." : <><Save className="h-4 w-4"/> Guardar cambios</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
