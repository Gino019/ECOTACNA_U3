import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Award, Droplets, Package, Receipt, ShieldCheck } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { empresaApi } from "@/services/empresaApi";
import { getStoredAuth } from "@/services/authStorage";
import { empresaNav } from "./empresa/empresaNav";
import type { CompanyGeneralDashboardResponse } from "@/types";
import { SubscriptionStatusCard } from "@/components/profile/SubscriptionStatusCard";
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

export default function EmpresaDashboard() {
  const auth = getStoredAuth();
  const [user, setUser] = useState({
    name: auth?.companyName || "Información no disponible",
    sub: auth?.email || "No autenticado",
  });
  
  const [dashboardData, setDashboardData] = useState<CompanyGeneralDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await empresaApi.getCompanyGeneralDashboard();
        if (response.success && response.data) {
          setDashboardData(response.data);
          setUser({
            name: response.data.company.businessName,
            sub: response.data.company.email || `RUC ${response.data.company.ruc}`,
          });
          import("@/services/authStorage").then(({ saveAuth, getStoredAuth }) => {
            const currentAuth = getStoredAuth();
            if (currentAuth) {
              const updatedAuth = { ...currentAuth };
              if (response.data?.company?.businessName) updatedAuth.companyName = response.data.company.businessName;
              if (response.data?.company?.ruc) updatedAuth.ruc = response.data.company.ruc;
              saveAuth(updatedAuth);
            }
          });
        } else {
          setError(response.message || "No se pudo cargar el dashboard");
        }
      } catch (err: any) {
        setError(err.message || "Error de red al cargar el dashboard");
      }
    };
    loadData();
  }, []);

  if (error) {
    return (
      <DashboardShell role="Empresa" user={user} nav={empresaNav}>
        <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      </DashboardShell>
    );
  }

  if (!dashboardData) {
    return (
      <DashboardShell role="Empresa" user={user} nav={empresaNav}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardShell>
    );
  }

  const { company, kpis, monthlyEvolution, operationalSummary, requestDistribution, recentRequests } = dashboardData;

  return (
    <DashboardShell role="Empresa" user={user} nav={empresaNav}>
      {/* HEADER */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge className="bg-success text-success-foreground">
              <ShieldCheck className="h-3 w-3 mr-1" /> Empresa verificada
            </Badge>
            <Badge variant="outline">RUC {company.ruc}</Badge>
          </div>
          <h1 className="font-display text-3xl font-bold">{company.businessName}</h1>
          <p className="text-sm text-muted-foreground">{company.address || "Dirección no registrada"} · Panel de empresa generadora</p>
        </div>
        <Button asChild size="lg" className="bg-gradient-eco shadow-eco h-12">
          <Link to="/empresa/solicitar-recojo">Solicitar recojo</Link>
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Droplets} label="Litros reciclados" value={String(kpis.totalLitersRecycled)} unit="L" tone="primary" />
        <StatCard icon={Package} label="Solicitudes" value={String(kpis.totalRequests)} tone="warning" />
        <StatCard icon={Receipt} label="Ingreso total" value={`S/ ${Number(kpis.totalPaidToCollectors).toFixed(2)}`} tone="success" />
        <StatCard icon={Award} label="Completadas" value={String(kpis.completedRequests)} tone="accent" />
      </div>

      {/* MIDDLE SECTION */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* EVOLUCIÓN (Main Chart) */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-display font-bold mb-1">Evolución de reciclaje</h3>
          <p className="text-xs text-muted-foreground mb-6">Litros reciclados por mes (Últimos 6 meses)</p>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyEvolution} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `${val} L`} />
                <RechartsTooltip 
                  cursor={{ stroke: '#d1d5db', strokeWidth: 1, strokeDasharray: '3 3' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value} L`, 'Litros']}
                />
                <Line 
                  type="monotone" 
                  dataKey="liters" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#10b981' }}
                  activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* RESUMEN OPERATIVO */}
        <Card className="p-5">
          <h3 className="font-display font-bold mb-4">Resumen operativo</h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Tipo de empresa</span>
              <span className="font-medium text-right">{operationalSummary.type}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">RUC</span>
              <span className="font-medium text-right">{operationalSummary.ruc}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Dirección</span>
              <span className="font-medium text-right max-w-[150px] truncate" title={operationalSummary.address}>
                {operationalSummary.address || "-"}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Correo</span>
              <span className="font-medium text-right max-w-[150px] truncate" title={operationalSummary.email}>
                {operationalSummary.email || "-"}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Teléfono</span>
              <span className="font-medium text-right">{operationalSummary.phone ? `+51 ${operationalSummary.phone}` : "-"}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Estado</span>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                {operationalSummary.status}
              </Badge>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-muted-foreground">Miembro desde</span>
              <span className="font-medium text-right">{operationalSummary.memberSince || "-"}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* BOTTOM SECTION */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* RECENT REQUESTS */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold">Solicitudes recientes</h3>
            <Button variant="outline" size="sm" asChild>
              <Link to="/empresa/mis-solicitudes">Ver todas</Link>
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Fecha solicitud</TableHead>
                  <TableHead>Fecha programada</TableHead>
                  <TableHead>Volumen</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Recolector / Placa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRequests.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No hay solicitudes registradas.</TableCell></TableRow>
                ) : (
                  recentRequests.map((solicitud) => (
                    <TableRow key={solicitud.id}>
                      <TableCell className="font-mono text-xs">{solicitud.id}</TableCell>
                      <TableCell className="text-xs">{solicitud.requestDate}</TableCell>
                      <TableCell className="text-xs">{solicitud.scheduledDate}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{solicitud.liters} L</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {solicitud.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <div className="font-semibold text-primary">{solicitud.collectorName}</div>
                          <div className="text-muted-foreground text-[10px]">Placa: {solicitud.vehiclePlate}</div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* REQUEST DISTRIBUTION CHART */}
        <Card className="p-5 flex flex-col">
          <h3 className="font-display font-bold mb-1">Distribución de solicitudes</h3>
          <p className="text-xs text-muted-foreground mb-4">Basado en volumen (Litros)</p>
          <div className="flex-1 flex flex-col items-center justify-center min-h-[220px]">
            {requestDistribution.length > 0 && requestDistribution.some(d => Number(d.liters) > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={requestDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="liters"
                    nameKey="label"
                  >
                    {requestDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => [`${Number(value).toFixed(2)} L`, 'Volumen']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-muted-foreground flex items-center justify-center h-full">
                No hay datos suficientes
              </div>
            )}
            
            <div className="w-full mt-4 space-y-2">
              {requestDistribution.map((item, index) => {
                const totalLiters = requestDistribution.reduce((acc, curr) => acc + Number(curr.liters), 0);
                const percent = totalLiters > 0 ? (Number(item.liters) / totalLiters) * 100 : 0;
                
                if (Number(item.liters) === 0) return null;
                
                return (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="capitalize">{item.label.toLowerCase().replace("_", " ")}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{Number(item.liters).toFixed(2)} L</span>
                      <span className="text-muted-foreground w-10 text-right">{percent.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* SUBSCRIPTION */}
      <SubscriptionStatusCard />

    </DashboardShell>
  );
}
