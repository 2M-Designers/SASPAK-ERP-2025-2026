-- ================================================================
--  GlAccounts  —  Chart of Accounts  INSERT Script
--  Source      : Chart_Of_Account.xlsx
--  Accounts    : 163
-- ================================================================
--
--  HOW TO RUN
--    1. Open in SSMS  →  select your target database
--    2. Execute  (F5)
--
--  CONFIG  (edit if needed)
--    CompanyId  = 1
--    CreatedBy  = 1   ← change to your actual UserId
--    AccountId  starts at 1  (IDENTITY_INSERT is ON)
--
--  ⚠  REVIEW BEFORE INSERTING
--    1. ID 162 | 502051 | "Interest Income"
--       → Under Admin Expenses (as in original).
--         Move to Revenue > Other Income if needed.
--    2. ID 92  | 303001 | "Sajjad Sarwar"
--       → Original code was SAS-2-02-30-0001 (Liability prefix)
--         but Main Head = Equity  →  placed under Equity here.
--    3. Two group headers added to match standard COA layout:
--       "OPERATING REVENUE" (401000) & "OTHER INCOME" (402000)
--
--  ACCOUNT-CODE LAYOUT  (6 digits)
--    Level 1  X 0 0 0 0 0   Main class
--             1=Asset  2=Liability  3=Equity  4=Revenue  5=Expense
--    Level 2  X Y 0 0 0 0   Sub-class
--    Level 3  X Y Z 0 0 0   Group header   (e.g. 101100 = Cash & Bank)
--    Level 4  X Y Z N N N   Detail account (e.g. 101101 = BAFL AKK)
-- ================================================================

-- (Optional) Clear existing data first — uncomment if needed
-- DELETE FROM [dbo].[GlAccounts];

SET IDENTITY_INSERT [dbo].[GlAccounts] ON;
--Select * from Users
-- ============================================================
--  ASSETS
-- ============================================================
INSERT INTO [dbo].[GlAccounts] (
      [AccountId]
     ,[CompanyId]
     ,[ParentAccountId]
     ,[AccountCode]
     ,[AccountName]
     ,[Description]
     ,[AccountLevel]
     ,[AccountType]
     ,[AccountNature]
     ,[IsHeader]
     ,[IsActive]
     ,[CreatedBy]
     ,[CreatedAt]
     ,[UpdatedAt]
     ,[Version]
 )
 VALUES
      (  1, 1, NULL, 100000, N'ASSETS', N'Resources owned by the company', 1, N'Asset', N'Debit', 1, 1, 5, GETDATE(), NULL, 1),
-- CURRENT ASSETS
      (  2, 1,    1, 101000, N'CURRENT ASSETS', N'Short-term assets, cash, and equivalents', 2, N'Asset', N'Debit', 1, 1, 5, GETDATE(), NULL, 1),
--   Cash & Bank
      (  3, 1,    2, 101100, N'Cash & Bank', N'Bank accounts and cash equivalents', 3, N'Asset', N'Debit', 1, 1, 5, GETDATE(), NULL, 1),
      (  4, 1,    3, 101101, N'BAFL AKK - Control Account', N'BAFL AKK - Control Account', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (  5, 1,    3, 101102, N'Bank Al Habib DHA LHR', N'Bank Al Habib DHA LHR', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (  6, 1,    3, 101103, N'Bank Alfalah Ltd (ALML) WWR KHI', N'Bank Alfalah Ltd (ALML) WWR KHI', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (  7, 1,    3, 101104, N'Bank Alfalah Limited (K.K)', N'Bank Alfalah Limited (K.K)', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (  8, 1,    3, 101105, N'Bank Al-Falah Limited G-7 ISB', N'Bank Al-Falah Limited G-7 ISB', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (  9, 1,    3, 101106, N'Bank Al-Falah Ltd. (R.P.) SAS Cargo', N'Bank Al-Falah Ltd. (R.P.) SAS Cargo', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 10, 1,    3, 101107, N'Habib Bank Limited WW', N'Habib Bank Limited WW', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 11, 1,    3, 101108, N'Habib Metro Bank DHA LHR', N'Habib Metro Bank DHA LHR', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 12, 1,    3, 101109, N'Habib Metropolitan Bank Ltd. (Wwb)', N'Habib Metropolitan Bank Ltd. (Wwb)', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 13, 1,    3, 101110, N'Meezan Bank Limited', N'Meezan Bank Limited', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 14, 1,    3, 101111, N'Meezan Bank Limited KHI', N'Meezan Bank Limited KHI', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 15, 1,    3, 101112, N'Muslim Commercial Bank Ltd. (KHI)', N'Muslim Commercial Bank Ltd. (KHI)', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 16, 1,    3, 101113, N'National Bank Of Pakistan (Al Madina) PD Account', N'National Bank Of Pakistan (Al Madina) PD Account', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 17, 1,    3, 101114, N'National Bank of Pakistan (PD A/C)', N'National Bank of Pakistan (PD A/C)', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 18, 1,    3, 101115, N'NIB Bank Limited (Islamabad)', N'NIB Bank Limited (Islamabad)', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 19, 1,    3, 101116, N'Prepaid Deposit Account - Lahore', N'Prepaid Deposit Account - Lahore', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 20, 1,    3, 101117, N'Standard Chartered Bank - Isb (Br: 0114)', N'Standard Chartered Bank - Isb (Br: 0114)', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 21, 1,    3, 101118, N'Summit Bank Limited', N'Summit Bank Limited', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 22, 1,    3, 101119, N'United Bank Limited (Al Madina)', N'United Bank Limited (Al Madina)', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 23, 1,    3, 101120, N'3Rd Party Advances', N'3Rd Party Advances', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
--   Cash in Hand
      ( 24, 1,    2, 101200, N'Cash in Hand', N'Physical cash held in hand', 3, N'Asset', N'Debit', 1, 1, 5, GETDATE(), NULL, 1),
      ( 25, 1,   24, 101201, N'Cash In Hand - Karachi', N'Cash In Hand - Karachi', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 26, 1,   24, 101202, N'Cash In Hand - Lahore', N'Cash In Hand - Lahore', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 27, 1,   24, 101203, N'Cash In Hand - (Ansar Ghulam Nabi for Op)', N'Cash In Hand - (Ansar Ghulam Nabi for Op)', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 28, 1,   24, 101204, N'Cash In Hand - Islamabad', N'Cash In Hand - Islamabad', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 29, 1,   24, 101205, N'Cash In Hand - Rawalpindi', N'Cash In Hand - Rawalpindi', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 30, 1,    2, 101300, N'Account Receivable - Control Account', N'Money owed by customers', 3, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
--   Security Deposit
      ( 31, 1,    2, 101400, N'Security Deposit', N'Security deposits held', 3, N'Asset', N'Debit', 1, 1, 5, GETDATE(), NULL, 1),
      ( 32, 1,   31, 101401, N'United Marine Agencies (Pvt) Ltd.', N'United Marine Agencies (Pvt) Ltd.', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 33, 1,   31, 101402, N'AICTL', N'AICTL', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 34, 1,   31, 101403, N'Al-Madina Security Deposit', N'Al-Madina Security Deposit', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 35, 1,   31, 101404, N'Bay West Pvt Ltd', N'Bay West Pvt Ltd', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 36, 1,   31, 101405, N'BOML', N'BOML', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 37, 1,   31, 101406, N'Cosco Saeed Karachi', N'Cosco Saeed Karachi', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 38, 1,   31, 101407, N'KICTL', N'KICTL', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 39, 1,   31, 101408, N'Lahore - Security Deposit BID SNGPL', N'Lahore - Security Deposit BID SNGPL', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 40, 1,   31, 101409, N'PICTL', N'PICTL', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 41, 1,   31, 101410, N'PICTL - AL MADINA', N'PICTL - AL MADINA', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 42, 1,   31, 101411, N'QICTL', N'QICTL', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 43, 1,   31, 101412, N'SAPTL', N'SAPTL', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 44, 1,   31, 101413, N'SAPTL (Al-Madina Logistics)', N'SAPTL (Al-Madina Logistics)', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 45, 1,   31, 101414, N'SAS PDA Account RWP/ISB', N'SAS PDA Account RWP/ISB', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 46, 1,   31, 101415, N'SBL NLC', N'SBL NLC', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 47, 1,   31, 101416, N'Security Deposits - Lines', N'Security Deposits - Lines', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 48, 1,    2, 101500, N'Work in Process - Control Account (WIP)', N'Work in progress control account', 3, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
--   Other Current Assets
      ( 49, 1,    2, 101600, N'Other Current Assets', N'Other short-term assets', 3, N'Asset', N'Debit', 1, 1, 5, GETDATE(), NULL, 1),
      ( 50, 1,   49, 101601, N'Employees Advances / Loan', N'Employees Advances / Loan', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 51, 1,   49, 101602, N'Director Loans', N'Director Loans', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 52, 1,   49, 101603, N'WHT Receivable On Customers Payments (Income Tax)', N'WHT Receivable On Customers Payments (Income Tax)', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 53, 1,   49, 101604, N'WHT Receivable On Customers Payments (Sales Tax)', N'WHT Receivable On Customers Payments (Sales Tax)', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 54, 1,   49, 101605, N'WHT Receivable From Banks (Income Tax)', N'WHT Receivable From Banks (Income Tax)', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 55, 1,   49, 101606, N'WHT Receivable On Utilities (Income Tax)', N'WHT Receivable On Utilities (Income Tax)', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 56, 1,   49, 101607, N'WEBOC Token In KHI', N'WEBOC Token In KHI', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 57, 1,   49, 101608, N'WEBOC Token In KHI - AL Madina', N'WEBOC Token In KHI - AL Madina', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 58, 1,   49, 101609, N'WEBOC Token In LHR', N'WEBOC Token In LHR', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 59, 1,   49, 101610, N'Interest Receivable', N'Interest Receivable', 4, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
-- NON-CURRENT ASSETS
      ( 60, 1,    1, 102000, N'NON-CURRENT ASSETS', N'Long-term assets not converted to cash within a year', 2, N'Asset', N'Debit', 1, 1, 5, GETDATE(), NULL, 1),
      ( 61, 1,   60, 102001, N'Computer & Laptops', N'Property - Computers and laptops', 3, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 62, 1,   60, 102002, N'Accu. Dep. Of Computer & Laptops', N'Accumulated depreciation on computers', 3, N'Asset', N'Credit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 63, 1,   60, 102003, N'Furniture & Fixtures', N'Furniture and office fixtures', 3, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 64, 1,   60, 102004, N'Accu. Dep. Furniture & Fixtures', N'Accumulated depreciation on furniture', 3, N'Asset', N'Credit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 65, 1,   60, 102005, N'Vehicles', N'Company-owned vehicles', 3, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 66, 1,   60, 102006, N'Accu. Dep. Vehicles', N'Accumulated depreciation on vehicles', 3, N'Asset', N'Credit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 67, 1,   60, 102007, N'Land', N'Land owned by the company', 3, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 68, 1,   60, 102008, N'Building', N'Buildings owned by the company', 3, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 69, 1,   60, 102009, N'Accu. Dep. Building', N'Accumulated depreciation on buildings', 3, N'Asset', N'Credit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 70, 1,   60, 102010, N'Software / Intangible', N'Software and intangible assets', 3, N'Asset', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 71, 1,   60, 102011, N'Accu. Dep. Software / Intangible', N'Accumulated depreciation on intangible assets', 3, N'Asset', N'Credit', 0, 1, 5, GETDATE(), NULL, 1);

-- ============================================================
--  LIABILITIES
-- ============================================================
INSERT INTO [dbo].[GlAccounts] (
      [AccountId]
     ,[CompanyId]
     ,[ParentAccountId]
     ,[AccountCode]
     ,[AccountName]
     ,[Description]
     ,[AccountLevel]
     ,[AccountType]
     ,[AccountNature]
     ,[IsHeader]
     ,[IsActive]
     ,[CreatedBy]
     ,[CreatedAt]
     ,[UpdatedAt]
     ,[Version]
 )
 VALUES
      ( 72, 1, NULL, 200000, N'LIABILITIES', N'Debts and obligations', 1, N'Liability', N'Credit', 1, 1, 5, GETDATE(), NULL, 1),
-- CURRENT LIABILITIES
      ( 73, 1,   72, 201000, N'CURRENT LIABILITIES', N'Short-term financial obligations', 2, N'Liability', N'Credit', 1, 1, 5, GETDATE(), NULL, 1),
      ( 74, 1,   73, 201100, N'Accounts Payable - Control Account', N'Money owed to suppliers', 3, N'Liability', N'Credit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 75, 1,   73, 201200, N'Advances From Customers - Control Account', N'Advances received from customers', 3, N'Liability', N'Credit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 76, 1,   73, 201300, N'Sales Tax Payable - Control Account', N'Sales tax payable to government', 3, N'Liability', N'Credit', 0, 1, 5, GETDATE(), NULL, 1),
--   Other Current Liabilities
      ( 77, 1,   73, 201400, N'Other Current Liabilities', N'Other short-term liabilities', 3, N'Liability', N'Credit', 1, 1, 5, GETDATE(), NULL, 1),
      ( 78, 1,   77, 201401, N'EOBI Payable', N'EOBI contribution payable', 4, N'Liability', N'Credit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 79, 1,   77, 201402, N'PESSI Payable', N'PESSI contribution payable', 4, N'Liability', N'Credit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 80, 1,   77, 201403, N'SESSI Payable', N'SESSI contribution payable', 4, N'Liability', N'Credit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 81, 1,   77, 201404, N'Staff Salaries Payable', N'Salaries payable to staff', 4, N'Liability', N'Credit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 82, 1,   77, 201405, N'Provident Funds Payable', N'Provident fund contributions payable', 4, N'Liability', N'Credit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 83, 1,   77, 201406, N'WHT Sales Tax Payable', N'Withholding sales tax payable', 4, N'Liability', N'Credit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 84, 1,   77, 201407, N'Interest Payable', N'Interest and bank-related charges payable', 4, N'Liability', N'Credit', 0, 1, 5, GETDATE(), NULL, 1),
-- NON-CURRENT LIABILITIES
      ( 85, 1,   72, 202000, N'NON-CURRENT LIABILITIES', N'Long-term financial obligations', 2, N'Liability', N'Credit', 1, 1, 5, GETDATE(), NULL, 1),
      ( 86, 1,   85, 202001, N'Loan From Standard Chartered', N'Long-term loan from Standard Chartered Bank', 3, N'Liability', N'Credit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 87, 1,   85, 202002, N'Loan From Others', N'Long-term loans from other sources', 3, N'Liability', N'Credit', 0, 1, 5, GETDATE(), NULL, 1);

-- ============================================================
--  EQUITY
-- ============================================================
INSERT INTO [dbo].[GlAccounts] (
      [AccountId]
     ,[CompanyId]
     ,[ParentAccountId]
     ,[AccountCode]
     ,[AccountName]
     ,[Description]
     ,[AccountLevel]
     ,[AccountType]
     ,[AccountNature]
     ,[IsHeader]
     ,[IsActive]
     ,[CreatedBy]
     ,[CreatedAt]
     ,[UpdatedAt]
     ,[Version]
 )
 VALUES
      ( 88, 1, NULL, 300000, N'EQUITY', N'Owner''s investment and retained earnings', 1, N'Equity', N'Credit', 1, 1, 5, GETDATE(), NULL, 1),
-- Share Capital
      ( 89, 1,   88, 301000, N'Share Capital', N'Capital invested by shareholders', 2, N'Equity', N'Credit', 0, 1, 5, GETDATE(), NULL, 1),
-- Retained Earnings
      ( 90, 1,   88, 302000, N'Retained Earnings', N'Accumulated profits retained in business', 2, N'Equity', N'Credit', 0, 1, 5, GETDATE(), NULL, 1),
-- Current Accounts - Directors
      ( 91, 1,   88, 303000, N'Current Accounts - Directors', N'Directors current accounts', 2, N'Equity', N'Credit', 1, 1, 5, GETDATE(), NULL, 1),
      ( 92, 1,   91, 303001, N'Sajjad Sarwar', N'Director account - Sajjad Sarwar', 3, N'Equity', N'Credit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 93, 1,   91, 303002, N'Saud Sarwar', N'Director account - Saud Sarwar', 3, N'Equity', N'Credit', 0, 1, 5, GETDATE(), NULL, 1);

-- ============================================================
--  REVENUE
-- ============================================================
INSERT INTO [dbo].[GlAccounts] (
      [AccountId]
     ,[CompanyId]
     ,[ParentAccountId]
     ,[AccountCode]
     ,[AccountName]
     ,[Description]
     ,[AccountLevel]
     ,[AccountType]
     ,[AccountNature]
     ,[IsHeader]
     ,[IsActive]
     ,[CreatedBy]
     ,[CreatedAt]
     ,[UpdatedAt]
     ,[Version]
 )
 VALUES
      ( 94, 1, NULL, 400000, N'REVENUE', N'Income from operations', 1, N'Revenue', N'Credit', 1, 1, 5, GETDATE(), NULL, 1),
-- OPERATING REVENUE
      ( 95, 1,   94, 401000, N'OPERATING REVENUE', N'Primary income from core business', 2, N'Revenue', N'Credit', 1, 1, 5, GETDATE(), NULL, 1),
      ( 96, 1,   95, 401001, N'Revenue From Clearing Services', N'Income from clearing services', 3, N'Revenue', N'Credit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 97, 1,   95, 401002, N'Revenue From Freight Services', N'Income from freight services', 3, N'Revenue', N'Credit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 98, 1,   95, 401003, N'Revenue From Transport Services', N'Income from transport services', 3, N'Revenue', N'Credit', 0, 1, 5, GETDATE(), NULL, 1),
      ( 99, 1,   95, 401004, N'Revenue From Other Services', N'Income from other services', 3, N'Revenue', N'Credit', 0, 1, 5, GETDATE(), NULL, 1),
-- OTHER INCOME
      (100, 1,   94, 402000, N'OTHER INCOME', N'Secondary income sources', 2, N'Revenue', N'Credit', 1, 1, 5, GETDATE(), NULL, 1),
      (101, 1,  100, 402001, N'Other Income', N'Miscellaneous other income', 3, N'Revenue', N'Credit', 0, 1, 5, GETDATE(), NULL, 1),
      (102, 1,  100, 402002, N'Re-Imburseable Charges', N'Charges reimbursed by customers', 3, N'Revenue', N'Credit', 0, 1, 5, GETDATE(), NULL, 1);

-- ============================================================
--  EXPENSES
-- ============================================================
INSERT INTO [dbo].[GlAccounts] (
      [AccountId]
     ,[CompanyId]
     ,[ParentAccountId]
     ,[AccountCode]
     ,[AccountName]
     ,[Description]
     ,[AccountLevel]
     ,[AccountType]
     ,[AccountNature]
     ,[IsHeader]
     ,[IsActive]
     ,[CreatedBy]
     ,[CreatedAt]
     ,[UpdatedAt]
     ,[Version]
 )
 VALUES
      (103, 1, NULL, 500000, N'EXPENSES', N'Costs incurred to earn revenue', 1, N'Expense', N'Debit', 1, 1, 5, GETDATE(), NULL, 1),
-- COST OF SALE
      (104, 1,  103, 501000, N'COST OF SALE', N'Cost of sales/services directly tied to revenue', 2, N'Expense', N'Debit', 1, 1, 5, GETDATE(), NULL, 1),
      (105, 1,  104, 501001, N'Cost Of Sale - Clearing Services', N'Direct costs for clearing services', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (106, 1,  104, 501002, N'Cost Of Sale - Freight Services', N'Direct costs for freight services', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (107, 1,  104, 501003, N'Cost Of Sale - Transport Services', N'Direct costs for transport services', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (108, 1,  104, 501004, N'Cost Of Sale - Other Services', N'Direct costs for other services', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (109, 1,  104, 501005, N'Cost Of Sale - Re-Imburseable Charges', N'Direct costs for reimburseable charges', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
-- ADMINISTRATIVE EXPENSES
      (110, 1,  103, 502000, N'ADMINISTRATIVE EXPENSES', N'General overhead and management costs', 2, N'Expense', N'Debit', 1, 1, 5, GETDATE(), NULL, 1),
      (111, 1,  110, 502001, N'Salaries Expense', N'Salaries Expense', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (112, 1,  110, 502002, N'Office Rent Expense', N'Office Rent Expense', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (113, 1,  110, 502003, N'Legal & Professional Expenses', N'Legal & Professional Expenses', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (114, 1,  110, 502004, N'Eidi Allowance', N'Eidi Allowance', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (115, 1,  110, 502005, N'Consultancy Expense', N'Consultancy Expense', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (116, 1,  110, 502006, N'Insurance Expense', N'Insurance Expense', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (117, 1,  110, 502007, N'Electricity Expense', N'Electricity Expense', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (118, 1,  110, 502008, N'Bonus / Additional Salary', N'Bonus / Additional Salary', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (119, 1,  110, 502009, N'Rental & Running Exp - FDS 2576 Mazda', N'Rental & Running Exp - FDS 2576 Mazda', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (120, 1,  110, 502010, N'Discount Allowed / Received', N'Discount Allowed / Received', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (121, 1,  110, 502011, N'Processing Charges', N'Processing Charges', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (122, 1,  110, 502012, N'Printing / Stationery Expense', N'Printing / Stationery Expense', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (123, 1,  110, 502013, N'Donation & Charity', N'Donation & Charity', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (124, 1,  110, 502014, N'Miscellaneous Expense', N'Miscellaneous Expense', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (125, 1,  110, 502015, N'Entertainment Expense', N'Entertainment Expense', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (126, 1,  110, 502016, N'Conveyance Expense', N'Conveyance Expense', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (127, 1,  110, 502017, N'Zakaat Expense', N'Zakaat Expense', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (128, 1,  110, 502018, N'Currency Gain & Loss', N'Currency Gain & Loss', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (129, 1,  110, 502019, N'Bank Charges', N'Bank Charges', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (130, 1,  110, 502020, N'Office Expenses', N'Office Expenses', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (131, 1,  110, 502021, N'Computer Software / Hardware Expense', N'Computer Software / Hardware Expense', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (132, 1,  110, 502022, N'Telephone Bills Expense', N'Telephone Bills Expense', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (133, 1,  110, 502023, N'Internet Expense', N'Internet Expense', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (134, 1,  110, 502024, N'Mobile Phone Bills Expenses', N'Mobile Phone Bills Expenses', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (135, 1,  110, 502025, N'Fees & Subscription Expense', N'Fees & Subscription Expense', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (136, 1,  110, 502026, N'Courier Expense', N'Courier Expense', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (137, 1,  110, 502027, N'EOBI Contribution', N'EOBI Contribution', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (138, 1,  110, 502028, N'Photocopier Expenses', N'Photocopier Expenses', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (139, 1,  110, 502029, N'Diesel Expense For Generator', N'Diesel Expense For Generator', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (140, 1,  110, 502030, N'Maintenance - Office', N'Maintenance - Office', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (141, 1,  110, 502031, N'Maintenance - Vehicle', N'Maintenance - Vehicle', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (142, 1,  110, 502032, N'SESSI Contribution', N'SESSI Contribution', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (143, 1,  110, 502033, N'Professional Tax', N'Professional Tax', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (144, 1,  110, 502034, N'Maintenance - Office Equipment', N'Maintenance - Office Equipment', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (145, 1,  110, 502035, N'Diesel Running Expense', N'Diesel Running Expense', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (146, 1,  110, 502036, N'News Paper Expenses', N'News Paper Expenses', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (147, 1,  110, 502037, N'Custom Data Expense', N'Custom Data Expense', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (148, 1,  110, 502038, N'Vehicle Tax Expenses', N'Vehicle Tax Expenses', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (149, 1,  110, 502039, N'Water Conservancy Bills', N'Water Conservancy Bills', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (150, 1,  110, 502040, N'Service Charges', N'Service Charges', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (151, 1,  110, 502041, N'Travelling Expense', N'Travelling Expense', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (152, 1,  110, 502042, N'Generator Maintenance Expense', N'Generator Maintenance Expense', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (153, 1,  110, 502043, N'Sui Gas Expenses', N'Sui Gas Expenses', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (154, 1,  110, 502044, N'Computer Expenses', N'Computer Expenses', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (155, 1,  110, 502045, N'Attendance Allowance', N'Attendance Allowance', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (156, 1,  110, 502046, N'Diesel Expense of KQ-2373 (Shehzore)', N'Diesel Expense of KQ-2373 (Shehzore)', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (157, 1,  110, 502047, N'Interest Expense', N'Interest Expense', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (158, 1,  110, 502048, N'Maintenance - Computers', N'Maintenance - Computers', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (159, 1,  110, 502049, N'Maintenance Expense Of KQ-2373 (Shehzore)', N'Maintenance Expense Of KQ-2373 (Shehzore)', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (160, 1,  110, 502050, N'Provident Funds Contribution', N'Provident Funds Contribution', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (161, 1,  110, 502051, N'Interest Income', N'Interest Income', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (162, 1,  110, 502052, N'Other Professional Charges', N'Other Professional Charges', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1),
      (163, 1,  110, 502053, N'Other Expenses', N'Other Expenses', 3, N'Expense', N'Debit', 0, 1, 5, GETDATE(), NULL, 1);

SET IDENTITY_INSERT [dbo].[GlAccounts] OFF;

-- ============================================================
--  Done  —  163 accounts inserted
-- ============================================================