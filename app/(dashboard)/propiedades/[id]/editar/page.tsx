import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { PropertyForm } from "@/components/propiedades/property-form";
import { notFound } from "next/navigation";

export default async function EditarPropiedadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: property } = await supabase.from("properties").select("*").eq("id", id).single();

  if (!property) notFound();

  return (
    <div>
      <Header title="Editar propiedad" description={property.name} />
      <div className="p-8 animate-fade-in">
        <PropertyForm property={property} />
      </div>
    </div>
  );
}
