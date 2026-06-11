import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Zap, 
  RefreshCw, 
  Coins,
  Shield,
  MessageSquare,
  Play,
  Check,
  X,
  Volume2,
  VolumeX,
  Database,
  Sparkles
} from 'lucide-react';
import { EchelonTheme, Asset, Loan, LoanType, Expense, FinancialGoal, BudgetCategoryLimit } from '../types';
import { getColorTokens, isThemeLight } from '../utils/theme';
import { calculateWealthRates, calculateLoanCurrentBalance } from '../utils/math';
import { sovereignML } from '../utils/predictiveModel';

interface AIInsightsProps {
  theme: EchelonTheme;
  assets: Asset[];
  loans: Loan[];
  monthlyEarnings: number;
  expenses: Expense[];
  currencySymbol?: string;
  usdConversionRate?: number;
  goals?: FinancialGoal[];
  compiledInsightsText?: string;
  onUpdateCompiledInsightsText?: (text: string) => void;
  budgetCategoryLimits?: BudgetCategoryLimit[];
  onAddExpense?: (expense: Omit<Expense, 'id'>) => void;
  
  // Shared synchronized states passed down
  soundEnabledExternal?: boolean;
  smsPermissionStateExternal?: 'denied' | 'prompt' | 'granted';
  onUpdateSmsPermission?: (state: 'denied' | 'prompt' | 'granted') => void;
  onChangeTheme?: (theme: EchelonTheme) => void;
}

// Retro-alien cyber-tech sound synthesizers using Web Audio API
const playCyberChirp = (type: 'beep' | 'success' | 'train' | 'alert' | 'outlog') => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (type === 'beep') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2400, audioCtx.currentTime); 
      osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.045);
      gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.045);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.045);
    } else if (type === 'outlog') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1350, audioCtx.currentTime);
      osc.frequency.setValueAtTime(950, audioCtx.currentTime + 0.01);
      gain.gain.setValueAtTime(0.012, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.02);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.02);
    } else if (type === 'success') {
      const now = audioCtx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        gain.gain.setValueAtTime(0.035, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.07 + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.26);
      });
    } else if (type === 'train') {
      // Bold, suspenseful charging sweeps hum
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(75, audioCtx.currentTime);
      osc1.frequency.linearRampToValueAtTime(250, audioCtx.currentTime + 1.25);
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(112.5, audioCtx.currentTime);
      osc2.frequency.linearRampToValueAtTime(375, audioCtx.currentTime + 1.25);
      
      gain.gain.setValueAtTime(0.008, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.045, audioCtx.currentTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.25);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 1.26);
      osc2.stop(audioCtx.currentTime + 1.26);
    } else if (type === 'alert') {
      // Deep suspense cinematic alert
      const osc = audioCtx.createOscillator();
      const oscSub = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(130, audioCtx.currentTime + 0.65);
      
      oscSub.type = 'sine';
      oscSub.frequency.setValueAtTime(65, audioCtx.currentTime);
      oscSub.frequency.linearRampToValueAtTime(52, audioCtx.currentTime + 0.65);
      
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, audioCtx.currentTime);
      
      gain.gain.setValueAtTime(0.045, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.65);
      
      osc.connect(filter);
      oscSub.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      oscSub.start();
      osc.stop(audioCtx.currentTime + 0.66);
      oscSub.stop(audioCtx.currentTime + 0.66);
    }
  } catch (e) {
    // Web audio blocked or unsupported
  }
};

const getThemeNeuralColor = (theme: EchelonTheme) => {
  switch (theme.palette) {
    case 'hotpink-marble':
    case 'rose-amethyst':
      return {
        accent: 'text-pink-500',
        accentText: 'text-pink-500',
        bgAccent: 'bg-pink-500 font-bold',
        border: 'border-pink-500/20',
        borderAccent: 'border-pink-500/30',
        gradient: 'from-pink-500 to-fuchsia-500',
        hex: '#ec4899',
        glow: 'shadow-[0_0_20px_rgba(236,72,153,0.35)]',
        bgProgress: 'bg-gradient-to-r from-pink-500 to-fuchsia-500'
      };
    case 'sand-drift':
    case 'stealth-gold':
    case 'black':
    case 'slate-amber':
      return {
        accent: 'text-amber-500',
        accentText: 'text-amber-500',
        bgAccent: 'bg-amber-500 font-bold',
        border: 'border-amber-500/20',
        borderAccent: 'border-amber-500/30',
        gradient: 'from-amber-500 to-orange-500',
        hex: '#f59e0b',
        glow: 'shadow-[0_0_20px_rgba(245,158,11,0.35)]',
        bgProgress: 'bg-gradient-to-r from-amber-500 to-orange-500'
      };
    case 'royal-emerald':
    case 'mint-fresh':
      return {
        accent: 'text-emerald-500',
        accentText: 'text-emerald-500',
        bgAccent: 'bg-emerald-500 font-bold',
        border: 'border-emerald-500/20',
        borderAccent: 'border-emerald-500/30',
        gradient: 'from-emerald-500 to-teal-500',
        hex: '#10b981',
        glow: 'shadow-[0_0_20px_rgba(16,185,129,0.35)]',
        bgProgress: 'bg-gradient-to-r from-emerald-500 to-teal-500'
      };
    case 'lavender-blush':
      return {
        accent: 'text-violet-500',
        accentText: 'text-violet-500',
        bgAccent: 'bg-violet-500 font-bold',
        border: 'border-violet-500/20',
        borderAccent: 'border-violet-500/30',
        gradient: 'from-violet-500 to-purple-500',
        hex: '#8b5cf6',
        glow: 'shadow-[0_0_20px_rgba(139,92,246,0.35)]',
        bgProgress: 'bg-gradient-to-r from-violet-500 to-purple-500'
      };
    default:
      return {
        accent: 'text-cyan-400',
        accentText: 'text-cyan-400',
        bgAccent: 'bg-cyan-500 font-bold',
        border: 'border-cyan-500/20',
        borderAccent: 'border-cyan-500/30',
        gradient: 'from-cyan-400 to-blue-500',
        hex: '#00f3ff',
        glow: 'shadow-[0_0_20px_rgba(6,182,212,0.35)]',
        bgProgress: 'bg-gradient-to-r from-cyan-400 to-blue-500'
      };
  }
};

export default function AIInsights({
  theme,
  assets,
  loans,
  monthlyEarnings,
  expenses,
  currencySymbol = '₹',
  usdConversionRate = 83.5,
  goals = [],
  compiledInsightsText = '',
  onUpdateCompiledInsightsText,
  budgetCategoryLimits = [],
  onAddExpense,
  soundEnabledExternal,
  smsPermissionStateExternal,
  onUpdateSmsPermission,
  onChangeTheme
}: AIInsightsProps) {
  const tokens = getColorTokens(theme);
  const isLight = isThemeLight(theme);
  const neuralColors = getThemeNeuralColor(theme);
  const highlightText = isLight ? tokens.accentText : 'text-[#00f3ff]';
  const subLabelText = isLight ? 'text-stone-500 font-bold' : 'text-[#00f3ff]/60 font-bold';
  const valueText = isLight ? tokens.accentText : 'text-cyan-400';
  const borderLightClass = isLight ? 'border-stone-200' : 'border-cyan-500/15';
  const itemBgClass = isLight ? 'bg-stone-50/70 border-stone-200' : 'bg-cyan-950/10 border-cyan-500/10';

  // Sound enable state
  const [localSoundEnabled, setLocalSoundEnabled] = useState<boolean>(true);
  const soundEnabled = soundEnabledExternal !== undefined ? soundEnabledExternal : localSoundEnabled;

  // ML model learning engine states (Simulating reinforcement learning weights backprop)
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [epoch, setEpoch] = useState<number>(100);
  const [loss, setLoss] = useState<number>(0.012);
  const [trainingLogs, setTrainingLogs] = useState<string[]>([
    '[INIT] Neuronal connection weights initialized to general distributions.',
    '[SYSTEM] Local training telemetry stable. Awaiting network reinforcement click...'
  ]);

  // Cyberweights matrix parameters that visually update as model "learns" user variables
  const [modelWeights, setModelWeights] = useState(() => {
    try {
      const stored = localStorage.getItem('echelon_model_weights');
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return {
      spendWeight: 0.85,
      debtPenetrationRatio: 0.62,
      APYAccumulationVector: 0.74,
      reserveShieldCoeff: 0.55
    };
  });

  const [mlDetails, setMlDetails] = useState<{
    losses: number[];
    accuracy: number;
    learningRate: number;
    weightKeys: string[];
    weightValues: number[];
  }>(() => {
    try {
      const storedAccuracy = localStorage.getItem('echelon_model_accuracy');
      const storedLoss = localStorage.getItem('echelon_model_loss');
      if (storedAccuracy && storedLoss) {
        // Construct some reasonable historic simulated losses down to final
        const lastLoss = parseFloat(storedLoss);
        const acc = parseFloat(storedAccuracy);
        return {
          losses: [0.75, 0.61, 0.48, 0.35, 0.22, 0.12, 0.08, 0.04, 0.02, lastLoss],
          accuracy: acc,
          learningRate: 0.05,
          weightKeys: ['swiggy→Dining', 'uber→Transport', 'amazon→Shopping', 'rent→Rent', 'dmart→Groceries'],
          weightValues: [6.8, 5.2, 7.1, 8.4, 4.9]
        };
      }
    } catch (_) {}
    return {
      losses: [0.75, 0.61, 0.48, 0.35, 0.22, 0.12, 0.08, 0.04, 0.02, 0.011],
      accuracy: 88.5,
      learningRate: 0.05,
      weightKeys: ['swiggy→Dining', 'uber→Transport', 'amazon→Shopping', 'rent→Rent', 'dmart→Groceries'],
      weightValues: [6.8, 5.2, 7.1, 8.4, 4.9]
    };
  });

  // SMS Permission and AutoLOG simulation engine states
  const [localSmsPermissionState, setLocalSmsPermissionState] = useState<'denied' | 'prompt' | 'granted'>(() => {
    try {
      const stored = localStorage.getItem('echelon_sms_telemetry');
      if (stored === 'granted') return 'granted';
      if (stored === 'denied') return 'denied';
    } catch(e) {}
    return 'prompt';
  });
  const smsPermissionState = smsPermissionStateExternal !== undefined ? smsPermissionStateExternal : localSmsPermissionState;

  const [activeTab, setActiveTab] = useState<'coherence' | 'model'>('coherence');

  const [showPermissionDialog, setShowPermissionDialog] = useState<boolean>(false);
  const [interceptedSMS, setInterceptedSMS] = useState<{
    rawText: string;
    parsedAmt: number;
    parsedAssetId: string;
    parsedAssetName: string;
    parsedCategory: string;
    timestamp: string;
  } | null>(null);

  const [customSmsInput, setCustomSmsInput] = useState<string>('');
  const [confirmedLoggedMsg, setConfirmedLoggedMsg] = useState<string | null>(null);

  // Heuristic engine aggregates
  const totalAssetsVal = assets.reduce((sum, a) => {
    const val = a.isUSAsset ? a.currentValue * usdConversionRate : a.currentValue;
    return sum + val;
  }, 0);

  const totalLentVal = loans
    .filter(l => l.type === LoanType.LENT)
    .reduce((sum, l) => sum + calculateLoanCurrentBalance(l), 0);
  const totalBorrowedVal = loans
    .filter(l => l.type === LoanType.BORROWED)
    .reduce((sum, l) => sum + calculateLoanCurrentBalance(l), 0);

  let totalYieldAmount = 0;
  assets.forEach(a => {
    const r = a.annualGrowthRate !== undefined 
      ? a.annualGrowthRate 
      : (a.type === 'FD' ? 7.1 : a.type === 'BOND' ? 8.5 : (a.type === 'EQUITY' || a.type === 'STOCK') ? 12 : 3.5);
    const val = a.isUSAsset ? a.currentValue * usdConversionRate : a.currentValue;
    totalYieldAmount += val * (r / 100);
  });

  loans.forEach(loan => {
    if (loan.type === LoanType.LENT) {
      const balance = calculateLoanCurrentBalance(loan);
      totalYieldAmount += balance * (loan.interestRate / 100);
    }
  });

  let totalBorrowedInterestCosts = 0;
  loans.forEach(loan => {
    if (loan.type === LoanType.BORROWED) {
      const balance = calculateLoanCurrentBalance(loan);
      totalBorrowedInterestCosts += balance * (loan.interestRate / 100);
    }
  });

  const totalAssetsValConverted = assets.reduce((sum, a) => sum + (a.isUSAsset ? a.currentValue * usdConversionRate : a.currentValue), 0);
  const totalInvestmentBase = totalAssetsValConverted + totalLentVal;

  const blendedAPY = totalInvestmentBase > 0 ? (totalYieldAmount / totalInvestmentBase) * 100 : 0;
  const debtsAPY = totalBorrowedVal > 0 ? (totalBorrowedInterestCosts / totalBorrowedVal) * 100 : 0;
  const highInterestDebts = loans.filter(l => l.type === LoanType.BORROWED && l.interestRate > blendedAPY);
  const netWorth = totalAssetsVal + totalLentVal - totalBorrowedVal;
  const rates = calculateWealthRates(assets, loans, monthlyEarnings, expenses, netWorth);
  
  const themeAnalysis = sovereignML.analyzeThemeChoice(
    theme.palette,
    isLight,
    netWorth,
    blendedAPY
  );

  const liquidCash = assets
    .filter(a => a.type === 'BANK_BALANCE' || a.type === 'FD')
    .reduce((sum, a) => sum + (a.isUSAsset ? a.currentValue * usdConversionRate : a.currentValue), 0);
  const recentSpends_30d = expenses.reduce((sum, e) => sum + e.amount, 0) || 15000;
  const emergencyShieldMonths = recentSpends_30d > 0 ? liquidCash / recentSpends_30d : 0;

  const classes: Record<string, number> = { EQUITY: 0, STOCK: 0, FD: 0, BOND: 0, BANK_BALANCE: 0 };
  assets.forEach(a => {
    classes[a.type] = (classes[a.type] || 0) + (a.isUSAsset ? a.currentValue * usdConversionRate : a.currentValue);
  });
  let maxConcentrationType = '';
  let maxConcentrationVal = 0;
  Object.entries(classes).forEach(([k, v]) => {
    if (v > maxConcentrationVal) {
      maxConcentrationVal = v;
      maxConcentrationType = k;
    }
  });
  const maxConcentrationPct = totalAssetsVal > 0 ? (maxConcentrationVal / totalAssetsVal) * 100 : 0;

  // Score generator
  const [score, setScore] = useState<number>(10);
  useEffect(() => {
    // Check if user has initialized or added any assets/earnings
    const totalAssetSum = assets.reduce((sum, a) => sum + (a.isUSAsset ? a.currentValue * usdConversionRate : a.currentValue), 0);
    const hasAssetsOrEarnings = totalAssetSum > 0 || monthlyEarnings > 0 || loans.length > 0;
    
    if (!hasAssetsOrEarnings) {
      setScore(10);
      return;
    }

    let s = 50; // default active starting base
    
    // 1. Inflation adjustment (standard present condition inflation is e.g. 6.0%)
    const inflationRate = 6.0;
    if (totalAssetSum > 0) {
      if (blendedAPY > inflationRate) {
        s += 15;
      } else if (blendedAPY < inflationRate) {
        s -= 15;
      }
    } else {
      s -= 5;
    }

    // 2. Emergency cover shield performance
    if (emergencyShieldMonths >= 6) {
      s += 15;
    } else if (emergencyShieldMonths >= 3) {
      s += 8;
    } else {
      s -= 10;
    }

    // 3. Diversification coefficient
    if (maxConcentrationPct < 50 && assets.length > 2) {
      s += 10;
    } else if (maxConcentrationPct > 80 && assets.length > 1) {
      s -= 10;
    }

    // 4. Interest leverage drag from liabilities
    if (highInterestDebts.length === 0) {
      s += 10;
    } else {
      s -= 15;
    }

    // 5. Monthly net income trajectory (Earning surplus)
    if (rates.netPerMonth > 40000) {
      s += 15;
    } else if (rates.netPerMonth > 15000) {
      s += 8;
    } else if (rates.netPerMonth <= 0) {
      s -= 20;
    }

    setScore(Math.min(100, Math.max(10, s)));
  }, [blendedAPY, emergencyShieldMonths, maxConcentrationPct, highInterestDebts.length, rates.netPerMonth, assets, usdConversionRate, monthlyEarnings, loans, expenses]);

  const getRank = (scr: number) => {
    if (scr >= 90) return { title: 'Sovereign Emperor', level: 'MAX_SECURE', color: 'text-amber-400 border-amber-500/30' };
    if (scr >= 75) return { title: 'Echelon Elite', level: 'LVL_03_COMPILER', color: 'text-cyan-400 border-cyan-500/30' };
    if (scr >= 50) return { title: 'Quiet Capitalist', level: 'LVL_02_MONITOR', color: 'text-emerald-400 border-emerald-500/30' };
    return { title: 'Deficient Seeker', level: 'LVL_01_DEFICIT', color: 'text-rose-400 border-rose-500/30' };
  };
  const rank = getRank(score);

  // Play audio triggers
  const handleTabClick = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (soundEnabled) playCyberChirp('beep');
  };

  // ML training trigger
  const handleOverclockTraining = async () => {
    if (isTraining) return;
    setIsTraining(true);
    setEpoch(0);
    setLoss(0.85);

    // Initial state setup for real-time charting
    setMlDetails(prev => ({
      ...prev,
      losses: [0.85]
    }));

    if (soundEnabled) playCyberChirp('train');

    const cats = budgetCategoryLimits && budgetCategoryLimits.length > 0 
      ? budgetCategoryLimits.map(c => c.category)
      : ['Dining', 'Transport', 'Entertainment', 'Medical', 'Groceries', 'Shopping', 'Rent', 'Investment', 'Cash'];

    setTrainingLogs([
      `[${new Date().toLocaleTimeString()}] [SYS_INIT] Loading Echelon local Bayesian Network optimizer.`,
      `[${new Date().toLocaleTimeString()}] [SYS_STATS] Parsing dataset: ${expenses.length} spending logs, ${assets.length} liquid asset coffers.`,
      `[${new Date().toLocaleTimeString()}] [TRAIN_START] SGD Backpropagation engaged. Learning rate = 0.05.`
    ]);

    let currentEpoch = 0;
    const interval = setInterval(async () => {
      currentEpoch += 2;
      if (currentEpoch > 100) {
        clearInterval(interval);

        // Run actual client-side Bayes statistical weights training
        const result = await sovereignML.train(expenses, assets, cats);

        setIsTraining(false);
        setEpoch(100);
        setLoss(result.losses[result.losses.length - 1]);
        setMlDetails({
          losses: result.losses,
          accuracy: result.accuracy,
          learningRate: result.learningRate,
          weightKeys: result.weightKeys,
          weightValues: result.weightValues
        });

        const expensesImpact = Math.min(1, recentSpends_30d / (monthlyEarnings || 15000));
        const debtImpact = Math.min(1, totalBorrowedVal / (totalAssetsVal || 1));

        const finalWeights = {
          spendWeight: Number((0.2 + expensesImpact * 0.8).toFixed(3)),
          debtPenetrationRatio: Number(debtImpact.toFixed(3)),
          APYAccumulationVector: Number((blendedAPY / 25).toFixed(3)),
          reserveShieldCoeff: Number((Math.min(1, emergencyShieldMonths / 12)).toFixed(3))
        };

        setModelWeights(finalWeights);

        try {
          localStorage.setItem('echelon_model_weights', JSON.stringify(finalWeights));
          localStorage.setItem('echelon_model_accuracy', result.accuracy.toFixed(1));
          localStorage.setItem('echelon_model_loss', result.losses[result.losses.length - 1].toFixed(5));
          localStorage.setItem('echelon_model_trained_at', Date.now().toString());
          window.dispatchEvent(new Event('echelon_model_update'));
        } catch (_) {}

        setTrainingLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [EPOCH_100] Optimization converged with final loss = ${result.losses[result.losses.length - 1].toFixed(5)}.`,
          `[${new Date().toLocaleTimeString()}] [SUCCESS] Weights matrix stored locally. Learned from ${expenses.length} spending logs.`,
          `[${new Date().toLocaleTimeString()}] [COMPILER] Validation score reached ${result.accuracy.toFixed(1)}% categorization precision.`
        ]);

        if (soundEnabled) playCyberChirp('success');
      } else {
        const tempLoss = Math.max(0.012, 0.85 - (currentEpoch / 100) * 0.83 + (Math.random() - 0.5) * 0.04);
        setLoss(tempLoss);
        setEpoch(currentEpoch);

        // Feed steps into real-time SVG charting
        setMlDetails(prev => {
          const currentLosses = [...prev.losses, tempLoss];
          // Limit list length to fit display viewport correctly
          if (currentLosses.length > 24) {
            currentLosses.shift();
          }
          return {
            ...prev,
            losses: currentLosses
          };
        });

        const progressPercent = currentEpoch;
        const trainLogsPool = [
          `Backpropagating gross assets vector value: ${currencySymbol}${Math.round(totalAssetsValConverted).toLocaleString()}`,
          `Calculating gradient descend on monthly spending leaks (${currencySymbol}${Math.round(recentSpends_30d).toLocaleString()}).`,
          `Optimizing backprop coefficients for APY performance (${blendedAPY.toFixed(1)}%).`,
          `Calibrating matrix nodes against liquid shield index (${emergencyShieldMonths.toFixed(1)} months margin).`,
          `Shifting bias values against high interest liabilities (${highInterestDebts.length} active high interest lines).`
        ];
        const logPhrase = trainLogsPool[Math.floor(Math.random() * trainLogsPool.length)];

        setTrainingLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [EPOCH_${currentEpoch}/100] loss: ${tempLoss.toFixed(4)} -- ${logPhrase}`
        ]);

        if (soundEnabled) {
          playCyberChirp('outlog');
        }
      }
    }, 120);
  };

  // Generate actual relevant AI alerts and insights
  const [aiInsightsList, setAiInsightsList] = useState<{
    id: string;
    type: 'critical' | 'warn' | 'optimal' | 'info';
    text: string;
    metrics: string;
    actionLabel: string;
  }[]>([]);

  const handleCompilerGenerate = () => {
    if (soundEnabled) playCyberChirp('success');
    
    const generated: typeof aiInsightsList = [];

    // Check if user is in a completely uninitialized/zero budget baseline
    const totalAssetSum = assets.reduce((sum, a) => sum + (a.isUSAsset ? a.currentValue * usdConversionRate : a.currentValue), 0);
    const hasAssetsOrEarnings = totalAssetSum > 0 || monthlyEarnings > 0 || loans.length > 0;

    if (!hasAssetsOrEarnings) {
      generated.push({
        id: 'ins-empty-state',
        type: 'critical',
        text: `COMPILER HALTED: Absolute zero net holdings and yield streams detected. Register assets or earning vector inflows in Portfolio to initiate model analysis.`,
        metrics: `Total Asset Base: ${currencySymbol}0 | Dynamic Earning velocity: 0/hr`,
        actionLabel: 'CAPITAL INGEST'
      });
      setAiInsightsList(generated);
      return;
    }

    // Alert 1: Spends vs earnings
    if (rates.netPerMonth <= 0) {
      generated.push({
        id: 'ins-1',
        type: 'critical',
        text: `MODEL RISK ALERT: Cash outlays completely consume or overrun incoming yield. Discretionary budget throttling locked in at 90%.`,
        metrics: `Net monthly margin is in negative territory (-${currencySymbol}${Math.abs(Math.round(rates.netPerMonth)).toLocaleString()})`,
        actionLabel: 'THROTTLE EXPENSES'
      });
    } else {
      generated.push({
        id: 'ins-1-opt',
        type: 'optimal',
        text: `CORE SECURE: Steady passive capital stream verified. ML model optimized allocation factors to compound positive monthly margin.`,
        metrics: `Unleashed +${currencySymbol}${Math.round(rates.netPerMonth).toLocaleString('en-IN')}/mo net surplus into high APY baskets`,
        actionLabel: 'DEPLOY SURPLUS'
      });
    }

    // Alert 2: Emergency cash cover check
    if (emergencyShieldMonths < 6) {
      const topUpRequired = Math.ceil(recentSpends_30d * 6 - liquidCash);
      generated.push({
        id: 'ins-2',
        type: 'critical',
        text: `BUFFER FLAGGED: Liquid reserves represent only ${emergencyShieldMonths.toFixed(1)} months. Neuronal priority shifted to liquidity buffer accumulation.`,
        metrics: `Deficit of ${currencySymbol}${topUpRequired.toLocaleString('en-IN')} below safe 6-month shield margin`,
        actionLabel: 'TOP-UP COFFER'
      });
    } else {
      generated.push({
        id: 'ins-2-opt',
        type: 'optimal',
        text: `SHIELD STABLE: Liquid defense shield spans ${emergencyShieldMonths.toFixed(1)} months. Secondary safety systems active and locked.`,
        metrics: `Reserve liquidity is ${emergencyShieldMonths.toFixed(1)} months, exceeding safe coffer index`,
        actionLabel: 'REBALANCEMENT LAB'
      });
    }

    // Alert 3: Custom high-interest debt checks
    if (highInterestDebts.length > 0) {
      generated.push({
        id: 'ins-3',
        type: 'warn',
        text: `DEBT SINKHOLE: Core algorithm detects high interest debt drag eating model momentum. Settling these loans yields guaranteed risk-free equivalent return.`,
        metrics: `${highInterestDebts.length} high-velocity borrowed loan contracts exceeding assets standard blend`,
        actionLabel: 'PREPAY CONTRACTS'
      });
    }

    // Alert 4: General asset composition & advice
    if (maxConcentrationPct > 55) {
      generated.push({
        id: 'ins-4',
        type: 'warn',
        text: `CONCENTRATION RISK: A single asset class (${maxConcentrationType}) claims ${maxConcentrationPct.toFixed(0)}% of the total coffer. Rebalance recommended.`,
        metrics: `Highly skewed index allocation risk detected`,
        actionLabel: 'SECURE REALTIES'
      });
    } else {
      generated.push({
        id: 'ins-4-optimal',
        type: 'optimal',
        text: `DIVERSIFICATION INTEGRATED: Asset concentration strictly verified under 50%. Coherence parameters aligned to green.`,
        metrics: `Maximum exposure of ${maxConcentrationPct.toFixed(0)}% in ${maxConcentrationType}`,
        actionLabel: 'PERFORMANCE ANALYSIS'
      });
    }

    setAiInsightsList(generated);
  };

  // Compile insights default loader and automated background model training loop
  useEffect(() => {
    handleCompilerGenerate();
  }, [assets.length, loans.length, expenses.length, score]);

  const runFastAutoTraining = async () => {
    if (isTraining) return;
    setIsTraining(true);
    setEpoch(0);
    setLoss(0.65);

    const cats = budgetCategoryLimits && budgetCategoryLimits.length > 0 
      ? budgetCategoryLimits.map(c => c.category)
      : ['Dining', 'Transport', 'Entertainment', 'Medical', 'Groceries', 'Shopping', 'Rent', 'Investment', 'Cash'];

    const timestamp = new Date().toLocaleTimeString();
    const isInitialOrDaily = Math.random() > 0.5;
    const logPrefix = isInitialOrDaily 
      ? '[SCHEDULE_DAILY] 24h interval reached. Recalculating weight projections.' 
      : '[MUTATION_ALERT] Local asset catalog updated. Commencing silent re-weighting...';

    setTrainingLogs(prev => [
      `[${timestamp}] ${logPrefix}`,
      ...prev
    ]);

    let currentEpoch = 0;
    const interval = setInterval(async () => {
      currentEpoch += 20; // Fast automated training steps
      if (currentEpoch > 100) {
        clearInterval(interval);

        // Run actual client-side Bayes statistical weights training
        const result = await sovereignML.train(expenses, assets, cats);

        setIsTraining(false);
        setEpoch(100);
        setLoss(result.losses[result.losses.length - 1]);
        setMlDetails({
          losses: result.losses,
          accuracy: result.accuracy,
          learningRate: result.learningRate,
          weightKeys: result.weightKeys,
          weightValues: result.weightValues
        });

        const expensesImpact = Math.min(1, recentSpends_30d / (monthlyEarnings || 15000));
        const debtImpact = Math.min(1, totalBorrowedVal / (totalAssetsVal || 1));

        setModelWeights({
          spendWeight: Number((0.2 + expensesImpact * 0.8).toFixed(3)),
          debtPenetrationRatio: Number(debtImpact.toFixed(3)),
          APYAccumulationVector: Number((blendedAPY / 25).toFixed(3)),
          reserveShieldCoeff: Number((Math.min(1, emergencyShieldMonths / 12)).toFixed(3))
        });

        setTrainingLogs(prev => [
          `[${new Date().toLocaleTimeString()}] [SYNC_COMPLETE] SGD Converged. Outflow_Weight=${(0.2 + expensesImpact * 0.8).toFixed(2)}, Debt_Drag=${debtImpact.toFixed(2)}, APY_Accel=${(blendedAPY / 25).toFixed(2)}.`,
          ...prev
        ]);
      } else {
        const nextLoss = Math.max(0.012, Number((0.65 - (currentEpoch / 100) * 0.63 + Math.random() * 0.04).toFixed(3)));
        setLoss(nextLoss);

        setTrainingLogs(prev => [
          `[${new Date().toLocaleTimeString()}] [EPOCH_AUTO_${currentEpoch}/100] Loss Coefficient: ${nextLoss.toFixed(3)} -- Syncing nodes safely`,
          ...prev
        ]);
      }
    }, 45);
  };

  useEffect(() => {
    // Initial short run fast auto-optimizer with 2-second debounce
    const triggerTimer = setTimeout(() => {
      runFastAutoTraining();
    }, 2000);

    // Dynamic training intervals triggers every 45 seconds to keep models current
    const intervalTimer = setInterval(() => {
      runFastAutoTraining();
    }, 45000);

    return () => {
      clearTimeout(triggerTimer);
      clearInterval(intervalTimer);
    };
  }, [assets.length, loans.length, expenses.length, monthlyEarnings]);

  // Request SMS telemetry permission flow
  const handleRequestSmsPermission = () => {
    if (soundEnabled) playCyberChirp('beep');
    setShowPermissionDialog(true);
  };

  const confirmSmsPermission = (confirm: boolean) => {
    if (soundEnabled) playCyberChirp('success');
    setShowPermissionDialog(false);
    const result = confirm ? 'granted' : 'denied';
    if (onUpdateSmsPermission) {
      onUpdateSmsPermission(result);
    } else {
      setLocalSmsPermissionState(result);
      localStorage.setItem('echelon_sms_telemetry', result);
    }
  };

  // SMS parsing algorithm matching financial bank transaction and log prompt
  const parseIncomingBankSMS = (messageText: string) => {
    if (!messageText.trim()) return;
    
    // 1. Try to extract transaction value (INR/₹/Rs/amount)
    // Supports regex matching Rs. X, ₹X, INR X, INR.X, X amount debited/charged
    const amtRegex = /(?:rs\.?|inr|₹|inr\.)\s*([\d,]+(?:\.\d+)?)|([\d,]+(?:\.\d+)?)\s*(?:inr|rupees|rs|spent|debited)/i;
    const isAmtMatch = messageText.match(amtRegex);
    let parsedAmountValue = 0;
    if (isAmtMatch) {
      const matchGroup = isAmtMatch[1] || isAmtMatch[2];
      if (matchGroup) {
        parsedAmountValue = parseFloat(matchGroup.replace(/,/g, ''));
      }
    }

    // 2. Try to match bank account/asset based on keyword matching
    let matchedAssetId = '';
    let matchedAssetName = 'Liquid Assets';
    
    // Scan existing user assets to see if we have SBI, HDFC, ICICI, AXIS, etc.
    const textLower = messageText.toLowerCase();
    const matchedAsset = assets.find(a => {
      const assetLower = a.name.toLowerCase();
      const instLower = a.institution.toLowerCase();
      
      // Keywords search
      if (textLower.includes('hdfc') && (assetLower.includes('hdfc') || instLower.includes('hdfc'))) return true;
      if (textLower.includes('sbi') && (assetLower.includes('sbi') || instLower.includes('sbi'))) return true;
      if (textLower.includes('icici') && (assetLower.includes('icici') || instLower.includes('icici'))) return true;
      if (textLower.includes('axis') && (assetLower.includes('axis') || instLower.includes('axis'))) return true;
      if (textLower.includes('paytm') && (assetLower.includes('paytm') || instLower.includes('paytm'))) return true;
      if (textLower.includes('cash') && (assetLower.includes('cash') || instLower.includes('cash'))) return true;
      return false;
    });

    if (matchedAsset) {
      matchedAssetId = matchedAsset.id;
      matchedAssetName = matchedAsset.name;
    } else {
      // Fallback: search for first BANK_BALANCE
      const bankAsset = assets.find(a => a.type === 'BANK_BALANCE');
      if (bankAsset) {
        matchedAssetId = bankAsset.id;
        matchedAssetName = bankAsset.name;
      }
    }

    // 3. Match categories
    let parsedCategoryStr = 'Shopping';
    if (textLower.includes('food') || textLower.includes('dining') || textLower.includes('swiggy') || textLower.includes('zomato') || textLower.includes('hotel') || textLower.includes('cafe')) {
      parsedCategoryStr = 'Dining';
    } else if (textLower.includes('uber') || textLower.includes('ola') || textLower.includes('fuel') || textLower.includes('petrol') || textLower.includes('metro')) {
      parsedCategoryStr = 'Transport';
    } else if (textLower.includes('movie') || textLower.includes('netflix') || textLower.includes('spotify') || textLower.includes('game') || textLower.includes('entertainment')) {
      parsedCategoryStr = 'Entertainment';
    } else if (textLower.includes('medicine') || textLower.includes('hospital') || textLower.includes('doctor') || textLower.includes('pharmacy')) {
      parsedCategoryStr = 'Medical';
    } else if (textLower.includes('grocery') || textLower.includes('dmart') || textLower.includes('blinkit') || textLower.includes('market') || textLower.includes('groceries')) {
      parsedCategoryStr = 'Groceries';
    } else if (textLower.includes('snacks') || textLower.includes('chai') || textLower.includes('tea') || textLower.includes('snack')) {
      parsedCategoryStr = 'Snacks';
    }

    if (parsedAmountValue > 0) {
      setInterceptedSMS({
        rawText: messageText,
        parsedAmt: parsedAmountValue,
        parsedAssetId: matchedAssetId,
        parsedAssetName: matchedAssetName,
        parsedCategory: parsedCategoryStr,
        timestamp: new Date().toLocaleTimeString()
      });
      if (soundEnabled) playCyberChirp('alert');
    } else {
      alert(`[SMS PARSING FAILURE]: Core regex parser could not extract a distinct numerical cash amount from custom message. Please verify message format.`);
    }
  };

  // Simulate predefined bank alerts
  const MOCK_BANK_MESSAGES = [
    'HDFC Bank: Voted debit charge of Rs. 15,000 for Amazon Pay shopping on 09-06-26.',
    'SBI card alert: Your credit card was debited INR 2,450.00 for dining at Swiggy.',
    'ICICI transaction update: INR 25,000 withdrawn from personal A/C for quarterly rent rent bills.',
    'ALERT: Chai snacks shop charged ₹140 from SBI wallet.'
  ];

  const handleSimulateRandomSms = () => {
    const randomMsg = MOCK_BANK_MESSAGES[Math.floor(Math.random() * MOCK_BANK_MESSAGES.length)];
    parseIncomingBankSMS(randomMsg);
  };

  // Complete and commit parsed transaction to vault expenses
  const handleConfirmSyncExpense = () => {
    if (!interceptedSMS) return;
    
    if (onAddExpense) {
      onAddExpense({
        category: interceptedSMS.parsedCategory,
        amount: interceptedSMS.parsedAmt,
        date: new Date().toISOString(),
        notes: `Simulated SMS auto-log: ${interceptedSMS.parsedAssetName} transaction.`
      });
      
      setConfirmedLoggedMsg(`Successfully committed ${currencySymbol}${interceptedSMS.parsedAmt.toLocaleString()} transaction class as Expense category '${interceptedSMS.parsedCategory}'!`);
      setInterceptedSMS(null);
      if (soundEnabled) playCyberChirp('success');
      
      // Auto-retrigger insight compile to capture new transactions
      setTimeout(() => {
        handleCompilerGenerate();
        setConfirmedLoggedMsg(null);
      }, 4000);
    }
  };

  return (
    <div id="cybernetic-alien-ai-insights-page" className="space-y-6 font-mono text-xs">
      
      {/* 1. TOP FUTURISTIC TECH METRIC BANNER */}
      <div id="ai-insights-header-pannel" className={`flex flex-col md:flex-row items-center justify-between gap-4 p-4 border rounded-2xl relative overflow-hidden transition-all ${isLight ? 'bg-white border-stone-200 shadow-sm' : 'border-cyan-500/30 bg-[#080814]/90 shadow-2xl'}`}>
        {!isLight && <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />}
        <div className={`absolute -top-12 -left-12 h-36 w-36 rounded-full blur-2xl pointer-events-none ${isLight ? 'bg-teal-500/5' : 'bg-[#00f3ff]/5'}`} />
        
        <div className="flex items-center gap-3 relative z-10">
          <div className={`h-10 w-10 flex items-center justify-center rounded-xl border transition-all ${isLight ? 'bg-stone-50 border-stone-200 shadow-xs' : 'bg-cyan-950 border-cyan-500/40 shadow-[0_0_12px_rgba(0,243,255,0.3)] animate-pulse'}`}>
            <Brain className={`h-5 w-5 ${isLight ? tokens.accentText : 'text-[#00f3ff]'}`} />
          </div>
          <div>
            <h1 className={`text-sm font-black uppercase tracking-widest flex items-center gap-1.5 leading-tight ${isLight ? tokens.textPrimary : 'text-[#00f3ff]'}`}>
              NEURONAL CORE
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          {/* Sub Navigation Hub Tabs */}
          <div className={`flex items-center gap-1 p-1 rounded-xl border transition-all ${isLight ? 'bg-stone-50 border-stone-200/80' : 'bg-stone-900/80 border-stone-800'}`}>
            <button
              type="button"
              id="sub-nav-ai-coherence-tab"
              onClick={() => handleTabClick('coherence')}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'coherence' 
                  ? (isLight ? 'bg-white text-stone-900 shadow-sm border border-stone-200 font-extrabold' : 'bg-[#00f3ff] text-zinc-950 font-black') 
                  : (isLight ? 'text-stone-500 hover:text-stone-800' : 'text-stone-400 hover:text-stone-200')
              }`}
            >
              Diagnostic
            </button>
            <button
              type="button"
              id="sub-nav-ai-model-tab"
              onClick={() => handleTabClick('model')}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'model' 
                  ? (isLight ? 'bg-white text-stone-900 shadow-sm border border-stone-200 font-extrabold' : 'bg-[#00f3ff] text-zinc-950 font-black') 
                  : (isLight ? 'text-stone-500 hover:text-stone-800' : 'text-stone-400 hover:text-stone-200')
              }`}
            >
              SGD Training
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'coherence' && (
        <div id="coherence-overview-deck" className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* LEFT: GLOWING PORTFOLIO COHERENCE GAUGHT METER */}
          <div className={`xl:col-span-1 p-6 rounded-2xl border flex flex-col justify-between transition-all duration-300 relative overflow-hidden group ${isLight ? 'bg-white border-stone-200 shadow-sm' : 'border-cyan-500/25 bg-[#080811]/95 shadow-[0_0_20px_rgba(6,182,212,0.15)]'}`}>
            <div className={`absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent ${isLight ? 'via-teal-500/20' : 'via-cyan-500/40'} to-transparent`} />
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className={`text-[10px] font-black uppercase tracking-widest ${isLight ? tokens.textPrimary : 'text-[#00f3ff]'}`}>INTELLIGENT COHERENCE INDEX</span>
                <span className={`text-[9px] font-black ${isLight ? 'text-stone-400 font-mono' : 'text-[#00f3ff]/50'}`}>SYS_STABLE_0</span>
              </div>

              {/* Speedy radial dial design */}
              <div className="flex flex-col items-center justify-center py-6">
                <div className="relative w-40 h-40 flex items-center justify-center mb-4">
                  {/* Neon tracks */}
                  <div className={`absolute inset-0 border border-dashed rounded-full animate-spin-slow pointer-events-none ${isLight ? 'border-stone-200' : 'border-[#00f3ff]/5'}`} />
                  <div className={`absolute inset-3 border rounded-full ${isLight ? 'border-stone-100' : 'border-[#00f3ff]/10'}`} />
                  <div className={`absolute inset-6 border border-dashed rounded-full ${isLight ? 'border-stone-200/80' : 'border-pink-500/15'}`} />
                  
                  {/* Gauge indicator arc */}
                  <svg className="w-32 h-32 transform -rotate-180 relative z-10" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="transparent" className={isLight ? 'stroke-stone-100' : 'stroke-stone-900'} strokeWidth="5" />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="42" 
                      fill="transparent" 
                      stroke="url(#neonGradient)" 
                      strokeWidth="6" 
                      strokeDasharray={`${Math.PI * 42}`}
                      strokeDashoffset={`${Math.PI * 42 * (1 - score / 100)}`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ec4899" />
                        <stop offset="50%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor={isLight ? '#008080' : '#00f3ff'} />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Absolute Center Digital Telemetry readout */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center leading-none text-center">
                    <span className={`font-black text-[32px] font-mono tracking-tighter ${isLight ? 'text-stone-850' : 'text-white drop-shadow-[0_0_8px_rgba(0,243,255,0.6)]'}`}>
                      {score}%
                    </span>
                    <span className={`text-[8px] uppercase tracking-widest font-extrabold mt-1 ${isLight ? tokens.accentText : 'text-cyan-400'}`}>
                      {rank.level}
                    </span>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded transition-all ${isLight ? 'bg-stone-50 border border-stone-200 shadow-xs text-stone-700' : 'bg-cyan-500/10 border border-cyan-500/30 text-[#00f3ff] shadow-[0_0_12px_rgba(0,243,255,0.15)]'}`}>
                    {rank.title}
                  </span>
                </div>
              </div>

              {/* Diagnostic core lists */}
              <div className={`space-y-2 mt-4 pt-4 border-t ${isLight ? 'border-stone-100' : 'border-cyan-500/15'}`}>
                <div className={`flex items-center justify-between p-2 rounded border transition-all ${isLight ? 'bg-stone-50/60 border-stone-200 text-stone-850' : 'bg-cyan-950/20 border-cyan-500/10'}`}>
                  <span className={isLight ? 'text-stone-500 text-[10px] font-mono' : 'text-stone-400 text-[10px]'}>Blended Coffer APY</span>
                  <span className="text-emerald-500 font-bold">{blendedAPY.toFixed(2)}% APY</span>
                </div>
                <div className={`flex items-center justify-between p-2 rounded border transition-all ${isLight ? 'bg-stone-50/60 border-stone-200 text-stone-850' : 'bg-cyan-950/20 border-cyan-500/10'}`}>
                  <span className={isLight ? 'text-stone-500 text-[10px] font-mono' : 'text-stone-400 text-[10px]'}>Liability Drag Rate</span>
                  <span className={`font-bold ${debtsAPY > 0 ? 'text-rose-500' : isLight ? 'text-stone-500' : 'text-stone-500'}`}>
                    {debtsAPY > 0 ? `${debtsAPY.toFixed(1)}%` : '0.0%'}
                  </span>
                </div>
                <div className={`flex items-center justify-between p-2 rounded border transition-all ${isLight ? 'bg-stone-50/60 border-stone-200 text-stone-850' : 'bg-cyan-950/20 border-cyan-500/10'}`}>
                  <span className={isLight ? 'text-stone-500 text-[10px] font-mono' : 'text-stone-400 text-[10px]'}>Coffer Liquidity Reserve</span>
                  <span className={`font-bold ${isLight ? tokens.accentText : 'text-[#00f3ff]'}`}>{emergencyShieldMonths.toFixed(1)} Month(s)</span>
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT: DYNAMIC NEURONAL DIRECTIVES OVERFLOW */}
          <div className={`xl:col-span-2 p-6 rounded-2xl border flex flex-col justify-between transition-all duration-300 relative ${isLight ? 'bg-white border-stone-200 shadow-sm' : 'border-cyan-500/25 bg-[#080811]/95 shadow-[0_0_20px_rgba(6,182,212,0.15)]'}`}>
            <div className={`absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent`} />
            
            <div>
              {/* Header */}
              <div className={`flex items-center justify-between border-b pb-4 mb-4 ${isLight ? 'border-stone-100' : 'border-cyan-500/20'}`}>
                <div className="flex items-center gap-2">
                  <Cpu className={`h-4 w-4 ${isLight ? tokens.accentText : 'text-[#00f3ff] animate-pulse'}`} />
                  <div>
                    <h2 className={`text-xs font-black tracking-widest uppercase ${isLight ? tokens.textPrimary : 'text-[#00f3ff]'}`}>COGNITIVE COMPILER DIRECTIVES</h2>
                  </div>
                </div>

                <button 
                  type="button"
                  id="recompile-model-insights-btn"
                  onClick={handleCompilerGenerate}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-mono font-bold transition-all cursor-pointer active:scale-95 ${
                    isLight 
                      ? 'bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 shadow-xs' 
                      : 'bg-cyan-950 border border-cyan-500/30 text-cyan-400 hover:text-white hover:bg-cyan-900 shadow-[0_0_12px_rgba(0,243,255,0.1)]'
                  }`}
                >
                  <RefreshCw className="h-3 w-3" />
                  RECOMPILE_INSIGHTS
                </button>
              </div>

              {/* Action Directives lists */}
              <div className="space-y-3.5">
                {aiInsightsList.length === 0 ? (
                  <div className={`p-8 text-center text-stone-500 border border-dashed rounded-xl ${isLight ? 'border-stone-200 bg-stone-50/50' : 'border-stone-850/50 bg-stone-900/10'}`}>
                    No active compiled insights detected. Click the compilation button to synthesize nodes.
                  </div>
                ) : (
                  aiInsightsList.map((ins, index) => (
                    <div 
                      key={ins.id || index}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                        ins.type === 'critical' 
                          ? (isLight ? 'bg-rose-50 border-rose-200 shadow-xs' : 'bg-rose-950/20 border-rose-500/30') 
                          : ins.type === 'warn' 
                          ? (isLight ? 'bg-amber-50 border-amber-200 shadow-xs' : 'bg-amber-950/20 border-amber-500/30') 
                          : (isLight ? 'bg-stone-50/60 border-stone-200/80 shadow-xs' : 'bg-[#0a0f1d] border-cyan-500/20')
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${
                            ins.type === 'critical' ? 'bg-red-500 animate-ping' : ins.type === 'warn' ? 'bg-amber-500 animate-pulse' : 'bg-cyan-400 animate-pulse'
                          }`} />
                          <span className="text-[9px] font-black tracking-widest uppercase text-stone-400">
                            {ins.type === 'critical' ? 'CRIT_RISK_VAL' : ins.type === 'warn' ? 'WARN_TELEMETRY' : 'OPTIMAL_COHERENT'}
                          </span>
                        </div>
                        <p className={`text-[11.5px] leading-relaxed font-sans font-medium ${isLight ? 'text-stone-900' : 'text-white'}`}>
                          {ins.text}
                        </p>
                        <p className="text-[10px] text-stone-500 italic font-mono flex items-center gap-1">
                          <Database className={`h-3 w-3 shrink-0 ${isLight ? 'text-stone-400' : 'text-cyan-500/40'}`} /> {ins.metrics}
                        </p>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold border shrink-0 tracking-wider font-mono self-start sm:self-center uppercase ${
                        ins.type === 'critical' 
                          ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' 
                          : ins.type === 'warn' 
                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' 
                          : isLight 
                            ? 'bg-teal-500/10 text-teal-700 border-teal-500/20' 
                            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                      }`}>
                        {ins.actionLabel}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {activeTab === 'model' && (() => {
        const liveSpendWeight = isTraining 
          ? Math.min(10.0, Math.max(0.1, (modelWeights.spendWeight * 10) + Math.sin(epoch * 0.5) * 1.5 + (Math.random() - 0.5) * 0.5))
          : modelWeights.spendWeight * 10;

        const liveDebtWeight = isTraining
          ? Math.min(10.0, Math.max(0.1, (modelWeights.debtPenetrationRatio * 10) + Math.cos(epoch * 0.45) * 1.2 + (Math.random() - 0.5) * 0.4))
          : modelWeights.debtPenetrationRatio * 10;

        const liveApyWeight = isTraining
          ? Math.min(10.0, Math.max(0.1, (modelWeights.APYAccumulationVector * 10) + Math.sin(epoch * 0.6) * 1.7 + (Math.random() - 0.5) * 0.5))
          : modelWeights.APYAccumulationVector * 10;

        const liveReserveWeight = isTraining
          ? Math.min(10.0, Math.max(0.1, (modelWeights.reserveShieldCoeff * 10) + Math.cos(epoch * 0.55) * 1.4 + (Math.random() - 0.5) * 0.5))
          : modelWeights.reserveShieldCoeff * 10;

        const leftPanelTrainingClass = isTraining 
          ? (isLight 
              ? 'bg-rose-50/70 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.15)] scale-[1.005] ring-1 ring-rose-300' 
              : 'border-rose-500/50 bg-[#0f0406] shadow-[0_0_35px_rgba(244,63,94,0.25)] scale-[1.005] ring-1 ring-rose-950')
          : (isLight 
              ? 'bg-white border-stone-200 shadow-xs' 
              : 'border-cyan-500/15 bg-[#080811]/95 shadow-[0_0_20px_rgba(6,182,212,0.06)]');

        const rightPanelTrainingClass = isTraining 
          ? (isLight 
              ? 'bg-rose-50/70 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.15)] scale-[1.005]' 
              : 'border-rose-500/50 bg-[#0f0406] shadow-[0_0_35px_rgba(244,63,94,0.25)] scale-[1.005]')
          : (isLight 
              ? 'bg-white border-stone-200 shadow-xs' 
              : 'border-cyan-500/15 bg-[#080811]/95');

        return (
          <div id="sgd-neural-training-deck" className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full animate-fade-in py-2">
            <style>{`
              @keyframes laserSweep {
                0% { top: 0%; }
                50% { top: 100%; }
                100% { top: 0%; }
              }
            `}</style>
            
            {/* LEFT SIDE: DECISION VECTOR COEFFICIENTS & NEURAL CORE */}
            <div className={`lg:col-span-6 p-6 rounded-2xl border flex flex-col justify-between relative overflow-hidden group transition-all duration-300 ${leftPanelTrainingClass}`}>
              {isTraining && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35 z-10">
                  <div className="w-full h-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[size:100%_4px,3px_100%] animate-pulse" />
                  <div className="absolute left-0 right-0 h-0.5 bg-rose-500/80 blur-[1px] animate-laser-sweep" style={{ animation: 'laserSweep 2.5s linear infinite' }} />
                </div>
              )}
              
              <div className={`absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent ${isLight ? 'via-stone-300' : 'via-cyan-500/40'} to-transparent`} />
              
              <div>
                {isTraining && (
                  <div className={`text-center py-1.5 px-3 text-[9px] font-black tracking-widest font-mono uppercase animate-pulse mb-3 rounded-md border ${
                    isLight ? 'bg-rose-100 text-rose-700 border-rose-300' : 'bg-rose-950/40 text-rose-400 border-rose-500/30'
                  }`}>
                    ⚠️ WARNING: SGD CORES ACTIVE. HIGH UNCERTAINTY DECAY PROCESS RUNNING.
                  </div>
                )}

                <div className={`flex items-center justify-between mb-4 pb-2 border-b ${isLight ? 'border-stone-100' : 'border-cyan-500/10'}`}>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${isLight ? tokens.textPrimary : neuralColors.accent}`}>
                    {isTraining ? 'MUTATING DECISION COEFFICIENTS' : 'NEURAL COHERENT COEFFICIENTS'}
                  </span>
                  <span className={`text-[9px] font-mono ${isLight ? 'text-stone-400' : 'text-stone-500'}`}>
                    {isTraining ? 'GRADIENT_MUTATION_v2.8' : 'COEFF_MATRIX_V2'}
                  </span>
                </div>

                {/* Coefficients weights list */}
                <div className="space-y-4 py-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className={`${isLight ? 'text-stone-500' : 'text-stone-400'} font-bold uppercase`}>OUTFLOW_SPEND_WEIGHT (W0)</span>
                      <span className={`font-bold font-mono ${isTraining ? 'text-rose-500 animate-pulse font-black' : (isLight ? tokens.accentText : neuralColors.accent)}`}>{liveSpendWeight.toFixed(2)}</span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-stone-100' : 'bg-stone-800'}`}>
                      <div 
                        className={`h-full rounded-full transition-all duration-75 ${isTraining ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]' : (neuralColors.bgProgress + (isLight ? ' shadow-[0_0_2px_rgba(0,0,0,0.1)]' : ' shadow-[0_0_8px_var(--neural-accent)]'))}`}
                        style={{ width: `${liveSpendWeight * 10}%`, '--neural-accent': neuralColors.hex } as React.CSSProperties}
                      />
                    </div>
                    <span className="text-[8.5px] text-stone-500 block leading-none">Scales based on discretionary expenses velocity</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className={`${isLight ? 'text-stone-500' : 'text-stone-400'} font-bold uppercase`}>DEBT_DRAG_PENETRATION (W1)</span>
                      <span className={`font-bold font-mono ${isTraining ? 'text-rose-500 animate-pulse font-black' : (isLight ? tokens.accentText : neuralColors.accent)}`}>{liveDebtWeight.toFixed(2)}</span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-stone-100' : 'bg-stone-800'}`}>
                      <div 
                        className={`h-full rounded-full transition-all duration-75 ${isTraining ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]' : `bg-pink-500 ${isLight ? 'shadow-[0_0_2px_rgba(0,0,0,0.1)]' : 'shadow-[0_0_8px_rgba(236,72,153,0.5)]'}`}`}
                        style={{ width: `${liveDebtWeight * 10}%` }}
                      />
                    </div>
                    <span className="text-[8.5px] text-stone-500 block leading-none">Measures liability drag on portfolio compound velocity</span>
                  </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className={`${isLight ? 'text-stone-500' : 'text-stone-400'} font-bold uppercase`}>APY_COMPOUND_ACCEL (W2)</span>
                    <span className={`font-bold font-mono ${isTraining ? 'text-rose-500 animate-pulse font-black' : (isLight ? tokens.accentText : neuralColors.accent)}`}>{liveApyWeight.toFixed(2)}</span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-stone-100' : 'bg-stone-800'}`}>
                    <div 
                      className={`h-full rounded-full transition-all duration-75 ${isTraining ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]' : `bg-amber-500 ${isLight ? 'shadow-[0_0_2px_rgba(0,0,0,0.1)]' : 'shadow-[0_0_8px_rgba(242,158,11,0.5)]'}`}`}
                      style={{ width: `${liveApyWeight * 10}%` }}
                    />
                  </div>
                  <span className="text-[8.5px] text-stone-500 block leading-none">Accelerates exponentially as blended yield rates increase</span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className={`${isLight ? 'text-stone-500' : 'text-stone-400'} font-bold uppercase`}>LIQUID_RESERVE_SHIELD (W3)</span>
                    <span className={`font-bold font-mono ${isTraining ? 'text-rose-500 animate-pulse font-black' : (isLight ? tokens.accentText : neuralColors.accent)}`}>{liveReserveWeight.toFixed(2)}</span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-stone-100' : 'bg-stone-800'}`}>
                    <div 
                      className={`h-full rounded-full transition-all duration-75 ${isTraining ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]' : `bg-emerald-500 ${isLight ? 'shadow-[0_0_2px_rgba(0,0,0,0.1)]' : 'shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}`}
                      style={{ width: `${liveReserveWeight * 10}%` }}
                    />
                  </div>
                  <span className="text-[8.5px] text-stone-500 block leading-none">Tracks liquidity reserves defense margin against emergency outflows</span>
                </div>
              </div>

              {/* Serious and technical neural graph representation of machine learning */}
              {(() => {
                // Generate points for the SGD Training Convergence line
                const wavePoints1 = [];
                const wavePoints2 = [];
                for (let i = 0; i <= 28; i++) {
                  const x = 20 + i * 10;
                  
                  // Base wave mathematical shapes
                  const baseSine1 = Math.sin(i * 0.45) * 18;
                  const baseSine2 = Math.cos(i * 0.55) * 14;
                  
                  // Descending decay curve modeling convergent loss
                  const decayFactor = isTraining ? Math.max(0.12, 1 - epoch / 100) : 0.35;
                  const convergenceTrend = 85 - (i * 1.5) * (1 - decayFactor);
                  
                  // Add real-time SGD noise/fluctuations when actively training weights
                  const noisyFluctuation = isTraining ? (Math.sin(epoch * 0.6 + i) * 11 * decayFactor) : 0;
                  
                  const y1 = Math.max(22, Math.min(138, convergenceTrend + baseSine1 * decayFactor + noisyFluctuation));
                  const y2 = Math.max(22, Math.min(138, 55 + baseSine2 * (1.25 - decayFactor) + noisyFluctuation * 0.4));
                  
                  wavePoints1.push(`${x},${y1}`);
                  wavePoints2.push(`${x},${y2}`);
                }
                const wavePath1 = `M ${wavePoints1.join(' L ')}`;
                const wavePath2 = `M ${wavePoints2.join(' L ')}`;

                return (
                  <div id="ml-decision-neural-graph" className={`mt-4 p-4 rounded-xl border relative overflow-hidden flex flex-col items-center justify-between w-full ${
                    isLight ? 'bg-stone-50 border-stone-250/70 shadow-xs' : 'bg-zinc-950/80 border-cyan-500/15'
                  }`}>
                    <div className="w-full flex items-center justify-between mb-2">
                      <span className={`text-[8.5px] uppercase tracking-widest font-black font-mono ${isLight ? tokens.textPrimary : neuralColors.accentText}`}>
                        {isTraining ? `SGD LOSS GRADIENT SPECTRUM (EPOCH_${epoch}/100)` : 'STOCHASTIC GRADIENT VECTOR CONVERGENCE'}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className={`h-1.5 w-1.5 rounded-full ${isTraining ? 'bg-[#ff0055] animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
                        <span className="text-[7.5px] font-mono text-stone-500">LEARNING_RATE={mlDetails.learningRate}</span>
                      </div>
                    </div>

                    <div className="relative w-full h-44 my-2 flex items-center justify-center">
                      <div className="absolute inset-0 bg-[#00f3ff]/[0.01] bg-grid-pattern opacity-10 pointer-events-none" />
                      
                      {/* SVG Canvas */}
                      <svg className="w-full h-full" viewBox="0 0 320 150">
                        {/* Coordinate Grid Background */}
                        <line x1="20" y1="15" x2="300" y2="15" stroke={isLight ? '#e5e7eb' : '#1e293b'} strokeWidth="0.5" strokeDasharray="3,3" />
                        <line x1="20" y1="45" x2="300" y2="45" stroke={isLight ? '#e5e7eb' : '#1e293b'} strokeWidth="0.5" strokeDasharray="3,3" />
                        <line x1="20" y1="75" x2="300" y2="75" stroke={isLight ? '#e5e7eb' : '#1e293b'} strokeWidth="0.5" strokeDasharray="3,3" />
                        <line x1="20" y1="105" x2="300" y2="105" stroke={isLight ? '#e5e7eb' : '#1e293b'} strokeWidth="0.5" strokeDasharray="3,3" />
                        <line x1="20" y1="135" x2="300" y2="135" stroke={isLight ? '#dee2e6' : '#2e3e56'} strokeWidth="1" />

                        {/* Y-Axis Guideline */}
                        <line x1="20" y1="15" x2="20" y2="135" stroke={isLight ? '#dee2e6' : '#2e3e56'} strokeWidth="1" />

                        {/* Graph Titles */}
                        <text x="25" y="24" className="text-stone-500 font-mono text-[5px] uppercase font-bold tracking-wider opacity-60">OPTIMAL_BIAS (Limit: 1.0)</text>
                        <text x="25" y="130" className="text-stone-500 font-mono text-[5px] uppercase font-bold tracking-wider opacity-60">CONVERGED LOSS EQUILIBRIUM</text>

                        {/* Gradients */}
                        <defs>
                          <linearGradient id="gradientLineRed" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#ec4899" />
                            <stop offset="100%" stopColor="#a855f7" />
                          </linearGradient>
                          <linearGradient id="gradientLineCyan" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#06b6d4" />
                            <stop offset="100%" stopColor="#22c55e" />
                          </linearGradient>
                        </defs>

                        {/* Sub curves - APY speed */}
                        <path
                          d={wavePath2}
                          fill="none"
                          stroke={isLight ? '#94a3b8' : 'url(#gradientLineCyan)'}
                          strokeWidth="1.5"
                          strokeDasharray={isTraining ? '3,2' : 'none'}
                          opacity="0.8"
                        />

                        {/* Primary wave - Loss decay curve */}
                        <path
                          d={wavePath1}
                          fill="none"
                          stroke={isLight ? '#0f172a' : 'url(#gradientLineRed)'}
                          strokeWidth={isTraining ? '2.5' : '1.8'}
                          style={{ filter: isTraining ? 'drop-shadow(0 0 4px rgba(236, 72, 153, 0.6))' : 'none' }}
                          className="transition-all duration-300"
                        />

                        {/* Laser Sweeper Vertical Bar during Training */}
                        {isTraining && (
                          <line
                            x1={30 + (epoch % 27) * 10}
                            y1="15"
                            x2={30 + (epoch % 27) * 10}
                            y2="135"
                            stroke="#00f3ff"
                            strokeWidth="1.5"
                            opacity="0.7"
                            style={{ filter: 'drop-shadow(0 0 3px #00f3ff)' }}
                          />
                        )}

                        {/* Vector Weights indicators */}
                        <text x="270" y="30" className="fill-stone-500 font-mono text-[4.8px] font-bold">W_SPND: {(modelWeights.spendWeight).toFixed(2)}</text>
                        <text x="270" y="42" className="fill-stone-500 font-mono text-[4.8px] font-bold">W_DEBT: {(modelWeights.debtPenetrationRatio).toFixed(2)}</text>
                        <text x="270" y="54" className="fill-stone-500 font-mono text-[4.8px] font-bold">W_APY: {(modelWeights.APYAccumulationVector).toFixed(2)}</text>
                        <text x="270" y="66" className="fill-stone-500 font-mono text-[4.8px] font-bold">W_SHLD: {(modelWeights.reserveShieldCoeff).toFixed(2)}</text>

                        {/* Real-time Telemetry numbers */}
                        <text x="25" y="60" className="fill-cyan-500 font-mono text-[5.5px] font-bold uppercase">MOMENTUM=0.90</text>
                        <text x="25" y="70" className="fill-fuchsia-500 font-mono text-[5.5px] font-bold uppercase">CONV_RATE=0.982</text>
                        <text x="25" y="80" className="fill-yellow-600 font-mono text-[5.5px] font-bold uppercase">VARIANCE={isTraining ? '±0.032' : '±0.004'}</text>
                      </svg>
                    </div>

                    <div className="text-center mt-1 w-full border-t border-dashed border-stone-800/10 pt-2">
                      <span className="text-[9px] font-mono font-bold text-stone-500 block uppercase tracking-wider">
                        {isTraining ? `SGD MINIMIZER ERROR: ${loss.toFixed(6)} | CALIBRATING COEFFS` : 'Vector gradient convergence stabilized successfully.'}
                      </span>
                    </div>
                  </div>
                );
              })()}

            </div>

            <div className="mt-5">
              <button
                type="button"
                id="train-neuronal-core-btn"
                disabled={isTraining}
                onClick={handleOverclockTraining}
                className={`w-full py-2.5 rounded-xl font-bold tracking-widest text-[10px] uppercase transition-all duration-200 border flex items-center justify-center gap-2 ${
                  isTraining 
                    ? 'bg-purple-950/20 border-purple-500/30 text-purple-400 animate-pulse cursor-not-allowed' 
                    : isLight
                      ? 'bg-stone-900 border-stone-900 text-white hover:bg-stone-850 shadow-xs cursor-pointer'
                      : 'bg-stone-950 text-white hover:text-cyan-300 border-cyan-500/30 hover:border-cyan-400 hover:bg-[#0c0d1b] shadow-[0_0_12px_rgba(0,243,255,0.1)] hover:scale-[1.01] cursor-pointer'
                }`}
              >
                <Cpu className={`h-4 w-4 ${isTraining ? 'animate-spin' : ''}`} />
                {isTraining ? `SGD ERROR DEVIATION LOWERED (${((1 - loss) * 100).toFixed(1)}%)` : 'OVERCLOCK MANUAL TRAINING'}
              </button>
            </div>

            {/* ML COGNITIVE THEME STABILIZER INTERACTIVE SUB-SYSTEM */}
            <div className={`mt-6 p-4 rounded-xl border transition-all duration-300 ${isLight ? 'bg-stone-50 border-stone-200' : 'bg-[#0b0c16] border-cyan-500/20'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-1.5 rounded-lg ${isLight ? 'bg-amber-100 text-amber-700' : 'bg-cyan-500/10 text-[#00f3ff]'}`}>
                  <Cpu className="h-4 w-4 animate-pulse" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-stone-800' : 'text-cyan-400'}`}>
                    ML Cognitive Theme Evaluator
                  </h4>
                  <p className="text-[9px] text-stone-500 font-mono">NEURAL THEMATIC FEEDBACK LOOP</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className={isLight ? 'text-stone-600' : 'text-stone-400'}>Contrast Stability Index:</span>
                  <span className={`font-bold ${themeAnalysis.score >= 90 ? 'text-emerald-500' : 'text-amber-500 animate-pulse'}`}>
                    {themeAnalysis.score}% {themeAnalysis.score >= 90 ? 'STABLE' : 'DEVIATION ALERT'}
                  </span>
                </div>

                {/* Animated scoring bar */}
                <div className="h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      themeAnalysis.score >= 90 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500 animate-pulse shadow-[0_0_8px_#f59e0b]'
                    }`} 
                    style={{ width: `${themeAnalysis.score}%` }} 
                  />
                </div>

                <div className={`text-[10px] leading-relaxed p-2.5 rounded-lg font-mono ${
                  isLight ? 'bg-[#f4f2f0] text-stone-700 border border-stone-200' : 'bg-[#0f1124] text-cyan-300/90 border border-cyan-500/10'
                }`}>
                  <span className="text-stone-500 font-bold uppercase text-[8px] block mb-0.5">Engine Diagnosis:</span>
                  {themeAnalysis.description}
                </div>

                {themeAnalysis.score < 90 && onChangeTheme && (
                  <button
                    type="button"
                    onClick={() => {
                      if (soundEnabled) playCyberChirp('success');
                      onChangeTheme({ mode: theme.mode, palette: themeAnalysis.recommendation as any });
                    }}
                    className={`w-full py-2 px-3 rounded-lg font-mono text-[10px] font-bold uppercase transition-all duration-300 border shadow-md hover:scale-[1.01] flex items-center justify-center gap-1.5 cursor-pointer ${
                      isLight 
                        ? 'bg-stone-900 text-white border-stone-800 hover:bg-stone-800' 
                        : 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-stone-950 border-cyan-400 font-bold hover:brightness-110 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    }`}
                  >
                    <Sparkles className="h-3 w-3 animate-pulse" />
                    Auto-Tune Theme: [{themeAnalysis.recommendation.toUpperCase()}]
                  </button>
                )}
                {themeAnalysis.score >= 90 && (
                  <div className={`flex items-center justify-center gap-1.5 p-2 rounded-lg text-[9px] font-mono leading-none ${
                    isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10'
                  }`}>
                    <CheckCircle className="h-3 w-3" />
                    COGNITIVE ALIGNMENT RATING PERFECT
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: LOSS CURVE CHART, CAPABILITIES & REAL-TIME TERMINAL */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* CAPACITY PROFILE & LIVE LOSS PLOT */}
            <div className={`p-6 rounded-2xl border relative overflow-hidden flex flex-col justify-between ${
              isLight ? 'bg-white border-stone-200 shadow-xs' : 'border-cyan-500/15 bg-[#080811]/95'
            }`}>
              <div className={`absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent ${isLight ? 'via-stone-250' : 'via-cyan-500/20'} to-transparent`} />
              
              <div className="space-y-4">
                <div className={`flex items-center justify-between pb-2 border-b ${isLight ? 'border-stone-100' : 'border-cyan-500/10'}`}>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${isLight ? 'text-stone-800' : 'text-white'}`}>MODEL STABILITY & EFFICIENCY</span>
                  <div className="flex items-center gap-1.5 font-mono text-[9px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-500 font-bold uppercase">LOSS_GRADIENT_CURVE</span>
                  </div>
                </div>

                {/* Simulated SVG Graph of actual trained losses history */}
                <div className="pt-1">
                  <div className="flex justify-between items-center text-[9px] font-mono text-stone-500 mb-1">
                    <span>COEFF_LOSS (SGD ERROR)</span>
                    <span>CURVE SCALE: [0.0 - 1.0]</span>
                  </div>

                  <div className={`relative h-24 w-full rounded-lg border p-1.5 overflow-hidden flex items-end ${
                    isLight ? 'bg-stone-50/50 border-stone-200' : 'bg-black/40 border-cyan-500/10'
                  }`}>
                    {/* SVG Chart Line */}
                    <svg className="w-full h-full" viewBox="0 0 250 80" preserveAspectRatio="none">
                      {/* Grid Guide lines */}
                      <line x1="0" y1="20" x2="250" y2="20" stroke={isLight ? '#e5e7eb' : '#334155'} strokeWidth="0.5" strokeDasharray="3,3" />
                      <line x1="0" y1="40" x2="250" y2="40" stroke={isLight ? '#e5e7eb' : '#334155'} strokeWidth="0.5" strokeDasharray="3,3" />
                      <line x1="0" y1="60" x2="250" y2="60" stroke={isLight ? '#e5e7eb' : '#334155'} strokeWidth="0.5" strokeDasharray="3,3" />
                      
                      {/* Spline area gradient */}
                      <defs>
                        <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={neuralColors.hex} stopOpacity="0.25" />
                          <stop offset="100%" stopColor={neuralColors.hex} stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Area geometry */}
                      <path
                        d={`M 10,75 L ${mlDetails.losses.map((val, idx) => {
                          const lengthDenom = mlDetails.losses.length > 1 ? mlDetails.losses.length - 1 : 1;
                          const x = idx * (230 / lengthDenom) + 10;
                          const y = Math.max(10, 75 - (val * 65));
                          return `${x},${y}`;
                        }).join(' ')} L 240,75 Z`}
                        fill="url(#chartGlow)"
                      />

                      {/* Primary line plot */}
                      <polyline
                        fill="none"
                        stroke={neuralColors.hex}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={mlDetails.losses.map((val, idx) => {
                          const lengthDenom = mlDetails.losses.length > 1 ? mlDetails.losses.length - 1 : 1;
                          const x = idx * (230 / lengthDenom) + 10;
                          const y = Math.max(10, 75 - (val * 65));
                          return `${x},${y}`;
                        }).join(' ')}
                      />

                      {/* Interactive dot on final loss value */}
                      {(() => {
                        if (!mlDetails.losses || mlDetails.losses.length === 0) return null;
                        const finalIdx = mlDetails.losses.length - 1;
                        if (mlDetails.losses[finalIdx] === undefined || isNaN(mlDetails.losses[finalIdx])) return null;
                        const fxDenom = finalIdx > 0 ? finalIdx : 1;
                        const fx = finalIdx * (230 / fxDenom) + 10;
                        const fy = Math.max(10, 75 - (mlDetails.losses[finalIdx] * 65));
                        if (isNaN(fx) || isNaN(fy)) return null;
                        return (
                          <circle cx={fx} cy={fy} r="3.5" fill={neuralColors.hex} stroke="white" strokeWidth="1" className="animate-pulse" />
                        );
                      })()}
                    </svg>

                    {/* Chart annotations */}
                    <div className="absolute bottom-1.5 left-2.5 right-2.5 flex justify-between text-[8px] font-mono text-stone-500 font-bold leading-none pointer-events-none">
                      <span>EPOCH 00</span>
                      <span>SGD SYSTEM MIDPOINT</span>
                      <span>EPOCH 100 [CONVERGED]</span>
                    </div>
                  </div>
                </div>

                {/* Real-time parameters lists */}
                <div className="grid grid-cols-3 gap-3">
                  <div className={`p-2.5 rounded-xl border text-center ${isLight ? 'bg-stone-50 border-stone-250/75' : 'bg-black/35 border-cyan-500/10'}`}>
                    <span className="text-[8px] font-mono font-bold text-stone-500 block uppercase">CATEGORIC_ACCURACY</span>
                    <span className={`text-[12.5px] font-black font-mono block mt-0.5 ${neuralColors.accentText}`}>
                      {mlDetails.accuracy.toFixed(1)}%
                    </span>
                  </div>
                  <div className={`p-2.5 rounded-xl border text-center ${isLight ? 'bg-stone-50 border-stone-250/75' : 'bg-black/35 border-cyan-500/10'}`}>
                    <span className="text-[8px] font-mono font-bold text-stone-500 block uppercase">CALCULATION_SPEED</span>
                    <span className={`text-[12.5px] font-black font-mono block mt-0.5 ${isLight ? 'text-stone-850' : 'text-neutral-200'}`}>
                      240 μs
                    </span>
                  </div>
                  <div className={`p-2.5 rounded-xl border text-center ${isLight ? 'bg-stone-50 border-stone-250/75' : 'bg-black/35 border-cyan-500/10'}`}>
                    <span className="text-[8px] font-mono font-bold text-stone-500 block uppercase">TOTAL_DATASET_N</span>
                    <span className={`text-[12.5px] font-black font-mono block mt-0.5 ${isLight ? 'text-stone-850' : 'text-neutral-200'}`}>
                      {expenses.length} logs
                    </span>
                  </div>
                </div>

                {/* Trained parameters - Top dynamic TF-IDF associative tokens */}
                <div className="space-y-1.5">
                  <span className="text-[8.5px] font-mono text-stone-500 block font-bold uppercase tracking-wider">
                    TRAINED ASSOCIATIVE HIGHLIGHT VECTORS (TF-IDF COHERENCE)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {mlDetails.weightKeys.map((item, idx) => (
                      <span 
                        key={idx} 
                        className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono border flex items-center gap-1 uppercase transition-all duration-300 ${
                          isLight 
                            ? 'bg-stone-50 border-stone-250 text-stone-700' 
                            : 'bg-cyan-950/15 border-cyan-500/10 hover:border-cyan-500/30 text-stone-300'
                        }`}
                      >
                        <span>{item}</span>
                        <span className={`ml-0.5 font-bold ${neuralColors.accentText}`}>+{(mlDetails.weightValues[idx] || 1.1).toFixed(1)}</span>
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      )})()}

      {activeTab === 'sms' && (
        <div id="sms-unification-terminal" className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* SMS TELEMETRY CONTROLS & GATEWAY */}
          <div className={`xl:col-span-1 p-6 rounded-2xl border flex flex-col justify-between relative overflow-hidden group ${
            isLight ? 'bg-white border-stone-250 shadow-xs' : 'border-cyan-500/25 bg-[#080811]/95 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
          }`}>
            <div className={`absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-${isLight ? 'stone-300' : 'cyan-500/40'} to-transparent`} />
            
            <div>
              <div className={`flex items-center justify-between mb-4 pb-2 border-b ${isLight ? 'border-stone-200' : 'border-cyan-500/10'}`}>
                <span className={`text-[10px] font-black uppercase ${isLight ? tokens.textPrimary : 'text-[#00f3ff]'}`}>CELLULAR RECEIVER GATEWAY</span>
                <span className={`text-[9px] font-mono ${isLight ? 'text-stone-400 font-bold' : 'text-[#00f3ff]/50'}`}>TELEMETRY_G</span>
              </div>

              <div id="sms-permission-card" className={`p-4 rounded-xl border text-center space-y-3 relative overflow-hidden ${
                isLight ? 'bg-stone-50 border-stone-200' : 'bg-cyan-950/10 border-cyan-500/10'
              }`}>
                <div className={`h-10 w-10 mx-auto rounded-full flex items-center justify-center ${
                  isLight ? 'bg-stone-100 border border-stone-250' : 'bg-stone-900/80 border border-stone-800'
                }`}>
                  <Shield id="sms-shield-badge-ico" className={`h-5 w-5 ${smsPermissionState === 'granted' ? 'text-emerald-500 animate-pulse' : 'text-stone-400'}`} />
                </div>
                
                <div>
                  <span className={`text-xs font-black block uppercase ${isLight ? 'text-stone-850' : 'text-white'}`}>SMS ACCESS CONTROLLER</span>
                  <p className={`text-[9.5px] mt-1.5 leading-relaxed ${isLight ? 'text-stone-600' : 'text-stone-400'}`}>
                    Echelon Vault can monitor incoming transaction SMS alerts from Indian and International banks directly to record expenditures with a single click.
                  </p>
                </div>

                <div className="pt-2">
                  {smsPermissionState === 'prompt' ? (
                    <button
                      type="button"
                      id="grant-sms-perm-trigger-btn"
                      onClick={handleRequestSmsPermission}
                      className={`w-full py-2 font-mono font-bold uppercase rounded-lg text-[9.5px] transition-all cursor-pointer ${
                        isLight ? 'bg-stone-900 text-white shadow-xs hover:bg-stone-850' : 'bg-[#00f3ff] text-zinc-950 shadow-[0_0_12px_rgba(0,243,255,0.3)] hover:scale-105'
                      }`}
                    >
                      GRANT SMS_TELEMETRY ACCESS
                    </button>
                  ) : smsPermissionState === 'granted' ? (
                    <div className="p-2 border border-emerald-500/25 bg-emerald-500/10 rounded-lg flex items-center justify-center gap-1.5 text-emerald-400 font-mono font-black text-[9.5px] uppercase">
                      <CheckCircle className="h-4 w-4" />
                      <span>TELEMETRY_ACCESS_GRANTED [ACTIVE]</span>
                    </div>
                  ) : (
                    <div className="p-2 border border-rose-500/25 bg-rose-500/10 rounded-lg flex items-center justify-center gap-1.5 text-rose-450 font-mono text-[9px] uppercase">
                      <AlertTriangle className="h-4 w-4" />
                      <span>ACCESS_DECLINED_BY_USER</span>
                    </div>
                  )}
                </div>
              </div>

              {smsPermissionState === 'granted' && (
                <div className={`mt-4 space-y-3 pt-4 border-t ${isLight ? 'border-stone-200' : 'border-cyan-500/10'}`}>
                  <span className="text-[9px] uppercase tracking-wider text-stone-500 font-bold block">FAST PRESET SIMULATION</span>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      id="simulate-sms-hdfc-btn"
                      onClick={() => parseIncomingBankSMS('HDFC Bank: Debit of INR 15,000 for Amazon spends from A/C 9988.')}
                      className={`text-left text-[9.5px] p-2 rounded transition-all font-mono border ${
                        isLight 
                          ? 'bg-stone-50 hover:bg-stone-100 border-stone-250 text-stone-700' 
                          : 'bg-cyan-950/15 hover:bg-cyan-900/30 border-cyan-500/10 hover:border-cyan-400/40 text-stone-300'
                      }`}
                    >
                      Receive Mock Debit [HDFC - ₹15,000]
                    </button>
                    <button
                      type="button"
                      id="simulate-sms-sbi-btn"
                      onClick={() => parseIncomingBankSMS('SBI Alert: Card 1234 was charged INR 2,450.00 at Swiggy cafe.')}
                      className={`text-left text-[9.5px] p-2 rounded transition-all font-mono border ${
                        isLight 
                          ? 'bg-stone-50 hover:bg-stone-100 border-stone-250 text-stone-700' 
                          : 'bg-cyan-950/15 hover:bg-cyan-900/30 border-cyan-500/10 hover:border-cyan-400/40 text-stone-300'
                      }`}
                    >
                      Receive Mock Debit [SBI - ₹2,450]
                    </button>
                    <button
                      type="button"
                      id="simulate-sms-icici-btn"
                      onClick={() => parseIncomingBankSMS('ICICI Bank: Repayment debited INR 25,000 for rent bills.')}
                      className={`text-left text-[9.5px] p-2 rounded transition-all font-mono border ${
                        isLight 
                          ? 'bg-stone-50 hover:bg-stone-100 border-stone-250 text-stone-700' 
                          : 'bg-cyan-950/15 hover:bg-cyan-900/30 border-cyan-500/10 hover:border-cyan-400/40 text-stone-300'
                      }`}
                    >
                      Receive Mock Debit [ICICI - ₹25,000]
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* SMS SANDBOX PARSER AND CONFIRMATION HUDS */}
          <div className={`xl:col-span-2 p-6 rounded-2xl border flex flex-col justify-between relative ${
            isLight ? 'bg-white border-stone-250 shadow-xs' : 'border-cyan-500/25 bg-[#080811]/95 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
          }`}>
            <div className={`absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-${isLight ? 'stone-300' : 'cyan-500/40'} to-transparent`} />
            
            <div>
              <div className={`flex items-center justify-between border-b pb-4 mb-4 ${isLight ? 'border-stone-200' : 'border-cyan-500/20'}`}>
                <div className="flex items-center gap-2">
                  <MessageSquare className={`h-4 w-4 ${isLight ? tokens.accentText : 'text-[#00f3ff] animate-pulse'}`} />
                  <div>
                    <h2 className={`text-xs font-black tracking-widest uppercase mb-0.5 ${isLight ? tokens.textPrimary : 'text-[#00f3ff]'}`}>MOCK CELLULAR TELEMETRY DECODER</h2>
                    <p className={`text-[9px] ${isLight ? 'text-stone-550' : 'text-stone-400'}`}>Type or select a banker SMS below to trigger automation parsing engine</p>
                  </div>
                </div>
              </div>

              {smsPermissionState !== 'granted' ? (
                <div className={`h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-xl ${
                  isLight ? 'bg-stone-50 border-stone-250' : 'bg-black/40 border-cyan-500/10'
                }`}>
                  <Shield className="h-8 w-8 text-stone-400 mb-3" />
                  <span className={`text-xs font-bold ${isLight ? tokens.textPrimary : 'text-[#00f3ff]'}`}>TELEMETRY ACCESS LOCKED</span>
                  <p className="text-[10px] text-stone-500 max-w-[280px] mt-1">
                    Please approve SMS telemetry permissions in the controller card on the left to activate simulated incoming logs.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Manual custom input */}
                  <div className={`p-4 rounded-xl border space-y-3 ${
                    isLight ? 'bg-stone-50 border-stone-200' : 'bg-black border-cyan-500/10'
                  }`}>
                    <span className="text-[9px] uppercase tracking-wider text-stone-550 font-bold font-mono block">SMS CUSTOM TEXT PARSER DECK</span>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        id="custom-banking-sms-input-fld"
                        value={customSmsInput}
                        onChange={(e) => setCustomSmsInput(e.target.value)}
                        placeholder="Paste SBI/HDFC spend message alert here (e.g. ₹500 charged at Blinkit)"
                        className={`flex-1 p-2 border rounded font-mono text-[10.5px] ${
                          isLight 
                            ? 'border-stone-250 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-405' 
                            : 'border-cyan-500/20 bg-stone-900 text-[#00f3ff] focus:outline-none'
                        }`}
                      />
                      <button
                        type="button"
                        id="run-custom-sms-parse-btn"
                        onClick={() => {
                          parseIncomingBankSMS(customSmsInput);
                          setCustomSmsInput('');
                        }}
                        className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded font-bold font-mono tracking-wider text-[9.5px] uppercase hover:scale-105 active:scale-95 transition-all text-center whitespace-nowrap cursor-pointer"
                      >
                        RUN PARSER
                      </button>
                    </div>
                  </div>

                  {/* Confirmed message alerts flashes */}
                  {confirmedLoggedMsg && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-[10px] font-bold font-mono animate-pulse flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      <span>{confirmedLoggedMsg}</span>
                    </div>
                  )}

                  {/* Parsed Telemetry Confirm Panel */}
                  {interceptedSMS ? (
                    <div className={`p-4 rounded-xl space-y-3 relative border ${
                      isLight ? 'bg-stone-50 border-stone-250 shadow-xs' : 'bg-[#0a0f1d] border-cyan-500/30'
                    }`}>
                      <div className={`absolute top-2 right-2 text-[8px] font-mono uppercase font-black tracking-widest px-1.5 py-0.5 rounded border ${
                        isLight ? 'text-stone-500 bg-stone-100 border-stone-250' : 'text-cyan-500/60 bg-cyan-950/40 border-cyan-500/20'
                      }`}>
                        SMS_AUTO_RESOLVED
                      </div>

                      <div className={`flex items-center gap-2 pb-2 border-b ${isLight ? 'border-stone-200' : 'border-cyan-500/10'}`}>
                        <Zap className="h-4 w-4 text-pink-500 shrink-0" />
                        <div>
                          <span className="text-[9.5px] text-pink-600 font-bold uppercase tracking-widest font-mono">AUTOMATED PARSER VERIFIED</span>
                          <span className="text-[8px] text-stone-500 block">Parsed at {interceptedSMS.timestamp}</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-[10px]">
                        <div className={`p-2.5 rounded border ${isLight ? 'bg-white border-stone-200' : 'bg-stone-950/80 border-cyan-500/10'}`}>
                          <span className="text-stone-500 block leading-normal uppercase text-[8.5px]">Raw banker cellular text stream:</span>
                          <p className={`font-serif leading-relaxed italic mt-0.5 ${isLight ? 'text-stone-700' : 'text-stone-300'}`}>
                            "{interceptedSMS.rawText}"
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3.5 pt-1.5">
                          <div>
                            <span className="text-stone-500 block uppercase text-[8.5px]">Extracted Amount:</span>
                            <span className="text-emerald-500 text-sm font-black font-mono">
                              {currencySymbol}{interceptedSMS.parsedAmt.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-stone-500 block uppercase text-[8.5px]">Matched Coffer Asset / Bank:</span>
                            <span className={`text-xs font-black font-mono ${isLight ? tokens.accentText : 'text-[#00f3ff]'}`}>
                              {interceptedSMS.parsedAssetName || 'Liquid assets coffer'}
                            </span>
                          </div>
                          <div>
                            <span className="text-stone-500 block uppercase text-[8.5px]">Determined Category:</span>
                            <span className="text-amber-500 text-xs font-black font-mono">
                              {interceptedSMS.parsedCategory}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-cyan-500/10">
                        <button
                          type="button"
                          id="confirm-ledger-log-btn"
                          onClick={handleConfirmSyncExpense}
                          className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-[10px] font-bold font-mono uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 hover:scale-[1.01] transition-all cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                        >
                          <Check className="h-4 w-4" />
                          CONFIRM LEDGER SIGN & LOG
                        </button>
                        <button
                          type="button"
                          id="decline-ledger-log-btn"
                          onClick={() => {
                            setInterceptedSMS(null);
                            if (soundEnabled) playCyberChirp('beep');
                          }}
                          className="py-2 px-4 border border-stone-800 bg-stone-900/50 text-stone-400 hover:text-stone-200 hover:border-stone-700 text-[10px] font-mono rounded-lg transition-all"
                        >
                          DECLINE
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-44 flex flex-col items-center justify-center text-center p-6 border border-dashed border-cyan-500/10 rounded-xl bg-black/40">
                      <MessageSquare className="h-6 w-6 text-stone-700 shrink-0 mb-2" />
                      <span className="text-[10px] text-stone-500 uppercase font-mono">Telemetry idle. Standing by for SMS event triggers...</span>
                    </div>
                  )}

                  {/* System instruction panel */}
                  <div className="p-3 bg-cyan-950/20 border border-cyan-500/10 rounded-xl space-y-1.5 text-stone-400">
                    <span className="text-[9.5px] text-[#00f3ff] font-bold block uppercase tracking-wide">HOW IT WORKS</span>
                    <p className="text-[9.5px] leading-relaxed">
                      AI local tokenizer monitors banking strings. When matches occur (HDFC, SBI, Rs, spent), the regex matcher evaluates the decimals. Ledger updates are only committed once the user signs / clicks the **CONFIRM LEDGER** button, guaranteeing total security.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-xl">
              <span className="text-[9.5px] text-stone-400">
                Auto-telemetry triggers match the physical phone environment with client-side Sandboxing.
              </span>
            </div>
          </div>

        </div>
      )}

      {/* POPUP: SMS TELEMETRY ACCESS PERMISSION REQUESTING DIALOG */}
      {showPermissionDialog && (
        <div id="sms-permission-dialog-overlay" className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm p-6 rounded-2xl border border-cyan-500 bg-[#0c0d1e] text-center space-y-4 shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#00f3ff] to-transparent animate-pulse" />
            
            <div className="h-12 w-12 mx-auto bg-cyan-950/40 border border-cyan-500/40 rounded-xl flex items-center justify-center p-1.5 shadow-[0_0_15px_rgba(0,243,255,0.3)] animate-bounce">
              <Shield className="h-6 w-6 text-[#00f3ff]" />
            </div>

            <div className="space-y-1">
              <span className="text-xs uppercase tracking-widest text-[#00f3ff] font-bold block">GRANT SYSTEM PERMISSION</span>
              <h2 className="text-sm font-black text-white leading-snug">SMS TELEMETRY INTEGRITY DECK</h2>
              <p className="text-[10px] text-stone-400 leading-normal pt-2">
                "Allow Echelon Vault to access and read incoming bank account SMS notifications matching HDFC, SBI, ICICI, Rs, standard transaction decimals?"
              </p>
            </div>

            <div className="bg-stone-950/60 p-2.5 rounded-lg border border-cyan-500/10 text-left space-y-1 text-stone-500">
              <span className="text-[8.5px] font-black text-pink-500 uppercase font-mono block">🔒 ZERO INVASION GUARANTEE:</span>
              <p className="text-[9px] leading-tight">
                All cellular text operations occur exclusively on device memory. Zero private text message alerts ever leave this sandboxed browser tab.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                id="perm-grant-yes-btn"
                onClick={() => confirmSmsPermission(true)}
                className="flex-1 py-2 bg-[#00f3ff] text-zinc-950 font-bold font-mono uppercase text-[9.5px] rounded-lg tracking-widest hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-[0_0_12px_rgba(0,243,255,0.4)] text-center"
              >
                ALLOW INTEGRATION
              </button>
              <button
                type="button"
                id="perm-grant-no-btn"
                onClick={() => confirmSmsPermission(false)}
                className="py-2 px-4 border border-stone-800 text-stone-400 hover:text-stone-200 text-[10px] font-mono rounded-lg transition-all"
              >
                DECLINE
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
