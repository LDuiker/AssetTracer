# Financial Types Documentation

Comprehensive type definitions for financial tracking, transactions, expenses, and reporting.

## Core Types

### Transaction
Represents any financial transaction (income, expense, transfer, or adjustment).

```typescript
interface Transaction {
  id: string;
  organization_id: string;
  type: TransactionType;                    // 'income' | 'expense' | 'transfer' | 'adjustment'
  category: IncomeCategory | ExpenseCategory;
  amount: number;
  currency: string;
  date: string;                             // ISO date
  description: string;
  reference_number: string | null;
  payment_method: PaymentMethod | null;
  
  // Related entities (optional)
  asset_id: string | null;                  // Link to asset
  client_id: string | null;                 // Link to client
  invoice_id: string | null;                // Link to invoice
  
  // Metadata
  notes: string | null;
  tags: string[] | null;
  receipt_url: string | null;
  
  // Audit
  created_by: string;
  created_at: string;
  updated_at: string;
}
```

**Usage**:
- Track all financial activities in one place
- Link transactions to assets, clients, or invoices
- Categorize for reporting and analysis
- Store receipts and additional documentation

### Expense
Represents a business expense with approval workflow.

```typescript
interface Expense {
  id: string;
  organization_id: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  date: string;
  vendor: string;
  description: string;
  reference_number: string | null;
  payment_method: PaymentMethod | null;
  
  // Related entities
  asset_id: string | null;
  project_id: string | null;
  
  // Tax and accounting
  is_tax_deductible: boolean;
  is_recurring: boolean;
  recurring_frequency: 'monthly' | 'quarterly' | 'yearly' | null;
  
  // Approval workflow
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  approved_by: string | null;
  approved_at: string | null;
  
  // Metadata
  notes: string | null;
  tags: string[] | null;
  receipt_url: string | null;
  
  // Audit
  created_by: string;
  created_at: string;
  updated_at: string;
}
```

**Usage**:
- Track business expenses separately
- Implement approval workflow
- Mark tax-deductible expenses
- Handle recurring expenses
- Link to assets or projects

### AssetFinancials
Aggregated financial data for a specific asset.

```typescript
interface AssetFinancials {
  asset_id: string;
  asset_name: string;
  
  // Core metrics
  total_spend: number;          // Total expenses
  total_revenue: number;        // Total income
  profit_loss: number;          // Net profit/loss
  roi_percentage: number;       // Return on investment
  
  // Optional breakdown
  purchase_cost?: number;
  maintenance_cost?: number;
  operating_cost?: number;
  depreciation?: number;
  current_value?: number;
  
  // Time period
  period_start?: string;
  period_end?: string;
  
  // Metadata
  currency: string;
  last_updated: string;
}
```

**Usage**:
- Calculate ROI per asset
- Track profitability of each asset
- Compare asset performance
- Generate asset financial reports

**Calculation Examples**:
```typescript
// ROI Percentage
roi_percentage = ((total_revenue - total_spend) / total_spend) * 100

// Example:
total_spend = $10,000
total_revenue = $15,000
roi_percentage = (($15,000 - $10,000) / $10,000) * 100 = 50%
```

### MonthlyPL
Monthly profit & loss statement.

```typescript
interface MonthlyPL {
  month: string;                  // "YYYY-MM" format
  total_revenue: number;
  total_expenses: number;
  net_profit: number;             // revenue - expenses
  
  // Optional breakdown
  revenue_by_category?: Record<IncomeCategory, number>;
  expenses_by_category?: Record<ExpenseCategory, number>;
  
  // Asset metrics
  asset_count?: number;
  asset_purchases?: number;
  asset_sales?: number;
  
  // Invoice metrics
  invoices_sent?: number;
  invoices_paid?: number;
  outstanding_balance?: number;
  
  // Metadata
  currency: string;
  transactions_count?: number;
}
```

**Usage**:
- Generate monthly financial reports
- Compare month-over-month performance
- Track revenue and expense trends
- Monitor invoice collection

**Example**:
```typescript
{
  month: "2024-10",
  total_revenue: 45000,
  total_expenses: 28000,
  net_profit: 17000,
  revenue_by_category: {
    sales: 30000,
    services: 15000,
    rental: 0,
    // ...
  },
  expenses_by_category: {
    salaries: 15000,
    rent: 5000,
    utilities: 3000,
    marketing: 5000,
    // ...
  },
  currency: "USD",
  transactions_count: 156
}
```

## Enums and Types

### TransactionType
```typescript
type TransactionType = 'income' | 'expense' | 'transfer' | 'adjustment';
```

### IncomeCategory
```typescript
type IncomeCategory =
  | 'sales'           // Product sales
  | 'services'        // Service revenue
  | 'rental'          // Rental income
  | 'investment'      // Investment returns
  | 'refund'          // Refunds received
  | 'grant'           // Grants or subsidies
  | 'other';          // Other income
```

### ExpenseCategory
```typescript
type ExpenseCategory =
  | 'purchase'              // Asset/inventory purchases
  | 'maintenance'           // Maintenance and repairs
  | 'supplies'              // Office supplies
  | 'utilities'             // Utilities (electric, water, etc.)
  | 'rent'                  // Rent payments
  | 'salaries'              // Salaries and wages
  | 'insurance'             // Insurance premiums
  | 'marketing'             // Marketing and advertising
  | 'travel'                // Travel expenses
  | 'professional_services' // Legal, accounting, consulting
  | 'taxes'                 // Taxes
  | 'depreciation'          // Depreciation
  | 'other';                // Other expenses
```

### PaymentMethod
```typescript
type PaymentMethod =
  | 'cash'
  | 'check'
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'paypal'
  | 'other';
```

## Advanced Types

### YearlyPL
Yearly profit & loss with quarterly and monthly breakdowns.

```typescript
interface YearlyPL {
  year: string;               // "YYYY" format
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  
  // Quarterly breakdown
  quarters?: {
    Q1: MonthlyPL;
    Q2: MonthlyPL;
    Q3: MonthlyPL;
    Q4: MonthlyPL;
  };
  
  // Monthly breakdown
  months?: MonthlyPL[];
  
  // Year-over-year comparison
  yoy_revenue_growth?: number;
  yoy_expense_growth?: number;
  yoy_profit_growth?: number;
  
  currency: string;
}
```

### FinancialSummary
High-level financial overview for dashboard.

```typescript
interface FinancialSummary {
  organization_id: string;
  
  current_period: {
    revenue: number;
    expenses: number;
    profit: number;
  };
  
  previous_period: {
    revenue: number;
    expenses: number;
    profit: number;
  };
  
  // Growth rates (percentage)
  revenue_growth: number;
  expense_growth: number;
  profit_growth: number;
  
  // Year-to-date
  ytd: {
    revenue: number;
    expenses: number;
    profit: number;
  };
  
  // All-time totals
  all_time: {
    total_revenue: number;
    total_expenses: number;
    total_profit: number;
  };
  
  // Assets summary
  assets: {
    total_value: number;
    total_count: number;
    total_investment: number;
  };
  
  // Invoices summary
  invoices: {
    total_outstanding: number;
    total_overdue: number;
    total_paid_this_month: number;
  };
  
  currency: string;
  last_updated: string;
}
```

### FinancialReportFilters
Filters for generating custom financial reports.

```typescript
interface FinancialReportFilters {
  date_range?: DateRangeFilter;
  asset_ids?: string[];
  client_ids?: string[];
  categories?: (IncomeCategory | ExpenseCategory)[];
  transaction_types?: TransactionType[];
  payment_methods?: PaymentMethod[];
  min_amount?: number;
  max_amount?: number;
}
```

## Usage Examples

### Creating a Transaction

```typescript
import { CreateTransactionInput } from '@/types';

const transaction: CreateTransactionInput = {
  type: 'income',
  category: 'services',
  amount: 2500.00,
  currency: 'USD',
  date: '2024-10-15',
  description: 'Web development services',
  reference_number: 'INV-202410-0001',
  payment_method: 'bank_transfer',
  client_id: 'client-uuid',
  invoice_id: 'invoice-uuid',
  asset_id: null,
  notes: 'Payment received in full',
  tags: ['web-development', 'consulting'],
  receipt_url: null,
  created_by: 'user-uuid',
};
```

### Creating an Expense

```typescript
import { CreateExpenseInput } from '@/types';

const expense: CreateExpenseInput = {
  category: 'maintenance',
  amount: 450.00,
  currency: 'USD',
  date: '2024-10-15',
  vendor: 'Tech Repair Co.',
  description: 'Laptop repair',
  reference_number: 'INV-12345',
  payment_method: 'credit_card',
  asset_id: 'asset-uuid',
  project_id: null,
  is_tax_deductible: true,
  is_recurring: false,
  recurring_frequency: null,
  status: 'pending',
  approved_by: null,
  approved_at: null,
  notes: 'Screen replacement',
  tags: ['maintenance', 'laptop'],
  receipt_url: 'https://example.com/receipt.pdf',
  created_by: 'user-uuid',
};
```

### Calculating Asset Financials

```typescript
import { AssetFinancials } from '@/types';

const calculateAssetFinancials = (
  assetId: string,
  transactions: Transaction[]
): AssetFinancials => {
  const assetTransactions = transactions.filter(t => t.asset_id === assetId);
  
  const total_revenue = assetTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const total_spend = assetTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const profit_loss = total_revenue - total_spend;
  const roi_percentage = total_spend > 0 
    ? (profit_loss / total_spend) * 100 
    : 0;
  
  return {
    asset_id: assetId,
    asset_name: 'Asset Name',
    total_spend,
    total_revenue,
    profit_loss,
    roi_percentage,
    currency: 'USD',
    last_updated: new Date().toISOString(),
  };
};
```

### Generating Monthly P&L

```typescript
import { MonthlyPL } from '@/types';

const generateMonthlyPL = (
  month: string,
  transactions: Transaction[]
): MonthlyPL => {
  const monthTransactions = transactions.filter(t => 
    t.date.startsWith(month)
  );
  
  const total_revenue = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const total_expenses = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const net_profit = total_revenue - total_expenses;
  
  return {
    month,
    total_revenue,
    total_expenses,
    net_profit,
    currency: 'USD',
    transactions_count: monthTransactions.length,
  };
};
```

## Database Schema

### transactions table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer', 'adjustment')),
  category TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  date DATE NOT NULL,
  description TEXT NOT NULL,
  reference_number TEXT,
  payment_method TEXT,
  
  -- Related entities
  asset_id UUID REFERENCES assets(id),
  client_id UUID REFERENCES clients(id),
  invoice_id UUID REFERENCES invoices(id),
  
  -- Metadata
  notes TEXT,
  tags TEXT[],
  receipt_url TEXT,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### expenses table
```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  category TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  date DATE NOT NULL,
  vendor TEXT NOT NULL,
  description TEXT NOT NULL,
  reference_number TEXT,
  payment_method TEXT,
  
  -- Related entities
  asset_id UUID REFERENCES assets(id),
  project_id UUID REFERENCES projects(id),
  
  -- Tax and accounting
  is_tax_deductible BOOLEAN DEFAULT false,
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT,
  
  -- Approval
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  
  -- Metadata
  notes TEXT,
  tags TEXT[],
  receipt_url TEXT,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Best Practices

### 1. Always Include Currency
```typescript
// Good
const transaction = { amount: 100, currency: 'USD' };

// Bad - currency missing
const transaction = { amount: 100 };
```

### 2. Use ISO Date Format
```typescript
// Good
date: '2024-10-15'
date: new Date().toISOString().split('T')[0]

// Bad
date: '10/15/2024'
date: 'October 15, 2024'
```

### 3. Link Related Entities
```typescript
// Link transaction to invoice
const transaction = {
  type: 'income',
  amount: 2500,
  invoice_id: 'invoice-uuid',
  client_id: 'client-uuid',
  // ...
};
```

### 4. Calculate Net Values
```typescript
// Always calculate net profit
const net_profit = total_revenue - total_expenses;

// Always calculate ROI
const roi_percentage = (profit_loss / total_spend) * 100;
```

### 5. Handle Edge Cases
```typescript
// Prevent division by zero
const roi_percentage = total_spend > 0 
  ? (profit_loss / total_spend) * 100 
  : 0;

// Handle null values
const tags = transaction.tags || [];
const notes = transaction.notes || '';
```

## Import Usage

```typescript
// Import specific types
import { Transaction, Expense, AssetFinancials, MonthlyPL } from '@/types';

// Import all from financial
import * as Financial from '@/types/financial';

// Import enums
import { TransactionType, ExpenseCategory, PaymentMethod } from '@/types';
```

