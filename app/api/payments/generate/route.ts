import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { format, getDaysInMonth } from "date-fns";

export async function POST(req: NextRequest) {
  const { month, year } = await req.json();

  if (!month || !year) {
    return NextResponse.json({ error: "month and year required" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  const { data: contracts, error } = await supabase
    .from("contracts")
    .select("*")
    .eq("status", "activo");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const contract of contracts ?? []) {
    const dueDay = Math.min(
      contract.due_day,
      getDaysInMonth(new Date(year, month - 1))
    );
    const dueDate = format(new Date(year, month - 1, dueDay), "yyyy-MM-dd");

    const { error: upsertError } = await supabase.from("payments").upsert(
      {
        contract_id: contract.id,
        period_month: month,
        period_year: year,
        base_amount: contract.current_rent,
        due_date: dueDate,
        paid: false,
        late_fee: 0,
      },
      { onConflict: "contract_id,period_month,period_year", ignoreDuplicates: true }
    );

    if (upsertError) {
      if (upsertError.code === "23505") {
        skipped++;
      } else {
        errors.push(`${contract.id}: ${upsertError.message}`);
      }
    } else {
      created++;
    }
  }

  return NextResponse.json({ created, skipped, errors });
}
