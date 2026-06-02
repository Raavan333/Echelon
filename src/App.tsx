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
  HelpCircle,
  Activity,
  RotateCcw
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
  EchelonTheme,
  BudgetCategoryLimit,
  CustomField
} from './types';

// Child components
import PasscodeScreen from './components/PasscodeScreen';
import ThemeSelector from './components/ThemeSelector';
import HoldingSummary from './components/HoldingSummary';
import AIInsights from './components/AIInsights';
import AssetManager from './components/AssetManager';
import { EchelonIcon } from './components/CoolIcons';
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
  assets: [],
  loans: [],
  goals: [],
  budget: {
    id: 'b-1',
    period: BudgetPeriod.MONTHLY,
    amount: 0,
    spendingLimitAlertPercent: 80,
    lastResetDate: new Date().toISOString(),
  },
  expenses: [],
  monthlyEarnings: 0,
  theme: {
    mode: 'dark',
    palette: 'elegant-dark',
  },
  archivedReportMonths: [],
  budgetCategoryLimits: [],
  customFields: [],
  selectedGalleryIcon: 'stealth-matte-gold',
});

export default function App() {
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [pinHash, setPinHash] = useState<string>('');
  const [activePin, setActivePin] = useState<string>(''); // Kept safe in-memory to re-encrypt on modifications
  const [vaultData, setVaultData] = useState<EchelonState | null>(null);

  // Read non-cryptographic public icon configuration instantly for passcode screen fallback
  const [publicIcon, setPublicIcon] = useState<'stealth-matte-gold' | 'vanguard-black-steel' | 'regal-obsidian-gold'>(() => {
    try {
      const stored = localStorage.getItem('echelon_public_icon');
      if (stored) {
        return stored as any;
      }
    } catch (e) {}
    return 'stealth-matte-gold';
  });

  // Bottom Navigation state
  const [activeTab, setActiveTab] = useState<'portfolio' | 'assets' | 'loans' | 'budget' | 'ai'>('portfolio');

  // Settings Panel Overlay state
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<'profile' | 'themes' | 'rules' | 'backups' | 'credits'>('profile');
  const [modalFieldsLabel, setModalFieldsLabel] = useState<string>('');
  const [modalFieldsVal, setModalFieldsVal] = useState<string>('');
  const [modalCatName, setModalCatName] = useState<string>('');
  const [modalCatLimit, setModalCatLimit] = useState<string>('');
  const [modalPasteArea, setModalPasteArea] = useState<string>('');
  const [newThemeName, setNewThemeName] = useState<string>('');
  const [newThemeColor, setNewThemeColor] = useState<string>('#f59e0b');
  const [newThemeBgMode, setNewThemeBgMode] = useState<'dark' | 'light'>('dark');

  // Undo System states
  const [undoStack, setUndoStack] = useState<EchelonState[]>([]);
  const [lastActionMessage, setLastActionMessage] = useState<string>('');

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
          
          // Sync public icon unencrypted so they appear on Login Screen instantly
          const icon = parsedData.selectedGalleryIcon || 'stealth-matte-gold';
          localStorage.setItem('echelon_public_icon', icon);
          setPublicIcon(icon);
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

    // Sync public icon unencrypted so they appear on Login Screen instantly
    const icon = updatedState.selectedGalleryIcon || 'stealth-matte-gold';
    localStorage.setItem('echelon_public_icon', icon);
    setPublicIcon(icon);
  };

  // Centralized State Modifier with Automatic Undo capability
  const mutateVaultData = (actionMsg: string, updater: (current: EchelonState) => EchelonState) => {
    if (!vaultData) return;
    const clone = JSON.parse(JSON.stringify(vaultData)) as EchelonState;
    setUndoStack(prev => [clone, ...prev].slice(0, 10));
    setLastActionMessage(actionMsg);
    
    const nextState = updater(vaultData);
    saveVaultData(nextState);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[0];
    setUndoStack(prev => prev.slice(1));
    saveVaultData(previous);
    setLastActionMessage('Reverted last action successfully!');
    setTimeout(() => {
      setLastActionMessage('');
    }, 4000);
  };

  const handleUpdateCategoryLimits = (limits: BudgetCategoryLimit[]) => {
    mutateVaultData(`Modified Category Limits`, (current) => ({
      ...current,
      budgetCategoryLimits: limits,
    }));
  };

  const handleAddCustomField = (label: string, value: string) => {
    if (!vaultData) return;
    const nextFields = [...(vaultData.customFields || []).filter(cf => cf.label !== label), { label, value }];
    const nextState = {
      ...vaultData,
      customFields: nextFields,
    };
    saveVaultData(nextState);
  };

  const handleRemoveCustomField = (label: string) => {
    if (!vaultData) return;
    const nextFields = (vaultData.customFields || []).filter(cf => cf.label !== label);
    const nextState = {
      ...vaultData,
      customFields: nextFields,
    };
    saveVaultData(nextState);
  };

  const handleUpdateGalleryIcon = (icon: 'gold-shield' | 'watch-chrono' | 'stealth-carbon') => {
    if (!vaultData) return;
    const nextState = {
      ...vaultData,
      selectedGalleryIcon: icon,
    };
    saveVaultData(nextState);
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard successfully!");
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
    const newAsset: Asset = {
      ...assetData,
      id: `ast-${Date.now()}`,
      lastUpdated: new Date().toISOString(),
    };
    mutateVaultData(`Added Asset: ${assetData.name}`, (current) => ({
      ...current,
      assets: [...current.assets, newAsset],
    }));
  };

  const handleUpdateAssetValue = (id: string, value: number, returns: number, annualGrowthRate?: number) => {
    mutateVaultData(`Updated Asset Value`, (current) => ({
      ...current,
      assets: current.assets.map(a => 
        a.id === id ? { ...a, currentValue: value, realisedReturns: returns, annualGrowthRate, lastUpdated: new Date().toISOString() } : a
      ),
    }));
  };

  const handleUpdateAssetFull = (id: string, assetData: Omit<Asset, 'id' | 'lastUpdated'>) => {
    mutateVaultData(`Edited Asset: ${assetData.name}`, (current) => ({
      ...current,
      assets: current.assets.map(a => 
        a.id === id ? { ...a, ...assetData, lastUpdated: new Date().toISOString() } : a
      ),
    }));
  };

  const handleRemoveAsset = (id: string) => {
    const assetObj = vaultData.assets.find(a => a.id === id);
    const label = assetObj ? assetObj.name : 'Asset';
    mutateVaultData(`Deleted Asset: ${label}`, (current) => ({
      ...current,
      assets: current.assets.filter(a => a.id !== id),
    }));
  };

  const handleAddLoan = (loanData: Omit<Loan, 'id' | 'lastUpdated'>) => {
    const newLoan: Loan = {
      ...loanData,
      id: `ln-${Date.now()}`,
      lastUpdated: new Date().toISOString(),
    };
    mutateVaultData(`Added Debt: ${loanData.name}`, (current) => ({
      ...current,
      loans: [...current.loans, newLoan],
    }));
  };

  const handleUpdateLoanFull = (id: string, loanData: Omit<Loan, 'id' | 'lastUpdated'>) => {
    mutateVaultData(`Edited Debt: ${loanData.name}`, (current) => ({
      ...current,
      loans: current.loans.map(l => 
        l.id === id ? { ...l, ...loanData, lastUpdated: new Date().toISOString() } : l
      ),
    }));
  };

  const handleAddLoanRepayment = (id: string, amount: number) => {
    const loanObj = vaultData.loans.find(l => l.id === id);
    const label = loanObj ? loanObj.name : 'Debt';
    mutateVaultData(`Logged Repayment for ${label}`, (current) => ({
      ...current,
      loans: current.loans.map(l => 
        l.id === id ? { ...l, manualPayments: l.manualPayments + amount, lastUpdated: new Date().toISOString() } : l
      ),
    }));
  };

  const handleRemoveLoan = (id: string) => {
    const loanObj = vaultData.loans.find(l => l.id === id);
    const label = loanObj ? loanObj.name : 'Debt';
    mutateVaultData(`Deleted Debt: ${label}`, (current) => ({
      ...current,
      loans: current.loans.filter(l => l.id !== id),
    }));
  };

  const handleConfigureBudget = (amount: number, period: BudgetPeriod, alertPercent: number) => {
    mutateVaultData(`Reconfigured Budget Limits`, (current) => ({
      ...current,
      budget: {
        ...current.budget,
        amount,
        period,
        spendingLimitAlertPercent: alertPercent,
      },
    }));
  };

  const handleAddExpense = (expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `ex-${Date.now()}`,
    };
    mutateVaultData(`Logged Expense for ${expenseData.category}`, (current) => ({
      ...current,
      expenses: [...current.expenses, newExpense],
    }));
  };

  const handleUpdateExpenseFull = (id: string, expenseData: Omit<Expense, 'id'>) => {
    mutateVaultData(`Edited Expense in ${expenseData.category}`, (current) => ({
      ...current,
      expenses: current.expenses.map(e => 
        e.id === id ? { ...e, ...expenseData } : e
      ),
    }));
  };

  const handleRemoveExpense = (id: string) => {
    const expObj = vaultData.expenses.find(e => e.id === id);
    const label = expObj ? expObj.category : 'Expense';
    mutateVaultData(`Deleted Expense: ${label}`, (current) => ({
      ...current,
      expenses: current.expenses.filter(e => e.id !== id),
    }));
  };

  const handleAddGoal = (goalData: Omit<FinancialGoal, 'id'>) => {
    const newGoal: FinancialGoal = {
      ...goalData,
      id: `gl-${Date.now()}`,
    };
    mutateVaultData(`Added Goal: ${goalData.name}`, (current) => ({
      ...current,
      goals: [...current.goals, newGoal],
    }));
  };

  const handleUpdateGoalFull = (id: string, goalData: Omit<FinancialGoal, 'id'>) => {
    mutateVaultData(`Edited Goal: ${goalData.name}`, (current) => ({
      ...current,
      goals: current.goals.map(g => 
        g.id === id ? { ...g, ...goalData } : g
      ),
    }));
  };

  const handleRemoveGoal = (id: string) => {
    const goalObj = vaultData.goals.find(g => g.id === id);
    const label = goalObj ? goalObj.name : 'Goal';
    mutateVaultData(`Deleted Goal: ${label}`, (current) => ({
      ...current,
      goals: current.goals.filter(g => g.id !== id),
    }));
  };

  const handleSetMonthlyEarnings = (val: number) => {
    mutateVaultData(`Adjusted Inflow settings`, (current) => ({
      ...current,
      monthlyEarnings: val,
    }));
  };

  const handleChangeTheme = (theme: EchelonTheme) => {
    if (!vaultData) return;
    const nextState: EchelonState = {
      ...vaultData,
      theme,
    };
    // If selecting a default/native palette, synchronize accent color
    if (theme.palette === 'black') {
      nextState.activeAccentColor = '#f59e0b';
    } else if (theme.palette === 'silver') {
      nextState.activeAccentColor = '#2563eb';
    } else if (theme.palette === 'blue') {
      nextState.activeAccentColor = '#14b8a6';
    } else if (theme.palette === 'elegant-dark') {
      nextState.activeAccentColor = '#ffffff';
    }
    saveVaultData(nextState);
  };

  const handleUpdateUserProfile = (name: string) => {
    if (!vaultData) return;
    saveVaultData({
      ...vaultData,
      userName: name,
    });
  };

  const handleUpdateActiveAccentColor = (color: string) => {
    if (!vaultData) return;
    saveVaultData({
      ...vaultData,
      activeAccentColor: color,
    });
  };

  const handleUpdateCurrencySymbol = (sym: string) => {
    if (!vaultData) return;
    saveVaultData({
      ...vaultData,
      currencySymbol: sym,
    });
  };

  const handleUpdateSavingsRule = (amt: number) => {
    if (!vaultData) return;
    saveVaultData({
      ...vaultData,
      customSavingsGoalAmt: amt,
    });
  };

  const handleUpdateSinkStreamOverride = (val: number | undefined) => {
    if (!vaultData) return;
    saveVaultData({
      ...vaultData,
      userOverriddenExpenses: val,
    });
  };

  const handleUpdateCustomAlertRules = (rules: string[]) => {
    if (!vaultData) return;
    saveVaultData({
      ...vaultData,
      customAlertRules: rules,
    });
  };

  const handleAddCustomTheme = (name: string, color: string, bgMode: 'dark' | 'light') => {
    if (!vaultData) return;
    const currentThemes = vaultData.customThemeConfigs || [];
    if (currentThemes.length + 4 >= 10) {
      alert("Theme Limit Reached: You have reached the overall limit of 10 themes. Under security rules, please delete an existing custom theme first.");
      return;
    }
    const newTheme = {
      id: `th-${Date.now()}`,
      name,
      primaryColor: color,
      bgMode,
    };
    saveVaultData({
      ...vaultData,
      theme: {
        mode: bgMode,
        palette: `custom-${newTheme.id}`
      },
      activeAccentColor: color,
      customThemeConfigs: [...currentThemes, newTheme],
    });
  };

  const handleRemoveCustomTheme = (id: string) => {
    if (!vaultData) return;
    const currentThemes = vaultData.customThemeConfigs || [];
    const updatedThemes = currentThemes.filter(t => t.id !== id);
    let nextTheme = vaultData.theme;
    
    // If the active theme was deleted, fall back to default
    if (vaultData.theme.palette === `custom-${id}`) {
      nextTheme = { mode: 'dark', palette: 'elegant-dark' };
    }
    
    saveVaultData({
      ...vaultData,
      theme: nextTheme,
      customThemeConfigs: updatedThemes,
    });
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
        selectedGalleryIcon={publicIcon}
        onResetApp={() => {
          localStorage.clear();
          setPinHash('');
          setVaultData(null);
          setIsLocked(true);
          setActivePin('');
        }}
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

  const activeColor = vaultData.activeAccentColor || '#f59e0b';

  return (
    <div className={`min-h-screen ${tokens.bg} pb-16 transition-colors duration-500 text-stone-100 relative`}>
      <style>{`
        .text-amber-500 { color: ${activeColor} !important; }
        .bg-amber-500 { background-color: ${activeColor} !important; }
        .border-amber-500 { border-color: ${activeColor} !important; }
        .bg-amber-500\\/10 { background-color: ${activeColor}1a !important; }
        .bg-amber-500\\/5 { background-color: ${activeColor}0d !important; }
        .bg-amber-500\\/20 { background-color: ${activeColor}33 !important; }
        .bg-amber-400 { background-color: ${activeColor}dd !important; }
        .text-amber-400 { color: ${activeColor}dd !important; }
        .border-amber-400 { border-color: ${activeColor}dd !important; }
        .border-amber-500\\/20 { border-color: ${activeColor}33 !important; }
        .border-amber-500\\/30 { border-color: ${activeColor}4d !important; }
        .text-amber-500\\/80 { color: ${activeColor}cc !important; }
        .text-amber-500\\/90 { color: ${activeColor}e6 !important; }
        .hover\\:bg-amber-400:hover { background-color: ${activeColor}bb !important; }
        .hover\\:text-amber-400:hover { color: ${activeColor}bb !important; }
        .hover\\:border-amber-500\\/30:hover { border-color: ${activeColor}4d !important; }
        .hover\\:scale-110:hover { transform: scale(1.1); }
      `}</style>
      
      {/* 1. SECURE TOP NAVIGATION HEADER */}
      <header className={`sticky top-0 z-30 border-b backdrop-blur-md bg-opacity-80 py-4 max-w-7xl mx-auto px-4 ${tokens.card}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-[#141517] rounded-xl flex items-center justify-center border border-stone-800 shadow-md p-1 shrink-0">
              <EchelonIcon name={vaultData.selectedGalleryIcon || 'stealth-matte-gold'} size="100%" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight font-display text-white flex items-center flex-wrap">
                ECHELON <span className="whitespace-nowrap inline-block text-amber-500 text-xs font-mono font-bold ml-1 tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">BUILD QUIET WEALTH</span>
              </h1>
            </div>
          </div>

          {/* Core Controls */}
          <div className="flex items-center gap-2">
            
            {/* Settings triggers */}
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="p-2 bg-zinc-900 border border-stone-800 text-stone-300 rounded-xl hover:text-amber-500 hover:border-amber-500/30 transition-all flex items-center gap-1 text-xs font-mono font-bold"
              title="Open Settings & Custom Ledger Configuration"
            >
              <Sliders className="h-4 w-4 text-amber-500" />
              <span className="hidden md:inline">Settings</span>
            </button>

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
        
        {/* 2. DYNAMIC WORKSPACE PAGES */}
        <div className="animate-fade-in pb-24">
          
          {activeTab === 'portfolio' && (
            <div className="space-y-8">
              {/* Custom registered dynamic metrics profile if user set any custom fields */}
              {vaultData.customFields && vaultData.customFields.length > 0 && (
                <div className={`p-4 rounded-2xl border ${tokens.card} border-dashed grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in`}>
                  {vaultData.customFields.map((cf) => (
                    <div key={cf.label} className="p-3 rounded-xl bg-stone-500/5 border border-stone-800/10">
                      <span className="text-[9px] uppercase font-bold text-stone-500 block mb-0.5">{cf.label}</span>
                      <span className="text-xs font-bold text-white block">{cf.value}</span>
                    </div>
                  ))}
                </div>
              )}

              <HoldingSummary
                theme={vaultData.theme}
                assets={vaultData.assets}
                loans={vaultData.loans}
                monthlyEarnings={vaultData.monthlyEarnings}
                expenses={vaultData.expenses}
                onSetMonthlyEarnings={handleSetMonthlyEarnings}
                currencySymbol={vaultData.currencySymbol || '₹'}
                customSavingsGoalAmt={vaultData.customSavingsGoalAmt || 0}
                userOverriddenExpenses={vaultData.userOverriddenExpenses}
                onOpenSettings={() => setShowSettings(true)}
              />

              <GoalMilestones
                theme={vaultData.theme}
                goals={vaultData.goals}
                totalPortfolioValue={totalNetWorth}
                netYearlyFlow={rates.netPerYear}
                onAddGoal={handleAddGoal}
                onRemoveGoal={handleRemoveGoal}
                onUpdateGoal={handleUpdateGoalFull}
                currencySymbol={vaultData.currencySymbol || '₹'}
              />
            </div>
          )}

          {activeTab === 'assets' && (
            <AssetManager
              theme={vaultData.theme}
              assets={vaultData.assets}
              onAddAsset={handleAddAsset}
              onUpdateAssetValue={handleUpdateAssetValue}
              onUpdateAsset={handleUpdateAssetFull}
              onRemoveAsset={handleRemoveAsset}
              currencySymbol={vaultData.currencySymbol || '₹'}
              onOpenSettings={() => setShowSettings(true)}
            />
          )}

          {activeTab === 'loans' && (
            <LoanCompounder
              theme={vaultData.theme}
              loans={vaultData.loans}
              onAddLoan={handleAddLoan}
              onUpdateLoan={handleUpdateLoanFull}
              onAddLoanRepayment={handleAddLoanRepayment}
              onRemoveLoan={handleRemoveLoan}
              currencySymbol={vaultData.currencySymbol || '₹'}
              onOpenSettings={() => setShowSettings(true)}
            />
          )}

          {activeTab === 'budget' && (
            <BudgetManager
              theme={vaultData.theme}
              budget={vaultData.budget}
              expenses={vaultData.expenses}
              budgetCategoryLimits={vaultData.budgetCategoryLimits || []}
              onConfigureBudget={handleConfigureBudget}
              onAddExpense={handleAddExpense}
              onUpdateExpense={handleUpdateExpenseFull}
              onRemoveExpense={handleRemoveExpense}
              onTriggerMonthEndReset={handleTriggerMonthEndReset}
              currencySymbol={vaultData.currencySymbol || '₹'}
              customAlertRules={vaultData.customAlertRules || []}
              onOpenSettings={() => setShowSettings(true)}
              onUpdateCategoryLimits={handleUpdateCategoryLimits}
            />
          )}

          {activeTab === 'ai' && (
            <AIInsights
              theme={vaultData.theme}
              assets={vaultData.assets}
              loans={vaultData.loans}
              monthlyEarnings={vaultData.monthlyEarnings}
              expenses={vaultData.expenses}
              currencySymbol={vaultData.currencySymbol || '₹'}
            />
          )}

        </div>

      </main>



      {/* FLOATING ACTION UNDO TOAST ALERT */}
      {lastActionMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
          <div className="bg-zinc-950/95 border border-amber-500/30 text-stone-200 rounded-xl px-4 py-3 shadow-2xl flex items-center justify-between gap-4 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span>{lastActionMessage}</span>
            </div>
            {undoStack.length > 0 && !lastActionMessage.includes('Reverted') && (
              <button
                type="button"
                onClick={handleUndo}
                className="text-[10px] bg-amber-500 hover:bg-amber-400 text-zinc-950 px-2.5 py-1 rounded-lg font-black flex items-center gap-1 transition-all uppercase tracking-wider active:scale-95"
              >
                <RotateCcw className="h-3 w-3 animate-spin duration-1000" />
                <span>Undo</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SECURE HIGH-CONTRAST BOTTOM NAVIGATION TASKBAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-stone-800/80 px-2 py-3 flex items-center justify-around max-w-lg mx-auto sm:rounded-t-3xl sm:border shadow-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('portfolio')}
          className={`flex flex-col items-center gap-1.5 py-1 px-3.5 rounded-2xl transition-all ${
            activeTab === 'portfolio' ? 'text-amber-500 bg-amber-500/10 font-black' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Coins className="h-5 w-5" />
          <span className="text-[9px] uppercase tracking-wider font-mono font-bold">Portfolio</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assets')}
          className={`flex flex-col items-center gap-1.5 py-1 px-3.5 rounded-2xl transition-all ${
            activeTab === 'assets' ? 'text-amber-500 bg-amber-500/10 font-black' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Compass className="h-5 w-5" />
          <span className="text-[9px] uppercase tracking-wider font-mono font-bold">Assets</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('loans')}
          className={`flex flex-col items-center gap-1.5 py-1 px-3.5 rounded-2xl transition-all ${
            activeTab === 'loans' ? 'text-amber-500 bg-amber-500/10 font-black' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Activity className="h-5 w-5" />
          <span className="text-[9px] uppercase tracking-wider font-mono font-bold">Debts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('budget')}
          className={`flex flex-col items-center gap-1.5 py-1 px-3.5 rounded-2xl transition-all ${
            activeTab === 'budget' ? 'text-amber-500 bg-amber-500/10 font-black' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Wallet className="h-5 w-5" />
          <span className="text-[9px] uppercase tracking-wider font-mono font-bold">Budget</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ai')}
          className={`flex flex-col items-center gap-1.5 py-1 px-3.5 rounded-2xl transition-all ${
            activeTab === 'ai' ? 'text-amber-500 bg-amber-500/10 font-black' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Sparkles className="h-5 w-5" />
          <span className="text-[9px] uppercase tracking-wider font-mono font-bold">AI Insights</span>
        </button>
      </div>

      {/* DYNAMIC SETTINGS VAULT DRAWER MODAL OVERLAY */}
      {showSettings && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-zinc-900 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-stone-100 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-amber-500 animate-pulse" />
                  <span>Echelon Vault Customizations</span>
                </h2>
                <p className="text-xs text-stone-500">Configure visual themes, custom parameters, backups and app galleries</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="settings-logout-btn"
                  onClick={() => {
                    setShowSettings(false);
                    handleLockVault();
                  }}
                  className="px-3.5 py-1.5 bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500 text-rose-400 hover:text-zinc-950 rounded-xl text-xs font-mono font-bold tracking-wider transition-all flex items-center gap-1.5"
                  title="Log out and encrypt session data"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Lock Vault</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-stone-300 rounded-xl text-xs font-semibold hover:text-amber-500 transition-all font-mono"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Seamless Sub-tab Navigators */}
            <div className="flex border-b border-stone-800 overflow-x-auto gap-2 pb-1.5 scrollbar-none">
              {[
                { id: 'profile', label: 'User Profile & Base' },
                { id: 'themes', label: 'Theme Configs' },
                { id: 'rules', label: 'Goals, Sinks & Alerts' },
                { id: 'backups', label: 'Data Backups / Import' },
                { id: 'credits', label: 'Developer Info / Help' }
              ].map((t) => {
                const isActive = settingsTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSettingsTab(t.id as any)}
                    className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase rounded-lg transition-all shrink-0 ${
                      isActive 
                        ? 'bg-amber-500 text-zinc-950 font-black shadow-md' 
                        : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* SUB-TAB A: PROFILE & GENERAL LEDGER BASE */}
            {settingsTab === 'profile' && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-300 block">User / Investor Name (For wealth reports)</label>
                  <input
                    type="text"
                    placeholder="Enter your profile name..."
                    value={vaultData.userName || ''}
                    onChange={(e) => handleUpdateUserProfile(e.target.value)}
                    className="w-full max-w-md px-3.5 py-2 bg-stone-950 border border-stone-800 text-sm text-stone-200 rounded-xl focus:border-amber-500/50 outline-none transition-all font-semibold"
                  />
                  <p className="text-[10px] text-stone-500 italic">This name matches dynamically printed PDF assets allocations logs.</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-stone-850/40">
                  <label className="text-xs font-bold text-stone-300 block">Global Currency Symbol Choice</label>
                  <div className="flex gap-2">
                    {['₹', '$', '€', '£', '¥'].map((sym) => {
                      const isSel = (vaultData.currencySymbol || '₹') === sym;
                      return (
                        <button
                          key={sym}
                          type="button"
                          onClick={() => handleUpdateCurrencySymbol(sym)}
                          className={`w-10 h-10 rounded-xl font-bold font-mono text-xs flex items-center justify-center border transition-all ${
                            isSel 
                              ? 'border-amber-500 bg-amber-500/15 text-amber-400' 
                              : 'border-stone-800 hover:bg-stone-800 text-stone-400'
                          }`}
                        >
                          {sym}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-stone-500">Note: Echelon supports local cash assets tracking in any fiat denomination securely.</p>
                </div>

                {/* SECTION: PREMIUM CUSTOM IDENTITY LAUNCHER & INTERIOR ICONS */}
                <div id="premium-echelon-identity-settings" className="space-y-4 pt-4 border-t border-stone-850/40">
                  <div>
                    <span className="text-xs font-bold text-stone-200 block">Echelon Corporate Icon & Brand Settings</span>
                    <p className="text-[10px] text-stone-500 mt-0.5">Select a unified brand icon. This updates Echelon's signature styling globally: on the lock passcode gate, the dashboard workspace, system headers, and exported PDF/HTML reports.</p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-stone-400 font-mono block">Unified System-Wide Brand Icon</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { key: 'stealth-matte-gold', label: 'Stealth Matte Gold', desc: 'Tactical dark titanium circular luxury shield' },
                        { key: 'vanguard-black-steel', label: 'Vanguard Black Steel', desc: 'Sleek matte watch casing with ruby hour jewels' },
                        { key: 'regal-obsidian-gold', label: 'Regal Royal Gold', desc: 'Polished gold obsidian tourbillon crown with diamonds' },
                      ].map((item) => {
                        const isSelected = (vaultData.selectedGalleryIcon || 'stealth-matte-gold') === item.key;
                        return (
                          <button
                            key={`brand-${item.key}`}
                            type="button"
                            onClick={() => {
                              mutateVaultData(`Changed Unified System Brand Icon`, (prev) => ({
                                ...prev,
                                selectedGalleryIcon: item.key as any
                              }));
                            }}
                            className={`p-3 rounded-2xl text-left border transition-all flex items-center gap-3 ${
                              isSelected ? 'border-amber-500 bg-amber-500/5' : 'border-stone-850 hover:bg-stone-500/5 bg-transparent'
                            }`}
                          >
                            <div className="h-10 w-10 shrink-0 bg-[#141517] rounded-xl border border-stone-800 p-1 flex items-center justify-center shadow">
                              <EchelonIcon name={item.key} size="100%" />
                            </div>
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1 w-full">
                                <span className="font-bold text-[11px] text-white truncate">{item.label}</span>
                                <div className={`h-2.5 w-2.5 rounded-full border shrink-0 ${isSelected ? 'bg-amber-500 border-amber-500' : 'bg-transparent border-stone-700'}`} />
                              </div>
                              <p className="text-[8px] text-stone-500 leading-tight line-clamp-1">{item.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* SECTION: Custom key-value variables configuration */}
                <div className="p-4 bg-stone-500/5 rounded-2xl border border-stone-850/40 space-y-3 mt-2">
                  <span className="text-[10px] uppercase font-bold text-stone-500 font-mono block">Custom Profile Metrics Fields</span>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Label: (e.g. Nationality/Tag)"
                      value={modalFieldsLabel}
                      onChange={(e) => setModalFieldsLabel(e.target.value)}
                      className="w-1/2 px-2.5 py-1.5 bg-stone-950 border border-stone-800 text-xs text-white rounded-lg outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Value: (e.g. NRI/Elite)"
                      value={modalFieldsVal}
                      onChange={(e) => setModalFieldsVal(e.target.value)}
                      className="w-1/2 px-2.5 py-1.5 bg-stone-950 border border-stone-800 text-xs text-white rounded-lg outline-none"
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        if (modalFieldsLabel && modalFieldsVal) {
                          handleAddCustomField(modalFieldsLabel, modalFieldsVal);
                          setModalFieldsLabel('');
                          setModalFieldsVal('');
                        }
                      }}
                      className="px-3 bg-amber-500 text-zinc-950 font-bold text-xs rounded-lg hover:bg-amber-400 shrink-0"
                    >
                      Add
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-32 overflow-y-auto pt-1">
                    {(vaultData.customFields || []).length === 0 ? (
                      <span className="text-[10px] text-stone-500 italic font-mono block">No extra credentials defined. Click add above to populate.</span>
                    ) : (
                      (vaultData.customFields || []).map((cf) => (
                        <div key={cf.label} className="flex items-center justify-between bg-stone-950/40 p-1.5 px-2 rounded-lg text-xs">
                          <span className="font-mono text-stone-400 font-semibold">{cf.label}: <strong className="text-stone-250 text-white">{cf.value}</strong></span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomField(cf.label)}
                            className="text-[9px] text-red-500 hover:text-red-400 font-bold uppercase transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB B: DETAILED THEMING, METALS & SOLID CUSTOM CONFIGS */}
            {settingsTab === 'themes' && (
              <div className="space-y-4 animate-fade-in">
                
                {/* 1. Predefined Metallics Selection */}
                <div>
                  <span className="text-xs font-bold text-stone-300 block mb-2">Predefined Premium Themes (Echelon Originals)</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { palette: 'elegant-dark', label: 'Platinum Dark', bg: 'bg-zinc-900 border-stone-800' },
                      { palette: 'black', label: 'Charcoal Gold', bg: 'bg-black border-amber-500/20' },
                      { palette: 'silver', label: 'Swiss Silver', bg: 'bg-slate-900 border-blue-500/20' },
                      { palette: 'blue', label: 'Midnight Teal', bg: 'bg-[#0f172a] border-teal-500/20' }
                    ].map((p) => {
                      const isSel = vaultData.theme.palette === p.palette;
                      return (
                        <button
                          key={p.palette}
                          type="button"
                          onClick={() => handleChangeTheme({ mode: 'dark', palette: p.palette as any })}
                          className={`p-3 rounded-xl border text-center transition-all ${p.bg} ${
                            isSel ? 'ring-2 ring-amber-500' : 'opacity-85 hover:opacity-100'
                          }`}
                        >
                          <span className="text-xs font-bold text-stone-100 block">{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Custom Hex Active Accent selection */}
                <div className="bg-stone-500/5 p-4 rounded-xl border border-stone-850/60 space-y-2">
                  <span className="text-xs font-bold text-stone-300 block">Dynamic Accent Coloring Picker</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { hex: '#f59e0b', label: 'Gold Amber' },
                      { hex: '#2563eb', label: 'Royal Silver' },
                      { hex: '#10b981', label: 'Emerald Mint' },
                      { hex: '#a855f7', label: 'Bright Orchid' },
                      { hex: '#ef4444', label: 'Sunset Crimson' },
                      { hex: '#ffffff', label: 'Chaste White' }
                    ].map((cc) => {
                      const isSel = (vaultData.activeAccentColor || '#f59e0b').toLowerCase() === cc.hex.toLowerCase();
                      return (
                        <button
                          key={cc.hex}
                          type="button"
                          onClick={() => handleUpdateActiveAccentColor(cc.hex)}
                          className="px-2.5 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-all flex items-center gap-1.5"
                          style={{
                            borderColor: isSel ? cc.hex : 'rgba(120, 110, 100, 0.2)',
                            backgroundColor: isSel ? `${cc.hex}15` : 'transparent',
                            color: isSel ? cc.hex : '#a8a29e'
                          }}
                        >
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cc.hex }} />
                          {cc.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <span className="text-xs text-stone-400">Or enter Custom HEX Color code:</span>
                    <input
                      type="text"
                      maxLength={7}
                      value={vaultData.activeAccentColor || '#f59e0b'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.startsWith('#') && val.length <= 7) {
                          handleUpdateActiveAccentColor(val);
                        }
                      }}
                      className="w-24 px-2 py-1 bg-stone-950 border border-stone-800 text-xs font-mono font-bold text-white rounded outline-none text-center"
                    />
                  </div>
                </div>

                {/* 3. Theme creators */}
                <div className="p-4 rounded-xl border border-stone-850/60 space-y-3">
                  <span className="text-xs font-bold text-stone-300 block">Create Dynamic Bespoke Custom theme</span>
                  <p className="text-[10px] text-stone-500 leading-relaxed">
                    Echelon allows overall themed systems up to a maximum limit of **10 theme configurations**. You currently have **{(vaultData.customThemeConfigs || []).length + 4}/10** active profiles.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Midnight Onyx"
                      value={newThemeName}
                      onChange={(e) => setNewThemeName(e.target.value)}
                      className="px-2.5 py-1.5 bg-stone-950 border border-stone-800 text-xs text-stone-200 rounded-lg outline-none"
                    />
                    <div className="flex gap-1">
                      <input
                        type="color"
                        value={newThemeColor}
                        onChange={(e) => setNewThemeColor(e.target.value)}
                        className="h-8 w-10 bg-transparent border-0 cursor-pointer p-0"
                      />
                      <input
                        type="text"
                        value={newThemeColor}
                        onChange={(e) => setNewThemeColor(e.target.value)}
                        className="w-full px-2 py-1 bg-stone-950 border border-stone-800 text-xs font-mono text-center text-stone-200 rounded-lg outline-none"
                      />
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setNewThemeBgMode('dark')}
                        className={`w-1/2 rounded-lg text-[10px] font-bold ${
                          newThemeBgMode === 'dark' ? 'bg-zinc-800 text-white border border-stone-700' : 'text-stone-500 border border-stone-800'
                        }`}
                      >
                        Obsidian
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewThemeBgMode('light')}
                        className={`w-1/2 rounded-lg text-[10px] font-bold ${
                          newThemeBgMode === 'light' ? 'bg-stone-100 text-zinc-950 border border-stone-300' : 'text-stone-500 border border-stone-800'
                        }`}
                      >
                        Alabaster
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={((vaultData.customThemeConfigs || []).length + 4) >= 10 || !newThemeName}
                    onClick={() => {
                      handleAddCustomTheme(newThemeName, newThemeColor, newThemeBgMode);
                      setNewThemeName('');
                    }}
                    className="w-full py-2 bg-stone-950 hover:bg-stone-900 border border-amber-500/20 text-xs font-bold text-amber-500 rounded-lg font-mono tracking-wide transition-all disabled:opacity-40 disabled:pointer-events-none"
                  >
                    + Save Custom Theme Composition to Vault
                  </button>

                  {/* List custom themes */}
                  {(vaultData.customThemeConfigs || []).length > 0 && (
                    <div className="space-y-1.5 pt-2 max-h-32 overflow-y-auto">
                      {(vaultData.customThemeConfigs || []).map((t) => {
                        const themeKey = `custom-${t.id}`;
                        const isCur = vaultData.theme.palette === themeKey;
                        return (
                          <div key={t.id} className="flex items-center justify-between bg-stone-950/20 p-2 rounded-lg text-xs border border-stone-850/50">
                            <span className="font-semibold text-stone-300">
                              {t.name} ({t.bgMode === 'dark' ? 'Dark' : 'Light'})
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: t.primaryColor }} />
                              <button
                                type="button"
                                onClick={() => handleChangeTheme({ mode: t.bgMode, palette: themeKey as any })}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isCur ? 'bg-amber-500 text-zinc-950' : 'bg-transparent text-stone-500 border border-stone-800 hover:text-stone-300'
                                }`}
                              >
                                Activate
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomTheme(t.id)}
                                className="text-red-500 hover:text-red-400 text-[10px] font-bold uppercase shrink-0 px-2"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUB-TAB C: ADVANCED GOALS, SAVINGS CHANGER & SYSTEM ALERT RULES */}
            {settingsTab === 'rules' && (
              <div className="space-y-4 animate-fade-in">
                
                {/* 1. Custom Monthly Savings Target override */}
                <div className="p-4 bg-stone-500/5 rounded-2xl border border-stone-850/40 space-y-2">
                  <span className="text-xs font-bold text-stone-300 block">Configure Global Saving Sink Stream Goal Amount</span>
                  <p className="text-[10px] text-stone-500">
                    Set how much money you intentionally save/invest from whatever you earn per month. This adjusts the real-time sink stream rates!
                  </p>
                  <div className="flex gap-2 items-center max-w-sm">
                    <span className="font-bold font-mono text-stone-400 text-sm">{(vaultData.currencySymbol || '₹')}</span>
                    <input
                      type="number"
                      placeholder="e.g. 25000"
                      value={vaultData.customSavingsGoalAmt || ''}
                      onChange={(e) => handleUpdateSavingsRule(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 text-xs text-white rounded-lg font-mono outline-none"
                    />
                  </div>
                </div>

                {/* 2. Custom Dynamic Overhead Outlays toggle overrides */}
                <div className="p-4 bg-stone-500/5 rounded-2xl border border-stone-850/40 space-y-2">
                  <span className="text-xs font-bold text-stone-300 block">Sink stream Deficit / Expense Override (Fixed vs Dynamic)</span>
                  <p className="text-[10px] text-stone-500">
                    By default, Echelon computes real-time outlays dynamically from current recorded budget ledger expenditures for this month. 
                    You may explicitly lock it to a static monthly value to simulate steady-state run rates.
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleUpdateSinkStreamOverride(undefined)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        vaultData.userOverriddenExpenses === undefined 
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400' 
                          : 'border-stone-800 text-stone-500'
                      }`}
                    >
                      Dynamic (From Budget Transactions)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateSinkStreamOverride(vaultData.userOverriddenExpenses || 15000)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        vaultData.userOverriddenExpenses !== undefined 
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400' 
                          : 'border-stone-800 text-stone-400'
                      }`}
                    >
                      Fixed Static Lock
                    </button>
                  </div>
                  {vaultData.userOverriddenExpenses !== undefined && (
                    <div className="flex gap-2 items-center max-w-sm pt-2 animate-fade-in">
                      <span className="text-xs text-stone-400">Locked Expense Amount:</span>
                      <input
                        type="number"
                        value={vaultData.userOverriddenExpenses}
                        onChange={(e) => handleUpdateSinkStreamOverride(parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 bg-stone-950 border border-stone-800 text-xs text-white rounded outline-none font-mono font-bold"
                      />
                    </div>
                  )}
                </div>

                {/* 3. Budget categories list for threshold alert editing */}
                <div className="p-4 rounded-xl border border-stone-850/50 space-y-3">
                  <span className="text-xs font-bold text-stone-300 block">Custom Budget Category Quotas</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Entertainment, Health"
                      value={modalCatName}
                      onChange={(e) => setModalCatName(e.target.value)}
                      className="w-1/2 px-2.5 py-1.5 bg-stone-950 border border-stone-800 text-xs text-white rounded-lg outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Limit INR"
                      value={modalCatLimit}
                      onChange={(e) => setModalCatLimit(e.target.value)}
                      className="w-1/2 px-2.5 py-1.5 bg-stone-950 border border-stone-800 text-xs text-white rounded-lg outline-none"
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        const lim = parseFloat(modalCatLimit);
                        if (modalCatName && !isNaN(lim)) {
                          const nextLimits = [
                            ...(vaultData.budgetCategoryLimits || []).filter(c => c.category !== modalCatName),
                            { category: modalCatName, limit: lim }
                          ];
                          handleUpdateCategoryLimits(nextLimits);
                          setModalCatName('');
                          setModalCatLimit('');
                        }
                      }}
                      className="px-3 bg-amber-500 text-zinc-950 font-bold text-xs rounded-lg hover:bg-amber-400 shrink-0"
                    >
                      Add
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {(vaultData.budgetCategoryLimits || []).length === 0 ? (
                      <span className="text-[10px] text-stone-500 italic block">No customized categories defined. System falls back to defaults.</span>
                    ) : (
                      (vaultData.budgetCategoryLimits || []).map((c) => (
                        <div key={c.category} className="flex items-center justify-between bg-stone-950/40 p-1.5 px-2 rounded-lg text-xs">
                          <span className="font-semibold text-stone-300">{c.category}: <strong className="font-mono text-amber-500 font-semibold">{(vaultData.currencySymbol || '₹')}{c.limit.toLocaleString()}</strong></span>
                          <button
                            type="button"
                            onClick={() => {
                              const nextLimits = (vaultData.budgetCategoryLimits || []).filter(cl => cl.category !== c.category);
                              handleUpdateCategoryLimits(nextLimits);
                            }}
                            className="text-[9px] text-red-500 hover:text-red-400 font-bold uppercase"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 4. Threshold custom rules creation */}
                <div className="p-4 rounded-xl border border-stone-850/50 space-y-3">
                  <span className="text-xs font-bold text-stone-300 block">Custom Notification Alerts & Warning Threshold limits</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="custom-threshold-alert-input"
                      placeholder="e.g. Alert if Dining spends cross 1000 INR"
                      className="flex-1 px-2.5 py-1.5 bg-stone-950 border border-stone-800 text-xs text-white rounded-lg outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const inputEl = document.getElementById('custom-threshold-alert-input') as HTMLInputElement;
                        if (inputEl && inputEl.value) {
                          const currentRules = vaultData.customAlertRules || [];
                          handleUpdateCustomAlertRules([...currentRules, inputEl.value]);
                          inputEl.value = '';
                        }
                      }}
                      className="px-3 bg-amber-500 text-zinc-950 font-bold text-xs rounded-lg hover:bg-amber-400 shrink-0"
                    >
                      Add Rule
                    </button>
                  </div>
                  
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {(vaultData.customAlertRules || []).map((rule, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-zinc-950 p-2 rounded-lg text-xs text-stone-300 font-mono">
                        <span>● {rule}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const filtered = (vaultData.customAlertRules || []).filter((_, i) => i !== idx);
                            handleUpdateCustomAlertRules(filtered);
                          }}
                          className="text-[9px] text-rose-500 hover:text-rose-400 uppercase font-bold ml-2 shrink-0"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB D: DATA BACKUPS, RAW DUMPS, CSV GENERATIONS AND FILE RESTORES */}
            {settingsTab === 'backups' && (
              <div className="space-y-4 animate-fade-in">
                
                {/* File Uploader for backup JSON report files */}
                <div className="p-4 bg-zinc-950/50 border border-stone-800 rounded-2xl space-y-2">
                  <span className="text-xs font-medium text-amber-500 font-mono block">🚀 Upload Report Database JSON Backup</span>
                  <p className="text-[10.5px] text-stone-500 leading-relaxed">
                    If you previously downloaded your client report backup ledger file, you can upload it here. This will rebuild and overwrite investments, debts, budget history, and goal logs instantly.
                  </p>
                  
                  <div className="flex items-center justify-center border border-dashed border-stone-800 p-4 rounded-xl hover:border-amber-500/20 bg-stone-950/40 cursor-pointer text-center relative group">
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          try {
                            const parsed = JSON.parse(event.target?.result as string);
                            if (parsed && typeof parsed === 'object') {
                              // Ensure standard data lists exist
                              if (!parsed.assets) parsed.assets = [];
                              if (!parsed.loans) parsed.loans = [];
                              if (!parsed.goals) parsed.goals = [];
                              if (!parsed.expenses) parsed.expenses = [];
                              
                              parsed.isLocked = false;
                              if (pinHash) parsed.pinHash = pinHash;
                              
                              saveVaultData(parsed);
                              alert("🚀 Success: Dynamic backup asset/loan report file uploaded and parsed successfully!");
                              setShowSettings(false);
                              window.location.reload();
                            } else {
                              alert("Payload error. Invalid structure format.");
                            }
                          } catch (err) {
                            alert("Corrupted JSON. Make sure you chose the valid JSON backup.");
                          }
                        };
                        reader.readAsText(file);
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="space-y-1">
                      <Download className="mx-auto h-5 w-5 text-stone-500 group-hover:text-amber-500 transition-colors" />
                      <span className="font-semibold text-xs text-stone-300 block">Click or Drag to Upload backup file (.json)</span>
                      <span className="text-[9px] text-stone-500 italic font-mono block">Echelon_Protected_Manual_Restore.json</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Backup / Export with zero-budget criteria */}
                  <div className="p-4 rounded-xl bg-stone-950/40 border border-stone-850/60 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-stone-300 block mb-1">Download Ledger Backup</span>
                      <p className="text-[10.5px] text-stone-500 leading-relaxed">
                        Export your full secure Client-Side database containing assets logs, loans, and system goal tracks to keep your personal ledgers safe.
                      </p>
                    </div>
                    <div className="mt-4 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const stateCopy = { ...vaultData };
                          downloadBlob(JSON.stringify(stateCopy, null, 2), 'Echelon_Protected_Manual_Restore.json', 'application/json');
                        }}
                        className="px-3.5 py-1.5 w-full bg-zinc-800 hover:bg-zinc-750 text-amber-500 border border-stone-700 font-bold text-xs rounded-lg transition-all"
                      >
                        Download Backup JSON File
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const stateStr = JSON.stringify(vaultData, null, 2);
                          handleCopyToClipboard(stateStr);
                        }}
                        className="px-3.5 py-1.5 w-full bg-zinc-850 hover:bg-zinc-800 text-stone-300 text-xs font-semibold rounded-lg transition-all"
                      >
                        Copy Raw JSON string
                      </button>
                    </div>
                  </div>

                  {/* Restorer Importer pasting block */}
                  <div className="p-4 rounded-xl bg-stone-950/40 border border-stone-850/60 flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-xs font-bold text-stone-300 block mb-1">Restore Database from Raw JSON String</span>
                      <p className="text-[10.5px] text-stone-500 leading-relaxed mb-2">
                        Paste your previously copied raw JSON string to restore.
                      </p>
                      <textarea
                        rows={2}
                        placeholder="Paste your JSON text string here..."
                        value={modalPasteArea}
                        onChange={(e) => setModalPasteArea(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-stone-900 border border-stone-800 text-[10.5px] text-stone-200 font-mono font-bold rounded-lg focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!modalPasteArea) return;
                        try {
                          const parsed = JSON.parse(modalPasteArea) as EchelonState;
                          if (!parsed.assets || !parsed.loans) {
                            alert("This payload is not a valid Echelon Ledger structure. Rejecting.");
                            return;
                          }
                          parsed.isLocked = false;
                          parsed.pinHash = pinHash;
                          saveVaultData(parsed);
                          alert("Restore successful!");
                          setShowSettings(false);
                          window.location.reload();
                        } catch (err) {
                          alert("Failed to parse. Double check layout string formatting.");
                        }
                      }}
                      className="w-full py-2 bg-amber-500 text-stone-950 font-mono font-black text-xs uppercase tracking-wider rounded-lg hover:bg-amber-400 transition-all shadow-md"
                    >
                      Overwrite & Core Restore
                    </button>
                  </div>
                </div>
              </div>
            )}
                 {/* SUB-TAB E: DEVELOPER INFO, CREDITS AND DOCK INSTRUCTIONS */}
            {settingsTab === 'credits' && (
              <div className="space-y-4 animate-fade-in text-xs text-stone-300 leading-relaxed font-sans">
                
                <div className="p-4 bg-stone-500/5 rounded-2xl border border-stone-850/40 space-y-2">
                  <span className="text-sm font-bold text-white block">Echelon: Build Quiet Wealth &bull; Corporate Client</span>
                  <div className="space-y-1 font-mono text-[11px] text-stone-400">
                    <p>Core Ledger Release: <strong className="text-white">v1.1.2</strong></p>
                    <p>Security Status: <strong className="text-amber-400">Protected with military-grade client-side AES-256 vault security</strong></p>
                    <p>Cryptography Status: <strong className="text-emerald-500">Active High-Salt PBKDF2 Locally Configured</strong></p>
                    <p>Fiat Standards: <strong className="text-white">Supports Dynamic Fiat (Default INR Rupee ₹)</strong></p>
                  </div>
                </div>

                <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 space-y-2">
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    <Sliders className="h-4 w-4" />
                    Developer Info & Creator Credits
                  </span>
                  
                  <p>
                    Echelon is custom designed and built for premium luxury personal wealth preservation.
                  </p>
                  <p className="font-mono text-stone-400 text-[11px] leading-relaxed">
                    Designed, coded, and engineered in its entirety by:
                    <span className="block mt-2 font-display font-black tracking-widest bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent text-sm uppercase">
                      Karthik S V
                    </span>
                    <span className="block text-[10px] text-stone-500 font-mono mt-0.5">Sole Architect & Core Engineer</span>
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-stone-850/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="font-semibold text-stone-200 block">Support Service Desk & Queries</span>
                    <p className="text-[11px] text-stone-500">Need diagnostic report sheets or help integrating secure ledgers?</p>
                  </div>
                  <a
                    href="mailto:aiwithkarthik.official@gmail.com"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shrink-0 block text-center"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Contact support
                  </a>
                </div>

                <div className="pt-2 text-center text-stone-600 text-[10px] font-mono">
                  &copy; {new Date().getFullYear()} Echelon Corporate Systems &bull; Built with pure tactical client-side focus
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* FOOTER METRICS */}
      <footer className="max-w-7xl mx-auto px-4 mt-8 pb-32 pt-8 border-t border-stone-850/30 text-center text-[10.5px] text-stone-500 font-mono space-y-2">
        <p className="text-stone-300 font-semibold tracking-wider font-display uppercase">Echelon: Build Quiet Wealth</p>
        <p>Protected with military-grade client-side AES-256 vault security</p>
        <p>Version 1.1.2</p>
        <p>
          <button
            type="button"
            onClick={() => {
              setSettingsTab('credits');
              setShowSettings(true);
            }}
            className="hover:text-amber-500 underline transition-colors focus:outline-none font-medium cursor-pointer"
          >
            Developer Info & System Profile
          </button>
        </p>
      </footer>

    </div>
  );
}
