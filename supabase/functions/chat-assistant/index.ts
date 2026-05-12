import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { streamGeminiAsOpenAI } from "../_shared/gemini.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are TruthLens AI Assistant, calm, neutral, evidence-based.
Help users understand analysis results, explain why something might be fake/scam/AI-generated, encourage critical thinking. Use probabilistic language. Never accusatory.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, analysisContext } = await req.json();

    const sysContent = analysisContext
      ? `${SYSTEM_PROMPT}\n\nCURRENT ANALYSIS CONTEXT:\n${JSON.stringify(analysisContext, null, 2)}`
      : SYSTEM_PROMPT;

    const contents = (messages as { role: string; content: string }[]).map((m) => ({
      role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
      parts: [{ text: m.content }],
    }));

    const resp = await streamGeminiAsOpenAI({
      model: "gemini-2.5-flash",
      systemInstruction: sysContent,
      contents,
      temperature: 0.7,
      maxOutputTokens: 1000,
    });

    const headers = new Headers(resp.headers);
    Object.entries(corsHeaders).forEach(([k, v]) => headers.set(k, v));
    return new Response(resp.body, { status: resp.status, headers });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Chat failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
