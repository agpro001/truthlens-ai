import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callGemini } from "../_shared/gemini.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are TruthLens AI, the world's most advanced misinformation and scam detection system.

Always respond with VALID JSON in this exact shape:
{
  "verdict": "verified" | "suspicious" | "fake" | "unknown",
  "confidence": 0-100,
  "explanation": "3-4 sentences",
  "indicators": [
    {"label": "AI-Generated Probability", "value": 0-100},
    {"label": "Scam Likelihood", "value": 0-100},
    {"label": "Manipulation Risk", "value": 0-100},
    {"label": "Emotional Manipulation", "value": 0-100},
    {"label": "Source Credibility", "value": 0-100}
  ],
  "evidence": [{"type": "warning|danger|info|success", "text": "..."}],
  "suggestedAction": "..."
}

Be probabilistic, neutral, non-accusatory. Encourage independent verification.`;

const LANG_MAP: Record<string, string> = {
  en: "English", hi: "Hindi", es: "Spanish", fr: "French", ar: "Arabic", bn: "Bengali",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, content, imageBase64, language } = await req.json();
    const langName = LANG_MAP[language] ?? "English";
    const langInstr = `\n\nIMPORTANT: Respond with all "explanation", "evidence.text" and "suggestedAction" fields written in ${langName}.`;

    const parts: { text?: string; inline_data?: { mime_type: string; data: string } }[] = [];
    if (type === "image" && imageBase64) {
      const m = imageBase64.match(/^data:(.+?);base64,(.+)$/);
      const mime = m?.[1] ?? "image/jpeg";
      const data = m?.[2] ?? imageBase64;
      parts.push({ text: "Perform a detailed authenticity analysis on this image (AI generation, manipulation, deepfake)." });
      parts.push({ inline_data: { mime_type: mime, data } });
    } else if (type === "link") {
      parts.push({ text: `Analyze this URL for phishing, scam, and credibility: "${content}"` });
    } else {
      parts.push({ text: `Fact-check and analyze this content for misinformation, manipulation, AI markers:\n\n"""\n${content}\n"""` });
    }

    let text: string;
    try {
      text = await callGemini({
        model: "gemini-2.5-pro",
        systemInstruction: SYSTEM_PROMPT + langInstr,
        parts,
        temperature: 0.2,
        maxOutputTokens: 2500,
        jsonMode: true,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown";
      if (msg === "RATE_LIMIT") {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (msg === "QUOTA_OR_KEY") {
        return new Response(JSON.stringify({ error: "Gemini API key invalid or quota exceeded." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw e;
    }

    let result;
    try {
      const m = text.match(/\{[\s\S]*\}/);
      result = m ? JSON.parse(m[0]) : JSON.parse(text);
    } catch {
      result = {
        verdict: "unknown", confidence: 50,
        explanation: "Unable to parse the AI response. Please try again.",
        indicators: [
          { label: "AI-Generated Probability", value: 50 },
          { label: "Scam Likelihood", value: 50 },
          { label: "Manipulation Risk", value: 50 },
          { label: "Emotional Manipulation", value: 50 },
          { label: "Source Credibility", value: 50 },
        ],
        evidence: [{ type: "info", text: "Analysis inconclusive." }],
        suggestedAction: "Try again with different content.",
      };
    }
    if (!Array.isArray(result.indicators)) {
      result.indicators = [
        { label: "AI-Generated Probability", value: 50 },
        { label: "Scam Likelihood", value: 50 },
        { label: "Manipulation Risk", value: 50 },
        { label: "Emotional Manipulation", value: 50 },
        { label: "Source Credibility", value: 50 },
      ];
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
