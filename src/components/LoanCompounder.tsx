/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, IndianRupee, ShieldAlert, ArrowUpRight, ArrowDownRight, RefreshCw, Calendar } from 'lucide-react';
import { EchelonTheme, Loan, LoanType, CompoundingFrequency } from '../types';
import { getColorTokens } from '../utils/theme';
import { calculateLoanCurrentBalance, calculateLoanAccruedInterest } from '../utils/math';

interface LoanCompounderProps {
  theme: EchelonTheme;
  loans: Loan[];
  onAddLoan: (loan: Omit<Loan, 'id' | 'lastUpdated'>) => void;
  onAddLoanRepayment: (id: string, amount: number) => void;
  onRemoveLoan: (id: string) => void;
}

export default function LoanCompounder({
  theme,
  loans,
  onAddLoan,
  onAddLoanRepayment,
  onRemoveLoan,
}: LoanCompounderProps) {
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-bold ${tokens.textPrimary}`}>Autocompounding Leverage & Debt Ledger</h2>
          <p className="text-xs text-stone-500">Track loans taken or lent with automated compounding timeframes</p>
        </div>
        <button
          type="button"
          id="toggle-add-loan-btn"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>New Relationship / Loan</span>
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
                className={`w-full px-3 py-2 bg-stone-500/10 border ${tokens.border} rounded-xl text-xs focus:outline-none focus:border-amber-500`}
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
                className={`w-full px-3 py-2 bg-stone-500/10 border ${tokens.border} rounded-xl text-xs focus:outline-none focus:border-amber-500`}
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
              <label htmlFor="loan-form-principal" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Original Principal (INR)</label>
              <input
                type="number"
                id="loan-form-principal"
                required
                min="1"
                placeholder="₹ Principal"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                className={`w-full px-3 py-2 bg-stone-500/10 border ${tokens.border} rounded-xl text-xs focus:outline-none focus:border-amber-500`}
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
                className={`w-full px-3 py-2 bg-stone-500/10 border ${tokens.border} rounded-xl text-xs focus:outline-none focus:border-amber-500`}
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
              <label htmlFor="loan-form-date" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Loan Origination Date</label>
              <input
                type="date"
                id="loan-form-date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full px-3 py-2 bg-stone-500/10 border ${tokens.border} rounded-xl text-xs focus:outline-none focus:border-amber-500`}
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
                className={`w-full px-3 py-2 bg-stone-500/10 border ${tokens.border} rounded-xl text-xs focus:outline-none focus:border-amber-500`}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loans.map((loan) => {
            const currentBal = calculateLoanCurrentBalance(loan);
            const totalAccInterest = calculateLoanAccruedInterest(loan);
            const isLent = loan.type === LoanType.LENT;

            return (
              <div
                key={loan.id}
                className={`p-5 rounded-2xl border ${tokens.card} relative overflow-hidden flex flex-col justify-between hover:scale-[1.01] transition-all`}
              >
                {/* Background tag indicators */}
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

                  {/* Accrual detail widget */}
                  <div className="bg-stone-500/5 hover:bg-stone-500/10 p-3 rounded-xl mt-4 grid grid-cols-2 gap-2 border border-stone-500/10">
                    <div>
                      <span className="text-[10px] uppercase text-stone-500 font-mono block">Orig. Principal</span>
                      <span className={`text-sm font-semibold font-mono ${tokens.textPrimary}`}>₹{loan.principal.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-stone-500 font-mono block">Compound Rate</span>
                      <span className={`text-sm font-semibold font-mono text-amber-500`}>{loan.interestRate}% APY</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-stone-500 font-mono block">Compound Int.</span>
                      <span className="text-sm font-semibold font-mono text-amber-600">₹{totalAccInterest.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-stone-500 font-mono block">Total Repaid</span>
                      <span className="text-sm font-semibold font-mono text-stone-400">₹{loan.manualPayments.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between items-baseline">
                    <span className="text-xs uppercase font-bold text-stone-500 font-mono">Current Balance</span>
                    <span className={`text-xl font-mono font-black ${isLent ? 'text-emerald-500' : 'text-red-500'}`}>
                      ₹{currentBal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Repayment and Add payment ledger section */}
                <div className="mt-4 pt-3 border-t border-dashed border-stone-800/15 dark:border-stone-100/10 flex items-center justify-between gap-2">
                  {repayId === loan.id ? (
                    <div className="flex items-center gap-1.5 w-full animate-fade-in">
                      <input
                        type="number"
                        id={`repay-input-${loan.id}`}
                        placeholder="Repayment amount ₹"
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
      )}
    </div>
  );
}
