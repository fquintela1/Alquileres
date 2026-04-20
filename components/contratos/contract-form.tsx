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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Property, Tenant, Contract } from "@/types";

const schema = z.object({
  property_id: z.string().min(1, "Seleccioná una propiedad"),
  tenant_id: z.string().min(1, "Seleccioná un inquilino"),
  start_date: z.string().min(1, "Fecha inicio requerida"),
  end_date: z.string().min(1, "Fecha fin requerida"),
  initial_rent: z.coerce.number().positive("Monto inválido"),
  due_day: z.coerce.number().min(1).max(28),
  adjustment_frequency: z.enum(["mensual", "trimestral", "cuatrimestral", "semestral", "anual"]),
  deposit: z.coerce.number().optional(),
  late_fee_daily_rate: z.coerce.number().min(0).max(100),
  status: z.enum(["activo", "finalizado", "suspendido"]),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  properties: Property[];
  tenants: Tenant[];
  contract?: Contract;
  defaultPropertyId?: string;
  defaultTenantId?: string;
}

export function ContractForm({ properties, tenants, contract, defaultPropertyId, defaultTenantId }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      property_id: contract?.property_id ?? defaultPropertyId ?? "",
      tenant_id: contract?.tenant_id ?? defaultTenantId ?? "",
      start_date: contract?.start_date ?? "",
      end_date: contract?.end_date ?? "",
      initial_rent: contract?.initial_rent ?? undefined,
      due_day: contract?.due_day ?? 1,
      adjustment_frequency: contract?.adjustment_frequency ?? "cuatrimestral",
      deposit: contract?.deposit ?? undefined,
      late_fee_daily_rate: contract?.late_fee_daily_rate ?? 0.05,
      status: contract?.status ?? "activo",
      notes: contract?.notes ?? "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const payload = {
      ...data,
      current_rent: contract?.current_rent ?? data.initial_rent,
      deposit: data.deposit || null,
      notes: data.notes || null,
      adjustment_index: "ipc_creebba",
    };

    if (contract) {
      const { error } = await supabase.from("contracts").update(payload).eq("id", contract.id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Contrato actualizado" });
        router.push(`/contratos/${contract.id}`);
        router.refresh();
      }
    } else {
      const { data: newContract, error } = await supabase.from("contracts").insert(payload).select().single();
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        await supabase.from("properties").update({ status: "alquilado" }).eq("id", data.property_id);
        toast({ title: "Contrato creado exitosamente" });
        router.push(`/contratos/${newContract.id}`);
        router.refresh();
      }
    }
    setLoading(false);
  };

  return (
    <Card className="border-0 shadow-sm max-w-2xl">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Propiedad *</Label>
              <Select
                defaultValue={watch("property_id")}
                onValueChange={(v) => setValue("property_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná..." />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.property_id && <p className="text-xs text-destructive">{errors.property_id.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Inquilino *</Label>
              <Select
                defaultValue={watch("tenant_id")}
                onValueChange={(v) => setValue("tenant_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná..." />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tenant_id && <p className="text-xs text-destructive">{errors.tenant_id.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Fecha inicio *</Label>
              <Input id="start_date" type="date" {...register("start_date")} />
              {errors.start_date && <p className="text-xs text-destructive">{errors.start_date.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Fecha fin *</Label>
              <Input id="end_date" type="date" {...register("end_date")} />
              {errors.end_date && <p className="text-xs text-destructive">{errors.end_date.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="initial_rent">Canon inicial ($) *</Label>
              <Input id="initial_rent" type="number" {...register("initial_rent")} placeholder="500000" />
              {errors.initial_rent && <p className="text-xs text-destructive">{errors.initial_rent.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit">Depósito ($)</Label>
              <Input id="deposit" type="number" {...register("deposit")} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_day">Día de vencimiento</Label>
              <Input id="due_day" type="number" min={1} max={28} {...register("due_day")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Frecuencia de actualización *</Label>
              <Select
                defaultValue={watch("adjustment_frequency")}
                onValueChange={(v) => setValue("adjustment_frequency", v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensual">Mensual</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="cuatrimestral">Cuatrimestral</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="late_fee_daily_rate">Interés por mora (% diario)</Label>
              <Input
                id="late_fee_daily_rate"
                type="number"
                step="0.01"
                {...register("late_fee_daily_rate")}
                placeholder="0.05"
              />
              <p className="text-xs text-muted-foreground">Ej: 0.05 = 0.05% diario</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <Select defaultValue={watch("status")} onValueChange={(v) => setValue("status", v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
                <SelectItem value="suspendido">Suspendido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" {...register("notes")} placeholder="Observaciones del contrato..." rows={3} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : contract ? "Guardar cambios" : "Crear contrato"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
