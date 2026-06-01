/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Trash2, Calendar, Award, Compass, Timer, AlertTriangle, ShieldCheck } from 'lucide-react';
import { EchelonTheme, FinancialGoal } from '../types';
import { getColorTokens } from '../utils/theme';
import { estimateTimeToGoal } from '../utils/math';

interface GoalMilestonesProps {
  theme: EchelonTheme;
  goals: FinancialGoal[];
  totalPortfolioValue: number;
  netYearlyFlow: number;
  onAddGoal: (goal: Omit<FinancialGoal, 'id'>) => void;
  onRemoveGoal: (id: string) => void;
}

export default function GoalMilestones({
  theme,
  goals,
  totalPortfolioValue,
  netYearlyFlow,
  onAddGoal,
  onRemoveGoal,
}: GoalMilestonesProps) {
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [targetAmount, setTargetAmount] = useState<string>('');
  const [deadlineDate, setDeadlineDate] = useState<string>('');
  const [category, setCategory] = useState<string>('Capital Base');

  const tokens = getColorTokens(theme);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount || !deadlineDate) return;

    onAddGoal({
      name,
      targetAmount: parseFloat(targetAmount) || 0,
      deadlineDate,
      category,
    });

    setName('');
    setTargetAmount('');
    setDeadlineDate('');
    setCategory('Capital Base');
    setShowAddForm(false);
  };

  const getGoalStatus = (current: number, target: number, yearsRemaining: number) => {
    if (current >= target) {
      return {
        label: 'Axiom Achieved',
        color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
        desc: 'Quiet milestone accomplished.'
      };
    }
    if (yearsRemaining === Infinity) {
      return {
        label: 'Flow Alert: Deficit',
        color: 'text-rose-500 border-rose-500/20 bg-rose-500/5',
        desc: 'Treasury outflow exceeds income. Goal mathematically unreachable.'
      };
    }
    if (yearsRemaining > 50) {
      return {
        label: 'Speed Warning',
        color: 'text-amber-500 border-amber-500/20 bg-amber-500/5',
        desc: 'Velocity extremely slow. Requires capital injection.'
      };
    }
    return {
      label: 'On Schedule',
      color: 'text-blue-400 border-blue-400/20 bg-blue-500/5',
      desc: `Quietly securing base. Projected: ${yearsRemaining.toFixed(1)} years.`
    };
  };

  return (
    <div id="holding-goals-grid-panel" className={`p-6 rounded-3xl border ${tokens.card} ${tokens.glow} transition-all duration-300`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-bold ${tokens.textPrimary}`}>Treasury Ambitions & Goals</h2>
          <p className="text-xs text-stone-500">Add milestones and track automatic dynamic timelines based on net compounding wealth velocities</p>
        </div>
        <button
          type="button"
          id="toggle-add-goal-btn"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>New Ambition</span>
        </button>
      </div>

      {/* FORM */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-2xl border border-dashed border-stone-700/30 dark:border-stone-100/10 bg-stone-500/5 space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label htmlFor="goal-form-name" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Target Ambition Name</label>
              <input
                type="text"
                id="goal-form-name"
                required
                placeholder="e.g. Dream Retreat, ₹1Cr Sovereign Fund"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3 py-2 bg-stone-500/10 border ${tokens.border} rounded-xl text-xs focus:outline-none focus:border-amber-500`}
              />
            </div>

            <div>
              <label htmlFor="goal-form-target" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Target Threshold (INR)</label>
              <input
                type="number"
                id="goal-form-target"
                required
                min="1000"
                placeholder="₹ Target amount"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className={`w-full px-3 py-2 bg-stone-500/10 border ${tokens.border} rounded-xl text-xs focus:outline-none focus:border-amber-500`}
              />
            </div>

            <div>
              <label htmlFor="goal-form-deadline" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Target Achieved Date</label>
              <input
                type="date"
                id="goal-form-deadline"
                required
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className={`w-full px-3 py-2 bg-stone-500/10 border ${tokens.border} rounded-xl text-xs focus:outline-none focus:border-amber-500`}
              />
            </div>

            <div>
              <label htmlFor="goal-form-category" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Category Domain</label>
              <select
                id="goal-form-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full px-3 py-2 bg-stone-950 font-semibold border ${tokens.border} rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-500`}
              >
                <option value="Capital Base">Capital Base</option>
                <option value="Sovereign Fund">Sovereign Fund</option>
                <option value="Leisure Estate">Leisure Estate</option>
                <option value="Active Shield">Active Shield</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              id="cancel-goal-btn"
              onClick={() => setShowAddForm(false)}
              className="text-xs font-bold text-stone-400 hover:text-stone-300 px-3 py-2 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-goal-btn"
              className="text-xs font-extrabold px-5 py-2.5 bg-amber-500 text-stone-950 rounded-xl transition-all shadow hover:bg-amber-400"
            >
              Secure Ambition
            </button>
          </div>
        </form>
      )}

      {/* GOALS GRID */}
      {goals.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-stone-800/15 dark:border-stone-100/10 rounded-2xl">
          <p className="text-xs text-stone-500 font-mono">No financial goals are specified inside Echelon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => {
            const yearsToGoal = estimateTimeToGoal(g.targetAmount, totalPortfolioValue, netYearlyFlow);
            const status = getGoalStatus(totalPortfolioValue, g.targetAmount, yearsToGoal);
            
            // Percentage toward goal
            const progress = totalPortfolioValue > 0 
              ? Math.max(0, Math.min(100, (totalPortfolioValue / g.targetAmount) * 100))
              : 0;

            return (
              <div
                key={g.id}
                className={`p-5 rounded-2xl border ${tokens.card} flex flex-col justify-between hover:scale-[1.01] transition-all`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold font-mono uppercase bg-stone-500/10 border border-stone-500/15 px-2 py-0.5 rounded text-stone-400">
                      {g.category}
                    </span>
                    <button
                      type="button"
                      id={`delete-goal-btn-${g.id}`}
                      onClick={() => onRemoveGoal(g.id)}
                      className="p-1 rounded hover:bg-red-500/15 text-stone-550 hover:text-red-500 transition-colors"
                      title="Forfeit Ambition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-start gap-2 mb-2">
                    <Compass className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h3 className={`text-base font-bold ${tokens.textPrimary}`}>{g.name}</h3>
                      <p className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        <span>Deadline Target: {new Date(g.deadlineDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                      </p>
                    </div>
                  </div>

                  {/* Pricing specs */}
                  <div className="my-4 space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] uppercase font-bold text-stone-500 font-mono">Target Cap</span>
                      <span className={`text-lg font-mono font-black ${tokens.textPrimary}`}>₹{g.targetAmount.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] uppercase font-bold text-stone-500 font-mono">Status Indicator</span>
                      <span className={`text-[10px] font-bold uppercase border px-2 py-0.5 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    {/* Progress tracking line */}
                    <div>
                      <div className="w-full h-1.5 bg-stone-500/10 rounded-full overflow-hidden mb-1">
                        <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-[9px] text-stone-500 font-mono font-bold block text-right">{progress.toFixed(0)}% Secured</span>
                    </div>
                  </div>
                </div>

                {/* dynamic dynamic timeline projection results */}
                <div className="mt-4 pt-3 border-t border-dashed border-stone-800/15 dark:border-stone-100/10 text-xs leading-relaxed text-stone-400">
                  {yearsToGoal === 0 ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" />
                      <span>{status.desc}</span>
                    </span>
                  ) : yearsToGoal === Infinity ? (
                    <span className="text-red-500 font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 animate-bounce" />
                      <span>{status.desc}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-stone-300">
                      <Timer className="h-4 w-4 text-amber-500" />
                      <span>{status.desc}</span>
                    </span>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
