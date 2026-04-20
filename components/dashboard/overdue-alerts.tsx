import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { formatCurrency, formatDate, getDaysOverdue } from "@/lib/utils";
import { Payment } from "@/types";
import Link from "next/link";

interface Props {
  payments: Array<Payment & { contract: { property: { name: string }; tenant: { first_name: string; last_name: string } } }>;
}

export function OverdueAlerts({ payments }: Props) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Pagos vencidos ({payments.length})</AlertTitle>
      <AlertDescription>
        <div className="mt-2 space-y-1">
          {payments.slice(0, 4).map((p) => {
            const days = getDaysOverdue(p.due_date);
            return (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {p.contract.property.name} — {p.contract.tenant.first_name} {p.contract.tenant.last_name}
                </span>
                <span className="ml-4 shrink-0">
                  {formatCurrency(p.base_amount)} · {days} días vencido
                </span>
              </div>
            );
          })}
          {payments.length > 4 && (
            <Link href="/cobranzas?filter=vencidos" className="text-sm underline">
              Ver {payments.length - 4} más…
            </Link>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
