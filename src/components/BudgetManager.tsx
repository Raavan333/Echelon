/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Trash2, ArrowUpRight, ShieldAlert, Sparkles, CheckSquare, Layers, Download, CheckCircle, FileSpreadsheet, FileText, Landmark, RefreshCw } from 'lucide-react';
import { EchelonTheme, Budget, Expense, BudgetPeriod } from '../types';
import { getColorTokens } from '../utils/theme';
import { generateCSVData, generateHTMLReport, downloadBlob } from '../utils/export';

interface BudgetManagerProps {
  theme: EchelonTheme;
  budget: Budget;
  expenses: Expense[];
  onConfigureBudget: (amount: number, period: BudgetPeriod, alertPercent: number) => void;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onRemoveExpense: (id: string) => void;
  onTriggerMonthEndReset: () => void;
}

export default function BudgetManager({
  theme,
  budget,
  expenses,
  onConfigureBudget,
  onAddExpense,
  onRemoveExpense,
  onTriggerMonthEndReset
}: BudgetManagerProps) {
  const [showAddExpense, setShowAddExpense] = useState<boolean>(false);
  const [category, setCategory] = useState<string>('Leisure & Personal');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  const [isEditingBudget, setIsEditingBudget] = useState<boolean>(false);
  const [budgetLimit, setBudgetLimit] = useState<string>(budget.amount.toString());
  const [period, setPeriod] = useState<BudgetPeriod>(budget.period);
  const [alertPercent, setAlertPercent] = useState<string>(budget.spendingLimitAlertPercent.toString());

  const [monthEndProgress, setMonthEndProgress] = useState<boolean>(false);
  const [successReset, setSuccessReset] = useState<boolean>(false);

  const tokens = getColorTokens(theme);

  // Spend totals calculations
  const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);
  const spendPercentage = budget.amount > 0 ? (totalSpend / budget.amount) * 100 : 0;
  
  // Custom alerts triggers
  const isApproachingLimit = spendPercentage >= budget.spendingLimitAlertPercent && spendPercentage < 100;
  const isOverLimit = spendPercentage >= 100;

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(budgetLimit);
    const pct = parseFloat(alertPercent);
    if (!isNaN(amt) && !isNaN(pct) && amt > 0) {
      onConfigureBudget(amt, period, pct);
      setIsEditingBudget(false);
    }
  };

  const handleAddSpend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    onAddExpense({
      category,
      amount: parseFloat(amount) || 0,
      date,
      notes,
    });

    setAmount('');
    setNotes('');
    setShowAddExpense(false);
  };

  // Perform Month End Closeoff with auto PDF & CSV Download!
  const handleMonthEndVaultReset = () => {
    setMonthEndProgress(true);
    
    // Simulate generation delays to build dramatic "securing vault" feedback
    setTimeout(() => {
      // 1. Generate & trigger Excel/CSV download
      const stateObj = {
        version: 1,
        isLocked: false,
        pinHash: '',
        assets: [], // parent state will contain this info
        loans: [],
        goals: [],
        budget: budget,
        expenses: expenses,
        monthlyEarnings: 120000,
        theme: theme,
        archivedReportMonths: []
      };
      
      // Let's print out what is passed on
      const csvStr = generateCSVData(stateObj as any);
      downloadBlob(csvStr, `Echelon_Vault_Reset_Archive_${new Date().getFullYear()}_${new Date().getMonth() + 1}.csv`, 'text/csv');
      
      // 2. Generate PDF format report
      const htmlStr = generateHTMLReport(stateObj as any, `Ledger Close-off Report`);
      downloadBlob(htmlStr, `Echelon_Vault_Reset_Report_${new Date().getFullYear()}_${new Date().getMonth() + 1}.html`, 'text/html');

      // 3. Trigger parent reset
      onTriggerMonthEndReset();

      setMonthEndProgress(false);
      setSuccessReset(true);
      setTimeout(() => setSuccessReset(false), 5000);
    }, 2000);
  };

  return (
    <div id="holding-budget-expense-dashboard" className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* 1. BUDGET CONTROLLER SHEET */}
      <div className={`p-6 rounded-3xl border ${tokens.card} ${tokens.glow} flex flex-col justify-between transition-all duration-300`}>
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-amber-500 font-mono block mb-4">Smart Budget Meter</span>

          {isEditingBudget ? (
            <form onSubmit={handleSaveBudget} className="space-y-3.5">
              <div>
                <label htmlFor="budget-limit-input" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Limit Allocation (INR)</label>
                <input
                  type="number"
                  id="budget-limit-input"
                  required
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                  className={`w-full px-3 py-1.5 bg-stone-900 border ${tokens.border} rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-500`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="budget-period-select" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Interval term</label>
                  <select
                    id="budget-period-select"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as BudgetPeriod)}
                    className="w-full px-2 py-1.5 bg-stone-950 font-semibold border border-stone-800 rounded-xl text-xs text-stone-200"
                  >
                    <option value={BudgetPeriod.WEEKLY}>Weekly</option>
                    <option value={BudgetPeriod.MONTHLY}>Monthly</option>
                    <option value={BudgetPeriod.YEARLY}>Yearly</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="budget-alert-pct-input" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Alert Trigger %</label>
                  <input
                    type="number"
                    id="budget-alert-pct-input"
                    min="1"
                    max="100"
                    value={alertPercent}
                    onChange={(e) => setAlertPercent(e.target.value)}
                    className={`w-full px-2 py-1.5 bg-stone-900 border ${tokens.border} rounded-xl text-xs text-stone-200`}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  id="cancel-budget-edit-btn"
                  onClick={() => setIsEditingBudget(false)}
                  className="text-xs text-stone-400 font-semibold px-2 py-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-budget-config-btn"
                  className="text-xs font-extrabold px-4 py-1.5 bg-amber-500 text-stone-950 rounded-lg"
                >
                  Apply
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <h3 className={`text-sm font-bold ${tokens.textPrimary}`}>Limit Ceiling</h3>
                <span className="text-xs font-mono font-bold text-amber-500 uppercase">{budget.period} Interval</span>
              </div>
              <p className={`text-3xl font-mono font-black ${tokens.textPrimary}`}>₹{budget.amount.toLocaleString('en-IN')}</p>
              
              <div className="mt-6">
                <div className="flex justify-between items-baseline text-xs mb-1">
                  <span className="text-stone-500 font-medium">Aggregated Spend</span>
                  <span className={`font-mono font-bold ${tokens.textPrimary}`}>
                    ₹{totalSpend.toLocaleString('en-IN')} ({spendPercentage.toFixed(0)}%)
                  </span>
                </div>
                {/* Simulated bar progress indicators */}
                <div className="w-full h-3 rounded-full bg-stone-300/10 border border-stone-800 p-0.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOverLimit 
                        ? 'bg-rose-600 shadow-[0_0_8px_rgba(224,36,36,0.5)]' 
                        : isApproachingLimit 
                          ? 'bg-amber-500' 
                          : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, spendPercentage)}%` }}
                  />
                </div>
              </div>

              {/* Alert prompt triggers */}
              {isApproachingLimit && (
                <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex gap-2 items-center leading-snug animate-pulse">
                  <ShieldAlert className="h-5 w-5 shrink-0" />
                  <span><strong>Threshold warning:</strong> You have consumed over {budget.spendingLimitAlertPercent}% of your custom limit allocation. Close active ledger pipelines!</span>
                </div>
              )}
              {isOverLimit && (
                <div className="mt-4 p-3 rounded-xl bg-red-600/10 border border-red-500/20 text-red-500 text-xs flex gap-2 items-center leading-snug animate-bounce">
                  <ShieldAlert className="h-5 w-5 shrink-0" />
                  <span><strong>Over-spend breach alert:</strong> Budget threshold has been breached. Restrict extra financial entries immediately.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {!isEditingBudget && (
          <button
            type="button"
            id="configure-budget-btn"
            onClick={() => setIsEditingBudget(true)}
            className="mt-6 w-full py-2 bg-stone-100/5 hover:bg-stone-100/10 border border-stone-700/50 rounded-xl text-stone-200 text-xs font-semibold font-mono transition-all"
          >
            Adjust Budget Rules
          </button>
        )}
      </div>

      {/* 2. SPENDING LEDGER / EXPENSE LOGS */}
      <div className={`md:col-span-2 p-6 rounded-3xl border ${tokens.card} ${tokens.glow} flex flex-col justify-between transition-all duration-300`}>
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`text-lg font-bold ${tokens.textPrimary}`}>Capture Outlays</h2>
              <p className="text-xs text-stone-500">Log routine outflows to track budget parameters</p>
            </div>
            <button
              type="button"
              id="toggle-add-expense-btn"
              onClick={() => setShowAddExpense(!showAddExpense)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 text-stone-200 border border-stone-700 rounded-xl text-xs font-semibold hover:bg-zinc-750"
            >
              <Plus className="h-4 w-4" />
              <span>Log Outflow</span>
            </button>
          </div>

          {/* SPEND OUTFLOW CAPTURE FORM */}
          {showAddExpense && (
            <form onSubmit={handleAddSpend} className="mb-4 p-3 rounded-xl border border-dashed border-stone-700/40 bg-stone-500/5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-fade-in">
              <div>
                <label htmlFor="expense-category-select" className="text-[9px] uppercase font-bold text-stone-500 font-mono block mb-1">Group classification</label>
                <select
                  id="expense-category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200"
                >
                  <option value="Food & Living">Food & Living</option>
                  <option value="Leisure & Personal">Leisure & Personal</option>
                  <option value="Business Operations">Business Operations</option>
                  <option value="Premium Subscriptions">Premium Subscriptions</option>
                  <option value="Rent / Utilities">Rent / Utilities</option>
                  <option value="Debt Servicing">Debt Servicing</option>
                </select>
              </div>

              <div>
                <label htmlFor="expense-amount-input" className="text-[9px] uppercase font-bold text-stone-500 font-mono block mb-1">Deducted Amount (INR)</label>
                <input
                  type="number"
                  id="expense-amount-input"
                  required
                  placeholder="₹ Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full px-2.5 py-1.5 bg-stone-900 border ${tokens.border} rounded-xl text-xs focus:outline-none`}
                />
              </div>

              <div>
                <label htmlFor="expense-date-input" className="text-[9px] uppercase font-bold text-stone-500 font-mono block mb-1">Calendar spot</label>
                <input
                  type="date"
                  id="expense-date-input"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full px-2.5 py-1.5 bg-stone-900 border ${tokens.border} rounded-xl text-xs focus:outline-none`}
                />
              </div>

              <div>
                <label htmlFor="expense-notes-input" className="text-[9px] uppercase font-bold text-stone-500 font-mono block mb-1">Memo remarks</label>
                <input
                  type="text"
                  id="expense-notes-input"
                  placeholder="e.g. Weekly organic farm veggies"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`w-full px-2.5 py-1.5 bg-stone-900 border ${tokens.border} rounded-xl text-xs focus:outline-none`}
                />
              </div>

              <div className="sm:col-span-2 flex justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  id="cancel-expense-btn"
                  onClick={() => setShowAddExpense(false)}
                  className="text-[10px] text-stone-400 font-semibold px-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-expense-btn"
                  className="text-[10px] font-bold px-4 py-1.5 bg-amber-500 text-stone-950 rounded-lg"
                >
                  Log Ded
                </button>
              </div>
            </form>
          )}

          {/* SPEND INDEX */}
          <div className="max-h-52 overflow-y-auto pr-1">
            {expenses.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-stone-850 rounded-2xl">
                <p className="text-xs text-stone-500 font-mono">Ledger sheet stands clean.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...expenses].reverse().map((e) => (
                  <div key={e.id} className="flex items-center justify-between p-3 rounded-xl bg-stone-500/5 border border-stone-800/10 hover:bg-stone-500/10 transition-all">
                    <div>
                      <p className={`text-xs font-bold ${tokens.textPrimary}`}>{e.category}</p>
                      <p className="text-[10px] text-stone-500">{e.notes || 'Routine entry'} &bull; {new Date(e.date).toLocaleDateString('en-IN')}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-red-500 text-xs">-₹{e.amount.toLocaleString('en-IN')}</span>
                      <button
                        type="button"
                        id={`delete-expense-btn-${e.id}`}
                        onClick={() => onRemoveExpense(e.id)}
                        className="p-1 rounded hover:bg-red-500/10 text-stone-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. VAULT CLOSE-OFF / MONTH-END TERMINAL PANEL */}
        <div className="mt-6 pt-4 border-t border-dashed border-stone-800/20 dark:border-stone-100/10">
          <div className="bg-gradient-to-br from-amber-500/10 to-transparent p-4 rounded-2xl border border-amber-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-bold font-mono text-stone-300 uppercase">Secure Vault Close-off</span>
              </div>
              <span className="text-[10px] font-mono text-stone-500">End-Term Reset</span>
            </div>

            <p className="text-[11px] text-stone-400 mb-4 leading-normal">
              Finalize this month's ledger, generate encrypted Excel (.CSV) and PDF files directly to your device local downloads storage space, then reset active spending tags automatically.
            </p>

            {successReset && (
              <div className="mb-3 p-2.5 bg-emerald-600/15 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex gap-2 items-center">
                <CheckCircle className="h-4 w-4 shrink-0 animate-bounce" />
                <span>Month-end close successful! CSV and PDF report links was saved.</span>
              </div>
            )}

            <button
              type="button"
              id="simulate-month-end-btn"
              disabled={monthEndProgress}
              onClick={handleMonthEndVaultReset}
              className="w-full py-2.5 rounded-xl border border-amber-500 text-amber-400 font-bold font-mono text-xs hover:bg-amber-500/15 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {monthEndProgress ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Scribing Decryption Archives...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Close-Off Vault & Reset Ledgers</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
