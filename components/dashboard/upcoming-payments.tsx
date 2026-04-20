import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Payment } from "@/types";
import { Calendar } from "lucide-react";
import Link from "next/link";

interface Props {
  payments: Array<Payment & { contract: { property: { name: string }; tenant: { first_name: string; last_name: string } } }>;
}

export function UpcomingPayments({ payments }: Props) {
  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Próximos vencimientos</CardTitle>
          <Link href="/cobranzas" className="text-xs text-primary hover:underline">Ver todos</Link>
        </div>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No hay vencimientos próximos
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {payment.contract.property.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {payment.contract.tenant.first_name} {payment.contract.tenant.last_name}
                  </p>
                </div>
                <div className="text-right ml-3 shrink-0">
                  <p className="text-sm font-semibold">{formatCurrency(payment.base_amount)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(payment.due_date)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
