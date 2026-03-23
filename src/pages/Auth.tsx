import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, Lock, User, Crown, Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import PhoneFrame from "@/components/PhoneFrame";
import { signInWithPassword, signUpWithEmail, signInWithProvider } from "@/services/authService";
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

  // Validation and UI states
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [nameError, setNameError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const returnTo = searchParams.get("returnTo") || "/studio";

  useEffect(() => {
    if (mode === "signup" && displayName.length > 0) {
      if (displayName.trim().length < 3) setNameError("Name must be at least 3 characters");
      else setNameError("");
    } else if (mode === "login") setNameError("");
  }, [displayName, mode]);

  useEffect(() => {
    if (email.length > 0) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) setEmailError("Please enter a valid email address");
      else setEmailError("");
    }
  }, [email]);

  useEffect(() => {
    if (password.length > 0) {
      if (password.length < 6) setPasswordError("Password must be at least 6 characters");
      else setPasswordError("");
    }
  }, [password]);

  useEffect(() => {
    if (mode === "signup" && confirmPassword.length > 0) {
      if (confirmPassword !== password) setConfirmPasswordError("Passwords do not match");
      else setConfirmPasswordError("");
    } else if (mode === "login") setConfirmPasswordError("");
  }, [confirmPassword, password, mode]);

  const validate = () => {
    let isValid = true;

    if (mode === "signup" && displayName.trim().length < 3) {
      setNameError("Name must be at least 3 characters");
      isValid = false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    }

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      isValid = false;
    }

    if (mode === "signup" && confirmPassword !== password) {
      setConfirmPasswordError("Passwords do not match");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

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

        {/* Liquid Glass Background        {/* Glow effects removed */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
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
                  className="flex flex-col gap-1.5"
                >
                  <div className={`flex items-center gap-3 bg-white/[0.04] border ${nameError ? 'border-red-500/50' : 'border-white/[0.06]'} rounded-2xl px-4 py-3.5 transition-colors`}>
                    <User size={18} className={nameError ? "text-red-400" : "text-white/25 shrink-0"} />
                    <input
                      type="text"
                      placeholder="Display name"
                      value={displayName}
                      onChange={(e) => {
                        setDisplayName(e.target.value);
                        if (nameError) setNameError("");
                      }}
                      className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/25 outline-none"
                    />
                  </div>
                  {nameError && <span className="text-red-400 text-[12px] pl-2">{nameError}</span>}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col gap-1.5">
              <div className={`flex items-center gap-3 bg-white/[0.04] border ${emailError ? 'border-red-500/50' : 'border-white/[0.06]'} rounded-2xl px-4 py-3.5 transition-colors`}>
                <Mail size={18} className={emailError ? "text-red-400" : "text-white/25 shrink-0"} />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  required
                  className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/25 outline-none"
                />
              </div>
              {emailError && <span className="text-red-400 text-[12px] pl-2">{emailError}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className={`flex items-center gap-3 bg-white/[0.04] border ${passwordError ? 'border-red-500/50' : 'border-white/[0.06]'} rounded-2xl px-4 py-3.5 transition-colors relative`}>
                <Lock size={18} className={passwordError ? "text-red-400" : "text-white/25 shrink-0"} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  required
                  minLength={6}
                  className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/25 outline-none pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-white/30 hover:text-white/60 transition-colors shrink-0"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordError && <span className="text-red-400 text-[12px] pl-2">{passwordError}</span>}
            </div>

            {/* Confirm Password - only visible if password is valid in signup */}
            <AnimatePresence>
              {mode === "signup" && password.length >= 6 && (
                <motion.div
                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                  animate={{ height: "auto", opacity: 1, marginTop: 4 }}
                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-1.5"
                >
                  <div className={`flex items-center gap-3 bg-white/[0.04] border ${confirmPasswordError ? 'border-red-500/50' : 'border-white/[0.06]'} rounded-2xl px-4 py-3.5 transition-colors relative`}>
                    <Lock size={18} className={confirmPasswordError ? "text-red-400" : "text-white/25 shrink-0"} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (confirmPasswordError) setConfirmPasswordError("");
                      }}
                      required
                      minLength={6}
                      className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/25 outline-none pr-8"
                    />
                  </div>
                  {confirmPasswordError && <span className="text-red-400 text-[12px] pl-2">{confirmPasswordError}</span>}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between mt-1 px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="hidden"
                />
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-white text-black border-white' : 'border-white/20 group-hover:border-white/40'}`}>
                  {rememberMe && <Check size={12} />}
                </div>
                <span className="text-[12px] text-white/40 group-hover:text-white/60 transition-colors">Remember me</span>
              </label>

              {mode === "login" && (
                <button type="button" className="text-[12px] text-white/40 hover:text-white/80 transition-colors">
                  Forgot password?
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 rounded-2xl bg-white text-black text-[15px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-40"
            >
              {loading ? "Please wait..." : mode === "signup" ? "Sign up" : "Sign in"}
            </button>

            {/* Social Logins */}
            <div className="relative flex items-center py-4 mt-2">
              <div className="flex-1 border-t border-white/[0.04]"></div>
              <span className="px-3 text-[11px] text-white/30 uppercase tracking-widest">Or continue with</span>
              <div className="flex-1 border-t border-white/[0.04]"></div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await signInWithProvider('google');
                  } catch (e: any) {
                    toast.error(e.message || "Google login failed");
                  }
                }}
                className="flex-1 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center gap-2 hover:bg-white/[0.04] transition-colors active:scale-[0.98]"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                <span className="text-[13px] text-white/70 font-medium">Google</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await signInWithProvider('facebook');
                  } catch (e: any) {
                    toast.error(e.message || "Facebook login failed");
                  }
                }}
                className="flex-1 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center gap-2 hover:bg-white/[0.04] transition-colors active:scale-[0.98]"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#1877F2]"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                <span className="text-[13px] text-white/70 font-medium">Facebook</span>
              </button>
            </div>
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
