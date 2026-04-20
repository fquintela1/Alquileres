import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { DashboardKPIs } from "@/components/dashboard/kpi-cards";
import { UpcomingPayments } from "@/components/dashboard/upcoming-payments";
import { UpcomingAdjustments } from "@/components/dashboard/upcoming-adjustments";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { OverdueAlerts } from "@/components/dashboard/overdue-alerts";
import { format, startOfMonth, endOfMonth } from "date-fns";

export default async function DashboardPage() {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

  const [
    { data: activeContracts },
    { data: paidPayments },
    { data: pendingPayments },
    { data: overduePayments },
    { data: upcomingDue },
    { data: recentActivity },
    { data: contracts },
  ] = await Promise.all([
    supabase.from("contracts").select("id", { count: "exact" }).eq("status", "activo"),
    supabase.from("payments")
      .select("total_paid, base_amount, late_fee")
      .eq("paid", true)
      .gte("due_date", monthStart)
      .lte("due_date", monthEnd),
    supabase.from("payments")
      .select("base_amount")
      .eq("paid", false)
      .gte("due_date", monthStart)
      .lte("due_date", monthEnd),
    supabase.from("payments")
      .select("*, contract:contracts(*, property:properties(name), tenant:tenants(first_name, last_name))")
      .eq("paid", false)
      .lt("due_date", format(now, "yyyy-MM-dd"))
      .order("due_date", { ascending: true })
      .limit(10),
    supabase.from("payments")
      .select("*, contract:contracts(*, property:properties(name), tenant:tenants(first_name, last_name))")
      .eq("paid", false)
      .gte("due_date", format(now, "yyyy-MM-dd"))
      .order("due_date", { ascending: true })
      .limit(8),
    supabase.from("payments")
      .select("*, contract:contracts(*, property:properties(name), tenant:tenants(first_name, last_name))")
      .eq("paid", true)
      .order("payment_date", { ascending: false })
      .limit(5),
    supabase.from("contracts")
      .select("*, property:properties(name), tenant:tenants(first_name, last_name)")
      .eq("status", "activo"),
  ]);

  const collectedThisMonth = paidPayments?.reduce((sum, p) => sum + (p.total_paid ?? p.base_amount + (p.late_fee ?? 0)), 0) ?? 0;
  const pendingThisMonth = pendingPayments?.reduce((sum, p) => sum + p.base_amount, 0) ?? 0;

  return (
    <div>
      <Header
        title="Dashboard"
        description={`${format(now, "MMMM yyyy").replace(/^\w/, c => c.toUpperCase())}`}
      />
      <div className="p-8 space-y-8 animate-fade-in">
        <DashboardKPIs
          activeContracts={activeContracts?.length ?? 0}
          collectedThisMonth={collectedThisMonth}
          pendingThisMonth={pendingThisMonth}
          overdueCount={overduePayments?.length ?? 0}
        />

        {overduePayments && overduePayments.length > 0 && (
          <OverdueAlerts payments={overduePayments as any} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UpcomingPayments payments={upcomingDue as any ?? []} />
          <UpcomingAdjustments contracts={contracts as any ?? []} />
        </div>

        <RecentActivity payments={recentActivity as any ?? []} />
      </div>
    </div>
  );
}
