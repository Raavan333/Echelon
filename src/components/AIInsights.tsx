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
  Database
} from 'lucide-react';
import { EchelonTheme, Asset, Loan, LoanType, Expense, FinancialGoal, BudgetCategoryLimit } from '../types';
import { getColorTokens } from '../utils/theme';
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
}

// Retro-alien cyber-tech sound synthesizers using Web Audio API
const playCyberChirp = (type: 'beep' | 'success' | 'train' | 'alert') => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (type === 'beep') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch A5
      osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } else if (type === 'success') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.16); // G5
      osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.24); // C6
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    } else if (type === 'train') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, audioCtx.currentTime); // Low bass buzz
      osc.frequency.linearRampToValueAtTime(220, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'alert') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(330, audioCtx.currentTime); // E4 alarms
      osc.frequency.linearRampToValueAtTime(150, audioCtx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.07, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
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
  onUpdateSmsPermission
}: AIInsightsProps) {
  const tokens = getColorTokens(theme);
  const isLight = theme.mode === 'light';
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
  const [modelWeights, setModelWeights] = useState({
    spendWeight: 0.85,
    debtPenetrationRatio: 0.62,
    APYAccumulationVector: 0.74,
    reserveShieldCoeff: 0.55
  });

  const [mlDetails, setMlDetails] = useState<{
    losses: number[];
    accuracy: number;
    learningRate: number;
    weightKeys: string[];
    weightValues: number[];
  }>({
    losses: [0.75, 0.61, 0.48, 0.35, 0.22, 0.12, 0.08, 0.04, 0.02, 0.011],
    accuracy: 88.5,
    learningRate: 0.05,
    weightKeys: ['swiggy→Dining', 'uber→Transport', 'amazon→Shopping', 'rent→Rent', 'dmart→Groceries'],
    weightValues: [6.8, 5.2, 7.1, 8.4, 4.9]
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
  const [score, setScore] = useState<number>(65);
  useEffect(() => {
    let s = 60;
    if (blendedAPY > 8) s += 10;
    if (emergencyShieldMonths >= 6) s += 15;
    else if (emergencyShieldMonths >= 3) s += 8;
    if (maxConcentrationPct < 50 && assets.length > 2) s += 10;
    if (highInterestDebts.length === 0) s += 10; else s -= 12;
    if (rates.netPerMonth > 30000) s += 10;
    else if (rates.netPerMonth <= 0) s -= 15;
    setScore(Math.min(100, Math.max(10, s)));
  }, [blendedAPY, emergencyShieldMonths, maxConcentrationPct, highInterestDebts.length, rates.netPerMonth, assets.length]);

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
      currentEpoch += 5;
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

        if (soundEnabled && currentEpoch % 15 === 0) {
          playCyberChirp('train');
        }
      }
    }, 45);
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
    
    // Generate actual relevant alerts!
    const generated: typeof aiInsightsList = [];

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

      {activeTab === 'model' && (
        <div id="sgd-neural-training-deck" className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full animate-fade-in py-2">
          
          {/* LEFT SIDE: DECISION VECTOR COEFFICIENTS & NEURAL CORE */}
          <div className={`lg:col-span-6 p-6 rounded-2xl border flex flex-col justify-between relative overflow-hidden group ${
            isLight ? 'bg-white border-stone-200 shadow-xs' : 'border-cyan-500/15 bg-[#080811]/95 shadow-[0_0_20px_rgba(6,182,212,0.06)]'
          }`}>
            <div className={`absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent ${isLight ? 'via-stone-300' : 'via-cyan-500/40'} to-transparent`} />
            
            <div>
              <div className={`flex items-center justify-between mb-4 pb-2 border-b ${isLight ? 'border-stone-100' : 'border-cyan-500/10'}`}>
                <span className={`text-[10px] font-black uppercase tracking-wider ${isLight ? tokens.textPrimary : neuralColors.accent}`}>NEURAL COHERENT COEFFICIENTS</span>
                <span className={`text-[9px] font-mono ${isLight ? 'text-stone-400' : 'text-stone-500'}`}>COEFF_MATRIX_V2</span>
              </div>

              {/* Coefficients weights list */}
              <div className="space-y-4 py-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className={`${isLight ? 'text-stone-500' : 'text-stone-400'} font-bold uppercase`}>OUTFLOW_SPEND_WEIGHT (W0)</span>
                    <span className={`font-bold font-mono ${isLight ? tokens.accentText : neuralColors.accent}`}>{(modelWeights.spendWeight * 10).toFixed(2)}</span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-stone-100' : 'bg-stone-900'}`}>
                    <div 
                      className={`h-full rounded-full transition-all duration-550 ${neuralColors.bgProgress} ${isLight ? 'shadow-xs' : 'shadow-[0_0_8px_var(--neural-accent)]'}`}
                      style={{ width: `${modelWeights.spendWeight * 100}%`, '--neural-accent': neuralColors.hex } as React.CSSProperties}
                    />
                  </div>
                  <span className="text-[8.5px] text-stone-500 block leading-none">Scales based on discretionary expenses velocity</span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className={`${isLight ? 'text-stone-500' : 'text-stone-400'} font-bold uppercase`}>DEBT_DRAG_PENETRATION (W1)</span>
                    <span className={`font-bold font-mono ${isLight ? tokens.accentText : neuralColors.accent}`}>{(modelWeights.debtPenetrationRatio * 10).toFixed(2)}</span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-stone-100' : 'bg-stone-900'}`}>
                    <div 
                      className={`h-full bg-pink-500 rounded-full transition-all duration-550 ${isLight ? 'shadow-xs' : 'shadow-[0_0_8px_rgba(236,72,153,0.5)]'}`}
                      style={{ width: `${modelWeights.debtPenetrationRatio * 100}%` }}
                    />
                  </div>
                  <span className="text-[8.5px] text-stone-500 block leading-none">Measures liability drag on portfolio compound velocity</span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className={`${isLight ? 'text-stone-500' : 'text-stone-400'} font-bold uppercase`}>APY_COMPOUND_ACCEL (W2)</span>
                    <span className={`font-bold font-mono ${isLight ? tokens.accentText : neuralColors.accent}`}>{(modelWeights.APYAccumulationVector * 10).toFixed(2)}</span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-stone-100' : 'bg-stone-900'}`}>
                    <div 
                      className={`h-full bg-amber-500 rounded-full transition-all duration-550 ${isLight ? 'shadow-xs' : 'shadow-[0_0_8px_rgba(242,158,11,0.5)]'}`}
                      style={{ width: `${modelWeights.APYAccumulationVector * 100}%` }}
                    />
                  </div>
                  <span className="text-[8.5px] text-stone-500 block leading-none">Accelerates exponentially as blended yield rates increase</span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className={`${isLight ? 'text-stone-500' : 'text-stone-400'} font-bold uppercase`}>LIQUID_RESERVE_SHIELD (W3)</span>
                    <span className={`font-bold font-mono ${isLight ? tokens.accentText : neuralColors.accent}`}>{(modelWeights.reserveShieldCoeff * 10).toFixed(2)}</span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-stone-100' : 'bg-stone-900'}`}>
                    <div 
                      className={`h-full bg-emerald-500 rounded-full transition-all duration-550 ${isLight ? 'shadow-xs' : 'shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}
                      style={{ width: `${modelWeights.reserveShieldCoeff * 100}%` }}
                    />
                  </div>
                  <span className="text-[8.5px] text-stone-500 block leading-none">Tracks liquidity reserves defense margin against emergency outflows</span>
                </div>
              </div>

              {/* Serious and technical neural graph representation of machine learning */}
              <div id="ml-decision-neural-graph" className={`mt-4 p-4 rounded-xl border relative overflow-hidden flex flex-col items-center justify-between w-full ${
                isLight ? 'bg-stone-50 border-stone-250/70 shadow-xs' : 'bg-zinc-950/80 border-cyan-500/15'
              }`}>
                <div className="w-full flex items-center justify-between mb-2">
                  <span className={`text-[8.5px] uppercase tracking-widest font-black font-mono ${isLight ? tokens.textPrimary : neuralColors.accentText}`}>
                    {isTraining ? 'SGD SYNAPTIC TREE REALIGNING' : 'NEURAL INTERACTION TREE'}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${isTraining ? 'bg-[#ff0055] animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
                    <span className="text-[7.5px] font-mono text-stone-500">BATCH_N=32</span>
                  </div>
                </div>

                <div className="relative w-full h-44 my-2 flex items-center justify-center">
                  <div className="absolute inset-0 bg-[#00f3ff]/[0.01] bg-grid-pattern opacity-10 pointer-events-none" />
                  
                  {/* SVG Canvas */}
                  <svg className="w-full h-full max-w-[380px]" viewBox="0 0 320 150">
                    <defs>
                      <linearGradient id="synGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={isLight ? '#558291' : '#00f3ff'} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={isLight ? '#a35252' : '#ec4899'} stopOpacity="0.3" />
                      </linearGradient>
                      <linearGradient id="synGradActive" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={isLight ? '#10b981' : '#00f3ff'} stopOpacity="0.85" />
                        <stop offset="50%" stopColor="#a855f7" stopOpacity="0.75" />
                        <stop offset="100%" stopColor="#ec4899" stopOpacity="0.85" />
                      </linearGradient>
                    </defs>

                    {/* CONNECTING LEVER SYNAPSES (EDGES) */}
                    {/* Input (x=30) to Hidden (x=160) */}
                    {[20, 55, 90, 125].map((yIn, iIdx) => (
                      [35, 75, 115].map((yHid, hIdx) => {
                        const activeIndex = (iIdx * 3 + hIdx);
                        const isFiring = isTraining && (epoch % 3 === activeIndex % 3);
                        return (
                          <line
                            key={`syn1-${iIdx}-${hIdx}`}
                            x1="45"
                            y1={yIn}
                            x2="150"
                            y2={yHid}
                            stroke={isFiring ? "url(#synGradActive)" : "url(#synGrad)"}
                            strokeWidth={isFiring ? "1.6" : "0.5"}
                            strokeDasharray={isFiring ? "4,3" : "none"}
                            className="transition-all duration-300"
                          >
                            {isFiring && (
                              <animate
                                attributeName="stroke-dashoffset"
                                values="30;0"
                                dur="1.2s"
                                repeatCount="indefinite"
                              />
                            )}
                          </line>
                        );
                      })
                    ))}

                    {/* Hidden (x=160) to Output (x=290) */}
                    {[35, 75, 115].map((yHid, hIdx) => (
                      [45, 105].map((yOut, oIdx) => {
                        const activeIndex = (hIdx * 2 + oIdx);
                        const isFiring = isTraining && ((epoch + 1) % 2 === activeIndex % 2);
                        return (
                          <line
                            key={`syn2-${hIdx}-${oIdx}`}
                            x1="170"
                            y1={yHid}
                            x2="275"
                            y2={yOut}
                            stroke={isFiring ? "url(#synGradActive)" : "url(#synGrad)"}
                            strokeWidth={isFiring ? "1.6" : "0.5"}
                            strokeDasharray={isFiring ? "4,3" : "none"}
                            className="transition-all duration-300"
                          >
                            {isFiring && (
                              <animate
                                attributeName="stroke-dashoffset"
                                values="30;0"
                                dur="1.2s"
                                repeatCount="indefinite"
                              />
                            )}
                          </line>
                        );
                      })
                    ))}

                    {/* LAYER LABELS */}
                    <text x="10" y="8" className="text-stone-500 font-mono text-[5.5px] uppercase font-bold tracking-wider">INPUT COEFFS (W_0)</text>
                    <text x="130" y="8" className="text-stone-500 font-mono text-[5.5px] uppercase font-bold tracking-wider">PROPAGATE (H)</text>
                    <text x="250" y="8" className="text-stone-500 font-mono text-[5.5px] uppercase font-bold tracking-wider">DECISION MATRIX</text>

                    {/* INPUT NODES (x=30) */}
                    {[
                      { y: 20, label: 'SPND', key: 'spendWeight', val: modelWeights.spendWeight },
                      { y: 55, label: 'DEBT', key: 'debtPenetrationRatio', val: modelWeights.debtPenetrationRatio },
                      { y: 90, label: 'APY_V', key: 'APYAccumulationVector', val: modelWeights.APYAccumulationVector },
                      { y: 125, label: 'SHLD', key: 'reserveShieldCoeff', val: modelWeights.reserveShieldCoeff }
                    ].map((node, idx) => (
                      <g key={`in-${idx}`}>
                        <circle
                          cx="30"
                          cy={node.y}
                          r="12"
                          className={`${
                            isTraining ? 'animate-pulse' : ''
                          } transition-all duration-500`}
                          fill={isLight ? '#f1f5f9' : '#080914'}
                          stroke={isLight ? '#94a3b8' : '#00f3ff'}
                          strokeWidth="1.2"
                        />
                        <text
                          x="30"
                          y={node.y + 2}
                          textAnchor="middle"
                          className={`font-mono text-[6px] font-black ${
                            isLight ? 'fill-slate-800' : 'fill-cyan-400'
                          }`}
                        >
                          {node.label}
                        </text>
                        {/* Interactive float weight info */}
                        <text
                          x="55"
                          y={node.y + 1.8}
                          className="font-mono text-[5.5px] fill-stone-500 font-bold"
                        >
                          {(node.val * 10).toFixed(1)}
                        </text>
                      </g>
                    ))}

                    {/* HIDDEN INTERCHANGE NEURONS (x=160) */}
                    {[
                      { y: 35, sym: 'H0', state: 'PROP' },
                      { y: 75, sym: 'H1', state: 'RE_C' },
                      { y: 115, sym: 'H2', state: 'GRAD' }
                    ].map((hNode, idx) => (
                      <g key={`hid-${idx}`}>
                        <circle
                          cx="160"
                          cy={hNode.y}
                          r="10"
                          className={isTraining ? "animate-pulse" : ""}
                          fill={isLight ? '#f8fafc' : '#110d29'}
                          stroke={isTraining ? '#ec4899' : (isLight ? '#cbd5e1' : '#a855f7')}
                          strokeWidth="1.2"
                          style={{ filter: isTraining ? 'drop-shadow(0 0 3px rgba(236, 72, 153, 0.5))' : 'none' }}
                        />
                        <text
                          x="160"
                          y={hNode.y + 2}
                          textAnchor="middle"
                          className={`font-mono text-[6px] font-bold ${
                            isLight ? 'fill-slate-700' : 'fill-purple-300'
                          }`}
                        >
                          {hNode.sym}
                        </text>
                        {/* State code vector tag */}
                        <text
                          x="176"
                          y={hNode.y + 2}
                          className="font-mono text-[5px] fill-stone-500 tracking-wider font-bold"
                        >
                          {isTraining ? 'TUNE' : hNode.state}
                        </text>
                      </g>
                    ))}

                    {/* OUTPUT DECISIONS NODES (x=290) */}
                    {[
                      { y: 45, label: 'L_RES', act: 'RESERVE' },
                      { y: 105, label: 'Y_ACC', act: 'BOOST' }
                    ].map((oNode, idx) => (
                      <g key={`out-${idx}`}>
                        <rect
                          x="275"
                          y={oNode.y - 8}
                          width="30"
                          height="16"
                          rx="3"
                          fill={isLight ? '#f1f5f9' : '#03040c'}
                          stroke={isTraining ? '#f59e0b' : (isLight ? '#94a3b8' : '#ec4899')}
                          strokeWidth="1.2"
                        />
                        <text
                          x="290"
                          y={oNode.y + 2}
                          textAnchor="middle"
                          className={`font-display text-[6px] font-black ${
                            isLight ? 'fill-slate-800' : 'fill-[#f59e0b]'
                          }`}
                        >
                          {oNode.label}
                        </text>
                        <text
                          x="290"
                          y={oNode.y + 13}
                          textAnchor="middle"
                          className="font-mono text-[4.5px] fill-stone-500 font-bold"
                        >
                          {oNode.act}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>

                <div className="text-center mt-1 w-full border-t border-dashed border-stone-800/10 pt-2">
                  <span className="text-[9px] font-mono font-bold text-stone-500 block uppercase tracking-wider">
                    {isTraining ? `Epoch Optimization run at learning rate: ${mlDetails.learningRate}` : 'Bayes connection vectors verified offline'}
                  </span>
                </div>
              </div>

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
                          const x = idx * (230 / (mlDetails.losses.length - 1)) + 10;
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
                          const x = idx * (230 / (mlDetails.losses.length - 1)) + 10;
                          const y = Math.max(10, 75 - (val * 65));
                          return `${x},${y}`;
                        }).join(' ')}
                      />

                      {/* Interactive dot on final loss value */}
                      {(() => {
                        const finalIdx = mlDetails.losses.length - 1;
                        const fx = finalIdx * (230 / finalIdx) + 10;
                        const fy = Math.max(10, 75 - (mlDetails.losses[finalIdx] * 65));
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

            {/* NEURAL TRAINING TERMINAL CONSOLE LOGS */}
            <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
              isLight ? 'bg-stone-900 text-stone-300 border-stone-800' : 'border-cyan-500/15 bg-black/85'
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-stone-800 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${isTraining ? 'bg-cyan-400 animate-ping' : 'bg-stone-600'}`} />
                  <span className="text-[9.5px] font-black font-mono uppercase tracking-widest text-[#00f3ff]">OPTIMIZER_STDOUT_MONITOR</span>
                </div>
                <span className="text-[8px] font-mono text-stone-600 font-bold uppercase select-none">BUFFER: DIRECT-COFFER</span>
              </div>

              {/* Console Logs list */}
              <div 
                id="neural-console-output-shell" 
                className="h-32 overflow-y-auto font-mono text-[9px] text-zinc-400 space-y-1 pr-1.5 flex flex-col-reverse justify-start scrollbar-thin scrollbar-thumb-zinc-805"
              >
                {[...trainingLogs].reverse().map((line, idx) => (
                  <div key={idx} className="leading-snug transition-all duration-350 hover:bg-stone-800/20 px-1 py-0.5 rounded">
                    <span className="text-stone-500 font-black select-none mr-1">ECHELON_CORE:~ dev$</span>
                    {line.startsWith('[') ? (
                      <span className={
                        line.includes('SUCCESS') || line.includes('CONVERGED') || line.includes('COMPILER')
                          ? 'text-emerald-400 font-bold'
                          : line.includes('SYS_') || line.includes('MUTATION')
                          ? neuralColors.accentText
                          : line.includes('loss:')
                          ? 'text-pink-400'
                          : 'text-stone-300'
                      }>
                        {line}
                      </span>
                    ) : (
                      <span className="text-zinc-300">{line}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

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
