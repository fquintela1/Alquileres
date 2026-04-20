"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";
import { format, getDaysInMonth } from "date-fns";
import { Contract } from "@/types";

const schema = z.object({
  contract_id: z.string().min(1),
  period_month: z.coerce.number().min(1).max(12),
  period_year: z.coerce.number().min(2020),
  base_amount: z.coerce.number().positive(),
  due_date: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

type ContractOption = Contract & {
  property: { name: string };
  tenant: { first_name: string; last_name: string };
};

const now = new Date();
const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

export function NewPaymentForm({
  contracts,
  defaultContractId,
}: {
  contracts: ContractOption[];
  defaultContractId?: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const getContract = (id: string) => contracts.find(c => c.id === id);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      contract_id: defaultContractId ?? "",
      period_month: now.getMonth() + 1,
      period_year: now.getFullYear(),
      base_amount: defaultContractId
        ? getContract(defaultContractId)?.current_rent ?? 0
        : 0,
      due_date: defaultContractId
        ? format(new Date(now.getFullYear(), now.getMonth(), getContract(defaultContractId)?.due_day ?? 1), "yyyy-MM-dd")
        : "",
    },
  });

  const selectedContractId = watch("contract_id");
  const selectedContract = getContract(selectedContractId);

  const handleContractChange = (id: string) => {
    const c = getContract(id);
    if (c) {
      setValue("contract_id", id);
      setValue("base_amount", c.current_rent);
      const dueDay = Math.min(c.due_day, getDaysInMonth(new Date(watch("period_year"), watch("period_month") - 1)));
      setValue("due_date", format(new Date(watch("period_year"), watch("period_month") - 1, dueDay), "yyyy-MM-dd"));
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const { error } = await supabase.from("payments").insert({
      ...data,
      paid: false,
      late_fee: 0,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Pago generado" });
      router.push("/cobranzas");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <Card className="border-0 shadow-sm max-w-lg">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label>Contrato *</Label>
            <Select
              defaultValue={defaultContractId}
              onValueChange={handleContractChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccioná un contrato..." />
              </SelectTrigger>
              <SelectContent>
                {contracts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.property.name} — {c.tenant.first_name} {c.tenant.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.contract_id && <p className="text-xs text-destructive">{errors.contract_id.message}</p>}
          </div>

          {selectedContract && (
            <div className="bg-slate-50 rounded-lg p-3 text-sm">
              <p className="font-medium">{selectedContract.property.name}</p>
              <p className="text-muted-foreground">Alquiler actual: {formatCurrency(selectedContract.current_rent)}/mes</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mes *</Label>
              <Select
                defaultValue={String(now.getMonth() + 1)}
                onValueChange={(v) => setValue("period_month", parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="period_year">Año *</Label>
              <Input id="period_year" type="number" {...register("period_year")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="base_amount">Monto ($) *</Label>
              <Input id="base_amount" type="number" {...register("base_amount")} />
              {errors.base_amount && <p className="text-xs text-destructive">{errors.base_amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Fecha de vencimiento *</Label>
              <Input id="due_date" type="date" {...register("due_date")} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Generar pago"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
