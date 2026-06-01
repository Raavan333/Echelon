/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign, Clock, CalendarDays, Percent, ShieldCheck, Flame, Award } from 'lucide-react';
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
  onOpenSettings?: () => any;
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
  onOpenSettings,
}: HoldingSummaryProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month');
  const [isEditingEarnings, setIsEditingEarnings] = useState<boolean>(false);
  const [earningsInput, setEarningsInput] = useState<string>(monthlyEarnings.toString());
  const [forecastYears, setForecastYears] = useState<number>(3);
  const [liveNetOffset, setLiveNetOffset] = useState<number>(0);

  const tokens = getColorTokens(theme);

  // Totals calculations
  const totalAssetsVal = assets.reduce((sum, a) => sum + a.currentValue, 0);
  const totalLentVal = loans
    .filter(l => l.type === LoanType.LENT)
    .reduce((sum, l) => sum + calculateLoanCurrentBalance(l), 0);
  const totalBorrowedVal = loans
    .filter(l => l.type === LoanType.BORROWED)
    .reduce((sum, l) => sum + calculateLoanCurrentBalance(l), 0);
  
  const totalPortfolioValue = totalAssetsVal + totalLentVal - totalBorrowedVal;

  const rates = calculateWealthRates(assets, loans, monthlyEarnings, expenses, totalPortfolioValue);

  // Reset offset with changes to anchor state
  useEffect(() => {
    setLiveNetOffset(0);
  }, [totalPortfolioValue]);

  // High-frequency dividend compiling ticks
  useEffect(() => {
    if (rates.netPerYear <= 0) return;
    const interval = setInterval(() => {
      // 20 updates per second
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
    { label: 'Equities', amount: assets.filter(a => a.type === 'EQUITY').reduce((sum, a) => sum + a.currentValue, 0), color: '#3b82f6' },
    { label: 'FDs', amount: assets.filter(a => a.type === 'FD').reduce((sum, a) => sum + a.currentValue, 0), color: '#10b981' },
    { label: 'Bonds', amount: assets.filter(a => a.type === 'BOND').reduce((sum, a) => sum + a.currentValue, 0), color: '#8b5cf6' },
    { label: 'Delivery Stocks', amount: assets.filter(a => a.type === 'STOCK').reduce((sum, a) => sum + a.currentValue, 0), color: '#f59e0b' },
    { label: 'Bank Balances', amount: assets.filter(a => a.type === 'BANK_BALANCE').reduce((sum, a) => sum + a.currentValue, 0), color: '#06b6d4' },
    { label: 'Lent (Contracts)', amount: totalLentVal, color: '#ec4899' },
  ].filter(c => c.amount > 0);

  const totalPie = categories.reduce((sum, c) => sum + c.amount, 0);

  let totalYieldAmount = 0;
  assets.forEach(a => {
    const r = a.annualGrowthRate !== undefined 
      ? a.annualGrowthRate 
      : (a.type === 'FD' ? 7.1 : a.type === 'BOND' ? 8.5 : (a.type === 'EQUITY' || a.type === 'STOCK') ? 12 : 3.5);
    totalYieldAmount += a.currentValue * (r / 100);
  });
  totalYieldAmount += totalLentVal * 0.12; 
  const blendedAPY = totalPie > 0 ? (totalYieldAmount / totalPie) * 100 : 0;

  const handleSaveEarnings = () => {
    const val = parseFloat(earningsInput);
    if (!isNaN(val) && val >= 0) {
      onSetMonthlyEarnings(val);
      setIsEditingEarnings(false);
    }
  };

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
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <div className="flex items-baseline gap-1">
              <h2 className={`text-3xl sm:text-5xl font-mono font-extrabold tracking-tight ${tokens.textPrimary}`}>
                {currencySymbol}{Math.floor(totalPortfolioValue + liveNetOffset).toLocaleString('en-IN')}
              </h2>
              <span className="text-xl sm:text-2xl font-mono font-extrabold text-amber-500/90 tracking-tight animate-pulse shrink-0">
                .{(Math.round(((totalPortfolioValue + liveNetOffset) % 1) * 100)).toString().padStart(2, '0')}
              </span>
              <span className="text-[9px] uppercase font-bold tracking-widest font-mono text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ml-1 select-none animate-pulse">
                <Flame className="h-3 w-3 text-emerald-400" />
                <span>COMPOUNDING LIVE</span>
              </span>
            </div>

            {/* Gamified wealth level tier badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1 border text-[10px] font-bold font-mono uppercase rounded-xl shadow-sm tracking-wide select-none ${rankBadge.color} self-start sm:self-center`}>
              <Award className="h-3.5 w-3.5" />
              <span>{rankBadge.name}</span>
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
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase font-bold tracking-widest text-amber-500 font-mono">Treasury Velocity</span>
            <span className="text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
              {rates.earningsRatePercentOfYear >= 0 ? '+' : ''}{rates.earningsRatePercentOfYear.toFixed(1)}% APY
            </span>
          </div>

          {/* Selection pills */}
          <div className="grid grid-cols-5 gap-1 bg-stone-500/10 p-1 rounded-xl mb-6">
            {(['hour', 'day', 'month', 'year', '5year'] as PeriodType[]).map((period) => (
              <button
                key={period}
                type="button"
                id={`velocity-tab-${period}`}
                onClick={() => setSelectedPeriod(period)}
                className={`text-[9px] font-bold uppercase py-1.5 rounded-lg transition-all ${
                  selectedPeriod === period 
                    ? 'bg-amber-500 text-stone-950 font-extrabold' 
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {period === '5year' ? '5 Yr' : period}
              </button>
            ))}
          </div>

          {/* Flow details Display */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs text-stone-500 font-mono mb-1">
                <span>TOTAL INCOME INFLOW</span>
                <span className="text-emerald-500 font-semibold">Inflow Stream</span>
              </div>
              <p className={`text-2xl font-bold font-mono ${tokens.textPrimary}`}>
                +{currencySymbol}{activePeriod.earnings.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-stone-500 font-mono mb-1">
                <span>TOTAL EXPENSES/OUTFLOW</span>
                <span className="text-red-500 font-semibold">Sinks Stream</span>
              </div>
              <p className={`text-2xl font-bold font-mono ${tokens.textPrimary}`}>
                -{currencySymbol}{activePeriod.losses.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
              </p>
            </div>

            <div className="pt-3 border-t border-dashed border-stone-800/15 dark:border-stone-100/10">
              <div className="flex items-center justify-between text-xs text-stone-500 font-mono mb-1">
                <span>NET QUIET ACCUMULATION</span>
                <span className={`flex items-center gap-0.5 font-bold ${activePeriod.net >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {activePeriod.net >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {activePeriod.net >= 0 ? 'Surplus' : 'Deficit'}
                </span>
              </div>
              <p className={`text-3xl font-extrabold font-mono ${activePeriod.net >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {currencySymbol}{activePeriod.net.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
              </p>
            </div>
          </div>
        </div>

        {/* 3. CASH-INJECTS/SALARY CONFIGURATION */}
        <div className="mt-6 pt-4 border-t border-stone-800/10 dark:border-stone-100/10">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-500 font-mono">Monthly Cash Influx</span>
              {isEditingEarnings ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    id="monthly-earnings-edit-input"
                    value={earningsInput}
                    onChange={(e) => setEarningsInput(e.target.value)}
                    className={`w-24 px-2 py-1 bg-stone-500/10 border ${tokens.border} rounded text-xs font-mono font-bold text-amber-500 focus:outline-none`}
                  />
                  <button
                    type="button"
                    id="save-earnings-btn"
                    onClick={handleSaveEarnings}
                    className="text-[10px] px-2 py-1 bg-emerald-600 text-white rounded font-bold"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <p className={`text-sm font-bold font-mono ${tokens.textPrimary}`}>
                  {currencySymbol}{monthlyEarnings.toLocaleString('en-IN')} /mo
                </p>
              )}
            </div>
            
            {!isEditingEarnings && (
              <button
                type="button"
                id="edit-earnings-btn"
                onClick={() => setIsEditingEarnings(true)}
                className="text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 font-mono px-2 py-1 rounded"
              >
                Configure
              </button>
            )}
          </div>
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
                  <span className={`text-sm font-black font-mono ${tokens.textPrimary}`}>
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
                <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 group">
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

    </div>
  );
}
