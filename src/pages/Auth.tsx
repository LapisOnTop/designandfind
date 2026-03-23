import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, User, Crown, Check, KeyRound } from "lucide-react";
import { toast } from "sonner";
import PhoneFrame from "@/components/PhoneFrame";
import { sendEmailOtp, verifyEmailOtp } from "@/services/authService";
import { isProUser } from "@/services/proService";
import PaymentModal from "@/components/PaymentModal";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "login" ? "login" : "signup";
  const [mode, setMode] = useState<"login" | "signup">(initialMode);

  const [otpStep, setOtpStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPostAuthModal, setShowPostAuthModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");

  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");
  const [otpError, setOtpError] = useState("");

  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [otpTouched, setOtpTouched] = useState(false);

  const navigate = useNavigate();
  const returnTo = searchParams.get("returnTo") || "/studio";

  const isNameValid = displayName.trim().length >= 3;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    if (mode === "signup" && nameTouched) {
      if (!isNameValid) setNameError("Name must be at least 3 characters");
      else setNameError("");
    } else if (mode === "login") setNameError("");
  }, [displayName, mode, nameTouched, isNameValid]);

  useEffect(() => {
    if (emailTouched) {
      if (!isEmailValid && email.length > 0) setEmailError("Please enter a valid email address");
      else setEmailError("");
    }
  }, [email, emailTouched, isEmailValid]);

  useEffect(() => {
    if (otpTouched) {
      if (otpCode.length !== 6 && otpCode.length > 0) setOtpError("Code must be 6 digits");
      else setOtpError("");
    }
  }, [otpCode, otpTouched]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameTouched(true);
    setEmailTouched(true);

    if (mode === "signup" && !isNameValid) return;
    if (!isEmailValid) return;

    setLoading(true);
    try {
      await sendEmailOtp(email, mode === "signup" ? displayName : undefined);
      setOtpStep(2);
      toast.success("Login code sent to your email!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpTouched(true);

    if (otpCode.length !== 6) {
      setOtpError("Code must be 6 digits");
      return;
    }

    setLoading(true);
    try {
      await verifyEmailOtp(email, otpCode, mode === "signup" ? displayName : undefined);
      setAuthMode(mode);
      setShowPostAuthModal(true);
    } catch (err: any) {
      toast.error(err.message || "Invalid code. Please try again.");
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

  // Reset states when switching between login/signup
  const toggleMode = () => {
    setMode(mode === "signup" ? "login" : "signup");
    setOtpStep(1);
    setOtpCode("");
    setNameTouched(false);
    setEmailTouched(false);
    setOtpTouched(false);
  };

  return (
    <PhoneFrame>
      <div className="flex flex-col h-full bg-[#050510] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden"></div>

        <div className="relative z-10 px-5 pt-14 pb-2">
          <button
            onClick={() => {
              if (otpStep === 2) {
                setOtpStep(1);
                setOtpCode("");
              } else {
                navigate("/");
              }
            }}
            className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white/80 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative z-10 flex-1 flex flex-col px-7 pt-8 overflow-y-auto hide-scrollbar"
        >
          <h1 className="text-[28px] font-bold tracking-tight text-white leading-tight">
            {otpStep === 2 ? "Check your email" : mode === "signup" ? "Create account" : "Welcome back"}
          </h1>
          <p className="text-[14px] text-white/40 mt-2 mb-10 font-normal">
            {otpStep === 2 ? `We sent a code to ${email}` : mode === "signup" ? "Get started with DesignMatch" : "Sign in to continue"}
          </p>

          <AnimatePresence mode="wait">
            {otpStep === 1 ? (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSendCode}
                className="flex flex-col gap-3.5"
              >
                <AnimatePresence mode="popLayout">
                  {mode === "signup" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-1.5"
                    >
                      <div className={`flex items-center gap-3 bg-white/[0.04] border ${nameError ? 'border-red-500/50' : (nameTouched && isNameValid) ? 'border-blue-500' : 'border-white/[0.06]'} rounded-2xl px-4 py-3.5 transition-colors`}>
                        <User size={18} className={nameError ? "text-red-400" : (nameTouched && isNameValid) ? "text-blue-400" : "text-white/25 shrink-0"} />
                        <input
                          type="text"
                          placeholder="Display name"
                          value={displayName}
                          onChange={(e) => {
                            setDisplayName(e.target.value);
                            if (nameError && e.target.value.trim().length >= 3) setNameError("");
                          }}
                          onBlur={() => setNameTouched(true)}
                          className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/25 outline-none"
                        />
                      </div>
                      {nameError && <span className="text-red-400 text-[12px] pl-2">{nameError}</span>}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-col gap-1.5">
                  <div className={`flex items-center gap-3 bg-white/[0.04] border ${emailError ? 'border-red-500/50' : (emailTouched && isEmailValid) ? 'border-blue-500' : 'border-white/[0.06]'} rounded-2xl px-4 py-3.5 transition-colors`}>
                    <Mail size={18} className={emailError ? "text-red-400" : (emailTouched && isEmailValid) ? "text-blue-400" : "text-white/25 shrink-0"} />
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value)) setEmailError("");
                      }}
                      onBlur={() => setEmailTouched(true)}
                      required
                      className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/25 outline-none"
                    />
                  </div>
                  {emailError && <span className="text-red-400 text-[12px] pl-2">{emailError}</span>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 mt-2 rounded-2xl bg-white text-black text-[15px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-40"
                >
                  {loading ? "Sending code..." : "Send Login Code"}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyCode}
                className="flex flex-col gap-3.5"
              >
                <div className="flex flex-col gap-1.5">
                  <div className={`flex items-center gap-3 bg-white/[0.04] border ${otpError ? 'border-red-500/50' : (otpTouched && otpCode.length === 6) ? 'border-blue-500' : 'border-white/[0.06]'} rounded-2xl px-4 py-3.5 transition-colors`}>
                    <KeyRound size={18} className={otpError ? "text-red-400" : (otpTouched && otpCode.length === 6) ? "text-blue-400" : "text-white/25 shrink-0"} />
                    <input
                      type="text"
                      placeholder="6-digit code"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setOtpCode(val);
                        if (otpError && val.length === 6) setOtpError("");
                      }}
                      onBlur={() => setOtpTouched(true)}
                      required
                      className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/25 outline-none tracking-widest font-mono"
                    />
                  </div>
                  {otpError && <span className="text-red-400 text-[12px] pl-2">{otpError}</span>}
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="w-full py-3.5 mt-2 rounded-2xl bg-white text-black text-[15px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-40"
                >
                  {loading ? "Verifying..." : "Verify & Continue"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-auto pt-8 pb-10 flex justify-center">
            {otpStep === 1 && (
              <button
                onClick={toggleMode}
                className="text-[13px] text-white/30 font-normal"
              >
                {mode === "signup" ? (
                  <>Have an account? <span className="text-white/60 font-medium">Sign in</span></>
                ) : (
                  <>No account? <span className="text-white/60 font-medium">Sign up</span></>
                )}
              </button>
            )}
          </div>
        </motion.div>

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

