import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are TruthLens AI, the world's most advanced misinformation and scam detection system. You combine deep analytical reasoning with real-time fact-checking capabilities.

## YOUR CAPABILITIES:
1. **Multi-source Verification**: Cross-reference claims against known databases of verified information
2. **Pattern Recognition**: Identify manipulation tactics, propaganda techniques, and scam patterns
3. **Source Analysis**: Evaluate the credibility of sources, domains, and content origins
4. **AI Detection**: Identify AI-generated text, images, and deepfakes
5. **Contextual Analysis**: Consider historical, political, and social context

## ANALYSIS FRAMEWORK:

### For TEXT/CLAIMS:
- Check for logical fallacies and reasoning errors
- Identify emotional manipulation (fear, urgency, outrage)
- Look for missing context or cherry-picked data
- Verify specific claims, statistics, and quotes
- Check for common misinformation patterns
- Analyze writing style for bot/AI markers

### For LINKS/URLS:
- Domain reputation analysis
- Phishing indicators (typosquatting, suspicious TLDs)
- SSL/security status implications
- Known scam database matching
- Redirect chain analysis
- Content preview safety

### For IMAGES:
- AI generation detection (DALL-E, Midjourney, Stable Diffusion markers)
- Manipulation detection (Photoshop, splicing, face swaps)
- Deepfake indicators
- Metadata analysis
- Reverse image search suggestions
- Context verification

## VERDICT CRITERIA:
- **verified**: Content is factually accurate with high confidence, from credible sources
- **suspicious**: Contains red flags, unverifiable claims, or manipulation indicators
- **fake**: Confirmed misinformation, scam, or maliciously altered content
- **unknown**: Insufficient information to make a determination

## RESPONSE FORMAT (JSON):
{
  "verdict": "verified" | "suspicious" | "fake" | "unknown",
  "confidence": 0-100,
  "explanation": "Comprehensive explanation in 3-4 sentences covering what you found and why",
  "indicators": [
    {"label": "AI-Generated Probability", "value": 0-100},
    {"label": "Scam Likelihood", "value": 0-100},
    {"label": "Manipulation Risk", "value": 0-100},
    {"label": "Emotional Manipulation", "value": 0-100},
    {"label": "Source Credibility", "value": 0-100}
  ],
  "evidence": [
    {"type": "warning|danger|info|success", "text": "Specific evidence with details"}
  ],
  "suggestedAction": "Clear, actionable recommendation for the user",
  "factCheck": {
    "claimsAnalyzed": ["List of specific claims extracted"],
    "verificationStatus": "Summary of what could/couldn't be verified",
    "relatedFactChecks": ["Suggestions for further verification"]
  }
}

## GUIDELINES:
- Be thorough but concise
- Always explain your reasoning
- Provide actionable next steps
- Never make absolute claims without strong evidence
- Encourage critical thinking and independent verification
- Consider that content may be satire, opinion, or taken out of context`;

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

    console.log(`Analyzing ${type} content...`);

    let userMessage: any;
    
    if (type === "image" && imageBase64) {
      userMessage = {
        role: "user",
        content: [
          {
            type: "text",
            text: `Perform a comprehensive authenticity analysis on this image. 

Check for:
1. AI generation artifacts (unusual textures, inconsistent details, warped text)
2. Manipulation signs (splicing, clone stamping, content-aware fill)
3. Deepfake indicators (unnatural facial movements, edge artifacts)
4. Metadata inconsistencies
5. Context verification needs

Provide your detailed analysis in the required JSON format.`,
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
        content: `Perform a comprehensive security and credibility analysis on this URL: "${content}"

Analyze:
1. Domain legitimacy and reputation
2. Phishing indicators (typosquatting, suspicious TLDs, unusual subdomains)
3. Known scam patterns matching
4. SSL/security implications
5. Redirect behavior patterns
6. Content credibility signals
7. Historical domain data indicators

Provide your detailed analysis in the required JSON format.`,
      };
    } else {
      userMessage = {
        role: "user",
        content: `Perform a comprehensive fact-check and authenticity analysis on the following content:

"""
${content}
"""

Analyze:
1. Factual accuracy of specific claims
2. Source credibility indicators
3. Manipulation tactics (emotional, urgency, fear-based)
4. AI-generated content markers
5. Logical fallacies or reasoning errors
6. Missing context or cherry-picked information
7. Propaganda techniques
8. Scam patterns

Provide your detailed analysis in the required JSON format.`,
      };
    }

    // Use the more powerful model for better analysis
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          userMessage,
        ],
        temperature: 0.2,
        max_tokens: 2500,
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

    console.log("AI Response received, parsing...");

    // Parse the JSON from the response
    let analysisResult;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiResponse);
      analysisResult = {
        verdict: "unknown",
        confidence: 50,
        explanation: "Unable to complete analysis. The AI response could not be parsed. Please try again with different content.",
        indicators: [
          { label: "AI-Generated Probability", value: 50 },
          { label: "Scam Likelihood", value: 50 },
          { label: "Manipulation Risk", value: 50 },
          { label: "Emotional Manipulation", value: 50 },
          { label: "Source Credibility", value: 50 },
        ],
        evidence: [
          { type: "info", text: "Analysis was inconclusive due to parsing error" },
        ],
        suggestedAction: "Try rephrasing your content or providing more context for better analysis.",
      };
    }

    // Ensure all required fields exist
    if (!analysisResult.indicators) {
      analysisResult.indicators = [
        { label: "AI-Generated Probability", value: 50 },
        { label: "Scam Likelihood", value: 50 },
        { label: "Manipulation Risk", value: 50 },
        { label: "Emotional Manipulation", value: 50 },
        { label: "Source Credibility", value: 50 },
      ];
    }

    console.log("Analysis complete:", analysisResult.verdict);

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
