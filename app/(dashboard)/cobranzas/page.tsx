import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { CobranzasList } from "@/components/cobranzas/cobranzas-list";
import { GeneratePaymentsButton } from "@/components/cobranzas/generate-payments-button";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default async function CobranzasPage({
  searchParams
}: {
  searchParams: Promise<{ mes?: string; año?: string; filter?: string }>
}) {
  const params = await searchParams;
  const now = new Date();
  const mes = params.mes ? parseInt(params.mes) : now.getMonth() + 1;
  const año = params.año ? parseInt(params.año) : now.getFullYear();

  const supabase = await createClient();
  const { data: payments } = await supabase
    .from("payments")
    .select("*, contract:contracts(id, current_rent, due_day, late_fee_daily_rate, property:properties(name), tenant:tenants(first_name, last_name))")
    .eq("period_month", mes)
    .eq("period_year", año)
    .order("due_date", { ascending: true });

  return (
    <div>
      <Header
        title="Cobranzas"
        description={`${format(new Date(año, mes - 1, 1), "MMMM yyyy")}`}
        actions={
          <div className="flex gap-2">
            <GeneratePaymentsButton month={mes} year={año} />
            <Button asChild size="sm">
              <Link href="/cobranzas/nueva">
                <Plus className="w-4 h-4" />
                Registrar pago
              </Link>
            </Button>
          </div>
        }
      />
      <div className="p-8 animate-fade-in">
        <CobranzasList payments={payments as any ?? []} currentMonth={mes} currentYear={año} />
      </div>
    </div>
  );
}
