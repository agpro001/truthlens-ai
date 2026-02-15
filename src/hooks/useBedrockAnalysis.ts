import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AnalysisIndicator {
  label: string;
  value: number;
}

export interface AnalysisEvidence {
  type: "info" | "warning" | "danger" | "success";
  text: string;
}

export interface BedrockAnalysisResult {
  verdict: "verified" | "suspicious" | "fake" | "unknown";
  confidence: number;
  explanation: string;
  deepfakeProbability?: number;
  indicators: AnalysisIndicator[];
  evidence: AnalysisEvidence[];
  suggestedAction: string;
}

export const useBedrockAnalysis = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BedrockAnalysisResult | null>(null);

  const analyze = async (type: string, content: string | File) => {
    setIsLoading(true);
    setResult(null);

    try {
      let payload: { type: string; content?: string; imageBase64?: string };
      
      if (type === "image" && content instanceof File) {
        // Convert file to base64
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(content);
        });
        payload = { type, imageBase64: base64 };
      } else {
        payload = { type, content: content as string };
      }

      // Call the bedrock-analyzer Supabase function
      const { data, error } = await supabase.functions.invoke("bedrock-analyzer", {
        body: payload,
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setResult(data as BedrockAnalysisResult);
      toast.success("AWS Bedrock analysis completed!");
    } catch (error) {
      console.error("Bedrock analysis error:", error);
      toast.error("Failed to analyze with AWS Bedrock. Please try again or use standard analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
  };

  return { analyze, isLoading, result, reset };
};
