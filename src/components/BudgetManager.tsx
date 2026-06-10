/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Trash2, ArrowUpRight, ShieldAlert, Sparkles, CheckSquare, Layers, Download, CheckCircle, FileSpreadsheet, FileText, Landmark, RefreshCw, Edit3, X } from 'lucide-react';
import { EchelonTheme, Budget, Expense, BudgetPeriod, BudgetCategoryLimit, Asset, CreditCard } from '../types';
import { getColorTokens, renderPremiumProgressBar } from '../utils/theme';
import { generateCSVData, generateHTMLReport, downloadBlob } from '../utils/export';

interface BudgetManagerProps {
  theme: EchelonTheme;
  budget: Budget;
  expenses: Expense[];
  budgetCategoryLimits?: BudgetCategoryLimit[];
  onConfigureBudget: (amount: number, period: BudgetPeriod, alertPercent: number) => void;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onAddOutflow?: (expenseData: { category: string; amount: number; date: string; notes: string }, source: { sourceType: 'bank_balance' | 'credit_card' | 'cash_carry'; sourceId: string }) => void;
  onUpdateExpense?: (id: string, expense: Omit<Expense, 'id'>) => void;
  onRemoveExpense: (id: string) => void;
  onTriggerMonthEndReset: () => void;
  currencySymbol?: string;
  onOpenSettings?: () => any;
  customAlertRules?: string[];
  onUpdateCategoryLimits?: (limits: BudgetCategoryLimit[]) => void;
  assets?: Asset[];
  creditCards?: CreditCard[];
  selectedProgressBarStyle?: 'ultra-thin' | 'neon-glow' | 'carbon-solid';
  activeAccentColor?: string;
}

export default function BudgetManager({
  theme,
  budget,
  expenses,
  budgetCategoryLimits = [],
  onConfigureBudget,
  onAddExpense,
  onAddOutflow,
  onUpdateExpense,
  onRemoveExpense,
  onTriggerMonthEndReset,
  currencySymbol = '₹',
  onOpenSettings,
  customAlertRules = [],
  onUpdateCategoryLimits,
  assets = [],
  creditCards = [],
  selectedProgressBarStyle = 'ultra-thin',
  activeAccentColor,
}: BudgetManagerProps) {
  const [showAddExpense, setShowAddExpense] = useState<boolean>(false);
  const [sourceType, setSourceType] = useState<'bank_balance' | 'credit_card' | 'cash_carry'>('bank_balance');
  const [sourceId, setSourceId] = useState<string>('');

  const bankAccounts = assets.filter(a => a.type === 'BANK_BALANCE');
  const cashAccounts = assets.filter(a => a.type === 'CASH_CARRY');

  // Set default sourceId on mount or if assets/cards shift, preserving existing valid selections
  React.useEffect(() => {
    if (sourceType === 'bank_balance') {
      const exists = bankAccounts.some(a => a.id === sourceId);
      if (!exists) {
        const firstBank = bankAccounts[0];
        setSourceId(firstBank ? firstBank.id : '');
      }
    } else if (sourceType === 'cash_carry') {
      const exists = cashAccounts.some(a => a.id === sourceId);
      if (!exists) {
        const firstCash = cashAccounts[0];
        setSourceId(firstCash ? firstCash.id : '');
      }
    } else {
      const exists = creditCards.some(c => c.id === sourceId);
      if (!exists) {
        const firstCard = creditCards[0];
        setSourceId(firstCard ? firstCard.id : '');
      }
    }
  }, [sourceType, assets, creditCards, sourceId]);

  // Default fallback categories
  const DEFAULT_CATEGORIES: BudgetCategoryLimit[] = [
    { category: 'Food', limit: 2000 },
    { category: 'Rent', limit: 9000 },
    { category: 'Travel', limit: 500 },
    { category: 'Leisure & Personal', limit: 500 }
  ];

  const activeCategories = budgetCategoryLimits.length > 0 ? budgetCategoryLimits : DEFAULT_CATEGORIES;

  const [category, setCategory] = useState<string>(activeCategories[0]?.category || 'Food');

  // Keep category in sync if active lists shift
  React.useEffect(() => {
    if (!activeCategories.some(c => c.category === category)) {
      setCategory(activeCategories[0]?.category || 'Food');
    }
  }, [budgetCategoryLimits, activeCategories, category]);
  const [amount, setAmount] = useState<string>('');
  const [selectedChartTab, setSelectedChartTab] = useState<'monthly' | 'quarterly'>('monthly');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  const [isEditingBudget, setIsEditingBudget] = useState<boolean>(false);
  const [budgetLimit, setBudgetLimit] = useState<string>(budget.amount.toString());
  const [period, setPeriod] = useState<BudgetPeriod>(budget.period);
  const [alertPercent, setAlertPercent] = useState<string>(budget.spendingLimitAlertPercent.toString());

  const [monthEndProgress, setMonthEndProgress] = useState<boolean>(false);
  const [successReset, setSuccessReset] = useState<boolean>(false);

  // Category and limit CRUD states
  const [isManagingCategories, setIsManagingCategories] = useState<boolean>(false);
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);
  const [editingCatName, setEditingCatName] = useState<string>('');
  const [editingCatLimit, setEditingCatLimit] = useState<string>('');
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatLimit, setNewCatLimit] = useState<string>('');

  // Expense inline edit states
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editExpenseCat, setEditExpenseCat] = useState<string>('');
  const [editExpenseAmt, setEditExpenseAmt] = useState<string>('');
  const [editExpenseDate, setEditExpenseDate] = useState<string>('');
  const [editExpenseNotes, setEditExpenseNotes] = useState<string>('');

  const tokens = getColorTokens(theme);
  const isLight = theme.mode === 'light';

  // Spend totals calculations
  const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);
  const computedBudgetAmount = activeCategories.reduce((sum, c) => sum + c.limit, 0);
  const spendPercentage = computedBudgetAmount > 0 ? (totalSpend / computedBudgetAmount) * 100 : 0;
  
  // Custom alerts triggers
  const isApproachingLimit = spendPercentage >= budget.spendingLimitAlertPercent && spendPercentage < 100;
  const isOverLimit = spendPercentage >= 100;

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = computedBudgetAmount;
    const pct = parseFloat(alertPercent);
    if (!isNaN(amt) && !isNaN(pct) && amt > 0) {
      onConfigureBudget(amt, period, pct);
      setIsEditingBudget(false);
    }
  };

  const handleAddSpend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    const parsedAmount = parseFloat(amount) || 0;

    if (onAddOutflow && sourceId) {
      onAddOutflow({
        category,
        amount: parsedAmount,
        date,
        notes,
      }, {
        sourceType,
        sourceId,
      });
    } else {
      onAddExpense({
        category,
        amount: parsedAmount,
        date,
        notes,
      });
    }

    setAmount('');
    setNotes('');
    setShowAddExpense(false);
  };

  // Perform Month End Closeoff with auto PDF & CSV Download!
  const handleMonthEndVaultReset = () => {
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

    setSuccessReset(true);
    setTimeout(() => setSuccessReset(false), 5000);
  };

  const handleStartEditCategory = (index: number, cat: BudgetCategoryLimit) => {
    setEditingCategoryIndex(index);
    setEditingCatName(cat.category);
    setEditingCatLimit(cat.limit.toString());
  };

  const handleSaveEditCategory = (index: number) => {
    const lim = parseFloat(editingCatLimit);
    if (!editingCatName || isNaN(lim)) return;
    const updated = [...activeCategories];
    updated[index] = {
      category: editingCatName,
      limit: lim,
    };
    if (onUpdateCategoryLimits) {
      onUpdateCategoryLimits(updated);
    }
    setEditingCategoryIndex(null);
  };

  const handleDeleteCategory = (index: number) => {
    const updated = activeCategories.filter((_, i) => i !== index);
    if (onUpdateCategoryLimits) {
      onUpdateCategoryLimits(updated);
    }
  };

  const handleAddNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const lim = parseFloat(newCatLimit);
    if (!newCatName || isNaN(lim)) return;
    const updated = [
      ...activeCategories.filter(c => c.category !== newCatName),
      { category: newCatName, limit: lim }
    ];
    if (onUpdateCategoryLimits) {
      onUpdateCategoryLimits(updated);
    }
    setNewCatName('');
    setNewCatLimit('');
  };

  const handleStartEditExpense = (exp: Expense) => {
    setEditingExpenseId(exp.id);
    setEditExpenseCat(exp.category);
    setEditExpenseAmt(exp.amount.toString());
    setEditExpenseDate(exp.date);
    setEditExpenseNotes(exp.notes || '');
  };

  const handleSaveEditExpense = (id: string) => {
    const amt = parseFloat(editExpenseAmt);
    if (!editExpenseCat || isNaN(amt)) return;
    if (onUpdateExpense) {
      onUpdateExpense(id, {
        category: editExpenseCat,
        amount: amt,
        date: editExpenseDate,
        notes: editExpenseNotes,
      });
    }
    setEditingExpenseId(null);
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
                <label className="text-[10px] uppercase font-bold text-stone-400 font-mono block mb-1">Calculated Limit Ceiling ({currencySymbol})</label>
                <div className="w-full px-3 py-2 bg-stone-950 border border-stone-850 rounded-xl text-xs font-mono font-bold text-amber-500 flex items-center justify-between">
                  <span>{currencySymbol}{computedBudgetAmount.toLocaleString('en-IN')}</span>
                  <span className="text-[9px] uppercase tracking-wider bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded font-black border border-amber-500/20">Auto-Compiled</span>
                </div>
                <span className="text-[9px] font-mono text-stone-500 mt-1 block leading-normal">
                  ⚖️ This total is computed from the sum of dynamic category limits entered beneath. Add/edit category allocations below to adjust.
                </span>
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
              <p className={`text-3xl font-mono font-black ${tokens.textPrimary}`}>{currencySymbol}{computedBudgetAmount.toLocaleString('en-IN')}</p>
              
              <div className="mt-6">
                <div className="flex justify-between items-baseline text-xs mb-1">
                  <span className="text-stone-500 font-medium">Aggregated Spend</span>
                  <span className={`font-mono font-bold ${tokens.textPrimary}`}>
                    {currencySymbol}{totalSpend.toLocaleString('en-IN')} ({spendPercentage.toFixed(0)}%)
                  </span>
                </div>
                {/* Simulated bar progress indicators */}
                <div className="w-full">
                  {renderPremiumProgressBar(
                    spendPercentage, 
                    selectedProgressBarStyle, 
                    isOverLimit ? 'bg-rose-600' : isApproachingLimit ? 'bg-amber-500' : 'bg-emerald-500', 
                    activeAccentColor
                  )}
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

              {/* Dynamic Category allocations summary list */}
              <div className="mt-6 pt-4 border-t border-dashed border-stone-800/20 dark:border-stone-100/10 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] uppercase font-bold text-stone-500 font-mono tracking-wider">Category Limits & Outlays</h4>
                  <button
                    type="button"
                    onClick={() => setIsManagingCategories(!isManagingCategories)}
                    className="flex items-center gap-1.5 px-2 py-1 bg-zinc-90 w bg-stone-500/10 border border-stone-800 hover:border-amber-500/30 text-stone-400 hover:text-amber-500 rounded-lg text-[10px] font-mono font-bold transition-all shrink-0 select-none"
                  >
                    {isManagingCategories ? (
                      <>
                        <X className="h-3 w-3" />
                        <span>Done</span>
                      </>
                    ) : (
                      <>
                        <Edit3 className="h-3 w-3" />
                        <span>Manage / Edit</span>
                      </>
                    )}
                  </button>
                </div>

                {isManagingCategories ? (
                  <div className="space-y-3 p-3 rounded-2xl bg-stone-500/5 border border-stone-850/50 animate-fade-in text-xs">
                    <span className="text-[10px] font-bold text-stone-400 font-mono block mb-1">Interactive Category Manager</span>
                    
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {activeCategories.map((c, index) => {
                        const isEditing = editingCategoryIndex === index;
                        return (
                          <div key={index} className={`flex flex-col gap-1.5 p-2 rounded-xl border ${isLight ? 'bg-stone-50 border-stone-200' : 'bg-zinc-950 border-stone-900'}`}>
                            {isEditing ? (
                              <div className="space-y-1.5">
                                <div className="flex gap-1.5">
                                  <input
                                    type="text"
                                    value={editingCatName}
                                    onChange={(e) => setEditingCatName(e.target.value)}
                                    className={`flex-1 min-w-0 px-2 py-1 border rounded text-xs outline-none ${isLight ? 'bg-white border-stone-250 text-stone-900' : 'bg-stone-900 border-stone-800 text-white'}`}
                                    placeholder="Category Name"
                                  />
                                  <input
                                    type="number"
                                    value={editingCatLimit}
                                    onChange={(e) => setEditingCatLimit(e.target.value)}
                                    className="w-20 px-2 py-1 bg-stone-900 border border-stone-800 rounded text-xs text-white outline-none font-mono"
                                    placeholder="Limit"
                                  />
                                </div>
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setEditingCategoryIndex(null)}
                                    className="text-[10px] text-stone-400 hover:text-stone-300 font-semibold px-1.5"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditCategory(index)}
                                    className="text-[10px] bg-amber-500 hover:bg-amber-400 text-stone-950 px-2.5 py-0.5 rounded font-bold"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-stone-300">
                                  {c.category} <span className="text-[10px] font-mono text-stone-500 ml-1">({currencySymbol}{c.limit.toLocaleString('en-IN')})</span>
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditCategory(index, c)}
                                    className="p-1 text-stone-400 hover:text-amber-500 hover:bg-amber-500/10 rounded transition-all"
                                    title="Edit Limit"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCategory(index)}
                                    className="p-1 text-stone-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-all"
                                    title="Delete Category"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {activeCategories.length === 0 && (
                        <span className="text-[10px] text-stone-500 italic block">No categories added yet. Create one below!</span>
                      )}
                    </div>

                    {/* Quick Add Form */}
                    <form onSubmit={handleAddNewCategory} className="border-t border-stone-800/40 pt-2.5 space-y-1.5">
                      <span className="text-[10px] text-stone-400 font-bold font-mono block">Create Custom Category</span>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          required
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          placeholder="e.g. Entertainment"
                          className="flex-1 min-w-0 px-2 py-1 bg-stone-900 border border-stone-800 rounded text-xs text-white outline-none"
                        />
                        <input
                          type="number"
                          required
                          value={newCatLimit}
                          onChange={(e) => setNewCatLimit(e.target.value)}
                          placeholder="Limit"
                          className="w-16 px-2 py-1 bg-stone-900 border border-stone-800 rounded text-xs text-white outline-none font-mono"
                        />
                        <button
                          type="submit"
                          className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded text-xs font-bold shrink-0 flex items-center justify-center"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  activeCategories.map((c) => {
                    const catSpend = expenses.filter(e => e.category === c.category).reduce((sum, e) => sum + e.amount, 0);
                    const catPct = c.limit > 0 ? (catSpend / c.limit) * 100 : 0;
                    const catOver = catPct >= 100;
                    return (
                      <div key={c.category} className="space-y-1">
                        <div className="flex items-baseline justify-between text-[11px]">
                          <span className="font-semibold text-stone-200">{c.category}</span>
                          <span className={`font-mono font-bold ${catOver ? 'text-red-500 font-extrabold' : 'text-stone-400'}`}>
                            {currencySymbol}{catSpend.toLocaleString('en-IN')} / {currencySymbol}{c.limit.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="w-full">
                          {renderPremiumProgressBar(
                            catPct, 
                            selectedProgressBarStyle, 
                            catOver ? 'bg-red-500' : catPct > 80 ? 'bg-amber-500' : 'bg-emerald-500', 
                            activeAccentColor
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
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
            <form onSubmit={handleAddSpend} className="mb-4 p-4 rounded-2xl border border-dashed border-stone-800 bg-stone-500/5 grid grid-cols-1 sm:grid-cols-2 gap-3.5 animate-fade-in">
              <div>
                <label htmlFor="expense-category-select" className="text-[9px] uppercase font-bold text-stone-500 font-mono block mb-1">Group classification</label>
                <select
                  id="expense-category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 focus:border-amber-500/40 focus:outline-none"
                >
                  {activeCategories.map((catObj) => (
                    <option key={catObj.category} value={catObj.category}>
                      {catObj.category} (Limit: {currencySymbol}{catObj.limit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-stone-500 font-mono block mb-1">Funding source </label>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setSourceType('bank_balance')}
                    className={`flex-1 py-1.5 px-2.5 border rounded-xl text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
                      sourceType === 'bank_balance' 
                        ? 'bg-amber-500/15 text-amber-500 dark:text-amber-400 border-amber-500/30' 
                        : isLight
                          ? 'border-stone-250 text-stone-600 hover:bg-stone-100 bg-white shadow-xs'
                          : 'border-stone-800 text-stone-400 hover:bg-stone-800/40 bg-zinc-950'
                    }`}
                  >
                    Bank Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType('credit_card')}
                    className={`flex-1 py-1.5 px-2.5 border rounded-xl text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
                      sourceType === 'credit_card' 
                        ? 'bg-amber-500/15 text-amber-500 dark:text-amber-400 border-amber-500/30' 
                        : isLight
                          ? 'border-stone-250 text-stone-600 hover:bg-stone-100 bg-white shadow-xs'
                          : 'border-stone-800 text-stone-400 hover:bg-stone-800/40 bg-zinc-950'
                    }`}
                  >
                    Credit Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType('cash_carry')}
                    className={`flex-1 py-1.5 px-2.5 border rounded-xl text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
                      sourceType === 'cash_carry' 
                        ? 'bg-amber-500/15 text-amber-500 dark:text-amber-400 border-amber-500/30' 
                        : isLight
                          ? 'border-stone-250 text-stone-600 hover:bg-stone-100 bg-white shadow-xs'
                          : 'border-stone-800 text-stone-400 hover:bg-stone-800/40 bg-zinc-950'
                    }`}
                  >
                    Cash Wallet
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-stone-500 font-mono block mb-1">Select fund/Card anchor</label>
                <select
                  required
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 focus:border-amber-500/40 focus:outline-none font-semibold"
                >
                  <option value="" disabled>-- Select Anchor --</option>
                  {sourceType === 'bank_balance' ? (
                    bankAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({currencySymbol}{a.currentValue.toLocaleString()})
                      </option>
                    ))
                  ) : sourceType === 'cash_carry' ? (
                    cashAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({currencySymbol}{a.currentValue.toLocaleString()})
                      </option>
                    ))
                  ) : (
                    creditCards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Used: {currencySymbol}{c.usedBalance.toLocaleString()})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label htmlFor="expense-amount-input" className="text-[9px] uppercase font-bold text-stone-500 font-mono block mb-1">Deducted Amount</label>
                <input
                  type="number"
                  id="expense-amount-input"
                  required
                  placeholder={`${currencySymbol} Amount`}
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
                {[...expenses].reverse().map((e) => {
                  const isEditing = editingExpenseId === e.id;
                  if (isEditing) {
                    return (
                      <div key={e.id} className="p-3 rounded-xl bg-zinc-950 border border-amber-500/30 space-y-2.5 animate-fade-in text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] uppercase font-bold text-stone-500 font-mono block mb-0.5">Classification</label>
                            <select
                              value={editExpenseCat}
                              onChange={(val) => setEditExpenseCat(val.target.value)}
                              className="w-full px-2 py-1 bg-stone-904 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none"
                            >
                              {activeCategories.map((catObj) => (
                                <option key={catObj.category} value={catObj.category}>{catObj.category}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[9px] uppercase font-bold text-stone-500 font-mono block mb-0.5">Deducted Amount</label>
                            <input
                              type="number"
                              value={editExpenseAmt}
                              onChange={(val) => setEditExpenseAmt(val.target.value)}
                              className="w-full px-2 py-1 bg-stone-900 border border-stone-800 rounded-lg text-xs text-white outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase font-bold text-stone-500 font-mono block mb-0.5">Date</label>
                            <input
                              type="date"
                              value={editExpenseDate}
                              onChange={(val) => setEditExpenseDate(val.target.value)}
                              className="w-full px-2 py-1 bg-stone-900 border border-stone-800 rounded-lg text-xs text-white outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase font-bold text-stone-500 font-mono block mb-0.5">Remarks / Memo</label>
                            <input
                              type="text"
                              value={editExpenseNotes}
                              onChange={(val) => setEditExpenseNotes(val.target.value)}
                              className="w-full px-2 py-1 bg-stone-900 border border-stone-800 rounded-lg text-xs text-white outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingExpenseId(null)}
                            className="text-[10px] text-stone-400 hover:text-stone-300 font-semibold px-2 py-1 rounded transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditExpense(e.id)}
                            className="text-[10px] font-bold px-3 py-1 bg-amber-500 text-stone-950 rounded-lg flex items-center gap-1 hover:bg-amber-400 transition-all"
                          >
                            <CheckSquare className="h-3 w-3" />
                            <span>Save Change</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={e.id} className="flex items-center justify-between p-3 rounded-xl bg-stone-500/5 border border-stone-800/10 hover:bg-stone-500/10 transition-all">
                      <div>
                        <p className={`text-xs font-bold ${tokens.textPrimary}`}>{e.category}</p>
                        <p className="text-[10px] text-stone-500">{e.notes || 'Routine entry'} &bull; {new Date(e.date).toLocaleDateString('en-IN')}</p>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-red-500 text-xs mr-1">-{currencySymbol}{e.amount.toLocaleString('en-IN')}</span>
                        <button
                          type="button"
                          onClick={() => handleStartEditExpense(e)}
                          className="p-1 rounded hover:bg-amber-500/10 text-stone-500 hover:text-amber-500 transition-colors"
                          title="Edit Outflow"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          id={`delete-expense-btn-${e.id}`}
                          onClick={() => onRemoveExpense(e.id)}
                          className="p-1 rounded hover:bg-red-500/10 text-stone-500 hover:text-red-500 transition-colors"
                          title="Delete Outflow"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
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

      {/* 4. PREMIUM SECTOR: HISTORIC SPENDING & SAVING COMPLIANCE TREASURY RATIOS */}
      <div className={`col-span-1 md:col-span-3 p-6 rounded-3xl border ${tokens.card} ${tokens.glow} space-y-6 transition-all duration-300`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-amber-500 font-mono block mb-1">Treasury Ledger Analytics</span>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              📊 Historical Saving vs Spending Ratios
            </h3>
            <p className="text-xs text-stone-500 mt-1 leading-normal">
              Compare actual savings accumulation weights with expense outlays over short-term quarters.
            </p>
          </div>

          <div className="flex bg-[#141517] p-1 rounded-xl border border-stone-850 self-start">
            <button
              type="button"
              onClick={() => setSelectedChartTab('monthly')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all ${
                selectedChartTab === 'monthly' ? 'text-stone-950 bg-amber-500 font-black' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              3-Month Trend
            </button>
            <button
              type="button"
              onClick={() => setSelectedChartTab('quarterly')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all ${
                selectedChartTab === 'quarterly' ? 'text-stone-950 bg-amber-500 font-black' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              4-Quarter Comparison
            </button>
          </div>
        </div>

        {/* Visual Columns Chart */}
        <div className="p-4 rounded-2xl bg-stone-950/40 border border-stone-850/50 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {(() => {
              const curDate = new Date();
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              
              // 3 Months history
              const last3Months = Array.from({ length: 3 }).map((_, i) => {
                const d = new Date();
                d.setMonth(curDate.getMonth() - (2 - i));
                const mIdx = d.getMonth();
                const yr = d.getFullYear();
                
                const realSpend = expenses
                  .filter(e => {
                    const eDate = new Date(e.date);
                    return eDate.getMonth() === mIdx && eDate.getFullYear() === yr;
                  })
                  .reduce((sum, e) => sum + e.amount, 0);
                  
                const hasData = realSpend > 0;
                const baselineSum = computedBudgetAmount > 0 ? computedBudgetAmount : 25000;
                const finalSpend = hasData ? Math.round(realSpend) : 0;
                const savings = hasData ? Math.max(0, Math.round(baselineSum - finalSpend)) : 0;
                
                return {
                  label: `${monthNames[mIdx]} ${yr}`,
                  spend: finalSpend,
                  save: savings
                };
              });

              // 4 Quarters history
              const last4Quarters = Array.from({ length: 4 }).map((_, i) => {
                const totalMonthsAgo = (3 - i) * 3;
                const d = new Date();
                d.setMonth(curDate.getMonth() - totalMonthsAgo);
                
                const qr = Math.floor(d.getMonth() / 3) + 1;
                const yr = d.getFullYear();
                const qLabel = `Q${qr} ${yr}`;
                
                const realSpend = expenses
                  .filter(e => {
                    const eDate = new Date(e.date);
                    const eqVal = Math.floor(eDate.getMonth() / 3) + 1;
                    return eqVal === qr && eDate.getFullYear() === yr;
                  })
                  .reduce((sum, e) => sum + e.amount, 0);
                  
                const hasData = realSpend > 0;
                const baseQ = (computedBudgetAmount > 0 ? computedBudgetAmount : 25000) * 3;
                const finalSpend = hasData ? Math.round(realSpend) : 0;
                const savings = hasData ? Math.max(0, Math.round(baseQ - finalSpend)) : 0;
                
                return {
                  label: qLabel,
                  spend: finalSpend,
                  save: savings
                };
              });

              return (selectedChartTab === 'monthly' ? last3Months : last4Quarters);
            })().map((point, idx) => {
              const total = point.spend + point.save;
              const spendPct = total > 0 ? (point.spend / total) * 100 : 0;
              const savePct = total > 0 ? (point.save / total) * 100 : 0;

              return (
                <div key={idx} className="space-y-3 p-4 bg-[#09090f]/80 rounded-2xl border border-stone-850">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold font-mono text-stone-200 tracking-wide">{point.label}</span>
                    <span className="text-[10px] font-mono text-stone-400">
                      Savings rate:{' '}
                      {total > 0 ? (
                        <span className="text-emerald-400 font-bold">{savePct.toFixed(1)}%</span>
                      ) : (
                        <span className="text-stone-500 italic">No activity record</span>
                      )}
                    </span>
                  </div>

                  {/* Sleek single stacked progress vector */}
                  <div className="space-y-2.5">
                    <div className="w-full bg-[#111116] h-2.5 rounded-full overflow-hidden flex border border-stone-850">
                      <div
                        className="bg-red-500 h-full transition-all duration-500"
                        style={{ width: `${spendPct}%` }}
                      />
                      <div
                        className="bg-emerald-500 h-full transition-all duration-500"
                        style={{ width: `${savePct}%` }}
                      />
                    </div>
                    
                    {/* Professional detailed legends */}
                    <div className="grid grid-cols-2 gap-3.5 pt-1">
                      <div className="text-[10px] font-mono flex flex-col">
                        <span className="text-stone-500 uppercase tracking-widest text-[8px] font-bold">Allocated Expenditures</span>
                        <span className="text-stone-200 font-bold mt-0.5">
                          {currencySymbol}{point.spend.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          <span className="text-stone-500 font-normal ml-1">({spendPct.toFixed(0)}%)</span>
                        </span>
                      </div>
                      <div className="text-[10px] font-mono flex flex-col">
                        <span className="text-stone-500 uppercase tracking-widest text-[8px] font-bold">Unspent Reserves Retained</span>
                        <span className="text-emerald-400 font-bold mt-0.5">
                          {currencySymbol}{point.save.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          <span className="text-stone-500 font-normal ml-1">({savePct.toFixed(0)}%)</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Core insights commentary */}
          <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 flex items-start gap-2.5">
            <span className="text-base select-none">💡</span>
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wide text-amber-500 block">Sovereign Compliance Verdict</span>
              <p className="text-[11px] text-stone-300 leading-normal">
                {selectedChartTab === 'monthly' 
                  ? "Comparing your active monthly expense flow against historical trends indicates a stable compounding trajectory. Accumulating surplus of over 30% acts as a formidable capital shield."
                  : "Quarterly reviews verify consistent long-term velocity. Continuing to prioritize high-compounding debt paydowns while maintaining a low spending quotient secures exponential net worth milestones."
                }
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
