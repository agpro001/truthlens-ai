import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, ExternalLink, Loader2 } from "lucide-react";
import logoImg from "@/assets/logo.jpg";
import { Button } from "@/components/ui/button";

const cfg = {
  verified: { Icon: CheckCircle2, color: "text-success", bg: "bg-success/10", border: "border-success/30", label: "Verified" },
  suspicious: { Icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", border: "border-warning/30", label: "Suspicious" },
  fake: { Icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", label: "Likely Fake" },
  unknown: { Icon: HelpCircle, color: "text-muted-foreground", bg: "bg-muted", border: "border-border", label: "Inconclusive" },
} as const;

const ShareView = () => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!slug) return;
      const { data } = await supabase
        .from("analysis_history")
        .select("verdict, confidence, explanation, content, analysis_type, indicators, suggested_action, created_at")
        .eq("share_slug", slug)
        .maybeSingle();
      setData(data);
      setLoading(false);

      if (data) {
        document.title = `TruthLens Verdict: ${data.verdict} — ${data.confidence}%`;
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">This shared analysis was not found or is private.</p>
        <Button asChild><Link to="/">Go home</Link></Button>
      </div>
    );
  }

  const c = cfg[(data.verdict as keyof typeof cfg) ?? "unknown"];
  const Icon = c.Icon;

  return (
    <div className="min-h-screen bg-background">
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoImg} alt="TruthLens" className="w-8 h-8 rounded-full object-cover" />
          <span className="font-bold">TruthLens<span className="text-primary">AI</span></span>
        </Link>
        <Button asChild size="sm"><Link to="/">Analyze yours</Link></Button>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 30, rotateX: -10 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.6, type: "spring" }}
          className={`rounded-2xl p-8 border-2 ${c.bg} ${c.border} shadow-2xl`}
          style={{ perspective: 1000 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
              className={`p-4 rounded-full ${c.bg}`}
            >
              <Icon className={`w-12 h-12 ${c.color}`} />
            </motion.div>
            <div>
              <h1 className={`text-3xl font-bold ${c.color}`}>{c.label}</h1>
              <p className="text-muted-foreground">{data.confidence}% confidence</p>
            </div>
          </div>

          <div className="bg-background/50 backdrop-blur rounded-xl p-4 mb-6">
            <p className="text-sm text-muted-foreground italic">"{data.content?.slice(0, 280)}{data.content?.length > 280 ? "…" : ""}"</p>
          </div>

          <h2 className="font-semibold mb-2">Explanation</h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">{data.explanation}</p>

          {data.suggested_action && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-1 text-sm">Suggested action</h3>
              <p className="text-sm text-muted-foreground">{data.suggested_action}</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center mt-8">
            Verified by TruthLens AI • {new Date(data.created_at).toLocaleDateString()}
          </p>
        </motion.div>

        <div className="text-center mt-8">
          <Button asChild variant="outline">
            <Link to="/"><ExternalLink className="w-4 h-4 mr-2" />Run your own analysis</Link>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ShareView;
