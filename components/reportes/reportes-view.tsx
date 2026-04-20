"use client";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from "recharts";
import { formatCurrency, getMonthName } from "@/lib/utils";
import { Payment, Contract, Property, IpcIndex } from "@/types";
import { TrendingUp, BarChart3, Building2, PieChart as PieIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type PaymentWithRelations = Payment & {
  contract: { property: { name: string; type: string } };
};
type ContractWithRelations = Contract & {
  property: { name: string; type: string };
  tenant: { first_name: string; last_name: string };
};
type PropertyWithContracts = Property & { contracts: { status: string }[] };

interface Props {
  payments: PaymentWithRelations[];
  contracts: ContractWithRelations[];
  properties: PropertyWithContracts[];
  ipcIndexes: IpcIndex[];
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];

const formatARS = (v: number) =>
  new Intl.NumberFormat("es-AR", { notation: "compact", maximumFractionDigits: 1 }).format(v);

export function ReportesView({ payments, contracts, properties, ipcIndexes }: Props) {
  // Monthly income chart data
  const monthlyData = useMemo(() => {
    const map = new Map<string, { mes: string; cobrado: number; pendiente: number }>();
    for (const p of payments) {
      const key = `${p.period_year}-${String(p.period_month).padStart(2, "0")}`;
      if (!map.has(key)) {
        const label = `${getMonthName(p.period_month).slice(0, 3)} ${p.period_year}`;
        map.set(key, { mes: label, cobrado: 0, pendiente: 0 });
      }
      const entry = map.get(key)!;
      if (p.paid) {
        entry.cobrado += p.total_paid ?? p.base_amount;
      } else {
        entry.pendiente += p.base_amount;
      }
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [payments]);

  // Per-property income
  const byProperty = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of payments) {
      if (!p.paid) continue;
      const name = p.contract.property.name;
      map.set(name, (map.get(name) ?? 0) + (p.total_paid ?? p.base_amount));
    }
    return [...map.entries()]
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [payments]);

  // Active rent per property
  const activeContracts = contracts.filter(c => c.status === "activo");
  const totalMonthlyRent = activeContracts.reduce((s, c) => s + c.current_rent, 0);

  // IPC trend
  const ipcData = useMemo(() => {
    return ipcIndexes.slice(-18).map(idx => ({
      mes: `${String(idx.month).padStart(2, "0")}/${idx.year}`,
      variacion: parseFloat((idx.value * 100).toFixed(2)),
    }));
  }, [ipcIndexes]);

  // Property type distribution
  const typeMap = new Map<string, number>();
  for (const p of properties) {
    typeMap.set(p.type, (typeMap.get(p.type) ?? 0) + 1);
  }
  const typeData = [...typeMap.entries()].map(([name, value]) => ({ name, value }));

  // Payment rate this year
  const totalPayments = payments.length;
  const paidPayments = payments.filter(p => p.paid).length;
  const paymentRate = totalPayments > 0 ? Math.round((paidPayments / totalPayments) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Ingreso mensual actual",
            value: formatCurrency(totalMonthlyRent),
            sub: `${activeContracts.length} contratos activos`,
            icon: TrendingUp,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Total cobrado (12m)",
            value: formatCurrency(payments.filter(p => p.paid).reduce((s, p) => s + (p.total_paid ?? p.base_amount), 0)),
            sub: `${paidPayments} pagos`,
            icon: BarChart3,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Tasa de cobro",
            value: `${paymentRate}%`,
            sub: `${totalPayments - paidPayments} pendientes`,
            icon: PieIcon,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            label: "Propiedades",
            value: properties.length.toString(),
            sub: `${properties.filter(p => p.contracts?.some(c => c.status === "activo")).length} alquiladas`,
            icon: Building2,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-0 shadow-sm bg-white">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-xl font-bold mt-0.5">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
                </div>
                <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center shrink-0`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="ingresos">
        <TabsList>
          <TabsTrigger value="ingresos">Ingresos mensuales</TabsTrigger>
          <TabsTrigger value="propiedades">Por propiedad</TabsTrigger>
          <TabsTrigger value="ipc">IPC CREEBBA</TabsTrigger>
          <TabsTrigger value="alquileres">Alquileres activos</TabsTrigger>
        </TabsList>

        <TabsContent value="ingresos" className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Cobrado vs Pendiente por mes</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={monthlyData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={formatARS} tick={{ fontSize: 11 }} width={60} />
                    <Tooltip
                      formatter={(v: number) => formatCurrency(v)}
                      labelStyle={{ fontWeight: 600 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="cobrado" name="Cobrado" fill="#10b981" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="pendiente" name="Pendiente" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="propiedades" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total cobrado por propiedad (12 meses)</CardTitle>
              </CardHeader>
              <CardContent>
                {byProperty.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={byProperty}
                      layout="vertical"
                      margin={{ top: 4, right: 16, bottom: 0, left: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" tickFormatter={formatARS} tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Bar dataKey="total" name="Total cobrado" fill="#3b82f6" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Distribución por tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={110}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {typeData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ipc" className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Variación IPC CREEBBA mensual (%)</CardTitle>
            </CardHeader>
            <CardContent>
              {ipcData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sin índices cargados</p>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={ipcData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="mes" tick={{ fontSize: 10 }} interval={1} />
                    <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => `${v}%`} />
                    <Line
                      type="monotone"
                      dataKey="variacion"
                      name="IPC mensual"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alquileres" className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Alquileres actuales</CardTitle>
            </CardHeader>
            <CardContent>
              {activeContracts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sin contratos activos</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left font-semibold text-muted-foreground py-2 pr-4">Propiedad</th>
                        <th className="text-left font-semibold text-muted-foreground py-2 pr-4">Inquilino</th>
                        <th className="text-right font-semibold text-muted-foreground py-2 pr-4">Canon inicial</th>
                        <th className="text-right font-semibold text-muted-foreground py-2 pr-4">Alquiler actual</th>
                        <th className="text-right font-semibold text-muted-foreground py-2">Incremento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {activeContracts.map((c) => {
                        const pct = c.initial_rent > 0
                          ? ((c.current_rent / c.initial_rent - 1) * 100).toFixed(0)
                          : "0";
                        return (
                          <tr key={c.id} className="hover:bg-slate-50">
                            <td className="py-2.5 pr-4 font-medium">{c.property.name}</td>
                            <td className="py-2.5 pr-4 text-muted-foreground">
                              {c.tenant.first_name} {c.tenant.last_name}
                            </td>
                            <td className="py-2.5 pr-4 text-right text-muted-foreground">
                              {formatCurrency(c.initial_rent)}
                            </td>
                            <td className="py-2.5 pr-4 text-right font-semibold text-primary">
                              {formatCurrency(c.current_rent)}
                            </td>
                            <td className="py-2.5 text-right">
                              <Badge variant={Number(pct) > 0 ? "warning" : "secondary"}>
                                +{pct}%
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t font-semibold">
                        <td colSpan={3} className="pt-3 text-muted-foreground">Total mensual</td>
                        <td className="pt-3 text-right text-primary text-base">{formatCurrency(totalMonthlyRent)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
