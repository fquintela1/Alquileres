import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { TenantForm } from "@/components/inquilinos/tenant-form";
import { notFound } from "next/navigation";

export default async function EditarInquilinoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: tenant } = await supabase.from("tenants").select("*").eq("id", id).single();
  if (!tenant) notFound();

  return (
    <div>
      <Header title="Editar inquilino" description={`${tenant.first_name} ${tenant.last_name}`} />
      <div className="p-8 animate-fade-in">
        <TenantForm tenant={tenant} />
      </div>
    </div>
  );
}
