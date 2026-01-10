import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  Share2
} from "lucide-react";
import { toast } from "sonner";
import type { AnalysisResult } from "@/hooks/useAnalysis";

interface AnalysisResultsProps {
  result: AnalysisResult;
  onReset: () => void;
}

const verdictConfig = {
  verified: {
    icon: CheckCircle2,
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/30",
    label: "Verified",
    description: "This content appears to be authentic",
  },
  suspicious: {
    icon: AlertTriangle,
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/30",
    label: "Suspicious",
    description: "This content has concerning indicators",
  },
  fake: {
    icon: XCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/30",
    label: "Likely Fake",
    description: "High probability of misinformation or scam",
  },
  unknown: {
    icon: HelpCircle,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    borderColor: "border-border",
    label: "Inconclusive",
    description: "Unable to determine authenticity",
  },
};

const AnalysisResults = ({ result, onReset }: AnalysisResultsProps) => {
  const config = verdictConfig[result.verdict];
  const Icon = config.icon;

  const copyToClipboard = () => {
    const summary = `TruthLens Analysis:\n\nVerdict: ${config.label}\nConfidence: ${result.confidence}%\n\n${result.explanation}`;
    navigator.clipboard.writeText(summary);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      {/* Verdict Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-xl p-6 border-2 ${config.bgColor} ${config.borderColor}`}
      >
        <div className="flex items-start gap-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
            className={`p-3 rounded-full ${config.bgColor}`}
          >
            <Icon className={`w-8 h-8 ${config.color}`} />
          </motion.div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className={`text-2xl font-bold ${config.color}`}>
                {config.label}
              </h3>
              <Badge variant="outline" className={config.color}>
                {result.confidence}% confidence
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {config.description}
            </p>
          </div>
        </div>

        {/* Confidence Ring */}
        <div className="mt-6 flex items-center gap-4">
          <svg className="w-20 h-20 -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="35"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-muted"
            />
            <motion.circle
              cx="40"
              cy="40"
              r="35"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              className={config.color}
              initial={{ strokeDasharray: "0 220" }}
              animate={{ strokeDasharray: `${(result.confidence / 100) * 220} 220` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="flex-1">
            <span className="text-sm text-muted-foreground">Confidence Score</span>
            <div className="text-3xl font-bold text-foreground">{result.confidence}%</div>
          </div>
        </div>
      </motion.div>

      {/* Explanation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-muted/30 rounded-xl p-6"
      >
        <h4 className="font-semibold text-foreground mb-3">Analysis Explanation</h4>
        <p className="text-muted-foreground leading-relaxed">
          {result.explanation}
        </p>
      </motion.div>

      {/* Risk Indicators */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-3"
      >
        <h4 className="font-semibold text-foreground">Risk Indicators</h4>
        {result.indicators.map((indicator, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{indicator.label}</span>
              <span className="font-medium text-foreground">{indicator.value}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${indicator.value}%` }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  indicator.value > 70 
                    ? "bg-destructive" 
                    : indicator.value > 40 
                      ? "bg-warning" 
                      : "bg-success"
                }`}
              />
            </div>
          </div>
        ))}
      </motion.div>

      {/* Evidence */}
      {result.evidence.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <h4 className="font-semibold text-foreground">Evidence Found</h4>
          <ul className="space-y-2">
            {result.evidence.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${
                  item.type === "warning" ? "bg-warning" : item.type === "danger" ? "bg-destructive" : "bg-success"
                }`} />
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Suggested Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-primary/5 border border-primary/20 rounded-xl p-4"
      >
        <h4 className="font-semibold text-foreground mb-2">Suggested Action</h4>
        <p className="text-sm text-muted-foreground">{result.suggestedAction}</p>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex flex-wrap gap-3"
      >
        <Button onClick={onReset} variant="outline" className="flex-1">
          <RefreshCw className="w-4 h-4 mr-2" />
          Analyze Another
        </Button>
        <Button variant="ghost" size="icon" onClick={copyToClipboard}>
          <Copy className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <Share2 className="w-4 h-4" />
        </Button>
      </motion.div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center">
        Analysis is probabilistic. Always verify critical information from official sources.
      </p>
    </div>
  );
};

export default AnalysisResults;
