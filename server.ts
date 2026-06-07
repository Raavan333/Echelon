/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
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
