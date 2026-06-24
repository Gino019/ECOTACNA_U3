import { DashboardShell } from "@/components/DashboardShell";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Check, Download, Eye, Search, ShieldCheck, X } from "lucide-react";
import { adminNav, adminUser } from "./adminNav";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "@/services/adminApi";
import { AdminCompanyDetailModal } from "./AdminCompanyDetailModal";
import { AdminEmpresasRechazadasModal } from "./AdminEmpresasRechazadasModal";
import { StatusBadge } from "@/components/StatusBadge";

const SkeletonRow = ({ cols = 7 }: { cols?: number }) => (
  <TableRow>
    {Array.from({ length: cols }).map((_, i) => (
      <TableCell key={i}><div className="h-4 bg-muted animate-pulse rounded-md" /></TableCell>
    ))}
  </TableRow>
);

export default function AdminEmpresas() {
  const navigate = useNavigate();
  const [data, setData]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [showRechazadasModal, setShowRechazadasModal] = useState(false);

  const loadData = () => {
    setLoading(true);
    adminApi.getEmpresas()
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) setData(res.data);
        else setData([]);
      })
      .catch(err => {
        if (err.isAuthError) { toast.error("Sesión expirada"); navigate("/login"); }
        else { setData([]); toast.error("Error al cargar empresas registradas"); }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [navigate]);

  const handleApprove = async (id: number) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      const res = await adminApi.approveCompany(id);
      setData(prev => prev.map(c => c.id === id ? { ...c, estado: res.data?.estado || "PENDIENTE_PAGO" } : c));
      toast.success("Empresa aprobada correctamente");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al aprobar la empresa");
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm("¿Está seguro de rechazar esta empresa?")) return;
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      const res = await adminApi.rejectCompany(id);
      setData(prev => prev.map(c => c.id === id ? { ...c, estado: res.data?.estado || "CANCELADA" } : c));
      toast.success("Empresa rechazada correctamente");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al rechazar la empresa");
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const pendientes = data.filter((e: any) => e.estado?.toString().toUpperCase() === "PENDIENTE");
  const activas    = data.filter((e: any) => ["ACTIVA", "ACTIVO", "REGISTRADA", "REGISTRADO", "PRUEBA_ACTIVA", "PENDIENTE_PAGO"].includes(e.estado?.toString().toUpperCase()));
  const litros     = data.reduce((t: number, e: any) => t + Number(e.litros ?? 0), 0);

  return (
    <DashboardShell role="Administrador" user={adminUser} nav={adminNav}>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-secondary text-secondary-foreground">Módulo administrativo</Badge>
            <Badge variant="outline" className="border-eco/40 text-eco"><ShieldCheck className="h-3 w-3 mr-1"/> Registro validado</Badge>
          </div>
          <h1 className="font-display text-3xl font-bold">Empresas registradas</h1>
          <p className="text-sm text-muted-foreground">Alta, validación y seguimiento de restaurantes, pollerías y generadores.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowRechazadasModal(true)}>
            Ver rechazadas
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Building2}   label="Empresas totales"  value={loading ? "—" : data.length}             tone="primary" />
        <StatCard icon={ShieldCheck} label="Verificadas"       value={loading ? "—" : activas.length}          tone="success" />
        <StatCard icon={Search}      label="Pendientes"        value={loading ? "—" : pendientes.length}       tone="warning" />
        <StatCard icon={Download}    label="Litros acumulados" value={loading ? "—" : litros.toLocaleString()} unit="L" tone="info" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Tabla principal */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold">Listado empresarial</h3>
              <p className="text-xs text-muted-foreground">Empresas registradas en el sistema.</p>
            </div>
            <Button size="sm" variant="outline" disabled title="Alta manual diferida">Nueva empresa</Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Empresa / Razón social</TableHead>
                  <TableHead className="min-w-[110px]">RUC</TableHead>
                  <TableHead className="min-w-[100px]">Correo de contacto</TableHead>
                  <TableHead className="min-w-[130px]">Número de contacto</TableHead>
                  <TableHead className="text-right min-w-[80px]">Litros</TableHead>
                  <TableHead className="min-w-[100px]">Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
                  : data.length === 0
                    ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Sin empresas registradas</TableCell></TableRow>
                    : data.map((e: any) => (
                      <TableRow key={e.id}>
                        <TableCell className="max-w-[200px]">
                          {/* Truncado con title para ver nombre completo en hover */}
                          <div className="font-semibold text-sm truncate" title={e.razonSocial}>{e.razonSocial || "Información no disponible"}</div>
                          {e.tipoEmpresa && <div className="text-xs text-muted-foreground truncate">{e.tipoEmpresa}</div>}
                        </TableCell>
                        <TableCell className="font-mono text-xs whitespace-nowrap">{e.ruc}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {e.correoContacto ? (
                            <a href={`mailto:${e.correoContacto}`} className="text-eco hover:underline">{e.correoContacto}</a>
                          ) : (
                            "Información no disponible"
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{e.numeroContacto || "Información no disponible"}</TableCell>
                        <TableCell className="text-right font-mono text-sm whitespace-nowrap">{Number(e.totalLiters ?? 0).toLocaleString()} L</TableCell>
                        <TableCell>
                          <StatusBadge status={e.estado} />
                        </TableCell>
                        <TableCell><Button size="sm" variant="ghost" onClick={() => setSelectedCompanyId(e.id)}><Eye className="h-4 w-4"/></Button></TableCell>
                      </TableRow>
                    ))
                }
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Panel pendientes */}
        <Card className="p-5">
          <h3 className="font-display font-bold mb-1">Pendientes de aprobación</h3>
          <p className="text-xs text-muted-foreground mb-4">Empresas pendientes según estado registrado en base de datos.</p>
          <div className="space-y-3">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-3 rounded-xl bg-muted/40 border border-border space-y-2 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4" /><div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))
              : pendientes.length === 0
                ? <div className="text-sm text-muted-foreground text-center py-6">Sin empresas pendientes</div>
                : pendientes.map((e: any) => (
                  <div key={e.id} className="p-3 rounded-xl bg-muted/40 border border-border relative">
                    <Button size="sm" variant="ghost" className="absolute top-2 right-2 h-7 w-7 p-0" onClick={() => setSelectedCompanyId(e.id)} title="Ver detalles">
                      <Eye className="h-4 w-4 text-muted-foreground"/>
                    </Button>
                    <div className="font-semibold text-sm truncate pr-8" title={e.razonSocial}>{e.razonSocial || "Información no disponible"}</div>
                    <div className="text-xs text-muted-foreground mb-3">
                      RUC {e.ruc} · {e.tipoEmpresa || "Generadora"}
                      <br/>
                      {e.correoContacto ? <a href={`mailto:${e.correoContacto}`} className="text-eco hover:underline">{e.correoContacto}</a> : "Información no disponible"} · {e.numeroContacto || "Información no disponible"}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1" 
                        disabled={actionLoading[e.id]}
                        onClick={() => handleReject(e.id)}
                      >
                        <X className="h-3.5 w-3.5 mr-1"/> Rechazar
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1 bg-success text-success-foreground hover:bg-success/90" 
                        disabled={actionLoading[e.id]}
                        onClick={() => handleApprove(e.id)}
                      >
                        <Check className="h-3.5 w-3.5 mr-1"/> Aprobar
                      </Button>
                    </div>
                  </div>
                ))
            }
          </div>
        </Card>
      </div>

      <AdminCompanyDetailModal 
        companyId={selectedCompanyId} 
        onClose={() => setSelectedCompanyId(null)} 
      />

      <AdminEmpresasRechazadasModal
        isOpen={showRechazadasModal}
        onClose={() => setShowRechazadasModal(false)}
        onCompanyAdmitted={loadData}
      />
    </DashboardShell>
  );
}
