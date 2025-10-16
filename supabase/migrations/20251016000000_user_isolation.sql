-- Migration: User Data Isolation
-- Adds user ownership to tables and updates RLS policies for data isolation
-- Each authenticated user can only access their own data

-- ========================
--  ADD USER OWNERSHIP COLUMNS
-- ========================

-- Add user_id to farmers table
ALTER TABLE farmers ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- Add user_id to products table (makes products user-specific)
ALTER TABLE products ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- Update purchases to use user_id directly (currently uses created_by which is profiles.id)
ALTER TABLE purchases ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- Update crop_sales to use user_id directly
ALTER TABLE crop_sales ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- Transactions already link to farmers, so user_id will be inherited via farmers.user_id

-- ========================
--  UPDATE RLS POLICIES FOR FARMERS
-- ========================

DROP POLICY IF EXISTS "Authenticated users can view farmers" ON farmers;
DROP POLICY IF EXISTS "Managers and admins can insert farmers" ON farmers;
DROP POLICY IF EXISTS "Managers and admins can update farmers" ON farmers;
DROP POLICY IF EXISTS "Admins can delete farmers" ON farmers;

-- Read policy: Users can view their own farmers or all if admin/manager (but let's keep it strict for now)
CREATE POLICY "Users can view own farmers"
  ON farmers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.role_name IN ('admin', 'manager')
    )
  ));

-- Insert policy: Users can create their own farmers (clerk role and above)
CREATE POLICY "Staff can insert own farmers"
  ON farmers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.role_name IN ('admin', 'manager', 'clerk')
    )
  ));

-- Update policy: Users can update their own farmers or all if admin/manager
CREATE POLICY "Users can update farmers"
  ON farmers FOR UPDATE
  TO authenticated
  USING ((user_id = auth.uid()) OR (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.role_name IN ('admin', 'manager')
    )
  ));

-- Delete policy: Users can delete their own farmers, admins can delete any
CREATE POLICY "Users can delete farmers"
  ON farmers FOR DELETE
  TO authenticated
  USING ((user_id = auth.uid()) OR (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.role_name = 'admin'
    )
  ));

-- ========================
--  UPDATE RLS POLICIES FOR PRODUCTS
-- ========================

DROP POLICY IF EXISTS "Authenticated users can view products" ON products;
DROP POLICY IF EXISTS "Managers and admins can manage products" ON products;

CREATE POLICY "Users can view own products"
  ON products FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.role_name IN ('admin', 'manager')
    )
  ));

CREATE POLICY "Users can manage products"
  ON products FOR ALL
  TO authenticated
  USING ((user_id = auth.uid()) OR (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.role_name IN ('admin', 'manager')
    )
  ));

-- ========================
--  UPDATE RLS POLICIES FOR PURCHASES
-- ========================

DROP POLICY IF EXISTS "Authenticated users can view purchases" ON purchases;
DROP POLICY IF EXISTS "Staff can insert purchases" ON purchases;
DROP POLICY IF EXISTS "Staff can update purchases" ON purchases;
DROP POLICY IF EXISTS "Admins can delete purchases" ON purchases;

CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.role_name IN ('admin', 'manager')
    )
  ));

CREATE POLICY "Staff can insert own purchases"
  ON purchases FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.role_name IN ('admin', 'manager', 'clerk')
    )
  ));

CREATE POLICY "Staff can update purchases"
  ON purchases FOR UPDATE
  TO authenticated
  USING ((user_id = auth.uid()) OR (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.role_name IN ('admin', 'manager')
    )
  ));

CREATE POLICY "Admins can delete purchases"
  ON purchases FOR DELETE
  TO authenticated
  USING ((user_id = auth.uid()) OR (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.role_name = 'admin'
    )
  ));

-- ========================
--  UPDATE RLS POLICIES FOR PURCHASE ITEMS
-- ========================

-- Purchase items inherit permissions through purchases table
DROP POLICY IF EXISTS "Authenticated users can view purchase items" ON purchase_items;
DROP POLICY IF EXISTS "Staff can manage purchase items" ON purchase_items;

CREATE POLICY "Users can view own purchase items via purchases"
  ON purchase_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM purchases p
      WHERE p.id = purchase_items.purchase_id AND
      (p.user_id = auth.uid() OR (
        EXISTS (
          SELECT 1 FROM profiles prof
          JOIN roles r ON prof.role_id = r.id
          WHERE prof.id = auth.uid() AND r.role_name IN ('admin', 'manager')
        )
      ))
    )
  );

CREATE POLICY "Staff can manage own purchase items"
  ON purchase_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM purchases p
      WHERE p.id = purchase_items.purchase_id AND
      (p.user_id = auth.uid() OR (
        EXISTS (
          SELECT 1 FROM profiles prof
          JOIN roles r ON prof.role_id = r.id
          WHERE prof.id = auth.uid() AND r.role_name IN ('admin', 'manager', 'clerk')
        )
      ))
    )
  );

-- ========================
--  UPDATE RLS POLICIES FOR CROP SALES
-- ========================

DROP POLICY IF EXISTS "Authenticated users can view crop sales" ON crop_sales;
DROP POLICY IF EXISTS "Staff can manage crop sales" ON crop_sales;

CREATE POLICY "Users can view own crop sales"
  ON crop_sales FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.role_name IN ('admin', 'manager')
    )
  ));

CREATE POLICY "Staff can manage crop sales"
  ON crop_sales FOR ALL
  TO authenticated
  USING ((user_id = auth.uid()) OR (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.role_name IN ('admin', 'manager', 'clerk')
    )
  ));

CREATE POLICY "Staff can insert crop sales"
  ON crop_sales FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.role_name IN ('admin', 'manager', 'clerk')
    )
  ));

-- ========================
--  UPDATE RLS POLICIES FOR TRANSACTIONS
-- ========================

DROP POLICY IF EXISTS "Authenticated users can view transactions" ON transactions;
DROP POLICY IF EXISTS "Staff can manage transactions" ON transactions;

CREATE POLICY "Users can view transactions for own farmers"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM farmers f
      WHERE f.id = transactions.farmer_id AND
      (f.user_id = auth.uid() OR (
        EXISTS (
          SELECT 1 FROM profiles p
          JOIN roles r ON p.role_id = r.id
          WHERE p.id = auth.uid() AND r.role_name IN ('admin', 'manager')
        )
      ))
    )
  );

CREATE POLICY "Staff can manage transactions for own farmers"
  ON transactions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM farmers f
      WHERE f.id = transactions.farmer_id AND
      (f.user_id = auth.uid() OR (
        EXISTS (
          SELECT 1 FROM profiles p
          JOIN roles r ON p.role_id = r.id
          WHERE p.id = auth.uid() AND r.role_name IN ('admin', 'manager', 'clerk')
        )
      ))
    )
  );

-- ========================
--  UPDATE FARMER BALANCES VIEW
-- ========================

-- No changes needed to the view itself, as it filters through farmers table
-- But ensure it respects RLS

-- ========================
--  UPDATE COMMISSION POLICIES
-- ========================

DROP POLICY IF EXISTS "Authenticated users can view commissions" ON commissions;
DROP POLICY IF EXISTS "Staff can manage commissions" ON commissions;

-- Commissions are linked to crop_sales, inherit permissions there
CREATE POLICY "Users can view commissions through crop sales"
  ON commissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM crop_sales cs
      WHERE cs.id = commissions.sale_id AND
      (cs.user_id = auth.uid() OR (
        EXISTS (
          SELECT 1 FROM profiles p
          JOIN roles r ON p.role_id = r.id
          WHERE p.id = auth.uid() AND r.role_name IN ('admin', 'manager')
        )
      ))
    )
  );

CREATE POLICY "Staff can manage commissions through crop sales"
  ON commissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM crop_sales cs
      WHERE cs.id = commissions.sale_id AND
      (cs.user_id = auth.uid() OR (
        EXISTS (
          SELECT 1 FROM profiles p
          JOIN roles r ON p.role_id = r.id
          WHERE p.id = auth.uid() AND r.role_name IN ('admin', 'manager', 'clerk')
        )
      ))
    )
  );

-- ========================
--  DATA MIGRATION FOR EXISTING RECORDS
-- ========================

-- Note: Existing records will have NULL user_id
-- You need to assign them to specific users manually or via script
-- Example: Assign all existing data to a system admin user (replace with actual UUID)
-- UPDATE farmers SET user_id = 'your-admin-user-uuid' WHERE user_id IS NULL;
-- UPDATE products SET user_id = 'your-admin-user-uuid' WHERE user_id IS NULL;
-- UPDATE purchases SET user_id = created_by WHERE user_id IS NULL;
-- UPDATE crop_sales SET user_id = created_by WHERE user_id IS NULL;

-- Make user_id NOT NULL after migration
-- ALTER TABLE farmers ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE products ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE purchases ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE crop_sales ALTER COLUMN user_id SET NOT NULL;
