import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const response = await fetch("https://www.creebba.org.ar/ipc/ipc.php", {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AlquileresBot/1.0)",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    const matches = [...html.matchAll(/(\d{1,2})[\/\-](\d{4})[^%\d]*(\d+[,\.]\d+)\s*%/g)];
    const saved: Array<{ month: number; year: number; value: number }> = [];

    if (matches.length === 0) {
      const altMatches = [...html.matchAll(/(\w+)\s+(\d{4})[^%\d]*(\d+[,\.]\d+)\s*%/gi)];
      if (altMatches.length === 0) {
        return NextResponse.json({
          success: false,
          error: "No se encontraron índices en la página. Cargalos manualmente.",
        });
      }
    }

    const supabase = await createServiceClient();

    for (const match of matches.slice(0, 3)) {
      const month = parseInt(match[1]);
      const year = parseInt(match[2]);
      const value = parseFloat(match[3].replace(",", ".")) / 100;

      if (month >= 1 && month <= 12 && year >= 2020) {
        const { error } = await supabase.from("ipc_indexes").upsert(
          { month, year, value, source: "CREEBBA-Auto" },
          { onConflict: "month,year" }
        );
        if (!error) saved.push({ month, year, value });
      }
    }

    if (saved.length > 0) {
      // Send email notification for newly saved indexes
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      for (const idx of saved) {
        fetch(`${appUrl}/api/ipc/notify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(idx),
        }).catch(() => {});
      }
      return NextResponse.json({
        success: true,
        message: `Se guardaron ${saved.length} índice(s) IPC`,
        saved,
      });
    }

    return NextResponse.json({
      success: false,
      error: "No se pudieron extraer índices válidos. Cargalos manualmente desde creebba.org.ar",
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: `Error al consultar CREEBBA: ${error.message}. Cargá el índice manualmente.`,
    });
  }
}
