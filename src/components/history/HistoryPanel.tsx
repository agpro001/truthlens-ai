import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  History, 
  Bookmark, 
  FileText, 
  Link, 
  Image, 
  Search,
  Trash2,
  RefreshCw,
  Filter,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AnalysisResult } from "@/hooks/useAnalysis";

interface HistoryItem {
  id: string;
  analysis_type: string;
  content: string | null;
  verdict: string;
  confidence: number;
  explanation: string;
  indicators: unknown;
  evidence: unknown;
  is_bookmarked: boolean;
  created_at: string;
}

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onReanalyze: (type: string, content: string) => void;
}

const verdictConfig = {
  verified: { icon: CheckCircle2, color: "text-success", label: "Verified" },
  suspicious: { icon: AlertTriangle, color: "text-warning", label: "Suspicious" },
  fake: { icon: XCircle, color: "text-destructive", label: "Fake" },
  unknown: { icon: HelpCircle, color: "text-muted-foreground", label: "Unknown" },
};

const typeIcons = {
  text: FileText,
  link: Link,
  image: Image,
};

const HistoryPanel = ({ isOpen, onClose, onReanalyze }: HistoryPanelProps) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "bookmarked">("all");

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      let query = supabase
        .from("analysis_history")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter === "bookmarked") {
        query = query.eq("is_bookmarked", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error("Failed to fetch history:", error);
      toast.error("Failed to load history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, filter]);

  const toggleBookmark = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from("analysis_history")
        .update({ is_bookmarked: !currentState })
        .eq("id", id);

      if (error) throw error;
      
      setHistory((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_bookmarked: !currentState } : item
        )
      );
      
      toast.success(currentState ? "Removed from bookmarks" : "Added to bookmarks");
    } catch (error) {
      toast.error("Failed to update bookmark");
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from("analysis_history")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setHistory((prev) => prev.filter((item) => item.id !== id));
      toast.success("Item deleted");
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  const filteredHistory = history.filter((item) =>
    item.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.explanation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-card border-l border-border shadow-elevated z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <History className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">Analysis History</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search history..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 mt-4">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={filter === "bookmarked" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("bookmarked")}
                >
                  <Bookmark className="w-4 h-4 mr-1" />
                  Bookmarked
                </Button>
              </div>
            </div>

            {/* History List */}
            <ScrollArea className="flex-1 p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {filter === "bookmarked"
                      ? "No bookmarked analyses yet"
                      : "No analysis history yet"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Start analyzing content to build your history
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredHistory.map((item) => {
                    const verdictInfo = verdictConfig[item.verdict as keyof typeof verdictConfig] || verdictConfig.unknown;
                    const TypeIcon = typeIcons[item.analysis_type as keyof typeof typeIcons] || FileText;
                    const VerdictIcon = verdictInfo.icon;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-background border border-border hover:border-primary/30 transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <TypeIcon className="w-5 h-5 text-muted-foreground" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={`${verdictInfo.color} text-xs`}>
                                <VerdictIcon className="w-3 h-3 mr-1" />
                                {verdictInfo.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {item.confidence}% confidence
                              </span>
                            </div>
                            
                            <p className="text-sm text-foreground line-clamp-2 mb-2">
                              {item.content || item.explanation}
                            </p>
                            
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {new Date(item.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleBookmark(item.id, item.is_bookmarked)}
                          >
                            <Bookmark
                              className={`w-4 h-4 ${item.is_bookmarked ? "fill-primary text-primary" : ""}`}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => item.content && onReanalyze(item.analysis_type, item.content)}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteItem(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default HistoryPanel;
