-- =====================================================
-- Asset Tracer - PostgreSQL Functions for Financial Analytics
-- =====================================================
-- Run this script in Supabase SQL Editor
-- These functions provide financial data aggregation and reporting
-- =====================================================

-- =====================================================
-- Function 1: Get Asset Financials
-- =====================================================
-- Returns financial summary for each asset including ROI calculations
-- Usage: SELECT * FROM get_asset_financials('org-uuid');

CREATE OR REPLACE FUNCTION get_asset_financials(org_id uuid)
RETURNS TABLE (
    asset_id uuid,
    asset_name text,
    asset_category text,
    asset_status text,
    purchase_cost numeric,
    current_value numeric,
    total_spend numeric,
    total_revenue numeric,
    profit_loss numeric,
    roi_percentage numeric,
    maintenance_cost numeric,
    operating_cost numeric,
    transaction_count bigint,
    last_transaction_date date,
    currency text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH asset_expenses AS (
        -- Calculate total expenses per asset from transactions
        SELECT 
            t.asset_id,
            COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expenses,
            COALESCE(SUM(CASE WHEN t.type = 'expense' AND t.category IN ('maintenance', 'repair') THEN t.amount ELSE 0 END), 0) as maintenance,
            COALESCE(SUM(CASE WHEN t.type = 'expense' AND t.category NOT IN ('maintenance', 'repair', 'purchase') THEN t.amount ELSE 0 END), 0) as operating,
            COUNT(*) as tx_count,
            MAX(t.transaction_date) as last_tx_date,
            t.currency
        FROM transactions t
        WHERE t.organization_id = org_id
            AND t.asset_id IS NOT NULL
        GROUP BY t.asset_id, t.currency
    ),
    asset_revenue AS (
        -- Calculate total revenue per asset from transactions
        SELECT 
            t.asset_id,
            COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income
        FROM transactions t
        WHERE t.organization_id = org_id
            AND t.asset_id IS NOT NULL
        GROUP BY t.asset_id
    ),
    asset_data AS (
        -- Combine asset base data with financial calculations
        SELECT 
            a.id as asset_id,
            a.name as asset_name,
            a.category as asset_category,
            a.status as asset_status,
            COALESCE(a.purchase_cost, 0) as purchase_cost,
            COALESCE(a.current_value, 0) as current_value,
            COALESCE(ae.total_expenses, 0) + COALESCE(a.purchase_cost, 0) as total_spend,
            COALESCE(ar.total_income, 0) as total_revenue,
            COALESCE(ae.maintenance, 0) as maintenance_cost,
            COALESCE(ae.operating, 0) as operating_cost,
            COALESCE(ae.tx_count, 0) as transaction_count,
            ae.last_tx_date,
            COALESCE(ae.currency, 'USD') as currency
        FROM assets a
        LEFT JOIN asset_expenses ae ON a.id = ae.asset_id
        LEFT JOIN asset_revenue ar ON a.id = ar.asset_id
        WHERE a.organization_id = org_id
    )
    SELECT 
        ad.asset_id,
        ad.asset_name,
        ad.asset_category,
        ad.asset_status,
        ad.purchase_cost,
        ad.current_value,
        ad.total_spend,
        ad.total_revenue,
        (ad.total_revenue - ad.total_spend) as profit_loss,
        -- Calculate ROI percentage: ((revenue - spend) / spend) * 100
        CASE 
            WHEN ad.total_spend > 0 THEN 
                ROUND(((ad.total_revenue - ad.total_spend) / ad.total_spend * 100)::numeric, 2)
            ELSE 0
        END as roi_percentage,
        ad.maintenance_cost,
        ad.operating_cost,
        ad.transaction_count,
        ad.last_tx_date,
        ad.currency
    FROM asset_data ad
    ORDER BY ad.asset_name;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_asset_financials(uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_asset_financials(uuid) IS 
'Returns financial summary for all assets in an organization including ROI calculations';

-- =====================================================
-- Function 2: Get Monthly Profit & Loss
-- =====================================================
-- Returns monthly P&L summary for a date range
-- Usage: SELECT * FROM get_monthly_pl('org-uuid', '2024-01-01', '2024-12-31');

CREATE OR REPLACE FUNCTION get_monthly_pl(
    org_id uuid,
    start_date date,
    end_date date
)
RETURNS TABLE (
    month text,
    month_start date,
    month_end date,
    total_revenue numeric,
    total_expenses numeric,
    net_profit numeric,
    revenue_count bigint,
    expense_count bigint,
    transaction_count bigint,
    top_revenue_category text,
    top_expense_category text,
    asset_purchases numeric,
    asset_sales numeric,
    invoices_paid numeric,
    invoices_paid_count bigint,
    currency text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH monthly_transactions AS (
        -- Group transactions by month
        SELECT 
            DATE_TRUNC('month', t.transaction_date)::date as month_date,
            TO_CHAR(t.transaction_date, 'YYYY-MM') as month_key,
            t.type,
            t.category,
            t.amount,
            t.currency,
            t.asset_id,
            t.invoice_id
        FROM transactions t
        WHERE t.organization_id = org_id
            AND t.transaction_date >= start_date
            AND t.transaction_date <= end_date
    ),
    monthly_summary AS (
        -- Calculate monthly totals
        SELECT 
            mt.month_key,
            mt.month_date,
            (mt.month_date + INTERVAL '1 month' - INTERVAL '1 day')::date as month_end_date,
            -- Revenue
            COALESCE(SUM(CASE WHEN mt.type = 'income' THEN mt.amount ELSE 0 END), 0) as revenue,
            COUNT(CASE WHEN mt.type = 'income' THEN 1 END) as revenue_tx_count,
            -- Expenses
            COALESCE(SUM(CASE WHEN mt.type = 'expense' THEN mt.amount ELSE 0 END), 0) as expenses,
            COUNT(CASE WHEN mt.type = 'expense' THEN 1 END) as expense_tx_count,
            -- Total transactions
            COUNT(*) as total_tx_count,
            -- Asset-related
            COALESCE(SUM(CASE WHEN mt.type = 'expense' AND mt.category = 'purchase' THEN mt.amount ELSE 0 END), 0) as asset_purchase_total,
            COALESCE(SUM(CASE WHEN mt.type = 'income' AND mt.category = 'sales' AND mt.asset_id IS NOT NULL THEN mt.amount ELSE 0 END), 0) as asset_sales_total,
            -- Currency
            COALESCE(mt.currency, 'USD') as curr
        FROM monthly_transactions mt
        GROUP BY mt.month_key, mt.month_date, mt.currency
    ),
    top_categories AS (
        -- Get top revenue and expense categories per month
        SELECT DISTINCT ON (mt.month_key)
            mt.month_key,
            -- Top revenue category
            (
                SELECT mt2.category
                FROM monthly_transactions mt2
                WHERE mt2.month_key = mt.month_key
                    AND mt2.type = 'income'
                GROUP BY mt2.category
                ORDER BY SUM(mt2.amount) DESC
                LIMIT 1
            ) as top_rev_cat,
            -- Top expense category
            (
                SELECT mt2.category
                FROM monthly_transactions mt2
                WHERE mt2.month_key = mt.month_key
                    AND mt2.type = 'expense'
                GROUP BY mt2.category
                ORDER BY SUM(mt2.amount) DESC
                LIMIT 1
            ) as top_exp_cat
        FROM monthly_transactions mt
    ),
    invoice_payments AS (
        -- Calculate invoice payments per month
        SELECT 
            TO_CHAR(i.payment_date, 'YYYY-MM') as month_key,
            COALESCE(SUM(i.paid_amount), 0) as invoices_paid_amount,
            COUNT(*) as invoices_paid_cnt
        FROM invoices i
        WHERE i.organization_id = org_id
            AND i.payment_date >= start_date
            AND i.payment_date <= end_date
            AND i.status = 'paid'
        GROUP BY TO_CHAR(i.payment_date, 'YYYY-MM')
    )
    SELECT 
        ms.month_key as month,
        ms.month_date as month_start,
        ms.month_end_date as month_end,
        ms.revenue as total_revenue,
        ms.expenses as total_expenses,
        (ms.revenue - ms.expenses) as net_profit,
        ms.revenue_tx_count as revenue_count,
        ms.expense_tx_count as expense_count,
        ms.total_tx_count as transaction_count,
        COALESCE(tc.top_rev_cat, 'N/A') as top_revenue_category,
        COALESCE(tc.top_exp_cat, 'N/A') as top_expense_category,
        ms.asset_purchase_total as asset_purchases,
        ms.asset_sales_total as asset_sales,
        COALESCE(ip.invoices_paid_amount, 0) as invoices_paid,
        COALESCE(ip.invoices_paid_cnt, 0) as invoices_paid_count,
        ms.curr as currency
    FROM monthly_summary ms
    LEFT JOIN top_categories tc ON ms.month_key = tc.month_key
    LEFT JOIN invoice_payments ip ON ms.month_key = ip.month_key
    ORDER BY ms.month_key;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_monthly_pl(uuid, date, date) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_monthly_pl(uuid, date, date) IS 
'Returns monthly profit and loss summary for a date range with detailed breakdowns';

-- =====================================================
-- Function 3: Get Financial Summary (Bonus)
-- =====================================================
-- Returns high-level financial overview for dashboard
-- Usage: SELECT * FROM get_financial_summary('org-uuid');

CREATE OR REPLACE FUNCTION get_financial_summary(org_id uuid)
RETURNS TABLE (
    current_month_revenue numeric,
    current_month_expenses numeric,
    current_month_profit numeric,
    previous_month_revenue numeric,
    previous_month_expenses numeric,
    previous_month_profit numeric,
    revenue_growth_percentage numeric,
    expense_growth_percentage numeric,
    profit_growth_percentage numeric,
    ytd_revenue numeric,
    ytd_expenses numeric,
    ytd_profit numeric,
    total_assets_value numeric,
    total_assets_count bigint,
    total_invoices_outstanding numeric,
    total_invoices_overdue numeric,
    currency text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_month_start date := DATE_TRUNC('month', CURRENT_DATE)::date;
    previous_month_start date := (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month')::date;
    ytd_start date := DATE_TRUNC('year', CURRENT_DATE)::date;
BEGIN
    RETURN QUERY
    WITH current_month AS (
        SELECT 
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as revenue,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses
        FROM transactions
        WHERE organization_id = org_id
            AND transaction_date >= current_month_start
    ),
    previous_month AS (
        SELECT 
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as revenue,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses
        FROM transactions
        WHERE organization_id = org_id
            AND transaction_date >= previous_month_start
            AND transaction_date < current_month_start
    ),
    ytd_data AS (
        SELECT 
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as revenue,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses
        FROM transactions
        WHERE organization_id = org_id
            AND transaction_date >= ytd_start
    ),
    assets_summary AS (
        SELECT 
            COALESCE(SUM(current_value), 0) as total_value,
            COUNT(*) as total_count
        FROM assets
        WHERE organization_id = org_id
    ),
    invoices_summary AS (
        SELECT 
            COALESCE(SUM(CASE WHEN status != 'paid' THEN balance ELSE 0 END), 0) as outstanding,
            COALESCE(SUM(CASE WHEN status = 'overdue' THEN balance ELSE 0 END), 0) as overdue
        FROM invoices
        WHERE organization_id = org_id
    )
    SELECT 
        cm.revenue as current_month_revenue,
        cm.expenses as current_month_expenses,
        (cm.revenue - cm.expenses) as current_month_profit,
        pm.revenue as previous_month_revenue,
        pm.expenses as previous_month_expenses,
        (pm.revenue - pm.expenses) as previous_month_profit,
        -- Growth percentages
        CASE WHEN pm.revenue > 0 THEN ROUND((((cm.revenue - pm.revenue) / pm.revenue) * 100)::numeric, 2) ELSE 0 END as revenue_growth_percentage,
        CASE WHEN pm.expenses > 0 THEN ROUND((((cm.expenses - pm.expenses) / pm.expenses) * 100)::numeric, 2) ELSE 0 END as expense_growth_percentage,
        CASE WHEN (pm.revenue - pm.expenses) > 0 THEN 
            ROUND(((((cm.revenue - cm.expenses) - (pm.revenue - pm.expenses)) / (pm.revenue - pm.expenses)) * 100)::numeric, 2) 
        ELSE 0 END as profit_growth_percentage,
        ytd.revenue as ytd_revenue,
        ytd.expenses as ytd_expenses,
        (ytd.revenue - ytd.expenses) as ytd_profit,
        ast.total_value as total_assets_value,
        ast.total_count as total_assets_count,
        inv.outstanding as total_invoices_outstanding,
        inv.overdue as total_invoices_overdue,
        'USD' as currency
    FROM current_month cm, previous_month pm, ytd_data ytd, assets_summary ast, invoices_summary inv;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_financial_summary(uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_financial_summary(uuid) IS 
'Returns high-level financial summary for dashboard including growth metrics';

-- =====================================================
-- Function 4: Get Asset ROI Rankings (Bonus)
-- =====================================================
-- Returns assets ranked by ROI performance
-- Usage: SELECT * FROM get_asset_roi_rankings('org-uuid', 10);

CREATE OR REPLACE FUNCTION get_asset_roi_rankings(
    org_id uuid,
    limit_count integer DEFAULT 10
)
RETURNS TABLE (
    rank integer,
    asset_id uuid,
    asset_name text,
    asset_category text,
    roi_percentage numeric,
    profit_loss numeric,
    total_revenue numeric,
    total_spend numeric,
    performance_indicator text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH ranked_assets AS (
        SELECT 
            ROW_NUMBER() OVER (ORDER BY gaf.roi_percentage DESC) as rank_num,
            gaf.asset_id,
            gaf.asset_name,
            gaf.asset_category,
            gaf.roi_percentage,
            gaf.profit_loss,
            gaf.total_revenue,
            gaf.total_spend,
            CASE 
                WHEN gaf.roi_percentage >= 50 THEN 'Excellent'
                WHEN gaf.roi_percentage >= 20 THEN 'Good'
                WHEN gaf.roi_percentage >= 0 THEN 'Fair'
                ELSE 'Poor'
            END as perf_indicator
        FROM get_asset_financials(org_id) gaf
        WHERE gaf.total_spend > 0  -- Only include assets with spending
    )
    SELECT 
        ra.rank_num::integer,
        ra.asset_id,
        ra.asset_name,
        ra.asset_category,
        ra.roi_percentage,
        ra.profit_loss,
        ra.total_revenue,
        ra.total_spend,
        ra.perf_indicator
    FROM ranked_assets ra
    LIMIT limit_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_asset_roi_rankings(uuid, integer) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_asset_roi_rankings(uuid, integer) IS 
'Returns top performing assets ranked by ROI percentage';

-- =====================================================
-- Example Usage Queries
-- =====================================================

-- Example 1: Get asset financials for an organization
-- SELECT * FROM get_asset_financials('your-org-uuid');

-- Example 2: Get monthly P&L for current year
-- SELECT * FROM get_monthly_pl('your-org-uuid', '2024-01-01', '2024-12-31');

-- Example 3: Get financial summary for dashboard
-- SELECT * FROM get_financial_summary('your-org-uuid');

-- Example 4: Get top 10 assets by ROI
-- SELECT * FROM get_asset_roi_rankings('your-org-uuid', 10);

-- Example 5: Get monthly P&L for last 6 months
-- SELECT * FROM get_monthly_pl(
--     'your-org-uuid',
--     (CURRENT_DATE - INTERVAL '6 months')::date,
--     CURRENT_DATE
-- );

-- Example 6: Get asset financials with filtering in application
-- SELECT * FROM get_asset_financials('your-org-uuid')
-- WHERE roi_percentage > 20
-- ORDER BY profit_loss DESC;

-- =====================================================
-- Performance Indexes (Recommended)
-- =====================================================
-- Run these to optimize function performance

-- Index on transactions for financial queries
CREATE INDEX IF NOT EXISTS idx_transactions_org_date 
    ON transactions(organization_id, transaction_date);

CREATE INDEX IF NOT EXISTS idx_transactions_asset_type 
    ON transactions(asset_id, type) WHERE asset_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_org_type_date 
    ON transactions(organization_id, type, transaction_date);

-- Index on invoices for payment tracking
CREATE INDEX IF NOT EXISTS idx_invoices_org_payment_date 
    ON invoices(organization_id, payment_date) WHERE payment_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_org_status 
    ON invoices(organization_id, status);

-- Index on assets for financial lookups
CREATE INDEX IF NOT EXISTS idx_assets_org_status 
    ON assets(organization_id, status);

-- =====================================================
-- Security Policies (Optional - already created by CLEAN-AND-CREATE.sql)
-- =====================================================
-- Note: These policies are already created if you ran CLEAN-AND-CREATE.sql
-- Uncomment only if you need to recreate them

/*
-- Enable RLS on transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their organization's transactions
DROP POLICY IF EXISTS transactions_org_policy ON transactions;
CREATE POLICY transactions_org_policy ON transactions
    FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- Enable RLS on assets
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their organization's assets
DROP POLICY IF EXISTS assets_org_policy ON assets;
CREATE POLICY assets_org_policy ON assets
    FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- Enable RLS on invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their organization's invoices
DROP POLICY IF EXISTS invoices_org_policy ON invoices;
CREATE POLICY invoices_org_policy ON invoices
    FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));
*/

-- =====================================================
-- Testing Queries
-- =====================================================

-- Test 1: Verify functions exist
-- SELECT routine_name, routine_type 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
--     AND routine_name LIKE 'get_%'
-- ORDER BY routine_name;

-- Test 2: Check permissions
-- SELECT routine_name, grantee, privilege_type
-- FROM information_schema.routine_privileges
-- WHERE routine_schema = 'public'
--     AND routine_name LIKE 'get_%'
-- ORDER BY routine_name, grantee;

-- =====================================================
-- Cleanup (if needed)
-- =====================================================
-- Uncomment to drop functions

-- DROP FUNCTION IF EXISTS get_asset_financials(uuid);
-- DROP FUNCTION IF EXISTS get_monthly_pl(uuid, date, date);
-- DROP FUNCTION IF EXISTS get_financial_summary(uuid);
-- DROP FUNCTION IF EXISTS get_asset_roi_rankings(uuid, integer);

-- =====================================================
-- End of Script
-- =====================================================

