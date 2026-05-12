import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUp, Loader2, MessageCircleWarning } from "lucide-react";
import { toast } from "sonner";

interface Report {
  id: string;
  title: string;
  snippet: string;
  verdict: string;
  language: string;
  upvote_count: number;
  created_at: string;
  user_id: string;
}

const filters = ["all", "fake", "suspicious", "verified"] as const;

const Community = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<typeof filters[number]>("all");
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      let q = supabase.from("community_reports").select("*").eq("is_published", true).order("created_at", { ascending: false }).limit(50);
      if (filter !== "all") q = q.eq("verdict", filter);
      const { data } = await q;
      setReports((data as Report[]) ?? []);
      if (user) {
        const { data: votes } = await supabase.from("community_upvotes").select("report_id").eq("user_id", user.id);
        setUpvoted(new Set((votes ?? []).map((v) => v.report_id)));
      }
      setLoading(false);
    })();
  }, [filter]);

  const toggleUpvote = async (reportId: string) => {
    if (!userId) return toast.error("Sign in to upvote.");
    const has = upvoted.has(reportId);
    if (has) {
      await supabase.from("community_upvotes").delete().eq("report_id", reportId).eq("user_id", userId);
      setUpvoted((s) => { const n = new Set(s); n.delete(reportId); return n; });
      setReports((r) => r.map((x) => x.id === reportId ? { ...x, upvote_count: Math.max(0, x.upvote_count - 1) } : x));
    } else {
      const { error } = await supabase.from("community_upvotes").insert({ report_id: reportId, user_id: userId });
      if (error) return toast.error(error.message);
      setUpvoted((s) => new Set(s).add(reportId));
      setReports((r) => r.map((x) => x.id === reportId ? { ...x, upvote_count: x.upvote_count + 1 } : x));
    }
  };

  const verdictColor = (v: string) =>
    v === "fake" ? "destructive" : v === "suspicious" ? "outline" : v === "verified" ? "default" : "secondary";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <MessageCircleWarning className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-bold">Community Reports</h1>
          </div>
          <p className="text-muted-foreground mb-6">
            Misinformation flagged by the community. Upvote what helped you.
          </p>

          <div className="flex flex-wrap gap-2 mb-6">
            {filters.map((f) => (
              <motion.div key={f} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant={filter === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(f)}
                  className="capitalize"
                >
                  {f}
                </Button>
              </motion.div>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              No reports yet. Be the first to publish one from your analysis result.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              <AnimatePresence>
                {reports.map((r, i) => (
                  <motion.article
                    key={r.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.25)" }}
                    className="bg-card border border-border rounded-xl p-5 flex flex-col"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="font-semibold text-foreground line-clamp-2 flex-1">{r.title}</h3>
                      <Badge variant={verdictColor(r.verdict)} className="capitalize shrink-0">{r.verdict}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">{r.snippet}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleUpvote(r.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                          upvoted.has(r.id)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:bg-accent"
                        }`}
                      >
                        <ArrowUp className="w-4 h-4" />
                        <motion.span key={r.upvote_count} initial={{ scale: 1.4 }} animate={{ scale: 1 }}>
                          {r.upvote_count}
                        </motion.span>
                      </motion.button>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Community;
