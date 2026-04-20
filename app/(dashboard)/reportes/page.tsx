import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { ReportesView } from "@/components/reportes/reportes-view";
import { format, subMonths, startOfMonth } from "date-fns";

export default async function ReportesPage() {
  const supabase = await createClient();
  const now = new Date();

  // Last 12 months of payments
  const twelveMonthsAgo = format(subMonths(startOfMonth(now), 11), "yyyy-MM-dd");

  const [
    { data: payments },
    { data: contracts },
    { data: properties },
    { data: ipcIndexes },
  ] = await Promise.all([
    supabase
      .from("payments")
      .select("*, contract:contracts(property:properties(name, type))")
      .gte("due_date", twelveMonthsAgo)
      .order("due_date", { ascending: true }),
    supabase
      .from("contracts")
      .select("*, property:properties(name, type), tenant:tenants(first_name, last_name)")
      .order("current_rent", { ascending: false }),
    supabase
      .from("properties")
      .select("*, contracts(status)"),
    supabase
      .from("ipc_indexes")
      .select("*")
      .order("year", { ascending: true })
      .order("month", { ascending: true })
      .limit(24),
  ]);

  return (
    <div>
      <Header title="Reportes" description="Análisis financiero y estadísticas" />
      <div className="p-8 animate-fade-in">
        <ReportesView
          payments={payments as any ?? []}
          contracts={contracts as any ?? []}
          properties={properties as any ?? []}
          ipcIndexes={ipcIndexes ?? []}
        />
      </div>
    </div>
  );
}
