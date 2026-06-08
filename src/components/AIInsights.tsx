import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Zap, 
  RefreshCw, 
  Coins,
  Calculator
} from 'lucide-react';
import { EchelonTheme, Asset, Loan, LoanType, Expense, FinancialGoal, BudgetCategoryLimit } from '../types';
import { getColorTokens } from '../utils/theme';
import { calculateWealthRates, calculateLoanCurrentBalance } from '../utils/math';

interface AIInsightsProps {
  theme: EchelonTheme;
  assets: Asset[];
  loans: Loan[];
  monthlyEarnings: number;
  expenses: Expense[];
  currencySymbol?: string;
  usdConversionRate?: number;
  goals?: FinancialGoal[];
  compiledInsightsText?: string;
  onUpdateCompiledInsightsText?: (text: string) => void;
  budgetCategoryLimits?: BudgetCategoryLimit[];
}

export default function AIInsights({
  theme,
  assets,
  loans,
  monthlyEarnings,
  expenses,
  currencySymbol = '₹',
  usdConversionRate = 83.5,
  goals = [],
  compiledInsightsText = '',
  onUpdateCompiledInsightsText,
  budgetCategoryLimits = [],
}: AIInsightsProps) {
  const [score, setScore] = useState<number>(65);
  
  // Interactive Offline Settings
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [compileStep, setCompileStep] = useState<number>(0);
  const [compileLogs, setCompileLogs] = useState<string[]>([]);
  const [simulatedMonthlyIncome, setSimulatedMonthlyIncome] = useState<number>(monthlyEarnings || 120000);
  const [includeNPS80CCD, setIncludeNPS80CCD] = useState<boolean>(true);

  const tokens = getColorTokens(theme);

  // 1. OFFLINE COGNITIVE HEURISTICS ENGINE CALCULATIONS
  const totalAssetsVal = assets.reduce((sum, a) => {
    // Convert US asset valuations to base currency using the usdConversionRate config
    const val = a.isUSAsset ? a.currentValue * usdConversionRate : a.currentValue;
    return sum + val;
  }, 0);

  const totalLentVal = loans
    .filter(l => l.type === LoanType.LENT)
    .reduce((sum, l) => sum + calculateLoanCurrentBalance(l), 0);
  const totalBorrowedVal = loans
    .filter(l => l.type === LoanType.BORROWED)
    .reduce((sum, l) => sum + calculateLoanCurrentBalance(l), 0);

  // Dynamic Portfolio Blended Yield
  let totalYieldAmount = 0;
  assets.forEach(a => {
    const r = a.annualGrowthRate !== undefined 
      ? a.annualGrowthRate 
      : (a.type === 'FD' ? 7.1 : a.type === 'BOND' ? 8.5 : (a.type === 'EQUITY' || a.type === 'STOCK') ? 12 : 3.5);
    const val = a.isUSAsset ? a.currentValue * usdConversionRate : a.currentValue;
    totalYieldAmount += val * (r / 100);
  });

  // Add lent out investments yielding their custom interestRate
  loans.forEach(loan => {
    if (loan.type === LoanType.LENT) {
      const balance = calculateLoanCurrentBalance(loan);
      totalYieldAmount += balance * (loan.interestRate / 100);
    }
  });

  let totalBorrowedInterestCosts = 0;
  loans.forEach(loan => {
    if (loan.type === LoanType.BORROWED) {
      const balance = calculateLoanCurrentBalance(loan);
      totalBorrowedInterestCosts += balance * (loan.interestRate / 100);
    }
  });

  // Denominator: Total investment capital base (converted assets + lent out contracts balance)
  const totalAssetsValConverted = assets.reduce((sum, a) => sum + (a.isUSAsset ? a.currentValue * usdConversionRate : a.currentValue), 0);
  const totalInvestmentBase = totalAssetsValConverted + totalLentVal;

  const blendedAPY = totalInvestmentBase > 0 
    ? ((totalYieldAmount - totalBorrowedInterestCosts) / totalInvestmentBase) * 100 
    : 0;

  // Identify high interest rate debts
  const highInterestDebts = loans.filter(l => l.type === LoanType.BORROWED && l.interestRate > blendedAPY);

  const netWorth = totalAssetsVal + totalLentVal - totalBorrowedVal;

  const rates = calculateWealthRates(assets, loans, monthlyEarnings, expenses, netWorth);

  // Emergency Shield (months of expenses covered by bank balance/liquid hold)
  const liquidCash = assets
    .filter(a => a.type === 'BANK_BALANCE' || a.type === 'FD')
    .reduce((sum, a) => {
      const val = a.isUSAsset ? a.currentValue * usdConversionRate : a.currentValue;
      return sum + val;
    }, 0);
  const recentSpends_30d = expenses.reduce((sum, e) => sum + e.amount, 0) || 15000;
  
  const emergencyShieldMonths = recentSpends_30d > 0 ? liquidCash / recentSpends_30d : 0;

  // Concentration Check
  const classes: Record<string, number> = { EQUITY: 0, STOCK: 0, FD: 0, BOND: 0, BANK_BALANCE: 0 };
  assets.forEach(a => {
    const val = a.isUSAsset ? a.currentValue * usdConversionRate : a.currentValue;
    classes[a.type] = (classes[a.type] || 0) + val;
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

  // Score generator
  useEffect(() => {
    let s = 60;
    if (blendedAPY > 8) s += 10;
    if (blendedAPY > 11) s += 5;
    if (emergencyShieldMonths >= 6) s += 15;
    else if (emergencyShieldMonths >= 3) s += 8;
    
    if (maxConcentrationPct < 50 && assets.length > 2) s += 10;
    
    const activeHighInterestCount = highInterestDebts.length;
    if (activeHighInterestCount === 0) s += 10;
    else s -= 12;

    if (rates.netPerMonth > 50000) s += 10;
    else if (rates.netPerMonth > 10000) s += 5;
    else if (rates.netPerMonth <= 0) s -= 20;

    setScore(Math.min(100, Math.max(10, s)));
  }, [blendedAPY, emergencyShieldMonths, maxConcentrationPct, highInterestDebts.length, rates.netPerMonth, assets.length]);

  // Gamified ranks
  const getRank = (scr: number) => {
    if (scr >= 90) return { title: 'Sovereign Emperor', color: 'text-amber-400', desc: 'Blended compounding dominance with high safety shields.' };
    if (scr >= 75) return { title: 'Echelon Elite', color: 'text-emerald-400', desc: 'Outstanding asset compounding and quiet accumulation speed.' };
    if (scr >= 50) return { title: 'Quiet Capitalist', color: 'text-blue-400', desc: 'Positive net income stream with balanced defensive metrics.' };
    return { title: 'Deficient Seeker', color: 'text-red-400', desc: 'At risk from expense leakages or compound debt velocities.' };
  };

  const rank = getRank(score);

  // Capital Gains calculations (Dynamic)
  const realEquityAssets = assets.filter(a => a.type === 'STOCK' || a.type === 'EQUITY');

  const analyzedEquityList = realEquityAssets.map(a => ({
    id: a.id,
    name: a.name,
    currentValue: a.currentValue,
    purchasePrice: a.purchasePrice || 0,
    purchaseDate: a.purchaseDate || '',
    isUSAsset: !!a.isUSAsset,
    isDemo: false
  }));

  // We group gains into LTCG or STCG
  let totalLTCG = 0;
  let totalSTCG = 0;
  let totalLTCGLoss = 0;
  let totalSTCGLoss = 0;

  const evaluatedGainsList = analyzedEquityList.map(a => {
    let gains = 0;
    let classification: 'LTCG' | 'STCG' | 'N/A' = 'N/A';
    let isLongTerm = false;
    let heldDays = 0;

    if (a.purchasePrice > 0) {
      gains = a.currentValue - a.purchasePrice;
    }

    if (a.purchaseDate) {
      const buyDate = new Date(a.purchaseDate);
      if (!isNaN(buyDate.getTime())) {
        const curDate = new Date('2026-06-05'); // Fixed local benchmark time
        const diffTime = curDate.getTime() - buyDate.getTime();
        heldDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        
        // Thresholds: US assets = 24 months (730 days), Domestic = 12 months (365 days)
        const thresholdDays = a.isUSAsset ? 730 : 365;
        isLongTerm = heldDays > thresholdDays;
        classification = isLongTerm ? 'LTCG' : 'STCG';

        // Translate Native USD gains to Base currency for Indian aggregated math if needed
        const valGains = a.isUSAsset ? gains * usdConversionRate : gains;

        if (valGains > 0) {
          if (isLongTerm) totalLTCG += valGains;
          else totalSTCG += valGains;
        } else if (valGains < 0) {
          if (isLongTerm) totalLTCGLoss += Math.abs(valGains);
          else totalSTCGLoss += Math.abs(valGains);
        }
      }
    }

    return {
      ...a,
      gains,
      classification,
      heldDays,
      isLongTerm
    };
  });

  // Net calculations factoring in tax-loss harvesting rules
  let netLTCG = Math.max(0, totalLTCG - totalLTCGLoss);
  let remainingSTCGLoss = totalSTCGLoss;
  
  let netSTCG = Math.max(0, totalSTCG - remainingSTCGLoss);
  let usedSTCGLossForSTCG = Math.min(totalSTCG, remainingSTCGLoss);
  remainingSTCGLoss -= usedSTCGLossForSTCG;

  if (remainingSTCGLoss > 0 && netLTCG > 0) {
    const offset = Math.min(netLTCG, remainingSTCGLoss);
    netLTCG -= offset;
    remainingSTCGLoss -= offset;
  }

  // Under New Rules: LTCG is taxed at 12.5% with standard ₹1,25,000 exemption limit. STCG taxed at 20%.
  const exemptLTCGLimit = 125000;
  const taxableLTCG = Math.max(0, netLTCG - exemptLTCGLimit);
  
  const ltcgTax = taxableLTCG * 0.125;
  const stcgTax = netSTCG * 0.20;

  const annualOtherInterestIncome = assets.reduce((sum, a) => {
    if (a.type === 'FD' || a.type === 'BANK_BALANCE') {
      const rate = a.annualGrowthRate !== undefined ? a.annualGrowthRate : (a.type === 'FD' ? 7.1 : 3.5);
      const val = a.isUSAsset ? a.currentValue * usdConversionRate : a.currentValue;
      return sum + (val * (rate / 100));
    }
    return sum;
  }, 0);

  const annualSalary = simulatedMonthlyIncome * 12;
  const totalOtherSources = annualOtherInterestIncome;
  const grossTotalIncome = annualSalary + totalOtherSources;

  const standardDeduction = 75000;
  const npsDeduction = includeNPS80CCD ? Math.min(annualSalary * 0.10, 50000) : 0; 
  const totalDeductions = standardDeduction + npsDeduction;
  const netTaxableIncome = Math.max(0, grossTotalIncome - totalDeductions);

  const calculateTax = (income: number) => {
    let tax = 0;
    const slabs = [
      { range: 'Up to ₹3,00,000', rate: '0%', limit: 300000, factor: 0 },
      { range: '₹3,00,001 - ₹7,00,000', rate: '5%', limit: 400000, factor: 0.05 },
      { range: '₹7,00,001 - ₹10,00,000', rate: '10%', limit: 300000, factor: 0.10 },
      { range: '₹10,00,001 - ₹12,00,000', rate: '15%', limit: 200000, factor: 0.15 },
      { range: '₹12,00,001 - ₹15,00,000', rate: '20%', limit: 300000, factor: 0.20 },
      { range: 'Above ₹15,00,000', rate: '30%', limit: Infinity, factor: 0.30 },
    ];

    let temp = income;
    for (let i = 0; i < slabs.length; i++) {
      const currentSlab = slabs[i];
      if (temp <= 0) break;
      const amtInSlab = Math.min(temp, currentSlab.limit);
      tax += amtInSlab * currentSlab.factor;
      temp -= amtInSlab;
    }

    if (income <= 700000) {
      tax = 0;
    }

    const healthEducationCess = tax * 0.04;
    return tax + healthEducationCess;
  };

  const estSlabFactor = netTaxableIncome > 1500000 ? 0.30 : netTaxableIncome > 1200000 ? 0.20 : netTaxableIncome > 1000000 ? 0.15 : netTaxableIncome > 700000 ? 0.10 : netTaxableIncome > 300000 ? 0.05 : 0;

  // Compile exact diagnostic one-liners
  const getSovereignOneLiners = (): string[] => {
    const list: string[] = [];

    // 1. Income & Tax Bracket
    if (grossTotalIncome > 1200000) {
      const savedAmt = Math.round(50000 * estSlabFactor);
      list.push(`Do claim ₹50,000 NPS (Section 80CCD) deduction to bag ₹${savedAmt.toLocaleString('en-IN')} extra tax savings. Why: Slab deduction`);
    } else {
      list.push(`Do keep total taxable income below ₹12L to avoid heavy taxation loss. Why: Rebate`);
    }

    // 2. Domestic Stocks (held <= 1 year is STCG; > 1 year is LTCG)
    const domesticStocks = evaluatedGainsList.filter(a => !a.isUSAsset);
    const stcgDom = domesticStocks.filter(a => !a.isLongTerm);
    const ltcgDom = domesticStocks.filter(a => a.isLongTerm);

    if (stcgDom.length > 0) {
      const names = stcgDom.map(a => a.name).join(', ');
      list.push(`Don't sell short-term domestic stocks (${names}) to avoid 20% active taxation loss. Why: STCG`);
    }

    if (ltcgDom.length > 0) {
      const names = ltcgDom.map(a => a.name).join(', ');
      list.push(`Do sell long-term domestic stocks (${names}) to bag ₹1.25 Lakhs tax-free exemption profit. Why: LTCG`);
    }

    // 3. US Stocks (held <= 2 years is US STCG; > 2 years is US LTCG)
    const usStocks = evaluatedGainsList.filter(a => a.isUSAsset);
    const stcgUS = usStocks.filter(a => !a.isLongTerm);
    const ltcgUS = usStocks.filter(a => a.isLongTerm);

    if (stcgUS.length > 0) {
      const names = stcgUS.map(a => a.name).join(', ');
      list.push(`Don't sell short-term US stocks (${names}) to avoid active tax slab rate loss. Why: STCG`);
    }

    if (ltcgUS.length > 0) {
      const names = ltcgUS.map(a => a.name).join(', ');
      list.push(`Do sell long-term US stocks (${names}) to bag 12.5% taxation rate profit. Why: LTCG`);
    }

    // 4. Corporate Bonds & Credit Quality Ratings
    const bondsList = assets.filter(a => a.type === 'BOND');
    bondsList.forEach(b => {
      const yieldPct = b.annualGrowthRate !== undefined ? b.annualGrowthRate : 8.5;
      list.push(`Do hold ${b.name} corporate bonds to bag stable ${yieldPct}% coupon interest profit. Why: Bond payout`);
    });

    // 5. Debt Drag / Leaks Checks
    highInterestDebts.forEach(l => {
      const currentDebtVal = calculateLoanCurrentBalance(l);
      list.push(`Do pay off ${l.name} debt of ${currencySymbol}${currentDebtVal.toLocaleString()} immediately to avoid high interest rate loss. Why: Overspent`);
    });

    // 6. Emergency Buffer Cushion
    if (emergencyShieldMonths < 6) {
      const deficiency = Math.max(0, Math.ceil(recentSpends_30d * 6 - liquidCash));
      list.push(`Do accumulate ${currencySymbol}${deficiency.toLocaleString()} in liquid cash to avoid immediate reserve depletion loss. Why: Low buffer`);
    } else {
      list.push(`Do hold stable cash reserves at ${emergencyShieldMonths.toFixed(1)} months to bag compound safety preservation profit. Why: Shield ok`);
    }

    // 7. Budget / Spends checking
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(e => {
      const catName = e.category.toLowerCase().trim();
      categoryTotals[catName] = (categoryTotals[catName] || 0) + e.amount;
    });

    let budgetSpendsFound = false;
    if (budgetCategoryLimits && budgetCategoryLimits.length > 0) {
      budgetCategoryLimits.forEach(cl => {
        const catName = cl.category.toLowerCase().trim();
        const spent = categoryTotals[catName] || 0;
        if (spent > cl.limit) {
          budgetSpendsFound = true;
          if (catName === 'snacks' || catName.includes('snack')) {
            list.push(`Don't spend more on category Snacks to avoid overspent loss. Why: Try to consume less on the category snacks`);
          } else {
            list.push(`Don't spend more on category ${cl.category} to avoid overspent loss. Why: Overspent`);
          }
        } else if (spent > cl.limit * 0.8) {
          budgetSpendsFound = true;
          if (catName === 'snacks' || catName.includes('snack')) {
            list.push(`Don't spend more on category Snacks to avoid imminent overspent loss. Why: Try to consume less on the category snacks`);
          } else {
            list.push(`Don't spend more on category ${cl.category} to avoid imminent overspent loss. Why: Overspent`);
          }
        }
      });
    }

    const snacksEntry = Object.entries(categoryTotals).find(([cat]) => cat === 'snacks' || cat.includes('snack'));
    const hasSnacksSpends = snacksEntry && snacksEntry[1] > 0;

    if (!budgetSpendsFound || hasSnacksSpends) {
      list.push(`Don't spend more on category Snacks to avoid discretionary leak loss. Why: Try to consume less on the category snacks`);

      const sortedHighest = Object.entries(categoryTotals)
        .filter(([cat]) => cat !== 'snacks' && !cat.includes('snack'))
        .sort((a, b) => b[1] - a[1]);

      if (sortedHighest.length > 0) {
        const [highestCat] = sortedHighest[0];
        const formattedCatName = highestCat.charAt(0).toUpperCase() + highestCat.slice(1);
        list.push(`Don't spend more on category ${formattedCatName} to avoid budget overrun loss. Why: Overspent`);
      }
    }

    // 8. General Cash flow status
    if (rates.netPerMonth <= 0) {
      list.push(`Don't maintain monthly discretionary cash outlays to avoid -${currencySymbol}${Math.abs(rates.netPerMonth).toLocaleString()} monthly deficit loss. Why: Overspent`);
    } else {
      list.push(`Do invest your +${currencySymbol}${rates.netPerMonth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/mo net surplus to bag extra compounding passive gains. Why: LTCG`);
    }

    return list;
  };

  const triggerQuantumAICompile = async () => {
    setIsCompiling(true);
    setCompileStep(0);
    setCompileLogs([
      '📟 [BOOT SEQUENCE] Initiating Echelon Sovereignty Core...',
      '📡 Ingesting live financial feed (Assets, Debts, Spent-logs, Budget cap)...'
    ]);

    const runLogs = [
      '📊 Ingesting live financial feed (Assets, Debts, Spent-logs, Budget cap)...',
      '📈 Standardizing categories... (STOCKS, BONDS, LIQUID FDs, BANK DEPOSITS)',
      '🏛️ Simulating New Regime Tax Slabs & exemption thresholds...',
      '🧮 Executing gradient-boosting arbitrage checks... (Blended APY matching)',
      '🔋 Compiling bespoke tax-saving commands. Deep Learning optimization complete!'
    ];

    for (let i = 0; i < runLogs.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, i === 0 ? 300 : 500));
      setCompileStep(i + 1);
      setCompileLogs((prev) => [...prev, `⚡ ${runLogs[i]}`]);
    }

    setIsCompiling(false);
  };

  return (
    <div id="cognitive-ai-insights-core" className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      
      {/* LEFT: HEURISTICS GAMIFIED RADAR */}
      <div className={`xl:col-span-1 p-6 rounded-3xl border ${tokens.card} ${tokens.glow} flex flex-col justify-between transition-all duration-300 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 h-32 w-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Cpu className="h-5 w-5 text-amber-500" />
            <h3 className={`text-base font-bold font-display ${tokens.textPrimary}`}>Local Security Diagnostic</h3>
          </div>

          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative w-32 h-32 flex items-center justify-center mb-4">
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

          <div className="space-y-3 mt-4 pt-4 border-t border-dashed border-stone-800/20 dark:border-stone-100/10">
            <h4 className="text-[10px] uppercase font-bold text-stone-500 font-mono tracking-wider">Compounded Diagnostics</h4>
            
            <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-stone-500/5 hover:bg-stone-500/10 transition-all border border-stone-500/5">
              <div className="flex items-center gap-2">
                {blendedAPY >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-rose-400" />
                )}
                <span className="text-stone-400">Blended APY</span>
              </div>
              <span className={`font-mono font-bold ${blendedAPY >= 0 ? tokens.textPrimary : 'text-rose-500 dark:text-rose-400 font-bold'}`}>
                {blendedAPY.toFixed(1)}%
              </span>
            </div>

            <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-stone-500/5 hover:bg-stone-500/10 transition-all border border-stone-500/5">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-500" />
                <span className="text-stone-400">Reserve Cover</span>
              </div>
              <span className={`font-mono font-bold ${tokens.textPrimary}`}>
                {emergencyShieldMonths > 12 ? '12+ mo' : `${emergencyShieldMonths.toFixed(1)} mo`}
              </span>
            </div>

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

      {/* RIGHT: DETAILED RECOMMENDATIONS - SINGLE TAB SOVEREIGN REALTIME ENGINE */}
      <div className={`xl:col-span-2 p-6 rounded-3xl border ${tokens.card} ${tokens.glow} flex flex-col justify-between transition-all duration-300`}>
        <div>
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-800/40">
            <div className="flex items-center gap-2.5">
              <Calculator className="h-5 w-5 text-amber-500" />
              <div>
                <h2 id="sovereign-tax-shield-heading" className={`text-base font-bold font-display ${tokens.textPrimary}`}>Sovereign Tax Shield & Gains Advisor</h2>
                <p className="text-[11px] text-stone-500">Autonomous Swiss-neutral offline model & New regime tax slab optimization</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-stone-500/10 border border-stone-800/80 rounded-lg text-[10px] font-mono text-stone-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>CONTAINED OFFLINE MODE</span>
            </div>
          </div>

          {isCompiling ? (
            <div className="p-6 bg-[#040405] border border-amber-500/20 rounded-2xl flex flex-col justify-between font-mono text-[11px] min-h-[300px] shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.02] to-transparent pointer-events-none" />
              
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-stone-850/50 mb-4">
                  <span className="text-amber-500 font-extrabold uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                    ⚡ QUANTUM COMPILER ACTIVE
                  </span>
                  <span className="text-stone-500">[STRICT CONTAINMENT]</span>
                </div>

                <div className="space-y-1.5 mb-6">
                  <div className="flex justify-between font-bold text-stone-400">
                    <span>MODEL VECTOR COMPILING</span>
                    <span className="text-amber-400">{compileStep * 20}%</span>
                  </div>
                  <div className="w-full bg-[#08080a] border border-stone-800 p-1 rounded-lg font-mono">
                    <span className="text-emerald-500 block leading-none font-bold select-none">
                      {'█'.repeat(compileStep * 4)}{'░'.repeat((5 - compileStep) * 4)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-[160px] overflow-y-auto font-mono text-stone-300">
                  {compileLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-2 text-stone-400 leading-normal">
                      <span className="text-amber-500 shrink-0">&gt;</span>
                      <p className="truncate">{log}</p>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[9px] text-stone-600 mt-4 leading-relaxed uppercase tracking-wider font-extrabold">
                Secure offline process in-situ within browser memory registers.
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in font-sans">
              
              {/* Compile bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-[#030304]/80 border border-stone-800 rounded-2xl mb-4 shadow-[0_0_15px_rgba(245,158,11,0.03)]">
                <div className="flex items-center gap-2">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                  <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider">
                    Model Learning Coherence Active
                  </span>
                </div>
                <button 
                  onClick={triggerQuantumAICompile} 
                  className="w-full sm:w-auto px-4 py-2 sm:py-1.5 bg-amber-500 hover:bg-amber-450 text-stone-950 font-mono text-[10px] uppercase font-black tracking-wide rounded-xl transition-all flex items-center justify-center gap-1.5 hover:shadow-[0_0_12px_rgba(245,158,11,0.25)] hover:scale-102 active:scale-95"
                >
                  <RefreshCw className="h-3 w-3 animate-spin-slow" />
                  Compile Sovereign Advice
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-[#010102]/60 border border-stone-850 space-y-3.5">
                <div className="flex items-center justify-between border-b border-stone-850 pb-2.5">
                  <h4 className="text-[10px] font-mono font-bold uppercase text-amber-500 flex items-center gap-1.5">
                    <Brain className="h-3.5 w-3.5 text-amber-500" /> Learnt Sovereign Guidance Checklist
                  </h4>
                </div>

                <div className="space-y-3">
                  {getSovereignOneLiners().map((insight, idx) => {
                    const isAlert = insight.includes('⚠️') || insight.includes('🛑') || insight.includes('🚨');
                    return (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                          isAlert 
                            ? 'bg-red-500/5 border-red-500/30 text-red-100 shadow-[0_0_12px_rgba(239,68,68,0.08)]' 
                            : 'bg-[#060608]/45 border-stone-850/60 hover:bg-stone-500/[0.02]'
                        }`}
                      >
                        <div className={`mt-0.5 shrink-0 h-4 w-4 rounded-full flex items-center justify-center ${
                          isAlert ? 'text-red-400 animate-pulse' : 'text-emerald-400'
                        }`}
                        >
                          {isAlert ? <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> : <CheckCircle className="h-3.5 w-3.5" />}
                        </div>
                        <p className={`text-xs leading-relaxed ${isAlert ? 'text-red-200/90' : 'text-stone-400'}`}>
                          {insight}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Action Tip banner below */}
        <div className="mt-6 flex items-center justify-between p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="text-[11px] text-stone-400 leading-snug">
              <strong>Echelon Wealth Hack:</strong> Keep liquid buffers securely matching current expenditures to preserve long-range passive compounding momentum across foreign & domestic markets.
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
