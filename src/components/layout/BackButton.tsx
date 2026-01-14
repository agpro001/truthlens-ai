import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  className?: string;
  showOnHome?: boolean;
}

const BackButton = ({ className = "", showOnHome = false }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  // Don't show on home page unless explicitly requested
  if (window.location.pathname === "/" && !showOnHome) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`fixed top-20 left-4 z-40 ${className}`}
    >
      <Button
        variant="outline"
        size="icon"
        onClick={handleBack}
        className="group relative w-12 h-12 rounded-full bg-card/80 backdrop-blur-xl border-border shadow-elevated hover:shadow-glow hover:border-primary/50 transition-all duration-300"
      >
        <motion.div
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.9 }}
          className="flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
        </motion.div>
        
        {/* Glow effect on hover */}
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
          initial={false}
        />
        
        {/* Ripple effect */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/30"
          initial={{ scale: 1, opacity: 0 }}
          whileHover={{ scale: 1.2, opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      </Button>
      
      {/* Tooltip */}
      <motion.span
        initial={{ opacity: 0, x: 10 }}
        whileHover={{ opacity: 1, x: 0 }}
        className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 text-sm bg-card/90 backdrop-blur-sm rounded-lg border border-border shadow-lg pointer-events-none whitespace-nowrap"
      >
        Go Back
      </motion.span>
    </motion.div>
  );
};

export default BackButton;
