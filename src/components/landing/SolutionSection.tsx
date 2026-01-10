import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Search, ShieldCheck, Brain, Users } from "lucide-react";

const solutions = [
  {
    icon: Search,
    title: "Detect",
    description: "AI-generated text, images, and manipulated photos",
    features: ["Text authenticity analysis", "Image forensics", "Deepfake detection"],
    color: "primary",
  },
  {
    icon: ShieldCheck,
    title: "Protect",
    description: "Scams, phishing, fake insurance claims, and fraud offers",
    features: ["Scam pattern recognition", "Phishing URL detection", "Fraud risk scoring"],
    color: "success",
  },
  {
    icon: Brain,
    title: "Explain",
    description: "Clear explanations of why something is risky",
    features: ["Evidence indicators", "Confidence scoring", "Source verification"],
    color: "warning",
  },
  {
    icon: Users,
    title: "Empower",
    description: "Make informed decisions with verified information",
    features: ["Critical thinking prompts", "Alternative sources", "Fact-check links"],
    color: "accent",
  },
];

const SolutionSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-32 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-4 block">
            How It Works
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Your Digital Truth Shield
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            TruthLens AI uses advanced multimodal analysis to help you navigate the digital world with confidence.
          </p>
        </motion.div>

        {/* Solution Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {solutions.map((solution, index) => {
            const Icon = solution.icon;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.15, duration: 0.6 }}
                className="group relative"
              >
                <div className="h-full bg-card rounded-xl p-6 shadow-card hover:shadow-elevated transition-all duration-300 border border-border hover:border-primary/30">
                  {/* Icon */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`w-14 h-14 rounded-xl bg-${solution.color}/10 flex items-center justify-center mb-6`}
                  >
                    <Icon className={`w-7 h-7 text-${solution.color}`} />
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {solution.title}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {solution.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-2">
                    {solution.features.map((feature, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: index * 0.15 + i * 0.1 + 0.3 }}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <div className={`w-1.5 h-1.5 rounded-full bg-${solution.color}`} />
                        {feature}
                      </motion.li>
                    ))}
                  </ul>

                  {/* Hover Glow */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
