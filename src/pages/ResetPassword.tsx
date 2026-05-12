import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import logoImg from "@/assets/logo.jpg";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase puts type=recovery in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token")) {
      setIsReady(true);
    } else {
      // also allow already-signed-in users to update password
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setIsReady(true);
        else toast.error("Invalid or expired reset link.");
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters.");
    if (password !== confirm) return toast.error("Passwords do not match.");
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);
    if (error) return toast.error(error.message);
    setDone(true);
    toast.success("Password updated. Redirecting…");
    setTimeout(() => navigate("/auth"), 1500);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl"
      >
        <div className="flex items-center justify-center gap-2 mb-6">
          <img src={logoImg} alt="TruthLens" className="w-10 h-10 rounded-full object-cover" />
          <span className="text-xl font-bold">TruthLens<span className="text-primary">AI</span></span>
        </div>

        {done ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-8"
          >
            <ShieldCheck className="w-16 h-16 text-success mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Password updated</h2>
            <p className="text-muted-foreground text-sm">Redirecting to sign in…</p>
          </motion.div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-2 text-center">Reset your password</h1>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Choose a strong password you don't use elsewhere.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pw">New password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="pw"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    placeholder="At least 8 characters"
                    minLength={8}
                    required
                    disabled={!isReady}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpw">Confirm password</Label>
                <Input
                  id="cpw"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  disabled={!isReady}
                />
              </div>
              <Button type="submit" className="w-full" disabled={!isReady || isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Update password
              </Button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;
