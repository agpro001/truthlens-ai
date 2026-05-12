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
  id?: string;
  shareSlug?: string;
  verdict: "verified" | "suspicious" | "fake" | "unknown";
  confidence: number;
  explanation: string;
  indicators: AnalysisIndicator[];
  evidence: AnalysisEvidence[];
  suggestedAction: string;
  language?: string;
}

const slugify = () =>
  Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

export const useAnalysis = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const analyze = async (
    type: string,
    content: string | File,
    language: string = "en"
  ) => {
    setIsLoading(true);
    setResult(null);

    try {
      let payload: { type: string; content?: string; imageBase64?: string; language: string };

      if (type === "image" && content instanceof File) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(content);
        });
        payload = { type, imageBase64: base64, language };
      } else {
        payload = { type, content: content as string, language };
      }

      const { data, error } = await supabase.functions.invoke("analyze-content", {
        body: payload,
      });

      if (error) throw error;
      if (data.error) {
        if (data.error.includes("Rate limit")) toast.error("Rate limit. Try again soon.");
        else if (data.error.includes("quota") || data.error.includes("invalid"))
          toast.error("Gemini API key invalid or quota exceeded.");
        else toast.error(data.error);
        return;
      }

      const finalResult: AnalysisResult = { ...data, language };

      // Persist to history if signed in
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const slug = slugify();
        const { data: row } = await supabase
          .from("analysis_history")
          .insert({
            user_id: user.id,
            analysis_type: type,
            content: typeof content === "string" ? content : (content as File).name,
            verdict: data.verdict,
            confidence: data.confidence,
            explanation: data.explanation,
            indicators: data.indicators ?? [],
            evidence: data.evidence ?? [],
            suggested_action: data.suggestedAction,
            language,
            share_slug: slug,
          })
          .select()
          .single();
        if (row) {
          finalResult.id = row.id;
          finalResult.shareSlug = row.share_slug as string;
        }
      }

      setResult(finalResult);
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to analyze content. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => setResult(null);

  return { analyze, isLoading, result, reset };
};
