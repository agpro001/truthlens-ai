import { useRef, useState } from "react";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import SolutionSection from "@/components/landing/SolutionSection";
import AnalysisPanel from "@/components/analysis/AnalysisPanel";
import ContactFooter from "@/components/landing/ContactFooter";
import Navbar from "@/components/layout/Navbar";
import ChatAssistant from "@/components/chat/ChatAssistant";
import HistoryPanel from "@/components/history/HistoryPanel";
import { useAnalysis } from "@/hooks/useAnalysis";

const Index = () => {
  const analysisPanelRef = useRef<HTMLDivElement>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { result } = useAnalysis();

  const scrollToAnalysis = () => {
    document.getElementById("analysis-panel")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background dark">
      <Navbar onHistoryClick={() => setHistoryOpen(true)} />
      <HeroSection onStartAnalyzing={scrollToAnalysis} />
      <ProblemSection />
      <SolutionSection />
      <div ref={analysisPanelRef}>
        <AnalysisPanel />
      </div>
      <ContactFooter />
      <ChatAssistant analysisContext={result} />
      <HistoryPanel 
        isOpen={historyOpen} 
        onClose={() => setHistoryOpen(false)} 
        onReanalyze={(type, content) => {
          setHistoryOpen(false);
          scrollToAnalysis();
        }}
      />
    </div>
  );
};

export default Index;
