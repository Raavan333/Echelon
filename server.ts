/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Secure server-side proxy for Gemini 3.5 AI portfolio analysis
  app.post("/api/insights", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({
          insights: `🚨 SECURE GATEWAY ALERT: No personal GEMINI_API_KEY detected in Settings > Secrets.\n\nTo power premium deep strategic advice from the Gemini-3.5-Flash model, please paste a valid Gemini development key into your Echelon vault's secrets configurations inside the AI Studio top bar settings. In the meantime, your local Cognitive Heuristics Diagnostic Sandbox is fully operational offline!`
        });
      }

      const { assets, loans, monthlyEarnings, expenses, blendedAPY, emergencyShieldMonths, score, rank } = req.body;

      // Lazy load SDK client with high-end safety headers
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      // Prepare context prompt
      const systemPrompt = `You are the Echelon Sovereign Wealth Advisor AI.
The user wants a simple, direct, and highly precise summary of their taxes, portfolio weaknesses, and clear actions to save money. Do not dump tax law textbooks, rules, or long-winded paragraphs. Focus only on their numbers and exact actions.

Aesthetic Guidelines:
- Highlight the exact figures: estimated tax liability and how much they can save.
- Use simple, short bullet points.
- No dry tax law filler. Speak only about what they need to do for their money.

Portfolio Context:
- Net Worth Health Score: ${score}/100
- Earned Quiet Rank: ${rank}
- Blended Portfolio APY: ${blendedAPY}%
- Emergency Cash Shield Cover: ${emergencyShieldMonths} months
- Vault Assets list: ${JSON.stringify(assets)}
- Active Loan contracts: ${JSON.stringify(loans)}
- Monthly Net Earnings Surplus (after expenses): ${monthlyEarnings} INR
- Logged Spends: ${JSON.stringify(expenses)}

Provide a highly scannable, 3-step action plan:
1. YOUR ESTIMATED TAX LIABILITY & SAVE PLANS: (Specify exactly what we estimate they owe based on their salary/assets and the precise steps they can take to save, e.g., NPS, tax-free instruments)
2. DEBT & LEVERAGE LEAKS: (Immediate prepay commands to stop interest leakage)
3. DISCRETIONARY BUDGET CAP WARNINGS: (Simple daily spending adjustments to keep accumulation high)`;

      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: systemPrompt,
        });
        const insightsText = response?.text || 'Failed to synthesize portfolio insights. Please try again.';
        return res.json({ insights: insightsText });
      } catch (geminiErr: any) {
        // Build a highly descriptive error string from all possible fields of the error object
        const errStr = [
          geminiErr?.message,
          geminiErr?.status,
          geminiErr?.statusCode,
          geminiErr?.toString(),
          JSON.stringify(geminiErr)
        ].filter(Boolean).join(' | ');

        const isLeaked = /leak|compromised|403|revoked/i.test(errStr);
        const isPermissionInvalid = /permission|invalid|credential|unauthorized/i.test(errStr);

        if (isLeaked || isPermissionInvalid) {
          // Log a clean info log without throwing/printing raw ApiError to stderr
          console.warn(`Gemini connectivity status: restricted due to credential health. Signature: ${errStr.substring(0, 80)}`);
        } else {
          // General handled exception
          console.warn(`Gemini query status: restricted. Signature: ${errStr.substring(0, 80)}`);
        }

        if (isLeaked) {
          return res.json({
            insights: `### 🚨 SECURITY ACCESS RESTRICTED

Under professional Echelon security mandates, the cloud-scale Cognitive compiler is restricted to prevent security exposure because your configured **GEMINI_API_KEY** has been reported as **compromised or leaked** by Google Security Services.

#### Actionable Remediation:
1. Go to your **Google AI Studio** dashboard.
2. In the top-right settings or your developer control panel, access **Secrets / Env** configuration.
3. Locate **GEMINI_API_KEY**, delete the current value, and click **Create API key** to provision an entirely new, secure key.
4. Paste the brand new secure API key back into your environment settings.
5. In the meantime, your offline Cognitive Heuristics Diagnostic Sandbox remains fully operational.`
          });
        } else if (isPermissionInvalid) {
          return res.json({
            insights: `### 🚨 INVALID CREDENTIAL SIGNATURE

The **GEMINI_API_KEY** configured in the Echelon sandbox has bad signatures, incorrect permissions, or is expired/invalid.

#### Actionable Remediation:
1. Verify the integrity of your **GEMINI_API_KEY** inside Settings > Secrets.
2. Confirm the key has active permissions for the **Gemini-3.5-Flash** model.
3. Paste the correct API key, apply changes, and compile again.`
          });
        }
        
        return res.json({
          insights: `### ⚠️ COGNITIVE COMPILE LIMITATION

Echelon was unable to establish a secure link to the cloud-scale artificial intelligence core.

**Error Signature:**
\`${geminiErr?.message || geminiErr?.toString() || 'Timeout or network disruption'}\`

#### Actionable Remediation:
1. Verify your network connection and ensure Google AI API servers are reachable.
2. Confirm your **GEMINI_API_KEY** in settings is active and untampered.
3. Your local cognitive diagnostics and offline balance sheet metrics remain fully operational below.`
        });
      }
    } catch (e: any) {
      console.warn('Gemini Service handled recovery fallback:', e?.message || e);
      return res.json({
        insights: `### ⚠️ SYSTEM RECOVERY ACTIVE

The secure gateway caught an unexpected exception during portfolio evaluation:
\`${e?.message || 'Cognitive sync timed out.'}\`

Your local sandboxed portfolio metrics and heuristic calculators continue to run securely offline.`
      });
    }
  });

  // API Route: Secure server-side predictive transaction classification
  app.post("/api/predict-transaction", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({
          error: "No Gemini API key available",
          fallback: true
        });
      }

      const { rawText, history = [], assets = [], categories = [] } = req.body;
      if (!rawText || typeof rawText !== "string") {
        return res.json({ error: "No raw text provided" });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const bankAssetsStr = assets
        .filter((a: any) => a.type === 'BANK_BALANCE' || a.type === 'CASH_CARRY')
        .map((a: any) => `ID: "${a.id}", Name: "${a.name}", Institution: "${a.institution}", Balance: ${a.currentValue}`)
        .join("\n");

      const systemPrompt = `You are the Echelon Sovereign financial intelligence engine.
Your task is to parse a raw financial transaction alert message (like SMS or bank notification) and predict its properties using a strict schema.

List of custom categories that the user uses (IMPORTANT: Prefer matching one of these categories if applicable):
${JSON.stringify(categories)}

List of bank accounts and credit cards available in the vault to debit from:
${bankAssetsStr || "No accounts configured."}

Previous ledger knowledge (historical transaction entries that show previous note-to-category associations):
${JSON.stringify(history.slice(-20))}

Guidelines:
1. Extract the transaction amount.
2. Predict the correct category. Prioritize matching the categories provided in the custom category list. If nothing matches, fall back to "Shopping" or the most accurate fallback category.
3. Determine which bank account or liquid asset was likely debited based on the institution keywords (e.g. "HDFC", "SBI", "ICICI", "Axis"). Return the matched ID and matched name. If no clear bank is detected, return empty string for ID and 'Liquid Assets' for name.
4. Predict a clean, elegant merchant note or description (e.g., "Uber Cab", "Zomato Dining", "HDFC Credit Bill"). Make it descriptive and human-readable. Do not include raw alert text or dates in the merchant note.
5. Provide a short "matchReason" stating how previous knowledge or keyword triggers were used.
6. If the raw message does not appear to contain a transaction or if it's completely unparseable, estimate reasonable default values.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Raw message to parse and predict: "${rawText}"`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              parsedAmt: {
                type: Type.NUMBER,
                description: "The extracted numerical amount of the transaction.",
              },
              parsedCategory: {
                type: Type.STRING,
                description: "The predicted category for the transaction (must correspond closely to the custom categories if possible).",
              },
              merchant: {
                type: Type.STRING,
                description: "Cleaned merchant or spend notes (e.g., 'Swiggy Food Delivery' instead of 'Swg12').",
              },
              parsedAssetId: {
                type: Type.STRING,
                description: "The matched ID of the source asset/bank account from the provided list, or empty string.",
              },
              parsedAssetName: {
                type: Type.STRING,
                description: "The matched name of the source bank account, or 'Liquid Assets Portfolio' if none.",
              },
              matchReason: {
                type: Type.STRING,
                description: "A short, professional explanation of the intelligence logic or prior ledger knowledge used.",
              },
            },
            required: ["parsedAmt", "parsedCategory", "merchant", "parsedAssetId", "parsedAssetName", "matchReason"],
          }
        }
      });

      if (response && response.text) {
        const predictions = JSON.parse(response.text.trim());
        return res.json(predictions);
      } else {
        throw new Error("No response text from Gemini");
      }
    } catch (err: any) {
      console.warn("Prediction gateway failed:", err?.message || err);
      return res.json({
        error: err?.message || "Failed to query Gemini prediction engine",
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
    console.log(`Echelon Vault Server booted on port ${PORT}`);
  });
}

startServer();
