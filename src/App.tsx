import React, { useState, useEffect } from 'react';
import { Coins, Info, FileSpreadsheet, Download, LogOut } from 'lucide-react';
import { EchelonState, Asset, AssetType, Loan, LoanType, FinancialGoal, Budget, Expense, BudgetPeriod, CompoundingFrequency, EchelonTheme } from './types';
import PasscodeScreen from './components/PasscodeScreen';
import ThemeSelector from './components/ThemeSelector';
import HoldingSummary from './components/HoldingSummary';
import AssetManager from './components/AssetManager';
import LoanCompounder from './components/LoanCompounder';
import BudgetManager from './components/BudgetManager';
import GoalMilestones from './components/GoalMilestones';
import { encryptData, decryptData, hashPin } from './utils/security';
import { getColorTokens } from './utils/theme';
import { calculateLoanCurrentBalance, calculateWealthRates } from './utils/math';
import { generateCSVData, generateHTMLReport, downloadBlob } from './utils/export';

const createInitialState = (): EchelonState => ({
  version: 2,
  isLocked: true,
  pinHash: '',
  assets: [
    { id: 'ast-1', name: 'Nifty 50 Index Fund', institution: 'Zerodha', type: AssetType.EQUITY, currentValue: 450000, realisedReturns: 42000, notes: '12% APY', lastUpdated: new Date().toISOString() },
    { id: 'ast-2', name: 'HDFC Term Deposit', institution: 'HDFC Bank', type: AssetType.FD, currentValue: 200000, realisedReturns: 14200, notes: '7.1% APY', lastUpdated: new Date().toISOString() },
  ],
  loans: [
    { id: 'ln-1', name: 'SBI Car Finance', personOrEntity: 'State Bank of India', type: LoanType.BORROWED, principal: 350550, interestRate: 8.5, compoundingFrequency: CompoundingFrequency.MONTHLY, startDate: '2026-02-15', manualPayments: 45000, notes: 'EMI linked to HDFC', lastUpdated: new Date().toISOString() },
  ],
  goals: [
    { id: 'gl-1', name: 'Securing ₹15L Freedom Base', targetAmount: 1500000, deadlineDate: '2028-12-31', category: 'Sovereign Fund' },
  ],
  budget: { id: 'b-1', period: BudgetPeriod.MONTHLY, amount: 60000, spendingLimitAlertPercent: 80, lastResetDate: new Date().toISOString() },
  expenses: [],
  monthlyEarnings: 135000,
  theme: { mode: 'dark', palette: 'elegant-dark' },
  arc
