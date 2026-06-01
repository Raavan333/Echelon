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
  archivedReportMonths: [],
});

export default function App() {
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [pinHash, setPinHash] = useState<string>('');
  const [activePin, setActivePin] = useState<string>('');
  const [vaultData, setVaultData] = useState<EchelonState | null>(null);

  useEffect(() => {
    const storedHash = localStorage.getItem('echelon_pin_hash');
    if (storedHash) setPinHash(storedHash);
  }, []);

  useEffect(() => {
    if (vaultData) {
      const tokens = getColorTokens(vaultData.theme);
      document.body.className = `${tokens.bg} transition-colors duration-500`;
    } else {
      document.body.className = 'bg-zinc-950';
    }
  }, [vaultData]);

  const handleUnlockAndDecrypt = (pin: string): boolean => {
    const encryptedVault = localStorage.getItem('echelon_vault_encrypted');
    if (encryptedVault) {
      const decryptedString = decryptData(encryptedVault, pin);
      if (decryptedString) {
        try {
          const parsedData = JSON.parse(decryptedString) as EchelonState;
          setVaultData(parsedData); setActivePin(pin); setIsLocked(false);
          return true;
        } catch (e) { console.error(e); }
      }
    } else {
      const hashVal = hashPin(pin);
      const storedHash = localStorage.getItem('echelon_pin_hash');
      if (storedHash && hashVal === storedHash) {
        const defaults = createInitialState();
        defaults.pinHash = hashVal;
        localStorage.setItem('echelon_vault_encrypted', encryptData(JSON.stringify(defaults), pin));
        setVaultData(defaults); setActivePin(pin); setIsLocked(false);
        return true;
      }
    }
    return false;
  };

  const handleSetupNewPIN = (newPin: string) => {
    const hashed = hashPin(newPin);
    localStorage.setItem('echelon_pin_hash', hashed);
    setPinHash(hashed);
    const initialConfig = createInitialState();
    initialConfig.pinHash = hashed;
    initialConfig.isLocked = false;
    localStorage.setItem('echelon_vault_encrypted', encryptData(JSON.stringify(initialConfig), newPin));
    setVaultData(initialConfig); setActivePin(newPin); setIsLocked(false);
  };

const saveVaultData = (updatedState: EchelonState) => {
    if (!activePin) return;
    localStorage.setItem('echelon_vault_encrypted', encryptData(JSON.stringify(updatedState), activePin));
    setVaultData(updatedState);
  };

  const handleLockVault = () => { setIsLocked(true); setActivePin(''); setVaultData(null); };

  const handlePurgeAndResetAll = () => {
    if (window.confirm('WARNING: This will wipe your vault. Continue?')) {
      localStorage.removeItem('echelon_pin_hash');
      localStorage.removeItem('echelon_vault_encrypted');
      setPinHash(''); setVaultData(null); setIsLocked(true); setActivePin('');
      window.location.reload();
    }
  };

  const handleAddAsset = (assetData: Omit<Asset, 'id' | 'lastUpdated'>) => {
    if (!vaultData) return;
    saveVaultData({ ...vaultData, assets: [...vaultData.assets, { ...assetData, id: `ast-${Date.now()}`, lastUpdated: new Date().toISOString() }] });
  };
  const handleUpdateAssetValue = (id: string, value: number, returns: number, annualGrowthRate?: number) => {
    if (!vaultData) return;
    saveVaultData({ ...vaultData, assets: vaultData.assets.map(a => a.id === id ? { ...a, currentValue: value, realisedReturns: returns, annualGrowthRate, lastUpdated: new Date().toISOString() } : a) });
  };
  const handleRemoveAsset = (id: string) => { if (!vaultData) return; saveVaultData({ ...vaultData, assets: vaultData.assets.filter(a => a.id !== id) }); };
  const handleAddLoan = (loanData: Omit<Loan, 'id' | 'lastUpdated'>) => {
    if (!vaultData) return;
    saveVaultData({ ...vaultData, loans: [...vaultData.loans, { ...loanData, id: `ln-${Date.now()}`, lastUpdated: new Date().toISOString() }] });
  };
  const handleAddLoanRepayment = (id: string, amount: number) => {
    if (!vaultData) return;
    saveVaultData({ ...vaultData, loans: vaultData.loans.map(l => l.id === id ? { ...l, manualPayments: l.manualPayments + amount, lastUpdated: new Date().toISOString() } : l) });
  };
  const handleRemoveLoan = (id: string) => { if (!vaultData) return; saveVaultData({ ...vaultData, loans: vaultData.loans.filter(l => l.id !== id) }); };
  const handleConfigureBudget = (amount: number, period: BudgetPeriod, alertPercent: number) => {
    if (!vaultData) return;
    saveVaultData({ ...vaultData, budget: { ...vaultData.budget, amount, period, spendingLimitAlertPercent: alertPercent } });
  };
  const handleAddExpense = (expenseData: Omit<Expense, 'id'>) => {
    if (!vaultData) return;
    saveVaultData({ ...vaultData, expenses: [...vaultData.expenses, { ...expenseData, id: `ex-${Date.now()}` }] });
  };
  const handleRemoveExpense = (id: string) => { if (!vaultData) return; saveVaultData({ ...vaultData, expenses: vaultData.expenses.filter(e => e.id !== id) }); };
  const handleAddGoal = (goalData: Omit<FinancialGoal, 'id'>) => {
    if (!vaultData) return;
    saveVaultData({ ...vaultData, goals: [...vaultData.goals, { ...goalData, id: `gl-${Date.now()}` }] });
  };
  const handleRemoveGoal = (id: string) => { if (!vaultData) return; saveVaultData({ ...vaultData, goals: vaultData.goals.filter(g => g.id !== id) }); };
  const handleSetMonthlyEarnings = (val: number) => { if (!vaultData) return; saveVaultData({ ...vaultData, monthlyEarnings: val }); };
  const handleChangeTheme = (theme: EchelonTheme) => { if (!vaultData) return; saveVaultData({ ...vaultData, theme }); };
  const handleTriggerMonthEndReset = () => {
    if (!vaultData) return;
    saveVaultData({ ...vaultData, expenses: [], budget: { ...vaultData.budget, lastResetDate: new Date().toISOString() } });
  };
  const handleExportCSV = () => { if (!vaultData) return; downloadBlob(generateCSVData(vaultData), 'Echelon_Export.csv', 'text/csv'); };
  const handleExportPDF = () => { if (!vaultData) return; downloadBlob(generateHTMLReport(vaultData), 'Echelon_Report.html', 'text/html'); };

  if (isLocked || !vaultData) {
    return <PasscodeScreen theme={{ mode: 'dark', palette: 'black' }} pinHash={pinHash} onUnlock={handleUnlockAndDecrypt} onSetPin={handleSetupNewPIN} />;
  }

  const tokens = getColorTokens(vaultData.theme);
  const totalAssetsVal = vaultData.assets.reduce((sum, a) => sum + a.currentValue, 0);
  const totalLentVal = vaultData.loans.filter(l => l.type === LoanType.LENT).reduce((sum, l) => sum + calculateLoanCurrentBalance(l), 0);
  const totalBorrowedVal = vaultData.loans.filter(l => l.type === LoanType.BORROWED).reduce((sum, l) => sum + calculateLoanCurrentBalance(l), 0);
  const totalNetWorth = totalAssetsVal + totalLentVal - totalBorrowedVal;
  const rates = calculateWealthRates(vaultData.assets, vaultData.loans, vaultData.monthlyEarnings, vaultData.expenses, totalNetWorth);

  return (
    <div className={`min-h-screen ${tokens.bg} pb-16 transition-colors duration-500 text-stone-100`}>
      <header className={`sticky top-0 z-30 border-b backdrop-blur-md bg-opacity-80 py-4 max-w-7xl mx-auto px-4 ${tokens.card}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <Coins className="h-5 w-5 text-zinc-950" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white">
                ECHELON <span className="text-amber-500 text-xs font-mono font-bold ml-1 tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">BUILD QUIET WEALTH</span>
              </h1>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-stone-400 font-mono font-bold uppercase tracking-wider">SECURE OFFLINE MODE</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleExportCSV} className={`p-2 rounded-xl border ${tokens.buttonBg}`}><FileSpreadsheet className="h-4 w-4" /></button>
            <button type="button" onClick={handleExportPDF} className={`p-2 rounded-xl border ${tokens.buttonBg}`}><Download className="h-4 w-4" /></button>
            <button type="button" onClick={handleLockVault} className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 border border-stone-800 text-stone-300 rounded-xl text-xs font-mono font-bold">
              <LogOut className="h-4 w-4 text-amber-500" /><span className="hidden sm:inline">Lock Vault</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8 space-y-8">
        <ThemeSelector theme={vaultData.theme} onChangeTheme={handleChangeTheme} />
        <div className="p-4 rounded-2xl bg-zinc-900 border border-stone-800 text-stone-400 text-xs flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-amber-500 shrink-0" />
            <span><strong>Private Local Encryption Enabled:</strong> Your wealth ledgers are encrypted and stored only on this device.</span>
          </div>
          <button type="button" onClick={handlePurgeAndResetAll} className="text-[10px] uppercase font-bold text-red-500 border border-red-500/20 bg-red-500/5 px-3 py-1.5 rounded-lg">
            Clear Ledger & Reset PIN
          </button>
        </div>
        <HoldingSummary theme={vaultData.theme} assets={vaultData.assets} loans={vaultData.loans} monthlyEarnings={vaultData.monthlyEarnings} expenses={vaultData.expenses} onSetMonthlyEarnings={handleSetMonthlyEarnings} />
        <AssetManager theme={vaultData.theme} assets={vaultData.assets} onAddAsset={handleAddAsset} onUpdateAssetValue={handleUpdateAssetValue} onRemoveAsset={handleRemoveAsset} />
        <LoanCompounder theme={vaultData.theme} loans={vaultData.loans} onAddLoan={handleAddLoan} onAddLoanRepayment={handleAddLoanRepayment} onRemoveLoan={handleRemoveLoan} />
        <BudgetManager theme={vaultData.theme} budget={vaultData.budget} expenses={vaultData.expenses} onConfigureBudget={handleConfigureBudget} onAddExpense={handleAddExpense} onRemoveExpense={handleRemoveExpense} onTriggerMonthEndReset={handleTriggerMonthEndReset} />
        <GoalMilestones theme={vaultData.theme} goals={vaultData.goals} totalPortfolioValue={totalNetWorth} netYearlyFlow={rates.netPerYear} onAddGoal={handleAddGoal} onRemoveGoal={handleRemoveGoal} />
      </main>

      <footer className="max-w-7xl mx-auto px-4 mt-16 pt-8 border-t border-stone-800/15 text-center text-xs text-stone-500 font-mono">
        <p>Echelon: Build Quiet Wealth • Fully Offline • Encrypted on Device • v2.4.0</p>
      </footer>
    </div>
  );
}
