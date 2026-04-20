import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { TenantsList } from "@/components/inquilinos/tenants-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function InquilinosPage() {
  const supabase = await createClient();
  const { data: tenants } = await supabase
    .from("tenants")
    .select("*")
    .order("last_name");

  return (
    <div>
      <Header
        title="Inquilinos"
        description={`${tenants?.length ?? 0} inquilinos registrados`}
        actions={
          <Button asChild size="sm">
            <Link href="/inquilinos/nuevo">
              <Plus className="w-4 h-4" />
              Nuevo inquilino
            </Link>
          </Button>
        }
      />
      <div className="p-8 animate-fade-in">
        <TenantsList tenants={tenants ?? []} />
      </div>
    </div>
  );
}
