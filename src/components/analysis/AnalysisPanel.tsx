import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Link, Image, Loader2 } from "lucide-react";
import TextAnalysis from "./TextAnalysis";
import LinkAnalysis from "./LinkAnalysis";
import ImageAnalysis from "./ImageAnalysis";
import AnalysisResults from "./AnalysisResults";
import { useAnalysis } from "@/hooks/useAnalysis";

const AnalysisPanel = () => {
  const [activeTab, setActiveTab] = useState("text");
  const { analyze, isLoading, result, reset } = useAnalysis();

  const handleAnalyze = async (type: string, content: string | File) => {
    await analyze(type, content);
  };

  return (
    <section id="analysis-panel" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-4 block">
            Analyze Now
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            TruthLens Analysis Panel
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Paste text, enter a URL, or upload an image to analyze for authenticity, scams, and AI-generated content.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-card rounded-2xl shadow-elevated border border-border overflow-hidden">
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); reset(); }} className="w-full">
              {/* Tab List */}
              <div className="border-b border-border bg-muted/30 p-2">
                <TabsList className="w-full grid grid-cols-3 bg-transparent gap-2 h-auto p-0">
                  {[
                    { value: "text", icon: FileText, label: "Text" },
                    { value: "link", icon: Link, label: "Link" },
                    { value: "image", icon: Image, label: "Image" },
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="relative py-3 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all"
                    >
                      <motion.div
                        className="flex items-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <tab.icon className="w-4 h-4" />
                        <span className="font-medium">{tab.label}</span>
                      </motion.div>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-16"
                    >
                      <div className="relative">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                      </div>
                      <motion.div
                        className="mt-6 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <LoadingMessages />
                      </motion.div>
                    </motion.div>
                  ) : result ? (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <AnalysisResults result={result} onReset={reset} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <TabsContent value="text" className="mt-0">
                        <TextAnalysis onAnalyze={(content) => handleAnalyze("text", content)} />
                      </TabsContent>
                      <TabsContent value="link" className="mt-0">
                        <LinkAnalysis onAnalyze={(url) => handleAnalyze("link", url)} />
                      </TabsContent>
                      <TabsContent value="image" className="mt-0">
                        <ImageAnalysis onAnalyze={(file) => handleAnalyze("image", file)} />
                      </TabsContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Tabs>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const LoadingMessages = () => {
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = [
    "Reading context…",
    "Checking authenticity…",
    "Detecting manipulation…",
    "Analyzing patterns…",
    "Verifying sources…",
  ];

  useState(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  });

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={messageIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="text-muted-foreground"
      >
        {messages[messageIndex]}
      </motion.p>
    </AnimatePresence>
  );
};

export default AnalysisPanel;
