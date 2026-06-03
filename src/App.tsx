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
  CustomField,
  AlertRule,
  CreditCard,
  OutflowLog,
  AcknowledgedAlertRecord,
  FundTransfer
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
import { calculateLoanCurrentBalance, calculateWealthRates, calculateCreditCardEffectiveLiability } from './utils/math';
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
  creditCards: [],
  outflows: [],
  acknowledgedAlerts: [],
  selectedFontOption: 'classic-inter',
  selectedProgressBarStyle: 'ultra-thin',
  transfers: [],
  securityTimeoutMinutes: 30,
  compiledInsightsText: '',
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

  // Interactive Alert Builder state
  const [newAlertName, setNewAlertName] = useState<string>('');
  const [newAlertAssetIds, setNewAlertAssetIds] = useState<string[]>([]);
  const [newAlertConditionType, setNewAlertConditionType] = useState<'below_amount' | 'above_amount' | 'below_percent' | 'above_percent'>('below_amount');
  const [newAlertThresholdValue, setNewAlertThresholdValue] = useState<string>('');

  // Undo System states
  const [undoStack, setUndoStack] = useState<EchelonState[]>([]);
  const [lastActionMessage, setLastActionMessage] = useState<string>('');

  // Backup & Report helper modal states
  const [downloadModalOpen, setDownloadModalOpen] = useState<boolean>(false);
  const [downloadModalTitle, setDownloadModalTitle] = useState<string>('');
  const [downloadModalFilename, setDownloadModalFilename] = useState<string>('');
  const [downloadModalContent, setDownloadModalContent] = useState<string>('');
  const [copyFeedbackActive, setCopyFeedbackActive] = useState<boolean>(false);

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

  // Sync dynamic brand icon choices to browser favicon & smartphone PWA home screen touch-icon
  useEffect(() => {
    const iconKey = vaultData?.selectedGalleryIcon || publicIcon || 'stealth-matte-gold';
    
    let svgStr = '';
    if (iconKey === 'vanguard-black-steel') {
      svgStr = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="48" fill="#111215" stroke="#090a0c" stroke-width="2.5" /><circle cx="50" cy="50" r="41" fill="#0b0c0d" stroke="#1c1e22" stroke-width="1" /><polygon points="50,22 74,36 74,64 50,78 26,64 26,36" fill="#151618" stroke="#4a4f5d" stroke-width="1.5" /><circle cx="50" cy="8" r="2.5" fill="#f25c54" /></svg>`;
    } else if (iconKey === 'regal-obsidian-gold') {
      svgStr = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="48" fill="#050505" stroke="#d4af37" stroke-width="2.5" /><polygon points="50,20 76,35 76,65 50,80 24,65 24,35" fill="#0c0c0e" stroke="#d4af37" stroke-width="1.5" /><circle cx="50" cy="50" r="12" fill="#d4af37" /></svg>`;
    } else {
      // stealth-matte-gold (default)
      svgStr = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="48" fill="#0f1011" stroke="#1c1d1e" stroke-width="2.5" /><polygon points="50,18 78,34 78,66 50,82 22,66 22,34" fill="#141517" stroke="#d4af37" stroke-width="1.5" /><path d="M32,64 L65,34 M65,34 L54,33 M65,34 L66,45" stroke="#ffeaa7" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" /></svg>`;
    }

    const dataUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(svgStr);

    // Dynamic browser tab favicon sync
    let linkFav: any = document.querySelector("link[rel*='icon']");
    if (!linkFav) {
      linkFav = document.createElement('link');
      linkFav.rel = 'icon';
      document.head.appendChild(linkFav);
    }
    linkFav.type = 'image/svg+xml';
    linkFav.href = dataUrl;

    // Dynamic iOS/Android Mobile Home Screen Shortcut App-Icon sync
    let linkApple: any = document.querySelector("link[rel='apple-touch-icon']");
    if (!linkApple) {
      linkApple = document.createElement('link');
      linkApple.rel = 'apple-touch-icon';
      document.head.appendChild(linkApple);
    }
    linkApple.href = dataUrl;

    document.title = "Echelon Vault | Quiet Wealth Ledger";
  }, [vaultData?.selectedGalleryIcon, publicIcon]);

  // Atomic dual-timer security lockout: customizable UI idle timeout & background tab safety threshold
  useEffect(() => {
    if (isLocked || !vaultData) return;

    const timeoutMin = vaultData.securityTimeoutMinutes !== undefined ? vaultData.securityTimeoutMinutes : 30;
    
    // 0 means NEVER auto-lock
    if (timeoutMin === 0) {
      return;
    }

    const idleTimeoutMs = timeoutMin * 60 * 1000;
    let idleTimer: ReturnType<typeof setTimeout>;
    let backgroundTime: number | null = null;

    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setIsLocked(true);
        setActivePin(''); // Flush sensitive in-memory key state on lockout
      }, idleTimeoutMs);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        backgroundTime = Date.now();
      } else if (backgroundTime !== null) {
        const elapsed = (Date.now() - backgroundTime) / 1000;
        // Background lockout matches the idle timeout in seconds
        if (elapsed >= timeoutMin * 60) {
          setIsLocked(true);
          setActivePin(''); 
        }
        backgroundTime = null;
      }
    };

    // Capture user sensory inputs
    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('mousedown', resetIdleTimer);
    window.addEventListener('keypress', resetIdleTimer);
    window.addEventListener('touchstart', resetIdleTimer);
    window.addEventListener('scroll', resetIdleTimer);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Bootstrap first monitoring window
    resetIdleTimer();

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('mousedown', resetIdleTimer);
      window.removeEventListener('keypress', resetIdleTimer);
      window.removeEventListener('touchstart', resetIdleTimer);
      window.removeEventListener('scroll', resetIdleTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLocked, vaultData?.securityTimeoutMinutes]);

  // Theme auto-rotate slideshow effect
  useEffect(() => {
    if (!vaultData || !vaultData.slideshowEnabled || isLocked) return;

    const intervalSec = vaultData.slideshowIntervalSeconds || 10;
    const masterpiecePalettes = [
      'stealth-gold',
      'black-steel',
      'royal-emerald',
      'rose-amethyst',
      'platinum-silver',
      'slate-amber',
      'elegant-dark',
      'black',
      'silver',
      'blue'
    ];

    const cycleTimer = setInterval(() => {
      const currentPalette = vaultData.theme.palette;
      const currentIdx = masterpiecePalettes.indexOf(currentPalette);
      const nextIdx = (currentIdx + 1) % masterpiecePalettes.length;
      const nextPalette = masterpiecePalettes[nextIdx];

      handleChangeTheme({
        mode: 'dark',
        palette: nextPalette as any
      });
    }, intervalSec * 1000);

    return () => clearInterval(cycleTimer);
  }, [vaultData, isLocked]);

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

  const handleCreateTransfer = (transfer: Omit<FundTransfer, 'id' | 'date'>) => {
    const newTransfer: FundTransfer = {
      ...transfer,
      id: `trf-${Date.now()}`,
      date: new Date().toISOString()
    };
    
    mutateVaultData(`Transferred ${vaultData?.currencySymbol || '₹'}${newTransfer.netAmountTransferred} from ${newTransfer.sourceAssetName} to ${newTransfer.destinationAssetName}`, (current) => {
      const updatedAssets = current.assets.map(asset => {
        if (asset.id === transfer.sourceAssetId) {
          return {
            ...asset,
            currentValue: Math.max(0, asset.currentValue - transfer.baseAmount),
            lastUpdated: new Date().toISOString()
          };
        }
        if (asset.id === transfer.destinationAssetId) {
          return {
            ...asset,
            currentValue: asset.currentValue + transfer.netAmountTransferred,
            lastUpdated: new Date().toISOString()
          };
        }
        return asset;
      });
      
      return {
        ...current,
        assets: updatedAssets,
        transfers: [newTransfer, ...(current.transfers || [])]
      };
    });
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

  const handleUpdateUserOverriddenExpenses = (val: number | undefined) => {
    mutateVaultData(`Adjusted decisive monthly overall sink`, (current) => ({
      ...current,
      userOverriddenExpenses: val,
    }));
  };

  const handleUpdateCustomSavingsGoalAmt = (val: number) => {
    mutateVaultData(`Updated Additional Buffer Spends limit`, (current) => ({
      ...current,
      customSavingsGoalAmt: val,
    }));
  };

  // --- CREDIT CARD HANDLERS ---
  const handleAddCreditCard = (cardData: Omit<CreditCard, 'id'>) => {
    const newCard: CreditCard = {
      ...cardData,
      id: `cc-${Date.now()}`,
    };
    mutateVaultData(`Added Credit Card: ${cardData.name}`, (current) => ({
      ...current,
      creditCards: [...(current.creditCards || []), newCard],
    }));
  };

  const handleRemoveCreditCard = (id: string) => {
    mutateVaultData(`Removed Credit Card`, (current) => ({
      ...current,
      creditCards: (current.creditCards || []).filter(c => c.id !== id),
    }));
  };

  const handleSimulateStatement = (cardId: string) => {
    mutateVaultData(`Generated Statement for Credit Card`, (current) => {
      const cards = [...(current.creditCards || [])];
      const card = cards.find(c => c.id === cardId);
      if (card) {
        card.lastBillAmount = card.usedBalance;
        card.outstandingBalanceAtStatement = card.usedBalance;
        
        // Calculate due date based on statement Date of current month + bufferDays
        const now = new Date();
        const statementDate = new Date(now.getFullYear(), now.getMonth(), card.statementDate);
        const dueDate = new Date(statementDate.getTime() + card.bufferDays * 24 * 60 * 60 * 1000);
        
        card.dueDate = dueDate.toISOString().split('T')[0];
        card.lastStatementDate = now.toISOString().split('T')[0];
      }
      return { ...current, creditCards: cards };
    });
  };

  const handlePayCreditCardBill = (cardId: string, amount: number, bankAccountId: string) => {
    mutateVaultData(`Paid Credit Card Bill`, (current) => {
      const cards = [...(current.creditCards || [])];
      const assets = [...current.assets];
      const card = cards.find(c => c.id === cardId);
      const bank = assets.find(b => b.id === bankAccountId);
      
      if (card && bank) {
        // Deduct from bank balance
        bank.currentValue = parseFloat((bank.currentValue - amount).toFixed(2));
        
        // Reduce card bill / usedBalance
        card.usedBalance = parseFloat((Math.max(0, card.usedBalance - amount)).toFixed(2));
        if (card.lastBillAmount) {
          card.lastBillAmount = parseFloat((Math.max(0, card.lastBillAmount - amount)).toFixed(2));
        }
        
        // Add to outflow logs
        const newOutflowLog: OutflowLog = {
          id: `of-ccpay-${Date.now()}`,
          amount: amount,
          category: 'Credit Card Bill Payment',
          date: new Date().toISOString().split('T')[0],
          sourceType: 'bank_balance',
          sourceId: bankAccountId,
          sourceName: bank.name,
          amountLeftAfter: bank.currentValue,
          notes: `Repaid Credit Card Bill of ${card.name} using ${bank.name}. Card current used balance: ${card.usedBalance}`,
        };
        
        return {
          ...current,
          creditCards: cards,
          assets: assets,
          outflows: [newOutflowLog, ...(current.outflows || [])]
        };
      }
      return current;
    });
  };

  const handleUpdateCreditCardAlerts = (cardId: string, remainingLimitAlert?: number, usedLimitPctAlert?: number) => {
    mutateVaultData(`Updated Credit Card Alerts`, (current) => {
      const cards = [...(current.creditCards || [])];
      const card = cards.find(c => c.id === cardId);
      if (card) {
        card.alertRemainingLimit = remainingLimitAlert && remainingLimitAlert > 0 ? remainingLimitAlert : undefined;
        card.alertUsedLimitPct = usedLimitPctAlert && usedLimitPctAlert > 0 ? usedLimitPctAlert : undefined;
      }
      return { ...current, creditCards: cards };
    });
  };

  // --- OUTFLOW LOGGING WITH SWEEP-IN FD INTEGRATION ---
  const handleAddOutflow = (expenseData: Omit<Expense, 'id'>, source: { sourceType: 'bank_balance' | 'credit_card'; sourceId: string }) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `ex-${Date.now()}`,
    };
    
    mutateVaultData(`Logged Outflow for ${expenseData.category}`, (current) => {
      const updatedAssets = [...current.assets];
      const updatedCards = [...(current.creditCards || [])];
      const updatedOutflows = [...(current.outflows || [])];
      
      let finalNotes = expenseData.notes || '';
      let remainderLeft = 0;
      let sourceName = '';
      let fdSweepBrokenId = '';
      let fdSweepPenaltyFee = 0;
      
      if (source.sourceType === 'bank_balance') {
        const bankAsset = updatedAssets.find(a => a.id === source.sourceId);
        if (bankAsset) {
          sourceName = bankAsset.name;
          const diff = bankAsset.currentValue - expenseData.amount;
          if (diff >= 0) {
            bankAsset.currentValue = parseFloat(diff.toFixed(2));
            remainderLeft = bankAsset.currentValue;
          } else {
            // Deficit! Let's check for linked sweep-in FDs
            const linkedFD = updatedAssets.find(a => 
              a.type === AssetType.FD && 
              a.sweepInEnabled && 
              a.sweepInLinkedAssetId === bankAsset.id && 
              a.currentValue > 0
            );
            
            if (linkedFD) {
              const sweepNeeded = parseFloat(Math.abs(diff).toFixed(2));
              fdSweepBrokenId = linkedFD.id;
              if (linkedFD.currentValue >= sweepNeeded) {
                linkedFD.currentValue = parseFloat((linkedFD.currentValue - sweepNeeded).toFixed(2));
                bankAsset.currentValue = 0;
                remainderLeft = 0;
                finalNotes += ` (Sweep-in triggered from ${linkedFD.name}: ${current.currencySymbol || '₹'}${sweepNeeded} swept)`;
              } else {
                const drawn = linkedFD.currentValue;
                linkedFD.currentValue = 0;
                bankAsset.currentValue = 0;
                remainderLeft = 0;
                finalNotes += ` (Partial Sweep-in triggered from ${linkedFD.name}: ${current.currencySymbol || '₹'}${drawn} swept)`;
              }
            } else {
              // No sweep-in FD found. Let's just deduct and allow overdraft
              bankAsset.currentValue = parseFloat(diff.toFixed(2));
              remainderLeft = bankAsset.currentValue;
            }
          }
        }
      } else if (source.sourceType === 'credit_card') {
        const card = updatedCards.find(c => c.id === source.sourceId);
        if (card) {
          sourceName = card.name;
          card.usedBalance = parseFloat((card.usedBalance + expenseData.amount).toFixed(2));
          remainderLeft = Math.max(0, parseFloat((card.totalLimit - card.usedBalance).toFixed(2)));
        }
      }
      
      const newOutflowLog: OutflowLog = {
        id: `of-${Date.now()}`,
        amount: expenseData.amount,
        category: expenseData.category,
        date: expenseData.date,
        sourceType: source.sourceType,
        sourceId: source.sourceId,
        sourceName,
        amountLeftAfter: remainderLeft,
        notes: finalNotes,
        fdSweepBrokenId,
        fdSweepPenaltyFee,
      };
      
      return {
        ...current,
        expenses: [...current.expenses, newExpense],
        assets: updatedAssets,
        creditCards: updatedCards,
        outflows: [newOutflowLog, ...updatedOutflows],
      };
    });
  };

  const handleLiquidateAssetPrematurely = (assetId: string, targetBankAccountId: string) => {
    mutateVaultData(`Liquidated Asset Prematurely`, (current) => {
      const updatedAssets = [...current.assets];
      const assetIndex = updatedAssets.findIndex(a => a.id === assetId);
      if (assetIndex === -1) return current;
      
      const asset = updatedAssets[assetIndex];
      const targetBank = updatedAssets.find(b => b.id === targetBankAccountId);
      
      if (!targetBank) return current;
      
      let penaltyAmount = 0;
      let netProceeds = asset.currentValue;
      
      if (asset.type === AssetType.FD || asset.type === AssetType.BOND) {
        if (!asset.sweepInEnabled) {
          const rate = asset.maturityPenaltyRate || 1; 
          penaltyAmount = parseFloat((asset.currentValue * (rate / 100)).toFixed(2));
          netProceeds = parseFloat((asset.currentValue - penaltyAmount).toFixed(2));
        }
      }
      
      targetBank.currentValue = parseFloat((targetBank.currentValue + netProceeds).toFixed(2));
      asset.currentValue = 0;
      asset.isMatured = true;
      
      const newOutflowLog: OutflowLog = {
        id: `of-liq-${Date.now()}`,
        amount: -netProceeds, 
        category: 'Asset Liquidation',
        date: new Date().toISOString().split('T')[0],
        sourceType: 'bank_balance',
        sourceId: targetBankAccountId,
        sourceName: targetBank.name,
        amountLeftAfter: targetBank.currentValue,
        notes: `Liquidated early: ${asset.name}. Net proceeds ${current.currencySymbol || '₹'}${netProceeds} transferred. Penalty levied: ${current.currencySymbol || '₹'}${penaltyAmount}`,
      };
      
      return {
        ...current,
        assets: updatedAssets,
        outflows: [newOutflowLog, ...(current.outflows || [])]
      };
    });
  };

  const handleAcknowledgeAlert = (ruleId: string, ruleName: string, triggerMessage: string) => {
    mutateVaultData(`Acknowledged Alert: ${ruleName}`, (current) => {
      const updatedRules = (current.structuredAlertRules || []).filter(r => r.id !== ruleId);
      
      const newAck: AcknowledgedAlertRecord = {
        id: `ack-${Date.now()}`,
        ruleName,
        message: triggerMessage,
        date: new Date().toISOString(),
      };
      
      return {
        ...current,
        structuredAlertRules: updatedRules,
        acknowledgedAlerts: [newAck, ...(current.acknowledgedAlerts || [])],
      };
    });
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

  const handleUpdateSecurityTimeoutMinutes = (minutes: number) => {
    if (!vaultData) return;
    saveVaultData({
      ...vaultData,
      securityTimeoutMinutes: minutes,
    });
  };

  const handleUpdateCompiledInsightsText = (text: string) => {
    if (!vaultData) return;
    saveVaultData({
      ...vaultData,
      compiledInsightsText: text,
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

  const handleUpdateStructuredAlertRules = (rules: AlertRule[]) => {
    if (!vaultData) return;
    saveVaultData({
      ...vaultData,
      structuredAlertRules: rules,
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

  const handleToggleThemeSlideshow = (enabled: boolean, interval: number) => {
    if (!vaultData) return;
    saveVaultData({
      ...vaultData,
      slideshowEnabled: enabled,
      slideshowIntervalSeconds: interval,
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
    try {
      downloadBlob(rawData, 'Echelon_Treasury_Manual_Export.csv', 'text/csv');
    } catch (e) {
      console.warn('Traditional download failed', e);
    }
    setDownloadModalTitle('Portfolio Spreadsheet Statement (CSV)');
    setDownloadModalFilename('Echelon_Treasury_Manual_Export.csv');
    setDownloadModalContent(rawData);
    setDownloadModalOpen(true);
  };

  const handleExportPDF = () => {
    if (!vaultData) return;
    const htmlReport = generateHTMLReport(vaultData);
    try {
      downloadBlob(htmlReport, 'Echelon_Treasury_Manual_Assessment_Report.html', 'text/html');
    } catch (e) {
      console.warn('Traditional download failed', e);
    }
    setDownloadModalTitle('Printable Assessment Report (HTML/PDF)');
    setDownloadModalFilename('Echelon_Treasury_Manual_Assessment_Report.html');
    setDownloadModalContent(htmlReport);
    setDownloadModalOpen(true);
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
  
  const totalCreditCardLiabilitiesVal = (vaultData.creditCards || [])
    .reduce((sum, c) => sum + calculateCreditCardEffectiveLiability(c), 0);
  
  const totalNetWorth = totalAssetsVal + totalLentVal - totalBorrowedVal - totalCreditCardLiabilitiesVal;
  const rates = calculateWealthRates(
    vaultData.assets,
    vaultData.loans,
    vaultData.monthlyEarnings,
    vaultData.expenses,
    totalNetWorth,
    vaultData.userOverriddenExpenses,
    vaultData.customSavingsGoalAmt,
    vaultData.budget.amount
  );

  const activeColor = vaultData.activeAccentColor || '#f59e0b';

  const getTriggeredAlerts = () => {
    if (!vaultData || !vaultData.structuredAlertRules) return [];
    
    const triggered: { rule: AlertRule; message: string; severity: 'warning' | 'info' }[] = [];
    const netWorthSum = totalNetWorth;
    
    vaultData.structuredAlertRules.forEach(rule => {
      if (!rule.isActive) return;
      
      const selectedAssets = vaultData.assets.filter(a => rule.assetIds && rule.assetIds.includes(a.id));
      if (selectedAssets.length === 0 && rule.assetIds && rule.assetIds.length > 0) return;
      
      const combinedValue = selectedAssets.reduce((sum, a) => sum + a.currentValue, 0);
      const namesJoined = selectedAssets.map(a => a.name).join(', ') || 'selected funds';
      
      const thresholdAmt = rule.targetAmount || 0;
      const thresholdPct = rule.targetPercent || 0;
      
      if (rule.conditionType === 'below_amount') {
        if (combinedValue < thresholdAmt) {
          triggered.push({
            rule,
            message: `📉 [${namesJoined}] Combined value (${vaultData.currencySymbol || '₹'}${combinedValue.toLocaleString()}) fell below minimum alert threshold (${vaultData.currencySymbol || '₹'}${thresholdAmt.toLocaleString()})`,
            severity: 'warning'
          });
        }
      } else if (rule.conditionType === 'above_amount') {
        if (combinedValue > thresholdAmt) {
          triggered.push({
            rule,
            message: `📈 [${namesJoined}] Combined value (${vaultData.currencySymbol || '₹'}${combinedValue.toLocaleString()}) exceeded target alert threshold (${vaultData.currencySymbol || '₹'}${thresholdAmt.toLocaleString()})`,
            severity: 'info'
          });
        }
      } else if (rule.conditionType === 'below_percent') {
        const pctOfNetWorth = netWorthSum > 0 ? (combinedValue / netWorthSum) * 100 : 0;
        if (pctOfNetWorth < thresholdPct) {
          triggered.push({
            rule,
            message: `⚖️ [${namesJoined}] Allocation weight (${pctOfNetWorth.toFixed(1)}% of Net Worth) fell below alert threshold (${thresholdPct}%)`,
            severity: 'warning'
          });
        }
      } else if (rule.conditionType === 'above_percent') {
        const pctOfNetWorth = netWorthSum > 0 ? (combinedValue / netWorthSum) * 100 : 0;
        if (pctOfNetWorth > thresholdPct) {
          triggered.push({
            rule,
            message: `🚨 [${namesJoined}] Allocation weight (${pctOfNetWorth.toFixed(1)}% of Net Worth) exceeded warning concentration ceiling (${thresholdPct}%)`,
            severity: 'warning'
          });
        }
      }
    });
    
    return triggered;
  };

  const triggeredAlerts = getTriggeredAlerts();

  return (
    <div className={`min-h-screen ${tokens.bg} pb-36 transition-colors duration-500 text-stone-100 relative`}>
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

            {/* Save printable PDF button */}
            <button
              type="button"
              id="export-pdf-top-btn"
              onClick={() => {
                setSettingsTab('backups');
                setShowSettings(true);
              }}
              className={`p-2 rounded-xl border ${tokens.buttonBg} transition-all flex items-center gap-1.5`}
              title="Navigate to Settings Downloads"
            >
              <Download className="h-4 w-4 text-amber-500" />
              <span className="hidden md:inline font-mono text-[11px] font-bold text-stone-300">Downloads</span>
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
        
        {/* ACTIVE TRIGGERED SYSTEM ALERTS */}
        {triggeredAlerts.length > 0 && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-2 shadow-md">
            <div className="flex items-center gap-2 pb-1.5 border-b border-rose-500/10">
              <span className="inline-flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              <span className="text-[10.5px] uppercase font-black text-rose-400 tracking-wider font-mono">⚠️ Echelon Safeguard Alerts Active ({triggeredAlerts.length})</span>
            </div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {triggeredAlerts.map((alertItem, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs font-mono text-stone-200">
                  <span className="text-rose-500 font-bold shrink-0">•</span>
                  <div className="flex-1">
                    <span className="text-zinc-400 font-semibold inline-block mr-1">[{alertItem.rule.name}]:</span>
                    <span className="text-stone-350">{alertItem.message}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-stone-500 font-mono text-right italic pt-1">
              Configure alert limits and single/multiple fund anchors in Settings &gt; Goals, Sinks & Alerts
            </p>
          </div>
        )}
        
        {/* 2. DYNAMIC WORKSPACE PAGES */}
        <div className="animate-fade-in pb-36">
          
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
                onUpdateUserOverriddenExpenses={handleUpdateUserOverriddenExpenses}
                onUpdateCustomSavingsGoalAmt={handleUpdateCustomSavingsGoalAmt}
                onOpenSettings={(tabName) => {
                  setSettingsTab(tabName || 'rules');
                  setShowSettings(true);
                }}
                budgetAmount={vaultData.budget.amount}
              />

              <GoalMilestones
                theme={vaultData.theme}
                goals={vaultData.goals}
                assets={vaultData.assets}
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
              transfers={vaultData.transfers || []}
              onAddTransfer={handleCreateTransfer}
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
              creditCards={vaultData.creditCards || []}
              assets={vaultData.assets}
              onAddCreditCard={handleAddCreditCard}
              onRemoveCreditCard={handleRemoveCreditCard}
              onSimulateStatement={handleSimulateStatement}
              onPayCreditCardBill={handlePayCreditCardBill}
              onUpdateCreditCardAlerts={handleUpdateCreditCardAlerts}
              selectedProgressBarStyle={vaultData.selectedProgressBarStyle || 'ultra-thin'}
              activeAccentColor={vaultData.activeAccentColor}
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
              assets={vaultData.assets}
              creditCards={vaultData.creditCards || []}
              onAddOutflow={handleAddOutflow}
              selectedProgressBarStyle={vaultData.selectedProgressBarStyle || 'ultra-thin'}
              activeAccentColor={vaultData.activeAccentColor}
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
              goals={vaultData.goals}
              compiledInsightsText={vaultData.compiledInsightsText}
              onUpdateCompiledInsightsText={handleUpdateCompiledInsightsText}
            />
          )}

        </div>

      </main>

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
                  <label className="text-xs font-bold text-stone-300 block">Security Auto-Lock Timeout</label>
                  <p className="text-[10px] text-stone-500 mb-2">Configure how long Echelon can remain idle or in the background before locking and protecting your private ledger data.</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { minutes: 0, label: 'Never Lock' },
                      { minutes: 1, label: '1 min' },
                      { minutes: 5, label: '5 min' },
                      { minutes: 15, label: '15 min' },
                      { minutes: 30, label: '30 min' },
                      { minutes: 60, label: '1 hour' },
                    ].map((opt) => {
                      const isSel = (vaultData.securityTimeoutMinutes !== undefined ? vaultData.securityTimeoutMinutes : 30) === opt.minutes;
                      return (
                        <button
                          key={`lock-opt-${opt.minutes}`}
                          type="button"
                          onClick={() => handleUpdateSecurityTimeoutMinutes(opt.minutes)}
                          className={`px-3 py-1.5 rounded-xl font-bold font-mono text-[10px] uppercase tracking-wider flex items-center justify-center border transition-all ${
                            isSel 
                              ? 'border-amber-500 bg-amber-500/15 text-amber-400 font-extrabold' 
                              : 'border-stone-800 hover:bg-stone-800 text-stone-400'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
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
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { palette: 'elegant-dark', label: 'Platinum Dark', bg: 'bg-zinc-900 border-zinc-800' },
                      { palette: 'black', label: 'Charcoal Gold', bg: 'bg-black border-amber-500/20' },
                      { palette: 'silver', label: 'Swiss Silver', bg: 'bg-slate-900 border-blue-500/20' },
                      { palette: 'blue', label: 'Midnight Teal', bg: 'bg-[#0f172a] border-teal-500/20' },
                      { palette: 'stealth-gold', label: 'Stealth Gold', bg: 'bg-[#111115] border-amber-500/20' },
                      { palette: 'black-steel', label: 'Black Steel', bg: 'bg-[#0e0f11] border-zinc-700' },
                      { palette: 'royal-emerald', label: 'Royal Emerald', bg: 'bg-[#03160a] border-emerald-500/20' },
                      { palette: 'rose-amethyst', label: 'Rose Amethyst', bg: 'bg-[#0d091a] border-purple-500/20' },
                      { palette: 'platinum-silver', label: 'Valkyrie Plat', bg: 'bg-[#111317] border-cyan-500/20' },
                      { palette: 'slate-amber', label: 'Chronos Amber', bg: 'bg-[#101318] border-orange-500/25' }
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

                {/* Masterpiece Slideshow Mode controls */}
                <div className="bg-stone-500/5 p-4 rounded-xl border border-stone-850/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-stone-300 block">Atmosphere Slideshow Mode</span>
                      <p className="text-[10px] text-stone-500 mt-0.5">Automatically cycle between the 10 Echelon Originals over customizable timeslots</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        id="theme-slideshow-toggle"
                        checked={vaultData.slideshowEnabled || false} 
                        onChange={(e) => handleToggleThemeSlideshow(e.target.checked, vaultData.slideshowIntervalSeconds || 10)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-stone-400 after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  {vaultData.slideshowEnabled && (
                    <div className="flex items-center gap-3 animate-fade-in pt-1">
                      <span className="text-[10px] uppercase font-bold text-stone-500 font-mono">Cycle Interval:</span>
                      <select
                        id="theme-slideshow-interval"
                        value={vaultData.slideshowIntervalSeconds || 10}
                        onChange={(e) => handleToggleThemeSlideshow(true, parseInt(e.target.value) || 10)}
                        className="bg-stone-950 border border-stone-800 rounded px-2 py-1 text-xs text-white font-mono"
                      >
                        <option value="5">5 Seconds (Testing)</option>
                        <option value="10">10 Seconds</option>
                        <option value="30">30 Seconds</option>
                        <option value="60">1 Minute</option>
                        <option value="300">5 Minutes</option>
                      </select>
                    </div>
                  )}
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

                {/* 4. Interactive Guardrail Alerts builder */}
                <div className="p-4 rounded-xl border border-stone-850/50 space-y-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-stone-300 block">Sovereign Guardian Portfolio Alerts</span>
                    <p className="text-[10px] text-stone-500 font-mono leading-relaxed">Configure precise multi-asset or single-asset alerts based on custom amounts or net worth percentage thresholds.</p>
                  </div>

                  {/* Add Alert Rule Form */}
                  <div className="p-3 bg-stone-950/60 border border-stone-850 rounded-xl space-y-3">
                    <span className="text-[10px] uppercase font-bold text-amber-500 font-mono block">Configure New Notification Safeguard</span>
                    
                    {/* Alert Name */}
                    <div>
                      <label className="text-[9px] uppercase font-bold text-stone-500 font-mono block mb-1">Alert Rule Profile Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Fixed Deposit Threshold Safety"
                        value={newAlertName}
                        onChange={(e) => setNewAlertName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-stone-900 border border-stone-800 text-xs text-white rounded-lg outline-none font-mono"
                      />
                    </div>

                    {/* Choose Multiple or Single Funds */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[9px] uppercase font-bold text-stone-500 font-mono block">Pick Support Anchors & Funds</label>
                        <button
                          type="button"
                          onClick={() => {
                            if (newAlertAssetIds.length === vaultData.assets.length) {
                              setNewAlertAssetIds([]);
                            } else {
                              setNewAlertAssetIds(vaultData.assets.map(a => a.id));
                            }
                          }}
                          className="text-[9.5px] uppercase font-bold text-amber-500 hover:text-amber-400 font-mono"
                        >
                          {newAlertAssetIds.length === vaultData.assets.length ? 'Clear All' : 'Select All'}
                        </button>
                      </div>

                      {vaultData.assets.length === 0 ? (
                        <p className="text-[10px] text-stone-500 font-mono italic">No assets registered yet. Add fields inside the Assets page.</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-stone-900 rounded-lg border border-stone-800">
                          {vaultData.assets.map(asset => {
                            const isChecked = newAlertAssetIds.includes(asset.id);
                            return (
                              <label key={asset.id} className="flex items-center gap-1.5 cursor-pointer text-[10px] text-stone-300">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setNewAlertAssetIds(newAlertAssetIds.filter(id => id !== asset.id));
                                    } else {
                                      setNewAlertAssetIds([...newAlertAssetIds, asset.id]);
                                    }
                                  }}
                                  className="rounded border-stone-800 text-amber-500 focus:ring-0 focus:ring-offset-0 bg-stone-950 h-3 w-3"
                                />
                                <span className="truncate font-mono" title={asset.name}>{asset.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Condition type & Threshold Box */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[9px] uppercase font-bold text-stone-500 font-mono block mb-1">Condition Anchor Model</label>
                        <select
                          value={newAlertConditionType}
                          onChange={(e: any) => setNewAlertConditionType(e.target.value)}
                          className="w-full px-2 py-1.5 bg-stone-900 border border-stone-800 text-xs text-stone-300 rounded-lg outline-none font-mono"
                        >
                          <option value="below_amount">Falls below Threshold Amount</option>
                          <option value="above_amount">Crosses above Threshold Amount</option>
                          <option value="below_percent">Sinks below % of Net Worth</option>
                          <option value="above_percent">Exceeds % of Net Worth</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] uppercase font-bold text-stone-500 font-mono block mb-1">
                          {newAlertConditionType.includes('percent') ? 'Threshold Percentage (%)' : `Threshold Amount (${vaultData.currencySymbol || '₹'})`}
                        </label>
                        <input
                          type="number"
                          placeholder={newAlertConditionType.includes('percent') ? 'e.g. 20' : 'e.g. 50000'}
                          value={newAlertThresholdValue}
                          onChange={(e) => setNewAlertThresholdValue(e.target.value)}
                          className="w-full px-2 py-1.5 bg-stone-900 border border-stone-800 text-xs text-white rounded-lg outline-none font-mono font-bold"
                        />
                      </div>
                    </div>

                    {/* Insert Action */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!newAlertName.trim()) {
                          alert("Please specify a protective name profile for your alert.");
                          return;
                        }
                        if (newAlertAssetIds.length === 0) {
                          alert("Please select at least one single fund support anchor to associate.");
                          return;
                        }
                        const valFloat = parseFloat(newAlertThresholdValue);
                        if (isNaN(valFloat) || valFloat <= 0) {
                          alert("Please enter a valid numeric threshold configuration.");
                          return;
                        }

                        const newRule: AlertRule = {
                          id: 'alert_' + Date.now(),
                          name: newAlertName,
                          assetIds: newAlertAssetIds,
                          conditionType: newAlertConditionType,
                          isActive: true,
                          targetAmount: newAlertConditionType.includes('amount') ? valFloat : undefined,
                          targetPercent: newAlertConditionType.includes('percent') ? valFloat : undefined,
                        };

                        const currentRules = vaultData.structuredAlertRules || [];
                        handleUpdateStructuredAlertRules([...currentRules, newRule]);

                        // Reset
                        setNewAlertName('');
                        setNewAlertAssetIds([]);
                        setNewAlertThresholdValue('');
                      }}
                      className="w-full py-1.5 bg-amber-500 text-zinc-950 font-bold text-xs rounded-lg hover:bg-amber-400 transition-all font-mono uppercase"
                    >
                      Establish Guardrail Rule
                    </button>
                  </div>

                  {/* Configured Rules Lists */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-stone-500 font-mono block">Active Security Guardrails Profile</span>
                    
                    {(!vaultData.structuredAlertRules || vaultData.structuredAlertRules.length === 0) ? (
                      <p className="text-[10px] text-stone-400 font-mono italic">No custom protective rules established. Create one above!</p>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {vaultData.structuredAlertRules.map((rule) => {
                          const associatedNames = vaultData.assets
                            .filter(a => rule.assetIds.includes(a.id))
                            .map(a => a.name)
                            .join(', ') || 'No matching active assets';
                          const conditionDesc = 
                            rule.conditionType === 'below_amount' ? `Falls below ${vaultData.currencySymbol || '₹'}${rule.targetAmount?.toLocaleString()}` :
                            rule.conditionType === 'above_amount' ? `Rises above ${vaultData.currencySymbol || '₹'}${rule.targetAmount?.toLocaleString()}` :
                            rule.conditionType === 'below_percent' ? `Drops below ${rule.targetPercent}% of Net Worth` : 
                            `Crosses above ${rule.targetPercent}% of Net Worth`;

                          return (
                            <div key={rule.id} className="p-2.5 bg-zinc-950/85 rounded-xl border border-stone-850 flex flex-col gap-1 text-[11px] hover:border-amber-500/10 transition-colors">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-stone-200 font-mono">⚡ {rule.name}</span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedRules = (vaultData.structuredAlertRules || []).map(r => 
                                        r.id === rule.id ? { ...r, isActive: !r.isActive } : r
                                      );
                                      handleUpdateStructuredAlertRules(updatedRules);
                                    }}
                                    className={`px-1.5 py-0.5 text-[8.5px] font-mono rounded font-bold uppercase ${
                                      rule.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-stone-800 text-stone-500'
                                    }`}
                                  >
                                    {rule.isActive ? 'Active' : 'Muted'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const filtered = (vaultData.structuredAlertRules || []).filter(r => r.id !== rule.id);
                                      handleUpdateStructuredAlertRules(filtered);
                                    }}
                                    className="text-[9px] text-rose-500 hover:text-rose-400 font-bold uppercase transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                              <p className="text-[10px] text-stone-400 font-mono">
                                <strong className="text-stone-500">Targeting:</strong> {associatedNames}
                              </p>
                              <p className="text-[10px] text-stone-350 font-mono">
                                <strong className="text-stone-500">Condition:</strong> <span className="text-amber-400 font-semibold">{conditionDesc}</span>
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
                  {/* Backup & Reports Pack Export */}
                  <div className="p-4 rounded-xl bg-stone-950/40 border border-stone-850/60 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-amber-500 font-mono block mb-1">📊 Download Reports & Ledgers</span>
                      <p className="text-[10.5px] text-stone-500 leading-relaxed">
                        Export your comprehensive quiet wealth reports, spreadsheets, and secure schema file to store your records locally.
                      </p>
                    </div>
                    <div className="mt-4 space-y-2">
                      <button
                        type="button"
                        onClick={handleExportPDF}
                        className="px-3 py-1.5 w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs rounded-lg transition-all"
                      >
                        Download Printable Assessment Statement (HTML)
                      </button>
                      <button
                        type="button"
                        onClick={handleExportCSV}
                        className="px-3 py-1.5 w-full bg-zinc-800 hover:bg-zinc-750 text-stone-200 font-semibold text-xs rounded-lg border border-stone-750 transition-all"
                      >
                        Download Portfolio Statement (CSV)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const stateCopy = { ...vaultData };
                          const jsonStr = JSON.stringify(stateCopy, null, 2);
                          try {
                            downloadBlob(jsonStr, 'Echelon_Protected_Manual_Restore.json', 'application/json');
                          } catch (e) {
                            console.warn('Traditional download failed', e);
                          }
                          setDownloadModalTitle('Protected Manual Restore (JSON)');
                          setDownloadModalFilename('Echelon_Protected_Manual_Restore.json');
                          setDownloadModalContent(jsonStr);
                          setDownloadModalOpen(true);
                        }}
                        className="px-3 py-1.5 w-full bg-zinc-850 hover:bg-zinc-805 text-stone-300 font-medium text-xs rounded-lg border border-stone-800 transition-all"
                      >
                        Download Backup JSON Database
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const stateStr = JSON.stringify(vaultData, null, 2);
                          handleCopyToClipboard(stateStr);
                        }}
                        className="px-3 py-1.5 w-full bg-zinc-900/60 hover:bg-zinc-850 text-stone-400 text-[10.5px] font-medium rounded-lg transition-all"
                      >
                        Copy Raw JSON String
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

      {/* UNIVERSAL BACKUP AND STATEMENT DOWNLOAD HELPER MODAL */}
      {downloadModalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-zinc-900 border border-stone-850 rounded-3xl p-6 space-y-4 shadow-2xl text-stone-100 max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-amber-500 tracking-wider">🔒 System Diagnostic Export Fallback</span>
                <h3 className="text-base font-bold text-white mt-0.5">{downloadModalTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => setDownloadModalOpen(false)}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-750 text-stone-300 hover:text-white rounded-lg text-xs font-semibold tracking-wider transition-all"
              >
                Close
              </button>
            </div>

            <div className="p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-xl text-xs space-y-1.5 leading-relaxed">
              <p className="text-stone-300">
                <strong>Device Sandbox Download Protection:</strong> In some sandbox wrapper or mobile environments, traditional file downloads are restricted to prevent data leakage.
              </p>
              <div className="text-[10.5px] text-stone-400 space-y-1">
                <p>• <strong>To Save manually:</strong> Copy the text block below and paste it in a local file named <strong className="text-amber-500">{downloadModalFilename}</strong>.</p>
                <p>• <strong>For accounting:</strong> CSV/HTML can be loaded directly inside Excel, Google Sheets, or any browser tab offline.</p>
                <p>• <strong>Restore:</strong> If you lose your session, upload this JSON file on the same backups page to restore your confidential ledger.</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-mono font-semibold text-zinc-500">File Reference: {downloadModalFilename}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(downloadModalContent);
                  setCopyFeedbackActive(true);
                  setTimeout(() => setCopyFeedbackActive(false), 2000);
                }}
                className={`py-1.5 px-4 font-black rounded-lg text-xs transition-all uppercase tracking-wide flex items-center justify-center gap-1.5 ${
                  copyFeedbackActive
                    ? 'bg-emerald-500 text-stone-950'
                    : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 active:scale-95'
                }`}
              >
                <span>{copyFeedbackActive ? '✓ Copied to Clipboard' : '📋 Copy Ledger Text'}</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#050505]/85 border border-stone-850 p-3 rounded-xl">
              <pre className="text-[10px] font-mono text-zinc-400 overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">
                {downloadModalContent}
              </pre>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
