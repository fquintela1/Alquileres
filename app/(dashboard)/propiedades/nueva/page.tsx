import { Header } from "@/components/layout/header";
import { PropertyForm } from "@/components/propiedades/property-form";

export default function NuevaPropiedadPage() {
  return (
    <div>
      <Header title="Nueva propiedad" description="Registrá una nueva propiedad" />
      <div className="p-8 animate-fade-in">
        <PropertyForm />
      </div>
    </div>
  );
}
