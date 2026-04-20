import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { PropertiesList } from "@/components/propiedades/properties-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function PropiedadesPage() {
  const supabase = await createClient();
  const { data: properties } = await supabase
    .from("properties")
    .select("*")
    .order("name");

  return (
    <div>
      <Header
        title="Propiedades"
        description={`${properties?.length ?? 0} propiedades registradas`}
        actions={
          <Button asChild size="sm">
            <Link href="/propiedades/nueva">
              <Plus className="w-4 h-4" />
              Nueva propiedad
            </Link>
          </Button>
        }
      />
      <div className="p-8 animate-fade-in">
        <PropertiesList properties={properties ?? []} />
      </div>
    </div>
  );
}
