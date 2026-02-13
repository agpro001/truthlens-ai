import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, ArrowLeft, Eye, EyeOff, Phone, Loader2 } from "lucide-react";
import logoImg from "@/assets/logo.jpg";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const isSignUp = searchParams.get("mode") === "signup";
  const navigate = useNavigate();

  const [mode, setMode] = useState<"signin" | "signup">(isSignUp ? "signup" : "signin");
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/");
    });
  }, [navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Account created! You can now sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }
    
    setIsLoading(true);
    try {
      const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;
      const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
      if (error) throw error;
      setOtpSent(true);
      setCountdown(60);
      toast.success("OTP sent to your phone!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }
    
    setIsLoading(true);
    try {
      const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;
      const { error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: "sms",
      });
      if (error) throw error;
      toast.success("Phone verified successfully!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "OTP verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background dark relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-primary/20"
            style={{
              width: Math.random() * 200 + 50,
              height: Math.random() * 200 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 100 - 50, 0],
              y: [0, Math.random() * 100 - 50, 0],
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Header spacer for back button */}
          <div className="h-8 mb-4" />

          {/* Auth Card */}
          <motion.div 
            className="bg-card/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-border relative overflow-hidden"
            whileHover={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
          >
            {/* 3D Glow Effect */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/30 rounded-full blur-3xl" />
            
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-8 relative">
              <motion.div
                animate={{ rotateY: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <img src={logoImg} alt="TruthLens AI" className="w-10 h-10 rounded-full object-cover" />
              </motion.div>
              <span className="text-2xl font-bold text-foreground">
                TruthLens<span className="text-primary">AI</span>
              </span>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-6 relative">
              <Button
                variant={mode === "signin" ? "default" : "outline"}
                onClick={() => setMode("signin")}
                className="flex-1"
              >
                Sign In
              </Button>
              <Button
                variant={mode === "signup" ? "default" : "outline"}
                onClick={() => setMode("signup")}
                className="flex-1"
              >
                Sign Up
              </Button>
            </div>

            {/* Auth Method Tabs */}
            <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as "email" | "phone")} className="mb-6 relative">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="mt-4">
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {mode === "signup" ? "Create Account" : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="phone" className="mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1234567890"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10"
                        disabled={otpSent}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Include country code (e.g., +1 for US, +91 for India)
                    </p>
                  </div>

                  <AnimatePresence mode="wait">
                    {otpSent ? (
                      <motion.div
                        key="otp"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label>Enter OTP</Label>
                          <div className="flex justify-center">
                            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                              <InputOTPGroup>
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                                <InputOTPSlot index={2} />
                                <InputOTPSlot index={3} />
                                <InputOTPSlot index={4} />
                                <InputOTPSlot index={5} />
                              </InputOTPGroup>
                            </InputOTP>
                          </div>
                        </div>

                        <Button 
                          onClick={handleVerifyOtp} 
                          className="w-full" 
                          disabled={isLoading || otp.length !== 6}
                        >
                          {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                          Verify OTP
                        </Button>

                        <div className="text-center">
                          <Button
                            variant="link"
                            onClick={() => countdown === 0 && handleSendOtp()}
                            disabled={countdown > 0 || isLoading}
                            className="text-sm"
                          >
                            {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
                          </Button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="send"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <Button 
                          onClick={handleSendOtp} 
                          className="w-full" 
                          disabled={isLoading || !phone}
                        >
                          {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                          Send OTP
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </TabsContent>
            </Tabs>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* Google Sign-In */}
            <Button
              variant="outline"
              className="w-full flex items-center gap-2"
              onClick={async () => {
                const { error } = await lovable.auth.signInWithOAuth("google", {
                  redirect_uri: window.location.origin,
                });
                if (error) toast.error(error.message || "Google sign-in failed");
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </Button>

            {/* Info Text */}
            <p className="text-center text-sm text-muted-foreground mt-6 relative">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </motion.div>

          {/* Free Usage Info */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-sm text-muted-foreground mt-6"
          >
            🎁 Get <span className="text-primary font-semibold">3 free analyses</span> without signing up!
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
