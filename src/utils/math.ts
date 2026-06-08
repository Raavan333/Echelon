/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CompoundingFrequency, AssetType, Asset, Loan, LoanType, Expense, Budget, CreditCard } from '../types';

/**
 * Returns number of compounding periods per year based on frequency enum.
 */
export function getCompoundingPeriodsPerYear(freq: CompoundingFrequency): number {
  switch (freq) {
    case CompoundingFrequency.DAILY: return 365;
    case CompoundingFrequency.WEEKLY: return 52;
    case CompoundingFrequency.MONTHLY: return 12;
    case CompoundingFrequency.QUARTERLY: return 4;
    case CompoundingFrequency.YEARLY: return 1;
    default: return 12;
  }
}

/**
 * Calculates compound interest loan balance as of a given target date.
 * Formula: A = P * (1 + r/n)^(n * t)
 */
export function calculateLoanCurrentBalance(loan: Loan, asOfDate: Date = new Date()): number {
  const start = new Date(loan.startDate);
  const diffTime = asOfDate.getTime() - start.getTime();
  
  if (diffTime <= 0) {
    return Math.max(0, loan.principal - loan.manualPayments);
  }
  
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  const t = diffDays / 365.25; // time in years
  
  const n = getCompoundingPeriodsPerYear(loan.compoundingFrequency);
  const r = loan.interestRate / 100; // interest rate in decimal
  
  // Compound interest formula
  const A = loan.principal * Math.pow(1 + r / n, n * t);
  
  // Total balance outstanding minus manual repayments/payments
  const finalBalance = A - loan.manualPayments;
  return Math.max(0, parseFloat(finalBalance.toFixed(2)));
}

/**
 * Calculates interest accrued on a loan.
 */
export function calculateLoanAccruedInterest(loan: Loan, asOfDate: Date = new Date()): number {
  const start = new Date(loan.startDate);
  const diffTime = asOfDate.getTime() - start.getTime();
  if (diffTime <= 0) return 0;
  
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  const t = diffDays / 365.25;
  const n = getCompoundingPeriodsPerYear(loan.compoundingFrequency);
  const r = loan.interestRate / 100;
  
  const A = loan.principal * Math.pow(1 + r / n, n * t);
  return Math.max(0, parseFloat((A - loan.principal).toFixed(2)));
}

/**
 * Interface representing the net flow rates.
 */
export interface WealthRates {
  earningsPerHour: number;
  earningsPerDay: number;
  earningsPerMonth: number;
  earningsPerYear: number;
  earningsPerFiveYears: number;
  
  lossesPerHour: number;
  lossesPerDay: number;
  lossesPerMonth: number;
  lossesPerYear: number;
  lossesPerFiveYears: number;
  
  netPerHour: number;
  netPerDay: number;
  netPerMonth: number;
  netPerYear: number;
  netPerFiveYears: number;
  
  earningsRatePercentOfYear: number; // as a % of total asset base
}

/**
 * Calculates granular wealth flow velocity rates.
 * - Passive earning vectors:
 *   - FD real interest yield (imputed standard coupon based on 1-year yield or manual settings,
 *     let's assume standard annual rate on FDs and Bonds, e.g. 7% for FD, 8% for Bond since it compounds)
 *     Wait, if they enter an asset, let's assume they might enter a yield or we can show compounding on assets.
 *     Or simply, we can let user see passive yield + manual realised returns velocity!
 *   - Compounding interest on Lent loans (receivables).
 *   - Configured recurring monthly cash injection (salary/business income).
 * - Loss vectors:
 *   - Compounding interest on Borrowed loans (payables).
 *   - Average budget expense flow rate (sum of custom expense entries projected or flat budget cap).
 */
export function calculateWealthRates(
  assets: Asset[],
  loans: Loan[],
  monthlyEarnings: number,
  expenses: Expense[],
  totalPortfolioValue: number,
  userOverriddenExpenses?: number,
  customSavingsGoalAmt?: number,
  budgetAmount?: number,
  usdRate?: number
): WealthRates {
  // 1. Earned Income flows:
  // Recurring monthly earnings
  const monthlySalary = monthlyEarnings;
  
  // FD and Bond yields: prioritize custom annualGrowthRate if configured, otherwise use default category-wise rates
  let assetAnnualPassiveYield = 0;
  assets.forEach(asset => {
    const rate = asset.annualGrowthRate !== undefined 
      ? asset.annualGrowthRate / 100 
      : (asset.type === AssetType.FD ? 0.071 
        : asset.type === AssetType.BOND ? 0.085
        : (asset.type === AssetType.EQUITY || asset.type === AssetType.STOCK) ? 0.12 
        : 0);
    const convertedValue = asset.isUSAsset 
      ? asset.currentValue * (usdRate !== undefined ? usdRate : 83.5)
      : asset.currentValue;
    assetAnnualPassiveYield += convertedValue * rate;
  });

  // Lent loans compound interest yield per year
  let loansAnnualPassiveYield = 0;
  loans.forEach(loan => {
    if (loan.type === LoanType.LENT) {
      // Approximate annual interest earned
      const balance = calculateLoanCurrentBalance(loan);
      loansAnnualPassiveYield += balance * (loan.interestRate / 100);
    }
  });

  const totalAnnualPassiveEarnings = assetAnnualPassiveYield + loansAnnualPassiveYield;
  const totalAnnualSalary = monthlySalary * 12;
  const totalAnnualEarningsBytes = totalAnnualPassiveEarnings + totalAnnualSalary;
  
  // Let's divide to find daily, hourly, monthly, 5-yearly rates
  const earningsPerYear = totalAnnualEarningsBytes;
  const earningsPerMonth = earningsPerYear / 12;
  const earningsPerDay = earningsPerYear / 365.25;
  const earningsPerHour = earningsPerDay / 24;
  const earningsPerFiveYears = earningsPerYear * 5;

  // 2. Loss flow rate:
  // Borrowed loans compounding interest cost per year
  let loansAnnualPassiveCosts = 0;
  loans.forEach(loan => {
    if (loan.type === LoanType.BORROWED) {
      const balance = calculateLoanCurrentBalance(loan);
      loansAnnualPassiveCosts += balance * (loan.interestRate / 100);
    }
  });

  // Expenses flow rate representing overall monthly "Sink"
  let imputedMonthlyExpense = 15000; // Base default fallback
  if (userOverriddenExpenses !== undefined && userOverriddenExpenses > 0) {
    imputedMonthlyExpense = userOverriddenExpenses;
  } else {
    // Default dynamic sink: configured budget + current month logged spends + buffer (default 1000)
    const budgetCap = budgetAmount || 0;
    const currentMonthLoggedExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const configuredBuffer = customSavingsGoalAmt !== undefined ? customSavingsGoalAmt : 1000;
    imputedMonthlyExpense = budgetCap + currentMonthLoggedExpenses + configuredBuffer;
  }

  const annualExpenseRate = imputedMonthlyExpense * 12;

  const totalAnnualLosses = loansAnnualPassiveCosts + annualExpenseRate;
  
  const lossesPerYear = totalAnnualLosses;
  const lossesPerMonth = lossesPerYear / 12;
  const lossesPerDay = lossesPerYear / 365.25;
  const lossesPerHour = lossesPerDay / 24;
  const lossesPerFiveYears = lossesPerYear * 5;

  // 3. Net flows
  const netPerHour = earningsPerHour - lossesPerHour;
  const netPerDay = earningsPerDay - lossesPerDay;
  const netPerMonth = earningsPerMonth - lossesPerMonth;
  const netPerYear = earningsPerYear - lossesPerYear;
  const netPerFiveYears = earningsPerFiveYears - lossesPerFiveYears;

  // Rate of earning as % of active base or active pool
  const denom = totalPortfolioValue !== 0 
    ? Math.abs(totalPortfolioValue) 
    : (totalAnnualPassiveEarnings > 0 ? totalAnnualPassiveEarnings : 1);
  const earningsRatePercentOfYear = (netPerYear / denom) * 100;

  return {
    earningsPerHour,
    earningsPerDay,
    earningsPerMonth,
    earningsPerYear,
    earningsPerFiveYears,
    
    lossesPerHour,
    lossesPerDay,
    lossesPerMonth,
    lossesPerYear,
    lossesPerFiveYears,
    
    netPerHour,
    netPerDay,
    netPerMonth,
    netPerYear,
    netPerFiveYears,
    
    earningsRatePercentOfYear
  };
}

/**
 * Estimates number of years remaining to achieve a financial goal at the current wealth net rate.
 * Formula: years = (Target - CurrentPortfolio) / NetYearlyFlow
 */
export function estimateTimeToGoal(targetAmount: number, currentPortfolio: number, netPerYear: number): number {
  if (currentPortfolio >= targetAmount) {
    return 0; // Already achieved!
  }
  if (netPerYear <= 0) {
    return Infinity; // Under current rate, it is impossible (losing money or zero net positive flow)
  }
  return (targetAmount - currentPortfolio) / netPerYear;
}

/**
 * Calculates additional interest accrued on overdue credit card statement bills.
 */
export function calculateCreditCardOverdueInterest(card: CreditCard, asOf: Date = new Date()): number {
  if (!card.dueDate || !card.lastBillAmount || card.lastBillAmount <= 0) return 0;
  
  const dueTime = new Date(card.dueDate).getTime();
  const current = asOf.getTime();
  if (current <= dueTime) return 0;
  
  // Overdue! Compounds/grows at the configured APR (annual rate) over the past overdue days
  const diffDays = (current - dueTime) / (1000 * 60 * 60 * 24);
  const t = diffDays / 365.25; // in years
  const r = (card.apr || 36) / 100;
  
  const interestAccrued = card.lastBillAmount * r * t;
  return Math.max(0, parseFloat(interestAccrued.toFixed(2)));
}

/**
 * Returns the effective liability amount that affects portfolio / net worth for a credit card.
 * Only overdue card statement balances count as liability (reduces total net worth).
 * If in buffer period or usage hasn't generated statement, it does not affect portfolio / net worth.
 */
export function calculateCreditCardEffectiveLiability(card: CreditCard, asOf: Date = new Date()): number {
  if (!card.dueDate || !card.lastBillAmount || card.lastBillAmount <= 0) return 0;
  
  const dueTime = new Date(card.dueDate).getTime();
  const current = asOf.getTime();
  if (current <= dueTime) return 0; // Still inside interest free / grace buffer time
  
  // Past end buffer date: Billed amount + accrued overdue compound interest is active liability
  const overdueInterest = calculateCreditCardOverdueInterest(card, asOf);
  return Math.max(0, parseFloat((card.lastBillAmount + overdueInterest).toFixed(2)));
}
