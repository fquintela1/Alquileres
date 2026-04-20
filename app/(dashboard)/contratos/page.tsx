import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { ContractsList } from "@/components/contratos/contracts-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function ContratosPage() {
  const supabase = await createClient();
  const { data: contracts } = await supabase
    .from("contracts")
    .select("*, property:properties(name, address, type), tenant:tenants(first_name, last_name)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <Header
        title="Contratos"
        description={`${contracts?.filter(c => c.status === "activo").length ?? 0} activos`}
        actions={
          <Button asChild size="sm">
            <Link href="/contratos/nuevo">
              <Plus className="w-4 h-4" />
              Nuevo contrato
            </Link>
          </Button>
        }
      />
      <div className="p-8 animate-fade-in">
        <ContractsList contracts={contracts as any ?? []} />
      </div>
    </div>
  );
}
