import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { ReceiptsManager } from "@/components/recibos/receipts-manager";

export default async function RecibosPage({
  searchParams
}: {
  searchParams: Promise<{ paymentId?: string }>
}) {
  const { paymentId } = await searchParams;
  const supabase = await createClient();

  const { data: payments } = await supabase
    .from("payments")
    .select("*, contract:contracts(*, property:properties(*), tenant:tenants(*))")
    .eq("paid", true)
    .not("receipt_number", "is", null)
    .order("payment_date", { ascending: false })
    .limit(50);

  return (
    <div>
      <Header
        title="Recibos"
        description="Generación y descarga de recibos de pago"
      />
      <div className="p-8 animate-fade-in">
        <ReceiptsManager payments={payments as any ?? []} highlightPaymentId={paymentId} />
      </div>
    </div>
  );
}
