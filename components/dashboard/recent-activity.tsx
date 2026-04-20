import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, getMonthName, getPaymentMethodLabel } from "@/lib/utils";
import { Payment } from "@/types";
import { CheckCircle2 } from "lucide-react";

interface Props {
  payments: Array<Payment & { contract: { property: { name: string }; tenant: { first_name: string; last_name: string } } }>;
}

export function RecentActivity({ payments }: Props) {
  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Pagos recientes</CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No hay actividad reciente
          </div>
        ) : (
          <div className="divide-y">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{payment.contract.property.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {payment.contract.tenant.first_name} {payment.contract.tenant.last_name} · {getMonthName(payment.period_month)} {payment.period_year}
                    </p>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm font-semibold text-emerald-700">{formatCurrency(payment.total_paid ?? payment.base_amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {payment.payment_date ? formatDate(payment.payment_date) : "—"}
                    {payment.payment_method ? ` · ${getPaymentMethodLabel(payment.payment_method)}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
