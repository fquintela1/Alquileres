"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { formatCurrency, getDaysOverdue, calculateLateFee } from "@/lib/utils";
import { Payment } from "@/types";
import { format } from "date-fns";

const schema = z.object({
  payment_date: z.string().min(1),
  payment_method: z.enum(["efectivo", "transferencia", "cheque", "otro"]),
  include_late_fee: z.boolean(),
  observations: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type PaymentWithRelations = Payment & {
  contract: {
    id: string;
    late_fee_daily_rate: number;
    property: { name: string };
    tenant: { first_name: string; last_name: string };
  };
};

interface Props {
  payment: PaymentWithRelations;
  onClose: () => void;
}

export function RegisterPaymentDialog({ payment, onClose }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");
  const daysOverdue = getDaysOverdue(payment.due_date);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      payment_date: today,
      payment_method: "efectivo",
      include_late_fee: daysOverdue > 0,
      observations: "",
    },
  });

  const includeLate = watch("include_late_fee");
  const paymentDate = watch("payment_date");

  const daysLate = paymentDate
    ? getDaysOverdue(payment.due_date)
    : daysOverdue;

  const lateFee = includeLate && daysLate > 0
    ? calculateLateFee(payment.base_amount, daysLate, payment.contract.late_fee_daily_rate)
    : 0;

  const totalAmount = payment.base_amount + lateFee;

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const { data: counter } = await supabase
      .from("receipt_counter")
      .select("last_number")
      .eq("id", 1)
      .single();

    const newReceiptNum = (counter?.last_number ?? 0) + 1;

    const { error } = await supabase.from("payments").update({
      paid: true,
      payment_date: data.payment_date,
      payment_method: data.payment_method,
      late_fee: lateFee,
      total_paid: totalAmount,
      observations: data.observations || null,
      receipt_number: newReceiptNum,
    }).eq("id", payment.id);

    if (error) {
      toast({ title: "Error al registrar pago", description: error.message, variant: "destructive" });
    } else {
      await supabase.from("receipt_counter").update({ last_number: newReceiptNum }).eq("id", 1);
      toast({
        title: "Pago registrado",
        description: `Recibo N° ${String(newReceiptNum).padStart(4, "0")} — ${formatCurrency(totalAmount)}`,
      });
      router.refresh();
      onClose();
    }
    setLoading(false);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
        </DialogHeader>

        <div className="bg-slate-50 rounded-lg p-4 text-sm space-y-1">
          <p className="font-semibold">{payment.contract.property.name}</p>
          <p className="text-muted-foreground">
            {payment.contract.tenant.first_name} {payment.contract.tenant.last_name}
          </p>
          <p className="text-lg font-bold text-primary">{formatCurrency(payment.base_amount)}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment_date">Fecha de pago</Label>
            <Input id="payment_date" type="date" {...register("payment_date")} />
          </div>

          <div className="space-y-2">
            <Label>Método de pago</Label>
            <Select
              defaultValue="efectivo"
              onValueChange={(v) => setValue("payment_method", v as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {daysOverdue > 0 && (
            <div className="flex items-center justify-between bg-red-50 rounded-lg p-3">
              <div>
                <p className="text-sm font-medium text-red-800">
                  Interés por mora ({daysLate} días)
                </p>
                <p className="text-xs text-red-600">
                  {payment.contract.late_fee_daily_rate}% diario = {formatCurrency(calculateLateFee(payment.base_amount, daysLate, payment.contract.late_fee_daily_rate))}
                </p>
              </div>
              <Switch
                checked={includeLate}
                onCheckedChange={(v) => setValue("include_late_fee", v)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observations">Observaciones</Label>
            <Textarea id="observations" {...register("observations")} placeholder="Notas opcionales..." rows={2} />
          </div>

          <div className="bg-primary/5 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm font-medium">Total a cobrar</span>
            <span className="text-xl font-bold text-primary">{formatCurrency(totalAmount)}</span>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Confirmar pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
