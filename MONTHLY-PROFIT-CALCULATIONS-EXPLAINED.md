# Monthly Profit Calculations - How They Work

## 📊 Overview

The reports page shows several monthly profit metrics. Here's how each one is calculated and what to verify:

---

## 1️⃣ **Monthly Net Profit** (for each month)

**Formula:**
```
Net Profit = Revenue - Expenses
```

**Where it's calculated:**
- SQL Function: `get_monthly_pl()` in `functions.sql` (line 235)
- For each month, sums all income transactions minus all expense transactions

**What to check:**
- Each month's net profit should equal that month's total income minus total expenses
- Run `VERIFY-MONTHLY-CALCULATIONS.sql` to see month-by-month breakdown

---

## 2️⃣ **Average Monthly Revenue**

**Formula:**
```
Avg Monthly Revenue = Total Revenue ÷ Number of Months
```

**Where it's calculated:**
- API Route: `/api/reports/financials/route.ts` (lines 124-126)
- Sums all monthly revenues, then divides by count of months

**Example:**
- Oct 2025: $1,500
- Nov 2025: $2,000
- Dec 2025: $1,000
- **Total:** $4,500 ÷ 3 months = **$1,500 average**

**What to check:**
- Should be the sum of all monthly revenues divided by the number of months with data
- If you only have 1 month of data, the average = that month's revenue

---

## 3️⃣ **Average Monthly Expenses**

**Formula:**
```
Avg Monthly Expenses = Total Expenses ÷ Number of Months
```

**Where it's calculated:**
- API Route: `/api/reports/financials/route.ts` (lines 128-130)
- Sums all monthly expenses, then divides by count of months

**Example:**
- Oct 2025: $500
- Nov 2025: $1,200
- Dec 2025: $800
- **Total:** $2,500 ÷ 3 months = **$833.33 average**

---

## 4️⃣ **Average Monthly Profit**

**Formula:**
```
Avg Monthly Profit = Total Profit ÷ Number of Months
```

**Where it's calculated:**
- API Route: `/api/reports/financials/route.ts` (lines 132-134)
- Calculates: (Total Revenue - Total Expenses) ÷ Number of Months

**Example:**
- Oct 2025 profit: $1,000
- Nov 2025 profit: $800
- Dec 2025 profit: $200
- **Total:** $2,000 ÷ 3 months = **$666.67 average**

**Note:** This is equivalent to:
```
Avg Monthly Profit = Avg Monthly Revenue - Avg Monthly Expenses
```

---

## 5️⃣ **Best Month** 🏆

**How it's determined:**
- All months are sorted by net profit (highest to lowest)
- The month with the **highest net profit** = Best Month

**Where it's calculated:**
- API Route: `/api/reports/financials/route.ts` (lines 137-141)

**Example:**
- Oct 2025: $1,000 profit
- Nov 2025: **$1,500 profit** ← **BEST**
- Dec 2025: $500 profit

---

## 6️⃣ **Worst Month** 📉

**How it's determined:**
- All months are sorted by net profit (highest to lowest)
- The month with the **lowest net profit** = Worst Month

**Where it's calculated:**
- API Route: `/api/reports/financials/route.ts` (lines 137-142)

**Example:**
- Oct 2025: $1,000 profit
- Nov 2025: $1,500 profit
- Dec 2025: **$200 profit** ← **WORST**

**Important Notes:**
- A month with a **negative profit (loss)** will be the worst month
- If all months are profitable, the worst month is just the least profitable
- If all months have losses, the worst month is the one with the biggest loss

---

## ✅ How to Verify Calculations

### **Step 1: Run the verification script**
```sql
-- Run this in Supabase SQL Editor
\i VERIFY-MONTHLY-CALCULATIONS.sql
```

### **Step 2: Check the results**

**Section 1 - Monthly P&L:**
- Look at the "verification" column
- Should say "✅ Correct" for each month
- If it says "❌ WRONG!", the net_profit column doesn't match revenue - expenses

**Section 2 - Summary Calculations:**
- Verify the averages make sense:
  - Avg = Total ÷ Month Count
  - Example: If Total Revenue = $10,000 and Month Count = 5, Avg = $2,000

**Section 3 - Best & Worst:**
- Check if the best month has the highest net profit
- Check if the worst month has the lowest net profit

**Section 4 - Direct Verification:**
- Compares the function output to raw transaction data
- Should match Section 1 exactly

---

## 🐛 Common Issues

### **Issue: Averages seem wrong**
**Cause:** The calculation divides by ALL months in the range, even if some months have zero transactions.

**Example:**
- Date range: Jan 2025 - Dec 2025 (12 months)
- Only Oct, Nov have data
- **Wrong calculation:** Total ÷ 12 months
- **Right calculation:** Total ÷ 2 months (only months with data)

**Fix:** The code currently uses `monthlyPL.length` which only counts months that are returned by the function. This is correct UNLESS the SQL function returns months with zero transactions.

### **Issue: Best/Worst month shows null**
**Cause:** No monthly data exists in the date range.

**Fix:** Create some transactions with valid `transaction_date` values.

### **Issue: Net profit doesn't match revenue - expenses**
**Cause:** The `net_profit` calculation in the `get_monthly_pl()` function is incorrect.

**Fix:** Check line 235 in `functions.sql` - it should be `(ms.revenue - ms.expenses) as net_profit`

---

## 📝 Summary

| Metric | Calculation | Location |
|--------|-------------|----------|
| Monthly Net Profit | Revenue - Expenses (per month) | `functions.sql` line 235 |
| Avg Monthly Revenue | Sum(Revenue) ÷ Month Count | `route.ts` lines 124-126 |
| Avg Monthly Expenses | Sum(Expenses) ÷ Month Count | `route.ts` lines 128-130 |
| Avg Monthly Profit | Sum(Profit) ÷ Month Count | `route.ts` lines 132-134 |
| Best Month | Month with highest net profit | `route.ts` lines 137-141 |
| Worst Month | Month with lowest net profit | `route.ts` lines 137-142 |

---

## 🎯 Quick Test

Run this to see if your data is correct:
```bash
# In Supabase SQL Editor
SELECT * FROM VERIFY-MONTHLY-CALCULATIONS.sql
```

Then compare with your reports page to ensure they match!

