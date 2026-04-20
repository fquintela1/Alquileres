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
import { Property } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  address: z.string().min(1, "Dirección requerida"),
  type: z.enum(["casa", "departamento", "cochera", "local", "otro"]),
  observations: z.string().optional(),
  status: z.enum(["disponible", "alquilado"]),
});

type FormData = z.infer<typeof schema>;

interface Props {
  property?: Property;
}

export function PropertyForm({ property }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: property?.name ?? "",
      address: property?.address ?? "",
      type: property?.type ?? "departamento",
      observations: property?.observations ?? "",
      status: property?.status ?? "disponible",
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const payload = { ...data, observations: data.observations || null };

    if (property) {
      const { error } = await supabase.from("properties").update(payload).eq("id", property.id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Propiedad actualizada", variant: "success" as any });
        router.push("/propiedades");
        router.refresh();
      }
    } else {
      const { error } = await supabase.from("properties").insert(payload);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Propiedad creada" });
        router.push("/propiedades");
        router.refresh();
      }
    }
    setLoading(false);
  };

  return (
    <Card className="border-0 shadow-sm max-w-xl">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la propiedad *</Label>
            <Input id="name" {...register("name")} placeholder="Ej: Artemis 104" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección *</Label>
            <Input id="address" {...register("address")} placeholder="Ej: Av. Artemis 104, Bahía Blanca" />
            {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select defaultValue={watch("type")} onValueChange={(v) => setValue("type", v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="casa">Casa</SelectItem>
                  <SelectItem value="departamento">Departamento</SelectItem>
                  <SelectItem value="cochera">Cochera</SelectItem>
                  <SelectItem value="local">Local</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estado *</Label>
              <Select defaultValue={watch("status")} onValueChange={(v) => setValue("status", v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="alquilado">Alquilado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observations">Observaciones</Label>
            <Textarea
              id="observations"
              {...register("observations")}
              placeholder="Notas adicionales sobre la propiedad..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : property ? "Guardar cambios" : "Crear propiedad"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
