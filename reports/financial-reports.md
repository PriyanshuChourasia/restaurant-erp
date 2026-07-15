# Financial & Accounting Reports

## Data Sources
- `ledger_accounts` — name, description, openingBalance, currentBalance, financialYear, isActive
- `ledger_entries` — accountId, entryDate, type (credit/debit), amount, description, category (sales/purchase/expense/salary/tax/miscellaneous), reference, balanceAfter, createdBy
- `invoices` — subtotal, cgstTotal, sgstTotal, igstTotal, taxTotal, discount, grandTotal, paymentMethod, invoiceDate
- `purchases` — subtotal, discount, taxAmount, totalAmount, purchaseDate, supplierId
- `inventory` — currentStock, unitCost (for valuation)
- `organization_settings` — restaurantName, gstin, currency, taxLabel

---

## RPT-F01: Balance Sheet
**Status:** Partially Built (`GET /ledger`)

| Field | Source |
|-------|--------|
| Account Name | `ledger_accounts.name` |
| Account Description | `ledger_accounts.description` |
| Opening Balance | `ledger_accounts.openingBalance` |
| Total Credits | SUM(amount) WHERE type='credit' |
| Total Debits | SUM(amount) WHERE type='debit' |
| Current Balance | openingBalance + credits - debits |
| Financial Year | `ledger_accounts.financialYear` |

**Accounts Breakdown:**
- **Assets:** Cash, Bank, GST Input, Inventory
- **Liabilities:** GST Payable, Creditors
- **Income:** Sales Revenue
- **Expenses:** Purchase, Salary, Rent, Miscellaneous

**Visualization:** Balance sheet layout (assets = liabilities + equity)
**Filters:** Financial year
**Compliance:** Required for tax filing

**Why It Is Needed:** To verify the accounting equation (Assets = Liabilities + Equity) at any point in time. Essential for tax filing, loan applications, investor due diligence, and year-end audit. A balance sheet tells the owner whether the restaurant owns more than it owes.

**Business Area Reviewed:** Financial health and solvency. Reviews the overall capital structure — are assets funded by debt or owner's equity. Used by owner, accountant, and tax authorities.

---

## RPT-F02: Profit & Loss Statement
**Status:** Not Built

| Field | Source |
|-------|--------|
| **Revenue** | |
| Gross Sales | SUM(invoices.grandTotal WHERE status='completed') |
| Less: Discounts | SUM(invoices.discount) |
| Less: Returns/Cancel | SUM(invoices.grandTotal WHERE status='cancelled') |
| **Net Revenue** | gross_sales - discounts - returns |
| | |
| **Cost of Goods Sold (COGS)** | |
| Opening Inventory | inventory opening balance value |
| Add: Purchases | SUM(purchases.totalAmount WHERE status='received') |
| Less: Closing Inventory | SUM(inventory.currentStock * unitCost) |
| **COGS** | opening + purchases - closing |
| | |
| **Gross Profit** | net_revenue - COGS |
| Gross Margin % | gross_profit / net_revenue * 100 |
| | |
| **Operating Expenses** | |
| Salary | SUM(ledger_entries WHERE category='salary') |
| Rent | SUM(ledger_entries WHERE category='expense' AND description LIKE '%rent%') |
| Miscellaneous | SUM(ledger_entries WHERE category='miscellaneous') |
| **Total Operating Expenses** | salary + rent + misc |
| | |
| **Net Profit** | gross_profit - operating_expenses |
| Net Margin % | net_profit / net_revenue * 100 |

**Visualization:** P&L statement layout with horizontal analysis
**Filters:** Period (monthly/quarterly/yearly), comparison with prior period
**Insight:** Core profitability metrics

**Why It Is Needed:** The single most important report for understanding whether the restaurant is making or losing money. It answers: are we pricing correctly? Are costs under control? Is the business model sustainable? Banks and investors require this before funding.

**Business Area Reviewed:** Profitability and cost structure. Reviews revenue generation vs. cost of goods sold vs. operating expenses. Used by owner, accountant, and investors to measure operational effectiveness.

---

## RPT-F03: Cash Flow Statement
**Status:** Not Built

| Field | Source |
|-------|--------|
| **Operating Activities** | |
| Cash from Sales | SUM(grandTotal WHERE paymentMethod IN ('cash','upi','card')) |
| Cash Paid for Purchases | SUM(totalAmount WHERE purchase status='received') |
| Cash Paid for Expenses | SUM(ledger_entries WHERE type='debit' AND category IN ('expense','salary')) |
| **Net Operating Cash Flow** | inflows - outflows |
| | |
| **Investing Activities** | |
| Equipment Purchases | (requires asset tracking) |
| **Net Investing Cash Flow** | |
| | |
| **Financing Activities** | |
| Owner Drawings | (requires equity tracking) |
| **Net Financing Cash Flow** | |
| | |
| **Net Change in Cash** | operating + investing + financing |

**Visualization:** Waterfall chart + summary
**Filters:** Period, payment method breakdown
**Insight:** Liquidity and cash position

**Why It Is Needed:** Profit does not equal cash. A restaurant can show profit on paper but run out of cash to pay suppliers or salaries. This report tracks actual cash movement — critical for survival. It answers: do we have enough cash to pay bills next month? Restaurants fail due to cash flow issues more than lack of profitability.

**Business Area Reviewed:** Liquidity and working capital management. Reviews how cash moves through operations, investments, and financing. Used by owner and manager to ensure the business can meet short-term obligations.

---

## RPT-F04: GST Return Report (GSTR-1 / GSTR-3B)
**Status:** Partially Built (`GET /sales/reports/gst`)

| Field | Source |
|-------|--------|
| **Outward Supplies (Sales)** | |
| B2B Invoices (with GSTIN) | Invoices WHERE customerGstin IS NOT NULL |
| B2C Invoices (without GSTIN) | Invoices WHERE customerGstin IS NULL |
| Invoice-wise GST Breakdown | Per invoice: taxable value, CGST, SGST, IGST |
| **GST Rate-wise Summary** | |
| 0% | Taxable value + tax for rate=0 |
| 5% | Taxable value + tax for rate=5 |
| 12% | Taxable value + tax for rate=12 |
| 18% | Taxable value + tax for rate=18 |
| 28% | Taxable value + tax for rate=28 |
| **Input Tax Credit** | |
| GST on Purchases | SUM(purchases.taxAmount) |
| **Net GST Payable** | GST collected - ITC |

**Visualization:** GST summary tables (GSTR format)
**Filters:** Tax period (month/quarter)
**Compliance:** Required for GST filing

**Why It Is Needed:** Mandatory for tax compliance in India. Late or incorrect filing attracts penalties and notices. Enables claiming Input Tax Credit (ITC) on purchases, directly reducing tax liability. Also helps the business track how much tax is being collected vs. paid.

**Business Area Reviewed:** Tax compliance and statutory obligations. Reviews outward supplies (sales tax), inward supplies (purchase tax), and net tax payable. Used by accountant, CA, and owner for monthly/quarterly GST filing.

---

## RPT-F05: Expense Report
**Status:** Not Built

| Field | Source |
|-------|--------|
| Expense Category | `ledger_entries.category` (salary/expense/tax/miscellaneous) |
| Description | `ledger_entries.description` |
| Amount | `ledger_entries.amount` WHERE type='debit' |
| Date | `ledger_entries.entryDate` |
| % of Total Expenses | category_amount / total_expenses * 100 |
| Trend | Monthly expense by category |
| Top 10 Expenses | Largest individual entries |

**Visualization:** Stacked area chart + category breakdown + table
**Filters:** Date range, category, minimum amount
**Insight:** Cost control and expense management

**Why It Is Needed:** Restaurants have razor-thin margins — every rupee of expense matters. This report surfaces where money is going: Are staff costs too high? Is electricity spiking? Are there fraudulent or duplicate payments? It answers: which expenses are growing and why?

**Business Area Reviewed:** Operating cost structure and spend discipline. Reviews all non-COGS expenses (rent, salary, utilities, maintenance, marketing). Used by owner and manager to identify cost-saving opportunities and control expense creep.

---

## RPT-F06: Revenue vs Expense Comparison
**Status:** Not Built

| Field | Source |
|-------|--------|
| Period | Month or week |
| Total Revenue | SUM(invoices.grandTotal) |
| Total Expenses | SUM(ledger_entries WHERE type='debit') |
| Net Income | revenue - expenses |
| Revenue Trend | Monthly revenue line |
| Expense Trend | Monthly expense line |
| Break-even Point | When revenue > expenses consistently |

**Visualization:** Dual-axis line chart (revenue vs expenses) + gap highlighting
**Filters:** Date range, granularity
**Insight:** Financial health trajectory

**Why It Is Needed:** A quick visual check of financial direction. If expenses are rising faster than revenue, the restaurant is heading toward losses even if currently profitable. Answers: Is the gap between revenue and expenses growing or shrinking?

**Business Area Reviewed:** Financial trajectory and sustainability. Reviews the trend relationship between top-line revenue and total costs. Used by owner to spot trouble early and make course corrections.

---

## RPT-F07: Tax Summary Report
**Status:** Not Built

| Field | Source |
|-------|--------|
| **GST Collected** | |
| CGST Collected | SUM(cgstTotal on invoices) |
| SGST Collected | SUM(sgstTotal on invoices) |
| IGST Collected | SUM(igstTotal on invoices) |
| **GST Paid (ITC)** | |
| CGST Input | SUM on purchases |
| SGST Input | SUM on purchases |
| IGST Input | SUM on purchases |
| **Net GST Liability** | collected - input |
| **TDS** | (requires new ledger category) |

**Visualization:** Summary cards + waterfall
**Filters:** Tax period (monthly/quarterly)
**Compliance:** Tax payment planning

**Why It Is Needed:** Ensures the restaurant sets aside the right amount for tax payments. Avoids cash crunch at tax filing time. Also helps in reconciling GSTR-2A (vendor data) with purchase records to claim maximum ITC.

**Business Area Reviewed:** Tax liability management and cash planning. Reviews total tax collected from customers vs. tax paid on purchases. Used by accountant to plan tax payments and maximize input tax credit.

---

## RPT-F08: Ledger Account Statement
**Status:** Not Built

| Field | Source |
|-------|--------|
| Account | `ledger_accounts.name` |
| Opening Balance | `ledger_accounts.openingBalance` |
| Date | `ledger_entries.entryDate` |
| Type | Credit / Debit |
| Amount | `ledger_entries.amount` |
| Description | `ledger_entries.description` |
| Reference | `ledger_entries.reference` |
| Running Balance | `ledger_entries.balanceAfter` |

**Visualization:** Statement-style table (like bank statement)
**Filters:** Account, date range
**Drill-down:** Click reference to see source transaction

**Why It Is Needed:** Provides a complete audit trail for any account — cash, bank, supplier, customer, expense. Essential for dispute resolution, audit verification, and understanding how a specific account balance was arrived at. Like a bank statement but for any ledger.

**Business Area Reviewed:** Account-level transaction audit and reconciliation. Reviews all debits and credits affecting a single account. Used by accountant and auditor for verification, reconciliation, and dispute resolution.

---

## Backend Implementation Notes

### Ledger Categories (from entity)
```
sales         — Revenue from invoices
purchase      — Cost of purchases
expense       — Operating expenses
salary        — Employee salaries
tax           — Tax payments
miscellaneous — Other entries
```

### New Endpoints Needed
```typescript
@Get('finance/balance-sheet')           // RPT-F01 (enhance existing)
@Get('finance/profit-loss')             // RPT-F02
@Get('finance/cash-flow')              // RPT-F03
@Get('finance/gst-return')             // RPT-F04 (enhance existing)
@Get('finance/expenses')               // RPT-F05
@Get('finance/revenue-vs-expense')     // RPT-F06
@Get('finance/tax-summary')            // RPT-F07
@Get('finance/ledger-statement')       // RPT-F08
```

### Accounting Equation
```
Assets = Liabilities + Equity
Net Income = Revenue - Expenses
Cash Flow = Inflows - Outflows
```
