"use client";
import { useState } from "react";
import { Payment } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate, getMonthName, getPaymentMethodLabel } from "@/lib/utils";
import { Receipt, Download, Eye } from "lucide-react";
import { ReceiptPreview } from "./receipt-preview";

type PaymentFull = Payment & {
  contract: {
    id: string;
    late_fee_daily_rate: number;
    property: { name: string; address: string };
    tenant: { first_name: string; last_name: string; dni?: string };
  };
};

interface Props {
  payments: PaymentFull[];
  highlightPaymentId?: string;
}

export function ReceiptsManager({ payments, highlightPaymentId }: Props) {
  const [previewPayment, setPreviewPayment] = useState<PaymentFull | null>(
    highlightPaymentId ? payments.find(p => p.id === highlightPaymentId) ?? null : null
  );

  return (
    <div className="space-y-4">
      {previewPayment && (
        <ReceiptPreview payment={previewPayment} onClose={() => setPreviewPayment(null)} />
      )}

      {payments.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-white rounded-xl shadow-sm">
          <Receipt className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No hay recibos generados</p>
          <p className="text-sm mt-1">Los recibos se crean automáticamente al registrar un pago</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">N° Recibo</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Propiedad / Inquilino</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden md:table-cell">Período</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden lg:table-cell">Fecha pago</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">Total</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  className={`hover:bg-slate-50 transition-colors ${payment.id === highlightPaymentId ? "bg-primary/5" : ""}`}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm font-semibold text-primary">
                      #{String(payment.receipt_number).padStart(4, "0")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{payment.contract.property.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {payment.contract.tenant.first_name} {payment.contract.tenant.last_name}
                    </p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-sm text-muted-foreground capitalize">
                      {getMonthName(payment.period_month)} {payment.period_year}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {payment.payment_date ? formatDate(payment.payment_date) : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold">
                      {formatCurrency(payment.total_paid ?? payment.base_amount)}
                    </span>
                    {(payment.late_fee ?? 0) > 0 && (
                      <p className="text-xs text-red-600">inc. mora {formatCurrency(payment.late_fee ?? 0)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPreviewPayment(payment)}
                        title="Ver recibo"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
