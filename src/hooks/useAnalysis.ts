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

export interface AnalysisResult {
  verdict: "verified" | "suspicious" | "fake" | "unknown";
  confidence: number;
  explanation: string;
  indicators: AnalysisIndicator[];
  evidence: AnalysisEvidence[];
  suggestedAction: string;
}

export const useAnalysis = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

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

      const { data, error } = await supabase.functions.invoke("analyze-content", {
        body: payload,
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        if (data.error.includes("Rate limit")) {
          toast.error("Rate limit exceeded. Please try again later.");
        } else if (data.error.includes("Payment required")) {
          toast.error("Usage limit reached. Please add credits.");
        } else {
          toast.error(data.error);
        }
        return;
      }

      setResult(data as AnalysisResult);
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to analyze content. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
  };

  return { analyze, isLoading, result, reset };
};
