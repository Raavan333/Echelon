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
  sweepInEnabled?: boolean;
  sweepInLinkedAssetId?: string; // Linked bank balance Asset ID
  maturityPenaltyRate?: number; // Break penalty percentage, e.g. 1%
  isMatured?: boolean;
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
  assetIds?: string[];
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
  palette: 'stealth-gold' | 'black-steel' | 'royal-emerald' | 'rose-amethyst' | 'platinum-silver' | 'slate-amber' | 'black' | 'silver' | 'blue' | 'elegant-dark' | string;
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

export interface CreditCard {
  id: string;
  name: string;
  totalLimit: number;
  usedBalance: number;
  apr: number; // Annual % rate, charges on overdue balance
  statementDate: number; // Day of month (e.g. 5)
  bufferDays: number; // Days to pay after statement generated (e.g. 20)
  lastBillAmount?: number; // Last statement generated amount
  dueDate?: string; // Calculated absolute ISO due date
  lastStatementDate?: string; // Last statement date
  outstandingBalanceAtStatement?: number; // Outstanding statement amount
  alertRemainingLimit?: number; // alert threshold
  alertUsedLimitPct?: number; // alert threshold percent
}

export interface OutflowLog {
  id: string;
  amount: number;
  category: string;
  date: string; // ISO Date string
  sourceType: 'bank_balance' | 'credit_card';
  sourceId: string; // Asset ID or CreditCard ID
  sourceName: string;
  amountLeftAfter: number; // Balance left in bank or CC remaining limit
  notes?: string;
  fdSweepBrokenId?: string; // Broken FD ID
  fdSweepPenaltyFee?: number; // penalty fee if bank was broken
}

export interface AcknowledgedAlertRecord {
  id: string;
  ruleName: string;
  message: string;
  date: string; // ISO date of ack
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
  selectedGalleryIcon?: 'stealth-matte-gold' | 'vanguard-black-steel' | 'regal-obsidian-gold';
  userName?: string; // Customizable name for user profile reports
  customThemeConfigs?: CustomThemeConfig[]; // User's self-configured themes
  activeAccentColor?: string; // Overriding color for amber-500
  currencySymbol?: string; // Denomination override, e.g. "₹", "$", etc.
  customSavingsGoalAmt?: number; // Custom user desired savings override
  userOverriddenExpenses?: number; // Custom decisive monthly expense flow rate
  customAlertRules?: string[]; // Custom defined threshold rules or alerting limits
  structuredAlertRules?: AlertRule[]; // Structured rule alerts
  creditCards?: CreditCard[];
  outflows?: OutflowLog[];
  acknowledgedAlerts?: AcknowledgedAlertRecord[];
  selectedFontOption?: 'classic-inter' | 'cyber-mono' | 'serif-editorial';
  selectedProgressBarStyle?: 'ultra-thin' | 'neon-glow' | 'carbon-solid';
  slideshowEnabled?: boolean;
  slideshowIntervalSeconds?: number;
  transfers?: FundTransfer[];
  securityTimeoutMinutes?: number;
  compiledInsightsText?: string;
}

export interface FundTransfer {
  id: string;
  sourceAssetId: string;
  sourceAssetName: string;
  destinationAssetId: string;
  destinationAssetName: string;
  baseAmount: number;
  gainAmount: number;       // Profit added (e.g. Stock gain)
  penaltyAmount: number;    // Penalty subtracted (e.g. FD/Bond break fee)
  netAmountTransferred: number;
  notes: string;
  date: string;
  type: 'STOCK_PROFIT' | 'FD_PENALTY' | 'BOND_PENALTY' | 'NEUTRAL_TRANSFER';
}

export interface AlertRule {
  id: string;
  name: string;
  assetIds: string[]; // Select multiple or single funds
  targetAmount?: number; // threshold amount
  targetPercent?: number; // threshold percentage of net worth or original
  conditionType: 'below_amount' | 'above_amount' | 'below_percent' | 'above_percent';
  isActive: boolean;
}
