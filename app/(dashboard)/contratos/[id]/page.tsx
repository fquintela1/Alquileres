import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatDate, formatCurrency, getContractStatusLabel,
  getFrequencyLabel, calculateLateFee, getDaysOverdue
} from "@/lib/utils";
import {
  getNextAdjustmentDate, getMonthsUntilAdjustment
} from "@/lib/calculations/rent";
import { ContractAdjustment } from "@/components/contratos/contract-adjustment";
import { Pencil, FileText, TrendingUp, Calendar, Upload } from "lucide-react";
import Link from "next/link";

export default async function ContratoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: contract }, { data: adjustments }, { data: files }, { data: recentPayments }] = await Promise.all([
    supabase.from("contracts")
      .select("*, property:properties(*), tenant:tenants(*)")
      .eq("id", id)
      .single(),
    supabase.from("rent_adjustments")
      .select("*").eq("contract_id", id)
      .order("adjustment_date", { ascending: false }),
    supabase.from("files")
      .select("*").eq("entity_type", "contract").eq("entity_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("payments")
      .select("*").eq("contract_id", id)
      .order("period_year", { ascending: false })
      .order("period_month", { ascending: false })
      .limit(6),
  ]);

  if (!contract) notFound();

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

  const statusVariants: Record<string, "success" | "secondary" | "warning"> = {
    activo: "success",
    finalizado: "secondary",
    suspendido: "warning",
  };

  return (
    <div>
      <Header
        title={`${contract.property.name} — ${contract.tenant.first_name} ${contract.tenant.last_name}`}
        description={`Contrato ${getContractStatusLabel(contract.status).toLowerCase()}`}
        actions={
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/contratos/${id}/editar`}><Pencil className="w-4 h-4" /> Editar</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/cobranzas/nueva?contractId=${id}`}>Registrar pago</Link>
            </Button>
          </div>
        }
      />
      <div className="p-8 space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Alquiler actual</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(contract.current_rent)}</p>
              <p className="text-xs text-muted-foreground">por mes</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Canon inicial</p>
              <p className="text-lg font-semibold">{formatCurrency(contract.initial_rent)}</p>
              <p className="text-xs text-muted-foreground">
                +{((contract.current_rent / contract.initial_rent - 1) * 100).toFixed(0)}% total
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Próxima actualización</p>
              <p className="text-sm font-semibold">{formatDate(nextAdj.toISOString())}</p>
              <p className="text-xs text-muted-foreground">
                {monthsUntil === 0 ? (
                  <span className="text-amber-600 font-medium">¡Este mes!</span>
                ) : (
                  `En ${monthsUntil} mes${monthsUntil !== 1 ? "es" : ""}`
                )}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Vigencia</p>
              <p className="text-sm font-semibold">{formatDate(contract.end_date)}</p>
              <Badge variant={statusVariants[contract.status]}>{getContractStatusLabel(contract.status)}</Badge>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Detalles del contrato</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Inicio</p>
                  <p className="font-medium">{formatDate(contract.start_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fin</p>
                  <p className="font-medium">{formatDate(contract.end_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vence el día</p>
                  <p className="font-medium">{contract.due_day} de cada mes</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Depósito</p>
                  <p className="font-medium">{contract.deposit ? formatCurrency(contract.deposit) : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Actualización</p>
                  <p className="font-medium">{getFrequencyLabel(contract.adjustment_frequency)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Interés mora</p>
                  <p className="font-medium">{contract.late_fee_daily_rate}% diario</p>
                </div>
              </div>
              {contract.notes && (
                <div className="bg-slate-50 rounded-md p-3 mt-2">
                  <p className="text-xs text-muted-foreground">{contract.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {contract.status === "activo" && (
            <ContractAdjustment contract={contract} />
          )}
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Historial de actualizaciones ({adjustments?.length ?? 0})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {!adjustments || adjustments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin actualizaciones registradas</p>
            ) : (
              <div className="divide-y">
                {adjustments.map((adj) => (
                  <div key={adj.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{formatDate(adj.adjustment_date)}</p>
                      <p className="text-xs text-muted-foreground">
                        Coeficiente: x{adj.coefficient.toFixed(4)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(adj.new_amount)}</p>
                      <p className="text-xs text-muted-foreground">antes: {formatCurrency(adj.previous_amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Documentos del contrato
              </CardTitle>
              <ContractFileUpload contractId={id} />
            </div>
          </CardHeader>
          <CardContent>
            {!files || files.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No hay archivos adjuntos</p>
            ) : (
              <div className="space-y-2">
                {files.map((f) => (
                  <div key={f.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{f.file_name}</span>
                      {f.is_current && <Badge variant="success" className="text-xs">Actual</Badge>}
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={f.file_url} target="_blank" rel="noopener noreferrer">Descargar</a>
                    </Button>
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

function ContractFileUpload({ contractId }: { contractId: string }) {
  return (
    <Button variant="outline" size="sm" asChild>
      <label className="cursor-pointer">
        <Upload className="w-3.5 h-3.5 mr-1.5" />
        Subir PDF
      </label>
    </Button>
  );
}
