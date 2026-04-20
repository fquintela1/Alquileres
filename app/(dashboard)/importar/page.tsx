import { Header } from "@/components/layout/header";
import { ExcelImporter } from "@/components/importar/excel-importer";

export default function ImportarPage() {
  return (
    <div>
      <Header
        title="Importar desde Excel"
        description="Importá tus datos del Excel anterior"
      />
      <div className="p-8 animate-fade-in">
        <ExcelImporter />
      </div>
    </div>
  );
}
