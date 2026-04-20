import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Building2, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface Props {
  activeContracts: number;
  collectedThisMonth: number;
  pendingThisMonth: number;
  overdueCount: number;
}

export function DashboardKPIs({ activeContracts, collectedThisMonth, pendingThisMonth, overdueCount }: Props) {
  const kpis = [
    {
      title: "Contratos activos",
      value: activeContracts.toString(),
      icon: Building2,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Cobrado este mes",
      value: formatCurrency(collectedThisMonth),
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Pendiente este mes",
      value: formatCurrency(pendingThisMonth),
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "Pagos vencidos",
      value: overdueCount.toString(),
      icon: AlertCircle,
      color: overdueCount > 0 ? "text-red-600" : "text-slate-400",
      bg: overdueCount > 0 ? "bg-red-50" : "bg-slate-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.title} className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">{kpi.title}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{kpi.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center shrink-0`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
