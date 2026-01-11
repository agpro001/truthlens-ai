import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle,
  ExternalLink,
  Building2,
  Globe,
  RefreshCw,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface VerificationResult {
  status: "verified" | "unverified" | "misleading" | "likely_fake";
  confidence: number;
  entity: {
    name: string;
    type: "government" | "company" | "organization" | "unknown";
    officialDomain: string | null;
  };
  verification: {
    foundOnOfficial: boolean | null;
    matchLevel: "exact" | "partial" | "outdated" | "not_found";
    discrepancies: string[];
    lastKnownUpdate: string | null;
  };
  explanation: string;
  suggestedAction: string;
  sources: string[];
}

interface OfficialSourceVerificationProps {
  content: string;
  type: string;
  isVisible: boolean;
}

const statusConfig = {
  verified: {
    icon: CheckCircle2,
    label: "Verified by Official Source",
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/30",
  },
  unverified: {
    icon: HelpCircle,
    label: "Cannot Verify",
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
    borderColor: "border-border",
  },
  misleading: {
    icon: AlertTriangle,
    label: "Misleading / Outdated",
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/30",
  },
  likely_fake: {
    icon: XCircle,
    label: "Likely Fake News",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/30",
  },
};

const OfficialSourceVerification = ({ content, type, isVisible }: OfficialSourceVerificationProps) => {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = async () => {
    if (!content.trim()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke("verify-source", {
        body: { content, type },
      });

      if (error) throw error;
      if (data.error) {
        setError(data.error);
        return;
      }

      setResult(data as VerificationResult);
    } catch (err) {
      console.error("Verification error:", err);
      setError("Failed to verify source. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible && content && !result && !isLoading) {
      verify();
    }
  }, [isVisible, content]);

  if (!isVisible) return null;

  const config = result ? statusConfig[result.status] : null;
  const StatusIcon = config?.icon || HelpCircle;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.4 }}
      className="mt-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Official Source Verification</h3>
      </div>

      <div className={`rounded-xl border p-5 ${config?.bgColor || "bg-muted/30"} ${config?.borderColor || "border-border"}`}>
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center py-8"
            >
              <RefreshCw className="w-8 h-8 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground text-sm">Verifying against official sources...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6"
            >
              <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-3" />
              <p className="text-muted-foreground text-sm mb-4">{error}</p>
              <Button variant="outline" size="sm" onClick={verify}>
                Try Again
              </Button>
            </motion.div>
          ) : result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <StatusIcon className={`w-8 h-8 ${config?.color}`} />
                  </motion.div>
                  <div>
                    <Badge variant="outline" className={`${config?.color} border-current`}>
                      {config?.label}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      Confidence: {result.confidence}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Entity Info */}
              {result.entity.name !== "Unknown" && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{result.entity.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{result.entity.type}</p>
                  </div>
                  {result.entity.officialDomain && (
                    <a
                      href={`https://${result.entity.officialDomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-primary hover:underline text-sm flex items-center gap-1"
                    >
                      {result.entity.officialDomain}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Explanation */}
              <div>
                <p className="text-sm text-foreground">{result.explanation}</p>
              </div>

              {/* Discrepancies */}
              {result.verification.discrepancies.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Discrepancies Found
                  </p>
                  <ul className="space-y-1">
                    {result.verification.discrepancies.map((d, i) => (
                      <li key={i} className="text-sm text-warning flex items-start gap-2">
                        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggested Action */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-sm text-foreground">{result.suggestedAction}</p>
              </div>

              {/* Official Sources */}
              {result.sources.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Check Official Sources
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.sources.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-background text-primary hover:bg-primary/10 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Visit Official Source
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6"
            >
              <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                Submit content above to verify against official sources
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default OfficialSourceVerification;
