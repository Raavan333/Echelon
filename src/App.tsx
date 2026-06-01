/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Wallet, 
  Sparkles, 
  Coins, 
  History, 
  TrendingUp, 
  FileSpreadsheet, 
  Info, 
  Trash2, 
  Download, 
  Compass, 
  Timer, 
  RefreshCw,
  LogOut,
  Sliders,
  HelpCircle
} from 'lucide-react';

import { 
  EchelonState, 
  Asset, 
  AssetType, 
  Loan, 
  LoanType, 
  FinancialGoal, 
  Budget, 
  Expense, 
  BudgetPeriod, 
  CompoundingFrequency,
  EchelonTheme
} from './types';

// Child components
import PasscodeScreen from './components/PasscodeScreen';
import ThemeSelector from './components/ThemeSelector';
import HoldingSummary from './components/HoldingSummary';
import AIInsights from './components/AIInsights';
import AssetManager from './components/AssetManager';
import LoanCompounder from './components/LoanCompounder';
import BudgetManager from './components/BudgetManager';
import GoalMilestones from './components/GoalMilestones';

// Utilities
import { encryptData, decryptData, hashPin } from './utils/security';
import { getColorTokens } from './utils/theme';
import { calculateLoanCurrentBalance, calculateWealthRates } from './utils/math';
import { generateCSVData, generateHTMLReport, downloadBlob } from './utils/export';

// Default initial state for a fresh setup
const createInitialState = (): EchelonState => ({
  version: 2,
  isLocked: true,
  pinHash: '',
  assets: [
    {
      id: 'ast-1',
      name: 'Nifty 50 Index Fund Master SIP',
      institution: 'Zerodha Mutual Fund',
      type: AssetType.EQUITY,
      currentValue: 450000,
      realisedReturns: 42000,
      notes: 'Safe index compounding basket (Expected 12% APY)',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'ast-2',
      name: 'HDFC Safe Term Deposit',
      institution: 'HDFC Bank Ltd.',
      type: AssetType.FD,
      currentValue: 200000,
      realisedReturns: 14200,
      notes: '7.1% APY compounded quarterly',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'ast-3',
      name: 'Power Finance Corp Series B Bond',
      institution: 'Power Finance Corporation',
      type: AssetType.BOND,
      currentValue: 150000,
      realisedReturns: 12750,
      notes: '8.5% yield paid semi-annually',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'ast-4',
      name: 'Blue-Chip Tactical Equity Basket',
      institution: 'Upstox Securities',
      type: AssetType.STOCK,
      currentValue: 320000,
      realisedReturns: 18000,
      notes: 'High-volume dividend portfolio',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'ast-5',
      name: 'HDFC liquid salary account',
      institution: 'HDFC Bank Ltd.',
      type: AssetType.BANK_BALANCE,
      currentValue: 85000,
      realisedReturns: 0,
      notes: 'Primary liquid sheet reserve',
      lastUpdated: new Date().toISOString(),
    },
  ],
  loans: [
    {
      id: 'ln-1',
      name: 'Venture Capital loan of Ramesh',
      personOrEntity: 'Ramesh Balaji',
      type: LoanType.LENT,
      principal: 100000,
      interestRate: 12,
      compoundingFrequency: CompoundingFrequency.MONTHLY,
      startDate: '2026-01-01',
      manualPayments: 15000,
      notes: 'Legally signed ledger repayment sheet',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'ln-2',
      name: 'SBI Premium Car Finance',
      personOrEntity: 'State Bank of India',
      type: LoanType.BORROWED,
      principal: 350550,
      interestRate: 8.5,
      compoundingFrequency: CompoundingFrequency.MONTHLY,
      startDate: '2026-02-15',
      manualPayments: 45000,
      notes: 'Automated EMI auto-debt linked to HDFC core',
      lastUpdated: new Date().toISOString(),
    },
  ],
  goals: [
    {
      id: 'gl-1',
      name: 'Securing ₹15L Sovereign Freedom Base',
      targetAmount: 1500000,
      deadlineDate: '2028-12-31',
      category: 'Sovereign Fund',
    },
    {
      id: 'gl-2',
      name: 'Achieve ₹5L Cash Shield Emergency Pool',
      targetAmount: 500000,
      deadlineDate: '2027-06-01',
      category: 'Active Shield',
    },
  ],
  budget: {
    id: 'b-1',
    period: BudgetPeriod.MONTHLY,
    amount: 60000,
    spendingLimitAlertPercent: 80,
    lastResetDate: new Date().toISOString(),
  },
  expenses: [
    {
      id: 'ex-1',
      category: 'Food & Living',
      amount: 12000,
      date: '2026-05-20',
      notes: 'Full organic dry-grocery reload',
    },
    {
      id: 'ex-2',
      category: 'Leisure & Personal',
      amount: 8500,
      date: '2026-05-24',
      notes: 'Weekend wellness nature retreat',
    },
    {
      id: 'ex-3',
      category: 'Premium Subscriptions',
      amount: 3200,
      date: '2026-05-26',
      notes: 'Financial news terminal charge',
    },
  ],
  monthlyEarnings: 135000,
  theme: {
    mode: 'dark',
    palette: 'elegant-dark',
  },
  archivedReportMonths: [],
});

export default function App() {
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [pinHash, setPinHash] = useState<string>('');
  const [activePin, setActivePin] = useState<string>(''); // Kept safe in-memory to re-encrypt on modifications
  const [vaultData, setVaultData] = useState<EchelonState | null>(null);

  // Read matching PIN configurations on mount
  useEffect(() => {
    const storedHash = localStorage.getItem('echelon_pin_hash');
    if (storedHash) {
      setPinHash(storedHash);
    }
  }, []);

  // Set style variables or body bg color based on active palette
  useEffect(() => {
    if (vaultData) {
      const tokens = getColorTokens(vaultData.theme);
      document.body.className = `${tokens.bg} transition-colors duration-500`;
    } else {
      document.body.className = 'bg-zinc-950';
    }
  }, [vaultData]);

  // Decryption callback handling from UI passcode dial
  const handleUnlockAndDecrypt = (pin: string): boolean => {
    const encryptedVault = localStorage.getItem('echelon_vault_encrypted');
    
    if (encryptedVault) {
      const decryptedString = decryptData(encryptedVault, pin);
      if (decryptedString) {
        try {
          const parsedData = JSON.parse(decryptedString) as EchelonState;
          setVaultData(parsedData);
          setActivePin(pin);
          setIsLocked(false);
          return true;
        } catch (e) {
          console.error('Decrypted payload is corrupted:', e);
        }
      }
    } else {
      // If there are no stores, but PIN matching exists, try checking hash match to restore defaults
      const hashVal = hashPin(pin);
      const storedHash = localStorage.getItem('echelon_pin_hash');
      if (storedHash && hashVal === storedHash) {
        // Safe key recovery defaults
        const defaults = createInitialState();
        defaults.pinHash = hashVal;
        
        const payloadHex = encryptData(JSON.stringify(defaults), pin);
        localStorage.setItem('echelon_vault_encrypted', payloadHex);
        
        setVaultData(defaults);
        setActivePin(pin);
        setIsLocked(false);
        return true;
      }
    }
    return false;
  };

  // Set Access PIN initially
  const handleSetupNewPIN = (newPin: string) => {
    const hashed = hashPin(newPin);
    localStorage.setItem('echelon_pin_hash', hashed);
    setPinHash(hashed);

    // Initial state construct
    const initialConfig = createInitialState();
    initialConfig.pinHash = hashed;
    initialConfig.isLocked = false;

    // Encrypt defaults using PIN
    const encryptedPayload = encryptData(JSON.stringify(initialConfig), newPin);
    localStorage.setItem('echelon_vault_encrypted', encryptedPayload);

    setVaultData(initialConfig);
    setActivePin(newPin);
    setIsLocked(false);
  };

  // Helper routine to save updated state payload back into offline encrypter
  const saveVaultData = (updatedState: EchelonState) => {
    if (!activePin) return;
    const payload = encryptData(JSON.stringify(updatedState), activePin);
    localStorage.setItem('echelon_vault_encrypted', payload);
    setVaultData(updatedState);
  };

  // Log outputs/lock out
  const handleLockVault = () => {
    setIsLocked(true);
    setActivePin('');
    // Clear data from active state to maintain secure containment
    setVaultData(null);
  };

  // Master reset to defaults for pleasant sandbox evaluations
  const handlePurgeAndResetAll = () => {
    if (window.confirm('WARNING: This will format your secure local storage vault. Do you wish to continue?')) {
      localStorage.removeItem('echelon_pin_hash');
      localStorage.removeItem('echelon_vault_encrypted');
      setPinHash('');
      setVaultData(null);
      setIsLocked(true);
      setActivePin('');
      window.location.reload();
    }
  };

  // State coordination operators:
  const handleAddAsset = (assetData: Omit<Asset, 'id' | 'lastUpdated'>) => {
    if (!vaultData) return;
    const newAsset: Asset = {
      ...assetData,
      id: `ast-${Date.now()}`,
      lastUpdated: new Date().toISOString(),
    };
    const nextState = {
      ...vaultData,
      assets: [...vaultData.assets, newAsset],
    };
    saveVaultData(nextState);
  };

  const handleUpdateAssetValue = (id: string, value: number, returns: number, annualGrowthRate?: number) => {
    if (!vaultData) return;
    const nextAssets = vaultData.assets.map(a => 
      a.id === id ? { ...a, currentValue: value, realisedReturns: returns, annualGrowthRate, lastUpdated: new Date().toISOString() } : a
    );
    const nextState = {
      ...vaultData,
      assets: nextAssets,
    };
    saveVaultData(nextState);
  };

  const handleRemoveAsset = (id: string) => {
    if (!vaultData) return;
    const nextState = {
      ...vaultData,
      assets: vaultData.assets.filter(a => a.id !== id),
    };
    saveVaultData(nextState);
  };

  const handleAddLoan = (loanData: Omit<Loan, 'id' | 'lastUpdated'>) => {
    if (!vaultData) return;
    const newLoan: Loan = {
      ...loanData,
      id: `ln-${Date.now()}`,
      lastUpdated: new Date().toISOString(),
    };
    const nextState = {
      ...vaultData,
      loans: [...vaultData.loans, newLoan],
    };
    saveVaultData(nextState);
  };

  const handleAddLoanRepayment = (id: string, amount: number) => {
    if (!vaultData) return;
    const nextLoans = vaultData.loans.map(l => 
      l.id === id ? { ...l, manualPayments: l.manualPayments + amount, lastUpdated: new Date().toISOString() } : l
    );
    const nextState = {
      ...vaultData,
      loans: nextLoans,
    };
    saveVaultData(nextState);
  };

  const handleRemoveLoan = (id: string) => {
    if (!vaultData) return;
    const nextState = {
      ...vaultData,
      loans: vaultData.loans.filter(l => l.id !== id),
    };
    saveVaultData(nextState);
  };

  const handleConfigureBudget = (amount: number, period: BudgetPeriod, alertPercent: number) => {
    if (!vaultData) return;
    const nextState = {
      ...vaultData,
      budget: {
        ...vaultData.budget,
        amount,
        period,
        spendingLimitAlertPercent: alertPercent,
      },
    };
    saveVaultData(nextState);
  };

  const handleAddExpense = (expenseData: Omit<Expense, 'id'>) => {
    if (!vaultData) return;
    const newExpense: Expense = {
      ...expenseData,
      id: `ex-${Date.now()}`,
    };
    const nextState = {
      ...vaultData,
      expenses: [...vaultData.expenses, newExpense],
    };
    saveVaultData(nextState);
  };

  const handleRemoveExpense = (id: string) => {
    if (!vaultData) return;
    const nextState = {
      ...vaultData,
      expenses: vaultData.expenses.filter(e => e.id !== id),
    };
    saveVaultData(nextState);
  };

  const handleAddGoal = (goalData: Omit<FinancialGoal, 'id'>) => {
    if (!vaultData) return;
    const newGoal: FinancialGoal = {
      ...goalData,
      id: `gl-${Date.now()}`,
    };
    const nextState = {
      ...vaultData,
      goals: [...vaultData.goals, newGoal],
    };
    saveVaultData(nextState);
  };

  const handleRemoveGoal = (id: string) => {
    if (!vaultData) return;
    const nextState = {
      ...vaultData,
      goals: vaultData.goals.filter(g => g.id !== id),
    };
    saveVaultData(nextState);
  };

  const handleSetMonthlyEarnings = (val: number) => {
    if (!vaultData) return;
    const nextState = {
      ...vaultData,
      monthlyEarnings: val,
    };
    saveVaultData(nextState);
  };

  const handleChangeTheme = (theme: EchelonTheme) => {
    if (!vaultData) return;
    const nextState = {
      ...vaultData,
      theme,
    };
    saveVaultData(nextState);
  };

  // Month end reset callback
  const handleTriggerMonthEndReset = () => {
    if (!vaultData) return;
    const nextState = {
      ...vaultData,
      expenses: [], // Reset budget expenses ledger
      monthlyEarnings: vaultData.monthlyEarnings, // retain earnings cap
      budget: {
        ...vaultData.budget,
        lastResetDate: new Date().toISOString(), // Track reset stamp
      }
    };
    saveVaultData(nextState);
  };

  // Manual export click downloads
  const handleExportCSV = () => {
    if (!vaultData) return;
    const rawData = generateCSVData(vaultData);
    downloadBlob(rawData, 'Echelon_Treasury_Manual_Export.csv', 'text/csv');
  };

  const handleExportPDF = () => {
    if (!vaultData) return;
    const htmlReport = generateHTMLReport(vaultData);
    downloadBlob(htmlReport, 'Echelon_Treasury_Manual_Assessment_Report.html', 'text/html');
  };

  // If locked or no pin set, render the secure Pin code locker screen
  if (isLocked || !vaultData) {
    return (
      <PasscodeScreen
        theme={{ mode: 'dark', palette: 'black' }} // Defaults locked to extreme premium black obsidian theme
        pinHash={pinHash}
        onUnlock={handleUnlockAndDecrypt}
        onSetPin={handleSetupNewPIN}
      />
    );
  }

  // Active theme parameters
  const tokens = getColorTokens(vaultData.theme);
  
  // Calculate aggregate portfolio values for goal timetables
  const totalAssetsVal = vaultData.assets.reduce((sum, a) => sum + a.currentValue, 0);
  const totalLentVal = vaultData.loans
    .filter(l => l.type === LoanType.LENT)
    .reduce((sum, l) => sum + calculateLoanCurrentBalance(l), 0);
  const totalBorrowedVal = vaultData.loans
    .filter(l => l.type === LoanType.BORROWED)
    .reduce((sum, l) => sum + calculateLoanCurrentBalance(l), 0);
  
  const totalNetWorth = totalAssetsVal + totalLentVal - totalBorrowedVal;
  const rates = calculateWealthRates(vaultData.assets, vaultData.loans, vaultData.monthlyEarnings, vaultData.expenses, totalNetWorth);

  return (
    <div className={`min-h-screen ${tokens.bg} pb-16 transition-colors duration-500 text-stone-100 relative`}>
      
      {/* 1. SECURE TOP NAVIGATION HEADER */}
      <header className={`sticky top-0 z-30 border-b backdrop-blur-md bg-opacity-80 py-4 max-w-7xl mx-auto px-4 ${tokens.card}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-amber-500 rounded-xl flex items-center justify-center border border-amber-500/20 shadow-md">
              <Coins className="h-5 w-5 text-zinc-950 font-bold" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight font-display text-white">
                ECHELON <span className="text-amber-500 text-xs font-mono font-bold ml-1 tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">BUILD QUIET WEALTH</span>
              </h1>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-stone-400 font-mono font-bold uppercase tracking-wider">SECURE CLIENT-SIDE SANDBOX MODE</span>
              </div>
            </div>
          </div>

          {/* Core Controls */}
          <div className="flex items-center gap-2">
            
            {/* Download dataset buttons */}
            <button
              type="button"
              id="export-csv-top-btn"
              onClick={handleExportCSV}
              className={`p-2 rounded-xl border ${tokens.buttonBg} transition-all`}
              title="Download CSV Audit"
            >
              <FileSpreadsheet className="h-4 w-4" />
            </button>

            <button
              type="button"
              id="export-pdf-top-btn"
              onClick={handleExportPDF}
              className={`p-2 rounded-xl border ${tokens.buttonBg} transition-all`}
              title="Save printable PDF"
            >
              <Download className="h-4 w-4" />
            </button>

            {/* Lock button */}
            <button
              type="button"
              id="lock-sessions-btn"
              onClick={handleLockVault}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 border border-stone-800 hover:border-amber-500/30 text-stone-300 rounded-xl text-xs font-mono font-bold transition-all"
              title="Encrypt and lock out active session logs"
            >
              <LogOut className="h-4 w-4 text-amber-500" />
              <span className="hidden sm:inline">Lock Vault</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN WORKSPACE SECTION */}
      <main className="max-w-7xl mx-auto px-4 mt-8 space-y-8">
        
        {/* Theme Settings controller */}
        <ThemeSelector
          theme={vaultData.theme}
          onChangeTheme={handleChangeTheme}
        />

        {/* Dynamic Warning Alert for Local sandboxing */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-stone-800 text-stone-400 text-xs flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-3 leading-snug">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-amber-500 shrink-0" />
            <span>
              <strong>Private Local Encryption Enabled:</strong> Your private wealth ledgers are salted and ciphered locally inside this browser namespace. Feel free to purge databases or generate manual audits anytime.
            </span>
          </div>
          <button
            type="button"
            id="purge-state-re-btn"
            onClick={handlePurgeAndResetAll}
            className="text-[10px] uppercase font-bold text-red-500 hover:text-red-400 shrink-0 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all"
          >
            Clear Ledger DB & Reset PIN
          </button>
        </div>

        {/* 2. OVERALL PORTFOLIO NETWORTH VELOCITY */}
        <HoldingSummary
          theme={vaultData.theme}
          assets={vaultData.assets}
          loans={vaultData.loans}
          monthlyEarnings={vaultData.monthlyEarnings}
          expenses={vaultData.expenses}
          onSetMonthlyEarnings={handleSetMonthlyEarnings}
        />

        {/* 2.5 COGNITIVE AI INSIGHTS MODULE */}
        <AIInsights
          theme={vaultData.theme}
          assets={vaultData.assets}
          loans={vaultData.loans}
          monthlyEarnings={vaultData.monthlyEarnings}
          expenses={vaultData.expenses}
        />

        {/* 3. ASSETS REGISTER */}
        <AssetManager
          theme={vaultData.theme}
          assets={vaultData.assets}
          onAddAsset={handleAddAsset}
          onUpdateAssetValue={handleUpdateAssetValue}
          onRemoveAsset={handleRemoveAsset}
        />

        {/* 4. AUTO-COMPOUNDER DEBTS RELATIONSHIPS */}
        <LoanCompounder
          theme={vaultData.theme}
          loans={vaultData.loans}
          onAddLoan={handleAddLoan}
          onAddLoanRepayment={handleAddLoanRepayment}
          onRemoveLoan={handleRemoveLoan}
        />

        {/* 5. SMART EXPENSES AND BUDGET TERMINAL */}
        <BudgetManager
          theme={vaultData.theme}
          budget={vaultData.budget}
          expenses={vaultData.expenses}
          onConfigureBudget={handleConfigureBudget}
          onAddExpense={handleAddExpense}
          onRemoveExpense={handleRemoveExpense}
          onTriggerMonthEndReset={handleTriggerMonthEndReset}
        />

        {/* 6. TIMELINE PROJECTIONS AND GOAL MILESTONES */}
        <GoalMilestones
          theme={vaultData.theme}
          goals={vaultData.goals}
          totalPortfolioValue={totalNetWorth}
          netYearlyFlow={rates.netPerYear}
          onAddGoal={handleAddGoal}
          onRemoveGoal={handleRemoveGoal}
        />

      </main>

      {/* FOOTER METRICS */}
      <footer className="max-w-7xl mx-auto px-4 mt-16 pt-8 border-t border-stone-800/15 dark:border-stone-100/10 text-center text-xs text-stone-500 font-mono">
        <p>Echelon: Build Quiet Wealth &bull; Confidential Personal Ledger Client</p>
        <p className="mt-1">Encrypted matching signatures &bull; Supports INR (₹) exclusively &bull; v2.4.0 Offline</p>
      </footer>

    </div>
  );
}
