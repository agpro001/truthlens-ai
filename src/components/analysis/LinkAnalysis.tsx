import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, ExternalLink, AlertCircle } from "lucide-react";

interface LinkAnalysisProps {
  onAnalyze: (url: string) => void;
}

const LinkAnalysis = ({ onAnalyze }: LinkAnalysisProps) => {
  const [url, setUrl] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(true);

  const validateUrl = (value: string) => {
    if (!value) return true;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);
    setIsValidUrl(validateUrl(value));
  };

  const handleSubmit = () => {
    if (url.trim() && isValidUrl) {
      onAnalyze(url.trim());
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Enter URL to analyze
        </label>
        <div className="relative">
          <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="url"
            placeholder="https://example.com/article"
            value={url}
            onChange={handleChange}
            className={`pl-10 py-6 bg-background border-border focus:border-primary transition-colors ${
              !isValidUrl ? "border-destructive focus:border-destructive" : ""
            }`}
          />
          {url && (
            <ExternalLink className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          )}
        </div>
        {!isValidUrl && (
          <div className="flex items-center gap-1 mt-2 text-destructive text-xs">
            <AlertCircle className="w-3 h-3" />
            Please enter a valid URL
          </div>
        )}
      </div>

      {/* What We Check */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-foreground mb-3">
          What we'll analyze:
        </h4>
        <ul className="space-y-2">
          {[
            "Domain authenticity & age",
            "SSL certificate validity",
            "Content credibility signals",
            "Known scam pattern matching",
            "Source reputation check",
          ].map((item, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!url.trim() || !isValidUrl}
        className="w-full py-6 text-base font-semibold group"
      >
        <Link className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
        Analyze Link
      </Button>
    </div>
  );
};

export default LinkAnalysis;
