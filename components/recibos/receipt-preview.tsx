"use client";
import { Payment } from "@/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, getMonthName, getPaymentMethodLabel } from "@/lib/utils";
import { ExternalLink, X, Receipt } from "lucide-react";

type PaymentFull = Payment & {
  contract: {
    late_fee_daily_rate: number;
    property: { name: string; address: string };
    tenant: { first_name: string; last_name: string; dni?: string };
  };
};

interface Props {
  payment: PaymentFull;
  onClose: () => void;
}

export function ReceiptPreview({ payment, onClose }: Props) {
  const handleOpenPrint = () => {
    window.open(`/api/receipts/${payment.id}`, "_blank", "width=600,height=750");
  };

  const receiptNum = String(payment.receipt_number).padStart(4, "0");
  const tenantName = `${payment.contract.tenant.first_name} ${payment.contract.tenant.last_name}`;
  const total = payment.total_paid ?? payment.base_amount;
  const lateFee = payment.late_fee ?? 0;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden">
        {/* Receipt preview inside modal */}
        <div className="p-8 bg-white space-y-0">
          <div className="text-center pb-5 border-b border-dashed mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold tracking-widest">RECIBO</h2>
            <p className="text-muted-foreground text-sm">N° {receiptNum}</p>
          </div>

          <div className="space-y-0">
            {[
              { label: "Fecha", value: payment.payment_date ? formatDate(payment.payment_date) : "—" },
              { label: "Inquilino", value: tenantName, bold: true },
              { label: "Propiedad", value: payment.contract.property.name },
              { label: "Período", value: `${getMonthName(payment.period_month)} ${payment.period_year}`, capitalize: true },
              { label: "Concepto", value: "Alquiler" },
              ...(payment.payment_method ? [{ label: "Método de pago", value: getPaymentMethodLabel(payment.payment_method) }] : []),
              ...(lateFee > 0 ? [
                { label: "Alquiler base", value: formatCurrency(payment.base_amount) },
                { label: "Interés por mora", value: formatCurrency(lateFee), red: true },
              ] : []),
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center py-2 border-b border-slate-100 text-sm">
                <span className={`text-muted-foreground ${row.red ? "text-red-500" : ""}`}>{row.label}</span>
                <span className={`font-bold text-right ${row.capitalize ? "capitalize" : ""} ${row.red ? "text-red-600" : ""}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <div className="text-center py-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Monto Total</p>
            <p className="text-4xl font-black">
              <span className="text-xl font-semibold text-muted-foreground mr-1">$</span>
              {total.toLocaleString("es-AR")}
            </p>
          </div>

          <div className="text-center pt-4 border-t border-dashed">
            <p className="text-sm italic text-muted-foreground">Gracias por su pago</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Generado el {formatDate(new Date().toISOString())}
            </p>
          </div>
        </div>

        <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
            Cerrar
          </Button>
          <Button size="sm" onClick={handleOpenPrint}>
            <ExternalLink className="w-4 h-4" />
            Abrir e imprimir / PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
