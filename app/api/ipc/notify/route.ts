import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

export async function POST(req: NextRequest) {
  const { month, year, value } = await req.json();

  const emailTo = process.env.NOTIFICATION_EMAIL;
  const resendKey = process.env.RESEND_API_KEY;

  if (!emailTo || !resendKey) {
    return NextResponse.json({ error: "Email not configured" }, { status: 400 });
  }

  const monthName = MONTHS[month - 1];
  const pct = (value * 100).toFixed(2);

  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background: #1d4ed8; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Nuevo IPC CREEBBA</h1>
      </div>
      <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="font-size: 16px; color: #374151;">Se publicó el nuevo índice IPC:</p>
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 16px 0; text-align: center;">
          <p style="color: #64748b; font-size: 14px; margin: 0 0 4px;">${monthName} ${year}</p>
          <p style="font-size: 36px; font-weight: 800; color: #1d4ed8; margin: 0;">${pct}%</p>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0;">variación mensual</p>
        </div>
        <p style="color: #64748b; font-size: 14px;">
          Revisá los contratos con actualización pendiente en tu panel de administración.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/contratos"
           style="display: inline-block; background: #1d4ed8; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 12px; font-size: 14px;">
          Ver contratos
        </a>
      </div>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Alquileres <onboarding@resend.dev>",
      to: emailTo,
      subject: `📊 Nuevo IPC CREEBBA — ${monthName} ${year}: ${pct}%`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  // Save notification in DB
  const supabase = await createServiceClient();
  await supabase.from("notifications").insert({
    type: "ipc_new",
    title: `Nuevo IPC: ${monthName} ${year}`,
    message: `Se publicó el IPC CREEBBA de ${monthName} ${year}: ${pct}%`,
    data: { month, year, value },
  });

  return NextResponse.json({ success: true });
}
