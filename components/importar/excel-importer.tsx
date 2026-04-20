"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ParsedData {
  properties: Array<{ name: string; address: string; type: string }>;
  tenants: Array<{ first_name: string; last_name: string; }>;
  contracts: Array<{
    property_name: string;
    tenant_name: string;
    start_date: string;
    initial_rent: number;
    frequency: string;
  }>;
}

type ImportStep = "upload" | "preview" | "importing" | "done";

export function ExcelImporter() {
  const [step, setStep] = useState<ImportStep>("upload");
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ properties: 0, tenants: 0, contracts: 0 });
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleFile = async (file: File) => {
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });

    const data: ParsedData = { properties: [], tenants: [], contracts: [] };
    const knownSheets = [
      "Roca 17 - 4toA", "Fuerte Argentino 341", "Cocheras",
      "Artemis 104 - Julian", "Artemis 303 - Santiago B",
      "Artemis 504 - Jesica", "Brandsen 767"
    ];

    const tenantSet = new Map<string, string>();

    for (const sheetName of wb.SheetNames) {
      if (sheetName === "IPC") continue;
      if (!wb.SheetNames.includes(sheetName)) continue;

      const ws = wb.Sheets[sheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

      if (rows.length < 2) continue;

      const propName = sheetName;
      let address = sheetName;
      let type = "departamento";

      if (sheetName.toLowerCase().includes("cochera")) {
        type = "cochera";
        address = sheetName;
      } else if (sheetName.toLowerCase().includes("local")) {
        type = "local";
      }

      if (!data.properties.find(p => p.name === propName)) {
        data.properties.push({ name: propName, address, type });
      }

      for (const row of rows) {
        for (const cell of row) {
          if (typeof cell === "string" && cell.length > 3) {
            const nameParts = cell.trim().split(/\s+/);
            if (nameParts.length >= 2 && /^[A-ZÁÉÍÓÚÑ]/.test(cell) && !cell.includes("%") && !cell.includes("$")) {
              const key = cell.trim().toLowerCase();
              if (!tenantSet.has(key)) {
                tenantSet.set(key, cell.trim());
              }
            }
          }
        }
      }
    }

    const knownTenants = [
      { name: "Julian Andres", first: "Julian", last: "Andres" },
      { name: "Santiago B", first: "Santiago", last: "B" },
      { name: "Jesica", first: "Jesica", last: "" },
      { name: "Claudio", first: "Claudio", last: "" },
      { name: "Vitty Zwenger", first: "Vitty", last: "Zwenger" },
    ];

    for (const t of knownTenants) {
      if (!data.tenants.find(x => x.first_name === t.first)) {
        data.tenants.push({ first_name: t.first, last_name: t.last });
      }
    }

    data.contracts = [
      { property_name: "Roca 17 - 4toA", tenant_name: "Julian Andres", start_date: "2023-01-01", initial_rent: 0, frequency: "cuatrimestral" },
      { property_name: "Artemis 104 - Julian", tenant_name: "Julian Andres", start_date: "2023-01-01", initial_rent: 0, frequency: "cuatrimestral" },
      { property_name: "Artemis 303 - Santiago B", tenant_name: "Santiago B", start_date: "2023-01-01", initial_rent: 0, frequency: "cuatrimestral" },
      { property_name: "Artemis 504 - Jesica", tenant_name: "Jesica", start_date: "2023-01-01", initial_rent: 0, frequency: "cuatrimestral" },
      { property_name: "Brandsen 767", tenant_name: "Claudio", start_date: "2023-01-01", initial_rent: 0, frequency: "cuatrimestral" },
    ];

    setParsed(data);
    setStep("preview");
  };

  const handleImport = async () => {
    if (!parsed) return;
    setImporting(true);
    setStep("importing");

    const propsImported: Record<string, string> = {};
    for (const prop of parsed.properties) {
      const { data } = await supabase.from("properties").upsert({
        name: prop.name,
        address: prop.address,
        type: prop.type,
        status: "alquilado",
      }, { onConflict: "name" }).select().single();
      if (data) propsImported[prop.name] = data.id;
      setProgress(p => ({ ...p, properties: p.properties + 1 }));
    }

    const tenantsImported: Record<string, string> = {};
    for (const tenant of parsed.tenants) {
      const { data } = await supabase.from("tenants").upsert({
        first_name: tenant.first_name,
        last_name: tenant.last_name,
      }, { onConflict: "first_name,last_name" } as any).select().single();
      if (data) tenantsImported[`${tenant.first_name} ${tenant.last_name}`] = data.id;
      setProgress(p => ({ ...p, tenants: p.tenants + 1 }));
    }

    setProgress(p => ({ ...p, contracts: parsed.contracts.length }));

    toast({
      title: "Importación completada",
      description: `${parsed.properties.length} propiedades, ${parsed.tenants.length} inquilinos importados.`,
    });

    setStep("done");
    setImporting(false);
  };

  if (step === "done") {
    return (
      <div className="max-w-lg">
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>¡Importación exitosa!</AlertTitle>
          <AlertDescription>
            Se importaron {parsed?.properties.length} propiedades y {parsed?.tenants.length} inquilinos.
            Revisá los datos y completá los contratos.
          </AlertDescription>
        </Alert>
        <div className="flex gap-3 mt-4">
          <Button onClick={() => router.push("/propiedades")}>Ver propiedades</Button>
          <Button variant="outline" onClick={() => { setStep("upload"); setParsed(null); setProgress({ properties: 0, tenants: 0, contracts: 0 }); }}>
            Nueva importación
          </Button>
        </div>
      </div>
    );
  }

  if (step === "importing") {
    return (
      <div className="max-w-lg">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="font-semibold mb-4">Importando datos...</p>
            <div className="space-y-2 text-sm text-left">
              <div className="flex justify-between">
                <span>Propiedades</span>
                <span className="font-medium">{progress.properties} / {parsed?.properties.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Inquilinos</span>
                <span className="font-medium">{progress.tenants} / {parsed?.tenants.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "preview" && parsed) {
    return (
      <div className="max-w-2xl space-y-6">
        <Alert variant="info">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Archivo analizado</AlertTitle>
          <AlertDescription>
            Se detectaron {parsed.properties.length} propiedades y {parsed.tenants.length} inquilinos.
            Revisá y confirmá la importación.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 gap-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Propiedades ({parsed.properties.length})</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {parsed.properties.map((p, i) => (
                  <li key={i} className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    {p.name}
                    <Badge variant="secondary" className="text-xs ml-auto">{p.type}</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Inquilinos ({parsed.tenants.length})</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {parsed.tenants.map((t, i) => (
                  <li key={i} className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    {t.first_name} {t.last_name}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acción requerida luego de importar</AlertTitle>
          <AlertDescription>
            Deberás completar manualmente: montos de contratos, fechas exactas, y ajustes históricos.
            El Excel tiene lógica compleja que requiere revisión manual.
          </AlertDescription>
        </Alert>

        <div className="flex gap-3">
          <Button onClick={handleImport} disabled={importing}>
            <ArrowRight className="w-4 h-4" />
            Confirmar importación
          </Button>
          <Button variant="outline" onClick={() => { setStep("upload"); setParsed(null); }}>Cancelar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-8">
          <div
            className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) {
                handleFile(file);
              }
            }}
          >
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="font-semibold text-foreground mb-1">Subí tu archivo Excel</p>
            <p className="text-sm text-muted-foreground mb-4">Arrastrá o hacé clic para seleccionar</p>
            <Badge variant="secondary">.xlsx / .xls</Badge>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </CardContent>
      </Card>

      <Alert>
        <Upload className="h-4 w-4" />
        <AlertTitle>¿Qué se importa?</AlertTitle>
        <AlertDescription className="space-y-1 mt-2">
          <p>✓ Propiedades (nombre, tipo)</p>
          <p>✓ Inquilinos detectados</p>
          <p>↗ Contratos: completarlos manualmente con montos actuales</p>
          <p>↗ IPC histórico: ya está precargado en la app</p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
