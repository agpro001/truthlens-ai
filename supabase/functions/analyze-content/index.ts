import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are TruthLens AI, an expert misinformation and scam detection system. Your role is to analyze content and provide a comprehensive assessment of its authenticity.

ANALYSIS GUIDELINES:
1. Be objective and evidence-based
2. Never make definitive accusations - use probabilistic language
3. Consider context and intent
4. Look for common manipulation patterns:
   - Emotional manipulation tactics
   - Urgency/scarcity tactics
   - Too-good-to-be-true claims
   - Impersonation of authorities
   - Grammatical/spelling errors common in scams
   - Suspicious URLs or domains
   - AI-generated content markers

5. For images, consider:
   - AI generation artifacts
   - Manipulation signs
   - Inconsistent lighting/shadows
   - Unnatural proportions

RESPONSE FORMAT (JSON):
{
  "verdict": "verified" | "suspicious" | "fake" | "unknown",
  "confidence": 0-100,
  "explanation": "Clear, concise explanation of your analysis (2-3 sentences)",
  "indicators": [
    {"label": "AI-Generated Probability", "value": 0-100},
    {"label": "Scam Likelihood", "value": 0-100},
    {"label": "Manipulation Risk", "value": 0-100},
    {"label": "Emotional Manipulation", "value": 0-100}
  ],
  "evidence": [
    {"type": "warning|danger|info|success", "text": "Specific evidence found"}
  ],
  "suggestedAction": "Recommended next step for the user"
}

Be helpful but cautious. Encourage critical thinking and independent verification.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, content, imageBase64 } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let userMessage: any;
    
    if (type === "image" && imageBase64) {
      // For image analysis, use multimodal
      userMessage = {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze this image for authenticity. Check for AI-generation, manipulation, deepfakes, and any suspicious elements. Provide your analysis in the required JSON format.",
          },
          {
            type: "image_url",
            image_url: {
              url: imageBase64,
            },
          },
        ],
      };
    } else if (type === "link") {
      userMessage = {
        role: "user",
        content: `Analyze this URL for potential scams, phishing, or misinformation: "${content}"

Consider:
- Domain legitimacy
- Common phishing patterns
- Known scam indicators
- Content credibility signals

Provide your analysis in the required JSON format.`,
      };
    } else {
      userMessage = {
        role: "user",
        content: `Analyze the following content for misinformation, scams, or AI-generated content:

"${content}"

Provide your analysis in the required JSON format.`,
      };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          userMessage,
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    // Parse the JSON from the response
    let analysisResult;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiResponse);
      // Return a fallback response
      analysisResult = {
        verdict: "unknown",
        confidence: 50,
        explanation: "Unable to complete analysis. Please try again with different content.",
        indicators: [
          { label: "AI-Generated Probability", value: 50 },
          { label: "Scam Likelihood", value: 50 },
          { label: "Manipulation Risk", value: 50 },
          { label: "Emotional Manipulation", value: 50 },
        ],
        evidence: [
          { type: "info", text: "Analysis was inconclusive" },
        ],
        suggestedAction: "Try rephrasing your content or providing more context for better analysis.",
      };
    }

    return new Response(JSON.stringify(analysisResult), {
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
