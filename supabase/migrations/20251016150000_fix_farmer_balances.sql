-- Migration: Fix farmer_balances view to work with user isolation
-- Updates the view to only include balances for farmers owned by each user

-- Drop the existing view
DROP VIEW IF EXISTS farmer_balances;

-- Recreate the view with user_id filtering
CREATE OR REPLACE VIEW farmer_balances AS
SELECT
  f.id AS farmer_id,
  f.name AS farmer_name,
  f.user_id AS user_id,
  COALESCE(SUM(CASE WHEN t.type = 'Debit' THEN t.amount ELSE 0 END), 0) AS total_debit,
  COALESCE(SUM(CASE WHEN t.type = 'Credit' THEN t.amount ELSE 0 END), 0) AS total_credit,
  COALESCE(SUM(CASE WHEN t.type = 'Credit' THEN t.amount ELSE 0 END), 0)
  - COALESCE(SUM(CASE WHEN t.type = 'Debit' THEN t.amount ELSE 0 END), 0)
  AS balance
FROM farmers f
LEFT JOIN transactions t ON f.id = t.farmer_id
WHERE f.user_id = auth.uid() OR (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.role_name IN ('admin', 'manager')
  )
)
GROUP BY f.id, f.name, f.user_id;
