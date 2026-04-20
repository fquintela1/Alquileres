"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Payment } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate, getDaysOverdue, calculateLateFee, getPaymentMethodLabel } from "@/lib/utils";
import { CheckCircle2, Clock, AlertCircle, ChevronLeft, ChevronRight, Receipt } from "lucide-react";
import Link from "next/link";
import { RegisterPaymentDialog } from "./register-payment-dialog";
import { format, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";

type PaymentWithRelations = Payment & {
  contract: {
    id: string;
    current_rent: number;
    due_day: number;
    late_fee_daily_rate: number;
    property: { name: string };
    tenant: { first_name: string; last_name: string };
  };
};

interface Props {
  payments: PaymentWithRelations[];
  currentMonth: number;
  currentYear: number;
}

export function CobranzasList({ payments, currentMonth, currentYear }: Props) {
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithRelations | null>(null);
  const router = useRouter();

  const date = new Date(currentYear, currentMonth - 1, 1);
  const prevDate = subMonths(date, 1);
  const nextDate = addMonths(date, 1);

  const totalBase = payments.reduce((s, p) => s + p.base_amount, 0);
  const totalPaid = payments.filter(p => p.paid).reduce((s, p) => s + (p.total_paid ?? 0), 0);
  const totalPending = payments.filter(p => !p.paid).reduce((s, p) => s + p.base_amount, 0);
  const overdueCount = payments.filter(p => !p.paid && getDaysOverdue(p.due_date) > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild className="h-8 w-8">
            <Link href={`/cobranzas?mes=${prevDate.getMonth() + 1}&año=${prevDate.getFullYear()}`}>
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </Button>
          <span className="text-sm font-semibold px-2 capitalize">
            {format(date, "MMMM yyyy", { locale: es })}
          </span>
          <Button variant="outline" size="icon" asChild className="h-8 w-8">
            <Link href={`/cobranzas?mes=${nextDate.getMonth() + 1}&año=${nextDate.getFullYear()}`}>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total cobrado</p>
            <p className="text-xl font-bold text-emerald-700">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pendiente</p>
            <p className="text-xl font-bold text-amber-700">{formatCurrency(totalPending)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Vencidos</p>
            <p className={`text-xl font-bold ${overdueCount > 0 ? "text-red-700" : "text-slate-400"}`}>{overdueCount}</p>
          </CardContent>
        </Card>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-white rounded-xl shadow-sm">
          <Clock className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p className="font-medium">No hay pagos para este período</p>
          <p className="text-sm mt-1">
            <Link href="/cobranzas/nueva" className="text-primary hover:underline">
              Registrá un pago
            </Link>
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Propiedad / Inquilino</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3 hidden md:table-cell">Monto base</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden lg:table-cell">Vencimiento</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden lg:table-cell">Fecha pago</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3 hidden xl:table-cell">Mora</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3 hidden md:table-cell">Total</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Estado</th>
                <th className="px-4 py-3 w-28"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.map((payment) => {
                const daysOverdue = getDaysOverdue(payment.due_date);
                const estimatedLateFee = !payment.paid && daysOverdue > 0
                  ? calculateLateFee(payment.base_amount, daysOverdue, payment.contract.late_fee_daily_rate)
                  : (payment.late_fee ?? 0);

                return (
                  <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{payment.contract.property.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {payment.contract.tenant.first_name} {payment.contract.tenant.last_name}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      <span className="text-sm">{formatCurrency(payment.base_amount)}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">{formatDate(payment.due_date)}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {payment.payment_date ? formatDate(payment.payment_date) : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden xl:table-cell">
                      {estimatedLateFee > 0 ? (
                        <span className="text-sm text-red-600 font-medium">{formatCurrency(estimatedLateFee)}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      <span className="text-sm font-semibold">
                        {payment.total_paid
                          ? formatCurrency(payment.total_paid)
                          : formatCurrency(payment.base_amount + estimatedLateFee)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {payment.paid ? (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Pagado
                        </Badge>
                      ) : daysOverdue > 0 ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {daysOverdue}d vencido
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="w-3 h-3" />
                          Pendiente
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {!payment.paid && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPayment(payment)}
                            className="text-xs h-7"
                          >
                            Registrar
                          </Button>
                        )}
                        {payment.paid && payment.receipt_number && (
                          <Button variant="ghost" size="icon" asChild className="h-7 w-7">
                            <Link href={`/recibos?paymentId=${payment.id}`}>
                              <Receipt className="w-3.5 h-3.5" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedPayment && (
        <RegisterPaymentDialog
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </div>
  );
}
