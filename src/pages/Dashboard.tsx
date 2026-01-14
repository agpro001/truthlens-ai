import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Bookmark,
  Clock,
  TrendingUp,
  FileText,
  Link,
  Image,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type AnalysisHistory = Tables<"analysis_history">;

const Dashboard = () => {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<AnalysisHistory[]>([]);
  const [bookmarked, setBookmarked] = useState<AnalysisHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      fetchData(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  const fetchData = async (userId: string) => {
    setIsLoading(true);
    const { data: history } = await supabase
      .from("analysis_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (history) {
      setAnalyses(history);
      setBookmarked(history.filter(h => h.is_bookmarked));
    }
    setIsLoading(false);
  };

  // Stats calculations
  const totalAnalyses = analyses.length;
  const verifiedCount = analyses.filter(a => a.verdict === "verified" || a.verdict === "legitimate").length;
  const suspiciousCount = analyses.filter(a => a.verdict === "suspicious" || a.verdict === "uncertain").length;
  const fakeCount = analyses.filter(a => a.verdict === "fake" || a.verdict === "scam").length;
  const bookmarkCount = bookmarked.length;

  // Chart data
  const last7Days = [...Array(7)].map((_, i) => {
    const date = startOfDay(subDays(new Date(), 6 - i));
    const count = analyses.filter(a => 
      startOfDay(new Date(a.created_at)).getTime() === date.getTime()
    ).length;
    return { date: format(date, "MMM d"), count };
  });

  const verdictData = [
    { name: "Verified", value: verifiedCount, color: "hsl(var(--success))" },
    { name: "Suspicious", value: suspiciousCount, color: "hsl(var(--warning))" },
    { name: "Fake/Scam", value: fakeCount, color: "hsl(var(--destructive))" },
  ].filter(d => d.value > 0);

  const typeData = [
    { name: "Text", value: analyses.filter(a => a.analysis_type === "text").length },
    { name: "Link", value: analyses.filter(a => a.analysis_type === "link").length },
    { name: "Image", value: analyses.filter(a => a.analysis_type === "image").length },
  ].filter(d => d.value > 0);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "text": return <FileText className="w-4 h-4" />;
      case "link": return <Link className="w-4 h-4" />;
      case "image": return <Image className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "verified":
      case "legitimate":
        return "text-success";
      case "suspicious":
      case "uncertain":
        return "text-warning";
      case "fake":
      case "scam":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-primary/5"
            style={{
              width: 300 + i * 100,
              height: 300 + i * 100,
              left: `${10 + i * 20}%`,
              top: `${5 + i * 15}%`,
            }}
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <RouterLink to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </RouterLink>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground text-sm">Your analysis history and statistics</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total Analyses", value: totalAnalyses, icon: BarChart3, color: "primary" },
            { label: "Verified", value: verifiedCount, icon: CheckCircle, color: "success" },
            { label: "Suspicious", value: suspiciousCount, icon: AlertTriangle, color: "warning" },
            { label: "Fake/Scam", value: fakeCount, icon: XCircle, color: "destructive" },
            { label: "Bookmarked", value: bookmarkCount, icon: Bookmark, color: "primary" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-card/80 backdrop-blur-sm border-border hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                      <p className={`text-2xl font-bold text-${stat.color}`}>{stat.value}</p>
                    </div>
                    <stat.icon className={`w-8 h-8 text-${stat.color} opacity-50`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Activity Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Activity (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={last7Days}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="hsl(var(--primary))"
                        fillOpacity={1}
                        fill="url(#colorCount)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Verdict Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5 text-primary" />
                  Verdict Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  {verdictData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={verdictData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {verdictData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No data yet
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  {verdictData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent & Bookmarked */}
        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="recent" className="gap-2">
              <Clock className="w-4 h-4" />
              Recent
            </TabsTrigger>
            <TabsTrigger value="bookmarked" className="gap-2">
              <Bookmark className="w-4 h-4" />
              Bookmarked
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent">
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6">
                {analyses.length > 0 ? (
                  <div className="space-y-4">
                    {analyses.slice(0, 10).map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="p-2 rounded-lg bg-primary/10">
                          {getTypeIcon(item.analysis_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {item.content?.slice(0, 60) || item.image_url || "Analysis"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(item.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                        <div className={`text-sm font-medium capitalize ${getVerdictColor(item.verdict)}`}>
                          {item.verdict}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.confidence}%
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No analyses yet. Start analyzing content!</p>
                    <Button className="mt-4" asChild>
                      <RouterLink to="/">Start Analyzing</RouterLink>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookmarked">
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6">
                {bookmarked.length > 0 ? (
                  <div className="space-y-4">
                    {bookmarked.map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="p-2 rounded-lg bg-primary/10">
                          {getTypeIcon(item.analysis_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {item.content?.slice(0, 60) || item.image_url || "Analysis"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(item.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                        <div className={`text-sm font-medium capitalize ${getVerdictColor(item.verdict)}`}>
                          {item.verdict}
                        </div>
                        <Bookmark className="w-4 h-4 text-primary fill-primary" />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No bookmarked analyses yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
