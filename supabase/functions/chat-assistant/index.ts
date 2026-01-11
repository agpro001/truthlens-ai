import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are TruthLens AI Assistant, a calm, neutral, evidence-based conversational AI that helps users understand truth and authenticity online.

YOUR ROLE:
- Help users understand analysis results
- Explain why something might be fake, a scam, or AI-generated
- Provide clear, simple explanations
- Encourage critical thinking and independent verification
- Never make accusations - use probabilistic language

COMMUNICATION STYLE:
- Calm and professional
- Evidence-based
- Clear and concise
- Non-judgmental
- Helpful and educational

When discussing analysis results, always:
1. Explain the key indicators found
2. Provide context for the verdict
3. Suggest verification steps the user can take
4. Remind users that AI analysis is probabilistic, not definitive

You can help with:
- Explaining why content was flagged
- How to verify information independently
- Understanding manipulation tactics
- Learning about scam patterns
- Tips for staying safe online`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, analysisContext } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the conversation with context
    const systemContent = analysisContext
      ? `${SYSTEM_PROMPT}\n\nCURRENT ANALYSIS CONTEXT:\n${JSON.stringify(analysisContext, null, 2)}\n\nUse this context to answer questions about the analysis.`
      : SYSTEM_PROMPT;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemContent },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error("Chat failed");
    }

    // Return streaming response
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Chat failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
