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
      const systemPrompt = `You are the Echelon Sovereign Wealth Advisor AI, a elite non-custodial financial strategy engine compiling recommendations for a high-net-worth individual's private portfolio. 
Provide highly polished, expert, bulleted strategic recommendations covering asset allocation optimization, debt prepay arbitrage, velocity optimization, and risk exposure containment.

Aesthetic Guidelines:
- Respond in high-contrast professional, Swiss-neutral text with clear structured sections.
- Do NOT use flowery adjectives, marketing slang, or excessive emojis. Keep it elite, quiet, and objective.
- Use explicit bullet points and short dense paragraphs.

Portfolio Context:
- Net Worth Health Score: ${score}/100
- Earned Quiet Rank: ${rank}
- Blended Portfolio APY: ${blendedAPY}%
- Emergency Cash Shield Cover: ${emergencyShieldMonths} months
- Vault Assets list: ${JSON.stringify(assets)}
- Active Loan contracts: ${JSON.stringify(loans)}
- Monthly Net Earnings Surplus (after expenses): ${monthlyEarnings} INR

Generate a 4-step actionable dossier:
1. ARBITRAGE PLAN (Debt vs APY APY matching)
2. SHIELD TUNING (Emergency cover expansion)
3. VELOCITY HACKS (Increasing monthly accumulation surplus)
4. RETIREMENT CORRIDOR (Quiet compounding trajectory under current APY)`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: systemPrompt,
      });

      const insightsText = response.text || 'Failed to synthesize portfolio insights. Please try again.';
      res.json({ insights: insightsText });
    } catch (e: any) {
      console.error('Gemini Service Failure:', e);
      res.status(500).json({ error: e?.message || 'Cognitive sync timed out. Check connection.' });
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
