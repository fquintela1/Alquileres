import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { ContractForm } from "@/components/contratos/contract-form";

export default async function NuevoContratoPage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string; tenantId?: string }>;
}) {
  const { propertyId, tenantId } = await searchParams;
  const supabase = await createClient();

  const [{ data: properties }, { data: tenants }] = await Promise.all([
    supabase.from("properties").select("*").order("name"),
    supabase.from("tenants").select("*").order("last_name"),
  ]);

  return (
    <div>
      <Header title="Nuevo contrato" description="Registrá un nuevo contrato de alquiler" />
      <div className="p-8 animate-fade-in">
        <ContractForm
          properties={properties ?? []}
          tenants={tenants ?? []}
          defaultPropertyId={propertyId}
          defaultTenantId={tenantId}
        />
      </div>
    </div>
  );
}
