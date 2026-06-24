import { useEffect, useState } from "react";

import {
  CheckCircle2, Clock, Droplets, DollarSign, Truck, ShieldCheck, Package,
  Mail, Phone, MapPin, User, Building2, CreditCard, AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DashboardShell } from "@/components/DashboardShell";
import { StatCard } from "@/components/StatCard";
import { getStoredAuth } from "@/services/authStorage";
import { recolectorApi } from "@/services/recolectorApi";
import { recolectorNav } from "./recolector/recolectorNav";
import { getEstadoLabel, getEstadoBadge } from "@/lib/utils";

/* ── helpers ── */
const fmt = (n: number | null | undefined, decimals = 2) =>
  n != null ? Number(n).toLocaleString("es-PE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : "0.00";

const fmtPhone = (p: string | null | undefined) => {
  if (!p) return "No registrado";
  const clean = p.replace(/\D/g, "");
  if (clean.length === 9) return `+51 ${clean.slice(0,3)} ${clean.slice(3,6)} ${clean.slice(6)}`;
  return p;
};

const fmtDate = (d: string | null | undefined) => {
  if (!d) return "Sin fecha";
  const date = new Date(d);
  return isNaN(date.getTime()) ? String(d) : date.toLocaleDateString("es-PE", { year: "numeric", month: "2-digit", day: "2-digit" });
};

const statusLabel = (s: string | null | undefined) => {
  if (!s) return "-";
  const map: Record<string, string> = {
    ACTIVA: "Activa", COMPLETADO: "Completado", PAGADO: "Pagado",
    PENDIENTE: "Pendiente", EN_RUTA: "En ruta", EN_SITIO: "En sitio", PROGRAMADO: "Programado",
    CANCELADO: "Cancelado", RECOGIDO: "Recogido", ACTIVO: "Activo",
    TRIAL: "Prueba", PRUEBA: "Prueba", SIN_SUSCRIPCION: "Sin suscripción",
    DESCONOCIDO: "Desconocido",
  };
  return map[s] || s;
};

/* ── Bar Chart (pure CSS) ── */
const BarChart = ({ data }: { data: { pickupId: number; liters: number }[] }) => {
  if (!data.length) return <p className="text-sm text-muted-foreground text-center py-8">Sin datos de rendimiento aún.</p>;
  const maxLiters = Math.max(...data.map(d => Number(d.liters)), 1);
  return (
    <div className="flex items-end gap-3 h-[200px] pt-4">
      {data.map((item) => {
        const height = Math.max((Number(item.liters) / maxLiters) * 100, 8);
        return (
          <div key={item.pickupId} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs font-semibold text-foreground">{fmt(Number(item.liters), 2)} L</span>
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-500"
              style={{ height: `${height}%`, minHeight: "8px" }}
            />
            <span className="text-[10px] text-muted-foreground">ID {item.pickupId}</span>
          </div>
        );
      })}
    </div>
  );
};

/* ── Main Component ── */
const RecolectorDashboard = () => {
  const auth = getStoredAuth();
  const [user, setUser] = useState({
    name: auth?.companyName || auth?.email || "Cargando...",
    sub: auth?.email || "Cargando...",
  });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await recolectorApi.getDashboardGeneral();
        if (res.success && res.data) {
          setData(res.data);
          if (res.data.company) {
            setUser({
              name: res.data.company.businessName || auth?.companyName || "Sin nombre",
              sub: res.data.company.email || auth?.email || "Sin correo",
            });
          }
          // Sync auth storage with fresh backend data
          import("@/services/authStorage").then(({ saveAuth, getStoredAuth }) => {
            const currentAuth = getStoredAuth();
            if (currentAuth) {
              const updatedAuth = { ...currentAuth };
              if (res.data.company?.businessName) updatedAuth.companyName = res.data.company.businessName;
              if (res.data.company?.ruc) updatedAuth.ruc = res.data.company.ruc;
              if (res.data.kpis?.subscriptionStatus) updatedAuth.subscriptionStatus = res.data.kpis.subscriptionStatus;
              saveAuth(updatedAuth);
            }
          });
        }
      } catch (err: any) {
        setError(err.message || "No se pudo cargar el panel general del recolector.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <DashboardShell role="Recolector" user={user} nav={recolectorNav}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-muted-foreground">Cargando panel general...</div>
        </div>
      </DashboardShell>
    );
  }

  if (error || !data) {
    return (
      <DashboardShell role="Recolector" user={user} nav={recolectorNav}>
        <Card className="p-8 flex flex-col items-center justify-center text-center border-destructive/30">
          <AlertCircle className="h-10 w-10 text-destructive/50 mb-3" />
          <p className="text-lg font-medium">{error || "No se pudo cargar el panel general del recolector."}</p>
        </Card>
      </DashboardShell>
    );
  }

  const { company, kpis, vehicle, subscription, performance, recentCompletedPickups, availablePickups } = data;

  return (
    <DashboardShell role="Recolector" user={user} nav={recolectorNav}>
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-success text-success-foreground">
              <ShieldCheck className="h-3 w-3 mr-1" /> Recolector autorizado
            </Badge>
            {company?.ruc && <Badge variant="outline">RUC {company.ruc}</Badge>}
          </div>
          <h1 className="font-display text-3xl font-bold">Panel general del recolector</h1>
          <p className="text-sm text-muted-foreground">Vista consolidada de recojos, pagos, unidad y suscripción.</p>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard icon={CheckCircle2} label="Recojos completados" value={kpis?.completedPickups ?? 0} tone="success" />
        <StatCard icon={Clock} label="Recojos pendientes" value={kpis?.pendingPickups ?? 0} tone="warning" />
        <StatCard icon={Droplets} label="Litros recolectados" value={fmt(kpis?.totalLitersCollected)} unit="L" tone="primary" />
        <StatCard icon={DollarSign} label="Pagos recibidos" value={`S/ ${fmt(kpis?.paymentsReceived)}`} tone="accent" />
        <StatCard icon={Truck} label="Unidad activa" value={kpis?.activeUnits ?? 0} tone="info" />
        <StatCard icon={ShieldCheck} label="Suscripción" value={statusLabel(kpis?.subscriptionStatus)} tone="success" />
      </div>

      {/* ── Performance Chart + Resumen Operativo ── */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">Rendimiento de recojos</CardTitle>
            <p className="text-xs text-muted-foreground">Litros (L)</p>
          </CardHeader>
          <CardContent>
            <BarChart data={performance || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">Resumen operativo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {/* Left: Company data */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Empresa:</p>
                    <p className="font-medium">{company?.businessName || "No registrado"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Package className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tipo:</p>
                    <p className="font-medium">{company?.companyType || "RECOLECTORA"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">RUC:</p>
                    <p className="font-medium">{company?.ruc || "No registrado"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Estado:</p>
                    <Badge variant="outline" className="text-xs">{statusLabel(company?.status)}</Badge>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Correo:</p>
                    <p className="font-medium text-xs">{company?.email || "No registrado"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Persona de contacto:</p>
                    <p className="font-medium">{company?.contactPerson || "No registrado"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Teléfono:</p>
                    <p className="font-medium">{fmtPhone(company?.phone)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Dirección:</p>
                    <p className="font-medium text-xs">{company?.address || "No registrado"}</p>
                  </div>
                </div>
              </div>
              {/* Right: Vehicle data */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Unidad registrada</p>
                {vehicle ? (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">Placa:</p>
                      <p className="font-bold text-primary bg-muted px-2 py-0.5 rounded inline-block">{vehicle.plate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Vehículo:</p>
                      <p className="font-medium">{vehicle.brand || ""} {vehicle.model || ""}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tipo de unidad:</p>
                      <p className="font-medium">{vehicle.type || "No registrado"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Capacidad:</p>
                      <p className="font-medium">{vehicle.capacityLiters ? `${fmt(Number(vehicle.capacityLiters), 0)} L` : "No registrado"}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Sin unidad registrada.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Suscripción y Recojos disponibles ── */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-display">Suscripción y facturación</CardTitle>
              {subscription && (
                <Badge className={subscription.status === "ACTIVA" ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}>
                  ● {statusLabel(subscription.status)}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {subscription ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Plan</p>
                      <p className="font-semibold">{subscription.planName}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Monto</p>
                    <p className="font-semibold">S/ {fmt(subscription.monthlyAmount)} / mes</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Estado</p>
                    <p className="font-semibold">{statusLabel(subscription.status)}</p>
                  </div>
                </div>
                {subscription.cancellationScheduled && subscription.message && (
                  <div className="flex items-start gap-2 bg-warning/10 p-3 rounded-md border border-warning/20">
                    <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                    <p className="text-sm text-foreground">{subscription.message}</p>
                  </div>
                )}
                {/* Cycle bar */}
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Ciclo actual</span>
                    <span className="text-primary font-semibold">{subscription.daysRemaining} días restantes</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    {subscription.startDate && subscription.endDate && (
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.max(5, Math.min(100, (() => {
                            const total = (new Date(subscription.endDate).getTime() - new Date(subscription.startDate).getTime());
                            const elapsed = (Date.now() - new Date(subscription.startDate).getTime());
                            return (elapsed / total) * 100;
                          })()))}%`
                        }}
                      />
                    )}
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>{fmtDate(subscription.startDate)}</span>
                    <span>{fmtDate(subscription.endDate)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay información de suscripción.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">Recojos disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            {availablePickups && availablePickups.length > 0 ? (
              <div className="space-y-3">
                {availablePickups.map((p: any) => (
                  <div key={p.id} className="p-3 rounded-md border bg-muted/30 text-sm">
                    <p className="font-semibold">{p.companyName}</p>
                    <p className="text-xs text-muted-foreground">{p.address || "Sin dirección"}</p>
                    <div className="flex gap-3 mt-1 text-xs">
                      <span>{fmt(p.estimatedLiters)} L</span>
                      <span>S/ {fmt(p.pricePerLiter)}/L</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No hay recojos disponibles actualmente.</p>
                <p className="text-xs text-muted-foreground mt-1">Revisa más tarde para nuevas solicitudes.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Completed Pickups ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-display">Últimos recojos completados</CardTitle>
        </CardHeader>
        <CardContent>
          {recentCompletedPickups && recentCompletedPickups.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">ID</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Volumen</TableHead>
                  <TableHead>Precio/L</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Pago</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCompletedPickups.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.id}</TableCell>
                    <TableCell className="font-medium">{r.companyName || "No registrado"}</TableCell>
                    <TableCell>{fmtDate(r.date)}</TableCell>
                    <TableCell className="font-mono">{fmt(r.liters)} L</TableCell>
                    <TableCell className="font-mono">S/ {fmt(r.pricePerLiter)}</TableCell>
                    <TableCell><Badge className={getEstadoBadge(r.status)}>{getEstadoLabel(r.status)}</Badge></TableCell>
                    <TableCell>
                      <Badge className={r.paymentStatus === "PAGADO" ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}>
                        {statusLabel(r.paymentStatus)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No hay recojos completados aún.</p>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
};

export default RecolectorDashboard;
