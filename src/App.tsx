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
  RotateCcw,
  Bell,
  X,
  Brain
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
  FundTransfer,
  CustomThemeConfig
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
import EchelonOnboardingScreen from './components/EchelonOnboardingScreen';

// Utilities
import { encryptData, decryptData, hashPin } from './utils/security';
import { getColorTokens } from './utils/theme';
import { calculateLoanCurrentBalance, calculateWealthRates, calculateCreditCardEffectiveLiability } from './utils/math';
import { generateCSVData, generateHTMLReport, downloadBlob } from './utils/export';

// Default initial state for a fresh setup
const createInitialState = (): EchelonState => ({
  version: 2,
  isLocked: true,
  isOnboarded: false,
  pinHash: '',
  assets: [
    {
      id: 'asset-cash-wallet',
      type: AssetType.CASH_CARRY,
      name: 'Cash Wallet',
      institution: 'Physical Cash',
      currentValue: 0,
      realisedReturns: 0,
      annualGrowthRate: 0,
      lastUpdated: new Date().toISOString()
    }
  ],
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
  customSavingsGoalAmt: 5000,
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

  // Safeguards Notification Center state
  const [sessionDismissedAlertIds, setSessionDismissedAlertIds] = useState<string[]>([]);
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);

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
  const [newThemeBgColor, setNewThemeBgColor] = useState<string>('#08080a');
  const [newThemeTextColor, setNewThemeTextColor] = useState<string>('#f3f0fa');
  const [newThemeBtnBgColor, setNewThemeBtnBgColor] = useState<string>('#1c1917');
  const [newThemeBtnTextColor, setNewThemeBtnTextColor] = useState<string>('#ffffff');
  const [newThemeFontStyle, setNewThemeFontStyle] = useState<'classic-inter' | 'cyber-mono' | 'serif-editorial'>('cyber-mono');
  const [themeModeTab, setThemeModeTab] = useState<'dark' | 'light'>('dark');

  // Interactive Alert Builder state
  const [newAlertName, setNewAlertName] = useState<string>('');
  const [newAlertAssetIds, setNewAlertAssetIds] = useState<string[]>([]);
  const [newAlertConditionType, setNewAlertConditionType] = useState<'below_amount' | 'above_amount' | 'below_percent' | 'above_percent'>('below_amount');
  const [newAlertThresholdValue, setNewAlertThresholdValue] = useState<string>('');

  // Dynamic AI Insight Alert banner
  const [newInsightAlert, setNewInsightAlert] = useState<{ message: string; actionMsg: string } | null>(null);

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
    
    // Rotate through custom checkbox list if any, otherwise default list of system themes
    const activeMode = vaultData.theme.mode || 'dark';
    const darkSystemKeys = ['stealth-gold', 'black-steel', 'royal-emerald', 'rose-amethyst', 'platinum-silver'];
    const lightSystemKeys = ['skyblue', 'pure-light', 'sand-drift', 'lavender-blush', 'mint-fresh'];
    
    const selectedSlideshowThemes = (vaultData.slideshowThemeKeys && vaultData.slideshowThemeKeys.length > 0)
      ? vaultData.slideshowThemeKeys
      : (activeMode === 'light' ? lightSystemKeys : darkSystemKeys);

    const cycleTimer = setInterval(() => {
      if (selectedSlideshowThemes.length === 0) return;
      const currentPalette = vaultData.theme.palette;
      const currentIdx = selectedSlideshowThemes.indexOf(currentPalette);
      const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % selectedSlideshowThemes.length;
      const nextPalette = selectedSlideshowThemes[nextIdx];

      let targetMode: 'dark' | 'light' = 'dark';
      if (nextPalette.startsWith('custom-')) {
        const cTheme = (vaultData.customThemeConfigs || []).find(c => `custom-${c.id}` === nextPalette);
        targetMode = cTheme ? cTheme.bgMode : 'dark';
      } else if (['skyblue', 'pure-light', 'sand-drift', 'lavender-blush', 'mint-fresh'].includes(nextPalette)) {
        targetMode = 'light';
      }

      handleChangeTheme({
        mode: targetMode,
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
          
          // Migrations to ensure all fields are initialized securely
          if (parsedData.customSavingsGoalAmt === undefined) {
            parsedData.customSavingsGoalAmt = 5000;
          }
          if (parsedData.isOnboarded === undefined) {
            // If they already have loaded assets/loans, let's treat them as onboarded so we don't annoy them
            parsedData.isOnboarded = parsedData.assets && parsedData.assets.length > 0;
          }
          if (!parsedData.assets) {
            parsedData.assets = [];
          }
          const hasCash = parsedData.assets.some(a => a.type === AssetType.CASH_CARRY);
          if (!hasCash) {
            parsedData.assets.push({
              id: 'asset-cash-wallet',
              type: AssetType.CASH_CARRY,
              name: 'Cash Wallet',
              institution: 'Physical Cash',
              currentValue: 0,
              realisedReturns: 0,
              annualGrowthRate: 0,
              lastUpdated: new Date().toISOString()
            });
          }

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

    // Trigger AI tax insight alert for portfolio & outflow mutations
    const msg = actionMsg.toLowerCase();
    if (
      msg.includes('asset') ||
      msg.includes('debt') ||
      msg.includes('budget') ||
      msg.includes('expense') ||
      msg.includes('outflow') ||
      msg.includes('transfer')
    ) {
      setNewInsightAlert({
        message: `Your recent portfolio transaction/budget adjustments ("${actionMsg}") altered your tax slab exposure or compounding velocity. Click here to trigger a Sovereign AI compilation of your updated compliance dossier!`,
        actionMsg: actionMsg
      });
    }
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

  const handleConfirmBondPayment = (ruleId: string, assetId: string) => {
    if (!vaultData) return;
    const currentDate = new Date();
    const currentYearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const asset = vaultData.assets.find(a => a.id === assetId);
    if (!asset) return;
    
    const updatedConfirmed = [...(asset.bondPaymentsConfirmed || []), currentYearMonth];
    const interestAmt = asset.bondInterestAmount || 0;
    
    // Dismiss interest payout alert in session
    setSessionDismissedAlertIds(prev => [...prev, ruleId]);
    
    mutateVaultData(`Confirmed Bond Receipt: ${asset.name}`, (current) => ({
      ...current,
      assets: current.assets.map(a => {
        if (a.id === assetId) {
          return {
            ...a,
            realisedReturns: (a.realisedReturns || 0) + interestAmt,
            bondPaymentsConfirmed: updatedConfirmed,
            lastUpdated: new Date().toISOString()
          };
        }
        return a;
      })
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

  const handleUpdateTaggedBufferAssetId = (assetId: string) => {
    mutateVaultData(`Updated Tagged Safety Buffer Asset`, (current) => ({
      ...current,
      taggedBufferAssetId: assetId,
      taggedBufferAssetIds: assetId ? [assetId] : [],
    }));
  };

  const handleUpdateTaggedBufferAssetIds = (assetIds: string[]) => {
    mutateVaultData(`Updated Tagged Safety Buffer Assets`, (current) => ({
      ...current,
      taggedBufferAssetIds: assetIds,
      taggedBufferAssetId: assetIds[0] || '',
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
  const handleAddOutflow = (expenseData: Omit<Expense, 'id'>, source: { sourceType: 'bank_balance' | 'credit_card' | 'cash_carry'; sourceId: string }) => {
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
      } else if (source.sourceType === 'cash_carry') {
        const cashAsset = updatedAssets.find(a => a.id === source.sourceId);
        if (cashAsset) {
          sourceName = cashAsset.name;
          cashAsset.currentValue = parseFloat((cashAsset.currentValue - expenseData.amount).toFixed(2));
          remainderLeft = cashAsset.currentValue;
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

  const handleDismissAlert = (alertItem: { rule: AlertRule; message: string; severity: 'warning' | 'info' }) => {
    if (!vaultData) return;
    const rule = alertItem.rule;
    const selectedAssets = vaultData.assets.filter(a => rule.assetIds && rule.assetIds.includes(a.id));
    const combinedValue = selectedAssets.reduce((sum, a) => sum + a.currentValue, 0);
    const linkedNames = selectedAssets.map(a => a.name).join(', ') || 'Global';

    setSessionDismissedAlertIds(prev => [...prev, rule.id]);

    const newAckRecord: AcknowledgedAlertRecord = {
      id: `ack-${Date.now()}-${rule.id}`,
      ruleName: rule.name,
      message: alertItem.message,
      date: new Date().toISOString(),
      linkedFundName: linkedNames,
      closingBalance: combinedValue,
    };

    mutateVaultData(`Dismissed Safeguard Alert: ${rule.name}`, (current) => ({
      ...current,
      acknowledgedAlerts: [newAckRecord, ...(current.acknowledgedAlerts || [])],
    }));
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

  const handleUpdateUsdConversionRate = (rate: number) => {
    if (!vaultData) return;
    saveVaultData({
      ...vaultData,
      usdConversionRate: rate,
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

  const handleAddCustomTheme = (
    name: string,
    color: string,
    bgMode: 'dark' | 'light',
    bgColor: string,
    textColor: string,
    buttonBgColor: string,
    buttonTextColor: string,
    fontStyle: 'classic-inter' | 'cyber-mono' | 'serif-editorial'
  ) => {
    if (!vaultData) return;
    const currentThemes = vaultData.customThemeConfigs || [];
    const modeThemesCount = currentThemes.filter(c => c.bgMode === bgMode).length;
    if (modeThemesCount >= 5) {
      alert(`Limit Reached: You have reached the limit of 5 custom themes for ${bgMode} mode. Under security rules, please delete an existing custom theme in this mode first.`);
      return;
    }
    const newTheme: CustomThemeConfig = {
      id: `th-${Date.now()}`,
      name,
      primaryColor: color,
      bgMode,
      backgroundColor: bgColor,
      textColor: textColor,
      accentColor: color,
      buttonBgColor: buttonBgColor,
      buttonTextColor: buttonTextColor,
      fontStyle: fontStyle,
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

  // Calculate aggregate portfolio values for goal timetables
  const totalAssetsVal = vaultData 
    ? vaultData.assets.reduce((sum, a) => {
        const rate = vaultData.usdConversionRate !== undefined ? vaultData.usdConversionRate : 83.5;
        const val = a.isUSAsset ? a.currentValue * rate : a.currentValue;
        return sum + val;
      }, 0) 
    : 0;
  const totalLentVal = vaultData ? vaultData.loans
    .filter(l => l.type === LoanType.LENT)
    .reduce((sum, l) => sum + calculateLoanCurrentBalance(l), 0) : 0;
  const totalBorrowedVal = vaultData ? vaultData.loans
    .filter(l => l.type === LoanType.BORROWED)
    .reduce((sum, l) => sum + calculateLoanCurrentBalance(l), 0) : 0;
  
  const totalCreditCardLiabilitiesVal = vaultData ? (vaultData.creditCards || [])
    .reduce((sum, c) => sum + calculateCreditCardEffectiveLiability(c), 0) : 0;
  
  const totalNetWorth = totalAssetsVal + totalLentVal - totalBorrowedVal - totalCreditCardLiabilitiesVal;
  
  const rates = vaultData ? calculateWealthRates(
    vaultData.assets,
    vaultData.loans,
    vaultData.monthlyEarnings,
    vaultData.expenses,
    totalNetWorth,
    vaultData.userOverriddenExpenses,
    vaultData.customSavingsGoalAmt,
    vaultData.budget.amount,
    vaultData.usdConversionRate !== undefined ? vaultData.usdConversionRate : 83.5
  ) : {
    earningsPerHour: 0, lossesPerHour: 0, netPerHour: 0,
    earningsPerDay: 0, lossesPerDay: 0, netPerDay: 0,
    earningsPerMonth: 0, lossesPerMonth: 0, netPerMonth: 0,
    earningsPerYear: 0, lossesPerYear: 0, netPerYear: 0,
    earningsPerFiveYears: 0, lossesPerFiveYears: 0, netPerFiveYears: 0,
    earningsRatePercentOfYear: 0,
  };

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

    // 1. Bond Interest Payout Alerts
    vaultData.assets.forEach(asset => {
      if (asset.type === 'BOND' && asset.bondInterestPayoutDate && asset.bondInterestAmount) {
        const currentDate = new Date();
        const currentYearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        
        // Has the user confirmed this month's interest payout?
        const hasConfirmedThisMonth = asset.bondPaymentsConfirmed && asset.bondPaymentsConfirmed.includes(currentYearMonth);
        
        if (!hasConfirmedThisMonth) {
          const payoutDay = parseInt(asset.bondInterestPayoutDate, 10);
          const currentDay = currentDate.getDate();
          
          if (currentDay >= payoutDay) {
            triggered.push({
              rule: {
                id: `bond-interest-payout-${asset.id}-${currentYearMonth}`,
                name: `Bond Payout Confirmation: ${asset.name}`,
                assetIds: [asset.id],
                conditionType: 'above_amount',
                targetAmount: asset.bondInterestAmount,
                isActive: true
              },
              message: `📅 Bond Interest Due! [${asset.name}] (${asset.bondRiskFactor || 'Unrated'} Risk) has an interest payment of ${vaultData.currencySymbol || '₹'}${asset.bondInterestAmount.toLocaleString()} set on day ${payoutDay} of this month. Please confirm receipt.`,
              severity: 'info'
            });
          }
        }
      }
    });

    // 2. Budget Daily Overrun Alert
    if (vaultData.budget && vaultData.budget.amount > 0) {
      let daysCount = 30;
      if (vaultData.budget.period === 'WEEKLY') daysCount = 7;
      if (vaultData.budget.period === 'YEARLY') daysCount = 365;
      
      const dailyLimit = vaultData.budget.amount / daysCount;
      const todayString = new Date().toDateString();
      const todayExpensesSum = vaultData.expenses
        .filter(exp => new Date(exp.date).toDateString() === todayString)
        .reduce((sum, exp) => sum + exp.amount, 0);
        
      if (todayExpensesSum > dailyLimit) {
        triggered.push({
          rule: {
            id: `budget-daily-limit-excess`,
            name: `Daily Budget Overrun`,
            conditionType: 'above_amount',
            targetAmount: dailyLimit,
            isActive: true,
            assetIds: []
          },
          message: `⚠️ Daily Cap Overrun! Today's logged expenses of ${vaultData.currencySymbol || '₹'}${todayExpensesSum.toLocaleString()} have exceeded your calculated daily budget limit of ${vaultData.currencySymbol || '₹'}${dailyLimit.toLocaleString('en-IN', { maximumFractionDigits: 1 })}. Pluck or trim excess leisure outlays!`,
          severity: 'warning'
        });
      }
    }
    
    return triggered;
  };

  // Prune any stale session-dismissed alerts that are no longer triggering
  useEffect(() => {
    if (!vaultData) return;
    const activeAlertIds = getTriggeredAlerts().map(a => a.rule.id);
    setSessionDismissedAlertIds(prev => prev.filter(id => activeAlertIds.includes(id)));
  }, [vaultData?.assets, vaultData?.loans, vaultData?.expenses, vaultData?.creditCards]);

  const triggeredAlerts = getTriggeredAlerts();
  const unacknowledgedAlerts = triggeredAlerts.filter(a => !sessionDismissedAlertIds.includes(a.rule.id));
  const unacknowledgedAlertsCount = unacknowledgedAlerts.length;

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

  // If the user has not onboarded their salary and budget, show the baseline setup wizard
  if (!vaultData.isOnboarded) {
    return (
      <EchelonOnboardingScreen
        theme={vaultData.theme}
        currencySymbol={vaultData.currencySymbol || '₹'}
        onComplete={(salary, budgetAmt, bufferAmt) => {
          saveVaultData({
            ...vaultData,
            monthlyEarnings: salary,
            budget: {
              ...vaultData.budget,
              amount: budgetAmt,
            },
            customSavingsGoalAmt: bufferAmt,
            isOnboarded: true,
          });
        }}
      />
    );
  }

  // Active theme parameters
  const tokens = getColorTokens(vaultData.theme);
  const activeColor = vaultData.activeAccentColor || '#f59e0b';
  const activeCustomTheme = vaultData && vaultData.theme.palette.startsWith('custom-')
    ? (vaultData.customThemeConfigs || []).find(c => `custom-${c.id}` === vaultData.theme.palette)
    : null;
  const activeFontClass = activeCustomTheme?.fontStyle || vaultData?.selectedFontOption || 'classic-inter';

  return (
    <div className={`min-h-screen ${tokens.bg} pb-36 transition-colors duration-500 text-stone-100 relative font-${activeFontClass}`}>
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
        
        ${activeCustomTheme ? `
          .custom-theme-bg { background-color: ${activeCustomTheme.backgroundColor || '#08080a'} !important; }
          .custom-theme-card { 
            background-color: ${activeCustomTheme.backgroundColor ? activeCustomTheme.backgroundColor + 'cc' : '#111115cc'} !important; 
            border-color: ${(activeCustomTheme.accentColor || activeColor)}22 !important; 
          }
          .custom-theme-card-hover:hover {
            background-color: ${activeCustomTheme.backgroundColor ? activeCustomTheme.backgroundColor + 'ee' : '#14141dee'} !important;
            border-color: ${(activeCustomTheme.accentColor || activeColor)}44 !important;
          }
          .custom-theme-text-primary { color: ${activeCustomTheme.textColor || '#f3f0fa'} !important; }
          .custom-theme-text-secondary { color: ${(activeCustomTheme.textColor || '#f3f0fa')}cc !important; }
          .custom-theme-accent { background-color: ${activeCustomTheme.accentColor || activeColor} !important; color: ${activeCustomTheme.buttonTextColor || '#000000'} !important; }
          .custom-theme-accent-text { color: ${activeCustomTheme.accentColor || activeColor} !important; }
          .custom-theme-border { border-color: ${(activeCustomTheme.textColor || '#f3f0fa')}22 !important; }
          .custom-theme-border-accent { border-color: ${activeCustomTheme.accentColor || activeColor} !important; }
          .custom-theme-button-bg { background-color: ${activeCustomTheme.buttonBgColor || '#1c1917'} !important; color: ${activeCustomTheme.buttonTextColor || '#ffffff'} !important; }
          .custom-theme-badge-bg { background-color: ${(activeCustomTheme.accentColor || activeColor)}18 !important; border-color: ${(activeCustomTheme.accentColor || activeColor)}33 !important; }
          .custom-theme-badge-text { color: ${activeCustomTheme.accentColor || activeColor} !important; }
        ` : ''}
      `}</style>
      
      {/* 1. SECURE TOP NAVIGATION HEADER */}
      <header className={`sticky top-0 z-30 border-b backdrop-blur-md bg-opacity-80 py-2 max-w-7xl mx-auto px-4 ${tokens.card}`}>
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
            
            {/* Safeguards Audit & Notifications Button */}
            <button
              type="button"
              id="notifications-bell-btn"
              onClick={() => setShowNotificationsModal(true)}
              className={`p-2 bg-zinc-900 border border-stone-800 text-stone-300 rounded-xl hover:text-amber-500 hover:border-amber-500/30 transition-all flex items-center justify-center relative ${
                unacknowledgedAlertsCount > 0 ? 'animate-pulse ring-2 ring-rose-500/40' : ''
              }`}
              title="Confidential Safeguard Alert Centre"
            >
              <Bell className={`h-4 w-4 ${unacknowledgedAlertsCount > 0 ? 'text-amber-500' : 'text-stone-400'}`} />
              {unacknowledgedAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-rose-500 text-[8.5px] font-mono font-bold text-white rounded-full flex items-center justify-center border border-stone-900">
                  {unacknowledgedAlertsCount}
                </span>
              )}
            </button>
            
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
        
        {newInsightAlert && (
          <div 
            onClick={() => {
              setActiveTab('ai');
              setNewInsightAlert(null);
            }}
            className="animate-pulse cursor-pointer group"
          >
            <div className="p-4 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 rounded-2xl flex items-center justify-between gap-4 transition-all duration-305 shadow-xl shadow-amber-500/5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 text-amber-500 rounded-xl border border-amber-500/30">
                  <Brain className="h-5 w-5 text-amber-500 animate-bounce" />
                </div>
                <div>
                  <span className="text-[10px] font-mono leading-none tracking-widest text-amber-500 uppercase block font-black mb-1">
                    ⚡ NEW SOVEREIGN WEALTH INSIGHT CHANNELD
                  </span>
                  <p className="text-xs text-stone-200 font-mono leading-relaxed group-hover:text-amber-400 transition-colors">
                    {newInsightAlert.message}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setNewInsightAlert(null);
                }}
                className="p-1 px-2.5 rounded-lg text-stone-500 hover:text-stone-300 hover:bg-stone-850/50 text-[10px] uppercase font-mono font-bold transition-all border border-stone-800"
              >
                Dismiss
              </button>
            </div>
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
                taggedBufferAssetId={vaultData.taggedBufferAssetId}
                onUpdateTaggedBufferAsset={handleUpdateTaggedBufferAssetId}
                taggedBufferAssetIds={vaultData.taggedBufferAssetIds || []}
                onUpdateTaggedBufferAssets={handleUpdateTaggedBufferAssetIds}
                onChangeTab={setActiveTab}
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
              usdConversionRate={vaultData.usdConversionRate !== undefined ? vaultData.usdConversionRate : 83.5}
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
              usdConversionRate={vaultData.usdConversionRate !== undefined ? vaultData.usdConversionRate : 83.5}
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

      {/* ECHELON SAFEGUARDS NOTIFICATION & AUDIT CENTRE MODAL */}
      {showNotificationsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-zinc-900 border border-stone-850 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-stone-100 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-850 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Bell className="h-5 w-5 text-amber-500 animate-pulse" />
                  <span>Safeguards Notification & Audit Centre</span>
                </h2>
                <p className="text-xs text-stone-500">Acknowledge boundary violations and audit past archived security events</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNotificationsModal(false)}
                className="px-3 py-1 bg-stone-850 hover:bg-stone-800 text-stone-400 hover:text-white rounded-xl text-xs font-mono font-bold transition-all"
              >
                Close
              </button>
            </div>

            {/* Active alerts panel */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase font-black tracking-widest text-amber-500">
                ⚠️ Active Safeguard Violations ({unacknowledgedAlerts.length})
              </h3>
              
              {unacknowledgedAlerts.length === 0 ? (
                <div className="p-6 border border-dashed border-stone-800 rounded-2xl text-center space-y-2">
                  <p className="text-xs font-mono text-emerald-400">✓ ALL TREASURY BOUNDARIES COMPLIANT</p>
                  <p className="text-[11px] text-stone-500">None of your custom rules, sink thresholds, or allocation weights are flagged.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unacknowledgedAlerts.map((alertItem, idx) => {
                    const rule = alertItem.rule;
                    const selectedAssets = vaultData.assets.filter(a => rule.assetIds && rule.assetIds.includes(a.id));
                    const combinedValue = selectedAssets.reduce((sum, a) => sum + a.currentValue, 0);

                    return (
                      <div key={idx} className="p-4 bg-rose-950/25 border border-rose-500/25 rounded-2xl space-y-3 shadow-md flex flex-col justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-rose-400 flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
                              Rule [{rule.name}] Flagged
                            </span>
                            <span className="text-[10px] font-mono text-rose-500 uppercase font-semibold">Severity: {alertItem.severity}</span>
                          </div>
                          <p className="text-xs text-stone-200 leading-relaxed font-sans">{alertItem.message}</p>
                          <div className="text-[10px] text-stone-500 font-mono space-y-0.5">
                            <div>• Linked Fund Assets: {selectedAssets.map(a => a.name).join(', ') || 'Global'}</div>
                            <div>• Target Limit: {vaultData.currencySymbol || '₹'}{(rule.targetAmount || 0).toLocaleString()} </div>
                            <div>• Closing Boundary Balance: <strong className="text-white">{vaultData.currencySymbol || '₹'}{combinedValue.toLocaleString()}</strong></div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          {rule.id.startsWith("bond-interest-payout-") && (
                            <button
                              type="button"
                              onClick={() => handleConfirmBondPayment(rule.id, selectedAssets[0]?.id || '')}
                              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-450 text-stone-950 text-[10px] font-mono font-black uppercase tracking-wider rounded-xl transition-all"
                            >
                              🤝 Confirm Payment Receipt
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDismissAlert(alertItem)}
                            className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500 hover:text-stone-950 border border-rose-500/20 text-rose-400 text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all"
                          >
                            {rule.id.startsWith("bond-interest-payout-") ? 'Remind Me Later' : '✓ Dismiss & Archive Event'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Historic audit logs feed */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-mono uppercase font-black tracking-widest text-stone-400">
                📜 Permanently Archived Security Audit Trails ({ (vaultData.acknowledgedAlerts || []).length })
              </h3>
              
              {(!vaultData.acknowledgedAlerts || vaultData.acknowledgedAlerts.length === 0) ? (
                <div className="p-4 bg-stone-900/40 border border-stone-850/50 rounded-2xl text-center">
                  <p className="text-[11px] text-stone-500 italic font-sans">No historic audit records logged yet.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {vaultData.acknowledgedAlerts.map((ack) => (
                    <div key={ack.id} className="p-3 bg-stone-900/40 border border-stone-850/40 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-stone-400 font-bold">{ack.ruleName}</span>
                        <span className="text-stone-500">{new Date(ack.date).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-stone-300 font-sans">{ack.message}</p>
                      {ack.linkedFundName && (
                        <div className="text-[9.5px] text-stone-500 font-mono">
                          Linked Asset Anchor: {ack.linkedFundName} | Closing Boundary Val: <span className="text-stone-400 font-semibold">{vaultData.currencySymbol || '₹'}{(ack.closingBalance || 0).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

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
              <div className="flex items-center gap-2 mr-8 md:mr-10">
                <button
                  type="button"
                  id="export-pdf-top-btn"
                  onClick={() => setSettingsTab('backups')}
                  className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-stone-300 border border-stone-750 hover:text-amber-500 rounded-xl text-xs font-semibold transition-all font-mono flex items-center gap-1.5"
                  title="Navigate to Settings Downloads"
                >
                  <Download className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>Download</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 text-rose-400 hover:text-stone-950 transition-all font-bold"
                title="Dismiss Configurations"
              >
                <X className="h-4 w-4" />
              </button>
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

                <div className="space-y-2 pt-2 border-t border-stone-850/40">
                  <div className="flex justify-between items-center text-xs font-bold text-stone-200">
                    <label htmlFor="settings-usd-rate-input" className="text-stone-300">USD Conversion Rate (1 USD = X Base Currency)</label>
                    <span className="text-[10px] font-mono text-amber-500">Current: {vaultData.usdConversionRate || 83.5}</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      id="settings-usd-rate-input"
                      step="0.01"
                      min="0.01"
                      placeholder="e.g. 83.50"
                      value={vaultData.usdConversionRate !== undefined ? vaultData.usdConversionRate : 83.5}
                      onChange={(e) => handleUpdateUsdConversionRate(parseFloat(e.target.value) || 83.5)}
                      className="w-full max-w-[200px] px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-stone-200 text-xs font-mono focus:outline-none focus:border-amber-500"
                    />
                    <div className="flex gap-1.5">
                      {[83.5, 84.0, 85.0].map((rVal) => (
                        <button
                          key={rVal}
                          type="button"
                          onClick={() => handleUpdateUsdConversionRate(rVal)}
                          className="px-2 py-1.5 rounded-xl border border-stone-800 bg-stone-950/40 text-[9px] font-mono hover:bg-stone-800 text-stone-400"
                        >
                          {rVal}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-stone-500">This rate converts foreign holdings (e.g. US Delivery Stocks) to your base global currency symbol ({vaultData.currencySymbol || '₹'}) when compiling aggregate metrics and yields.</p>
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
              <div className="space-y-5 animate-fade-in text-stone-300">
                
                {/* 1. Mode Tab Selector */}
                <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-850">
                  <button
                    type="button"
                    onClick={() => {
                      setThemeModeTab('dark');
                      setNewThemeColor('#f59e0b');
                      setNewThemeBgColor('#08080a');
                      setNewThemeTextColor('#f3f0fa');
                      setNewThemeBtnBgColor('#1c1917');
                      setNewThemeBtnTextColor('#ffffff');
                    }}
                    className={`flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-all ${
                      themeModeTab === 'dark' 
                        ? 'bg-amber-500/15 border border-amber-500/35 text-amber-400' 
                        : 'text-stone-500 hover:text-stone-300'
                    }`}
                  >
                    Dark Themes (Obsidian)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setThemeModeTab('light');
                      setNewThemeColor('#10b981');
                      setNewThemeBgColor('#f0fdf4');
                      setNewThemeTextColor('#064e3b');
                      setNewThemeBtnBgColor('#d1fae5');
                      setNewThemeBtnTextColor('#064e3b');
                    }}
                    className={`flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-all ${
                      themeModeTab === 'light' 
                        ? 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-400' 
                        : 'text-stone-500 hover:text-stone-300'
                    }`}
                  >
                    Light Themes (Alabaster)
                  </button>
                </div>

                {/* 2. System and Custom Themes list */}
                <div>
                  <span className="text-xs font-bold text-stone-200 block mb-2">
                    Available {themeModeTab === 'dark' ? 'Dark' : 'Light'} Custom & Standard Matrices
                  </span>
                  
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 border border-stone-850 p-2.5 rounded-xl bg-stone-950/40 scrollbar-thin">
                    {(() => {
                      // Define system themes for active tab
                      const systemThemes = themeModeTab === 'dark' 
                        ? [
                            { palette: 'elegant-dark', label: 'Platinum Dark (Original)', desc: 'Slate-polished minimalist obsidian backdrop' },
                            { palette: 'black', label: 'Charcoal Gold', desc: 'Prestige gold accents tracing extreme deep black obsidian' },
                            { palette: 'silver', label: 'Swiss Royal Silver', desc: 'Symmetrical Swiss luxury silver with electric blue highlights' },
                            { palette: 'blue', label: 'Midnight Teal', desc: 'Luminous galactic copper neon mapping midnight space' },
                            { palette: 'stealth-gold', label: 'Stealth Matte Gold', desc: 'Low-emission military matte titanium with luxury gold tracing' }
                          ]
                        : [
                            { palette: 'skyblue', label: 'Clear Skyblue', desc: 'Airborne summer sky blue with pure black high-contrast text' },
                            { palette: 'pure-light', label: 'Pure Chaste Alabaster', desc: 'Bright sterile medical clean white with rich dark-stone text' },
                            { palette: 'sand-drift', label: 'Sahara Sand', desc: 'Sophisticated warm golden sand dunes tracing coffee undertones' },
                            { palette: 'lavender-blush', label: 'Lavender Blossom', desc: 'Delicate light amethyst with high-definition royal violet fonts' },
                            { palette: 'mint-fresh', label: 'Spearmint Fresh', desc: 'Dynamic energetic mint light green with rich emerald outlines' }
                          ];

                      const customThemes = (vaultData.customThemeConfigs || []).filter(c => c.bgMode === themeModeTab);
                      
                      return (
                        <>
                          {/* System themes */}
                          {systemThemes.map(st => {
                            const isCur = vaultData.theme.palette === st.palette;
                            const isSelectedInSlideshow = (vaultData.slideshowThemeKeys || []).includes(st.palette);
                            return (
                              <div key={st.palette} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-stone-900/40 border border-stone-850 gap-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-stone-100">{st.label}</span>
                                    <span className="text-[8px] bg-stone-800 border border-stone-700 text-stone-400 font-mono px-1.5 py-0.2 rounded font-semibold uppercase">SYSTEM</span>
                                  </div>
                                  <p className="text-[10px] text-stone-500 leading-relaxed mt-0.5">{st.desc}</p>
                                </div>
                                <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                                  {/* Slideshow inclusion checkbox */}
                                  <label className="flex items-center gap-1.5 cursor-pointer text-[10px] select-none text-stone-400 hover:text-stone-300">
                                    <input 
                                      type="checkbox"
                                      className="accent-amber-500 rounded cursor-pointer h-3.5 w-3.5"
                                      checked={isSelectedInSlideshow}
                                      onChange={() => {
                                        const keys = vaultData.slideshowThemeKeys || [];
                                        const updated = keys.includes(st.palette) 
                                          ? keys.filter(k => k !== st.palette)
                                          : [...keys, st.palette];
                                        saveVaultData({
                                          ...vaultData,
                                          slideshowThemeKeys: updated
                                        });
                                      }}
                                    />
                                    <span className="font-mono">In Slideshow</span>
                                  </label>

                                  <button
                                    type="button"
                                    onClick={() => handleChangeTheme({ mode: themeModeTab, palette: st.palette as any })}
                                    className={`px-3 py-1 rounded-lg text-[10px] font-bold ${
                                      isCur 
                                        ? 'bg-amber-500 text-zinc-950' 
                                        : 'bg-zinc-800 hover:bg-zinc-700 text-stone-300 border border-stone-800'
                                    }`}
                                  >
                                    Activate
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                          {/* Custom themes */}
                          {customThemes.length === 0 ? (
                            <div className="text-[10px] text-stone-500 italic font-mono py-1.5 text-center">
                              No custom {themeModeTab} themes have been added yet. Add one below to customize!
                            </div>
                          ) : (
                            customThemes.map(t => {
                              const themeKey = `custom-${t.id}`;
                              const isCur = vaultData.theme.palette === themeKey;
                              const isSelectedInSlideshow = (vaultData.slideshowThemeKeys || []).includes(themeKey);
                              return (
                                <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-stone-900/70 border border-stone-850 gap-3">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-semibold text-amber-500">{t.name}</span>
                                      <span className="text-[8px] bg-amber-500/10 border border-amber-500/20 text-amber-500 font-mono px-1.5 py-0.2 rounded font-bold uppercase">CUSTOM</span>
                                    </div>
                                    <p className="text-[9.5px] font-mono text-stone-500 leading-relaxed mt-0.5">
                                      Background: {t.backgroundColor} | Primary Accent: {t.primaryColor} | Text: {t.textColor}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                                    {/* Slideshow inclusion checkbox */}
                                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] select-none text-stone-400 hover:text-stone-300">
                                      <input 
                                        type="checkbox"
                                        className="accent-amber-500 rounded cursor-pointer h-3.5 w-3.5"
                                        checked={isSelectedInSlideshow}
                                        onChange={() => {
                                          const keys = vaultData.slideshowThemeKeys || [];
                                          const updated = keys.includes(themeKey) 
                                            ? keys.filter(k => k !== themeKey)
                                            : [...keys, themeKey];
                                          saveVaultData({
                                            ...vaultData,
                                            slideshowThemeKeys: updated
                                          });
                                        }}
                                      />
                                      <span className="font-mono">In Slideshow</span>
                                    </label>

                                    <button
                                      type="button"
                                      onClick={() => handleChangeTheme({ mode: themeModeTab, palette: themeKey as any })}
                                      className={`px-3 py-1 rounded-lg text-[10px] font-bold ${
                                        isCur 
                                          ? 'bg-amber-500 text-zinc-950' 
                                          : 'bg-zinc-800 hover:bg-zinc-700 text-stone-300 border border-stone-800'
                                      }`}
                                    >
                                      Activate
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveCustomTheme(t.id)}
                                      className="text-red-500 hover:text-red-400 hover:bg-red-500/5 text-[9.5px] font-mono font-extrabold uppercase shrink-0 px-2 py-1 rounded border border-red-500/10 hover:border-red-500/20"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* 3. Atmosphere Slideshow Mode controls */}
                <div className="bg-stone-500/5 p-4 rounded-xl border border-stone-850/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-stone-200 block">Atmosphere Slideshow Mode</span>
                      <p className="text-[10px] text-stone-500 mt-0.5">Automatically cycle between the selected custom or system themes over customizable timeslots</p>
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
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 animate-fade-in pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-stone-500 font-mono">Cycle Interval Preset:</span>
                        <select
                          id="theme-slideshow-interval"
                          value={[5, 10, 30, 60, 300].includes(vaultData.slideshowIntervalSeconds || 10) ? vaultData.slideshowIntervalSeconds || 10 : "custom"}
                          onChange={(e) => {
                            if (e.target.value !== "custom") {
                              handleToggleThemeSlideshow(true, parseInt(e.target.value) || 10);
                            }
                          }}
                          className="bg-stone-950 border border-stone-800 rounded px-2.5 py-1 text-xs text-white font-mono"
                        >
                          <option value="5">5 Seconds</option>
                          <option value="10">10 Seconds</option>
                          <option value="30">30 Seconds</option>
                          <option value="60">1 Minute</option>
                          <option value="300">5 Minutes</option>
                          <option value="custom">Custom Entry</option>
                        </select>
                      </div>

                      {/* Custom input entry field in seconds */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-stone-500 font-mono">Custom Entry (Seconds):</span>
                        <input
                          type="number"
                          min="1"
                          id="theme-slideshow-interval-custom"
                          value={vaultData.slideshowIntervalSeconds || 10}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 10;
                            handleToggleThemeSlideshow(true, val);
                          }}
                          className="w-20 px-2 py-0.5 bg-stone-950 border border-stone-850 text-xs font-mono font-bold text-white rounded text-center focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Rich Custom Theme Creation Card */}
                {(() => {
                  const currentModeThemes = (vaultData.customThemeConfigs || []).filter(c => c.bgMode === themeModeTab);
                  const limitReached = currentModeThemes.length >= 5;
                  const activeModeCount = 5 + currentModeThemes.length;
                  
                  return (
                    <div className="p-4 rounded-xl border border-stone-850/60 space-y-4 bg-stone-500/5">
                      <div>
                        <span className="text-xs font-bold text-stone-200 block">Create Bespoke {themeModeTab === 'dark' ? 'Dark' : 'Light'} Custom Theme Composition</span>
                        <p className="text-[10px] text-stone-500 leading-relaxed mt-1">
                          Echelon allows up to a maximum limit of <strong className="font-bold text-amber-500">10 theme configurations</strong> per mode (5 system + 5 custom). Currently you have <strong className="font-bold text-amber-500">{activeModeCount}/10</strong> active profiles in <span className="capitalize font-semibold">{themeModeTab} Mode</span>.
                        </p>
                      </div>

                      {!limitReached ? (
                        <div className="space-y-3.5">
                          {/* Top row: Name & Fonts */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[9px] uppercase font-bold text-stone-400 font-mono block mb-1">Theme Title name</label>
                              <input
                                type="text"
                                placeholder={`e.g. Royal ${themeModeTab === 'dark' ? 'Obsidian' : 'Emerald'}`}
                                value={newThemeName}
                                onChange={(e) => setNewThemeName(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-800 text-xs text-stone-200 rounded-lg outline-none focus:border-amber-500 transition-all font-semibold"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] uppercase font-bold text-stone-400 font-mono block mb-1">Typography Font pairing</label>
                              <select
                                value={newThemeFontStyle}
                                onChange={(e) => setNewThemeFontStyle(e.target.value as any)}
                                className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-800 text-xs text-stone-200 rounded-lg outline-none cursor-pointer"
                              >
                                <option value="classic-inter">Classic Inter (Corporate Display)</option>
                                <option value="cyber-mono">Digital Mono (Tactical Ledger)</option>
                                <option value="serif-editorial">Serif Editorial (Heritage Wealth)</option>
                              </select>
                            </div>
                          </div>

                          {/* Middle row: Background, Text, Accent, Button Colors */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-950/40 p-3 rounded-lg border border-stone-850">
                            {/* Background Color */}
                            <div>
                              <label className="text-[9px] uppercase font-bold text-stone-500 font-mono block mb-1">Background bg</label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={newThemeBgColor}
                                  onChange={(e) => setNewThemeBgColor(e.target.value)}
                                  className="h-7 w-7 bg-transparent border-0 cursor-pointer p-0 shrink-0"
                                />
                                <input
                                  type="text"
                                  value={newThemeBgColor}
                                  onChange={(e) => setNewThemeBgColor(e.target.value)}
                                  className="w-full px-1.5 py-0.5 bg-stone-950 border border-stone-800 text-[10px] font-mono text-center text-stone-300 rounded outline-none"
                                />
                              </div>
                            </div>

                            {/* Text Color */}
                            <div>
                              <label className="text-[9px] uppercase font-bold text-stone-500 font-mono block mb-1">Secondary text</label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={newThemeTextColor}
                                  onChange={(e) => setNewThemeTextColor(e.target.value)}
                                  className="h-7 w-7 bg-transparent border-0 cursor-pointer p-0 shrink-0"
                                />
                                <input
                                  type="text"
                                  value={newThemeTextColor}
                                  onChange={(e) => setNewThemeTextColor(e.target.value)}
                                  className="w-full px-1.5 py-0.5 bg-stone-950 border border-stone-800 text-[10px] font-mono text-center text-stone-300 rounded outline-none"
                                />
                              </div>
                            </div>

                            {/* Accent Color / Status Bar */}
                            <div>
                              <label className="text-[9px] uppercase font-bold text-stone-500 font-mono block mb-1">Accent & Bars</label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={newThemeColor}
                                  onChange={(e) => setNewThemeColor(e.target.value)}
                                  className="h-7 w-7 bg-transparent border-0 cursor-pointer p-0 shrink-0"
                                />
                                <input
                                  type="text"
                                  value={newThemeColor}
                                  onChange={(e) => setNewThemeColor(e.target.value)}
                                  className="w-full px-1.5 py-0.5 bg-stone-950 border border-stone-800 text-[10px] font-mono text-center text-stone-300 rounded outline-none"
                                />
                              </div>
                            </div>

                            {/* Buttons and Cards BG */}
                            <div>
                              <label className="text-[9px] uppercase font-bold text-stone-500 font-mono block mb-1">Buttons & Cards</label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={newThemeBtnBgColor}
                                  onChange={(e) => setNewThemeBtnBgColor(e.target.value)}
                                  className="h-7 w-7 bg-transparent border-0 cursor-pointer p-0 shrink-0"
                                />
                                <input
                                  type="text"
                                  value={newThemeBtnBgColor}
                                  onChange={(e) => setNewThemeBtnBgColor(e.target.value)}
                                  className="w-full px-1.5 py-0.5 bg-stone-950 border border-stone-800 text-[10px] font-mono text-center text-stone-300 rounded outline-none"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Extra block for button active text coloration */}
                          <div className="flex items-center gap-3 bg-stone-950/20 px-3 py-1.5 rounded-lg border border-stone-850/60 max-w-xs">
                            <span className="text-[10px] font-mono text-stone-500 uppercase font-bold">Button text color:</span>
                            <input
                              type="color"
                              value={newThemeBtnTextColor}
                              onChange={(e) => setNewThemeBtnTextColor(e.target.value)}
                              className="h-6 w-6 bg-transparent border-0 cursor-pointer p-0 shrink-0"
                            />
                            <input
                              type="text"
                              value={newThemeBtnTextColor}
                              onChange={(e) => setNewThemeBtnTextColor(e.target.value)}
                              className="w-18 px-1 py-0.5 bg-stone-950 border border-stone-800 text-[10px] font-mono text-center text-stone-300 rounded outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            disabled={!newThemeName}
                            onClick={() => {
                              handleAddCustomTheme(
                                newThemeName, 
                                newThemeColor, 
                                themeModeTab, 
                                newThemeBgColor, 
                                newThemeTextColor, 
                                newThemeBtnBgColor, 
                                newThemeBtnTextColor, 
                                newThemeFontStyle
                              );
                              setNewThemeName('');
                            }}
                            className="w-full py-2.5 bg-stone-950 hover:bg-stone-900 border border-amber-500/20 text-xs font-bold text-amber-500 rounded-xl font-mono tracking-wide transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                          >
                            + Deploy & Activate Custom Theme Composition
                          </button>
                        </div>
                      ) : (
                        <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-[11px] text-red-400 font-semibold flex items-center justify-center gap-1.5">
                          <span>⚙ Limit Enforced: Delete an existing custom {themeModeTab} theme first to add more.</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

              </div>
            )}

            {/* SUB-TAB C: ADVANCED GOALS, SAVINGS CHANGER & SYSTEM ALERT RULES */}
            {settingsTab === 'rules' && (
              <div className="space-y-4 animate-fade-in">
                
                {/* 1. Echelon Velocity Profiler Consolidated Parameters Card */}
                <div className="p-5 bg-stone-500/[0.03] border border-stone-850 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-850 pb-2.5">
                    <div>
                      <span className="text-xs uppercase font-extrabold tracking-widest text-amber-500 font-mono block">Echelon Velocity Profiler</span>
                      <p className="text-[10px] text-stone-500">Modulate your balance sheet, safety shield, and saving streams</p>
                    </div>
                    <span className="text-[10px] font-mono bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2.5 py-0.5 rounded uppercase font-black">
                      Decisive Engine
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* 1. Monthly income */}
                    <div>
                      <label className="text-[9.5px] uppercase font-mono font-bold text-stone-400 block mb-1.5">
                        1. Monthly Salary Inflow
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-stone-500">{(vaultData.currencySymbol || '₹')}</span>
                        <input
                          type="number"
                          min="0"
                          className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500/50 text-stone-100 rounded-xl pl-6 pr-3 py-1.5 text-xs font-mono font-bold focus:outline-none transition-all"
                          placeholder="Salary"
                          value={vaultData.monthlyEarnings}
                          onChange={(e) => handleSetMonthlyEarnings(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    {/* 2. Monthly Expenses */}
                    <div>
                      <label className="text-[9.5px] uppercase font-mono font-bold text-stone-400 block mb-1.5">
                        2. Monthly Outflow
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-stone-500">{(vaultData.currencySymbol || '₹')}</span>
                        <input
                          type="number"
                          min="0"
                          className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500/50 text-stone-100 rounded-xl pl-6 pr-3 py-1.5 text-xs font-mono font-bold focus:outline-none transition-all"
                          placeholder="Expenses"
                          value={vaultData.userOverriddenExpenses ?? 15000}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            handleUpdateUserOverriddenExpenses(val);
                          }}
                        />
                      </div>
                      <div className="flex gap-1.5 mt-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateUserOverriddenExpenses(undefined)}
                          className={`text-[8px] font-mono px-1.5 py-0.5 rounded border transition-all ${
                            vaultData.userOverriddenExpenses === undefined
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                              : 'bg-stone-950 border-stone-850 text-stone-500'
                          }`}
                        >
                          Dynamic
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateUserOverriddenExpenses(vaultData.userOverriddenExpenses || 15000)}
                          className={`text-[8px] font-mono px-1.5 py-0.5 rounded border transition-all ${
                            vaultData.userOverriddenExpenses !== undefined
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                              : 'bg-stone-950 border-stone-850 text-stone-400'
                          }`}
                        >
                          Static Lock
                        </button>
                      </div>
                    </div>

                    {/* 3. Desired Safety Buffer */}
                    <div>
                      <label className="text-[9.5px] uppercase font-mono font-bold text-stone-400 block mb-1.5">
                        3. Desired Buffer Size
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-stone-500">{(vaultData.currencySymbol || '₹')}</span>
                        <input
                          type="number"
                          min="0"
                          className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500/50 text-stone-100 rounded-xl pl-6 pr-3 py-1.5 text-xs font-mono font-bold focus:outline-none transition-all"
                          placeholder="Buffer Goal"
                          value={vaultData.customSavingsGoalAmt ?? 5000}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            handleUpdateCustomSavingsGoalAmt(val);
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. Anchor Safety Shield to Assets Checklist */}
                  {(() => {
                    const currentSelectedIds = (vaultData.taggedBufferAssetIds && vaultData.taggedBufferAssetIds.length > 0)
                      ? vaultData.taggedBufferAssetIds
                      : (vaultData.taggedBufferAssetId ? [vaultData.taggedBufferAssetId] : []);
                    const selectedAssets = vaultData.assets.filter(a => currentSelectedIds.includes(a.id));
                    const currentSum = selectedAssets.reduce((sum, a) => sum + a.currentValue, 0);
                    const desiredBuffer = vaultData.customSavingsGoalAmt ?? 5000;
                    const bufferReached = desiredBuffer > 0 && currentSum >= desiredBuffer;

                    return (
                      <div className="space-y-1.5 pt-2 border-t border-stone-850/60">
                        <div className="flex justify-between items-center text-[9px] uppercase font-mono font-bold text-stone-400">
                          <span>🛡️ Anchor Safety Shield To Assets</span>
                          <span className={bufferReached ? "text-emerald-400 font-extrabold tracking-tight shrink-0 font-mono" : "text-stone-500 font-bold tracking-tight shrink-0 font-mono"}>
                            {bufferReached ? `✓ Buffer Reached (${(vaultData.currencySymbol || '₹')}${currentSum.toLocaleString('en-IN')})` : `Multi-Select Target: ${(vaultData.currencySymbol || '₹')}${desiredBuffer.toLocaleString('en-IN')}`}
                          </span>
                        </div>

                        <div className="max-h-[140px] overflow-y-auto border border-stone-800 bg-stone-950 rounded-xl p-2 space-y-1 scrollbar-thin">
                          {vaultData.assets.map(asset => {
                            const isSelected = currentSelectedIds.includes(asset.id);
                            return (
                              <div 
                                key={asset.id} 
                                onClick={(e) => {
                                  if (e.target instanceof HTMLInputElement) return;
                                  if (isSelected) {
                                    const nextIds = currentSelectedIds.filter(id => id !== asset.id);
                                    handleUpdateTaggedBufferAssetIds(nextIds);
                                  } else {
                                    const nextIds = [...currentSelectedIds, asset.id];
                                    handleUpdateTaggedBufferAssetIds(nextIds);
                                  }
                                }}
                                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-all border text-[11px] font-mono select-none ${
                                  isSelected 
                                    ? 'bg-amber-500/[0.04] border-amber-500/25 text-amber-500 font-bold' 
                                    : 'bg-stone-900/10 border-transparent hover:bg-stone-900/30 text-stone-400 hover:text-stone-300'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <input
                                    type="checkbox"
                                    className="accent-amber-500 rounded cursor-pointer h-3.5 w-3.5 flex-shrink-0"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isSelected) {
                                        const nextIds = currentSelectedIds.filter(id => id !== asset.id);
                                        handleUpdateTaggedBufferAssetIds(nextIds);
                                      } else {
                                        const nextIds = [...currentSelectedIds, asset.id];
                                        handleUpdateTaggedBufferAssetIds(nextIds);
                                      }
                                    }}
                                  />
                                  <span className="font-semibold truncate">{asset.name}</span>
                                </div>
                                <span className="font-bold text-[10px] pl-1 text-stone-200">
                                  {(vaultData.currencySymbol || '₹')}{Math.floor(asset.currentValue).toLocaleString('en-IN')}
                                </span>
                              </div>
                            );
                          })}
                          {vaultData.assets.length === 0 && (
                            <div className="text-[10px] italic text-stone-500 text-center py-4">No assets available to tag.</div>
                          )}
                        </div>

                        {/* Status feedback line */}
                        <div className="flex justify-between items-center text-[10px] font-mono px-1 py-0.5">
                          <span className="text-stone-500">Selected Support Accumulation:</span>
                          <span className={bufferReached ? "text-emerald-400 font-extrabold" : "text-amber-400 font-bold"}>
                            {(vaultData.currencySymbol || '₹')}{currentSum.toLocaleString('en-IN')} / {(vaultData.currencySymbol || '₹')}{desiredBuffer.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
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
