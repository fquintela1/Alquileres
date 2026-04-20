import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd/MM/yyyy", { locale: es });
}

export function formatDateLong(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "d 'de' MMMM 'de' yyyy", { locale: es });
}

export function formatMonth(month: number, year: number): string {
  const d = new Date(year, month - 1, 1);
  return format(d, "MMMM yyyy", { locale: es });
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getPropertyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    casa: "Casa",
    departamento: "Departamento",
    cochera: "Cochera",
    local: "Local",
    otro: "Otro",
  };
  return labels[type] ?? type;
}

export function getContractStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    activo: "Activo",
    finalizado: "Finalizado",
    suspendido: "Suspendido",
  };
  return labels[status] ?? status;
}

export function getFrequencyLabel(freq: string): string {
  const labels: Record<string, string> = {
    mensual: "Mensual",
    trimestral: "Trimestral",
    cuatrimestral: "Cuatrimestral",
    semestral: "Semestral",
    anual: "Anual",
  };
  return labels[freq] ?? freq;
}

export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    efectivo: "Efectivo",
    transferencia: "Transferencia",
    cheque: "Cheque",
    otro: "Otro",
  };
  return labels[method] ?? method;
}

export function getDaysOverdue(dueDate: string): number {
  const due = parseISO(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diff = today.getTime() - due.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function calculateLateFee(
  amount: number,
  daysOverdue: number,
  dailyRate: number
): number {
  if (daysOverdue <= 0) return 0;
  return Math.round(amount * (dailyRate / 100) * daysOverdue);
}

export function getMonthName(month: number): string {
  const d = new Date(2024, month - 1, 1);
  return format(d, "MMMM", { locale: es });
}

export function parseArgDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day);
}
