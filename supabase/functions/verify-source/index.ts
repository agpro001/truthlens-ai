import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callGemini } from "../_shared/gemini.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a fact-checking verification system. Identify the authority/entity, determine the official domain, and assess whether the claim looks legitimate.

Respond with VALID JSON:
{
  "status": "verified" | "unverified" | "misleading" | "likely_fake",
  "confidence": 0-100,
  "entity": {"name": "...", "type": "government|company|organization|unknown", "officialDomain": "..."},
  "verification": {"foundOnOfficial": true|false|null, "matchLevel": "exact|partial|outdated|not_found", "discrepancies": [], "lastKnownUpdate": null},
  "explanation": "...",
  "suggestedAction": "...",
  "sources": ["https://..."]
}
Be cautious. Never claim absolute certainty.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { content, type } = await req.json();
    const text = await callGemini({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT,
      parts: [{ text: `Verify the following ${type} content against official sources:\n\n"${content}"\n\nReturn JSON only.` }],
      temperature: 0.3,
      maxOutputTokens: 1500,
      jsonMode: true,
    });

    let result;
    try {
      const m = text.match(/\{[\s\S]*\}/);
      result = m ? JSON.parse(m[0]) : JSON.parse(text);
    } catch {
      result = {
        status: "unverified", confidence: 0,
        entity: { name: "Unknown", type: "unknown", officialDomain: null },
        verification: { foundOnOfficial: null, matchLevel: "not_found", discrepancies: [], lastKnownUpdate: null },
        explanation: "Unable to verify. Please check official sources manually.",
        suggestedAction: "Search for official announcements.",
        sources: [],
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Verification error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Verification failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
