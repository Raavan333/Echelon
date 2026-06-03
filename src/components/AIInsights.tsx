/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Brain, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  Zap, 
  RefreshCw, 
  Award, 
  LineChart, 
  Gauge, 
  Coins 
} from 'lucide-react';
import { EchelonTheme, Asset, Loan, LoanType, Expense, FinancialGoal } from '../types';
import { getColorTokens } from '../utils/theme';
import { calculateWealthRates } from '../utils/math';

interface AIInsightsProps {
  theme: EchelonTheme;
  assets: Asset[];
  loans: Loan[];
  monthlyEarnings: number;
  expenses: Expense[];
  currencySymbol?: string;
  goals?: FinancialGoal[];
}

export default function AIInsights({
  theme,
  assets,
  loans,
  monthlyEarnings,
  expenses,
  currencySymbol = '₹',
  goals = [],
}: AIInsightsProps) {
  const [cloudInsights, setCloudInsights] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [score, setScore] = useState<number>(65);
  const [simulatedRepay, setSimulatedRepay] = useState<boolean>(false);
  const [simulatedDivert, setSimulatedDivert] = useState<boolean>(false);

  const tokens = getColorTokens(theme);

  // 1. OFFLINE COGNITIVE HEURISTICS ENGINE CALCULATIONS
  const totalAssetsVal = assets.reduce((sum, a) => sum + a.currentValue, 0);
  const totalLentVal = loans
    .filter(l => l.type === LoanType.LENT)
    .reduce((sum, l) => sum + (l.principal - l.manualPayments), 0);
  const totalBorrowedVal = loans
    .filter(l => l.type === LoanType.BORROWED)
    .reduce((sum, l) => sum + (l.principal - l.manualPayments), 0);

  // Dynamic Portfolio Blended Yield
  let totalYieldAmount = 0;
  assets.forEach(a => {
    const r = a.annualGrowthRate !== undefined 
      ? a.annualGrowthRate 
      : (a.type === 'FD' ? 7.1 : a.type === 'BOND' ? 8.5 : (a.type === 'EQUITY' || a.type === 'STOCK') ? 12 : 3.5);
    totalYieldAmount += a.currentValue * (r / 100);
  });
  const blendedAPY = totalAssetsVal > 0 ? (totalYieldAmount / totalAssetsVal) * 100 : 0;

  // Identify high interest rate debts
  const highInterestDebts = loans.filter(l => l.type === LoanType.BORROWED && l.interestRate > blendedAPY);
  const highInterestDebtValue = highInterestDebts.reduce((sum, l) => sum + (l.principal - l.manualPayments), 0);

  // Simulated variable outputs
  const displayBorrowedVal = simulatedRepay ? Math.max(0, totalBorrowedVal - highInterestDebtValue) : totalBorrowedVal;
  const netWorth = totalAssetsVal + totalLentVal - displayBorrowedVal;

  const rates = calculateWealthRates(assets, loans, monthlyEarnings, expenses, netWorth);

  // Emergency Shield (months of expenses covered by bank balance/liquid hold)
  const liquidCash = assets
    .filter(a => a.type === 'BANK_BALANCE' || a.type === 'FD')
    .reduce((sum, a) => sum + a.currentValue, 0);
  const recentSpends_30d = expenses.reduce((sum, e) => sum + e.amount, 0) || 15000;
  
  const displayLiquidCash = simulatedDivert ? Math.max(liquidCash, recentSpends_30d * 6) : liquidCash;
  const emergencyShieldMonths = recentSpends_30d > 0 ? displayLiquidCash / recentSpends_30d : 0;

  // Concentration Check
  const classes = { EQUITY: 0, STOCK: 0, FD: 0, BOND: 0, BANK_BALANCE: 0 };
  assets.forEach(a => {
    classes[a.type] = (classes[a.type] || 0) + a.currentValue;
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

  // Score generator - calibrates based on active simulated states
  useEffect(() => {
    let s = 60;
    if (blendedAPY > 8) s += 10;
    if (blendedAPY > 11) s += 5;
    if (emergencyShieldMonths >= 6) s += 15;
    else if (emergencyShieldMonths >= 3) s += 8;
    
    if (maxConcentrationPct < 50 && assets.length > 2) s += 10;
    
    // Debt penalty adjusted for simulated repay settings
    const activeHighInterestCount = simulatedRepay ? 0 : highInterestDebts.length;
    if (activeHighInterestCount === 0) s += 10;
    else s -= 12;

    if (rates.netPerMonth > 50000) s += 10;
    else if (rates.netPerMonth > 10000) s += 5;
    else if (rates.netPerMonth <= 0) s -= 20;

    setScore(Math.min(100, Math.max(10, s)));
  }, [blendedAPY, emergencyShieldMonths, maxConcentrationPct, highInterestDebts.length, rates.netPerMonth, assets.length, simulatedRepay, simulatedDivert]);

  // Gamified ranks
  const getRank = (scr: number) => {
    if (scr >= 90) return { title: 'Sovereign Emperor', color: 'text-amber-400', desc: 'Blended compounding dominance with high safety shields.' };
    if (scr >= 75) return { title: 'Echelon Elite', color: 'text-emerald-400', desc: 'Outstanding asset compounding and quiet accumulation speed.' };
    if (scr >= 50) return { title: 'Quiet Capitalist', color: 'text-blue-400', desc: 'Positive net income stream with balanced defensive metrics.' };
    return { title: 'Deficient Seeker', color: 'text-red-400', desc: 'At risk from expense leakages or compound debt velocities.' };
  };

  const rank = getRank(score);

  // 2. OFFLINE SOVEREIGN COGNITIVE INTEL REPORT GENERATION (CLIENT DEVICE CONTAINED)
  const fetchGeminiInsights = () => {
    setLoading(true);
    setError('');
    
    // Simulate safe calculation cycles for user feedback satisfaction
    setTimeout(() => {
      try {
        setCloudInsights('compiled');
      } catch (err: any) {
        console.error(err);
        setError('Local compiler computation error. Re-verify balance sheets allocations.');
      } finally {
        setLoading(false);
      }
    }, 750);
  };

  return (
    <div id="cognitive-ai-insights-core" className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      
      {/* LEFT: HEURISTICS GAMIFIED RADAR */}
      <div className={`xl:col-span-1 p-6 rounded-3xl border ${tokens.card} ${tokens.glow} flex flex-col justify-between transition-all duration-300 relative overflow-hidden`}>
        {/* Glow effect */}
        <div className="absolute top-0 right-0 h-32 w-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Cpu className="h-5 w-5 text-amber-500" />
            <h3 className={`text-base font-bold font-display ${tokens.textPrimary}`}>Local Security Diagnostic</h3>
          </div>

          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative w-32 h-32 flex items-center justify-center mb-4">
              {/* Score circular indicator */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke={theme.mode === 'dark' ? '#1c1917' : '#e7e5e4'} strokeWidth="8" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="transparent" 
                  stroke={score >= 75 ? '#10b981' : score >= 50 ? '#3b82f6' : '#ef4444'} 
                  strokeWidth="8" 
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - score / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                <span className={`text-3xl font-bold font-mono ${tokens.textPrimary}`}>{score}</span>
                <span className="text-[9px] text-stone-500 font-mono font-bold mt-1 uppercase">Health Index</span>
              </div>
            </div>

            <div className="text-center">
              <span className={`text-xs font-bold uppercase tracking-widest font-mono bg-stone-500/10 border ${tokens.border} px-3 py-1 rounded-full ${rank.color}`}>
                👑 {rank.title}
              </span>
              <p className="text-[11px] text-stone-400 mt-3 max-w-xs mx-auto leading-snug">
                {rank.desc}
              </p>
            </div>
          </div>

          {/* Core factors summary */}
          <div className="space-y-3 mt-4 pt-4 border-t border-dashed border-stone-800/20 dark:border-stone-100/10">
            <h4 className="text-[10px] uppercase font-bold text-stone-500 font-mono tracking-wider">Compounded Diagnostics</h4>
            
            {/* Blended Yield */}
            <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-stone-500/5 hover:bg-stone-500/10 transition-all border border-stone-500/5">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span className="text-stone-400">Blended APY</span>
              </div>
              <span className={`font-mono font-bold ${tokens.textPrimary}`}>{blendedAPY.toFixed(1)}%</span>
            </div>

            {/* Liquidity Cover */}
            <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-stone-500/5 hover:bg-stone-500/10 transition-all border border-stone-500/5">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-500" />
                <span className="text-stone-400">Reserve Cover</span>
              </div>
              <span className={`font-mono font-bold ${tokens.textPrimary}`}>
                {emergencyShieldMonths > 12 ? '12+ mo' : `${emergencyShieldMonths.toFixed(1)} mo`}
              </span>
            </div>

            {/* Allocation Heat */}
            <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-stone-500/5 hover:bg-stone-500/10 transition-all border border-stone-500/5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-cyan-400" />
                <span className="text-stone-400">Max Concentration</span>
              </div>
              <span className={`font-mono font-bold ${tokens.textPrimary}`}>{maxConcentrationPct.toFixed(0)}%</span>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <p className="text-[10px] text-stone-500 italic text-center font-mono leading-tight">
            Compiled locally &bull; Client containment active &bull; Non-custodial sandbox logs
          </p>
        </div>
      </div>

      {/* RIGHT: DETAILED RECOMMENDATIONS + GEMINI EXPANDER */}
      <div className={`xl:col-span-2 p-6 rounded-3xl border ${tokens.card} ${tokens.glow} flex flex-col justify-between transition-all duration-300`}>
        <div>
          <div className="flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-amber-500" />
              <div>
                <h3 className={`text-base font-bold font-display ${tokens.textPrimary}`}>Sovereign Cognitive Compiler</h3>
                <p className="text-[11px] text-stone-500">Autonomous sandbox calculation engine reading all numbers offline</p>
              </div>
            </div>
            
            <button
              onClick={fetchGeminiInsights}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 font-extrabold text-[#050505] hover:scale-105 rounded-xl text-xs transition-all tracking-wide disabled:opacity-50 active:scale-95 shadow-md font-mono uppercase"
            >
              {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              <span>{loading ? 'Compiling...' : 'Sovereign AI Core'}</span>
            </button>
          </div>

          {/* Show Cloud Insights first if loaded, else fall back to beautiful structured offline items */}
          {cloudInsights ? (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between bg-stone-500/5 p-3 rounded-xl border border-stone-800/40">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] bg-amber-500/10 text-amber-500 font-mono font-bold px-2.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider">
                    🔒 Sovereign Live Audit Coherence
                  </span>
                </div>
                <button 
                  onClick={() => {
                    setCloudInsights('');
                    setSimulatedRepay(false);
                    setSimulatedDivert(false);
                  }} 
                  className="text-stone-400 hover:text-stone-200 font-mono text-[10px] uppercase font-bold flex items-center gap-1.5 bg-stone-950 border border-stone-800/80 px-2.5 py-1 rounded-xl transition-all shadow-sm"
                >
                  <RefreshCw className="h-3 w-3" />
                  Reset Sovereign
                </button>
              </div>

              {/* Bento Grid Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Net Worth */}
                <div className="p-3.5 rounded-2xl bg-[#050505]/40 border border-stone-800/50 shadow-inner">
                  <span className="text-[9px] uppercase font-bold text-stone-500 block font-mono">Net Compounding Asset Weight</span>
                  <span className="text-lg font-black text-white block mt-1 tracking-tight">
                    {currencySymbol}{netWorth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                  <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono mt-1.5 pt-1.5 border-t border-stone-800/40">
                    <span>Assets: {currencySymbol}{totalAssetsVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    <span>Debt: {currencySymbol}{displayBorrowedVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>

                {/* Compound APY */}
                <div className="p-3.5 rounded-2xl bg-[#050505]/40 border border-stone-800/50 shadow-inner">
                  <span className="text-[9px] uppercase font-bold text-stone-500 block font-mono">Blended Portfolio APY</span>
                  <span className="text-lg font-black text-amber-500 block mt-1 tracking-tight">
                    {blendedAPY.toFixed(2)}% APY
                  </span>
                  <div className="text-[9px] text-zinc-500 font-mono mt-1.5 pt-1.5 border-t border-stone-800/40">
                    Growth rate: +{currencySymbol}{totalYieldAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/yr
                  </div>
                </div>

                {/* Emergency Cushion */}
                <div className="p-3.5 rounded-2xl bg-[#050505]/40 border border-stone-800/50 shadow-inner">
                  <span className="text-[9px] uppercase font-bold text-stone-500 block font-mono">Reserves Safety Buffer</span>
                  <span className="text-lg font-black text-emerald-400 block mt-1 tracking-tight">
                    {emergencyShieldMonths.toFixed(1)} Months
                  </span>
                  <div className="text-[9px] text-zinc-500 font-mono mt-1.5 pt-1.5 border-t border-stone-800/40">
                    Liquid cash: {currencySymbol}{displayLiquidCash.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>

              {/* Directives Playbook */}
              <div className="space-y-3">
                <h4 className="text-[10px] uppercase font-mono font-bold text-stone-500 tracking-wider">Tactical Action Directives</h4>

                {/* Action 1: Debts */}
                <div className={`p-4 rounded-2xl border transition-all duration-300 ${
                  highInterestDebts.length > 0 && !simulatedRepay
                    ? 'bg-rose-500/5 border-rose-500/20' 
                    : 'bg-emerald-500/5 border-emerald-500/20'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded-md ${
                        highInterestDebts.length > 0 && !simulatedRepay ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {highInterestDebts.length > 0 && !simulatedRepay ? 'High Systematic Cost Drag' : '✓ Debt Drag Clear'}
                      </span>
                      <p className="text-xs text-stone-300 font-medium pt-1">
                        {highInterestDebts.length > 0 && !simulatedRepay ? (
                          <>Prepay high-cost drag: <strong className="text-white">{highInterestDebts.length} active borrowings</strong> ({currencySymbol}{highInterestDebtValue.toLocaleString()}) run above blended APY ({blendedAPY.toFixed(1)}%).</>
                        ) : (
                          <>Organic accumulation speeds are completely secure against negative leverage compound drains.</>
                        )}
                      </p>
                    </div>
                    {highInterestDebts.length > 0 && (
                      <button 
                        onClick={() => setSimulatedRepay(!simulatedRepay)}
                        className={`text-[10px] font-mono font-bold uppercase py-1 px-3.5 rounded-xl border transition-all shrink-0 ${
                          simulatedRepay 
                            ? 'bg-emerald-500 border-emerald-400 text-stone-950 shadow-md' 
                            : 'bg-stone-905 border-stone-800 text-stone-400 hover:text-stone-100 hover:bg-stone-850'
                        }`}
                      >
                        {simulatedRepay ? '✓ Repaid (Simulation)' : '⚡ Simulate Repayment'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Action 2: Emergency cushion */}
                <div className={`p-4 rounded-2xl border transition-all duration-300 ${
                  emergencyShieldMonths < 6
                    ? 'bg-amber-500/5 border-amber-500/20' 
                    : 'bg-emerald-500/5 border-emerald-500/20'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded-md ${
                        emergencyShieldMonths < 6 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {emergencyShieldMonths < 6 ? 'Defensive Cushion Deficient' : '✓ Safety Cushion Secured'}
                      </span>
                      <p className="text-xs text-stone-300 font-medium pt-1">
                        {emergencyShieldMonths < 6 ? (
                          <>Your liquid buffer sits at <strong className="text-amber-400">{emergencyShieldMonths.toFixed(1)} months</strong>. Secure <strong className="text-white">{currencySymbol}{Math.max(0, recentSpends_30d * 6 - liquidCash).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong> more in FDs/bank balances to lock recommended safety.</>
                        ) : (
                          <>Excellent liquid safety shield: reserve buffer protects your portfolio for <strong className="text-emerald-400">{emergencyShieldMonths.toFixed(1)} months</strong> against any sudden income shocks.</>
                        )}
                      </p>
                    </div>
                    {emergencyShieldMonths < 6 && (
                      <button 
                        onClick={() => setSimulatedDivert(!simulatedDivert)}
                        className={`text-[10px] font-mono font-bold uppercase py-1 px-3.5 rounded-xl border transition-all shrink-0 ${
                          simulatedDivert 
                            ? 'bg-emerald-500 border-emerald-400 text-stone-950 shadow-md' 
                            : 'bg-stone-905 border-stone-800 text-stone-400 hover:text-stone-100 hover:bg-stone-850'
                        }`}
                      >
                        {simulatedDivert ? '✓ Allocated (Simulation)' : '⚡ Simulate Allocation'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Action 3: Concentration */}
                <div className={`p-4 rounded-2xl border transition-all duration-300 ${
                  maxConcentrationPct > 55
                    ? 'bg-cyan-500/5 border-cyan-500/20' 
                    : 'bg-emerald-500/5 border-emerald-500/20'
                }`}>
                  <div className="space-y-1">
                    <span className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded-md ${
                      maxConcentrationPct > 55 ? 'bg-cyan-500/10 text-cyan-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {maxConcentrationPct > 55 ? 'Asset Concentration Drift' : '✓ Allocation Balanced'}
                    </span>
                    <p className="text-xs text-stone-300 font-medium pt-1">
                      {maxConcentrationPct > 55 ? (
                        <>Exposure warning: <strong className="text-white">{maxConcentrationType} ({maxConcentrationPct.toFixed(0)}%)</strong> holds dominant weight of assets. Rebalance future capitals into different sectors.</>
                      ) : (
                        <>Strong diversification profile: no single segment commands dominant portfolio weight ({maxConcentrationPct.toFixed(0)}% max hold in {maxConcentrationType}).</>
                      )}
                    </p>
                  </div>
                </div>

                {/* Action 4: Capital Velocity */}
                <div className={`p-4 rounded-2xl border transition-all duration-300 ${
                  rates.netPerMonth <= 0
                    ? 'bg-rose-500/5 border-rose-500/20' 
                    : 'bg-emerald-500/5 border-emerald-500/20'
                }`}>
                  <div className="space-y-1">
                    <span className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded-md ${
                      rates.netPerMonth <= 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {rates.netPerMonth <= 0 ? 'Negative Net Inflow Velocity' : '✓ Accumulation Velocity Active'}
                    </span>
                    <p className="text-xs text-stone-300 font-medium pt-1">
                      {rates.netPerMonth <= 0 ? (
                        <>Operating deficit: expenses outrun earnings by {currencySymbol}{Math.abs(rates.netPerMonth).toLocaleString('en-IN', { maximumFractionDigits: 0 })}/mo. Compress operational expenditures immediately.</>
                      ) : (
                        <>Quiet wealth accumulation speed is solid. Net cash additions track at <strong className="text-emerald-400">+{currencySymbol}{rates.netPerMonth.toLocaleString('en-IN', { maximumFractionDigits: 0 })} / month</strong>.</>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 font-semibold text-xs leading-tight">
                  ⚠️ {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Heuristic Item 1: Diversification Advice */}
                <div className="p-4 rounded-2xl bg-stone-500/5 border border-stone-500/5 space-y-2">
                  <div className="flex items-center gap-2">
                    {maxConcentrationPct > 60 ? (
                      <ShieldAlert className="h-4.5 w-4.5 text-rose-500 shrink-0" />
                    ) : (
                      <CheckCircle className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                    )}
                    <h4 className={`text-xs font-bold ${tokens.textPrimary}`}>Concentration Diagnostic</h4>
                  </div>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    {maxConcentrationPct > 60 ? (
                      `Your assets are highly concentrated in ${maxConcentrationType} (${maxConcentrationPct.toFixed(0)}%). Diversify into independent asset categories to prevent risk correlation.`
                    ) : (
                      `Perfectly balanced allocation portfolio holding patterns. Concentration index stands safely at ${maxConcentrationPct.toFixed(0)}% in ${maxConcentrationType}.`
                    )}
                  </p>
                </div>

                {/* Heuristic Item 2: Liquidity Protection */}
                <div className="p-4 rounded-2xl bg-stone-500/5 border border-stone-500/5 space-y-2">
                  <div className="flex items-center gap-2">
                    {emergencyShieldMonths < 3 ? (
                      <ShieldAlert className="h-4.5 w-4.5 text-rose-500 shrink-0" />
                    ) : (
                      <CheckCircle className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                    )}
                    <h4 className={`text-xs font-bold ${tokens.textPrimary}`}>Emergency Liquidity Cover</h4>
                  </div>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    {emergencyShieldMonths < 3 ? (
                      `Your cash shield is deficient (${emergencyShieldMonths.toFixed(1)} months covered). Liquidate or divert regular earnings until you secure a 6-month buffer in bank holdings.`
                    ) : (
                      `Splendid cash safety buffer. Active cash reserves securely shield your livelihood for ${emergencyShieldMonths.toFixed(1)} months against unexpected emergencies.`
                    )}
                  </p>
                </div>

                {/* Heuristic Item 3: Compounding APY vs Debt Drag */}
                <div className="p-4 rounded-2xl bg-stone-500/5 border border-stone-500/5 space-y-2">
                  <div className="flex items-center gap-2">
                    {highInterestDebts.length > 0 ? (
                      <ShieldAlert className="h-4.5 w-4.5 text-rose-500 shrink-0" />
                    ) : (
                      <CheckCircle className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                    )}
                    <h4 className={`text-xs font-bold ${tokens.textPrimary}`}>Arbitrage & Debt Leaks</h4>
                  </div>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    {highInterestDebts.length > 0 ? (
                      `You are carrying ${highInterestDebts.length} debt(s) with interest rates higher than your portfolio APY (${blendedAPY.toFixed(1)}%). Aggressively prepay borrow ledgers to close high drag leaks.`
                    ) : (
                      `Excellent debt architecture. No active liabilities are draining compounding speeds because your assets' growth beat all borrow charges.`
                    )}
                  </p>
                </div>

                {/* Heuristic Item 4: Accumulation Velocity */}
                <div className="p-4 rounded-2xl bg-stone-500/5 border border-stone-500/5 space-y-2">
                  <div className="flex items-center gap-2">
                    {rates.netPerMonth <= 0 ? (
                      <ShieldAlert className="h-4.5 w-4.5 text-rose-500 shrink-0" />
                    ) : (
                      <CheckCircle className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                    )}
                    <h4 className={`text-xs font-bold ${tokens.textPrimary}`}>Accumulation Pace (Velocity)</h4>
                  </div>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    {rates.netPerMonth <= 0 ? (
                      `Warning: You are in a cash flow deficit (-${currencySymbol}${Math.abs(rates.netPerMonth).toLocaleString()} /mo). Optimize operating expenses immediately to restore a compounding surplus.`
                    ) : (
                      `Sustained wealth surplus! You are accumulating a net quiet surplus of ${currencySymbol}${rates.netPerMonth.toLocaleString('en-IN', { maximumFractionDigits: 0 })} every single month. Compound continues.`
                    )}
                  </p>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Dynamic Action Tip banner below */}
        <div className="mt-6 flex items-center justify-between p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-[11px] text-stone-400">
              <strong>Echelon Wealth Hack:</strong> Maintain emergency cash in FD pools compounding quarterly to stay ahead of currency drag while keeping total lockouts zero.
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
