import { Header } from "@/components/layout/header";
import { TenantForm } from "@/components/inquilinos/tenant-form";

export default function NuevoInquilinoPage() {
  return (
    <div>
      <Header title="Nuevo inquilino" description="Registrá un nuevo inquilino" />
      <div className="p-8 animate-fade-in">
        <TenantForm />
      </div>
    </div>
  );
}
