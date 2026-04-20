export type PropertyType = "casa" | "departamento" | "cochera" | "local" | "otro";
export type PropertyStatus = "disponible" | "alquilado";
export type ContractStatus = "activo" | "finalizado" | "suspendido";
export type AdjustmentFrequency = "mensual" | "trimestral" | "cuatrimestral" | "semestral" | "anual";
export type PaymentMethod = "efectivo" | "transferencia" | "cheque" | "otro";

export interface Property {
  id: string;
  name: string;
  address: string;
  type: PropertyType;
  observations?: string;
  status: PropertyStatus;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  dni?: string;
  phone?: string;
  email?: string;
  address?: string;
  observations?: string;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  property_id: string;
  tenant_id: string;
  start_date: string;
  end_date: string;
  initial_rent: number;
  current_rent: number;
  due_day: number;
  adjustment_frequency: AdjustmentFrequency;
  adjustment_index: string;
  deposit?: number;
  late_fee_daily_rate: number;
  status: ContractStatus;
  notes?: string;
  last_adjustment_date?: string;
  created_at: string;
  updated_at: string;
  property?: Property;
  tenant?: Tenant;
}

export interface Payment {
  id: string;
  contract_id: string;
  period_month: number;
  period_year: number;
  base_amount: number;
  due_date: string;
  payment_date?: string;
  paid: boolean;
  partial_amount?: number;
  late_fee: number;
  total_paid?: number;
  payment_method?: PaymentMethod;
  observations?: string;
  receipt_number?: number;
  created_at: string;
  updated_at: string;
  contract?: Contract;
}

export interface IpcIndex {
  id: string;
  month: number;
  year: number;
  value: number;
  source: string;
  created_at: string;
}

export interface RentAdjustment {
  id: string;
  contract_id: string;
  adjustment_date: string;
  previous_amount: number;
  new_amount: number;
  coefficient: number;
  period_start_ipc?: number;
  period_end_ipc?: number;
  period_start_month?: number;
  period_start_year?: number;
  period_end_month?: number;
  period_end_year?: number;
  notes?: string;
  created_at: string;
}

export interface FileRecord {
  id: string;
  entity_type: "contract" | "tenant" | "property";
  entity_id: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  is_current: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, unknown>;
  created_at: string;
}

export interface DashboardStats {
  activeContracts: number;
  collectedThisMonth: number;
  pendingThisMonth: number;
  upcomingDue: Payment[];
  upcomingAdjustments: Contract[];
  overduePayments: Payment[];
  recentActivity: Payment[];
}
