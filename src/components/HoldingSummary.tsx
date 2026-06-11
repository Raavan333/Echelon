import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  CalendarDays, 
  Percent, 
  ShieldCheck, 
  Flame, 
  Award, 
  Landmark, 
  HelpCircle, 
  Edit3, 
  Check, 
  X, 
  RefreshCw, 
  Sliders, 
  Coins,
  Shield,
  MessageSquare,
  Zap,
  Cpu
} from 'lucide-react';
import { EchelonTheme, Asset, Loan, LoanType, Expense } from '../types';
import { getColorTokens, isThemeLight } from '../utils/theme';
import { calculateWealthRates, calculateLoanCurrentBalance } from '../utils/math';

interface HoldingSummaryProps {
  theme: EchelonTheme;
  assets: Asset[];
  loans: Loan[];
  monthlyEarnings: number;
  expenses: Expense[];
  onSetMonthlyEarnings: (val: number) => void;
  onAddExpense?: (expense: Omit<Expense, 'id'>) => void; // Prop for SMS Auto-Logging
  currencySymbol?: string;
  customSavingsGoalAmt?: number;
  userOverriddenExpenses?: number;
  onUpdateUserOverriddenExpenses?: (val: number | undefined) => void;
  onUpdateCustomSavingsGoalAmt?: (val: number) => void;
  onOpenSettings?: (tab?: string) => any;
  budgetAmount?: number;
  taggedBufferAssetId?: string;
  onUpdateTaggedBufferAsset?: (id: string) => void;
  taggedBufferAssetIds?: string[];
  onUpdateTaggedBufferAssets?: (ids: string[]) => void;
  onChangeTab?: (tab: 'portfolio' | 'assets' | 'loans' | 'budget' | 'ai') => void;
  usdConversionRate?: number;
}

type PeriodType = 'hour' | 'day' | 'month' | 'year' | '5year';

// Semicircular compact speedometer dial gauges for APYs
function SpeedometerDial({ 
  rate, 
  title, 
  amount, 
  yearlyImpact, 
  colorTheme, 
  maxRate = 25,
  theme
}: { 
  rate: number; 
  title: string; 
  amount: string; 
  yearlyImpact: string; 
  colorTheme: 'cyan' | 'pink' | 'amber';
  maxRate?: number;
  theme: EchelonTheme;
}) {
  // Map rate to rotation degrees (range from -90 to +90 degrees)
  const clampedRate = Math.min(maxRate, Math.max(0, rate));
  const angle = (clampedRate / maxRate) * 180 - 180; // Angle from -180 to 0 degrees for semidial

  const isLight = isThemeLight(theme);

  const colorConfig = {
    cyan: { 
      line: isLight ? '#0f766e' : '#00f3ff', 
      glow: isLight ? 'rgba(15, 118, 110, 0.15)' : 'rgba(0, 243, 255, 0.4)', 
      text: isLight ? 'text-teal-700' : 'text-[#00f3ff]', 
      badge: isLight ? 'bg-teal-50 border-teal-200 text-teal-800' : 'bg-cyan-500/10 border-cyan-500/20' 
    },
    pink: { 
      line: '#ec4899', 
      glow: 'rgba(236, 72, 153, 0.4)', 
      text: isLight ? 'text-pink-700' : 'text-pink-500', 
      badge: isLight ? 'bg-pink-50 border-pink-200 text-pink-800' : 'bg-pink-500/10 border-pink-500/20' 
    },
    amber: { 
      line: '#f59e0b', 
      glow: 'rgba(245, 158, 11, 0.4)', 
      text: isLight ? 'text-amber-800' : 'text-amber-500', 
      badge: isLight ? 'bg-amber-50 border-amber-250 text-amber-900 font-bold' : 'bg-amber-500/10 border-amber-500/20' 
    }
  }[colorTheme];

  const tokens = getColorTokens(theme);

  return (
    <div className={`flex-1 min-w-0 p-2 sm:p-3 rounded-2xl flex flex-col justify-between items-center group/card relative overflow-hidden transition-all duration-300 border ${
      isLight 
        ? 'bg-stone-50 border-stone-200/80 hover:shadow-xs' 
        : 'bg-zinc-950/70 border-cyan-500/10 hover:border-cyan-500/30'
    }`}>
      {/* Visual neon corner markings */}
      <div className={`absolute top-0 left-0 w-1 h-1 border-t border-l ${isLight ? 'border-stone-300' : 'border-cyan-500/40'}`} />
      <div className="absolute bottom-0 right-0 w-1 p-1" />

      <span className="text-[7.5px] sm:text-[9.5px] uppercase font-bold text-stone-400 font-mono tracking-wider text-center truncate max-w-full">{title}</span>

      {/* Semicircular gauge illustration */}
      <div className="relative w-16 h-9 mt-1 sm:w-24 sm:h-14 sm:mt-2 flex justify-center items-end overflow-hidden">
        <svg className="w-14 h-7 sm:w-20 sm:h-10" viewBox="0 0 100 50">
          <path d="M10,50 A40,40 0 0,1 90,50" fill="none" stroke="#27272a" strokeWidth="6" strokeLinecap="round" />
          <path 
            d="M10,50 A40,40 0 0,1 90,50" 
            fill="none" 
            stroke={colorConfig.line} 
            strokeWidth="6" 
            strokeDasharray="126" 
            strokeDashoffset={126 - (clampedRate / maxRate) * 126}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${colorConfig.glow})` }}
          />
      {/* 2. Semicircle needle */}
      <line 
        x1="50" 
        y1="50" 
        x2="50" 
        y2="15" 
        stroke={isLight ? "#334155" : "#ffffff"} 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        transform={`rotate(${angle + 90}, 50, 50)`}
        style={{ transformOrigin: '50% 50%' }}
      />
      <circle cx="50" cy="50" r="4.5" fill={isLight ? "#334155" : "#ffffff"} />
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center leading-none">
          <span className={`text-[9px] sm:text-[11.5px] font-mono font-black ${colorConfig.text}`}>
            {rate.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className={`w-full mt-1.5 pt-1.5 border-t ${isLight ? 'border-stone-200' : 'border-stone-900/60'} flex flex-col items-center`}>
        <div className={`text-[9px] sm:text-[11.5px] font-mono font-black ${isLight ? 'text-stone-850' : 'text-white'} truncate max-w-full`}>{amount}</div>
        <span className={`text-[7px] sm:text-[8px] font-mono font-bold uppercase ${colorConfig.text} mt-0.5 whitespace-nowrap`}>
          {yearlyImpact}
        </span>
      </div>
    </div>
  );
}

export default function HoldingSummary({
  theme,
  assets,
  loans,
  monthlyEarnings,
  expenses,
  onSetMonthlyEarnings,
  onAddExpense,
  currencySymbol = '₹',
  customSavingsGoalAmt,
  userOverriddenExpenses,
  onUpdateUserOverriddenExpenses,
  onUpdateCustomSavingsGoalAmt,
  onOpenSettings,
  budgetAmount = 0,
  taggedBufferAssetId,
  onUpdateTaggedBufferAsset,
  taggedBufferAssetIds = [],
  onUpdateTaggedBufferAssets,
  onChangeTab,
  usdConversionRate = 83.5,
}: HoldingSummaryProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month');
  const [forecastYears, setForecastYears] = useState<number>(3);
  const [liveNetOffset, setLiveNetOffset] = useState<number>(0);

  const [modelTrained, setModelTrained] = useState(false);
  const [modelAccuracy, setModelAccuracy] = useState(88.5);
  const [modelLoss, setModelLoss] = useState(0.012);

  useEffect(() => {
    const loadModelParams = () => {
      try {
        const storedAccuracy = localStorage.getItem('echelon_model_accuracy');
        const storedLoss = localStorage.getItem('echelon_model_loss');
        if (storedAccuracy) {
          setModelAccuracy(parseFloat(storedAccuracy));
          setModelTrained(true);
        }
        if (storedLoss) {
          setModelLoss(parseFloat(storedLoss));
        }
      } catch (_) {}
    };

    loadModelParams();

    const handleModelUpdate = () => {
      loadModelParams();
    };

    window.addEventListener('echelon_model_update', handleModelUpdate);
    return () => {
      window.removeEventListener('echelon_model_update', handleModelUpdate);
    };
  }, []);

   const activeTaggedIds = taggedBufferAssetIds && taggedBufferAssetIds.length > 0
    ? taggedBufferAssetIds
    : (taggedBufferAssetId ? [taggedBufferAssetId] : []);

  const tokens = getColorTokens(theme);
  const isLight = isThemeLight(theme);

  // Totals calculations
  const totalAssetsVal = assets.reduce((sum, a) => sum + (a.isUSAsset ? a.currentValue * usdConversionRate : a.currentValue), 0);
  const totalLentVal = loans
    .filter(l => l.type === LoanType.LENT)
    .reduce((sum, l) => sum + calculateLoanCurrentBalance(l), 0);
  const totalBorrowedVal = loans
    .filter(l => l.type === LoanType.BORROWED)
    .reduce((sum, l) => sum + calculateLoanCurrentBalance(l), 0);
  
  const totalPortfolioValue = totalAssetsVal + totalLentVal - totalBorrowedVal;

  const rates = calculateWealthRates(
    assets,
    loans,
    monthlyEarnings,
    expenses,
    totalPortfolioValue,
    userOverriddenExpenses,
    customSavingsGoalAmt,
    budgetAmount
  );

  // Return rate of only assets (excl lent loans)
  let onlyAssetsYieldAmount = 0;
  assets.forEach(a => {
    const r = a.annualGrowthRate !== undefined 
      ? a.annualGrowthRate 
      : (a.type === 'FD' ? 7.1 : a.type === 'BOND' ? 8.5 : (a.type === 'EQUITY' || a.type === 'STOCK') ? 12 : 3.5);
    const val = a.isUSAsset ? a.currentValue * usdConversionRate : a.currentValue;
    onlyAssetsYieldAmount += val * (r / 100);
  });
  const assetsOnlyAPY = totalAssetsVal > 0 
    ? (onlyAssetsYieldAmount / totalAssetsVal) * 100 
    : 0;

  // Return rate of lent loans
  let lentLoansYieldAmount = 0;
  loans.forEach(loan => {
    if (loan.type === LoanType.LENT) {
      const balance = calculateLoanCurrentBalance(loan);
      lentLoansYieldAmount += balance * (loan.interestRate / 100);
    }
  });
  const lentRate = totalLentVal > 0 
    ? (lentLoansYieldAmount / totalLentVal) * 100 
    : 0;

  // Return rate of debts (borrowed)
  let totalBorrowedInterestCosts = 0;
  loans.forEach(loan => {
    if (loan.type === LoanType.BORROWED) {
      const balance = calculateLoanCurrentBalance(loan);
      totalBorrowedInterestCosts += balance * (loan.interestRate / 100);
    }
  });
  const borrowedRate = totalBorrowedVal > 0 
    ? (totalBorrowedInterestCosts / totalBorrowedVal) * 100 
    : 0;

  // Total investment returns (from holdings + lent)
  const totalYieldAmount = onlyAssetsYieldAmount + lentLoansYieldAmount;
  const netYieldAmount = totalYieldAmount - totalBorrowedInterestCosts;

  // Use the larger of investment base or borrowed liabilities to scale the blended rate correctly when loaded with debt
  const totalAssetsValConverted = totalAssetsVal;
  const totalInvestmentBase = totalAssetsValConverted + totalLentVal;
  const totalActiveCapitalDenominator = Math.max(totalInvestmentBase, totalBorrowedVal);
  const blendedAPY = totalActiveCapitalDenominator > 0 
    ? (netYieldAmount / totalActiveCapitalDenominator) * 100 
    : 0;

  // Monthly growth percentage reflects the compounding APY divided by 12, perfectly aligned with net compound velocity
  const monthlyGrowthPct = blendedAPY / 12;

  // Reset offset with changes to anchor state
  useEffect(() => {
    setLiveNetOffset(0);
  }, [totalPortfolioValue]);

  // High-frequency compounding ticks - ticks by net passive compounding returns (yield minus borrowing interests cost)
  useEffect(() => {
    const interval = setInterval(() => {
      // 20 updates per second (acts as positive compound interest OR real-time loss tracking!)
      setLiveNetOffset(prev => prev + (netYieldAmount / (365.25 * 24 * 60 * 60 * 20)));
    }, 50);
    return () => clearInterval(interval);
  }, [netYieldAmount]);  // Gamified ranks with comprehensive financial + ML package validation
  const getRankBadgeInfo = (val: number) => {
    const totalAnnualEarnings = (Number(monthlyEarnings || 0) * 12) + onlyAssetsYieldAmount + lentLoansYieldAmount;
    
    // 1. Assets Portfolio Scaling (max 20 points)
    const assetPoints = Math.min(20, Math.max(0, val > 0 ? Math.log10(val) * 3.3 : 0));

    // 2. Liquid Protection / Reserve shield coverage (max 20 points)
    const liquidCash = assets
      .filter(a => a.type === 'BANK_BALANCE' || a.type === 'FD')
      .reduce((sum, a) => sum + (a.isUSAsset ? a.currentValue * usdConversionRate : a.currentValue), 0);
    const recentSpends_30d = expenses.reduce((sum, e) => sum + e.amount, 0) || 15000;
    const emergencyShieldMonths = recentSpends_30d > 0 ? liquidCash / recentSpends_30d : 0;
    const liquidityPoints = Math.min(20, Math.max(0, Math.min(1.0, emergencyShieldMonths / 6) * 20));

    // 3. Debt Burden Squeeze Immunity (max 20 points)
    const debtRatio = val > 0 ? totalBorrowedVal / val : totalBorrowedVal > 0 ? 1 : 0;
    const debtSqueezePoints = Math.min(20, Math.max(0, (1.0 - Math.min(1.0, debtRatio)) * 20));

    // 4. Compound APY vs Macro Inflation (max 20 points)
    const inflationPoints = Math.min(20, Math.max(0, Math.min(2.5, blendedAPY / 6.0) * 8));

    // 5. Neural Classifier Backprop Validation (max 20 points)
    let mlPoints = 8; // Baseline Bayesian default weights prior
    if (modelTrained) {
      const accuracyScore = (modelAccuracy / 100) * 15; // Max 15 points
      const lossScore = (1.0 - Math.min(1.0, modelLoss)) * 5; // Max 5 points
      mlPoints = Math.min(20, accuracyScore + lossScore);
    }

    const packageScore = assetPoints + liquidityPoints + debtSqueezePoints + inflationPoints + mlPoints;
    const finalScoreIndex = Math.min(100, Math.max(1, Math.round(packageScore)));

    const earnsZero = Number(monthlyEarnings || 0) <= 0.01 && 
                      val <= 0.01 && 
                      onlyAssetsYieldAmount <= 0.01 && 
                      lentLoansYieldAmount <= 0.01;

    if (earnsZero || (val <= 0.01 && totalAnnualEarnings <= 0.01)) {
      return { 
        name: 'Unfunded Sovereign • L0', 
        color: 'bg-rose-500/10 text-rose-500 border-rose-500/30' + (isLight ? ' text-rose-700 bg-rose-50 border-rose-200' : ''),
        desc: 'Assets & Earning velocity are absolute zero. Net growth is in severe inflation exposure.',
        score: finalScoreIndex,
        breakdown: 'A:0% | L:0% | D:0% | I:0% | ML:0%'
      };
    }

    const breakdownText = `A:${assetPoints.toFixed(0)}/20 | L:${liquidityPoints.toFixed(0)}/20 | D:${debtSqueezePoints.toFixed(0)}/20 | I:${inflationPoints.toFixed(0)}/20 | ML:${mlPoints.toFixed(0)}/20`;

    if (finalScoreIndex < 35) {
      return { 
        name: 'Quiet Apprentice • L1', 
        color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' + (isLight ? ' text-blue-900 bg-blue-50 border-blue-200' : ''),
        desc: 'Portfolio under baseline configuration. Accumulating dynamic assets and initializing Bayesian classification nodes.',
        score: finalScoreIndex,
        breakdown: breakdownText
      };
    }
    if (finalScoreIndex < 60) {
      return { 
        name: 'Capital Vanguard • L2', 
        color: 'bg-[#14b8a6]/10 text-teal-400 border-[#14b8a6]/25' + (isLight ? ' text-teal-800 bg-teal-50 border-teal-200' : ''),
        desc: 'Stable asset base with resilient liquid reserves. Comfortably outpacing baseline macroeconomic inflation drag.',
        score: finalScoreIndex,
        breakdown: breakdownText
      };
    }
    if (finalScoreIndex < 85) {
      return { 
        name: 'Echelon Commander • L3', 
        color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' + (isLight ? ' text-emerald-800 bg-emerald-50 border-emerald-250 font-bold' : ''),
        desc: 'Outstanding passive compounding velocity matched with highly calibrated neural backprop classification.',
        score: finalScoreIndex,
        breakdown: breakdownText
      };
    }
    return { 
      name: 'Sovereign Archon • L4', 
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' + (isLight ? ' text-amber-800 bg-amber-50 border-amber-250 font-black' : ''),
      desc: 'Climax of financial harmony. Maximized reserve shields, absolute debt decoupling speed, and high precision ML optimization converges.',
      score: finalScoreIndex,
      breakdown: breakdownText
    };
  };
  const rankBadge = getRankBadgeInfo(totalPortfolioValue);

  // Period rates mapping
  const periodData = {
    hour: { label: 'Hourly Velocity', earnings: rates.earningsPerHour, losses: rates.lossesPerHour, net: rates.netPerHour, icon: <Clock className="h-4 w-4" /> },
    day: { label: 'Daily Velocity', earnings: rates.earningsPerDay, losses: rates.lossesPerDay, net: rates.netPerDay, icon: <CalendarDays className="h-4 w-4" /> },
    month: { label: 'Monthly Velocity', earnings: rates.earningsPerMonth, losses: rates.lossesPerMonth, net: rates.netPerMonth, icon: <CalendarDays className="h-4 w-4" /> },
    year: { label: 'Yearly Velocity', earnings: rates.earningsPerYear, losses: rates.lossesPerYear, net: rates.netPerYear, icon: <TrendingUp className="h-4 w-4" /> },
    '5year': { label: '5-Year Accumulation Projection', earnings: rates.earningsPerFiveYears, losses: rates.lossesPerFiveYears, net: rates.netPerFiveYears, icon: <TrendingUp className="h-4 w-4" /> }
  };

  const activePeriod = periodData[selectedPeriod];

  // Distribution chart parameters
  const categories = [
    { label: 'Equities', amount: assets.filter(a => a.type === 'EQUITY').reduce((sum, a) => sum + (a.isUSAsset ? a.currentValue * usdConversionRate : a.currentValue), 0), color: '#3b82f6' },
    { label: 'FDs', amount: assets.filter(a => a.type === 'FD').reduce((sum, a) => sum + (a.isUSAsset ? a.currentValue * usdConversionRate : a.currentValue), 0), color: '#10b981' },
    { label: 'Bonds', amount: assets.filter(a => a.type === 'BOND').reduce((sum, a) => sum + (a.isUSAsset ? a.currentValue * usdConversionRate : a.currentValue), 0), color: '#8b5cf6' },
    { label: 'Delivery Stocks', amount: assets.filter(a => a.type === 'STOCK').reduce((sum, a) => sum + (a.isUSAsset ? a.currentValue * usdConversionRate : a.currentValue), 0), color: '#f59e0b' },
    { label: 'Bank Balances', amount: assets.filter(a => a.type === 'BANK_BALANCE').reduce((sum, a) => sum + (a.isUSAsset ? a.currentValue * usdConversionRate : a.currentValue), 0), color: '#06b6d4' },
    { label: 'Lent (Contracts)', amount: totalLentVal, color: '#ec4899' },
  ].filter(c => c.amount > 0);

  const totalPie = categories.reduce((sum, c) => sum + c.amount, 0);

  // Forecast accumulation calculation with separate compounding
  const forecastPortfolioValues = Array.from({ length: 6 }).map((_, i) => {
    const yr = i;
    const projectedAssets = totalAssetsVal * Math.pow(1 + assetsOnlyAPY / 100, yr);
    const projectedLent = totalLentVal * Math.pow(1 + lentRate / 100, yr);
    const projectedDebts = totalBorrowedVal * Math.pow(1 + borrowedRate / 100, yr);
    const projectedVal = (projectedAssets + projectedLent) - projectedDebts;
    return {
      year: `Yr ${yr}`,
      value: projectedVal,
      assets: projectedAssets,
      lent: projectedLent,
      debts: projectedDebts,
    };
  });

  const maxForecastValue = Math.max(
    ...forecastPortfolioValues.map(v => Math.max(Math.abs(v.value), v.assets, v.lent, v.debts)),
    1
  );

  // Quick sandbox SMS auto-logger state
  const [dashboardSmsAlert, setDashboardSmsAlert] = useState<{
    text: string;
    amount: number;
    source: string;
    category: string;
  } | null>(null);

  const triggerDashboardMockSms = () => {
    setDashboardSmsAlert({
      text: 'SBI alert: Your debit card was charged ₹1,800.00 at DMart Groceries.',
      amount: 1800,
      source: 'SBI Bank Balance',
      category: 'Groceries'
    });
  };

  const handleDashboardAddSmsExpense = () => {
    if (!dashboardSmsAlert) return;
    if (onAddExpense) {
      onAddExpense({
        category: dashboardSmsAlert.category,
        amount: dashboardSmsAlert.amount,
        date: new Date().toISOString(),
        notes: `Confirmed portfolio SMS transaction: ${dashboardSmsAlert.source}`
      });
      setDashboardSmsAlert(null);
      alert(`[SYNC SUCCESS]: ₹${dashboardSmsAlert.amount} committed successfully as ${dashboardSmsAlert.category}!`);
    } else {
      // Fallback
      setDashboardSmsAlert(null);
    }
  };

  return (
    <div id="holding-summary-dashboard" className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
      
      {/* 1. MASTER ASSET RADAR CELL (NET WORTH) */}
      <div className={`lg:col-span-2 p-6 rounded-3xl border flex flex-col justify-between transition-all duration-300 relative ${
        isLight ? 'bg-white border-stone-200 shadow-xs' : 'border-cyan-500/25 bg-[#080811]/95 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
      }`}>
        {/* Neon decorative scan overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
        <div className={`absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-${isLight ? 'stone-300' : '[#00f3ff]'} to-transparent animate-pulse`} />

        <div>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs uppercase font-black tracking-widest ${isLight ? tokens.textPrimary : 'text-[#00f3ff]'}`}>NET COOPERATIVE TREASURY LEDGER</span>
            <div className="flex items-center gap-1 text-[11px] text-stone-400 font-mono">
              <ShieldCheck className={`h-4 w-4 ${isLight ? tokens.textPrimary : 'text-[#00f3ff]'}`} />
              <span>SEC_LOG_VERIFIED</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 mb-2">
            <div className="flex items-baseline flex-wrap gap-1">
              <h2 className={`text-4xl sm:text-5xl font-mono font-extrabold tracking-tight ${isLight ? tokens.textPrimary : 'text-white drop-shadow-[0_0_8px_rgba(0,243,255,0.4)]'}`}>
                {currencySymbol}{Math.floor(totalPortfolioValue + liveNetOffset).toLocaleString('en-IN')}
              </h2>
              <span className={`text-xl sm:text-2xl font-mono font-extrabold tracking-tight animate-pulse shrink-0 ${isLight ? tokens.textPrimary : 'text-cyan-400'}`}>
                .{(Math.round(((totalPortfolioValue + liveNetOffset) % 1) * 100)).toString().padStart(2, '0')}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[11px] font-black font-mono px-2 py-0.5 rounded-lg select-none border ${
                  blendedAPY >= 0 
                    ? 'text-emerald-450 bg-emerald-500/10 border-emerald-500/20' 
                    : 'text-pink-500 bg-pink-500/10 border-pink-500/20'
                }`}>
                  {blendedAPY >= 0 ? '+' : ''}{blendedAPY.toFixed(2)}%/ YR
                </span>

                {/* Gamified wealth level tier badge */}
                <div className={`flex items-center gap-1.5 px-3 py-1 border text-[10px] font-bold font-mono uppercase rounded-lg shadow-sm tracking-wide select-none ${rankBadge.color}`} title={rankBadge.desc}>
                  <Award className="h-3.5 w-3.5" />
                  <span>{rankBadge.name}</span>
                </div>
              </div>

              {/* Package validation score indicators */}
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <span className={`text-[9.2px] font-mono px-2 py-0.5 rounded-md select-none border flex items-center gap-1 ${
                  isLight ? 'bg-stone-50/80 text-stone-600 border-stone-250/70' : 'bg-black/35 text-stone-300 border-cyan-500/10'
                }`} title="Calculated from comprehensive multi-variable financial indices and ML classifier backprop precision alignment.">
                  <Cpu className="h-2.5 w-2.5 text-cyan-500 animate-pulse" />
                  COHERENCE FIT: <span className="font-extrabold text-[#00f3ff]">{rankBadge.score}%</span>
                </span>
                <span className="text-[8.5px] font-mono text-stone-500 uppercase tracking-tight">
                  ({rankBadge.breakdown})
                </span>
              </div>

              <p className={`text-[9.5px] leading-relaxed font-mono ${isLight ? 'text-stone-600' : 'text-stone-400 opacity-80'}`}>
                🛡️ <span className="font-extrabold uppercase tracking-wide">Cognitive Directive:</span> {rankBadge.desc}
              </p>
            </div>
          </div>
          
          {/* COMPACT SPEEDOMETER VELOCITY INDICATORS (REPLACES CASUAL GRID BOXES) */}
          <div className="mt-6 border-t border-cyan-500/10 pt-4">
            <span className="text-[9px] uppercase font-bold text-stone-500 tracking-widest block mb-4">
              CURRENT ASSET CLASS PERFORMANCE & DRAG APY MATRIX
            </span>
            
            <div className="grid grid-cols-3 gap-2.5 w-full">
              <SpeedometerDial 
                rate={assetsOnlyAPY} 
                title="ASSETS" 
                amount={`${currencySymbol}${totalAssetsVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                yearlyImpact={`+${currencySymbol}${Math.floor(onlyAssetsYieldAmount).toLocaleString('en-IN')}/yr`}
                colorTheme="cyan"
                theme={theme}
              />

              <SpeedometerDial 
                rate={lentRate} 
                title="LENT" 
                amount={`${currencySymbol}${totalLentVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                yearlyImpact={`+${currencySymbol}${Math.floor(lentLoansYieldAmount).toLocaleString('en-IN')}/yr`}
                colorTheme="cyan"
                theme={theme}
              />

              <SpeedometerDial 
                rate={borrowedRate} 
                title="DEBT" 
                amount={`${currencySymbol}${totalBorrowedVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                yearlyImpact={`-${currencySymbol}${Math.floor(totalBorrowedInterestCosts).toLocaleString('en-IN')}/yr`}
                colorTheme="pink"
                maxRate={35}
                theme={theme}
              />
            </div>
          </div>
        </div>

        {/* 2. COMPOUND CHANNELS SLIDESHOW WITH RETRO MAIN-GRID STYLING */}
        <div className={`mt-8 pt-4 border-t ${isLight ? 'border-stone-250/60' : 'border-cyan-500/10'}`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className={`text-xs font-black uppercase ${isLight ? tokens.textPrimary : 'text-[#00f3ff]'} tracking-wider`}>COOPERATIVE TREASURY ACCUMULATION PROJECTION</h3>
              <p className="text-[9.5px] text-stone-500">Compounded projection channels across model constraints</p>
            </div>
            
            <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded border transition-all ${
              forecastPortfolioValues[forecastYears].value >= 0 
                ? 'text-cyan-400 bg-cyan-950/20 border-cyan-500/30' 
                : 'text-pink-500 bg-pink-950/20 border-pink-500/30'
            }`}>
              {forecastYears}y : {forecastPortfolioValues[forecastYears].value < 0 ? '-' : ''}{currencySymbol}{Math.floor(Math.abs(forecastPortfolioValues[forecastYears].value)).toLocaleString('en-IN')}
            </span>
          </div>

          <input
            type="range"
            min="1"
            max="5"
            id="forecast-outlook-range"
            value={forecastYears}
            onChange={(e) => setForecastYears(parseInt(e.target.value))}
            className="w-full accent-cyan-500 h-1.5 bg-zinc-900 rounded-full appearance-none cursor-pointer"
          />

          <div className="flex items-center gap-4 mt-3 text-[9px] font-mono">
            <span className="flex items-center gap-1.5 text-stone-400">
              <span className="h-2 w-2 rounded bg-cyan-400 shrink-0 shadow-[0_0_4px_rgba(0,243,255,0.4)]" />
              Assets ({assetsOnlyAPY.toFixed(1)}%)
            </span>
            <span className="flex items-center gap-1.5 text-stone-400">
              <span className="h-2 w-2 rounded bg-cyan-500 shrink-0" />
              Lent ({lentRate.toFixed(1)}%)
            </span>
            <span className="flex items-center gap-1.5 text-stone-400">
              <span className="h-2 w-2 rounded bg-pink-500 shrink-0 shadow-[0_0_4px_rgba(236,72,153,0.4)]" />
              Debt Drag ({borrowedRate.toFixed(1)}%)
            </span>
          </div>

          {/* PROFESSIONAL VECTOR DEEP-GRAD MATRIX CHART */}
          <div className={`flex justify-between items-end h-36 gap-2.5 mt-3 p-4 rounded-2xl border relative overflow-hidden transition-all duration-300 ${isLight ? 'bg-stone-50 border-stone-200' : 'bg-zinc-950/80 border-cyan-500/10'}`}>
            {/* Visual background blueprint grid lines */}
            <div className={`absolute inset-0 bg-blue-lines ${isLight ? 'opacity-[0.04]' : 'opacity-10'} pointer-events-none`} />

            {forecastPortfolioValues.slice(0, forecastYears + 1).map((forecast, index) => {
              return (
                <div key={index} className="flex-1 flex flex-col items-center h-full justify-end z-10">
                  <div className="flex items-end justify-center gap-1.5 w-full h-[75%] relative mb-1.5 px-0.5">
                    
                    {/* Assets Solid Bar */}
                    <div className={`flex-1 h-full flex flex-col justify-end rounded-t-sm overflow-hidden ${isLight ? 'bg-stone-200/50' : 'bg-stone-900/30'}`}>
                      <div 
                        className="w-full bg-gradient-to-t from-cyan-650/40 via-cyan-500 to-[#00f3ff] rounded-t-sm transition-all duration-500 shadow-[0_0_8px_rgba(0,243,255,0.3)]"
                        style={{ height: `${Math.max(2, (forecast.assets / maxForecastValue) * 100)}%` }}
                      />
                    </div>

                    {/* Lent Solid Bar */}
                    <div className={`flex-1 h-full flex flex-col justify-end rounded-t-sm overflow-hidden ${isLight ? 'bg-stone-200/50' : 'bg-stone-900/30'}`}>
                      <div 
                        className="w-full bg-gradient-to-t from-blue-700/40 via-blue-500 to-[#3b82f6] rounded-t-sm transition-all duration-500 shadow-[0_0_6px_rgba(59,130,246,0.2)]"
                        style={{ height: `${Math.max(2, (forecast.lent / maxForecastValue) * 100)}%` }}
                      />
                    </div>

                    {/* Debts Solid Bar */}
                    <div className={`flex-1 h-full flex flex-col justify-end rounded-t-sm overflow-hidden ${isLight ? 'bg-stone-200/50' : 'bg-stone-900/30'}`}>
                      <div 
                        className="w-full bg-gradient-to-t from-pink-700/40 via-[#ec4899] to-[#fc49a9] rounded-t-sm transition-all duration-500 shadow-[0_0_8px_rgba(236,72,153,0.3)]"
                        style={{ height: `${Math.max(2, (forecast.debts / maxForecastValue) * 100)}%` }}
                      />
                    </div>

                  </div>
                  
                  <span className="text-[8.5px] font-mono text-zinc-400 font-extrabold tracking-tighter truncate max-w-full">
                    {forecast.value < 0 ? '-' : ''}{currencySymbol}{(Math.abs(forecast.value) / 100000).toFixed(1)}L
                  </span>
                  <span className="text-[8.5px] font-mono text-stone-400 font-bold mt-1">
                    {index === 0 ? 'Current' : `Year ${index}`}
                  </span>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* 3. DONUT DISTRIBUTION & DIRECTORY ALLOCATIONS */}
      <div className={`p-6 rounded-3xl border flex flex-col justify-between transition-all duration-300 relative ${
        isLight ? 'bg-white border-stone-200 shadow-xs' : 'border-cyan-500/25 bg-[#080811]/95 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
      }`}>
        <div className={`absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-${isLight ? 'stone-300' : '[#00f3ff]'} to-transparent animate-pulse`} />

        <div>
          <span className={`text-xs uppercase font-black tracking-widest ${isLight ? tokens.textPrimary : 'text-[#00f3ff]'} font-mono block mb-4`}>CAPITAL PIE MATRIX</span>
          
          {totalPie === 0 ? (
            <div className={`h-40 flex items-center justify-center text-[10px] text-stone-500 border border-dashed rounded-xl ${isLight ? 'bg-stone-50 border-stone-200' : 'bg-black border-stone-850'}`}>
              Zero allocation channels detected. Instantiate holdings inside Assets ledger.
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {/* Dynamic SVG Donut Chart */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="35" fill="transparent" stroke={isLight ? '#f1f5f9' : '#090a12'} strokeWidth="11" />
                  {categories.map((c, idx) => {
                    // Accumulate percentage angles for donut slices
                    const prevAmountSum = categories.slice(0, idx).reduce((sum, item) => sum + item.amount, 0);
                    const startPercent = prevAmountSum / totalPie;
                    const percent = c.amount / totalPie;
                    
                    const circumference = 2 * Math.PI * 35;
                    const strokeDasharray = `${percent * circumference} ${circumference}`;
                    const strokeDashoffset = -startPercent * circumference;
                    
                    return (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r="35"
                        fill="transparent"
                        stroke={c.color}
                        strokeWidth="11"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-500"
                        style={{ filter: `drop-shadow(0 0 2px ${c.color}44)` }}
                      />
                    );
                  })}
                </svg>
                {/* Visual weighted portfolio APY center metrics */}
                <div className="absolute inset-0 flex flex-col items-center justify-center leading-tight text-center px-2">
                  <span className="text-[9px] uppercase font-black text-stone-500 font-mono">Assets APY</span>
                  <span className={`text-xs font-black font-mono ${isLight ? tokens.accentText : 'text-[#00f3ff] drop-shadow-[0_0_4px_rgba(0,243,255,0.4)]'}`}>
                    {assetsOnlyAPY.toFixed(1)}% APY
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Directory directory with cyber accents */}
        <div className="space-y-4 mt-6 pt-6 border-t border-cyan-500/10">
          <span className="text-[9px] uppercase font-bold tracking-widest text-stone-500 font-mono block">
            [CONNECTED MATRIX BLOCKS]
          </span>
          
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {categories.map((c, idx) => {
              const getCategoryExplainer = (label: string) => {
                switch (label) {
                  case 'Equities': return 'High compounded assets (Standard 12%-14% yield). High-frequency equities.';
                  case 'FDs': return 'Sovereign-backed coffer. High safety fixed-income structures.';
                  case 'Bonds': return 'Stable yield coupon emitters, emitting cash straight into portfolio.';
                  case 'Delivery Stocks': return 'Premium blue-chip holdings and dividend matrices registered.';
                  case 'Bank Balances': return 'High liquidity coffer reserves at immediate availability.';
                  case 'Lent (Contracts)': return 'Direct active loan receivables. Interest compounds regularly.';
                  default: return 'Private asset allocation sector managed securely client-side.';
                }
              };

              return (
                <div 
                  key={idx} 
                  onClick={() => {
                    if (onChangeTab) {
                      if (c.label === 'Lent (Contracts)') onChangeTab('loans');
                      else onChangeTab('assets');
                    }
                  }}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 group cursor-pointer hover:bg-cyan-500/[0.03] p-1.5 rounded-lg transition-all border border-transparent hover:border-cyan-500/10"
                >
                  <div className="flex items-center gap-2 shrink-0 min-w-[120px]">
                    <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: c.color }} />
                    <span className={`font-bold text-xs font-display ${isLight ? 'text-stone-800' : 'text-stone-300'}`}>{c.label}</span>
                    <span className={`text-[9px] font-mono font-bold px-1 py-0.2 rounded ${isLight ? 'text-teal-700 bg-teal-50 border border-teal-200/50' : 'text-cyan-400 bg-cyan-500/10'}`}>
                      {((c.amount / totalPie) * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="hidden sm:block flex-1 mx-2.5 border-b border-dashed border-stone-850 relative group-hover:border-cyan-500/30 transition-colors">
                    <div className="absolute right-0 -top-[5.5px] text-[8px] font-bold text-stone-600 group-hover:text-cyan-400">&gt;</div>
                  </div>

                  <div className={`w-full sm:w-auto sm:max-w-[180px] p-2 rounded-lg transition-all border ${
                    isLight ? 'bg-stone-50 border-stone-200 group-hover:border-teal-500/30' : 'bg-stone-900 border-stone-800 group-hover:border-cyan-500/20'
                  }`}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-[9.5px] font-bold font-mono ${isLight ? 'text-stone-850 font-black' : 'text-white'}`}>
                        {currencySymbol}{c.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <p className="text-[9px] leading-relaxed text-stone-400 font-sans">
                      {getCategoryExplainer(c.label)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
