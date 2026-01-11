import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a fact-checking verification system. Your job is to analyze claims and determine if they can be verified against official sources.

For each claim, you must:
1. Identify the entity/authority being referenced (government, company, organization)
2. Determine the official domain/source for that entity
3. Analyze if the claim appears legitimate based on:
   - Common patterns of official announcements
   - Typical scam/fake news patterns
   - Domain legitimacy indicators
   - Content consistency with known facts

RESPONSE FORMAT (JSON):
{
  "status": "verified" | "unverified" | "misleading" | "likely_fake",
  "confidence": 0-100,
  "entity": {
    "name": "Name of the authority/organization",
    "type": "government" | "company" | "organization" | "unknown",
    "officialDomain": "official-website.com or null if unknown"
  },
  "verification": {
    "foundOnOfficial": true | false | null,
    "matchLevel": "exact" | "partial" | "outdated" | "not_found",
    "discrepancies": ["List of differences if any"],
    "lastKnownUpdate": "Date if known or null"
  },
  "explanation": "Brief explanation of verification results",
  "suggestedAction": "What the user should do",
  "sources": ["Array of relevant official URLs to check"]
}

Be thorough but cautious. If you cannot verify, say so. Never claim absolute certainty.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, type } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userMessage = `Verify the following ${type} content against official sources:

"${content}"

Analyze this for:
1. What authority/organization is being referenced?
2. Can this be verified on official channels?
3. Are there any red flags suggesting this is fake?
4. What would the official source likely say?

Provide your verification in the required JSON format.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error("Verification failed");
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    // Parse the JSON from the response
    let verificationResult;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        verificationResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseError) {
      console.error("Failed to parse response:", aiResponse);
      verificationResult = {
        status: "unverified",
        confidence: 0,
        entity: { name: "Unknown", type: "unknown", officialDomain: null },
        verification: { foundOnOfficial: null, matchLevel: "not_found", discrepancies: [], lastKnownUpdate: null },
        explanation: "Unable to verify this content. Please check official sources manually.",
        suggestedAction: "Search for official announcements from the relevant authority.",
        sources: [],
      };
    }

    return new Response(JSON.stringify(verificationResult), {
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
