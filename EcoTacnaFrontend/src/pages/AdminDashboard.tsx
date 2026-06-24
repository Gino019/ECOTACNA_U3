import { DashboardShell } from "@/components/DashboardShell";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Building2, TrendingUp, DollarSign, CalendarClock, Droplets, CreditCard, PieChart as PieChartIcon, BarChart3
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "@/services/adminApi";
import { adminNav, adminUser } from "./admin/adminNav";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [kpis, setKpis] = useState<any>(null);
  const [loadingResumen, setLoadingResumen] = useState(true);

  useEffect(() => {
    let authFailed = false;
    const handleAuthError = () => {
      if (!authFailed) { authFailed = true; toast.error("Sesión expirada. Redirigiendo al login..."); navigate("/login"); }
    };

    adminApi.getInstitutionalSummary()
      .then(res => {
        setKpis(res.data);
      })
      .catch(err => {
        if (err.isAuthError) handleAuthError();
        else toast.error("Error al cargar el resumen institucional");
      })
      .finally(() => setLoadingResumen(false));
  }, [navigate]);

  // Data for charts
  const ingresosMensuales = kpis?.ingresosMensuales || [];
  const comp = kpis?.composicionIngresos || {};
  const pieData = [
    { name: "Gen. Suscripciones", value: comp.suscripcionesGeneradoras || 0, color: "#10b981" },
    { name: "Rec. Suscripciones", value: comp.suscripcionesRecolectoras || 0, color: "#3b82f6" },
    { name: "Pagos Aceite", value: comp.pagosAceite || 0, color: "#f59e0b" },
  ];

  return (
    <DashboardShell role="Administrador" user={adminUser} nav={adminNav}>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-secondary text-secondary-foreground">Administración financiera</Badge>
          </div>
          <h1 className="font-display text-3xl font-bold">Panel Resumen Institucional</h1>
          <p className="text-sm text-muted-foreground">
            Monitor de ingresos, suscripciones y métricas de operación EcoTacna.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {loadingResumen ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2 animate-pulse">
              <div className="h-3 bg-muted rounded w-2/3" />
              <div className="h-7 bg-muted rounded w-1/2" />
            </div>
          ))
        : <>
            <StatCard icon={TrendingUp} label="Ingresos del mes" value={`S/ ${(kpis?.ingresosDelMes ?? 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`} tone="success" />
            <StatCard icon={Building2} label="Suscripciones activas" value={kpis?.suscripcionesActivas ?? 0} tone="primary" />
            <StatCard icon={CalendarClock} label="Próximos cobros (7d)" value={kpis?.cobrosProximos ?? 0} tone="warning" />
            <StatCard icon={DollarSign} label="Monto por cobrar" value={`S/ ${(kpis?.montoPorCobrar ?? 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`} tone="info" />
            <StatCard icon={CreditCard} label="Pagos aceite" value={`S/ ${(kpis?.pagosAceite ?? 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`} tone="accent" />
            <StatCard icon={Droplets} label="L. Comercializados" value={(kpis?.litrosComercializados ?? 0).toLocaleString()} unit="L" tone="success" />
          </>
        }
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Ingresos Mensuales
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ingresosMensuales}>
                <XAxis dataKey="mes" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `S/${value}`} />
                <RechartsTooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="monto" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-primary" /> Composición de Ingresos
          </h3>
          <div className="flex items-center h-64 w-full">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => `S/ ${value.toLocaleString(undefined, {minimumFractionDigits: 2})}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 flex flex-col justify-center gap-4">
              {pieData.map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                  <div>
                    <p className="text-sm font-medium">{d.name}</p>
                    <p className="text-sm text-muted-foreground">S/ {d.value.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden mb-6">
        <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" /> Próximos Cobros (Siguientes 7 días)
          </h3>
        </div>
        {loadingResumen ? (
          <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando próximos cobros...</div>
        ) : kpis?.proximosCobros?.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha Vencimiento</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kpis.proximosCobros.map((cobro: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{cobro.empresa}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cobro.tipo === 'GENERADORA' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-accent/10 text-accent border-accent/20'}>
                        {cobro.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(cobro.fechaVencimiento).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right font-bold">
                      S/ {cobro.monto.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No hay cobros próximos en los siguientes 7 días.
          </div>
        )}
      </Card>
    </DashboardShell>
  );
};

export default AdminDashboard;
