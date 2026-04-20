"use client";
import { useState } from "react";
import { Contract } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatCurrency, formatDate, getContractStatusLabel, getFrequencyLabel, getPropertyTypeLabel } from "@/lib/utils";
import { getNextAdjustmentDate, getMonthsUntilAdjustment } from "@/lib/calculations/rent";
import { FileText, Search, Eye, TrendingUp } from "lucide-react";
import Link from "next/link";

type ContractWithRelations = Contract & {
  property: { name: string; address: string; type: string };
  tenant: { first_name: string; last_name: string };
};

interface Props {
  contracts: ContractWithRelations[];
}

const statusBadge: Record<string, "success" | "secondary" | "warning"> = {
  activo: "success",
  finalizado: "secondary",
  suspendido: "warning",
};

export function ContractsList({ contracts }: Props) {
  const [search, setSearch] = useState("");

  const filtered = contracts.filter((c) =>
    c.property.name.toLowerCase().includes(search.toLowerCase()) ||
    `${c.tenant.first_name} ${c.tenant.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const activos = filtered.filter((c) => c.status === "activo");
  const otros = filtered.filter((c) => c.status !== "activo");

  const ContractTable = ({ items }: { items: ContractWithRelations[] }) => (
    <>
      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p>No hay contratos en esta categoría</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Propiedad</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden md:table-cell">Inquilino</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden lg:table-cell">Vigencia</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3 hidden xl:table-cell">Alquiler actual</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden xl:table-cell">Actualización</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Estado</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((c) => {
                const nextAdj = getNextAdjustmentDate(c.start_date, c.adjustment_frequency, c.last_adjustment_date ?? undefined);
                const monthsUntil = getMonthsUntilAdjustment(c.start_date, c.adjustment_frequency, c.last_adjustment_date ?? undefined);
                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{c.property.name}</p>
                      <p className="text-xs text-muted-foreground">{getPropertyTypeLabel(c.property.type)}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm">{c.tenant.first_name} {c.tenant.last_name}</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(c.start_date)} — {formatDate(c.end_date)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right hidden xl:table-cell">
                      <p className="text-sm font-semibold">{formatCurrency(c.current_rent)}</p>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                        <div>
                          <p className="text-xs">{getFrequencyLabel(c.adjustment_frequency)}</p>
                          {c.status === "activo" && (
                            <p className="text-xs text-muted-foreground">
                              {monthsUntil === 0 ? (
                                <span className="text-amber-600 font-medium">Este mes</span>
                              ) : (
                                `En ${monthsUntil} mes${monthsUntil !== 1 ? "es" : ""}`
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusBadge[c.status] ?? "secondary"}>
                        {getContractStatusLabel(c.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/contratos/${c.id}`}><Eye className="w-3.5 h-3.5" /></Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar contrato..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs defaultValue="activos">
        <TabsList>
          <TabsTrigger value="activos">Activos ({activos.length})</TabsTrigger>
          <TabsTrigger value="otros">Finalizados / Suspendidos ({otros.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="activos" className="mt-4">
          <ContractTable items={activos} />
        </TabsContent>
        <TabsContent value="otros" className="mt-4">
          <ContractTable items={otros} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
