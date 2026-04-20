"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getNextAdjustmentDate, getMonthsUntilAdjustment, calculateAdjustmentCoefficient } from "@/lib/calculations/rent";
import { toast } from "@/components/ui/use-toast";
import { Contract, IpcIndex } from "@/types";
import { TrendingUp, AlertTriangle, Calculator } from "lucide-react";
import { useRouter } from "next/navigation";
import { format, subMonths, parseISO } from "date-fns";

interface Props {
  contract: Contract;
}

export function ContractAdjustment({ contract }: Props) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{
    coefficient: number;
    newRent: number;
    baseIpc: number;
    currentIpc: number;
    baseMonth: string;
    currentMonth: string;
  } | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const nextAdj = getNextAdjustmentDate(
    contract.start_date,
    contract.adjustment_frequency,
    contract.last_adjustment_date ?? undefined
  );
  const monthsUntil = getMonthsUntilAdjustment(
    contract.start_date,
    contract.adjustment_frequency,
    contract.last_adjustment_date ?? undefined
  );
  const isDue = monthsUntil === 0;

  useEffect(() => {
    if (isDue) loadPreview();
  }, [isDue]);

  const loadPreview = async () => {
    const lastAdjDate = contract.last_adjustment_date
      ? parseISO(contract.last_adjustment_date)
      : parseISO(contract.start_date);

    const baseDate = lastAdjDate;
    const currentDate = subMonths(new Date(), 1);

    const [baseResult, currentResult] = await Promise.all([
      supabase.from("ipc_indexes")
        .select("value")
        .eq("month", baseDate.getMonth() + 1)
        .eq("year", baseDate.getFullYear())
        .single(),
      supabase.from("ipc_indexes")
        .select("value")
        .eq("month", currentDate.getMonth() + 1)
        .eq("year", currentDate.getFullYear())
        .single(),
    ]);

    if (baseResult.data && currentResult.data) {
      const coef = calculateAdjustmentCoefficient(
        Number(baseResult.data.value),
        Number(currentResult.data.value)
      );
      setPreview({
        coefficient: coef,
        newRent: Math.round(contract.current_rent * coef),
        baseIpc: Number(baseResult.data.value),
        currentIpc: Number(currentResult.data.value),
        baseMonth: format(baseDate, "MM/yyyy"),
        currentMonth: format(currentDate, "MM/yyyy"),
      });
    }
  };

  const applyAdjustment = async () => {
    if (!preview) return;
    setLoading(true);

    const today = format(new Date(), "yyyy-MM-dd");
    const lastAdjDate = contract.last_adjustment_date
      ? parseISO(contract.last_adjustment_date)
      : parseISO(contract.start_date);
    const currentDate = subMonths(new Date(), 1);

    const { error: adjError } = await supabase.from("rent_adjustments").insert({
      contract_id: contract.id,
      adjustment_date: today,
      previous_amount: contract.current_rent,
      new_amount: preview.newRent,
      coefficient: preview.coefficient,
      period_start_month: lastAdjDate.getMonth() + 1,
      period_start_year: lastAdjDate.getFullYear(),
      period_end_month: currentDate.getMonth() + 1,
      period_end_year: currentDate.getFullYear(),
    });

    if (adjError) {
      toast({ title: "Error al registrar ajuste", description: adjError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.from("contracts").update({
      current_rent: preview.newRent,
      last_adjustment_date: today,
    }).eq("id", contract.id);

    if (updateError) {
      toast({ title: "Error al actualizar contrato", description: updateError.message, variant: "destructive" });
    } else {
      toast({ title: "Actualización aplicada", description: `Nuevo alquiler: ${formatCurrency(preview.newRent)}` });
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <Card className={`border-0 shadow-sm ${isDue ? "border-l-4 border-l-amber-400" : ""}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Actualización IPC CREEBBA
          {isDue && <Badge variant="warning">Disponible</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Frecuencia</p>
            <p className="font-medium">{contract.adjustment_frequency}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Próxima actualización</p>
            <p className="font-medium">{formatDate(nextAdj.toISOString())}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Último ajuste</p>
            <p className="font-medium">
              {contract.last_adjustment_date ? formatDate(contract.last_adjustment_date) : "Ninguno"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Índice</p>
            <p className="font-medium">IPC CREEBBA</p>
          </div>
        </div>

        {isDue && preview && (
          <div className="bg-amber-50 rounded-lg p-4 space-y-2">
            <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5" />
              Cálculo preliminar
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-amber-700">IPC base ({preview.baseMonth})</p>
                <p className="font-medium text-amber-900">{(preview.baseIpc * 100).toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-xs text-amber-700">IPC actual ({preview.currentMonth})</p>
                <p className="font-medium text-amber-900">{(preview.currentIpc * 100).toFixed(2)}%</p>
              </div>
            </div>
            <div className="border-t border-amber-200 pt-2 flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-700">Coeficiente: x{preview.coefficient.toFixed(4)}</p>
                <p className="text-xs text-amber-700">Actual: {formatCurrency(contract.current_rent)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-amber-700">Nuevo alquiler</p>
                <p className="text-lg font-bold text-amber-900">{formatCurrency(preview.newRent)}</p>
              </div>
            </div>
          </div>
        )}

        {isDue && !preview && (
          <div className="bg-slate-50 rounded-lg p-4 text-sm text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
            No hay índices IPC disponibles para calcular. <a href="/ipc" className="text-primary hover:underline">Cargar IPC</a>
          </div>
        )}

        {isDue && (
          <Button
            onClick={applyAdjustment}
            disabled={loading || !preview}
            className="w-full"
            size="sm"
          >
            {loading ? "Aplicando..." : "Aplicar actualización"}
          </Button>
        )}

        {!isDue && (
          <p className="text-xs text-muted-foreground text-center">
            Próxima en {monthsUntil} mes{monthsUntil !== 1 ? "es" : ""}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
