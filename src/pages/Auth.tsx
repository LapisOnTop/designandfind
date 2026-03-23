import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, Lock, User, Crown, Check } from "lucide-react";
import { toast } from "sonner";
import PhoneFrame from "@/components/PhoneFrame";
import { signInWithPassword, signUpWithEmail } from "@/services/authService";
import { isProUser } from "@/services/proService";
import PaymentModal from "@/components/PaymentModal";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "login" ? "login" : "signup";
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPostAuthModal, setShowPostAuthModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const navigate = useNavigate();
  const returnTo = searchParams.get("returnTo") || "/studio";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const result = await signUpWithEmail({ email, password, displayName });
        if (result.session && result.user) {
          setAuthMode("signup");
          setShowPostAuthModal(true);
        } else {
          toast.success("Check your inbox — we sent a confirmation link.");
          setMode("login");
        }
      } else {
        await signInWithPassword({ email, password });
        setAuthMode("login");
        setShowPostAuthModal(true);
      }
    } catch (err: any) {
      if (mode === "signup" && /already registered|already exists/i.test(err?.message || "")) {
        setMode("login");
        toast.info("Looks like you already have an account. Try signing in.");
        return;
      }
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePostAuthContinue = () => {
    setShowPostAuthModal(false);
    navigate(decodeURIComponent(returnTo), { replace: true });
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setShowPostAuthModal(false);
    navigate(decodeURIComponent(returnTo), { replace: true });
  };

  return (
    <PhoneFrame>
      <div className="flex flex-col h-full bg-[#050510] relative overflow-hidden">

        {/* Liquid Glass Background — soft ambient orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[300px] h-[300px] rounded-full bg-[#0F6FFF]/25 blur-[120px] -top-20 -left-16" />
          <div className="absolute w-[250px] h-[250px] rounded-full bg-[#7C3AED]/15 blur-[100px] top-1/3 -right-20" />
          <div className="absolute w-[280px] h-[280px] rounded-full bg-[#00D9FF]/12 blur-[110px] -bottom-16 left-1/4" />
        </div>

        {/* Back Button */}
        <div className="relative z-10 px-5 pt-14 pb-2">
          <button
            onClick={() => navigate("/")}
            className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white/80 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
        </div>

        {/* Form Area */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative z-10 flex-1 flex flex-col px-7 pt-8 overflow-y-auto hide-scrollbar"
        >
          {/* Title */}
          <h1 className="text-[28px] font-bold tracking-tight text-white leading-tight">
            {mode === "signup" ? "Create account" : "Welcome back"}
          </h1>
          <p className="text-[14px] text-white/40 mt-2 mb-10 font-normal">
            {mode === "signup" ? "Get started with DesignMatch" : "Sign in to continue"}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <AnimatePresence mode="popLayout">
              {mode === "signup" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.06] rounded-2xl px-4 py-3.5">
                    <User size={18} className="text-white/25 shrink-0" />
                    <input
                      type="text"
                      placeholder="Display name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/25 outline-none"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.06] rounded-2xl px-4 py-3.5">
              <Mail size={18} className="text-white/25 shrink-0" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/25 outline-none"
              />
            </div>

            <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.06] rounded-2xl px-4 py-3.5">
              <Lock size={18} className="text-white/25 shrink-0" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/25 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-4 rounded-2xl bg-white text-black text-[15px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-40"
            >
              {loading ? "Please wait..." : mode === "signup" ? "Sign up" : "Sign in"}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-auto pt-8 pb-10 flex justify-center">
            <button
              onClick={() => setMode(mode === "signup" ? "login" : "signup")}
              className="text-[13px] text-white/30 font-normal"
            >
              {mode === "signup" ? (
                <>Have an account? <span className="text-white/60 font-medium">Sign in</span></>
              ) : (
                <>No account? <span className="text-white/60 font-medium">Sign up</span></>
              )}
            </button>
          </div>
        </motion.div>

        {/* Post-Auth Modal */}
        <AnimatePresence>
          {showPostAuthModal && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-2xl"
            >
              <motion.div
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="bg-[#111118]/90 backdrop-blur-xl border border-white/[0.06] rounded-[1.8rem] p-7 w-full max-w-sm"
              >
                {isProUser() ? (
                  <div className="text-center space-y-5">
                    <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center mx-auto">
                      <Crown size={28} className="text-yellow-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Welcome back, Pro</h2>
                      <p className="text-[14px] text-white/40 mt-1.5">
                        {authMode === "signup" ? "Your Pro account is ready." : "You're signed in."}
                      </p>
                    </div>
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-left space-y-2.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/40">Plan</span>
                        <span className="text-white font-medium">
                          {localStorage.getItem("designMatch_plan") === "yearly" ? "Yearly" : "Monthly"}
                        </span>
                      </div>
                      <div className="w-full h-px bg-white/[0.04]" />
                      <div className="flex justify-between text-sm">
                        <span className="text-white/40">Status</span>
                        <span className="text-green-400 font-medium flex items-center gap-1">
                          <Check size={14} /> Active
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handlePostAuthContinue}
                      className="w-full py-3.5 rounded-2xl bg-white text-black text-[15px] font-semibold active:scale-[0.98] transition-transform"
                    >
                      Continue
                    </button>
                  </div>
                ) : (
                  <div className="text-center space-y-5">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto">
                      <Crown size={28} className="text-white/70" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {authMode === "signup" ? "Welcome to DesignMatch" : "Welcome back"}
                      </h2>
                      <p className="text-[14px] text-white/40 mt-1.5">
                        Unlock unlimited designs and premium tools.
                      </p>
                    </div>
                    <div className="text-left space-y-2 py-2">
                      {["Unlimited designs", "Priority visual search", "No watermarks"].map(f => (
                        <div key={f} className="flex items-center gap-2.5 text-[13px] text-white/50">
                          <Check size={14} className="text-blue-400 shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col gap-2.5 pt-1">
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        className="w-full py-3.5 rounded-2xl bg-white text-black text-[15px] font-semibold active:scale-[0.98] transition-transform"
                      >
                        Upgrade to Pro
                      </button>
                      <button
                        onClick={handlePostAuthContinue}
                        className="w-full py-3 rounded-2xl text-white/30 text-[13px] font-medium hover:text-white/50 transition-colors"
                      >
                        Skip for now
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />
    </PhoneFrame>
  );
};

export default Auth;
