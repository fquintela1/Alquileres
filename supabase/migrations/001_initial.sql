-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Properties
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('casa', 'departamento', 'cochera', 'local', 'otro')),
  observations TEXT,
  status TEXT NOT NULL DEFAULT 'disponible' CHECK (status IN ('disponible', 'alquilado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenants
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dni TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  observations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contracts
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  initial_rent NUMERIC(12,2) NOT NULL,
  current_rent NUMERIC(12,2) NOT NULL,
  due_day INTEGER NOT NULL DEFAULT 1 CHECK (due_day BETWEEN 1 AND 28),
  adjustment_frequency TEXT NOT NULL CHECK (adjustment_frequency IN ('mensual', 'trimestral', 'cuatrimestral', 'semestral', 'anual')),
  adjustment_index TEXT NOT NULL DEFAULT 'ipc_creebba',
  deposit NUMERIC(12,2),
  late_fee_daily_rate NUMERIC(5,4) NOT NULL DEFAULT 0.05,
  status TEXT NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'finalizado', 'suspendido')),
  notes TEXT,
  last_adjustment_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year INTEGER NOT NULL,
  base_amount NUMERIC(12,2) NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  paid BOOLEAN DEFAULT FALSE,
  partial_amount NUMERIC(12,2),
  late_fee NUMERIC(12,2) DEFAULT 0,
  total_paid NUMERIC(12,2),
  payment_method TEXT CHECK (payment_method IN ('efectivo', 'transferencia', 'cheque', 'otro')),
  observations TEXT,
  receipt_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contract_id, period_month, period_year)
);

-- IPC Indexes (CREEBBA)
CREATE TABLE IF NOT EXISTS ipc_indexes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  value NUMERIC(10,6) NOT NULL,
  cumulative_value NUMERIC(10,4),
  source TEXT DEFAULT 'CREEBBA',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month, year)
);

-- Rent Adjustments History
CREATE TABLE IF NOT EXISTS rent_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  adjustment_date DATE NOT NULL,
  previous_amount NUMERIC(12,2) NOT NULL,
  new_amount NUMERIC(12,2) NOT NULL,
  coefficient NUMERIC(10,6) NOT NULL,
  period_start_month INTEGER,
  period_start_year INTEGER,
  period_end_month INTEGER,
  period_end_year INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Files
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contract', 'tenant', 'property')),
  entity_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Receipt counter
CREATE TABLE IF NOT EXISTS receipt_counter (
  id INTEGER PRIMARY KEY DEFAULT 1,
  last_number INTEGER NOT NULL DEFAULT 0
);
INSERT INTO receipt_counter VALUES (1, 0) ON CONFLICT DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contracts_property ON contracts(property_id);
CREATE INDEX IF NOT EXISTS idx_contracts_tenant ON contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_payments_contract ON payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_period ON payments(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_payments_paid ON payments(paid);
CREATE INDEX IF NOT EXISTS idx_ipc_period ON ipc_indexes(year, month);
CREATE INDEX IF NOT EXISTS idx_files_entity ON files(entity_type, entity_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipc_indexes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_counter ENABLE ROW LEVEL SECURITY;

-- Policies: only authenticated users can access
CREATE POLICY "Auth users all" ON properties FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users all" ON tenants FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users all" ON contracts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users all" ON payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users all" ON ipc_indexes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users all" ON rent_adjustments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users all" ON files FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users all" ON notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users all" ON receipt_counter FOR ALL TO authenticated USING (true) WITH CHECK (true);
