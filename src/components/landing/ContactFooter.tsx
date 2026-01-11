import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Shield, Mail, Instagram, Twitter, Heart, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const ContactFooter = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const socialLinks = [
    {
      icon: Mail,
      label: "Email",
      href: "mailto:adityagupta1234.in@gmail.com",
      handle: "adityagupta1234.in@gmail.com",
    },
    {
      icon: Instagram,
      label: "Instagram",
      href: "https://instagram.com/agpro001",
      handle: "@agpro001",
    },
    {
      icon: Twitter,
      label: "X (Twitter)",
      href: "https://x.com/agpro001",
      handle: "@agpro001",
    },
  ];

  return (
    <footer ref={ref} className="relative bg-secondary/50 border-t border-border overflow-hidden">
      {/* 3D Floating Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={isInView ? { 
              opacity: [0.1, 0.3, 0.1],
              y: [0, -20, 0],
              rotateY: [0, 180, 360],
            } : {}}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              delay: i * 0.5,
            }}
            className="absolute w-16 h-16 rounded-xl bg-primary/5 border border-primary/10"
            style={{
              left: `${10 + i * 20}%`,
              top: `${20 + (i % 3) * 20}%`,
              transform: `perspective(1000px) rotateX(${i * 15}deg)`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 py-16 relative">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <motion.div
                animate={{ rotateY: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <Shield className="w-10 h-10 text-primary" />
              </motion.div>
              <span className="text-2xl font-bold text-foreground">
                TruthLens<span className="text-primary">AI</span>
              </span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-md">
              Empowering people to navigate the digital world with confidence. Detect misinformation, 
              identify scams, and make informed decisions with AI-powered analysis.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Built with</span>
              <Heart className="w-4 h-4 text-destructive fill-destructive" />
              <span>for a more truthful internet</span>
            </div>
          </motion.div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-6">Get in Touch</h3>
            <div className="space-y-4">
              {socialLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <motion.a
                    key={index}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    whileHover={{ x: 5, scale: 1.02 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-card hover:bg-card/80 border border-border hover:border-primary/30 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{link.label}</p>
                      <p className="text-sm text-muted-foreground">{link.handle}</p>
                    </div>
                  </motion.a>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} TruthLens AI. All rights reserved.
          </p>
          
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </a>
            <Button
              variant="ghost"
              size="icon"
              onClick={scrollToTop}
              className="rounded-full"
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default ContactFooter;
