import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BedrockRequest {
  type: "text" | "image" | "link";
  content?: string;
  imageBase64?: string;
}

interface BedrockResponse {
  verdict: "verified" | "suspicious" | "fake" | "unknown";
  confidence: number;
  explanation: string;
  deepfakeProbability?: number;
  indicators: Array<{ label: string; value: number }>;
  evidence: Array<{ type: "info" | "warning" | "danger" | "success"; text: string }>;
  suggestedAction: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, content, imageBase64 }: BedrockRequest = await req.json();
    
    const AWS_BEDROCK_LAMBDA_URL = Deno.env.get("AWS_BEDROCK_LAMBDA_URL");
    if (!AWS_BEDROCK_LAMBDA_URL) {
      throw new Error("AWS_BEDROCK_LAMBDA_URL is not configured");
    }

    console.log(`Invoking AWS Bedrock Lambda for ${type} analysis...`);

    // Call the AWS Lambda function that invokes Bedrock
    const lambdaResponse = await fetch(AWS_BEDROCK_LAMBDA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type,
        content,
        imageBase64,
      }),
    });

    if (!lambdaResponse.ok) {
      const errorText = await lambdaResponse.text();
      console.error("Lambda error:", lambdaResponse.status, errorText);
      throw new Error(`Lambda invocation failed: ${lambdaResponse.status}`);
    }

    const lambdaData = await lambdaResponse.json();
    
    // Parse the Lambda response - it may be stringified or direct JSON
    let analysisResult: BedrockResponse;
    if (typeof lambdaData.body === "string") {
      analysisResult = JSON.parse(lambdaData.body);
    } else if (lambdaData.body) {
      analysisResult = lambdaData.body;
    } else {
      analysisResult = lambdaData;
    }

    // Ensure all required fields exist with proper defaults
    const normalizedResult: BedrockResponse = {
      verdict: analysisResult.verdict || "unknown",
      confidence: analysisResult.confidence || 50,
      explanation: analysisResult.explanation || "Analysis completed via AWS Bedrock",
      deepfakeProbability: analysisResult.deepfakeProbability,
      indicators: analysisResult.indicators || [
        { label: "AI-Generated Probability", value: 50 },
        { label: "Scam Likelihood", value: 50 },
        { label: "Manipulation Risk", value: 50 },
        { label: "Emotional Manipulation", value: 50 },
        { label: "Source Credibility", value: 50 },
      ],
      evidence: analysisResult.evidence || [
        { type: "info", text: "Analysis completed using AWS Bedrock Claude 3" },
      ],
      suggestedAction: analysisResult.suggestedAction || "Review the analysis results and exercise caution.",
    };

    console.log("Bedrock analysis complete:", normalizedResult.verdict);

    return new Response(JSON.stringify(normalizedResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Bedrock analyzer error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Bedrock analysis failed",
        verdict: "unknown",
        confidence: 0,
        explanation: "Failed to analyze content using AWS Bedrock. Please try again or use standard analysis.",
        indicators: [],
        evidence: [
          { type: "danger", text: "AWS Bedrock analysis unavailable" }
        ],
        suggestedAction: "Try using the standard analysis option instead.",
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
