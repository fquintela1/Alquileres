import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency, getContractStatusLabel } from "@/lib/utils";
import { Pencil, Mail, Phone, MapPin, CreditCard } from "lucide-react";
import Link from "next/link";

export default async function InquilinoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: tenant }, { data: contracts }] = await Promise.all([
    supabase.from("tenants").select("*").eq("id", id).single(),
    supabase.from("contracts")
      .select("*, property:properties(name)")
      .eq("tenant_id", id)
      .order("start_date", { ascending: false }),
  ]);

  if (!tenant) notFound();

  return (
    <div>
      <Header
        title={`${tenant.first_name} ${tenant.last_name}`}
        description={tenant.dni ? `DNI: ${tenant.dni}` : undefined}
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href={`/inquilinos/${id}/editar`}><Pencil className="w-4 h-4" /> Editar</Link>
          </Button>
        }
      />
      <div className="p-8 space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Información de contacto</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {tenant.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a href={`mailto:${tenant.email}`} className="hover:underline text-primary">{tenant.email}</a>
                </div>
              )}
              {tenant.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a href={`tel:${tenant.phone}`} className="hover:underline">{tenant.phone}</a>
                </div>
              )}
              {tenant.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {tenant.address}
                </div>
              )}
              {tenant.dni && (
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  DNI: {tenant.dni}
                </div>
              )}
              {!tenant.email && !tenant.phone && !tenant.address && <p className="text-sm text-muted-foreground">Sin información de contacto</p>}
            </CardContent>
          </Card>

          {tenant.observations && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Observaciones</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{tenant.observations}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Contratos</CardTitle>
              <Button asChild size="sm"><Link href={`/contratos/nuevo?tenantId=${id}`}>Nuevo contrato</Link></Button>
            </div>
          </CardHeader>
          <CardContent>
            {!contracts || contracts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Sin contratos.</p>
            ) : (
              <div className="divide-y">
                {contracts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{c.property.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(c.start_date)} — {formatDate(c.end_date)} · {formatCurrency(c.current_rent)}/mes</p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <Badge variant={c.status === "activo" ? "success" : "secondary"}>{getContractStatusLabel(c.status)}</Badge>
                      <Button variant="ghost" size="sm" asChild><Link href={`/contratos/${c.id}`}>Ver</Link></Button>
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
