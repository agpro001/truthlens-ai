import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { AlertTriangle, Bot, ShieldAlert, Newspaper } from "lucide-react";

const fakeContent = [
  { icon: Newspaper, text: "BREAKING: Government announces $10,000 for every citizen", type: "Fake News" },
  { icon: Bot, text: "AI-generated profile detected", type: "Deepfake" },
  { icon: ShieldAlert, text: "Congratulations! You've won $1,000,000", type: "Scam" },
  { icon: AlertTriangle, text: "Limited offer: 90% off luxury goods", type: "Fraud" },
];

const ProblemSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-32 bg-background overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            The internet no longer lies loudly.
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground">
            It lies <span className="text-destructive font-semibold">convincingly</span>.
          </p>
        </motion.div>

        {/* Floating Fake Content Cards */}
        <div className="relative h-[400px] md:h-[500px]">
          {fakeContent.map((item, index) => {
            const Icon = item.icon;
            const positions = [
              { x: "10%", y: "20%", rotate: -5 },
              { x: "60%", y: "10%", rotate: 3 },
              { x: "20%", y: "60%", rotate: -3 },
              { x: "70%", y: "55%", rotate: 5 },
            ];
            const pos = positions[index];

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={isInView ? { 
                  opacity: [0, 1, 1, 0.3],
                  scale: [0.8, 1, 1, 0.95],
                  y: [50, 0, 0, 10],
                } : {}}
                transition={{ 
                  duration: 4,
                  delay: index * 0.3,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
                className="absolute glass rounded-lg p-4 shadow-elevated max-w-xs"
                style={{ left: pos.x, top: pos.y, rotate: `${pos.rotate}deg` }}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <Icon className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-destructive uppercase tracking-wide">
                      {item.type}
                    </span>
                    <p className="text-sm text-foreground mt-1 line-through decoration-destructive/50">
                      {item.text}
                    </p>
                  </div>
                </div>
                
                {/* Glitch Effect Overlay */}
                <motion.div
                  animate={{
                    opacity: [0, 0.3, 0],
                    x: [-2, 2, -2],
                  }}
                  transition={{
                    duration: 0.2,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                  className="absolute inset-0 bg-destructive/10 rounded-lg pointer-events-none"
                />
              </motion.div>
            );
          })}

          {/* Warning Pulses */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 1 }}
            className="absolute inset-0 pointer-events-none"
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 2, 1],
                  opacity: [0.3, 0, 0.3],
                }}
                transition={{
                  duration: 3,
                  delay: i * 1,
                  repeat: Infinity,
                }}
                className="absolute w-4 h-4 rounded-full bg-destructive"
                style={{
                  left: `${30 + i * 20}%`,
                  top: `${40 + i * 10}%`,
                }}
              />
            ))}
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16"
        >
          {[
            { value: "86%", label: "Can't detect AI content" },
            { value: "$10B+", label: "Lost to scams yearly" },
            { value: "70%", label: "Share without verifying" },
            { value: "500%", label: "Rise in deepfakes" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                className="block text-3xl md:text-4xl font-bold text-gradient"
              >
                {stat.value}
              </motion.span>
              <span className="text-sm text-muted-foreground mt-2 block">
                {stat.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemSection;
