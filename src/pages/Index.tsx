import { useRef } from "react";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import SolutionSection from "@/components/landing/SolutionSection";
import AnalysisPanel from "@/components/analysis/AnalysisPanel";
import Navbar from "@/components/layout/Navbar";

const Index = () => {
  const analysisPanelRef = useRef<HTMLDivElement>(null);

  const scrollToAnalysis = () => {
    document.getElementById("analysis-panel")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background dark">
      <Navbar />
      <HeroSection onStartAnalyzing={scrollToAnalysis} />
      <ProblemSection />
      <SolutionSection />
      <div ref={analysisPanelRef}>
        <AnalysisPanel />
      </div>
    </div>
  );
};

export default Index;
