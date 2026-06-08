/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, IndianRupee, ShieldAlert, ArrowUpRight, ArrowDownRight, RefreshCw, Calendar } from 'lucide-react';
import { EchelonTheme, Loan, LoanType, CompoundingFrequency, Asset, CreditCard } from '../types';
import { getColorTokens, renderPremiumProgressBar } from '../utils/theme';
import { calculateLoanCurrentBalance, calculateLoanAccruedInterest } from '../utils/math';

interface LoanCompounderProps {
  theme: EchelonTheme;
  loans: Loan[];
  onAddLoan: (loan: Omit<Loan, 'id' | 'lastUpdated'>) => void;
  onUpdateLoan?: (id: string, loan: Omit<Loan, 'id' | 'lastUpdated'>) => void;
  onAddLoanRepayment: (id: string, amount: number) => void;
  onRemoveLoan: (id: string) => void;
  currencySymbol?: string;
  onOpenSettings?: () => any;
  creditCards?: CreditCard[];
  assets?: Asset[];
  onAddCreditCard?: (card: Omit<CreditCard, 'id'>) => void;
  onRemoveCreditCard?: (id: string) => void;
  onSimulateStatement?: (id: string) => void;
  onPayCreditCardBill?: (cardId: string, amount: number, bankAccountId: string) => void;
  onUpdateCreditCardAlerts?: (cardId: string, remainingLimitAlert?: number, usedLimitPctAlert?: number) => void;
  selectedProgressBarStyle?: 'ultra-thin' | 'neon-glow' | 'carbon-solid';
  activeAccentColor?: string;
}

export default function LoanCompounder({
  theme,
  loans,
  onAddLoan,
  onUpdateLoan,
  onAddLoanRepayment,
  onRemoveLoan,
  currencySymbol = '₹',
  onOpenSettings,
  creditCards = [],
  assets = [],
  onAddCreditCard,
  onRemoveCreditCard,
  onSimulateStatement,
  onPayCreditCardBill,
  onUpdateCreditCardAlerts,
  selectedProgressBarStyle = 'ultra-thin',
  activeAccentColor,
}: LoanCompounderProps) {
  const [subTab, setSubTab] = useState<'loans' | 'cards'>('loans');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [showCardAddForm, setShowCardAddForm] = useState<boolean>(false);

  // Credit Card Creation States
  const [cardName, setCardName] = useState<string>('');
  const [cardLimit, setCardLimit] = useState<string>('');
  const [cardBalance, setCardBalance] = useState<string>('0');
  const [cardApr, setCardApr] = useState<string>('36'); // 36% standard apr
  const [cardStatementDate, setCardStatementDate] = useState<string>('15'); // 15th of the month
  const [cardBufferDays, setCardBufferDays] = useState<string>('20'); // 20 days payment grace window
  const [cardAlertRemaining, setCardAlertRemaining] = useState<string>('5000');
  const [cardAlertPct, setCardAlertPct] = useState<string>('80');

  // Credit Card Repayment & Alert UI state handlers
  const [activePayCardId, setActivePayCardId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payBankAccountId, setPayBankAccountId] = useState<string>('');

  const [activeAlertCardId, setActiveAlertCardId] = useState<string | null>(null);
  const [alertRemainingInput, setAlertRemainingInput] = useState<string>('');
  const [alertPctInput, setAlertPctInput] = useState<string>('');

  // Loan states
  const [name, setName] = useState<string>('');
  const [personOrEntity, setPersonOrEntity] = useState<string>('');
  const [type, setType] = useState<LoanType>(LoanType.BORROWED);
  const [principal, setPrincipal] = useState<string>('');
  const [interestRate, setInterestRate] = useState<string>('');
  const [compoundingFrequency, setCompoundingFrequency] = useState<CompoundingFrequency>(CompoundingFrequency.MONTHLY);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  // Repay state
  const [repayId, setRepayId] = useState<string | null>(null);
  const [repayVal, setRepayVal] = useState<string>('');

  // Dynamic ticking counter to highlight standard live compounding!
  const [tick, setTick] = useState<number>(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 5000); // update live balances every 5 secs to give the compounding "live tracking" feel
    return () => clearInterval(timer);
  }, []);

  const tokens = getColorTokens(theme);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !personOrEntity || !principal || !interestRate) return;

    onAddLoan({
      name,
      personOrEntity,
      type,
      principal: parseFloat(principal) || 0,
      interestRate: parseFloat(interestRate) || 0,
      compoundingFrequency,
      startDate,
      manualPayments: 0,
      notes,
    });

    setName('');
    setPersonOrEntity('');
    setType(LoanType.BORROWED);
    setPrincipal('');
    setInterestRate('');
    setCompoundingFrequency(CompoundingFrequency.MONTHLY);
    setStartDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setShowAddForm(false);
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName || !cardLimit) return;
    if (onAddCreditCard) {
      onAddCreditCard({
        name: cardName,
        totalLimit: parseFloat(cardLimit) || 0,
        usedBalance: parseFloat(cardBalance) || 0,
        apr: parseFloat(cardApr) || 36,
        statementDate: parseInt(cardStatementDate, 10) || 15,
        bufferDays: parseInt(cardBufferDays, 10) || 20,
        alertRemainingLimit: cardAlertRemaining ? parseFloat(cardAlertRemaining) : undefined,
        alertUsedLimitPct: cardAlertPct ? parseFloat(cardAlertPct) : undefined,
      });
    }
    setCardName('');
    setCardLimit('');
    setCardBalance('0');
    setCardApr('36');
    setCardStatementDate('15');
    setCardBufferDays('20');
    setShowCardAddForm(false);
  };

  const handlePaySubmit = (cardId: string) => {
    const amt = parseFloat(payAmount);
    if (!isNaN(amt) && amt > 0 && payBankAccountId && onPayCreditCardBill) {
      onPayCreditCardBill(cardId, amt, payBankAccountId);
      setActivePayCardId(null);
      setPayAmount('');
      setPayBankAccountId('');
    }
  };

  const handleAlertSubmit = (cardId: string) => {
    if (onUpdateCreditCardAlerts) {
      onUpdateCreditCardAlerts(
        cardId, 
        alertRemainingInput ? parseFloat(alertRemainingInput) : undefined, 
        alertPctInput ? parseFloat(alertPctInput) : undefined
      );
      setActiveAlertCardId(null);
      setAlertRemainingInput('');
      setAlertPctInput('');
    }
  };

  const handleApplyRepayment = (id: string) => {
    const pmt = parseFloat(repayVal);
    if (!isNaN(pmt) && pmt > 0) {
      onAddLoanRepayment(id, pmt);
      setRepayId(null);
      setRepayVal('');
    }
  };

  return (
    <div id="holding-loan-compounder" className={`p-6 rounded-3xl border ${tokens.card} ${tokens.glow} transition-all duration-300`}>
      {/* Sub-tab selection */}
      <div className="flex gap-2 border-b border-stone-850 pb-3 mb-6 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setSubTab('loans')}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all ${
            subTab === 'loans'
              ? 'bg-amber-500 text-stone-950 font-black shadow-lg shadow-amber-500/10'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
          }`}
        >
          Compounding Term Loans
        </button>
        <button
          type="button"
          onClick={() => setSubTab('cards')}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all ${
            subTab === 'cards'
              ? 'bg-amber-500 text-stone-950 font-black shadow-lg shadow-amber-500/10'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
          }`}
        >
          Revolving Credit Cards & Debts
        </button>
      </div>

      {subTab === 'loans' ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-xl font-bold ${tokens.textPrimary}`}>Autocompounding Leverage & Debt Ledger</h2>
              <p className="text-xs text-stone-500">Track loans taken or lent with automated compounding timeframes</p>
            </div>
            <button
              type="button"
              id="toggle-add-loan-btn"
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 animate-pulse"
            >
              <Plus className="h-4 w-4" />
              <span>New Loan / Contract</span>
            </button>
          </div>

          {/* ADD FORM */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-2xl border border-dashed border-stone-700/30 dark:border-stone-100/10 bg-stone-500/5 space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="loan-form-name" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Contract / Loan Name</label>
                  <input
                    type="text"
                    id="loan-form-name"
                    required
                    placeholder="e.g. Car Loan, Friend Lent Money"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-3 py-2 bg-stone-500/10 border ${tokens.border} rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-stone-950`}
                  />
                </div>

                <div>
                  <label htmlFor="loan-form-party" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Party / Creditor Name</label>
                  <input
                    type="text"
                    id="loan-form-party"
                    required
                    placeholder="e.g. SBI, Ramesh"
                    value={personOrEntity}
                    onChange={(e) => setPersonOrEntity(e.target.value)}
                    className={`w-full px-3 py-2 bg-stone-500/10 border ${tokens.border} rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-stone-950`}
                  />
                </div>

                <div>
                  <label htmlFor="loan-form-type" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Transaction Nature</label>
                  <select
                    id="loan-form-type"
                    value={type}
                    onChange={(e) => setType(e.target.value as LoanType)}
                    className={`w-full px-3 py-2 bg-stone-950 font-semibold border ${tokens.border} rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-500`}
                  >
                    <option value={LoanType.BORROWED}>Liability (Borrowed Money From Others)</option>
                    <option value={LoanType.LENT}>Credit Asset (Lent Money To Others)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="loan-form-principal" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Original Principal</label>
                  <input
                    type="number"
                    id="loan-form-principal"
                    required
                    min="1"
                    placeholder={`${currencySymbol} Principal`}
                    value={principal}
                    onChange={(e) => setPrincipal(e.target.value)}
                    className={`w-full px-3 py-2 bg-stone-500/10 border ${tokens.border} rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-stone-950`}
                  />
                </div>

                <div>
                  <label htmlFor="loan-form-interest" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Annual Interest Rate (% APY)</label>
                  <input
                    type="number"
                    id="loan-form-interest"
                    required
                    min="0"
                    step="0.01"
                    placeholder="e.g. 8.5 for 8.5%"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className={`w-full px-3 py-2 bg-stone-500/10 border ${tokens.border} rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-stone-950`}
                  />
                </div>

                <div>
                  <label htmlFor="loan-form-frequency" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Compounding Period</label>
                  <select
                    id="loan-form-frequency"
                    value={compoundingFrequency}
                    onChange={(e) => setCompoundingFrequency(e.target.value as CompoundingFrequency)}
                    className={`w-full px-3 py-2 bg-stone-950 font-semibold border ${tokens.border} rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-500`}
                  >
                    <option value={CompoundingFrequency.DAILY}>Compounded Daily (Highest Yield)</option>
                    <option value={CompoundingFrequency.WEEKLY}>Compounded Weekly</option>
                    <option value={CompoundingFrequency.MONTHLY}>Compounded Monthly</option>
                    <option value={CompoundingFrequency.QUARTERLY}>Compounded Quarterly</option>
                    <option value={CompoundingFrequency.YEARLY}>Compounded Annually</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="loan-form-date" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Origination Date</label>
                  <input
                    type="date"
                    id="loan-form-date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`w-full px-3 py-2 bg-stone-500/10 border ${tokens.border} rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-stone-950`}
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="loan-form-notes" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Notes / Terms (Optional)</label>
                  <input
                    type="text"
                    id="loan-form-notes"
                    placeholder="Repayment timeline, collateral details"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={`w-full px-3 py-2 bg-stone-500/10 border ${tokens.border} rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-stone-950`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  id="cancel-loan-btn"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs font-bold text-stone-400 hover:text-stone-300 px-3 py-2 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-loan-btn"
                  className="text-xs font-extrabold px-5 py-2.5 bg-amber-500 text-stone-950 rounded-xl transition-all shadow hover:bg-amber-400"
                >
                  Validate Agreement
                </button>
              </div>
            </form>
          )}

          {/* LOANS GRID DISPLAY */}
          {loans.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-stone-800/15 dark:border-stone-100/10 rounded-2xl">
              <p className="text-xs text-stone-500 font-mono">No credit agreements inside active ledgers.</p>
            </div>
          ) : (
            <div className="space-y-8 animate-fade-in">
              {/* ACTIVE LOANS */}
              {loans.filter(l => calculateLoanCurrentBalance(l) > 0).length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#9ca3af]">
                    Active Debt Contracts & Obligations ({loans.filter(l => calculateLoanCurrentBalance(l) > 0).length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {loans.filter(l => calculateLoanCurrentBalance(l) > 0).map((loan) => {
                      const currentBal = calculateLoanCurrentBalance(loan);
                      const totalAccInterest = calculateLoanAccruedInterest(loan);
                      const isLent = loan.type === LoanType.LENT;

                      return (
                        <div
                          key={loan.id}
                          className={`p-5 rounded-2xl border ${tokens.card} relative overflow-hidden flex flex-col justify-between hover:scale-[1.01] transition-all`}
                        >
                          <div className="absolute top-0 right-0 h-1 w-full bg-gradient-to-r" style={{ backgroundImage: isLent ? 'linear-gradient(to right, #10b981, #059669)' : 'linear-gradient(to right, #ef4444, #dc2626)' }} />

                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className={`text-[9px] font-mono font-bold uppercase rounded-lg px-2.5 py-0.5 flex items-center gap-1 ${isLent ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                {isLent ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                {isLent ? 'LENT (RECEIVABLE)' : 'BORROWED (LIABILITY)'}
                              </span>
                              <button
                                type="button"
                                id={`delete-loan-btn-${loan.id}`}
                                onClick={() => onRemoveLoan(loan.id)}
                                className="h-6 w-6 rounded hover:bg-red-500/20 flex items-center justify-center text-stone-400 hover:text-red-500 transition-colors"
                                title="Forfeit Agreement"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <h3 className={`text-base font-bold ${tokens.textPrimary}`}>{loan.name}</h3>
                            <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>With {loan.personOrEntity} &bull; Started {new Date(loan.startDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                            </p>

                            <div className="bg-stone-500/5 hover:bg-stone-500/10 p-3 rounded-xl mt-4 grid grid-cols-2 gap-2 border border-stone-500/10">
                              <div>
                                <span className="text-[10px] uppercase text-stone-500 font-mono block">Orig. Principal</span>
                                <span className={`text-sm font-semibold font-mono ${tokens.textPrimary}`}>{currencySymbol}{loan.principal.toLocaleString('en-IN')}</span>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase text-stone-500 font-mono block">Compound Rate</span>
                                <span className={`text-sm font-semibold font-mono text-amber-500`}>{loan.interestRate}% APY</span>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase text-stone-500 font-mono block">Compound Int.</span>
                                <span className="text-sm font-semibold font-mono text-amber-600">{currencySymbol}{totalAccInterest.toLocaleString('en-IN')}</span>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase text-stone-500 font-mono block">Total Repaid</span>
                                <span className="text-sm font-semibold font-mono text-stone-400">{currencySymbol}{loan.manualPayments.toLocaleString('en-IN')}</span>
                              </div>
                            </div>

                            <div className="mt-4 flex justify-between items-baseline">
                              <span className="text-xs uppercase font-bold text-stone-500 font-mono">Current Balance</span>
                              <span className={`text-xl font-mono font-black ${isLent ? 'text-emerald-500' : 'text-red-500'}`}>
                                {currencySymbol}{currentBal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-dashed border-stone-800/15 dark:border-stone-100/10 flex items-center justify-between gap-2">
                            {repayId === loan.id ? (
                              <div className="flex items-center gap-1.5 w-full animate-fade-in">
                                <input
                                  type="number"
                                  id={`repay-input-${loan.id}`}
                                  placeholder={`Repayment amount ${currencySymbol}`}
                                  value={repayVal}
                                  onChange={(e) => setRepayVal(e.target.value)}
                                  className={`flex-1 px-2 py-1 bg-stone-900 border ${tokens.border} text-xs font-mono rounded-lg text-stone-200 focus:outline-none focus:border-amber-500`}
                                />
                                <button
                                  type="button"
                                  id={`apply-repayment-btn-${loan.id}`}
                                  onClick={() => handleApplyRepayment(loan.id)}
                                  className="text-[10px] font-bold px-3 py-1.5 bg-emerald-600 text-white rounded-lg"
                                >
                                  Enforce
                                </button>
                                <button
                                  type="button"
                                  id={`cancel-repayment-btn-${loan.id}`}
                                  onClick={() => setRepayId(null)}
                                  className="text-[10px] text-stone-400 font-semibold px-2"
                                >
                                  Back
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="text-[10px] text-stone-500 font-mono font-medium">Automatic {loan.compoundingFrequency.toLowerCase()} period checks active</span>
                                <button
                                  type="button"
                                  id={`start-repayment-btn-${loan.id}`}
                                  onClick={() => { setRepayId(loan.id); setRepayVal(''); }}
                                  className="text-[10px] font-extrabold uppercase px-3 py-1.5 bg-stone-100/5 hover:bg-stone-100/10 text-stone-300 rounded-lg font-mono border border-stone-700/50"
                                >
                                  Repay / Offset
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* COMPLETED / SETTLED LOANS */}
              {loans.filter(l => calculateLoanCurrentBalance(l) <= 0).length > 0 && (
                <div className="space-y-3 pt-4">
                  <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    Isolated & Fully Settled Credit Contracts ({loans.filter(l => calculateLoanCurrentBalance(l) <= 0).length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                    {loans.filter(l => calculateLoanCurrentBalance(l) <= 0).map((loan) => {
                      const totalAccInterest = calculateLoanAccruedInterest(loan);
                      const isLent = loan.type === LoanType.LENT;

                      return (
                        <div
                          key={loan.id}
                          className="p-5 rounded-2xl border border-emerald-950/45 bg-[#03150d]/40 relative overflow-hidden flex flex-col justify-between shadow-lg shadow-emerald-950/10"
                        >
                          <div className="absolute top-0 right-0 h-1 w-full bg-[#059669]" />

                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[9px] font-mono font-bold uppercase rounded-lg px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                ✓ Fully Settled
                              </span>
                              <button
                                type="button"
                                id={`delete-loan-btn-${loan.id}`}
                                onClick={() => onRemoveLoan(loan.id)}
                                className="h-6 w-6 rounded hover:bg-emerald-500/10 flex items-center justify-center text-emerald-600 hover:text-red-500 transition-colors"
                                title="Prune Settled Agreement"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <h3 className="text-base font-bold text-stone-300 line-through decoration-stone-600">{loan.name}</h3>
                            <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>With {loan.personOrEntity} &bull; Settled {new Date(loan.lastUpdated).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                            </p>

                            <div className="bg-emerald-950/10 p-3 rounded-xl mt-4 grid grid-cols-2 gap-2 border border-emerald-900/10 text-stone-400">
                              <div>
                                <span className="text-[9px] uppercase text-stone-500 font-mono block">Orig. Principal</span>
                                <span className="text-xs font-semibold font-mono text-zinc-300">{currencySymbol}{loan.principal.toLocaleString('en-IN')}</span>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase text-stone-500 font-mono block">Compound Rate</span>
                                <span className="text-xs font-semibold font-mono text-zinc-300">{loan.interestRate}% APY</span>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase text-stone-500 font-mono block">Total Interest Accrued</span>
                                <span className="text-xs font-semibold font-mono text-emerald-500">{currencySymbol}{totalAccInterest.toLocaleString('en-IN')}</span>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase text-stone-500 font-mono block">Completely Paid</span>
                                <span className="text-xs font-semibold font-mono text-emerald-400">{currencySymbol}{loan.manualPayments.toLocaleString('en-IN')}</span>
                              </div>
                            </div>

                            <div className="mt-4 flex justify-between items-baseline">
                              <span className="text-xs uppercase font-bold text-stone-500 font-mono">Current Balance</span>
                              <span className="text-sm font-mono font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                                [✓ ACC ledger balanced]
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-dashed border-emerald-900/15 flex items-center justify-between text-[10px] font-mono text-emerald-500">
                            <span>Sober treasury safety achieved</span>
                            <span className="text-[9px] uppercase tracking-wide font-black bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25">Audit Complete</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* REVOLVING CREDIT CARDS SUB-TAB */
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-xl font-bold ${tokens.textPrimary}`}>Revolving Lines & Credit Security OS</h2>
              <p className="text-xs text-stone-500 font-medium">Configure buffer payment parameters, simulate cycles, and prevent compounding interest spikes</p>
            </div>
            <button
              type="button"
              id="toggle-add-card-btn"
              onClick={() => setShowCardAddForm(!showCardAddForm)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 duration-150"
            >
              <Plus className="h-4 w-4" />
              <span>Provision Credit Card</span>
            </button>
          </div>

          {/* ADD CREDIT CARD FORM */}
          {showCardAddForm && (
            <form onSubmit={handleCardSubmit} className="mb-6 p-4 rounded-2xl border border-dashed border-stone-100/10 bg-stone-500/5 space-y-4 animate-fade-in text-stone-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label htmlFor="cc-form-name" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Card Issuer Name</label>
                  <input
                    type="text"
                    id="cc-form-name"
                    required
                    placeholder="e.g. Amex Centurion, SBI Prime"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className={`w-full px-3 py-2 bg-stone-500/10 border ${tokens.border} rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-stone-950`}
                  />
                </div>

                <div>
                  <label htmlFor="cc-form-limit" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Total Credit Limit</label>
                  <input
                    type="number"
                    id="cc-form-limit"
                    required
                    min="1"
                    placeholder={`${currencySymbol} limit`}
                    value={cardLimit}
                    onChange={(e) => setCardLimit(e.target.value)}
                    className={`w-full px-3 py-2 bg-stone-500/10 border ${tokens.border} rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-stone-950`}
                  />
                </div>

                <div>
                  <label htmlFor="cc-form-balance" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Pre-existing Balance</label>
                  <input
                    type="number"
                    id="cc-form-balance"
                    min="0"
                    placeholder={`${currencySymbol} Balance`}
                    value={cardBalance}
                    onChange={(e) => setCardBalance(e.target.value)}
                    className={`w-full px-3 py-2 bg-stone-500/10 border ${tokens.border} rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-stone-950`}
                  />
                </div>

                <div>
                  <label htmlFor="cc-form-apr" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Annual Interest APR (%)</label>
                  <input
                    type="number"
                    id="cc-form-apr"
                    required
                    min="1"
                    step="0.1"
                    placeholder="e.g. 36 for 36%"
                    value={cardApr}
                    onChange={(e) => setCardApr(e.target.value)}
                    className={`w-full px-3 py-2 bg-stone-500/10 border ${tokens.border} rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-stone-950`}
                  />
                </div>

                <div>
                  <label htmlFor="cc-form-statement-date" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Statement Day of Month</label>
                  <input
                    type="number"
                    id="cc-form-statement-date"
                    required
                    min="1"
                    max="28"
                    placeholder="Day of Month (1-28)"
                    value={cardStatementDate}
                    onChange={(e) => setCardStatementDate(e.target.value)}
                    className={`w-full px-3 py-2 bg-stone-500/10 border ${tokens.border} rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-stone-950`}
                  />
                </div>

                <div>
                  <label htmlFor="cc-form-buffer" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Grace Payment Buffer (Days)</label>
                  <input
                    type="number"
                    id="cc-form-buffer"
                    required
                    min="1"
                    max="45"
                    placeholder="buffer days"
                    value={cardBufferDays}
                    onChange={(e) => setCardBufferDays(e.target.value)}
                    className={`w-full px-3 py-2 bg-stone-500/10 border ${tokens.border} rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-stone-950`}
                  />
                </div>

                <div>
                  <label htmlFor="cc-form-alert-limit" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Alert on Remaining Limit &lt;</label>
                  <input
                    type="number"
                    id="cc-form-alert-limit"
                    placeholder={`${currencySymbol} threshold`}
                    value={cardAlertRemaining}
                    onChange={(e) => setCardAlertRemaining(e.target.value)}
                    className={`w-full px-3 py-2 bg-stone-500/10 border ${tokens.border} rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-stone-950`}
                  />
                </div>

                <div>
                  <label htmlFor="cc-form-alert-pct" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Alert on Used Percent &gt;=</label>
                  <input
                    type="number"
                    id="cc-form-alert-pct"
                    min="10"
                    max="100"
                    placeholder="Alert percent (e.g. 80)"
                    value={cardAlertPct}
                    onChange={(e) => setCardAlertPct(e.target.value)}
                    className={`w-full px-3 py-2 bg-stone-500/10 border ${tokens.border} rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-stone-950`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  id="cancel-card-btn"
                  onClick={() => setShowCardAddForm(false)}
                  className="text-xs font-bold text-stone-400 hover:text-stone-300 px-3 py-2 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-card-btn"
                  className="text-xs font-extrabold px-5 py-2.5 bg-amber-500 text-stone-950 rounded-xl transition-all shadow hover:bg-amber-400"
                >
                  Anchor Revolver
                </button>
              </div>
            </form>
          )}

          {/* CREDIT CARDS GRID */}
          {creditCards.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-stone-850 rounded-2xl">
              <p className="text-xs text-stone-500 font-mono">No active revolving credit lines detected.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {creditCards.map((card) => {
                const usedPct = card.totalLimit > 0 ? (card.usedBalance / card.totalLimit) * 100 : 0;
                const remainingLimit = Math.max(0, card.totalLimit - card.usedBalance);
                
                // Calculate overdue status
                const isOverdue = card.dueDate ? (Date.now() > new Date(card.dueDate).getTime() && (card.lastBillAmount || 0) > 0) : false;
                const isInBuffer = card.dueDate ? (Date.now() <= new Date(card.dueDate).getTime() && (card.lastBillAmount || 0) > 0) : false;

                // Checking user defined alert parameters
                const remainingAlertActive = card.alertRemainingLimit !== undefined && remainingLimit <= card.alertRemainingLimit;
                const usedAlertActive = card.alertUsedLimitPct !== undefined && usedPct >= card.alertUsedLimitPct;

                return (
                  <div
                    key={card.id}
                    className="rounded-3xl border border-stone-850/80 bg-zinc-950/80 overflow-hidden relative flex flex-col justify-between hover:border-amber-500/20 transition-all duration-300 shadow-2xl p-6"
                  >
                    {/* Titanium Strip design accent */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-stone-800 via-stone-500 to-amber-500/20" />

                    <div>
                      {/* Brand Label and Action bar */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono tracking-widest text-stone-500 uppercase font-black uppercase">REVOLUTION CREDITS</span>
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        </div>
                        <button
                          type="button"
                          id={`remove-card-btn-${card.id}`}
                          onClick={() => onRemoveCreditCard && onRemoveCreditCard(card.id)}
                          className="h-6 w-6 rounded hover:bg-rose-500/15 flex items-center justify-center text-stone-500 hover:text-red-500 transition-colors"
                          title="Retire Revolver"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* PHYSICAL CARD FEEL CONTAINER */}
                      <div className="p-4 rounded-xl bg-gradient-to-br from-stone-900 to-zinc-950 border border-stone-800 mb-4 relative overflow-hidden">
                        {/* Brass Chip indicator */}
                        <div className="w-8 h-6 rounded-md bg-amber-600/30 border border-amber-600/40 mb-3 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-x-0 top-1.5 h-0.5 bg-amber-600/20" />
                          <div className="absolute inset-y-0 left-3 w-0.5 bg-amber-600/20" />
                        </div>

                        <div className="flex items-baseline justify-between mb-1">
                          <h3 className="text-sm font-bold font-mono tracking-wide text-white">{card.name}</h3>
                          <span className="text-[10px] font-mono text-zinc-500 font-medium">APR: {card.apr}% / variable</span>
                        </div>

                        <div className="mt-4 flex justify-between items-end">
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-stone-500 font-mono block">Anchor Balance</span>
                            <span className="text-lg font-mono font-black text-white">{currencySymbol}{card.usedBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] uppercase tracking-wider text-stone-500 font-mono block">Max ceiling limit</span>
                            <span className="text-sm font-mono font-bold text-stone-400">{currencySymbol}{card.totalLimit.toLocaleString('en-IN')}</span>
                          </div>
                        </div>

                        {/* Used balance progress bar */}
                        <div className="mt-4">
                          <div className="flex justify-between items-center text-[10px] mb-1 font-mono">
                            <span className="text-stone-500">Credit Capacity Ut.</span>
                            <span className="text-zinc-400">{usedPct.toFixed(0)}%</span>
                          </div>
                          {renderPremiumProgressBar(usedPct, selectedProgressBarStyle, usedPct > 80 ? 'bg-rose-600' : 'bg-amber-500', activeAccentColor)}
                        </div>
                      </div>

                      {/* TRIGGER WARNING FLAGS OR METRICS */}
                      <div className="space-y-2 mb-4">
                        {/* Critical parameters breached warnings */}
                        {usedAlertActive && (
                          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-red-400 text-[10px] flex gap-1.5 items-center font-mono leading-snug animate-pulse">
                            <ShieldAlert className="h-4 w-4 shrink-0" />
                            <span><strong>LIMIT ALARM:</strong> Card utilization ({usedPct.toFixed(0)}%) passed alert ceiling ({card.alertUsedLimitPct}%). Liquidity stressed!</span>
                          </div>
                        )}

                        {remainingAlertActive && (
                          <div className="p-2.5 rounded-xl bg-orange-600/10 border border-orange-500/25 text-orange-400 text-[10px] flex gap-1.5 items-center font-mono leading-snug animate-pulse">
                            <ShieldAlert className="h-4 w-4 shrink-0" />
                            <span><strong>CAPACITY BRIEF:</strong> Unused cushion ({currencySymbol}{remainingLimit.toLocaleString()}) below alert floor ({currencySymbol}{card.alertRemainingLimit?.toLocaleString()}).</span>
                          </div>
                        )}

                        {/* Statement Billing Grace Period tracker */}
                        {isOverdue && (
                          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex gap-2 items-start leading-snug">
                            <ShieldAlert className="h-5 w-5 shrink-0" />
                            <div>
                              <strong className="block">OVERDUE OVERFLOW - INTEREST INFLICTED</strong>
                              <span className="text-[10px] text-rose-400/80">Compound rate active! Statement due on {card.dueDate ? new Date(card.dueDate).toLocaleDateString() : 'N/A'} was ignored. Balance now swelling monthly.</span>
                            </div>
                          </div>
                        )}

                        {isInBuffer && (
                          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs flex gap-2 items-start leading-snug">
                            <Calendar className="h-4 w-4 shrink-0 mt-0.5" />
                            <div>
                              <strong className="block text-amber-300">INTEREST-FREE GRACE TIMEPAN ACTIVE</strong>
                              <span className="text-[10px] text-amber-500/80">Last bill generated: {currencySymbol}{card.lastBillAmount?.toLocaleString()} on {card.lastStatementDate ? new Date(card.lastStatementDate).toLocaleDateString() : ''}. Settlement due by {card.dueDate ? new Date(card.dueDate).toLocaleDateString() : 'N/A'}!</span>
                            </div>
                          </div>
                        )}

                        {!card.dueDate && (
                          <div className="p-2 text-stone-500 text-[11px] font-mono flex items-center justify-between border border-stone-900 bg-stone-500/5 rounded-xl">
                            <span>Statement Day: Day {card.statementDate} of Month</span>
                            <span>Buffer days: {card.bufferDays} days</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ACTIONS MODULES (Billing sim, pay off outstanding, rules configuration) */}
                    <div className="border-t border-dashed border-stone-900 pt-4 mt-2">
                      <div className="flex flex-wrap gap-2">
                        {/* Simulation trigger */}
                        <button
                          type="button"
                          onClick={() => onSimulateStatement && onSimulateStatement(card.id)}
                          className="flex-1 py-2 px-3 border border-stone-800 bg-stone-500/5 hover:bg-stone-800 rounded-xl text-[10px] font-bold font-mono uppercase text-zinc-400 hover:text-white transition-all flex items-center justify-center gap-1.5"
                        >
                          <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" />
                          <span>Simulation Billing Run</span>
                        </button>

                        {/* Payoff button */}
                        <button
                          type="button"
                          onClick={() => {
                            setActivePayCardId(activePayCardId === card.id ? null : card.id);
                            // Autofill paying details
                            setPayAmount(card.lastBillAmount ? card.lastBillAmount.toString() : card.usedBalance.toString());
                            const bank = assets.find(a => a.type === 'BANK_BALANCE');
                            setPayBankAccountId(bank ? bank.id : '');
                            setActiveAlertCardId(null);
                          }}
                          className="flex-1 py-2 px-3 bg-stone-100/5 hover:bg-amber-500 border border-stone-800 hover:border-amber-500/40 text-stone-300 hover:text-stone-950 rounded-xl text-[10px] font-mono font-extrabold uppercase transition-all flex items-center justify-center gap-1.5"
                        >
                          <span>Repay Statement</span>
                        </button>

                        {/* Configure alert flags limit */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveAlertCardId(activeAlertCardId === card.id ? null : card.id);
                            setAlertRemainingInput(card.alertRemainingLimit ? card.alertRemainingLimit.toString() : '');
                            setAlertPctInput(card.alertUsedLimitPct ? card.alertUsedLimitPct.toString() : '');
                            setActivePayCardId(null);
                          }}
                          className="py-2 px-2.5 border border-stone-850 hover:bg-stone-800/40 rounded-xl text-[10px]"
                          title="Configure alert triggers"
                        >
                          ⚙️
                        </button>
                      </div>

                      {/* PAYOFF DRAWER */}
                      {activePayCardId === card.id && (
                        <div className="mt-4 p-3 bg-stone-900/50 border border-stone-800 rounded-2xl animate-fade-in space-y-3">
                          <h4 className="text-[11px] uppercase font-bold font-mono tracking-wider text-amber-500">Vault Payment Router</h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] uppercase font-bold text-stone-500 font-mono block mb-1">Payoff amount</label>
                              <input
                                type="number"
                                required
                                value={payAmount}
                                onChange={(e) => setPayAmount(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-800 text-xs font-mono rounded-lg focus:outline-none"
                              />
                            </div>
                            
                            <div>
                              <label className="text-[9px] uppercase font-bold text-stone-500 font-mono block mb-1">Source account fund</label>
                              <select
                                required
                                value={payBankAccountId}
                                onChange={(e) => setPayBankAccountId(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-800 text-xs text-stone-300 rounded-lg focus:outline-none"
                              >
                                <option value="" disabled>-- Choose Cash Account --</option>
                                {assets.filter(a => a.type === 'BANK_BALANCE').map(a => (
                                  <option key={a.id} value={a.id}>{a.name} ({currencySymbol}{a.currentValue.toLocaleString()})</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => setActivePayCardId(null)}
                              className="text-[10px] text-zinc-500 font-semibold px-2 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePaySubmit(card.id)}
                              className="text-[10px] font-extrabold px-3 py-1 bg-amber-500 text-stone-950 rounded-lg uppercase"
                            >
                              Confirm pay
                            </button>
                          </div>
                        </div>
                      )}

                      {/* ALERTS CONFIGURATION DRAWER */}
                      {activeAlertCardId === card.id && (
                        <div className="mt-4 p-3 bg-stone-900/50 border border-stone-800 rounded-2xl animate-fade-in space-y-3">
                          <h4 className="text-[11px] uppercase font-bold font-mono tracking-wider text-amber-500">Alert thresholds control</h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Cushion limit floor ({currencySymbol})</label>
                              <input
                                type="number"
                                placeholder="Alert when limit <= this"
                                value={alertRemainingInput}
                                onChange={(e) => setAlertRemainingInput(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-800 text-xs font-mono rounded-lg focus:outline-none"
                              />
                            </div>
                            
                            <div>
                              <label className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Max utilization ceiling (%)</label>
                              <input
                                type="number"
                                placeholder="Alert when used % >= this"
                                value={alertPctInput}
                                onChange={(e) => setAlertPctInput(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-800 text-xs font-mono rounded-lg focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => setActiveAlertCardId(null)}
                              className="text-[10px] text-zinc-500 font-semibold px-2 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAlertSubmit(card.id)}
                              className="text-[10px] font-extrabold px-3 py-1 bg-amber-500 text-stone-950 rounded-lg uppercase"
                            >
                              Update parameters
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
