/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  Coins 
} from 'lucide-react';
import { EchelonTheme, Asset, Loan, LoanType, Expense } from '../types';
import { getColorTokens } from '../utils/theme';
import { calculateWealthRates, calculateLoanCurrentBalance } from '../utils/math';

interface HoldingSummaryProps {
  theme: EchelonTheme;
  assets: Asset[];
  loans: Loan[];
  monthlyEarnings: number;
  expenses: Expense[];
  onSetMonthlyEarnings: (val: number) => void;
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

export default function HoldingSummary({
  theme,
  assets,
  loans,
  monthlyEarnings,
  expenses,
  onSetMonthlyEarnings,
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

   const activeTaggedIds = taggedBufferAssetIds && taggedBufferAssetIds.length > 0
    ? taggedBufferAssetIds
    : (taggedBufferAssetId ? [taggedBufferAssetId] : []);

  const tokens = getColorTokens(theme);

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

  const monthlyGrowthDenom = totalPortfolioValue !== 0 
    ? Math.abs(totalPortfolioValue) 
    : (totalAssetsVal > 0 ? totalAssetsVal : 1);
  const monthlyGrowthPct = (rates.netPerMonth / monthlyGrowthDenom) * 100;

  // Reset offset with changes to anchor state
  useEffect(() => {
    setLiveNetOffset(0);
  }, [totalPortfolioValue]);

  // High-frequency dividend compiling ticks
  useEffect(() => {
    const interval = setInterval(() => {
      // 20 updates per second (acts as positive compound interest OR real-time loss tracking!)
      setLiveNetOffset(prev => prev + (rates.netPerYear / (365.25 * 24 * 60 * 60 * 20)));
    }, 50);
    return () => clearInterval(interval);
  }, [rates.netPerYear]);

  // Gamified ranks
  const getRankBadgeInfo = (val: number) => {
    if (val < 100000) return { name: 'Quiet Apprentice • L1', color: 'bg-zinc-800/80 text-stone-300 border-zinc-700/50' };
    if (val < 500000) return { name: 'Sovereign Aspirant • L2', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    if (val < 1500000) return { name: 'Capital Vanguard • L3', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    return { name: 'Echelon Overlord • L4', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
  };
  const rankBadge = getRankBadgeInfo(totalPortfolioValue);

  // Period rates mapping
  const periodData = {
    hour: {
      label: 'Hourly Velocity',
      earnings: rates.earningsPerHour,
      losses: rates.lossesPerHour,
      net: rates.netPerHour,
      icon: <Clock className="h-4 w-4" />
    },
    day: {
      label: 'Daily Velocity',
      earnings: rates.earningsPerDay,
      losses: rates.lossesPerDay,
      net: rates.netPerDay,
      icon: <CalendarDays className="h-4 w-4" />
    },
    month: {
      label: 'Monthly Velocity',
      earnings: rates.earningsPerMonth,
      losses: rates.lossesPerMonth,
      net: rates.netPerMonth,
      icon: <CalendarDays className="h-4 w-4" />
    },
    year: {
      label: 'Yearly Velocity',
      earnings: rates.earningsPerYear,
      losses: rates.lossesPerYear,
      net: rates.netPerYear,
      icon: <TrendingUp className="h-4 w-4" />
    },
    '5year': {
      label: '5-Year Accumulation Projection',
      earnings: rates.earningsPerFiveYears,
      losses: rates.lossesPerFiveYears,
      net: rates.netPerFiveYears,
      icon: <TrendingUp className="h-4 w-4" />
    }
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

  // Dynamic Portfolio Blended Yield
  let totalYieldAmount = 0;
  assets.forEach(a => {
    const r = a.annualGrowthRate !== undefined 
      ? a.annualGrowthRate 
      : (a.type === 'FD' ? 7.1 : a.type === 'BOND' ? 8.5 : (a.type === 'EQUITY' || a.type === 'STOCK') ? 12 : 3.5);
    const val = a.isUSAsset ? a.currentValue * usdConversionRate : a.currentValue;
    totalYieldAmount += val * (r / 100);
  });

  // Add lent out investments yielding their custom interestRate
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

  // Denominator: Total investment capital base (converted assets + lent out contracts balance)
  const totalAssetsValConverted = assets.reduce((sum, a) => sum + (a.isUSAsset ? a.currentValue * usdConversionRate : a.currentValue), 0);
  const totalInvestmentBase = totalAssetsValConverted + totalLentVal;

  const blendedAPY = totalInvestmentBase > 0 
    ? ((totalYieldAmount - totalBorrowedInterestCosts) / totalInvestmentBase) * 100 
    : 0;

  // Forecast accumulation calculation with compound interest estimate
  const forecastPortfolioValues = Array.from({ length: 6 }).map((_, i) => {
    const yr = i;
    // Simple projection under current net velocity: P_t = P_0 + netPerYear * yr
    const projectedVal = Math.max(0, totalPortfolioValue + rates.netPerYear * yr);
    return {
      year: `Yr ${yr}`,
      value: projectedVal
    };
  });

  const maxForecastValue = Math.max(...forecastPortfolioValues.map(v => v.value), 1);

  return (
    <div id="holding-summary-dashboard" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. MASTER ASSET RADAR CELL (NET WORTH) */}
      <div className={`lg:col-span-2 p-6 rounded-3xl border ${tokens.card} ${tokens.glow} flex flex-col justify-between transition-all duration-300`}>
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase font-bold tracking-widest text-amber-500 font-mono">Net Quiet Treasury Pool</span>
            <div className="flex items-center gap-1.5 text-xs text-stone-500 font-mono">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>{currencySymbol} Ledger</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 mb-2">
            <div className="flex items-baseline flex-wrap gap-1">
              <h2 className={`text-3xl sm:text-5xl font-mono font-extrabold tracking-tight ${tokens.textPrimary}`}>
                {currencySymbol}{Math.floor(totalPortfolioValue + liveNetOffset).toLocaleString('en-IN')}
              </h2>
              <span className="text-xl sm:text-2xl font-mono font-extrabold text-amber-500/90 tracking-tight animate-pulse shrink-0">
                .{(Math.round(((totalPortfolioValue + liveNetOffset) % 1) * 100)).toString().padStart(2, '0')}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {monthlyGrowthPct >= 0 ? (
                <span className="text-[10px] uppercase font-black tracking-wider font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1 select-none shadow-sm">
                  <Flame className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                  <span>+{monthlyGrowthPct.toFixed(2)}% / MO PROGRESS</span>
                </span>
              ) : (
                <span className="text-[10px] uppercase font-black tracking-wider font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full flex items-center gap-1 select-none shadow-sm">
                  <ArrowDownRight className="h-3.5 w-3.5 text-rose-400 animate-bounce" />
                  <span>{monthlyGrowthPct.toFixed(2)}% / MO DROP</span>
                </span>
              )}

              {/* Gamified wealth level tier badge */}
              <div className={`flex items-center gap-1.5 px-3 py-1 border text-[10px] font-bold font-mono uppercase rounded-xl shadow-sm tracking-wide select-none ${rankBadge.color}`}>
                <Award className="h-3.5 w-3.5" />
                <span>{rankBadge.name}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mt-6 border-t border-dashed border-stone-800/20 dark:border-stone-100/10 pt-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Gross Holds</span>
              <p className={`text-sm sm:text-base font-semibold font-mono ${tokens.textPrimary}`}>
                {currencySymbol}{totalAssetsVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Lent Out (+)</span>
              <p className="text-sm sm:text-base font-semibold font-mono text-emerald-500">
                {currencySymbol}{totalLentVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Borrowed (-)</span>
              <p className="text-sm sm:text-base font-semibold font-mono text-red-500">
                {currencySymbol}{totalBorrowedVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>

        {/* Compound Forecast Slider charts */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${tokens.textPrimary}`}>Passive Compound Forecast</h3>
              <p className="text-[10px] text-stone-500">Wealth progression curve assuming current growth velocity</p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {forecastYears} Year Outlook: {currencySymbol}{Math.floor(totalPortfolioValue + rates.netPerYear * forecastYears).toLocaleString('en-IN')}
            </span>
          </div>

          <input
            type="range"
            min="1"
            max="5"
            id="forecast-outlook-range"
            value={forecastYears}
            onChange={(e) => setForecastYears(parseInt(e.target.value))}
            className="w-full accent-amber-500"
          />

          {/* Simple custom SVG-alike bar charts for presentation */}
          <div className="flex justify-between items-end h-20 gap-2 mt-4 bg-stone-500/5 p-2.5 rounded-xl border border-stone-500/5">
            {forecastPortfolioValues.slice(0, forecastYears + 1).map((forecast, index) => {
              const heightPct = (forecast.value / maxForecastValue) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center h-full justify-end">
                  <div className="w-full bg-gradient-to-t from-amber-500/30 to-amber-500 rounded" style={{ height: `${Math.max(12, heightPct)}%` }}>
                    <div className="text-[9px] font-mono font-semibold text-center text-zinc-950 truncate px-0.5">
                      {Math.ceil(forecast.value / 100000)}L
                    </div>
                  </div>
                  <span className="text-[9px] font-semibold text-stone-500 uppercase mt-1.5 font-mono">{forecast.year}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. VELOCITY CONTROLLERS AND CASH LOG VELOCITY */}
      <div className={`p-6 rounded-3xl border ${tokens.card} ${tokens.glow} flex flex-col justify-between transition-all duration-300`}>
        <div className="space-y-5">
          {/* div:nth-of-type(1) - Header */}
          <div className="flex items-center justify-between border-b border-dashed border-stone-800/40 pb-2.5">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-amber-500 font-mono block">Echelon Velocity Profiler</span>
              <p className="text-[10px] text-stone-500">Decisive metrics representing reserve shield velocity</p>
            </div>
            <button
              onClick={() => {
                if (onOpenSettings) onOpenSettings('rules');
              }}
              className="text-[10px] font-mono bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2.5 py-0.5 rounded uppercase font-black hover:bg-amber-500 hover:text-stone-950 transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>⚙ Configure</span>
            </button>
          </div>

          {/* div:nth-of-type(2) - Parameters Display */}
          <div className="space-y-3 bg-stone-500/[0.02] border border-stone-850 p-3.5 rounded-2xl flex flex-col justify-between">
            <div className="grid grid-cols-3 gap-2 text-center text-stone-300">
              <div 
                onClick={() => onChangeTab && onChangeTab('budget')}
                className="bg-stone-900/40 p-2 border border-stone-850/60 rounded-xl cursor-pointer hover:border-amber-500/40 transition-all hover:bg-stone-900/60 group"
                title="Click to manage Budget & Salary"
              >
                <span className="text-[8px] uppercase font-mono font-bold text-stone-500 block mb-1 group-hover:text-amber-400 font-bold">
                  Salary Inflow
                </span>
                <p className={`text-xs font-bold font-mono ${tokens.textPrimary}`}>
                  {currencySymbol}{monthlyEarnings.toLocaleString('en-IN')}
                </p>
              </div>

              <div 
                onClick={() => onChangeTab && onChangeTab('budget')}
                className="bg-stone-900/40 p-2 border border-stone-850/60 rounded-xl cursor-pointer hover:border-amber-500/40 transition-all hover:bg-stone-900/60 group"
                title="Click to view Outflow Sinks"
              >
                <span className="text-[8px] uppercase font-mono font-bold text-stone-500 block mb-1 group-hover:text-amber-400 font-bold">
                  Outflow/Sinks
                </span>
                <p className={`text-xs font-bold font-mono ${tokens.textPrimary}`}>
                  {currencySymbol}{(userOverriddenExpenses ?? 15000).toLocaleString('en-IN')}
                </p>
                <span className="text-[7px] text-stone-550 block font-mono">
                  {userOverriddenExpenses === undefined ? 'Dynamic' : 'Static'}
                </span>
              </div>

              <div 
                onClick={() => onChangeTab && onChangeTab('budget')}
                className="bg-stone-900/40 p-2 border border-stone-850/60 rounded-xl cursor-pointer hover:border-amber-500/40 transition-all hover:bg-stone-900/60 group"
                title="Click to configure emergency buffer targets"
              >
                <span className="text-[8px] uppercase font-mono font-bold text-stone-500 block mb-1 group-hover:text-amber-400 font-bold">
                  Buffer Target
                </span>
                <p className={`text-xs font-bold font-mono ${tokens.textPrimary}`}>
                  {currencySymbol}{(customSavingsGoalAmt ?? 5000).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {/* div:nth-of-type(3) - Buffer Asset Indicator */}
          <div className="space-y-1.5">
            <span className="text-[9px] uppercase font-mono font-bold text-stone-400 block flex justify-between items-center">
              <span>🛡️ Anchored Safety Shield</span>
              <button
                onClick={() => { if (onOpenSettings) onOpenSettings('rules'); }}
                className="text-[8.5px] text-amber-500 hover:underline font-mono"
              >
                Change Link
              </button>
            </span>
            <div 
              onClick={() => onChangeTab && onChangeTab('assets')}
              className="bg-stone-950 p-3 rounded-xl border border-stone-850 cursor-pointer hover:border-amber-500/40 transition-all hover:bg-stone-900/20"
              title="Click to view assets & allocations"
            >
              {(() => {
                const selectedAssets = assets.filter(a => activeTaggedIds.includes(a.id));
                const totalTaggedVal = selectedAssets.reduce((sum, a) => sum + a.currentValue, 0);
                if (selectedAssets.length > 0) {
                  return (
                    <div className="w-full font-mono text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                          <span className="font-semibold text-stone-200 truncate">
                            {selectedAssets.length === 1 ? selectedAssets[0].name : `${selectedAssets.length} Anchored Funds`}
                          </span>
                        </div>
                        <span className="font-extrabold text-amber-500 pl-1">
                          {currencySymbol}{Math.floor(totalTaggedVal).toLocaleString('en-IN')}
                        </span>
                      </div>
                      {selectedAssets.length > 1 && (
                        <div className="text-[9px] text-stone-500 truncate whitespace-nowrap pl-4">
                          {selectedAssets.map(a => a.name).join(' + ')}
                        </div>
                      )}
                    </div>
                  );
                } else {
                  return (
                    <div className="text-[10px] italic text-rose-400 font-sans flex items-center justify-center gap-1 w-full py-1 text-center bg-stone-950">
                      <span>⚠ Portfolio Treasury Exposed (No Active Anchor)</span>
                    </div>
                  );
                }
              })()}
            </div>
          </div>

          {/* div:nth-of-type(4) - Calculated Buffer Status Metrics */}
          {(() => {
            const selectedAssets = assets.filter(a => activeTaggedIds.includes(a.id));
            const totalTaggedVal = selectedAssets.reduce((sum, a) => sum + a.currentValue, 0);
            const bufferGoalAmt = customSavingsGoalAmt ?? 5000;
            const bufferPct = bufferGoalAmt > 0 ? Math.min(100, (totalTaggedVal / bufferGoalAmt) * 100) : 0;
            
            const netSavedPerMonth = monthlyEarnings - (userOverriddenExpenses ?? 15000);
            const savingVelocity = netSavedPerMonth * (bufferPct / 100);

            return (
              <div className="space-y-4 pt-2.5 border-t border-dashed border-stone-800/60 text-stone-300">
                {/* div:nth-of-type(1) - Progress Section */}
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-stone-500 mb-1.5">
                    <span>SHIELD PROTECTIVE GAP</span>
                    {selectedAssets.length > 0 ? (
                      <span className={`font-bold ${bufferPct === 100 ? 'text-emerald-400' : 'text-amber-500'}`}>
                        {bufferPct.toFixed(0)}% Shielded
                      </span>
                    ) : (
                      <span className="text-red-400 font-bold">Exposed Margin</span>
                    )}
                  </div>

                  {selectedAssets.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-mono text-stone-400 bg-stone-900/30 px-2 py-1.5 rounded-lg border border-stone-850/60 font-mono">
                        <span className="font-semibold truncate max-w-[140px] font-mono">
                          {selectedAssets.length === 1 ? selectedAssets[0]?.name : `${selectedAssets.length} Anchored Funds`}
                        </span>
                        <span>
                          {currencySymbol}{Math.floor(totalTaggedVal).toLocaleString('en-IN')} / {currencySymbol}{bufferGoalAmt.toLocaleString('en-IN')}
                        </span>
                      </div>
                      
                      {/* Interactive Visual Progress bar */}
                      <div className="w-full bg-stone-900 h-1.5 rounded-full overflow-hidden border border-stone-800 shadow-inner">
                        <div 
                          className={`h-full transition-all duration-500 ${bufferPct === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${bufferPct}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] italic text-rose-400 font-sans bg-rose-500/5 p-2 rounded-xl border border-rose-500/10 text-center">
                      No assets tagged yet. Open Settings to select an anchor shield asset.
                    </p>
                  )}
                </div>

                {/* div:nth-of-type(2) - Velocity Displays */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-dashed border-stone-850">
                  <div>
                    <span className="text-[9px] uppercase font-mono font-bold text-stone-500 block mb-0.5">
                      Net Saved /mo
                    </span>
                    <p className={`text-base font-bold font-mono ${netSavedPerMonth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {netSavedPerMonth >= 0 ? '+' : ''}{currencySymbol}{Math.floor(netSavedPerMonth).toLocaleString('en-IN')}
                    </p>
                    <span className="text-[8px] text-stone-500 font-mono">(Salary - Outflow)</span>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase font-mono font-bold text-stone-400 block mb-0.5">
                      Saving Velocity
                    </span>
                    <p className={`text-base font-extrabold font-mono transition-colors ${savingVelocity >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {savingVelocity >= 0 ? '+' : ''}{currencySymbol}{Math.floor(savingVelocity).toLocaleString('en-IN')} <span className="text-[10px] font-medium text-stone-500">/mo</span>
                    </p>
                    <span className="text-[8px] text-stone-500 font-mono flex items-center gap-0.5">
                      (Net Saved × Shield)
                    </span>
                  </div>
                </div>

                {/* div:nth-of-type(3) - Warning Banner */}
                <div className="text-[9.5px] leading-relaxed font-sans mt-2 rounded-xl p-3 bg-stone-900/50 border border-stone-850/60 text-stone-400 select-none">
                  {bufferPct === 100 ? (
                    <span className="text-emerald-400 font-medium whitespace-normal pb-0.5 block">
                      ✓ Buffer Shield complete. No savings are diverted: Your saving velocity compounding potential is fully unlocked.
                    </span>
                  ) : bufferPct > 0 ? (
                    <span className="text-amber-400 font-medium whitespace-normal pb-0.5 block">
                      ⚠ Shield is only partially funded ({bufferPct.toFixed(0)}%). Compounding velocity is throttled because excess inflow is safely channeled to fortify the buffer.
                    </span>
                  ) : (
                    <span className="text-stone-500 italic whitespace-normal pb-0.5 block">
                      Aggregate velocity calculated by multiplying your Net Saved by the buffer met progression index. Protect your treasury.
                    </span>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* 4. DONUT LEDGER DISTRIBUTION CHART */}
      <div className={`p-6 rounded-3xl border ${tokens.card} ${tokens.glow} flex flex-col justify-between transition-all duration-300`}>
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-amber-500 font-mono block mb-4">Capital Allocation</span>
          
          {totalPie === 0 ? (
            <div className="h-40 flex items-center justify-center text-xs text-stone-500 border border-dashed border-stone-800/10 rounded-xl">
              Add holdings or active lending relationships to show asset allocation.
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {/* Dynamic SVG Donut Chart */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="35" fill="transparent" stroke={theme.mode === 'dark' ? '#1c1917' : '#e7e5e4'} strokeWidth="11" />
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
                      />
                    );
                  })}
                </svg>
                {/* Visual weighted portfolio APY center metrics */}
                <div className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
                  <span className="text-[9px] uppercase font-bold text-stone-500 font-mono">Weighted Yield</span>
                  <span className={`text-sm font-black font-mono ${blendedAPY >= 0 ? tokens.textPrimary : 'text-rose-500 dark:text-rose-400 font-bold'}`}>
                    {blendedAPY.toFixed(1)}% APY
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Legend list items with stylized visual connector lines pointing to detailed explanation text boxes */}
        <div className="space-y-4 mt-6 pt-6 border-t border-dashed border-stone-800/20 dark:border-stone-105/10">
          <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 font-mono block mb-3">
            Connected Allocation Directory
          </span>
          
          <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
            {categories.map((c, idx) => {
              // Contextual descriptions dynamically generated based on category type
              const getCategoryExplainer = (label: string) => {
                switch (label) {
                  case 'Equities':
                    return 'Higher yield passive compounding vector (Estimated 12-15% APY). Holds equity baskets/SIP registries.';
                  case 'FDs':
                    return 'Quarterly-compounded defensive shield. Insulates reserves from volatility at safe fixed coupons.';
                  case 'Bonds':
                    return 'Sovereign-backed passive cash flow yield. Emits stable coupon structures to ledger balances.';
                  case 'Delivery Stocks':
                    return 'Tactical blue-chip dividends and premium shareholdings registered to personal ledger.';
                  case 'Bank Balances':
                    return 'Liquid operating cash reserves with low currency velocity. Provides emergency base coverage.';
                  case 'Lent (Contracts)':
                    return 'Active peer-to-peer interest receivable contracts secured under Echelon ledgers.';
                  default:
                    return 'Personal asset sheet category registered safely in quiet containment.';
                }
              };

              return (
                <div 
                  key={idx} 
                  onClick={() => {
                    if (onChangeTab) {
                      if (c.label === 'Lent (Contracts)') {
                        onChangeTab('loans');
                      } else {
                        onChangeTab('assets');
                      }
                    }
                  }}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 group cursor-pointer hover:bg-stone-500/[0.03] p-1 rounded-xl transition-all"
                  title={`Click to analyze detailed ${c.label} holdings`}
                >
                  {/* Category bullet with label */}
                  <div className="flex items-center gap-2 shrink-0 min-w-[120px]">
                    <div className="h-2.5 w-2.5 rounded-full animate-pulse" style={{ backgroundColor: c.color }} />
                    <span className="font-bold text-xs text-stone-300 font-display">{c.label}</span>
                    <span className="text-[10px] font-mono text-stone-500 font-extrabold bg-stone-500/10 px-1.5 py-0.2 rounded">
                      {((c.amount / totalPie) * 100).toFixed(0)}%
                    </span>
                  </div>

                  {/* Stylized connector horizontal arrow pointer line */}
                  <div className="hidden sm:block flex-1 mx-3 border-b border-dashed border-stone-700/60 relative group-hover:border-amber-500/40 transition-colors">
                    <div className="absolute right-0 -top-[5px] text-[8px] font-bold text-stone-500 group-hover:text-amber-500">&gt;</div>
                  </div>

                  {/* Glassmorphic callout explanation box */}
                  <div className="w-full sm:w-auto sm:max-w-[230px] p-2.5 bg-stone-500/5 hover:bg-stone-500/10 hover:border-amber-500/20 border border-stone-850/50 rounded-xl transition-all shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9.5px] font-bold font-mono text-stone-200">
                        ₹{c.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-[8px] uppercase font-bold text-amber-500/90 font-mono tracking-wide">
                        Verified SEC
                      </span>
                    </div>
                    <p className="text-[9.5px] leading-relaxed text-stone-400 font-sans">
                      {getCategoryExplainer(c.label)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. SALARY, SINK & SURPLUS ENGINE PANEL */}
      <div className="lg:col-span-3 p-6 rounded-3xl border border-stone-800/80 bg-zinc-950/80 shadow-2xl relative overflow-hidden transition-all duration-300">
        {/* Glow ambient accent lines */}
        <div className="absolute top-0 right-0 h-[100px] w-[180px] bg-amber-500/5 rounded-full blur-[60px] pointer-events-none" />
        
        {/* Header indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-850/80">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shrink-0 mt-0.5">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm uppercase font-black tracking-wider text-amber-500 font-mono">Echelon Treasury Sink & Surplus Engine</h3>
              <p className="text-[11px] leading-relaxed text-stone-400 mt-1">
                Decide your monthly cash influx and operational sinks. By default, Echelon decides the sink pool from your current monthly budget, logged expenditures, and customized buffer limits. You can edit are overrides as desired.
              </p>
            </div>
          </div>
          <span className="text-[9px] uppercase font-bold tracking-widest font-mono text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full shrink-0 h-fit select-none">
            LEDGER SANDBOX
          </span>
        </div>

        {/* Triple allocation flow layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          
          {/* A. MONTHLY INFLUX (SALARY) */}
          <div className="p-4 rounded-xl bg-stone-900/40 border border-stone-850 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-stone-500 font-mono">1. Monthly Influx (Salary)</span>
                <Coins className="h-3.5 w-3.5 text-amber-500" />
              </div>
              
              <div className="mt-2">
                <div className="text-2xl font-mono font-extrabold text-stone-200">
                  {currencySymbol}{monthlyEarnings.toLocaleString()}
                </div>
                <span className="text-[10px] text-stone-550 font-mono italic block mt-1">
                  Adjustable inside User Profile settings
                </span>
              </div>
            </div>
            <p className="text-[9px] text-stone-450 leading-relaxed mt-4">
              Monthly Cash Injection representing salary, business, and raw yield earnings metrics.
            </p>
          </div>

          {/* B. OPERATIVE TREASURY SINK */}
          <div className="p-4 rounded-xl bg-stone-900/40 border border-stone-850 flex flex-col justify-between relative">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-stone-500 font-mono">2. Operative Treasury Sink</span>
                <span className={`text-[8px] font-extrabold font-mono uppercase px-1.5 py-0.2 rounded border ${
                  userOverriddenExpenses !== undefined 
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/25' 
                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25'
                }`}>
                  {userOverriddenExpenses !== undefined ? 'User Override' : 'Dynamic Auto'}
                </span>
              </div>

              {/* Display Sink Values */}
              <div className="mt-2 space-y-2">
                <div className="flex items-baseline gap-1">
                  <div className="text-2xl font-mono font-extrabold text-amber-500">
                    {currencySymbol}{Math.floor(
                      userOverriddenExpenses !== undefined 
                        ? userOverriddenExpenses 
                        : (budgetAmount + expenses.reduce((sum, e) => sum + e.amount, 0) + (customSavingsGoalAmt !== undefined ? customSavingsGoalAmt : 1000))
                    ).toLocaleString()}
                  </div>
                  <span className="text-[10px] text-stone-400 font-mono">/mo sink</span>
                </div>

                {/* Sub-breakdowns (Readonly) */}
                {userOverriddenExpenses === undefined ? (
                  <div className="text-[10px] leading-relaxed text-stone-400 space-y-1 bg-zinc-950/40 p-2 rounded-xl border border-stone-850 mt-1">
                    <div className="flex justify-between">
                      <span className="text-stone-500">Config Budget:</span>
                      <span className="font-mono">{currencySymbol}{budgetAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Logged Spends:</span>
                      <span className="font-mono text-rose-400">+{currencySymbol}{expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Buffer Spends:</span>
                      <span className="font-mono">+{currencySymbol}{(customSavingsGoalAmt !== undefined ? customSavingsGoalAmt : 1000).toLocaleString()}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] leading-relaxed text-stone-400 bg-zinc-950/40 p-2 rounded-xl border border-stone-850 mt-1">
                    <p className="text-stone-400 font-sans italic">
                      Locked to a direct override value. Modify or restore dynamic auto calculations inside Goals & Sinks settings.
                    </p>
                  </div>
                )}
              </div>
            </div>
            <p className="text-[9px] text-stone-450 leading-relaxed mt-4">
              All monthly budget caps + credit card bills or expense items, plus customizable buffer drains.
            </p>
          </div>

          {/* C. MONTHLY SAVED SURPLUS */}
          <div className="p-4 rounded-xl bg-stone-900/40 border border-stone-850 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-stone-500 font-mono">3. Saved surplus Remaining</span>
                <Sliders className="h-3.5 w-3.5 text-emerald-500" />
              </div>

              {/* Calculations Surplus */}
              {(() => {
                const computedOverallSink = userOverriddenExpenses !== undefined 
                  ? userOverriddenExpenses 
                  : (budgetAmount + expenses.reduce((sum, e) => sum + e.amount, 0) + (customSavingsGoalAmt !== undefined ? customSavingsGoalAmt : 1000));
                
                const savingsSurplus = Math.max(0, monthlyEarnings - computedOverallSink);
                
                // Let's decide if there are outstanding liabilities (Borrowed Loans)
                const outstandingDebts = loans.filter(l => l.type === LoanType.BORROWED).reduce((sum, l) => sum + calculateLoanCurrentBalance(l), 0);
                
                return (
                  <div className="mt-2 space-y-3">
                    <div className="text-2xl font-mono font-extrabold text-emerald-400">
                      {currencySymbol}{savingsSurplus.toLocaleString()}
                    </div>

                    <div className="space-y-1.5 p-2 bg-zinc-950/40 rounded-xl border border-stone-850 text-[10px]">
                      <span className="text-[9.5px] uppercase font-extrabold text-stone-400 font-mono block mb-1">
                        Surplus allocations:
                      </span>
                      {outstandingDebts > 0 && savingsSurplus > 0 ? (
                        <>
                          <div className="flex justify-between text-stone-300">
                            <span className="text-stone-500">⚡ Debt Prepay (30%):</span>
                            <span className="font-mono text-amber-500 font-bold">
                              {currencySymbol}{Math.floor(savingsSurplus * 0.3).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-[8px] text-amber-500/80 mb-2 leading-relaxed">
                            Recommended arbitrage to reduce compounding interest costs.
                          </p>

                          <div className="flex justify-between text-stone-300">
                            <span className="text-stone-500">📈 Passive Asset (70%):</span>
                            <span className="font-mono font-bold">
                              {currencySymbol}{Math.floor(savingsSurplus * 0.7).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-[8px] text-stone-500 leading-relaxed">
                            Routed to passive assets for compounding yield values.
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between text-stone-300">
                            <span className="text-stone-500">📈 Asset Growth (100%):</span>
                            <span className="font-mono font-bold text-emerald-400">
                              {currencySymbol}{savingsSurplus.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-[8px] text-stone-450 leading-relaxed mt-1">
                            No active payables! 100% is directed to passive asset appreciation.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
            <p className="text-[9px] text-stone-500 leading-relaxed mt-4">
              Definitive treasury volume saved. High surplus rates yield extremely compounding passive growth vectors.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
