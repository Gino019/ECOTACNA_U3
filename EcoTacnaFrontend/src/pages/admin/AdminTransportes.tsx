import { useState, useEffect, useCallback } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Bus } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { adminNav, adminUser } from "./adminNav";
import { adminApi } from "../../services/adminApi";
import { ApiError } from "../../services/apiClient";

const ESTADO_BADGE: Record<string, string> = {
  ACTIVO:          "bg-emerald-100 text-emerald-800",
  INACTIVO:        "bg-slate-100 text-slate-600",
  EN_MANTENIMIENTO:"bg-amber-100 text-amber-800",
  NO_DISPONIBLE:   "bg-red-100 text-red-700",
};

const SkeletonRow = () => (
  <TableRow>
    {Array.from({ length: 6 }).map((_, i) => (
      <TableCell key={i}><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
    ))}
  </TableRow>
);

export default function AdminTransportes() {
  const navigate = useNavigate();

  // ── Estado datos
  const [transportes, setTransportes]   = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  // ── Filtros
  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [filtroEstado,   setFiltroEstado]   = useState("");
  const [filtroEmpresa,  setFiltroEmpresa]  = useState("");

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getTransportes();
      setTransportes(res.data ?? []);
    } catch (e: any) {
      if (e instanceof ApiError && e.isAuthError) {
        toast.error("Sesión expirada");
        navigate("/login");
        return;
      }
      setError(e instanceof ApiError ? e.message : "Error al cargar transportes");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { cargar(); }, [cargar]);

  // ── Filtrado local
  const datosFiltrados = transportes.filter((t) => {
    const busq = filtroBusqueda.toLowerCase();
    const placa = String(t.placa ?? "").toLowerCase();
    const marca = String(t.marca ?? "").toLowerCase();
    const modelo = String(t.modelo ?? "").toLowerCase();
    
    const ok1  = !busq || placa.includes(busq) || marca.includes(busq) || modelo.includes(busq);
    const ok2  = !filtroEstado || t.estado === filtroEstado;
    const ok3  = !filtroEmpresa || String(t.empresa_razon_social ?? t.empresaRazonSocial ?? "").toLowerCase().includes(filtroEmpresa.toLowerCase());
    return ok1 && ok2 && ok3;
  });

  const empresasUnicas = Array.from(new Set(transportes.map((t) => t.empresa_razon_social ?? t.empresaRazonSocial ?? "Desconocida"))).sort();

  return (
    <DashboardShell role="Administrador" user={adminUser} nav={adminNav}>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-secondary text-secondary-foreground">Módulo administrativo</Badge>
          </div>
          <h1 className="font-display text-3xl font-bold">Transportes</h1>
          <p className="text-sm text-muted-foreground">
            Gestión de unidades de transporte de empresas recolectoras.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <input
          type="text"
          placeholder="Buscar por placa, marca, modelo..."
          value={filtroBusqueda}
          onChange={(e) => setFiltroBusqueda(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">Todos los estados</option>
          {["ACTIVO", "INACTIVO", "EN_MANTENIMIENTO", "NO_DISPONIBLE"].map((e) => (
            <option key={e} value={e}>{e.replace(/_/g, " ")}</option>
          ))}
        </select>
        <select
          value={filtroEmpresa}
          onChange={(e) => setFiltroEmpresa(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">Todas las empresas</option>
          {empresasUnicas.map((emp) => (
            <option key={String(emp)} value={String(emp)}>{String(emp)}</option>
          ))}
        </select>
      </div>

      <Card className="p-5">
        {error ? (
          <div className="text-center py-8">
            <p className="text-destructive font-medium mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={cargar}>Reintentar</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {["Placa","Empresa recolectora","Marca / Modelo","Cap. (L)","Tipo","Estado"].map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  : datosFiltrados.length === 0
                    ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                          {transportes.length === 0
                            ? <><Bus className="h-8 w-8 mx-auto mb-2 opacity-30" /><p>No hay transportes registrados.</p></>
                            : "No hay resultados con los filtros actuales."}
                        </TableCell>
                      </TableRow>
                    )
                    : datosFiltrados.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono font-semibold">{t.placa}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={t.empresa_razon_social ?? t.empresaRazonSocial}>{t.empresa_razon_social ?? t.empresaRazonSocial}</TableCell>
                        <TableCell>{[t.marca, t.modelo].filter(Boolean).join(" ") || "—"}</TableCell>
                        <TableCell>{Number(t.capacidad_litros ?? t.capacidadLitros ?? 0).toLocaleString("es-PE")}</TableCell>
                        <TableCell>{t.tipo_unidad ?? t.tipoUnidad ?? "—"}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ESTADO_BADGE[t.estado] ?? "bg-muted text-muted-foreground"}`}>
                            {String(t.estado ?? "").replace(/_/g, " ")}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                }
              </TableBody>
            </Table>
          </div>
        )}
        {!loading && !error && (
          <p className="text-xs text-muted-foreground text-right mt-3">
            {datosFiltrados.length} de {transportes.length} registros
          </p>
        )}
      </Card>
    </DashboardShell>
  );
}

