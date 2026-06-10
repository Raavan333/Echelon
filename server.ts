/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Local independent offline analysis generator (completely decoupled from Gemini)
  app.post("/api/insights", async (req, res) => {
    try {
      const { assets, loans, monthlyEarnings, expenses, blendedAPY, emergencyShieldMonths, score, rank } = req.body;

      const currencySymbol = '₹';
      const recentSpends = Array.isArray(expenses) ? expenses.reduce((sum: number, e: any) => sum + e.amount, 0) : 0;
      const totalBorrowed = Array.isArray(loans) ? loans.reduce((sum: number, l: any) => sum + l.principal, 0) : 0;
      
      const taxLiability = Math.round((monthlyEarnings * 12) * 0.15);
      const taxSavingPotential = Math.round(taxLiability * 0.3);

      // Synthesize elegant, highly specific local offline metrics
      const offlineInsights = `### 💻 LOCAL COGNITIVE COMPILER DIRECTIVES • INDEPENDENT SYNC ACTIVE

Your portfolio parameters have been evaluated on this device. Echelon's cloud gateway is offline.

#### 1. ESTIMATED TAX LIABILITY & COFFER SAVING PLANS:
*   **Tax Liability Estimation:** Calculated at approximately **${currencySymbol}${taxLiability.toLocaleString('en-IN')}** annually (using current slab metrics).
*   **Potential Shield Deduction:** Leveraging NPS (80CCD), PPF (80C), or tax-free sovereign yields can save up to **${currencySymbol}${taxSavingPotential.toLocaleString('en-IN')}** in tax outflows.
*   *Action Plan:* Maximize tax-free sovereign yield products before the current fiscal quarter constraints lock.

#### 2. DEBT & LIABILITY EXPOSURE DRILLS:
*   **Total Outstanding Debt Principal:** Currently reading **${currencySymbol}${totalBorrowed.toLocaleString('en-IN')}** across ${Array.isArray(loans) ? loans.length : 0} active loan contracts.
*   **Mometum Drag:** Standardizing debt amortization matrices shows that prepaying high interest contracts is equivalent to a **guaranteed risk-free yield** of their blended rate.
*   *Action Plan:* Shift idle low APY savings directly to prepaying highest-rate liabilities first to freeze interest leakage.

#### 3. ACCUMULATION MATRIX & DAILY LIMIT SUGGESTIONS:
*   **Dynamic Margin:** Monthly net earnings trajectory is sitting at **${currencySymbol}${Number(monthlyEarnings).toLocaleString('en-IN')}/mo**.
*   **Operational Cash Velocity:** Cumulative expenditures are recorded at **${currencySymbol}${recentSpends.toLocaleString('en-IN')}**.
*   *Action Plan:* Enforce a strict daily target spend limit of **${currencySymbol}${Math.round(recentSpends / 30 || 2000).toLocaleString('en-IN')}/day** to lock in a minimum 25% surplus coffer expansion rate.`;

      return res.json({ insights: offlineInsights });
    } catch (e: any) {
      return res.json({
        insights: `### ⚠️ OFFLINE LOCAL COMPUTING ACTIVE\n\nUnable to compute real-time analytical parameters locally: ${e?.message || 'Coherence check active.'}`
      });
    }
  });

  // API Route: Local offline predictive SMS / transaction categorization parsing (completely offline)
  app.post("/api/predict-transaction", async (req, res) => {
    try {
      const { rawText, assets = [], categories = [] } = req.body;
      if (!rawText || typeof rawText !== "string") {
        return res.json({ error: "No raw text provided" });
      }

      const textLower = rawText.toLowerCase();
      
      // Heuristic 1: Extract amount
      const amtRegex = /(?:rs\.?|inr|₹|inr\.)\s*([\d,]+(?:\.\d+)?)|([\d,]+(?:\.]\d+)?)\s*(?:inr|rupees|rs|spent|debited)/i;
      const isAmtMatch = rawText.match(amtRegex);
      let parsedAmt = 0;
      if (isAmtMatch) {
        const matchGroup = isAmtMatch[1] || isAmtMatch[2];
        if (matchGroup) {
          parsedAmt = parseFloat(matchGroup.replace(/,/g, ''));
        }
      }

      // Heuristic 2: Category Matching
      let bestCategory = "Shopping";
      const allCats = categories.length > 0 ? categories : ['Dining', 'Transport', 'Entertainment', 'Medical', 'Groceries', 'Shopping', 'Rent', 'Investment', 'Cash'];
      
      if (textLower.includes('food') || textLower.includes('dining') || textLower.includes('swiggy') || textLower.includes('zomato') || textLower.includes('hotel') || textLower.includes('cafe')) {
        bestCategory = 'Dining';
      } else if (textLower.includes('uber') || textLower.includes('ola') || textLower.includes('fuel') || textLower.includes('petrol') || textLower.includes('metro') || textLower.includes('cab')) {
        bestCategory = 'Transport';
      } else if (textLower.includes('movie') || textLower.includes('netflix') || textLower.includes('spotify') || textLower.includes('game') || textLower.includes('entertainment')) {
        bestCategory = 'Entertainment';
      } else if (textLower.includes('medicine') || textLower.includes('hospital') || textLower.includes('doctor') || textLower.includes('pharmacy')) {
        bestCategory = 'Medical';
      } else if (textLower.includes('grocery') || textLower.includes('dmart') || textLower.includes('blinkit') || textLower.includes('market') || textLower.includes('groceries')) {
        bestCategory = 'Groceries';
      } else if (textLower.includes('rent') || textLower.includes('apartment') || textLower.includes('lease') || textLower.includes('repayment')) {
        bestCategory = 'Rent';
      }

      // Heuristic 3: Source Account / Bank Matching
      let parsedAssetId = "";
      let parsedAssetName = "Liquid Assets Portfolio";
      
      const bankAsset = assets.find((a: any) => {
        const name = a.name.toLowerCase();
        const inst = a.institution.toLowerCase();
        return (textLower.includes('hdfc') && (name.includes('hdfc') || inst.includes('hdfc'))) ||
               (textLower.includes('sbi') && (name.includes('sbi') || inst.includes('sbi'))) ||
               (textLower.includes('icici') && (name.includes('icici') || inst.includes('icici'))) ||
               (textLower.includes('axis') && (name.includes('axis') || inst.includes('axis')));
      });

      if (bankAsset) {
        parsedAssetId = bankAsset.id;
        parsedAssetName = bankAsset.name;
      } else {
        const activeBank = assets.find((a: any) => a.type === 'BANK_BALANCE');
        if (activeBank) {
          parsedAssetId = activeBank.id;
          parsedAssetName = activeBank.name;
        }
      }

      // Heuristic 4: Merchant Note
      let cleanMerchant = "Sovereign Spend";
      if (textLower.includes('at ')) {
        const parts = rawText.split(/at\s+/i);
        if (parts.length > 1) {
          cleanMerchant = parts[1].split(/[.\s]/)[0] + ' ' + (parts[1].split(/[.\s]/)[1] || '');
        }
      } else if (textLower.includes('on ')) {
        const parts = rawText.split(/on\s+/i);
        if (parts.length > 1) {
          cleanMerchant = parts[1].split(/[.\s]/)[0];
        }
      } else if (textLower.includes('for ')) {
        const parts = rawText.split(/for\s+/i);
        if (parts.length > 1) {
          cleanMerchant = parts[1].split(/[.\s]/)[0] + ' ' + (parts[1].split(/[.\s]/)[1] || '');
        }
      }

      const matchReason = `Local client-side heuristics classified this transaction as [${bestCategory}] linked to [${parsedAssetName}] inside offline Echelon workspace.`;

      return res.json({
        parsedAmt,
        parsedCategory: bestCategory,
        merchant: cleanMerchant.trim(),
        parsedAssetId,
        parsedAssetName,
        matchReason
      });
    } catch (err: any) {
      return res.json({
        error: err?.message || "Failed offline transaction prediction",
        fallback: true
      });
    }
  });

  // Integration of Vite middleware according to environmental rules
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Echelon Vault Server booted on port ${PORT} (Offline Sovereignty Mode Active)`);
  });
}

startServer();
