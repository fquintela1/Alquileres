import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { IpcManager } from "@/components/ipc/ipc-manager";

export default async function IpcPage() {
  const supabase = await createClient();
  const { data: indexes } = await supabase
    .from("ipc_indexes")
    .select("*")
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  return (
    <div>
      <Header
        title="IPC CREEBBA"
        description="Gestión de índices mensuales de inflación"
      />
      <div className="p-8 animate-fade-in">
        <IpcManager indexes={indexes ?? []} />
      </div>
    </div>
  );
}
