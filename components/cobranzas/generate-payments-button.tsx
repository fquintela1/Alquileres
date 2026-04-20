"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Wand2 } from "lucide-react";

interface Props {
  month: number;
  year: number;
}

export function GeneratePaymentsButton({ month, year }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    setLoading(true);
    const res = await fetch("/api/payments/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, year }),
    });
    const data = await res.json();

    if (data.created > 0) {
      toast({
        title: `${data.created} pago${data.created !== 1 ? "s" : ""} generado${data.created !== 1 ? "s" : ""}`,
        description: data.skipped > 0 ? `${data.skipped} ya existían` : undefined,
      });
      router.refresh();
    } else if (data.skipped > 0) {
      toast({
        title: "Pagos ya generados",
        description: "Todos los contratos activos ya tienen pago para este mes",
      });
    } else {
      toast({
        title: "Sin contratos activos",
        description: "No hay contratos activos para generar pagos",
      });
    }
    setLoading(false);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleGenerate} disabled={loading}>
      <Wand2 className="w-4 h-4" />
      {loading ? "Generando..." : "Generar todos"}
    </Button>
  );
}
