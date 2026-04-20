import { AdjustmentFrequency } from "@/types";
import { addMonths, parseISO, differenceInMonths } from "date-fns";

export function getFrequencyMonths(frequency: AdjustmentFrequency): number {
  const map: Record<AdjustmentFrequency, number> = {
    mensual: 1,
    trimestral: 3,
    cuatrimestral: 4,
    semestral: 6,
    anual: 12,
  };
  return map[frequency];
}

export function getNextAdjustmentDate(
  startDate: string,
  frequency: AdjustmentFrequency,
  lastAdjustmentDate?: string
): Date {
  const base = lastAdjustmentDate
    ? parseISO(lastAdjustmentDate)
    : parseISO(startDate);
  const months = getFrequencyMonths(frequency);
  return addMonths(base, months);
}

export function calculateAdjustmentCoefficient(
  baseIpc: number,
  currentIpc: number
): number {
  if (baseIpc === 0) return 1;
  return currentIpc / baseIpc;
}

export function calculateNewRent(
  currentRent: number,
  baseIpc: number,
  currentIpc: number
): number {
  const coefficient = calculateAdjustmentCoefficient(baseIpc, currentIpc);
  return Math.round(currentRent * coefficient);
}

export function getAdjustmentIpcPeriod(
  startDate: string,
  frequency: AdjustmentFrequency,
  lastAdjustmentDate?: string
): { startMonth: number; startYear: number; endMonth: number; endYear: number } {
  const periodMonths = getFrequencyMonths(frequency);
  const periodStart = lastAdjustmentDate
    ? parseISO(lastAdjustmentDate)
    : parseISO(startDate);

  const periodEnd = addMonths(periodStart, periodMonths - 1);

  return {
    startMonth: periodStart.getMonth() + 1,
    startYear: periodStart.getFullYear(),
    endMonth: periodEnd.getMonth() + 1,
    endYear: periodEnd.getFullYear(),
  };
}

export function isDueForAdjustment(
  startDate: string,
  frequency: AdjustmentFrequency,
  lastAdjustmentDate?: string
): boolean {
  const nextDate = getNextAdjustmentDate(startDate, frequency, lastAdjustmentDate);
  return nextDate <= new Date();
}

export function getMonthsUntilAdjustment(
  startDate: string,
  frequency: AdjustmentFrequency,
  lastAdjustmentDate?: string
): number {
  const nextDate = getNextAdjustmentDate(startDate, frequency, lastAdjustmentDate);
  const today = new Date();
  return Math.max(0, differenceInMonths(nextDate, today));
}
