import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { NewPaymentForm } from "@/components/cobranzas/new-payment-form";

export default async function NuevaCobranzaPage({
  searchParams
}: {
  searchParams: Promise<{ contractId?: string }>
}) {
  const { contractId } = await searchParams;
  const supabase = await createClient();

  const { data: contracts } = await supabase
    .from("contracts")
    .select("*, property:properties(name), tenant:tenants(first_name, last_name)")
    .eq("status", "activo")
    .order("created_at");

  return (
    <div>
      <Header title="Nuevo pago" description="Generar un período de pago para un contrato" />
      <div className="p-8 animate-fade-in">
        <NewPaymentForm contracts={contracts as any ?? []} defaultContractId={contractId} />
      </div>
    </div>
  );
}
