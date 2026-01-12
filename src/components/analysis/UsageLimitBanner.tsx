import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useUsageLimit } from "@/hooks/useUsageLimit";

const UsageLimitBanner = () => {
  const { getRemainingUses, isAuthenticated, maxFreeUses, usageCount } = useUsageLimit();
  const remaining = getRemainingUses();

  if (isAuthenticated) return null;

  const isExhausted = remaining === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-4 mb-6 border ${
        isExhausted 
          ? "bg-destructive/10 border-destructive/30" 
          : "bg-primary/10 border-primary/30"
      }`}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {isExhausted ? (
            <Lock className="w-5 h-5 text-destructive" />
          ) : (
            <Sparkles className="w-5 h-5 text-primary" />
          )}
          <div>
            {isExhausted ? (
              <>
                <p className="font-medium text-destructive">Free trial exhausted</p>
                <p className="text-sm text-muted-foreground">
                  Sign in to continue with unlimited analyses
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-foreground">
                  {remaining} of {maxFreeUses} free analyses remaining
                </p>
                <p className="text-sm text-muted-foreground">
                  Sign in for unlimited access
                </p>
              </>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/auth?mode=signup">Get Started Free</Link>
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      {!isExhausted && (
        <div className="mt-3 h-2 bg-background rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((maxFreeUses - remaining) / maxFreeUses) * 100}%` }}
            className="h-full bg-primary rounded-full"
          />
        </div>
      )}
    </motion.div>
  );
};

export default UsageLimitBanner;
