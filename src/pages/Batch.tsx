import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, Download, Play, Loader2 } from "lucide-react";
import LanguageSelector from "@/components/analysis/LanguageSelector";
import { toast } from "sonner";

interface Row {
  input: string;
  status: "queued" | "running" | "done" | "error";
  verdict?: string;
  confidence?: number;
}

const verdictIcon = (v?: string) => {
  if (v === "verified") return <CheckCircle2 className="w-4 h-4 text-success" />;
  if (v === "suspicious") return <AlertTriangle className="w-4 h-4 text-warning" />;
  if (v === "fake") return <XCircle className="w-4 h-4 text-destructive" />;
  return <HelpCircle className="w-4 h-4 text-muted-foreground" />;
};

const Batch = () => {
  const [raw, setRaw] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [language, setLanguage] = useState("en");

  const start = async () => {
    const items = raw.split("\n").map((s) => s.trim()).filter(Boolean);
    if (!items.length) return toast.error("Add at least one item (one per line).");
    if (items.length > 25) return toast.error("Max 25 items per batch.");

    const initial: Row[] = items.map((i) => ({ input: i, status: "queued" }));
    setRows(initial);
    setRunning(true);
    setProgress(0);

    for (let i = 0; i < items.length; i++) {
      setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, status: "running" } : r));
      const isUrl = /^https?:\/\//i.test(items[i]);
      try {
        const { data, error } = await supabase.functions.invoke("analyze-content", {
          body: { type: isUrl ? "link" : "text", content: items[i], language },
        });
        if (error || data?.error) throw new Error(error?.message ?? data?.error);
        setRows((prev) => prev.map((r, idx) => idx === i
          ? { ...r, status: "done", verdict: data.verdict, confidence: data.confidence }
          : r));
      } catch (e) {
        setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, status: "error" } : r));
        console.error(e);
      }
      setProgress(Math.round(((i + 1) / items.length) * 100));
    }
    setRunning(false);
    toast.success("Batch complete");
  };

  const exportCsv = () => {
    const csv = ["input,verdict,confidence", ...rows.map((r) =>
      `"${r.input.replace(/"/g, '""')}",${r.verdict ?? ""},${r.confidence ?? ""}`
    )].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `truthlens-batch-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = {
    fake: rows.filter((r) => r.verdict === "fake").length,
    suspicious: rows.filter((r) => r.verdict === "suspicious").length,
    verified: rows.filter((r) => r.verdict === "verified").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-2">Batch Analysis</h1>
          <p className="text-muted-foreground mb-6">
            Paste up to 25 texts or URLs (one per line). Each is analyzed by Gemini and results are exportable.
          </p>

          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <Textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="One claim or URL per line…"
              rows={8}
              disabled={running}
              className="mb-4"
            />
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <LanguageSelector value={language} onChange={setLanguage} />
              <div className="flex gap-2">
                {rows.length > 0 && (
                  <Button variant="outline" onClick={exportCsv} disabled={running}>
                    <Download className="w-4 h-4 mr-2" />Export CSV
                  </Button>
                )}
                <Button onClick={start} disabled={running}>
                  {running ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {running ? "Running…" : "Analyze All"}
                </Button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {running && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-6">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">{progress}%</p>
              </motion.div>
            )}
          </AnimatePresence>

          {rows.length > 0 && (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <motion.div whileHover={{ scale: 1.02 }} className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-destructive">{stats.fake}</div>
                  <div className="text-xs text-muted-foreground">Fake</div>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-warning">{stats.suspicious}</div>
                  <div className="text-xs text-muted-foreground">Suspicious</div>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className="bg-success/10 border border-success/30 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-success">{stats.verified}</div>
                  <div className="text-xs text-muted-foreground">Verified</div>
                </motion.div>
              </div>
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {rows.map((r, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0"
                  >
                    {r.status === "running" ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : verdictIcon(r.verdict)}
                    <span className="flex-1 text-sm truncate">{r.input}</span>
                    {r.confidence !== undefined && (
                      <span className="text-xs text-muted-foreground">{r.confidence}%</span>
                    )}
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Batch;
