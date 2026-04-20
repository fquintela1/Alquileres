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
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Tenant } from "@/types";

const schema = z.object({
  first_name: z.string().min(1, "Nombre requerido"),
  last_name: z.string().min(1, "Apellido requerido"),
  dni: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  address: z.string().optional(),
  observations: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function TenantForm({ tenant }: { tenant?: Tenant }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: tenant?.first_name ?? "",
      last_name: tenant?.last_name ?? "",
      dni: tenant?.dni ?? "",
      phone: tenant?.phone ?? "",
      email: tenant?.email ?? "",
      address: tenant?.address ?? "",
      observations: tenant?.observations ?? "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const payload = {
      ...data,
      dni: data.dni || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      observations: data.observations || null,
    };

    if (tenant) {
      const { error } = await supabase.from("tenants").update(payload).eq("id", tenant.id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Inquilino actualizado" });
        router.push("/inquilinos");
        router.refresh();
      }
    } else {
      const { error } = await supabase.from("tenants").insert(payload);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Inquilino creado" });
        router.push("/inquilinos");
        router.refresh();
      }
    }
    setLoading(false);
  };

  return (
    <Card className="border-0 shadow-sm max-w-xl">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nombre *</Label>
              <Input id="first_name" {...register("first_name")} placeholder="Juan" />
              {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Apellido *</Label>
              <Input id="last_name" {...register("last_name")} placeholder="Pérez" />
              {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dni">DNI</Label>
              <Input id="dni" {...register("dni")} placeholder="12345678" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" {...register("phone")} placeholder="291 4000000" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} placeholder="juan@email.com" />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección actual</Label>
            <Input id="address" {...register("address")} placeholder="Calle Falsa 123, Bahía Blanca" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observations">Observaciones</Label>
            <Textarea id="observations" {...register("observations")} placeholder="Notas sobre el inquilino..." rows={3} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : tenant ? "Guardar cambios" : "Crear inquilino"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
