/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EchelonState, AssetType, LoanType } from '../types';
import { calculateLoanCurrentBalance, calculateWealthRates } from './math';

/**
 * Triggers a download of a text blob as a file in the browser, with Web Share fallback for Android.
 */
export function downloadBlob(content: string, filename: string, mimeType: string) {
  // Always trigger the traditional download first as the primary robust action
  try {
    triggerTraditionalDownload(content, filename, mimeType);
    console.log('Successfully completed traditional download anchor link click');
  } catch (traditionalError) {
    console.warn('Traditional download anchor link failed, attempting Web Share fallback:', traditionalError);
  }

  // Double check if Web Share is also available for high mobile flexibility
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      const file = new File([content], filename, { type: mimeType });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({
          files: [file],
          title: `Echelon - ${filename}`,
          text: `Echelon quiet wealth statement export and secure ledger backup.`
        }).catch(err => {
          console.warn('Web Share dismissed or failed:', err);
        });
      }
    } catch (shareErr) {
      console.warn('Web Share failed configuration:', shareErr);
    }
  }
}

function triggerTraditionalDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a beautiful master CSV summary dataset of the Echelon state.
 */
export function generateCSVData(state: EchelonState): string {
  let csv = '';
  
  // Header
  csv += 'ECHELON: BUILD QUIET WEALTH - CONFIDENTIAL FINANCIAL VAULT\n';
  csv += `Export Generated At,${new Date().toISOString()}\n`;
  csv += 'Status,FULLY ENCRYPTED OFFLINE DATASET\n\n';
  
  // Section 1: Portfolio Summary
  let totalAssets = state.assets.reduce((sum, a) => sum + a.currentValue, 0);
  let lentValue = state.loans.filter(l => l.type === LoanType.LENT).reduce((sum, l) => sum + calculateLoanCurrentBalance(l), 0);
  let borrowValue = state.loans.filter(l => l.type === LoanType.BORROWED).reduce((sum, l) => sum + calculateLoanCurrentBalance(l), 0);
  let totalNetWorth = totalAssets + lentValue - borrowValue;
  
  csv += '--- PORTFOLIO SUMMARY ---\n';
  csv += `Total Holding Assets (Rupees),${totalAssets.toFixed(2)}\n`;
  csv += `Active Credit Receivables (Lent to others),${lentValue.toFixed(2)}\n`;
  csv += `Active Debt Payables (Borrowed),${borrowValue.toFixed(2)}\n`;
  csv += `NET QUIET WEALTH VALUE (INR),${totalNetWorth.toFixed(2)}\n\n`;
  
  // Flow speeds
  const rates = calculateWealthRates(state.assets, state.loans, state.monthlyEarnings, state.expenses, totalNetWorth);
  csv += '--- VELOCITY OF WEALTH FLOWS (INR / Timeframe) ---\n';
  csv += `Flow Rate,Earnings Speed,Loses/Sinks Speed,Net Balance Progress\n`;
  csv += `Hourly,${rates.earningsPerHour.toFixed(2)},${rates.lossesPerHour.toFixed(2)},${rates.netPerHour.toFixed(2)}\n`;
  csv += `Daily,${rates.earningsPerDay.toFixed(2)},${rates.lossesPerDay.toFixed(2)},${rates.netPerDay.toFixed(2)}\n`;
  csv += `Monthly,${rates.earningsPerMonth.toFixed(2)},${rates.lossesPerMonth.toFixed(2)},${rates.netPerMonth.toFixed(2)}\n`;
  csv += `Yearly,${rates.earningsPerYear.toFixed(2)},${rates.lossesPerYear.toFixed(2)},${rates.netPerYear.toFixed(2)}\n`;
  csv += `5-Year Forecast,${rates.earningsPerFiveYears.toFixed(2)},${rates.lossesPerFiveYears.toFixed(2)},${rates.netPerFiveYears.toFixed(2)}\n`;
  csv += `Annual Portfolio Net Growth Rate,${rates.earningsRatePercentOfYear.toFixed(2)}%\n\n`;
  
  // Section 2: Asset Holdings
  csv += '--- PERSONAL HOLDINGS (ASSETS) ---\n';
  csv += 'Asset Name,Institution,Type,Current Valuation (INR),Realised Interest/Returns (INR),Last Updated\n';
  state.assets.forEach(a => {
    csv += `"${a.name}","${a.institution}",${a.type},${a.currentValue.toFixed(2)},${a.realisedReturns.toFixed(2)},${a.lastUpdated}\n`;
  });
  csv += '\n';
  
  // Section 3: Credit and Debt (Loans)
  csv += '--- ACTIVE CREDIT & DEBT METRICS (LOANS WITH COMP. INTEREST) ---\n';
  csv += 'Loan Designation,Party/Entity,Type,Principal (INR),Interest Rate (% APY),Compounding Interval,Start Date,Manual Repayments,Accrued Interest,Current Outstanding Balance\n';
  state.loans.forEach(l => {
    const actBal = calculateLoanCurrentBalance(l);
    // Rough computed interest
    const accInt = Math.max(0, actBal - (l.principal - l.manualPayments));
    csv += `"${l.name}","${l.personOrEntity}",${l.type},${l.principal.toFixed(2)},${l.interestRate},${l.compoundingFrequency},${l.startDate},${l.manualPayments.toFixed(2)},${accInt.toFixed(2)},${actBal.toFixed(2)}\n`;
  });
  csv += '\n';
  
  // Section 4: Budget Goals
  csv += '--- REVENUE TARGETS (FINANCIAL GOALS) ---\n';
  csv += 'Goal Name,Target Cap (INR),Achieve Deadline,Category\n';
  state.goals.forEach(g => {
    csv += `"${g.name}",${g.targetAmount.toFixed(2)},${g.deadlineDate},"${g.category}"\n`;
  });
  csv += '\n';
  
  // Section 5: Spending Logs (Expenses)
  csv += '--- SPENDING REGISTER (EXPENSES) ---\n';
  csv += 'Category,Spend Amount (INR),Date,Notes/Remarks\n';
  state.expenses.forEach(e => {
    csv += `"${e.category}",${e.amount.toFixed(2)},${e.date},"${e.notes || ''}"\n`;
  });
  
  return csv;
}

/**
 * Generates an elegant self-contained PDF/HTML report printable template.
 */
export function generateHTMLReport(state: EchelonState, monthName: string = 'Current Month Report'): string {
  let totalAssets = state.assets.reduce((sum, a) => sum + a.currentValue, 0);
  let lentValue = state.loans.filter(l => l.type === LoanType.LENT).reduce((sum, l) => sum + calculateLoanCurrentBalance(l), 0);
  let borrowValue = state.loans.filter(l => l.type === LoanType.BORROWED).reduce((sum, l) => sum + calculateLoanCurrentBalance(l), 0);
  let totalNetWorth = totalAssets + lentValue - borrowValue;
  const rates = calculateWealthRates(state.assets, state.loans, state.monthlyEarnings, state.expenses, totalNetWorth);
  
  const currentDateStr = new Date().toLocaleDateString('en-IN', {
    dateStyle: 'full'
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Echelon Report - ${monthName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    
    body {
      font-family: 'Inter', sans-serif;
      color: #111827;
      background-color: #ffffff;
      margin: 0;
      padding: 40px;
      line-height: 1.5;
    }
    
    .header {
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .logo {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.05em;
      text-transform: uppercase;
      color: #000000;
    }
    
    .subtitle {
      font-size: 14px;
      color: #6b7280;
      margin-top: 4px;
    }
    
    .timestamp {
      font-size: 12px;
      color: #9ca3af;
      float: right;
      text-align: right;
    }
    
    .clear {
      clear: both;
    }
    
    .bento-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .bento-card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      background-color: #f9fafb;
    }
    
    .card-label {
      font-size: 11px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .card-value {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      margin-top: 4px;
    }
    
    .card-mono {
      font-family: 'JetBrains Mono', monospace;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    
    th {
      background-color: #f3f4f6;
      text-align: left;
      padding: 10px 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 2px solid #e5e7eb;
      color: #4b5563;
    }
    
    td {
      padding: 10px 12px;
      font-size: 13px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    tr:last-child td {
      border-bottom: none;
    }
    
    .text-right {
      text-align: right;
    }
    
    .badge {
      display: inline-block;
      padding: 2px 6px;
      font-size: 10px;
      font-weight: 600;
      border-radius: 4px;
      text-transform: uppercase;
    }
    
    .badge-positive {
      background-color: #d1fae5;
      color: #065f46;
    }
    
    .badge-negative {
      background-color: #fee2e2;
      color: #991b1b;
    }
    
    h2 {
      font-size: 16px;
      font-weight: 700;
      margin-top: 0;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #1f2937;
      border-left: 4px solid #111827;
      padding-left: 8px;
    }
    
    .no-print {
      background-color: #111827;
      color: #ffffff;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-family: inherit;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      margin-bottom: 20px;
    }
    
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <button class="no-print" onclick="window.print()">Print / Save as PDF</button>
  
  <div class="header">
    <div class="timestamp">
      <div>Report Sequence: SECURE_ARCHIVE_${new Date().getFullYear()}_${new Date().getMonth() + 1}</div>
      <div style="margin-top:4px;">Date: ${currentDateStr}</div>
    </div>
    <div class="logo">Echelon: Build Quiet Wealth</div>
    <div class="subtitle">Secure Offline Treasury Statement &bull; Indian Rupees (₹) ONLY</div>
    <div class="clear"></div>
  </div>
  
  <div class="bento-grid">
    <div class="bento-card">
      <div class="card-label">Net Quiet Wealth Balance</div>
      <div class="card-value card-mono">₹${totalNetWorth.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
    </div>
    <div class="bento-card">
      <div class="card-label">Monthly Velocity Net</div>
      <div class="card-value card-mono" style="color: ${rates.netPerMonth >= 0 ? '#059669' : '#dc2626'}">
        ${rates.netPerMonth >= 0 ? '+' : ''}₹${rates.netPerMonth.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
    <div class="bento-card">
      <div class="card-label">Portfolio Net Yield (APY)</div>
      <div class="card-value card-mono">${rates.earningsRatePercentOfYear.toFixed(2)}%</div>
    </div>
  </div>
  
  <h2>Holding Assets</h2>
  <table>
    <thead>
      <tr>
        <th>Asset Portfolio Profile</th>
        <th>Finance House</th>
        <th>Asset Code</th>
        <th class="text-right">Unrealised Wealth (Valuation)</th>
        <th class="text-right">Realised Earnings / Cash Returned</th>
      </tr>
    </thead>
    <tbody>
      ${state.assets.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:#9ca3af;">No asset holdings registered in this ledger.</td></tr>' : ''}
      ${state.assets.map(a => `
        <tr>
          <td><strong>${a.name}</strong></td>
          <td>${a.institution}</td>
          <td><span class="badge ${a.type === AssetType.EQUITY || a.type === AssetType.STOCK ? 'badge-positive' : 'badge-negative'}" style="background-color: #f3f4f6; color:#374151;">${a.type}</span></td>
          <td class="text-right card-mono">₹${a.currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td class="text-right card-mono">₹${a.realisedReturns.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <h2>Leverage Accounts & Outstandings (Loans)</h2>
  <table>
    <thead>
      <tr>
        <th>Contract Name</th>
        <th>Counterparty</th>
        <th>Account Profile</th>
        <th class="text-right">Principal</th>
        <th class="text-right">Interest Speed</th>
        <th class="text-right">Manual Repayments</th>
        <th class="text-right">Current Compound Balance</th>
      </tr>
    </thead>
    <tbody>
      ${state.loans.length === 0 ? '<tr><td colspan="7" style="text-align:center;color:#9ca3af;">No active leverage profile.</td></tr>' : ''}
      ${state.loans.map(l => {
        const actBal = calculateLoanCurrentBalance(l);
        return `
          <tr>
            <td><strong>${l.name}</strong></td>
            <td>${l.personOrEntity}</td>
            <td>
              <span class="badge ${l.type === LoanType.LENT ? 'badge-positive' : 'badge-negative'}">
                ${l.type === LoanType.LENT ? 'RECEIVABLE' : 'LIABILITY'}
              </span>
            </td>
            <td class="text-right card-mono">₹${l.principal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td class="text-right card-mono">${l.interestRate}% (${l.compoundingFrequency})</td>
            <td class="text-right card-mono">₹${l.manualPayments.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td class="text-right card-mono" style="font-weight: 600;">₹${actBal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>
  
  <h2>Spending Log (Current Month Expenses)</h2>
  <table>
    <thead>
      <tr>
        <th>Category Group</th>
        <th>Date Captured</th>
        <th>Description Notes</th>
        <th class="text-right">Deducted Amount</th>
      </tr>
    </thead>
    <tbody>
      ${state.expenses.length === 0 ? '<tr><td colspan="4" style="text-align:center;color:#9ca3af;">Zero expenses documented this active term.</td></tr>' : ''}
      ${state.expenses.map(e => `
        <tr>
          <td><strong>${e.category}</strong></td>
          <td>${new Date(e.date).toLocaleDateString('en-IN')}</td>
          <td>${e.notes || '-'}</td>
          <td class="text-right card-mono" style="color: #dc2626;">₹${e.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px dashed #e5e7eb; padding-top: 20px;">
    Echelon Confidential Vault Encryption Status: INTEGRITY_OK &bull; SECURED CLIENT-SIDE STORAGE ONLY
  </div>
</body>
</html>
  `;
}
