import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type TigerState = 
  | "idle" 
  | "attentive" 
  | "typing" 
  | "privacy" 
  | "error" 
  | "valid" 
  | "success" 
  | "failure"
  | "confused";

interface TigerCheckProps {
  className?: string;
}

const TigerCheck = ({ className }: TigerCheckProps) => {
  const [state, setState] = useState<TigerState>("idle");
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleFocus = useCallback((e: FocusEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
      const rect = target.getBoundingClientRect();
      setPosition({ 
        x: Math.min(rect.right + 20, window.innerWidth - 120), 
        y: Math.max(rect.top - 40, 80) 
      });
      setIsVisible(true);
      
      const inputType = (target as HTMLInputElement).type;
      if (inputType === "password") {
        setState("privacy");
      } else {
        setState("attentive");
      }
    }
  }, []);

  const handleBlur = useCallback((e: FocusEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
      setState("idle");
      setTimeout(() => setIsVisible(false), 500);
    }
  }, []);

  const handleInput = useCallback((e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
      const inputType = target.type;
      
      if (inputType === "password") {
        setState("privacy");
      } else if (target.validity && !target.validity.valid) {
        setState("confused");
      } else if (target.value.length > 0) {
        setState("typing");
      }
    }
  }, []);

  const handleInvalid = useCallback(() => {
    setState("error");
    setTimeout(() => setState("attentive"), 2000);
  }, []);

  const handleSubmit = useCallback((e: Event) => {
    const form = e.target as HTMLFormElement;
    if (form.checkValidity()) {
      setState("success");
      setTimeout(() => {
        setState("idle");
        setIsVisible(false);
      }, 2000);
    } else {
      setState("failure");
      setTimeout(() => setState("attentive"), 2000);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("focusin", handleFocus);
    document.addEventListener("focusout", handleBlur);
    document.addEventListener("input", handleInput);
    document.addEventListener("invalid", handleInvalid, true);
    
    const forms = document.querySelectorAll("form");
    forms.forEach(form => form.addEventListener("submit", handleSubmit));

    return () => {
      document.removeEventListener("focusin", handleFocus);
      document.removeEventListener("focusout", handleBlur);
      document.removeEventListener("input", handleInput);
      document.removeEventListener("invalid", handleInvalid, true);
      forms.forEach(form => form.removeEventListener("submit", handleSubmit));
    };
  }, [handleFocus, handleBlur, handleInput, handleInvalid, handleSubmit]);

  const getTigerEmoji = () => {
    switch (state) {
      case "attentive": return "👀";
      case "typing": return "✍️";
      case "privacy": return "🙈";
      case "error": 
      case "confused": return "😕";
      case "valid": return "😊";
      case "success": return "🎉";
      case "failure": return "😔";
      default: return "😌";
    }
  };

  const getEyePosition = () => {
    switch (state) {
      case "privacy": return { x: 0, y: 5 };
      case "typing": return { x: 2, y: -1 };
      case "attentive": return { x: 3, y: -2 };
      default: return { x: 0, y: 0 };
    }
  };

  const eyePos = getEyePosition();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          className={`fixed z-[100] pointer-events-none ${className}`}
          style={{ 
            left: position.x, 
            top: position.y,
          }}
        >
          <motion.div
            className="relative"
            animate={
              state === "success" 
                ? { y: [0, -15, 0] }
                : state === "error" || state === "failure"
                ? { x: [-5, 5, -5, 5, 0] }
                : state === "idle"
                ? { y: [0, -5, 0] }
                : {}
            }
            transition={
              state === "success"
                ? { duration: 0.5, times: [0, 0.5, 1] }
                : state === "error" || state === "failure"
                ? { duration: 0.4 }
                : { duration: 2, repeat: Infinity }
            }
          >
            {/* Tiger Face */}
            <motion.div 
              className="w-20 h-20 bg-gradient-to-br from-warning to-orange-600 rounded-full shadow-xl relative overflow-hidden"
              animate={{ 
                rotate: state === "confused" ? [0, -10, 10, 0] : 0 
              }}
              transition={{ duration: 0.5 }}
            >
              {/* Stripes */}
              <div className="absolute inset-0">
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute bg-orange-900/40 rounded-full"
                    style={{
                      width: 8,
                      height: 25,
                      left: `${20 + i * 18}%`,
                      top: "10%",
                      transform: "rotate(-30deg)",
                    }}
                  />
                ))}
              </div>

              {/* Inner Face (white area) */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-12 bg-orange-100 rounded-t-full" />

              {/* Eyes Container */}
              <AnimatePresence mode="wait">
                {state === "privacy" ? (
                  <motion.div
                    key="paws"
                    initial={{ y: 30 }}
                    animate={{ y: 0 }}
                    exit={{ y: 30 }}
                    className="absolute top-5 left-1/2 -translate-x-1/2 flex gap-1"
                  >
                    {/* Paws covering eyes */}
                    <div className="w-7 h-6 bg-warning rounded-full shadow-sm" />
                    <div className="w-7 h-6 bg-warning rounded-full shadow-sm" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="eyes"
                    className="absolute top-5 left-1/2 -translate-x-1/2 flex gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Left Eye */}
                    <div className="relative w-5 h-6 bg-white rounded-full overflow-hidden">
                      <motion.div
                        className="absolute w-3 h-3 bg-foreground rounded-full"
                        animate={{ x: eyePos.x, y: eyePos.y }}
                        style={{ top: "30%", left: "20%" }}
                      />
                    </div>
                    {/* Right Eye */}
                    <div className="relative w-5 h-6 bg-white rounded-full overflow-hidden">
                      <motion.div
                        className="absolute w-3 h-3 bg-foreground rounded-full"
                        animate={{ x: eyePos.x, y: eyePos.y }}
                        style={{ top: "30%", left: "20%" }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Nose */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-3 h-2 bg-orange-900 rounded-full" />

              {/* Mouth */}
              <motion.div
                className="absolute bottom-2 left-1/2 -translate-x-1/2"
                animate={
                  state === "success" || state === "valid"
                    ? { scaleX: 1.2 }
                    : state === "error" || state === "failure" || state === "confused"
                    ? { scaleY: -0.8 }
                    : {}
                }
              >
                <svg width="16" height="8" viewBox="0 0 16 8">
                  <path
                    d={
                      state === "success" || state === "valid"
                        ? "M2,2 Q8,8 14,2"
                        : state === "error" || state === "failure"
                        ? "M2,6 Q8,2 14,6"
                        : "M2,4 L8,4 L14,4"
                    }
                    stroke="#7c2d12"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </motion.div>

              {/* Ears */}
              <div className="absolute -top-2 left-2 w-5 h-5 bg-gradient-to-br from-warning to-orange-600 rounded-full transform rotate-[-30deg]">
                <div className="absolute inset-1 bg-pink-300 rounded-full" />
              </div>
              <div className="absolute -top-2 right-2 w-5 h-5 bg-gradient-to-br from-warning to-orange-600 rounded-full transform rotate-[30deg]">
                <div className="absolute inset-1 bg-pink-300 rounded-full" />
              </div>
            </motion.div>

            {/* Tail */}
            <motion.div
              className="absolute -right-4 top-12 w-6 h-16 origin-top"
              animate={
                state === "success" || state === "valid"
                  ? { rotate: [0, 30, -30, 30, -30, 0] }
                  : { rotate: [0, 10, 0, -10, 0] }
              }
              transition={{ 
                duration: state === "success" || state === "valid" ? 0.8 : 2, 
                repeat: Infinity 
              }}
            >
              <div className="w-3 h-full bg-gradient-to-b from-warning to-orange-600 rounded-full">
                <div className="absolute bottom-0 w-full h-4 bg-foreground/80 rounded-full" />
              </div>
            </motion.div>

            {/* Speech Bubble */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded-full shadow-lg text-lg"
            >
              {getTigerEmoji()}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-white rotate-45" />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TigerCheck;
