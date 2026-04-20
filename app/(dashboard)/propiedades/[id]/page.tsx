import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPropertyTypeLabel, formatDate, formatCurrency, getContractStatusLabel } from "@/lib/utils";
import { Pencil, MapPin, Building2, FileText } from "lucide-react";
import Link from "next/link";

export default async function PropiedadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: property }, { data: contracts }] = await Promise.all([
    supabase.from("properties").select("*").eq("id", id).single(),
    supabase.from("contracts")
      .select("*, tenant:tenants(first_name, last_name)")
      .eq("property_id", id)
      .order("start_date", { ascending: false }),
  ]);

  if (!property) notFound();

  const activeContract = contracts?.find(c => c.status === "activo");

  return (
    <div>
      <Header
        title={property.name}
        description={property.address}
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href={`/propiedades/${id}/editar`}>
              <Pencil className="w-4 h-4" />
              Editar
            </Link>
          </Button>
        }
      />
      <div className="p-8 space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tipo</p>
                <p className="font-semibold">{getPropertyTypeLabel(property.type)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estado</p>
                <Badge variant={property.status === "alquilado" ? "success" : "secondary"}>
                  {property.status === "alquilado" ? "Alquilado" : "Disponible"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {activeContract && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Alquiler actual</p>
                  <p className="font-semibold text-blue-700">{formatCurrency(activeContract.current_rent)}/mes</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {property.observations && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Observaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{property.observations}</p>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Historial de contratos</CardTitle>
              <Button asChild size="sm">
                <Link href={`/contratos/nuevo?propertyId=${id}`}>Nuevo contrato</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!contracts || contracts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No hay contratos para esta propiedad.</p>
            ) : (
              <div className="divide-y">
                {contracts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{c.tenant.first_name} {c.tenant.last_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(c.start_date)} — {formatDate(c.end_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <Badge variant={c.status === "activo" ? "success" : "secondary"}>
                        {getContractStatusLabel(c.status)}
                      </Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/contratos/${c.id}`}>Ver</Link>
                      </Button>
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
