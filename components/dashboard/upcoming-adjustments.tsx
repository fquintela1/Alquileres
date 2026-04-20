import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Contract } from "@/types";
import { getNextAdjustmentDate, getMonthsUntilAdjustment } from "@/lib/calculations/rent";
import { formatDate, formatCurrency, getFrequencyLabel } from "@/lib/utils";
import { TrendingUp } from "lucide-react";
import Link from "next/link";

interface Props {
  contracts: Array<Contract & { property: { name: string }; tenant: { first_name: string; last_name: string } }>;
}

export function UpcomingAdjustments({ contracts }: Props) {
  const withAdjustments = contracts
    .filter(c => c.status === "activo")
    .map(c => ({
      ...c,
      nextAdjustment: getNextAdjustmentDate(c.start_date, c.adjustment_frequency, c.last_adjustment_date ?? undefined),
      monthsUntil: getMonthsUntilAdjustment(c.start_date, c.adjustment_frequency, c.last_adjustment_date ?? undefined),
    }))
    .sort((a, b) => a.nextAdjustment.getTime() - b.nextAdjustment.getTime())
    .slice(0, 6);

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Próximas actualizaciones</CardTitle>
          <Link href="/contratos" className="text-xs text-primary hover:underline">Ver contratos</Link>
        </div>
      </CardHeader>
      <CardContent>
        {withAdjustments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No hay actualizaciones pendientes
          </div>
        ) : (
          <div className="space-y-3">
            {withAdjustments.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.property.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {getFrequencyLabel(c.adjustment_frequency)} · {formatDate(c.nextAdjustment.toISOString())}
                  </p>
                </div>
                <div className="ml-3 shrink-0">
                  {c.monthsUntil === 0 ? (
                    <Badge variant="warning">Este mes</Badge>
                  ) : (
                    <Badge variant="secondary">En {c.monthsUntil}m</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
