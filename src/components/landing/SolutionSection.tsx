import { motion, useInView, useScroll, useTransform } from "framer-motion";
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

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);

  return (
    <section ref={ref} className="py-32 bg-secondary/30 overflow-hidden relative">
      {/* 3D Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            style={{ y }}
            className="absolute"
          >
            <motion.div
              animate={{
                rotateZ: [0, 360],
                opacity: [0.05, 0.15, 0.05],
              }}
              transition={{
                duration: 15 + i * 3,
                repeat: Infinity,
                ease: "linear",
              }}
              className="w-32 h-32 border border-primary/20 rounded-full"
              style={{
                left: `${5 + i * 12}%`,
                top: `${10 + (i % 4) * 20}%`,
                position: "absolute",
              }}
            />
          </motion.div>
        ))}
      </div>

      <div className="container mx-auto px-4 relative">
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

        {/* Solution Cards with 3D Effect */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {solutions.map((solution, index) => {
            const Icon = solution.icon;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.15, duration: 0.6 }}
                whileHover={{ 
                  y: -10,
                  rotateX: 5,
                  rotateY: -5,
                  transition: { duration: 0.3 }
                }}
                className="group relative"
                style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
              >
                <div className="h-full bg-card rounded-xl p-6 shadow-card hover:shadow-elevated transition-all duration-300 border border-border hover:border-primary/30">
                  {/* 3D Icon */}
                  <motion.div
                    whileHover={{ 
                      scale: 1.1, 
                      rotateY: 180,
                      transition: { duration: 0.6 }
                    }}
                    className={`w-14 h-14 rounded-xl bg-${solution.color}/10 flex items-center justify-center mb-6`}
                    style={{ transformStyle: "preserve-3d" }}
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
                        <motion.div 
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                          className={`w-1.5 h-1.5 rounded-full bg-${solution.color}`} 
                        />
                        {feature}
                      </motion.li>
                    ))}
                  </ul>

                  {/* 3D Hover Glow */}
                  <motion.div 
                    className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{ transform: "translateZ(20px)" }}
                  />
                </div>

                {/* 3D Shadow */}
                <motion.div
                  className="absolute inset-0 rounded-xl bg-primary/10 blur-xl opacity-0 group-hover:opacity-50 transition-opacity -z-10"
                  style={{ transform: "translateZ(-20px) translateY(10px)" }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
