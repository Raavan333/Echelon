/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Trash2, Calendar, Award, Compass, Timer, AlertTriangle, ShieldCheck, Edit3, X, CheckSquare } from 'lucide-react';
import { EchelonTheme, FinancialGoal, Asset } from '../types';
import { getColorTokens } from '../utils/theme';
import { estimateTimeToGoal } from '../utils/math';

interface GoalMilestonesProps {
  theme: EchelonTheme;
  goals: FinancialGoal[];
  assets: Asset[];
  totalPortfolioValue: number;
  netYearlyFlow: number;
  onAddGoal: (goal: Omit<FinancialGoal, 'id'>) => void;
  onUpdateGoal?: (id: string, goal: Omit<FinancialGoal, 'id'>) => void;
  onRemoveGoal: (id: string) => void;
  currencySymbol?: string;
}

export default function GoalMilestones({
  theme,
  goals,
  assets,
  totalPortfolioValue,
  netYearlyFlow,
  onAddGoal,
  onUpdateGoal,
  onRemoveGoal,
  currencySymbol = '₹',
}: GoalMilestonesProps) {
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [targetAmount, setTargetAmount] = useState<string>('');
  const [deadlineDate, setDeadlineDate] = useState<string>('');
  const [category, setCategory] = useState<string>('Capital Base');
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  // Goals CRUD edit states
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editTarget, setEditTarget] = useState<string>('');
  const [editDeadline, setEditDeadline] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('Capital Base');
  const [editAssetIds, setEditAssetIds] = useState<string[]>([]);

  const handleStartEditGoal = (g: FinancialGoal) => {
    setEditingGoalId(g.id);
    setEditName(g.name);
    setEditTarget(g.targetAmount.toString());
    setEditDeadline(g.deadlineDate);
    setEditCategory(g.category);
    setEditAssetIds(g.assetIds || []);
  };

  const handleSaveEditGoal = (id: string) => {
    const tgt = parseFloat(editTarget);
    if (!editName || isNaN(tgt)) return;
    if (onUpdateGoal) {
      onUpdateGoal(id, {
        name: editName,
        targetAmount: tgt,
        deadlineDate: editDeadline,
        category: editCategory,
        assetIds: editAssetIds,
      });
    }
    setEditingGoalId(null);
  };

  const tokens = getColorTokens(theme);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount || !deadlineDate) return;

    onAddGoal({
      name,
      targetAmount: parseFloat(targetAmount) || 0,
      deadlineDate,
      category,
      assetIds: selectedAssetIds,
    });

    setName('');
    setTargetAmount('');
    setDeadlineDate('');
    setCategory('Capital Base');
    setSelectedAssetIds([]);
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
                placeholder={`e.g. Dream Retreat, ${currencySymbol}1Cr Sovereign Fund`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3 py-2 bg-stone-500/10 border ${tokens.border} rounded-xl text-xs focus:outline-none focus:border-amber-500`}
              />
            </div>

            <div>
              <label htmlFor="goal-form-target" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Target Threshold</label>
              <input
                type="number"
                id="goal-form-target"
                required
                min="1000"
                placeholder={`${currencySymbol} Target amount`}
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

          {/* Linked Assets Selection */}
          <div className="pt-2 border-t border-stone-800/20 dark:border-stone-100/10">
            <label className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1.5">Asset & Fund Support (Scope Backing)</label>
            <div className="p-3 bg-zinc-950/60 rounded-xl border border-stone-800 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-stone-850">
                <span className="text-[10.5px] uppercase font-bold text-amber-500 font-mono">Include Specific Funds only</span>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedAssetIds.length === assets.length) {
                      setSelectedAssetIds([]);
                    } else {
                      setSelectedAssetIds(assets.map(a => a.id));
                    }
                  }}
                  className="text-[9.5px] uppercase font-black text-amber-400 hover:text-amber-300 font-mono"
                >
                  {selectedAssetIds.length === assets.length ? 'Clear All' : 'Select All'}
                </button>
              </div>
              
              {assets.length === 0 ? (
                <p className="text-[10px] text-stone-500 font-mono italic">No registered assets. Defaults to standard savings/liquid reserves progress.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-40 overflow-y-auto pr-1">
                  {assets.map(asset => {
                    const isChecked = selectedAssetIds.includes(asset.id);
                    return (
                      <label 
                        key={asset.id} 
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none transition-all ${
                          isChecked 
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
                            : 'bg-zinc-950/30 border-stone-850 hover:bg-zinc-900/40 text-stone-400 hover:text-stone-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedAssetIds(selectedAssetIds.filter(id => id !== asset.id));
                            } else {
                              setSelectedAssetIds([...selectedAssetIds, asset.id]);
                            }
                          }}
                          className="rounded border-stone-700 text-amber-500 focus:ring-0 focus:ring-offset-0 bg-stone-900 h-3.5 w-3.5"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="font-mono text-xs font-semibold block truncate leading-tight">{asset.name}</span>
                          <span className="text-[9px] text-stone-500 font-mono italic block truncate leading-none mt-0.5">{asset.type}</span>
                        </div>
                        <span className="font-mono font-bold text-[10.5px] whitespace-nowrap">{currencySymbol}{asset.currentValue.toLocaleString()}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            <p className="text-[9.5px] text-stone-500 font-mono mt-1.5 leading-relaxed">
              💡 If no funds are checked, we will defaults to tracking this goal against your full total portfolio net worth. Choose custom funds to exclude/include elements like FD and Corporate Bonds only.
            </p>
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
            const hasCustomAssets = g.assetIds !== undefined && g.assetIds.length > 0;
            const backingValue = hasCustomAssets
              ? assets.filter(a => g.assetIds?.includes(a.id)).reduce((sum, a) => sum + a.currentValue, 0)
              : totalPortfolioValue;

            const yearsToGoal = estimateTimeToGoal(g.targetAmount, backingValue, netYearlyFlow);
            const status = getGoalStatus(backingValue, g.targetAmount, yearsToGoal);
            
            // Percentage toward goal
            const progress = backingValue > 0 
              ? Math.max(0, Math.min(100, (backingValue / g.targetAmount) * 100))
              : 0;
            const isEditing = editingGoalId === g.id;

              if (isEditing) {
                return (
                  <div
                    key={g.id}
                    className={`p-5 rounded-2xl border border-amber-500/30 bg-zinc-950 flex flex-col justify-between space-y-3 animate-fade-in text-xs`}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-mono text-amber-500 font-bold uppercase tracking-wider">
                        <span>Edit Goal Parameters</span>
                        <button type="button" onClick={() => setEditingGoalId(null)} className="text-stone-500 hover:text-stone-200">
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div>
                        <label className="text-[9px] uppercase font-bold text-stone-500 font-mono block mb-0.5">Category Domain</label>
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className={`w-full px-2 py-1 bg-stone-900 border border-stone-800 rounded-lg text-xs text-white focus:outline-none`}
                        >
                          <option value="Capital Base">Capital Base</option>
                          <option value="Sovereign Fund">Sovereign Fund</option>
                          <option value="Leisure Estate">Leisure Estate</option>
                          <option value="Active Shield">Active Shield</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] uppercase font-bold text-stone-500 font-mono block mb-0.5">Goal Description</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-2 py-1 bg-stone-900 border border-stone-800 rounded-lg text-xs text-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] uppercase font-bold text-stone-500 font-mono block mb-0.5">Target Amount</label>
                        <input
                          type="number"
                          value={editTarget}
                          onChange={(e) => setEditTarget(e.target.value)}
                          className="w-full px-2 py-1 bg-stone-900 border border-stone-800 rounded-lg text-xs text-white outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] uppercase font-bold text-stone-500 font-mono block mb-0.5">Deadline</label>
                        <input
                          type="date"
                          value={editDeadline}
                          onChange={(e) => setEditDeadline(e.target.value)}
                          className="w-full px-2 py-1 bg-stone-900 border border-stone-800 rounded-lg text-xs text-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] uppercase font-bold text-stone-500 font-mono block mb-1">Fund & Asset Support (Pre-allocated)</label>
                        <div className="space-y-1.5 p-2 bg-stone-900 border border-stone-800 rounded-lg max-h-36 overflow-y-auto">
                          {assets.length === 0 ? (
                            <span className="text-[10px] text-stone-500 italic">No assets available.</span>
                          ) : (
                            assets.map(asset => {
                              const isChecked = editAssetIds.includes(asset.id);
                              return (
                                <label key={asset.id} className="flex items-center gap-2 cursor-pointer select-none text-[10px] text-stone-300">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        setEditAssetIds(editAssetIds.filter(id => id !== asset.id));
                                      } else {
                                        setEditAssetIds([...editAssetIds, asset.id]);
                                      }
                                    }}
                                    className="rounded border-stone-800 text-amber-500 focus:ring-0 focus:ring-offset-0 bg-stone-955 h-3 w-3"
                                  />
                                  <span className="flex-1 truncate font-mono">{asset.name}</span>
                                  <span className="font-mono font-bold text-stone-400">{currencySymbol}{asset.currentValue.toLocaleString()}</span>
                                </label>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-1.5 pt-2 border-t border-stone-900">
                      <button
                        type="button"
                        onClick={() => setEditingGoalId(null)}
                        className="text-[10px] text-stone-400 hover:text-stone-300 font-semibold px-2 py-1"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEditGoal(g.id)}
                        className="text-[10px] font-bold px-3 py-1 bg-amber-500 text-stone-950 rounded-lg flex items-center gap-1 hover:bg-amber-400 transition-all shadow"
                      >
                        <CheckSquare className="h-3 w-3" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                );
              }

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
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEditGoal(g)}
                          className="p-1 rounded hover:bg-amber-500/15 text-stone-550 hover:text-amber-500 transition-colors"
                          title="Modify Goal"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
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
                        <span className={`text-lg font-mono font-black ${tokens.textPrimary}`}>{currencySymbol}{g.targetAmount.toLocaleString('en-IN')}</span>
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
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-stone-500 font-mono">Current Backing: <strong className="text-stone-300 font-semibold">{currencySymbol}{backingValue.toLocaleString()}</strong></span>
                          <span className="text-[9px] text-stone-500 font-mono font-bold">{progress.toFixed(0)}% Secured</span>
                        </div>
                      </div>

                      {/* Linked Assets Backing Display */}
                      <div className="pt-2 border-t border-stone-800/10 dark:border-stone-100/5 mt-1">
                        <span className="text-[9px] uppercase font-bold text-stone-500 font-mono block mb-1">Backing Assets Scope ({hasCustomAssets ? g.assetIds?.length : 'All Active'})</span>
                        {hasCustomAssets ? (
                          <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                            {assets.filter(a => g.assetIds?.includes(a.id)).map(a => (
                              <span key={a.id} className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-stone-300" title={`${a.name}: ${currencySymbol}${a.currentValue.toLocaleString()}`}>
                                {a.name} ({currencySymbol}{a.currentValue.toLocaleString()})
                              </span>
                            ))}
                            {assets.filter(a => g.assetIds?.includes(a.id)).length === 0 && (
                              <span className="text-[9px] font-mono text-stone-500 italic">No matching active asset discovered</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-stone-800/20 border border-stone-800/10 text-stone-400 block truncate">
                            Global Portfolio Net Worth
                          </span>
                        )}
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
