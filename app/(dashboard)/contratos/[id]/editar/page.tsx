import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { ContractForm } from "@/components/contratos/contract-form";
import { notFound } from "next/navigation";

export default async function EditarContratoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: contract }, { data: properties }, { data: tenants }] = await Promise.all([
    supabase.from("contracts").select("*").eq("id", id).single(),
    supabase.from("properties").select("*").order("name"),
    supabase.from("tenants").select("*").order("last_name"),
  ]);

  if (!contract) notFound();

  return (
    <div>
      <Header title="Editar contrato" description="Modificá los datos del contrato" />
      <div className="p-8 animate-fade-in">
        <ContractForm
          contract={contract}
          properties={properties ?? []}
          tenants={tenants ?? []}
        />
      </div>
    </div>
  );
}
