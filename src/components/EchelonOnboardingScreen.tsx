import React, { useState } from 'react';
import { Coins, Sliders, Shield, Award, Landmark, Flame } from 'lucide-react';
import { EchelonTheme } from '../types';
import { getColorTokens } from '../utils/theme';

interface EchelonOnboardingScreenProps {
  theme: EchelonTheme;
  currencySymbol: string;
  onComplete: (salary: number, budgetAmt: number, bufferAmt: number) => void;
}

export default function EchelonOnboardingScreen({
  theme,
  currencySymbol = '₹',
  onComplete,
}: EchelonOnboardingScreenProps) {
  const [salary, setSalary] = useState<string>('0');
  const [budget, setBudget] = useState<string>('0');
  const [buffer, setBuffer] = useState<string>('5000');

  const tokens = getColorTokens(theme);

  const handleInitialize = (e: React.FormEvent) => {
    e.preventDefault();
    const sal = parseFloat(salary) || 0;
    const bud = parseFloat(budget) || 0;
    const buf = parseFloat(buffer) || 0;
    onComplete(sal, bud, buf);
  };

  return (
    <div className={`min-h-screen ${tokens.bg} flex items-center justify-center p-4 sm:p-6 transition-all duration-500 relative overflow-hidden select-none`}>
      {/* Immersive radial glows */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xl bg-zinc-950/90 border border-stone-850 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden backdrop-blur-md">
        
        {/* Brand Label */}
        <div className="flex items-center gap-2 mb-6">
          <div className="h-9 w-9 bg-stone-900 border border-stone-850 rounded-xl flex items-center justify-center text-amber-500 p-1 shrink-0">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-500 tracking-widest font-mono">CONFIDENTIAL ONBOARDING</span>
            <h2 className="text-xl font-black font-display text-white tracking-tight -mt-0.5">ECHELON BUILD QUIET WEALTH</h2>
          </div>
        </div>

        {/* Dynamic description explaining the system */}
        <div className="p-4 bg-stone-500/5 border border-stone-850/50 rounded-2xl mb-6 space-y-2">
          <p className="text-[11px] leading-relaxed text-stone-300 font-sans">
            Welcome to Echelon. Let us establish your solid wealth profile base. 
            Echelon tracks every single currency unit of your passive and active net worth.
          </p>
          <div className="text-[10px] space-y-1 text-stone-400 font-mono">
            <div>• <strong className="text-emerald-400 font-semibold">Inflow (Salary)</strong>: What you inject into your treasury regularly per month.</div>
            <div>• <strong className="text-amber-500 font-semibold">Expenses</strong>: Measured dynamically as <strong className="text-stone-300">Spent Items + Budget Cap + Cushion Buffer</strong>.</div>
            <div>• <strong className="text-stone-300 font-semibold">Surplus Routing</strong>: Any remaining salary is automatically directed: 30% to prepaying outstanding debts, 70% to passive asset appreciation (or 100% to assets if no loans are active).</div>
          </div>
        </div>

        <form onSubmit={handleInitialize} className="space-y-5">
          {/* Slider A: Inflow */}
          <div className="space-y-1.5 p-4 rounded-xl bg-stone-900/30 border border-stone-850/60 relative">
            <div className="flex items-center justify-between">
              <label className="text-[11px] uppercase font-bold tracking-wider text-stone-400 font-mono flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-amber-500" />
                <span>1. Monthly Income (Salary)</span>
              </label>
              <div className="flex items-baseline gap-0.5 text-amber-500 font-mono font-bold text-sm bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                <span>{currencySymbol}</span>
                <span>{(parseFloat(salary) || 0).toLocaleString()}</span>
              </div>
            </div>
            <p className="text-[9px] text-stone-500">Your base salary or business income injected in cash balances.</p>
            <input
              type="range"
              min="0"
              max="500000"
              step="5000"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500 mt-2"
            />
            <div className="flex items-center gap-1.5 pt-2">
              <span className="text-[10.5px] font-mono text-stone-500">{currencySymbol}</span>
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                className="w-28 px-2 py-1 bg-stone-950 border border-stone-850 text-xs font-mono text-white rounded outline-none"
              />
            </div>
          </div>

          {/* Slider B: Budget */}
          <div className="space-y-1.5 p-4 rounded-xl bg-stone-900/30 border border-stone-850/60 relative">
            <div className="flex items-center justify-between">
              <label className="text-[11px] uppercase font-bold tracking-wider text-stone-400 font-mono flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-amber-500" />
                <span>2. Monthly Spending Budget</span>
              </label>
              <div className="flex items-baseline gap-0.5 text-amber-500 font-mono font-bold text-sm bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                <span>{currencySymbol}</span>
                <span>{(parseFloat(budget) || 0).toLocaleString()}</span>
              </div>
            </div>
            <p className="text-[9px] text-stone-500">The total target budget threshold limit for generic discretionary expenses.</p>
            <input
              type="range"
              min="0"
              max="200000"
              step="2000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500 mt-2"
            />
            <div className="flex items-center gap-1.5 pt-2">
              <span className="text-[10.5px] font-mono text-stone-500">{currencySymbol}</span>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-28 px-2 py-1 bg-stone-950 border border-stone-850 text-xs font-mono text-white rounded outline-none"
              />
            </div>
          </div>

          {/* Slider C: Cushion Buffer */}
          <div className="space-y-1.5 p-4 rounded-xl bg-stone-900/30 border border-stone-850/60 relative">
            <div className="flex items-center justify-between">
              <label className="text-[11px] uppercase font-bold tracking-wider text-stone-400 font-mono flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                <span>3. Monthly Cushion Buffer</span>
              </label>
              <div className="flex items-baseline gap-0.5 text-emerald-400 font-mono font-bold text-sm bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <span>{currencySymbol}</span>
                <span>{(parseFloat(buffer) || 0).toLocaleString()}</span>
              </div>
            </div>
            <p className="text-[9px] text-stone-500">Safe cushion buffer savings amount set to protect from overdraft and compound passive assets.</p>
            <input
              type="range"
              min="0"
              max="100000"
              step="1000"
              value={buffer}
              onChange={(e) => setBuffer(e.target.value)}
              className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 mt-2"
            />
            <div className="flex items-center gap-1.5 pt-2">
              <span className="text-[10.5px] font-mono text-stone-500">{currencySymbol}</span>
              <input
                type="number"
                value={buffer}
                onChange={(e) => setBuffer(e.target.value)}
                className="w-28 px-2 py-1 bg-stone-950 border border-stone-850 text-xs font-mono text-white rounded outline-none"
              />
            </div>
          </div>

          {/* Secure Button */}
          <button
            type="submit"
            className="w-full mt-2 py-3 bg-amber-500 text-stone-950 hover:bg-amber-400 font-black font-mono text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-98 flex items-center justify-center gap-2 select-none"
          >
            <Award className="h-4.5 w-4.5" />
            <span>🔓 INITIALIZE SECURE PORTFOLIO LEDGER</span>
          </button>
        </form>

        <p className="text-[9px] text-stone-500 font-mono text-center mt-4">
          Asked once. All baseline configurations can be customized anytime from Echelon Settings.
        </p>
      </div>
    </div>
  );
}
