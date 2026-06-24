import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Truck, Edit2 } from "lucide-react";
import { getStoredAuth } from "@/services/authStorage";
import { recolectorNav } from "./recolectorNav";
import { recolectorApi } from "../../services/recolectorApi";
import { ApiError } from "../../services/apiClient";
import { toast } from "sonner";
import { saveAuth } from "@/services/authStorage";
import { TransportUnitForm } from "@/components/transport/TransportUnitForm";

export interface TransporteDTO {
  id: number;
  placa: string;
  marca: string;
  modelo: string;
  capacidadLitros: number;
  tipoUnidad: string;
  estado: string;
  observaciones: string;
}

export function normalizePlate(value: string): string {
  if (!value) {
    throw new Error("Ingrese una placa válida. Use el formato ABC-123.");
  }
  const normalized = value.trim().toUpperCase().replace(/\s+/g, "");
  
  if (!/^[A-Z0-9-]+$/.test(normalized)) {
    throw new Error("Ingrese una placa válida. Use el formato ABC-123.");
  }
  
  // Standard formatted ABC-123
  if (/^[A-Z]{3}-\d{3}$/.test(normalized)) {
    return normalized;
  }
  
  // Standard raw ABC123
  if (/^[A-Z]{3}\d{3}$/.test(normalized)) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
  }
  
  // Special plate alfanumérica 6-8 chars
  if (/^[A-Z0-9]{6,8}$/.test(normalized)) {
    return normalized;
  }
  
  throw new Error("Ingrese una placa válida. Use el formato ABC-123.");
}

// ── Colores de estado ────────────────────────────────────────────────────────

const ESTADO_BADGE: Record<string, string> = {
  ACTIVO:          "bg-emerald-100 text-emerald-800",
  INACTIVO:        "bg-slate-100 text-slate-600",
  EN_MANTENIMIENTO:"bg-amber-100 text-amber-800",
  NO_DISPONIBLE:   "bg-red-100 text-red-700",
};

// ── Componente ────────────────────────────────────────────────────────────────

export default function RecolectorTransportes() {
  const auth = getStoredAuth();
  const user = {
    name: auth?.companyName || "Recolector",
    sub:  auth?.email             || "No autenticado",
  };

  const [transportes, setTransportes] = useState<TransporteDTO[]>([]);

  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    placa: "", marca: "", modelo: "", capacidadLitros: "", tipoUnidad: "Cisterna", estado: "ACTIVO", observaciones: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchUnidades = () => {
    setLoading(true);
    setError(null);
    recolectorApi.getUnidades()
      .then((res) => setTransportes(res.data ?? []))
      .catch((e: any) => setError(e instanceof ApiError ? e.message : "Error al cargar unidades de transporte"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // Sincronizar estado real del backend
    recolectorApi.getDashboard().then(res => {
      if (res.success && res.data && auth) {
        const d = res.data as Record<string, any>;
        if (d.estado && auth.subscriptionStatus !== d.estado) {
          saveAuth({ ...auth, subscriptionStatus: d.estado });
        }
      }
    }).catch(() => {});

    fetchUnidades();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let normalizedPlaca = "";
    try {
      normalizedPlaca = normalizePlate(formData.placa);
    } catch (err: any) {
      toast.error(err.message);
      return;
    }

    if (formData.modelo.trim().length > 20) {
      toast.error("El modelo no puede superar 20 caracteres.");
      return;
    }

    const capacity = Number(formData.capacidadLitros);
    if (capacity <= 0) {
      toast.error("La capacidad debe ser mayor a 0 litros.");
      return;
    }
    if (capacity > 5000) {
      toast.error("La capacidad máxima permitida es 5000 litros.");
      return;
    }
    if (!Number.isInteger(capacity)) {
      toast.error("La capacidad debe ser un número entero de litros.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        placa: normalizedPlaca,
        marca: formData.marca,
        modelo: formData.modelo,
        tipoUnidad: formData.tipoUnidad,
        capacidadLitros: Number(formData.capacidadLitros),
        estado: formData.estado,
        observaciones: formData.observaciones
      };

      if (editingId) {
        await recolectorApi.actualizarUnidad(editingId, payload);
        toast.success("Unidad vehicular actualizada correctamente.");
      } else {
        await recolectorApi.crearUnidad(payload);
        toast.success("Unidad vehicular registrada correctamente.");
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({ placa: "", marca: "", modelo: "", capacidadLitros: "", tipoUnidad: "Cisterna", estado: "ACTIVO", observaciones: "" });
      fetchUnidades();
    } catch (e: any) {
      toast.error(e instanceof ApiError ? e.message : "Error al procesar la unidad");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (t: TransporteDTO) => {
    setEditingId(t.id);
    setFormData({
      placa: t.placa || "",
      marca: t.marca || "",
      modelo: t.modelo || "",
      capacidadLitros: t.capacidadLitros ? String(t.capacidadLitros) : "",
      tipoUnidad: t.tipoUnidad || "Cisterna",
      estado: t.estado || "ACTIVO",
      observaciones: t.observaciones || ""
    });
    setShowForm(true);
  };

  return (
    <DashboardShell role="Recolector" user={user} nav={recolectorNav}>

      {/* Cabecera */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Badge className="bg-accent text-accent-foreground mb-2">Mis unidades</Badge>
          <h1 className="font-display text-3xl font-bold">Unidades de transporte</h1>
          <p className="text-sm text-muted-foreground">
            Vehículos asignados a tu empresa recolectora.
          </p>
        </div>
        {(!showForm && transportes.length === 0) && (
          <button 
            onClick={() => setShowForm(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            + Agregar unidad
          </button>
        )}
        {showForm && (
          <button 
            onClick={() => {
              setShowForm(false);
              setEditingId(null);
              setFormData({ placa: "", marca: "", modelo: "", capacidadLitros: "", tipoUnidad: "Cisterna", estado: "ACTIVO", observaciones: "" });
            }}
            className="bg-muted text-muted-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-muted/80 transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>

      {showForm && (
        <Card className="mb-6 p-6">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? "Actualizar Unidad Vehicular" : "Registrar Unidad Vehicular"}
          </h2>
          <TransportUnitForm 
            value={formData}
            onChange={setFormData}
            onSubmit={handleSubmit}
            submitting={submitting}
            editing={editingId !== null}
          />
        </Card>
      )}

      {/* Contenido */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-3 animate-pulse">
              <div className="h-6 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <Card className="p-6 text-center">
          <p className="text-destructive font-medium">{error}</p>
        </Card>
      ) : transportes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Truck className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">
            No hay unidades registradas para tu empresa recolectora.
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Contacta al administrador para registrar tus vehículos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {transportes.map((t) => (
            <Card key={t.id} className="p-5 space-y-3 hover:shadow-md transition-shadow">
              {/* Placa + Estado + Editar */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-xl font-bold tracking-wider">{t.placa}</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ESTADO_BADGE[t.estado] ?? "bg-muted text-muted-foreground"}`}>
                    {t.estado.replace(/_/g, " ")}
                  </span>
                  <button 
                    onClick={() => handleEdit(t)} 
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors"
                    title="Editar unidad"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Marca / Modelo */}
              <p className="font-medium text-sm">
                {[t.marca, t.modelo].filter(Boolean).join(" ") || "Marca/modelo no registrado"}
              </p>

              {/* Detalles */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <div><span className="font-medium text-foreground/80">Capacidad: </span>{t.capacidadLitros?.toLocaleString("es-PE") ?? "—"} L</div>
                <div><span className="font-medium text-foreground/80">Tipo: </span>{t.tipoUnidad ?? "—"}</div>
              </div>

              {/* Observaciones */}
              {t.observaciones && (
                <p className="text-xs text-muted-foreground italic border-t border-border pt-2">
                  {t.observaciones}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Conteo */}
      {!loading && !error && transportes.length > 0 && (
        <p className="text-xs text-muted-foreground text-right mt-4">
          {transportes.length} unidad{transportes.length !== 1 ? "es" : ""} registrada{transportes.length !== 1 ? "s" : ""}
        </p>
      )}

    </DashboardShell>
  );
}
