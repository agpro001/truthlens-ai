import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";

interface TextAnalysisProps {
  onAnalyze: (content: string) => void;
}

const TextAnalysis = ({ onAnalyze }: TextAnalysisProps) => {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (text.trim()) {
      onAnalyze(text.trim());
    }
  };

  const exampleTexts = [
    "Government announces free money for all citizens starting next month!",
    "Congratulations! You've been selected to receive a $1,000 gift card.",
    "Breaking: New AI technology can predict the future with 99% accuracy.",
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Paste text to analyze
        </label>
        <Textarea
          placeholder="Enter text, news article, message, or claim you want to verify..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[150px] resize-none bg-muted/50 border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground/70 text-base"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            {text.length} characters
          </span>
          <span className="text-xs text-muted-foreground">
            Tip: Include the full context for better analysis
          </span>
        </div>
      </div>

      {/* Quick Examples */}
      <div>
        <span className="text-xs text-muted-foreground block mb-2">
          Try an example:
        </span>
        <div className="flex flex-wrap gap-2">
          {exampleTexts.map((example, index) => (
            <button
              key={index}
              onClick={() => setText(example)}
              className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px]"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!text.trim()}
        className="w-full py-6 text-base font-semibold group"
      >
        <Sparkles className="w-5 h-5 mr-2 group-hover:animate-pulse" />
        Analyze Text
      </Button>
    </div>
  );
};

export default TextAnalysis;
