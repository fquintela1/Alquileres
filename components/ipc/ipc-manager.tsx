"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { IpcIndex } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import { TrendingUp, Plus, RefreshCw, ExternalLink } from "lucide-react";

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

const schema = z.object({
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2010),
  value: z.coerce.number().min(0).max(100),
});

type FormData = z.infer<typeof schema>;

const now = new Date();

export function IpcManager({ indexes }: { indexes: IpcIndex[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      value: 0,
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const { error } = await supabase.from("ipc_indexes").upsert({
      month: data.month,
      year: data.year,
      value: data.value / 100,
      source: "CREEBBA",
    }, { onConflict: "month,year" });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Índice guardado", description: `IPC ${MONTHS[data.month - 1]} ${data.year}: ${data.value}%` });
      // Fire-and-forget email notification
      fetch("/api/ipc/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: data.month, year: data.year, value: data.value / 100 }),
      }).catch(() => {});
      reset();
      router.refresh();
    }
    setLoading(false);
  };

  const handleScrape = async () => {
    setScraping(true);
    try {
      const res = await fetch("/api/ipc/scrape", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "IPC actualizado", description: data.message });
        router.refresh();
      } else {
        toast({ title: "No se pudo obtener el IPC automáticamente", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error al consultar CREEBBA", variant: "destructive" });
    }
    setScraping(false);
  };

  const latestIndex = indexes[0];
  const last12 = indexes.slice(0, 12);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Último índice registrado</p>
            {latestIndex ? (
              <>
                <p className="text-2xl font-bold text-primary mt-1">
                  {(latestIndex.value * 100).toFixed(2)}%
                </p>
                <p className="text-sm text-muted-foreground">
                  {MONTHS[latestIndex.month - 1]} {latestIndex.year}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">Sin datos</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm md:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold">Verificar nuevo índice CREEBBA</p>
              <Button asChild variant="outline" size="sm">
                <a href="https://www.creebba.org.ar/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5" />
                  creebba.org.ar
                </a>
              </Button>
            </div>
            <Button
              onClick={handleScrape}
              disabled={scraping}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${scraping ? "animate-spin" : ""}`} />
              {scraping ? "Consultando CREEBBA..." : "Verificar últimos índices automáticamente"}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Si falla, ingresalo manualmente desde la web de CREEBBA
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Cargar índice manualmente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Mes</Label>
                <Select
                  defaultValue={String(now.getMonth() + 1)}
                  onValueChange={(v) => setValue("month", parseInt(v))}
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
                <Label htmlFor="year">Año</Label>
                <Input id="year" type="number" {...register("year")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">Variación mensual (%)</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  {...register("value")}
                  placeholder="Ej: 3.90"
                />
                <p className="text-xs text-muted-foreground">Ingresá el porcentaje, ej: 3.90 para 3.90%</p>
                {errors.value && <p className="text-xs text-destructive">{errors.value.message}</p>}
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Guardando..." : "Guardar índice"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Historial reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {last12.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sin índices cargados</p>
            ) : (
              <div className="divide-y">
                {last12.map((idx) => (
                  <div key={idx.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <span className="text-sm font-medium">{MONTHS[idx.month - 1]} {idx.year}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={(idx.value * 100) > 5 ? "destructive" : (idx.value * 100) > 2 ? "warning" : "success"}
                        className="font-mono"
                      >
                        {(idx.value * 100).toFixed(2)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
