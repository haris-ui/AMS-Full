/*
  # Artiya Management System - Initial Schema
  
  1. Overview
    Complete database schema for Artiya agricultural management system including roles,
    users, farmers, products, purchases, sales, and comprehensive audit logging.
  
  2. New Tables
    - `roles` - User role definitions (admin, manager, clerk)
    - `profiles` - Extended user profile information linked to auth.users
    - `farmers` - Farmer registration and contact details
    - `products` - Product catalog with rates and units
    - `purchases` - Purchase orders from farmers
    - `purchase_items` - Individual line items for purchases
    - `crop_sales` - Sales transactions with commission tracking
    - `transactions` - Financial transaction ledger for farmers
    - `commissions` - Commission tracking for sales
    - `audit_logs` - System-wide audit trail
  
  3. Security
    - Enable RLS on all tables
    - Restrictive policies based on user roles
    - Authenticated access required for all operations
  
  4. Features
    - Computed columns for automatic totals
    - Indexed foreign keys for performance
    - View for farmer balance calculations
    - Audit logging capability
*/

-- ========================
--  ROLES TABLE
-- ========================
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  role_name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

INSERT INTO roles (role_name)
VALUES
  ('admin'),
  ('manager'),
  ('clerk')
ON CONFLICT (role_name) DO NOTHING;

CREATE POLICY "Anyone can view roles"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

-- ========================
--  PROFILES (Users)
-- ========================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  role_id INT REFERENCES roles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON profiles(role_id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.role_name = 'admin'
    )
  );

CREATE POLICY "System can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ========================
--  FARMERS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS farmers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  father_name TEXT,
  address TEXT,
  phone_number TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farmers_name ON farmers(name);

ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view farmers"
  ON farmers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers and admins can insert farmers"
  ON farmers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.role_name IN ('admin', 'manager', 'clerk')
    )
  );

CREATE POLICY "Managers and admins can update farmers"
  ON farmers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.role_name IN ('admin', 'manager', 'clerk')
    )
  );

CREATE POLICY "Admins can delete farmers"
  ON farmers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.role_name = 'admin'
    )
  );

-- ========================
--  PRODUCTS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT,
  rate NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_name ON products(name);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers and admins can manage products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.role_name IN ('admin', 'manager')
    )
  );

-- ========================
--  PURCHASES TABLE
-- ========================
CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,
  farmer_id INT REFERENCES farmers(id) ON DELETE CASCADE,
  payment_type TEXT CHECK (payment_type IN ('Cash', 'Credit')) DEFAULT 'Credit',
  total_amount NUMERIC(12,2) DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  receipt_path TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_farmer_id ON purchases(farmer_id);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view purchases"
  ON purchases FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert purchases"
  ON purchases FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.role_name IN ('admin', 'manager', 'clerk')
    )
  );

CREATE POLICY "Staff can update purchases"
  ON purchases FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.role_name IN ('admin', 'manager', 'clerk')
    )
  );

CREATE POLICY "Admins can delete purchases"
  ON purchases FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.role_name = 'admin'
    )
  );

-- ========================
--  PURCHASE ITEMS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS purchase_items (
  id SERIAL PRIMARY KEY,
  purchase_id INT REFERENCES purchases(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id) ON DELETE SET NULL,
  quantity NUMERIC(12,2) DEFAULT 0,
  rate NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(12,2) GENERATED ALWAYS AS (quantity * rate) STORED
);

CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items(purchase_id);

ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view purchase items"
  ON purchase_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can manage purchase items"
  ON purchase_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.role_name IN ('admin', 'manager', 'clerk')
    )
  );

-- ========================
--  CROP SALES TABLE
-- ========================
CREATE TABLE IF NOT EXISTS crop_sales (
  id SERIAL PRIMARY KEY,
  farmer_id INT REFERENCES farmers(id) ON DELETE CASCADE,
  sold_to TEXT,
  total_value NUMERIC(12,2),
  commission_percent NUMERIC(5,2) DEFAULT 0,
  commission_amount NUMERIC(12,2) GENERATED ALWAYS AS (total_value * commission_percent / 100) STORED,
  net_payable NUMERIC(12,2) GENERATED ALWAYS AS (total_value - (total_value * commission_percent / 100)) STORED,
  date DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crop_sales_farmer_id ON crop_sales(farmer_id);

ALTER TABLE crop_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view crop sales"
  ON crop_sales FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can manage crop sales"
  ON crop_sales FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.role_name IN ('admin', 'manager', 'clerk')
    )
  );

-- ========================
--  TRANSACTIONS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  farmer_id INT REFERENCES farmers(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('Credit', 'Debit')) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  date DATE DEFAULT CURRENT_DATE,
  related_purchase INT REFERENCES purchases(id) ON DELETE SET NULL,
  related_sale INT REFERENCES crop_sales(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_farmer_id ON transactions(farmer_id);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can manage transactions"
  ON transactions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.role_name IN ('admin', 'manager', 'clerk')
    )
  );

-- ========================
--  COMMISSIONS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS commissions (
  id SERIAL PRIMARY KEY,
  sale_id INT REFERENCES crop_sales(id) ON DELETE CASCADE,
  percent NUMERIC(5,2),
  amount NUMERIC(12,2),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view commissions"
  ON commissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can manage commissions"
  ON commissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.role_name IN ('admin', 'manager', 'clerk')
    )
  );

-- ========================
--  AUDIT LOGS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT,
  table_name TEXT,
  record_id INT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ========================
--  FARMER BALANCES VIEW
-- ========================
CREATE OR REPLACE VIEW farmer_balances AS
SELECT
  f.id AS farmer_id,
  f.name AS farmer_name,
  COALESCE(SUM(CASE WHEN t.type = 'Debit' THEN t.amount ELSE 0 END), 0) AS total_debit,
  COALESCE(SUM(CASE WHEN t.type = 'Credit' THEN t.amount ELSE 0 END), 0) AS total_credit,
  COALESCE(SUM(CASE WHEN t.type = 'Credit' THEN t.amount ELSE 0 END), 0)
  - COALESCE(SUM(CASE WHEN t.type = 'Debit' THEN t.amount ELSE 0 END), 0)
  AS balance
FROM farmers f
LEFT JOIN transactions t ON f.id = t.farmer_id
GROUP BY f.id, f.name;