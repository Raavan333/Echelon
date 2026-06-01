/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum AssetType {
  EQUITY = 'EQUITY',
  FD = 'FD',
  BOND = 'BOND',
  STOCK = 'STOCK',
  BANK_BALANCE = 'BANK_BALANCE',
}

export enum LoanType {
  BORROWED = 'BORROWED', // Liability (decrease portfolio value)
  LENT = 'LENT',         // Asset (increase portfolio value)
}

export enum CompoundingFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export enum BudgetPeriod {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export interface Asset {
  id: string;
  type: AssetType;
  name: string;
  institution: string;
  currentValue: number;
  realisedReturns: number; // Manually updatedised returns
  annualGrowthRate?: number; // Optional annual growth / APY percentage
  notes?: string;
  lastUpdated: string;
  startDate?: string;
  endDate?: string;
}

export interface Loan {
  id: string;
  type: LoanType;
  name: string;
  personOrEntity: string;
  principal: number;
  interestRate: number; // Annual %
  compoundingFrequency: CompoundingFrequency;
  startDate: string; // ISO date
  manualPayments: number; // To reduce loan principal/balance
  lastUpdated: string;
  notes?: string;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  deadlineDate: string; // ISO date
  category: string;
}

export interface Budget {
  id: string;
  period: BudgetPeriod;
  amount: number;
  spendingLimitAlertPercent: number; // e.g. 80 for 80%
  lastResetDate: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string; // ISO date
  notes?: string;
}

export interface EchelonTheme {
  mode: 'dark' | 'light';
  palette: 'black' | 'silver' | 'blue' | 'elegant-dark';
}

export interface BudgetCategoryLimit {
  category: string;
  limit: number;
}

export interface CustomField {
  label: string;
  value: string;
}

export interface CustomThemeConfig {
  id: string;
  name: string;
  primaryColor: string; // Custom Hex accent color code
  bgMode: 'dark' | 'light';
}

export interface EchelonState {
  version: number;
  isLocked: boolean;
  pinHash: string; // PIN hashed/salted for decryption check
  assets: Asset[];
  loans: Loan[];
  goals: FinancialGoal[];
  budget: Budget;
  expenses: Expense[];
  monthlyEarnings: number; // configured monthly recurring earnings
  theme: EchelonTheme;
  archivedReportMonths: string[]; // Keep track of archived months (YYYY-MM)
  budgetCategoryLimits?: BudgetCategoryLimit[];
  customFields?: CustomField[];
  selectedGalleryIcon?: 'gold-shield' | 'watch-chrono' | 'stealth-carbon';
  outerIcon?: 'stealth-matte-gold' | 'vanguard-black-steel' | 'regal-obsidian-gold';
  innerIcon?: 'stealth-matte-gold' | 'vanguard-black-steel' | 'regal-obsidian-gold';
  userName?: string; // Customizable name for user profile reports
  customThemeConfigs?: CustomThemeConfig[]; // User's self-configured themes
  activeAccentColor?: string; // Overriding color for amber-500
  currencySymbol?: string; // Denomination override, e.g. "₹", "$", etc.
  customSavingsGoalAmt?: number; // Custom user desired savings override
  userOverriddenExpenses?: number; // Custom decisive monthly expense flow rate
  customAlertRules?: string[]; // Custom defined threshold rules or alerting limits
}
