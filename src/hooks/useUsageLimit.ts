import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "truthlens_usage_count";
const MAX_FREE_USES = 3;

export const useUsageLimit = () => {
  const [usageCount, setUsageCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session?.user);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsAuthenticated(!!session?.user);
        // Reset usage count on login (authenticated users have unlimited)
        if (session?.user) {
          localStorage.removeItem(STORAGE_KEY);
          setUsageCount(0);
        }
      }
    );

    // Load usage count from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setUsageCount(parseInt(stored, 10));
    }

    return () => subscription.unsubscribe();
  }, []);

  const incrementUsage = () => {
    if (!isAuthenticated) {
      const newCount = usageCount + 1;
      setUsageCount(newCount);
      localStorage.setItem(STORAGE_KEY, newCount.toString());
      return newCount;
    }
    return 0;
  };

  const canUseFeature = () => {
    if (isAuthenticated) return true;
    return usageCount < MAX_FREE_USES;
  };

  const getRemainingUses = () => {
    if (isAuthenticated) return Infinity;
    return Math.max(0, MAX_FREE_USES - usageCount);
  };

  return {
    usageCount,
    isAuthenticated,
    isLoading,
    incrementUsage,
    canUseFeature,
    getRemainingUses,
    maxFreeUses: MAX_FREE_USES,
  };
};
