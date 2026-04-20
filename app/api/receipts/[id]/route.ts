import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { formatDate, getMonthName, getPaymentMethodLabel } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: payment } = await supabase
    .from("payments")
    .select("*, contract:contracts(*, property:properties(*), tenant:tenants(*))")
    .eq("id", id)
    .single();

  if (!payment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const receiptNum = String(payment.receipt_number).padStart(4, "0");
  const total = payment.total_paid ?? payment.base_amount;
  const lateFee = payment.late_fee ?? 0;
  const tenantName = `${payment.contract.tenant.first_name} ${payment.contract.tenant.last_name}`;
  const periodLabel = `${getMonthName(payment.period_month)} ${payment.period_year}`;
  const totalFormatted = total.toLocaleString("es-AR");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Recibo N° ${receiptNum} — ${tenantName}</title>
  <style>
    @page { size: A5; margin: 16mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
      color: #0f172a;
      background: white;
      font-size: 13px;
    }
    .page { max-width: 460px; margin: 0 auto; padding: 32px; }
    .header { text-align: center; padding-bottom: 24px; border-bottom: 1.5px dashed #cbd5e1; margin-bottom: 24px; }
    .logo-icon {
      width: 40px; height: 40px; border-radius: 10px; background: #1d4ed8;
      display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;
    }
    .logo-icon svg { width: 22px; height: 22px; fill: white; }
    .receipt-title { font-size: 26px; font-weight: 800; letter-spacing: 0.18em; color: #0f172a; }
    .receipt-num { color: #64748b; font-size: 13px; margin-top: 2px; }

    .field { display: flex; justify-content: space-between; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
    .field:last-child { border-bottom: none; }
    .field-label { color: #64748b; font-size: 12px; }
    .field-value { font-weight: 700; font-size: 13px; text-align: right; max-width: 240px; }
    .field-value.mora { color: #dc2626; }

    .total-section { text-align: center; padding: 28px 0; background: #f8fafc; border-radius: 12px; margin: 20px 0; }
    .total-label { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; }
    .total-amount { font-size: 40px; font-weight: 800; color: #0f172a; letter-spacing: -1px; }
    .total-sign { font-size: 22px; font-weight: 600; color: #475569; vertical-align: super; margin-right: 4px; }

    .footer { text-align: center; padding-top: 20px; border-top: 1.5px dashed #cbd5e1; }
    .footer-thanks { font-size: 14px; font-style: italic; color: #475569; margin-bottom: 6px; }
    .footer-date { font-size: 11px; color: #94a3b8; }

    .no-print { display: flex; justify-content: center; gap: 12px; padding: 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
    .btn { padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; }
    .btn-primary { background: #1d4ed8; color: white; }
    .btn-secondary { background: white; color: #374151; border: 1px solid #d1d5db; }
    .btn:hover { opacity: 0.9; }

    @media print {
      .no-print { display: none !important; }
      body { padding: 0; }
      .page { padding: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="logo-icon">
        <svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
      </div>
      <div class="receipt-title">RECIBO</div>
      <div class="receipt-num">N° ${receiptNum}</div>
    </div>

    <div class="fields">
      <div class="field">
        <span class="field-label">Fecha</span>
        <span class="field-value">${payment.payment_date ? formatDate(payment.payment_date) : "—"}</span>
      </div>
      <div class="field">
        <span class="field-label">Inquilino</span>
        <span class="field-value">${tenantName}</span>
      </div>
      <div class="field">
        <span class="field-label">Propiedad</span>
        <span class="field-value">${payment.contract.property.name}</span>
      </div>
      <div class="field">
        <span class="field-label">Período</span>
        <span class="field-value" style="text-transform:capitalize">${periodLabel}</span>
      </div>
      <div class="field">
        <span class="field-label">Concepto</span>
        <span class="field-value">Alquiler</span>
      </div>
      ${payment.payment_method ? `
      <div class="field">
        <span class="field-label">Método de pago</span>
        <span class="field-value">${getPaymentMethodLabel(payment.payment_method)}</span>
      </div>` : ""}
      ${lateFee > 0 ? `
      <div class="field">
        <span class="field-label">Alquiler base</span>
        <span class="field-value">$ ${payment.base_amount.toLocaleString("es-AR")}</span>
      </div>
      <div class="field">
        <span class="field-label">Interés por mora</span>
        <span class="field-value mora">$ ${lateFee.toLocaleString("es-AR")}</span>
      </div>` : ""}
    </div>

    <div class="total-section">
      <div class="total-label">Monto Total</div>
      <div class="total-amount"><span class="total-sign">$</span>${totalFormatted}</div>
    </div>

    <div class="footer">
      <div class="footer-thanks">Gracias por su pago</div>
      <div class="footer-date">Generado el ${formatDate(new Date().toISOString())}</div>
    </div>
  </div>

  <div class="no-print">
    <button class="btn btn-secondary" onclick="window.close()">Cerrar</button>
    <button class="btn btn-primary" onclick="window.print()">Imprimir / Guardar PDF</button>
  </div>

  <script>
    // Auto-focus so Cmd+P works immediately
    window.focus();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
