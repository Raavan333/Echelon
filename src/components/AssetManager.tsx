/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  CircleDollarSign, 
  Landmark, 
  RefreshCw, 
  BarChart, 
  ArrowRightLeft, 
  FileText, 
  History, 
  TrendingUp, 
  AlertTriangle, 
  Calendar 
} from 'lucide-react';
import { EchelonTheme, Asset, AssetType, FundTransfer } from '../types';
import { getColorTokens, renderPremiumProgressBar } from '../utils/theme';

interface AssetManagerProps {
  theme: EchelonTheme;
  assets: Asset[];
  onAddAsset: (asset: Omit<Asset, 'id' | 'lastUpdated'>) => void;
  onUpdateAssetValue: (id: string, value: number, returns: number, annualGrowthRate?: number) => void;
  onUpdateAsset?: (id: string, asset: Omit<Asset, 'id' | 'lastUpdated'>) => void;
  onRemoveAsset: (id: string) => void;
  currencySymbol?: string;
  onOpenSettings?: () => any;
  selectedProgressBarStyle?: 'ultra-thin' | 'neon-glow' | 'carbon-solid';
  activeAccentColor?: string;
  transfers?: FundTransfer[];
  onAddTransfer?: (transfer: Omit<FundTransfer, 'id' | 'date'>) => void;
}

export default function AssetManager({
  theme,
  assets,
  onAddAsset,
  onUpdateAssetValue,
  onUpdateAsset,
  onRemoveAsset,
  currencySymbol = '₹',
  onOpenSettings,
  selectedProgressBarStyle = 'ultra-thin',
  activeAccentColor,
  transfers = [],
  onAddTransfer,
}: AssetManagerProps) {
  // Navigation within AssetManager
  const [managerTab, setManagerTab] = useState<'holdings' | 'shifter'>('holdings');

  // Asset creation form state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [institution, setInstitution] = useState<string>('');
  const [type, setType] = useState<AssetType>(AssetType.EQUITY);
  const [currentValue, setCurrentValue] = useState<string>('');
  const [realisedReturns, setRealisedReturns] = useState<string>('');
  const [annualGrowthRate, setAnnualGrowthRate] = useState<string>('12');
  const [notes, setNotes] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Editing state
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editReturns, setEditReturns] = useState<string>('');
  const [editGrowthRate, setEditGrowthRate] = useState<string>('');
  const [editStartDate, setEditStartDate] = useState<string>('');
  const [editEndDate, setEditEndDate] = useState<string>('');

  // Shifter Form state
  const [shifterSourceId, setShifterSourceId] = useState<string>('');
  const [shifterDestId, setShifterDestId] = useState<string>('');
  const [shifterBaseAmount, setShifterBaseAmount] = useState<string>('');
  const [shifterGainAmount, setShifterGainAmount] = useState<string>('0');
  const [shifterPenaltyAmount, setShifterPenaltyAmount] = useState<string>('0');
  const [shifterNotes, setShifterNotes] = useState<string>('');
  const [shifterError, setShifterError] = useState<string>('');
  const [shifterSuccess, setShifterSuccess] = useState<string>('');

  const tokens = getColorTokens(theme);

  const handleExecuteShifter = (e: React.FormEvent) => {
    e.preventDefault();
    setShifterError('');
    setShifterSuccess('');

    if (!onAddTransfer) {
      setShifterError('Backend integration callback missing. Action failed.');
      return;
    }

    if (!shifterSourceId || !shifterDestId || !shifterBaseAmount) {
      setShifterError('Please select a source and destination, and provide a valid capital amount.');
      return;
    }

    if (shifterSourceId === shifterDestId) {
      setShifterError('Source and destination funds must be distinct.');
      return;
    }

    const baseAmount = parseFloat(shifterBaseAmount);
    if (isNaN(baseAmount) || baseAmount <= 0) {
      setShifterError('Capital amount must be a positive number.');
      return;
    }

    const sourceAsset = assets.find(a => a.id === shifterSourceId);
    if (!sourceAsset) {
      setShifterError('Selected source asset is invalid.');
      return;
    }

    if (sourceAsset.currentValue < baseAmount) {
      setShifterError(`Insufficient buffer: selected source fund has a current balance of ${currencySymbol}${sourceAsset.currentValue.toLocaleString()}, which is less than requested withdrawal capital.`);
      return;
    }

    const destAsset = assets.find(a => a.id === shifterDestId);
    if (!destAsset) {
      setShifterError('Selected destination asset is invalid.');
      return;
    }

    const isStockOrEquity = sourceAsset.type === AssetType.STOCK || sourceAsset.type === AssetType.EQUITY;
    const isFdOrBond = sourceAsset.type === AssetType.FD || sourceAsset.type === AssetType.BOND;

    const gain = isStockOrEquity ? (parseFloat(shifterGainAmount) || 0) : 0;
    const penalty = isFdOrBond ? (parseFloat(shifterPenaltyAmount) || 0) : 0;

    const netAmount = baseAmount + gain - penalty;
    if (netAmount < 0) {
      setShifterError('Invalid calculation: penalty exceeds the base transfer capital. Adjust parameters.');
      return;
    }

    // Call callback
    onAddTransfer({
      sourceAssetId: shifterSourceId,
      sourceAssetName: sourceAsset.name,
      destinationAssetId: shifterDestId,
      destinationAssetName: destAsset.name,
      baseAmount,
      gainAmount: gain,
      penaltyAmount: penalty,
      netAmountTransferred: netAmount,
      notes: shifterNotes || `Inter-fund transfer of capital.`,
      type: sourceAsset.type === AssetType.STOCK
        ? 'STOCK_PROFIT'
        : sourceAsset.type === AssetType.FD
        ? 'FD_PENALTY'
        : sourceAsset.type === AssetType.BOND
        ? 'BOND_PENALTY'
        : 'NEUTRAL_TRANSFER'
    });

    setShifterSuccess(`Successfully reallocated ${currencySymbol}${netAmount.toLocaleString()} into your "${destAsset.name}" holding. This represents ${currencySymbol}${baseAmount.toLocaleString()} capital shift, ${gain > 0 ? `with immediate profits +${currencySymbol}${gain.toLocaleString()} added to` : penalty > 0 ? `with breakout penalty of -${currencySymbol}${penalty.toLocaleString()} subtracted from` : `with zero changes inside`} your final allocation.`);
    
    // Reset states
    setShifterSourceId('');
    setShifterDestId('');
    setShifterBaseAmount('');
    setShifterGainAmount('0');
    setShifterPenaltyAmount('0');
    setShifterNotes('');
  };

  const handleTypeChange = (newType: AssetType) => {
    setType(newType);
    // Dynamic pre-filled returns rate suggestions for fluid micro-experiences
    switch (newType) {
      case AssetType.EQUITY: setAnnualGrowthRate('12'); break;
      case AssetType.FD: setAnnualGrowthRate('7.1'); break;
      case AssetType.BOND: setAnnualGrowthRate('8.5'); break;
      case AssetType.STOCK: setAnnualGrowthRate('12'); break;
      case AssetType.BANK_BALANCE: setAnnualGrowthRate('3.5'); break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !institution || !currentValue) return;

    onAddAsset({
      name,
      institution,
      type,
      currentValue: parseFloat(currentValue) || 0,
      realisedReturns: parseFloat(realisedReturns) || 0,
      annualGrowthRate: parseFloat(annualGrowthRate) !== undefined ? parseFloat(annualGrowthRate) : 12,
      notes,
      startDate: (type === AssetType.FD || type === AssetType.BOND) ? startDate : undefined,
      endDate: (type === AssetType.FD || type === AssetType.BOND) ? endDate : undefined,
    });

    // Reset fields
    setName('');
    setInstitution('');
    setType(AssetType.EQUITY);
    setCurrentValue('');
    setRealisedReturns('');
    setAnnualGrowthRate('12');
    setNotes('');
    setStartDate('');
    setEndDate('');
    setShowAddForm(false);
  };

  const handleStartEdit = (asset: Asset) => {
    setEditId(asset.id);
    setEditValue(asset.currentValue.toString());
    setEditReturns(asset.realisedReturns.toString());
    setEditGrowthRate((asset.annualGrowthRate ?? 12).toString());
  };

  const handleSaveEdit = (id: string) => {
    const val = parseFloat(editValue);
    const ret = parseFloat(editReturns);
    const growth = parseFloat(editGrowthRate);
    if (!isNaN(val) && !isNaN(ret)) {
      onUpdateAssetValue(id, val, ret, isNaN(growth) ? undefined : growth);
      setEditId(null);
    }
  };

  const getAssetIcon = (t: AssetType) => {
    switch (t) {
      case AssetType.FD: return <Landmark className="h-5 w-5 text-emerald-500" />;
      case AssetType.BOND: return <CircleDollarSign className="h-5 w-5 text-amber-500" />;
      case AssetType.EQUITY: return <BarChart className="h-5 w-5 text-blue-500" />;
      case AssetType.STOCK: return <BarChart className="h-5 w-5 text-purple-500" />;
      case AssetType.BANK_BALANCE: return <Landmark className="h-5 w-5 text-cyan-500" />;
      default: return <CircleDollarSign className="h-5 w-5 text-stone-500" />;
    }
  };

  const getAssetLabel = (t: AssetType) => {
    switch (t) {
      case AssetType.FD: return 'Fixed Deposit';
      case AssetType.BOND: return 'Corporate Bond';
      case AssetType.EQUITY: return 'Equity Mutual Funds';
      case AssetType.STOCK: return 'Delivery Stocks';
      case AssetType.BANK_BALANCE: return 'Savings/Bank Balance';
      default: return 'Asset';
    }
  };

  return (
    <div id="holding-asset-manager" className={`p-6 rounded-3xl border ${tokens.card} ${tokens.glow} transition-all duration-300`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-bold ${tokens.textPrimary}`}>Private Financial Holdings</h2>
          <p className="text-xs text-stone-500">Document your equities, bank sheets, fixed deposits, and bonds</p>
        </div>
        {managerTab === 'holdings' && (
          <button
            type="button"
            id="toggle-add-asset-form-btn"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Track Asset</span>
          </button>
        )}
      </div>

      {/* Sub-tabs menu */}
      <div className="flex border-b border-stone-800/40 mb-6 gap-4">
        <button
          type="button"
          onClick={() => setManagerTab('holdings')}
          className={`pb-2.5 px-1 text-xs font-mono font-bold uppercase border-b-2 transition-all flex items-center gap-1.5 focus:outline-none cursor-pointer ${
            managerTab === 'holdings'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-stone-500 hover:text-stone-300'
          }`}
        >
          <Landmark className="h-3.5 w-3.5" />
          Holdings Register
        </button>
        <button
          type="button"
          onClick={() => {
            setManagerTab('shifter');
            setShowAddForm(false);
          }}
          className={`pb-2.5 px-1 text-xs font-mono font-bold uppercase border-b-2 transition-all flex items-center gap-1.5 focus:outline-none cursor-pointer ${
            managerTab === 'shifter'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-stone-500 hover:text-stone-300'
          }`}
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          Inter-Fund Shifter
          {transfers.length > 0 && (
            <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-mono">
              {transfers.length}
            </span>
          )}
        </button>
      </div>

      {/* HOLDINGS REGISTER TAB CONTENT */}
      {managerTab === 'holdings' && (
        <>
          {/* ADD ASSET FORM */}
          {showAddForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-2xl border border-dashed border-stone-700/30 dark:border-stone-100/10 bg-stone-500/5 space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label htmlFor="asset-form-name" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Asset Name / Script</label>
              <input
                type="text"
                id="asset-form-name"
                required
                placeholder="e.g. Nifty 50 Index Fund, SBI FD"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3 py-2 bg-stone-500/10 border ${tokens.border} rounded-xl text-xs focus:outline-none focus:border-amber-500`}
              />
            </div>

            <div>
              <label htmlFor="asset-form-institution" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Institution / Banker</label>
              <input
                type="text"
                id="asset-form-institution"
                required
                placeholder="e.g. Zerodha, HDFC Bank"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className={`w-full px-3 py-2 bg-stone-500/10 border ${tokens.border} rounded-xl text-xs focus:outline-none focus:border-amber-500`}
              />
            </div>

            <div>
              <label htmlFor="asset-form-type" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Asset Category</label>
              <select
                id="asset-form-type"
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as AssetType)}
                className={`w-full px-3 py-2 bg-stone-950 font-semibold border ${tokens.border} rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-500`}
              >
                <option value={AssetType.EQUITY}>Equity/Mutual Funds</option>
                <option value={AssetType.FD}>Fixed Deposit (FD)</option>
                <option value={AssetType.BOND}>Corporate Bond</option>
                <option value={AssetType.STOCK}>Delivery Stocks</option>
                <option value={AssetType.BANK_BALANCE}>Savings/Bank Balance</option>
              </select>
            </div>

            <div>
              <label htmlFor="asset-form-valuation" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Current Valuation</label>
              <input
                type="number"
                id="asset-form-valuation"
                required
                min="0"
                step="0.01"
                placeholder={`${currencySymbol} Amount`}
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                className={`w-full px-3 py-2 bg-stone-500/10 border ${tokens.border} rounded-xl text-xs focus:outline-none focus:border-amber-500`}
              />
            </div>

            <div>
              <label htmlFor="asset-form-returns" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Realised P&L / Returns To Date</label>
              <input
                type="number"
                id="asset-form-returns"
                step="0.01"
                placeholder={`${currencySymbol} Profit/Interest Realised`}
                value={realisedReturns}
                onChange={(e) => setRealisedReturns(e.target.value)}
                className={`w-full px-3 py-2 bg-stone-500/10 border ${tokens.border} rounded-xl text-xs focus:outline-none focus:border-amber-500`}
              />
            </div>
            <div>
              <label htmlFor="asset-form-growth" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">
                {type === AssetType.STOCK ? 'Expected Return Rate / Target (%)' : 'Annual APY Growth / Return Rate (%)'}
              </label>
              <input
                type="number"
                id="asset-form-growth"
                step="0.01"
                placeholder="e.g. 12"
                value={annualGrowthRate}
                onChange={(e) => setAnnualGrowthRate(e.target.value)}
                className={`w-full px-3 py-2 bg-stone-500/10 border ${tokens.border} rounded-xl text-xs focus:outline-none focus:border-amber-500`}
              />
              {type === AssetType.STOCK && (
                <span className="text-[9px] text-amber-500 italic block mt-1 font-sans leading-none">
                  ⚠️ Market volatile & non-fixed. Yield is estimated.
                </span>
              )}
            </div>

            {(type === AssetType.FD || type === AssetType.BOND) && (
              <>
                <div>
                  <label htmlFor="asset-form-start-date" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Start Date</label>
                  <input
                    type="date"
                    id="asset-form-start-date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`w-full px-3 py-2 bg-stone-500/10 border ${tokens.border} rounded-xl text-xs focus:outline-none focus:border-amber-500`}
                  />
                </div>
                <div>
                  <label htmlFor="asset-form-end-date" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">End Date (Liquidity Returns)</label>
                  <input
                    type="date"
                    id="asset-form-end-date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`w-full px-3 py-2 bg-stone-500/10 border ${tokens.border} rounded-xl text-xs focus:outline-none focus:border-amber-500`}
                  />
                </div>
              </>
            )}

            <div className="md:col-span-2 lg:col-span-3">
              <label htmlFor="asset-form-notes" className="text-[10px] uppercase font-bold text-stone-500 font-mono block mb-1">Notes / APY Yield (Optional)</label>
              <input
                type="text"
                id="asset-form-notes"
                placeholder={type === AssetType.STOCK ? 'e.g. Volatile delivery stocks' : 'e.g. SBI Yield: 7.1%, Annual compounding'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={`w-full px-3 py-2 bg-stone-500/10 border ${tokens.border} rounded-xl text-xs focus:outline-none focus:border-amber-500`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              id="cancel-asset-btn"
              onClick={() => setShowAddForm(false)}
              className="text-xs font-bold text-stone-400 hover:text-stone-300 px-3 py-2 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-asset-btn"
              className="text-xs font-extrabold px-5 py-2.5 bg-amber-500 text-stone-950 rounded-xl transition-all shadow hover:bg-amber-400"
            >
              Enforce Register
            </button>
          </div>
        </form>
      )}

      {/* ASSET LEDGER TABLE */}
      <div className="overflow-x-auto">
        {assets.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-stone-800/15 dark:border-stone-100/10 rounded-2xl">
            <p className="text-xs text-stone-500 font-mono">No holding listings are secured inside Echelon.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="border-b border-stone-500/10">
                <th className="py-3 px-2 text-[10px] uppercase font-bold text-stone-500 font-mono tracking-wider">Asset Profile</th>
                <th className="py-3 px-2 text-[10px] uppercase font-bold text-stone-500 font-mono tracking-wider">Institution</th>
                <th className="py-3 px-2 text-[10px] uppercase font-bold text-stone-500 font-mono tracking-wider">Type Code</th>
                <th className="py-3 px-2 text-[10px] uppercase font-bold text-stone-500 font-mono tracking-wider text-right">Current Value</th>
                <th className="py-3 px-2 text-[10px] uppercase font-bold text-stone-500 font-mono tracking-wider text-right">Realised Earnings</th>
                <th className="py-3 px-2 text-[10px] uppercase font-bold text-stone-500 font-mono tracking-wider text-right">APY Growth</th>
                <th className="py-3 px-2 text-center text-[10px] uppercase font-bold text-stone-500 font-mono tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id} className="border-b border-stone-500/5 hover:bg-stone-500/5 group transition-colors">
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-stone-500/10 flex items-center justify-center border border-stone-500/10">
                        {getAssetIcon(asset.type)}
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${tokens.textPrimary}`}>{asset.name}</p>
                        {asset.notes && <p className="text-[10px] text-stone-500 mb-1">{asset.notes}</p>}
                        {(asset.type === AssetType.FD || asset.type === AssetType.BOND) && asset.startDate && asset.endDate && (() => {
                          const start = new Date(asset.startDate).getTime();
                          const end = new Date(asset.endDate).getTime();
                          const now = Date.now();
                          const total = end - start;
                          let pct = 0;
                          if (total > 0) {
                            pct = Math.max(0, Math.min(100, ((now - start) / total) * 100));
                          }
                          const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
                          const isMatured = daysLeft <= 0;

                          return (
                            <div className="mt-1 max-w-xs space-y-0.5">
                              <div className="flex items-center gap-2 text-[10px] font-mono">
                                <span className={isMatured ? 'text-emerald-400 font-bold' : 'text-amber-500/80'}>
                                  {isMatured ? '🎉 Matured' : `${pct.toFixed(0)}% Completed`}
                                </span>
                                <span className="text-stone-500">
                                  {isMatured ? 'Liquid Available' : `• ${daysLeft} days left`}
                                </span>
                              </div>
                              <div className="w-28 mt-1">
                                {renderPremiumProgressBar(pct, selectedProgressBarStyle, isMatured ? 'bg-emerald-500' : 'bg-amber-500', activeAccentColor)}
                              </div>
                            </div>
                          );
                        })()}
                        {asset.type === AssetType.STOCK && (
                          <div className="mt-1 flex items-center gap-1">
                            <span className="h-1 w-1 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-[9px] uppercase font-bold text-amber-500/80 font-mono tracking-wide">
                              Volatile Market Asset
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-4 px-2 text-xs font-semibold text-stone-400">
                    {asset.institution}
                  </td>
                  
                  <td className="py-4 px-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg ${tokens.badgeBg}`}>
                      {getAssetLabel(asset.type)}
                    </span>
                  </td>

                  {/* Inline value manager */}
                  <td className="py-4 px-2 text-right">
                    {editId === asset.id ? (
                      <input
                        type="number"
                        id={`edit-value-input-${asset.id}`}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-24 px-2 py-1 bg-stone-500/15 border border-amber-500/30 text-stone-200 text-xs font-mono font-bold rounded focus:outline-none text-right"
                      />
                    ) : (
                      <p className="text-sm font-bold font-mono text-stone-200">
                        {currencySymbol}{asset.currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </td>

                  <td className="py-4 px-2 text-right">
                    {editId === asset.id ? (
                      <input
                        type="number"
                        id={`edit-returns-input-${asset.id}`}
                        value={editReturns}
                        onChange={(e) => setEditReturns(e.target.value)}
                        className="w-24 px-2 py-1 bg-stone-500/15 border border-amber-500/30 text-stone-200 text-xs font-mono font-bold rounded focus:outline-none text-right"
                      />
                    ) : (
                      <p className="text-sm font-bold font-mono text-emerald-500">
                        {currencySymbol}{asset.realisedReturns.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </td>

                  {/* APY Growth Rate inline cell */}
                  <td className="py-4 px-2 text-right">
                    {editId === asset.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          id={`edit-growth-input-${asset.id}`}
                          value={editGrowthRate}
                          onChange={(e) => setEditGrowthRate(e.target.value)}
                          className="w-16 px-1.5 py-1 bg-stone-500/15 border border-amber-500/30 text-stone-200 text-xs font-mono font-bold rounded focus:outline-none text-right"
                        />
                        <span className="text-[10px] text-stone-500 font-mono">%</span>
                      </div>
                    ) : (
                      <p className="text-sm font-bold font-mono text-amber-500/90">
                        {asset.annualGrowthRate !== undefined ? asset.annualGrowthRate : 12}%
                      </p>
                    )}
                  </td>

                  <td className="py-4 px-2">
                    <div className="flex items-center justify-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                      {editId === asset.id ? (
                        <button
                          type="button"
                          id={`save-asset-edit-btn-${asset.id}`}
                          onClick={() => handleSaveEdit(asset.id)}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded font-mono text-[10px] font-bold hover:bg-emerald-500"
                        >
                          Apply
                        </button>
                      ) : (
                        <button
                          type="button"
                          id={`edit-asset-btn-${asset.id}`}
                          onClick={() => handleStartEdit(asset)}
                          className="h-7 w-7 rounded-lg hover:bg-stone-500/20 flex items-center justify-center text-stone-400 hover:text-stone-200"
                          title="Manually Update Valuation"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      
                      <button
                        type="button"
                        id={`delete-asset-btn-${asset.id}`}
                        onClick={() => onRemoveAsset(asset.id)}
                        className="h-7 w-7 rounded-lg hover:bg-red-500/20 flex items-center justify-center text-stone-400 hover:text-red-500"
                        title="Delete Asset"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
        </>
      )}

      {/* SUB-TAB: INTER-FUND SHIFTER WORKFLOW */}
      {managerTab === 'shifter' && (
        <div className="space-y-6 animate-fade-in mt-4">
          <div className="p-4 rounded-2xl bg-zinc-950/40 border border-stone-850/50 space-y-2">
            <span className="text-[10px] uppercase font-bold text-amber-500 font-mono block">Sovereign Inter-Allocation Shift Board</span>
            <p className="text-xs text-stone-400 leading-relaxed">
              Dynamically shift balances from one asset to another. This simulates or executes real ledger modifications: stock sales lock in <strong className="text-emerald-400">Capital Gains</strong> which instantly updates your net worth, while early Fixed Deposit breaks subtract <strong className="text-rose-400">Breakout Penalties</strong>, properly recorded client-side in history so that anyone can make sense of your asset movements.
            </p>
          </div>

          <form onSubmit={handleExecuteShifter} className="p-5 border border-stone-800 rounded-2xl bg-stone-500/5 space-y-4">
            <span className="text-xs font-bold text-stone-200 block border-b border-stone-800/40 pb-2 flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-amber-500" />
              New Inter-Fund Capital Shift
            </span>

            {shifterError && (
              <div className="p-3 bg-red-950/30 border border-red-900/40 text-red-400 rounded-xl text-xs flex items-start gap-2 animate-pulse">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{shifterError}</span>
              </div>
            )}

            {shifterSuccess && (
              <div className="p-3 bg-emerald-950/30 border border-emerald-900/40 text-emerald-300 rounded-xl text-xs animate-fade-in">
                {shifterSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Source Asset Selection */}
              <div>
                <label className="text-[9px] uppercase font-bold text-stone-500 font-mono block mb-1">Source Asset (Debit Capital)</label>
                <select
                  value={shifterSourceId}
                  onChange={(e) => {
                    setShifterSourceId(e.target.value);
                    setShifterError('');
                    setShifterSuccess('');
                  }}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs focus:outline-none focus:border-amber-500 text-stone-300 font-medium"
                >
                  <option value="">-- Choose Asset --</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({getAssetLabel(a.type)}) - Balance: {currencySymbol}{a.currentValue.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination Asset Selection */}
              <div>
                <label className="text-[9px] uppercase font-bold text-stone-500 font-mono block mb-1">Destination Asset (Credit Net)</label>
                <select
                  value={shifterDestId}
                  onChange={(e) => {
                    setShifterDestId(e.target.value);
                    setShifterError('');
                    setShifterSuccess('');
                  }}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs focus:outline-none focus:border-amber-500 text-stone-300 font-medium"
                >
                  <option value="">-- Choose Asset --</option>
                  {assets.filter(a => a.id !== shifterSourceId).map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({getAssetLabel(a.type)}) - Balance: {currencySymbol}{a.currentValue.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Base Capital Amount to Withdraw */}
              <div>
                <label className="text-[9px] uppercase font-bold text-stone-500 font-mono block mb-1">Shift Amount (Capital)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-mono font-bold text-stone-500">{currencySymbol}</span>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 50000"
                    value={shifterBaseAmount}
                    onChange={(e) => setShifterBaseAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs focus:outline-none focus:border-amber-500 text-stone-300 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Dynamic context panels based on selecting Stock/Equity vs Deposit/Bond */}
            {shifterSourceId && (
              <div className="animate-fade-in">
                {assets.find(a => a.id === shifterSourceId)?.type === AssetType.STOCK || 
                 assets.find(a => a.id === shifterSourceId)?.type === AssetType.EQUITY ? (
                  <div className="p-4 rounded-xl border border-emerald-900/10 bg-emerald-950/15 space-y-2">
                    <span className="text-[10px] uppercase font-mono font-bold text-emerald-400 block flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Investment Profits setting (Stock/Equity realization)
                    </span>
                    <p className="text-[10px] text-stone-400 leading-normal">
                      Since you are transferring from an Equity/Stock holding, you might have generated capital gains during this sale. Enter the realized profits below to credit them to your destination account and organically inflate your net worth!
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="text-[9px] uppercase font-bold text-stone-500 block mb-1 font-mono">Realized Gain/Profit Amount</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs font-mono font-bold text-emerald-500">{currencySymbol}</span>
                          <input
                            type="number"
                            step="any"
                            placeholder="e.g. 12000"
                            value={shifterGainAmount}
                            onChange={(e) => setShifterGainAmount(e.target.value)}
                            className="w-full pl-7 pr-3 py-2 bg-stone-950 border border-stone-850 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-emerald-400 font-mono font-bold"
                          />
                        </div>
                      </div>
                      <div className="col-span-2 flex items-center text-[10px] text-stone-400 font-mono">
                        Net credit: {currencySymbol}{(parseFloat(shifterBaseAmount) || 0).toLocaleString()} base + {currencySymbol}{(parseFloat(shifterGainAmount) || 0).toLocaleString()} gains = <strong className="text-emerald-400 ml-1">{currencySymbol}{( (parseFloat(shifterBaseAmount) || 0) + (parseFloat(shifterGainAmount) || 0) ).toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>
                ) : assets.find(a => a.id === shifterSourceId)?.type === AssetType.FD || 
                    assets.find(a => a.id === shifterSourceId)?.type === AssetType.BOND ? (
                  <div className="p-4 rounded-xl border border-rose-905/10 bg-rose-950/15 space-y-2">
                    <span className="text-[10px] uppercase font-mono font-bold text-amber-500 block flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Maturity early break penalty details (FD / Bond break)
                    </span>
                    <p className="text-[10px] text-stone-400 leading-normal">
                      Breaking a Fixed Deposit or corporate bond beforehand might trigger early termination penalty fees. Provide any forfeits here: these are detracted from the final transfer balance and lower your absolute net worth.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="text-[9px] uppercase font-bold text-stone-500 block mb-1 font-mono">early forfeit charges</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs font-mono font-bold text-rose-500">{currencySymbol}</span>
                          <input
                            type="number"
                            step="any"
                            placeholder="e.g. 1500"
                            value={shifterPenaltyAmount}
                            onChange={(e) => setShifterPenaltyAmount(e.target.value)}
                            className="w-full pl-7 pr-3 py-2 bg-stone-950 border border-stone-850 rounded-xl text-xs focus:outline-none focus:border-rose-500 text-rose-400 font-mono font-bold"
                          />
                        </div>
                      </div>
                      <div className="col-span-2 flex items-center text-[10px] text-stone-400 font-mono">
                        Net credit: {currencySymbol}{(parseFloat(shifterBaseAmount) || 0).toLocaleString()} base - {currencySymbol}{(parseFloat(shifterPenaltyAmount) || 0).toLocaleString()} penalties = <strong className="text-amber-500 ml-1">{currencySymbol}{Math.max(0, (parseFloat(shifterBaseAmount) || 0) - (parseFloat(shifterPenaltyAmount) || 0)).toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Note text field */}
            <div>
              <label className="text-[9px] uppercase font-bold text-stone-500 font-mono block mb-1">Transfer Ledger Reason & Notes (Accounting transparency audit)</label>
              <textarea
                rows={2}
                value={shifterNotes}
                onChange={(e) => setShifterNotes(e.target.value)}
                placeholder="e.g. Reallocated HDFC Bank FD early to Direct Stock script since direct equity allocation gives double APY compound returns. Or: realizied index fund profit to bank savings balance."
                className="w-full p-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs focus:outline-none focus:border-amber-500 text-stone-300 placeholder-stone-700 font-sans leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase cursor-pointer rounded-xl transition-all shadow active:scale-95 flex items-center justify-center gap-2"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              Sovereign Transfer Execution (Offline Sandbox)
            </button>
          </form>

          {/* Transfers list history ledger */}
          <div className="space-y-4">
            <span className="text-xs font-bold text-stone-400 block uppercase font-mono tracking-wide flex items-center gap-2 border-b border-stone-800/40 pb-2">
              <History className="h-3.5 w-3.5 text-amber-500" />
              Allocation Transfer History Log
            </span>

            {transfers.length === 0 ? (
              <div className="p-8 border border-dashed border-stone-800/40 rounded-2xl text-center bg-stone-950/20">
                <FileText className="mx-auto h-8 w-8 text-stone-600/50 mb-2 font-mono" />
                <p className="text-xs text-stone-500 italic">No fund transfers recorded in active ledger. Shifts executed above will list here instantly.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {transfers.map((trf) => {
                  const hasGain = trf.gainAmount > 0;
                  const hasPenalty = trf.penaltyAmount > 0;
                  
                  return (
                    <div key={trf.id} className="p-4 rounded-xl border border-stone-855 bg-stone-950/40 hover:bg-[#0c0c0f] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] bg-stone-900 border border-stone-800 text-stone-300 font-mono font-bold px-2 py-0.5 rounded">
                            {trf.sourceAssetName}
                          </span>
                          <span className="text-stone-600 text-xs font-bold">➔</span>
                          <span className="text-[10px] bg-amber-955/20 border border-amber-900/20 text-amber-500 font-mono font-bold px-2 py-0.5 rounded">
                            {trf.destinationAssetName}
                          </span>
                          <span className="text-[9px] text-stone-500 inline-flex items-center gap-1 font-mono">
                            <Calendar className="h-2.5 w-2.5 text-stone-600" />
                            {new Date(trf.date).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                        <p className="text-xs text-stone-300 font-sans italic leading-relaxed">
                          "{trf.notes}"
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-stone-550 font-mono pt-1">
                          <span>Base Shift: {currencySymbol}{trf.baseAmount.toLocaleString('en-IN')}</span>
                          {hasGain && <span className="text-emerald-400">+Gain realized: {currencySymbol}{trf.gainAmount.toLocaleString('en-IN')}</span>}
                          {hasPenalty && <span className="text-rose-450 text-rose-400">-Penalty cost: {currencySymbol}{trf.penaltyAmount.toLocaleString('en-IN')}</span>}
                          <span className="text-stone-300 font-bold border-l border-stone-800 pl-3">Net Out: {currencySymbol}{trf.netAmountTransferred.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      {/* Net Worth impact indicator badge */}
                      <div className="shrink-0 flex items-center justify-start sm:justify-end">
                        {hasGain ? (
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wide">
                              ▲ +{currencySymbol}{trf.gainAmount.toLocaleString('en-IN')} Net Worth
                            </span>
                            <span className="text-[9px] text-stone-500 block font-mono mt-1">Realized Selling Profits</span>
                          </div>
                        ) : hasPenalty ? (
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] bg-rose-500/10 text-rose-400 font-mono font-bold px-2 py-0.5 rounded border border-rose-500/20 uppercase tracking-wide">
                              ▼ -{currencySymbol}{trf.penaltyAmount.toLocaleString('en-IN')} early BREAK
                            </span>
                            <span className="text-[9px] text-stone-500 block font-mono mt-1">Maturity Forfeiture Cost</span>
                          </div>
                        ) : (
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] bg-stone-900 text-stone-400 font-mono font-bold px-2 py-0.5 rounded border border-stone-800 uppercase tracking-wide">
                              ■ Neutral allocation
                            </span>
                            <span className="text-[9px] text-stone-500 block font-mono mt-1">0% Compound Impact</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
