import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, Lock, User, Crown, Check, Eye, EyeOff, ShieldCheck } from "lucide-react";

import PhoneFrame from "@/components/PhoneFrame";
import { signUpWithEmail, signInWithPassword, sendEmailOtp, verifyEmailOtp, resetPasswordForEmail, updateUserPassword, resendSignupOtp } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import { isProUser, getCurrentPlan } from "@/services/proService";
import PaymentModal from "@/components/PaymentModal";

// Helper for reliable auth flow tracking
const setAuthProgress = (val: boolean) => sessionStorage.setItem("authFlowInProgress", val ? "true" : "false");

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : searchParams.get("mode") === "forgot_password" ? "forgot_password" : "login";
  const [mode, setMode] = useState<"login" | "signup" | "forgot_password">(initialMode as any);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newConfirmPassword, setNewConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPostAuthModal, setShowPostAuthModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [nameError, setNameError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [otpTouched, setOtpTouched] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startResendCooldown = () => {
    setResendCooldown(60);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
      setAuthProgress(false); // Reset on unmount
    };
  }, []);

  const navigate = useNavigate();
  const returnTo = searchParams.get("returnTo") || "/studio";

  const isNameValid = displayName.trim().length >= 3;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 6;
  const isConfirmValid = confirmPassword === password && password.length >= 6;
  const isNewPasswordValid = newPassword.length >= 6;
  const isNewConfirmValid = newConfirmPassword === newPassword && newPassword.length >= 6;

  useEffect(() => {
    if (mode === "signup" && nameTouched) {
      if (!isNameValid) setNameError("Name must be at least 3 characters");
      else setNameError("");
    } else if (mode !== "signup") setNameError("");
  }, [displayName, mode, nameTouched, isNameValid]);

  useEffect(() => {
    if (emailTouched) {
      if (!isEmailValid && email.length > 0) setEmailError("Please enter a valid email address");
      else setEmailError("");
    }
  }, [email, emailTouched, isEmailValid]);

  useEffect(() => {
    if (step === 1 && passwordTouched) {
      if (!isPasswordValid && password.length > 0) setPasswordError("Password must be at least 6 characters");
      else setPasswordError("");
    } else if (step === 3 && passwordTouched) {
      if (!isNewPasswordValid && newPassword.length > 0) setPasswordError("Password must be at least 6 characters");
      else setPasswordError("");
    }
  }, [password, newPassword, passwordTouched, step, isPasswordValid, isNewPasswordValid]);

  useEffect(() => {
    if (mode === "signup" && confirmTouched) {
      if (!isConfirmValid && confirmPassword.length > 0) setConfirmPasswordError("Passwords do not match");
      else setConfirmPasswordError("");
    } else if (mode === "forgot_password" && step === 3 && confirmTouched) {
      if (!isNewConfirmValid && newConfirmPassword.length > 0) setConfirmPasswordError("Passwords do not match");
      else setConfirmPasswordError("");
    } else {
      setConfirmPasswordError("");
    }
  }, [confirmPassword, password, newConfirmPassword, newPassword, mode, step, confirmTouched, isConfirmValid, isNewConfirmValid]);

  useEffect(() => {
    if (otpTouched) {
      if (otpCode.length !== 6 && otpCode.length > 0) setOtpError("Code must be 6 characters");
      else setOtpError("");
    }
  }, [otpCode, otpTouched]);

  const validate = () => {
    setNameTouched(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    if (mode === "signup" || (mode === "forgot_password" && step === 3)) setConfirmTouched(true);

    let isValid = true;
    if (mode === "signup" && !isNameValid) { setNameError("Name must be at least 3 characters"); isValid = false; }
    if (step === 1) {
      if (!isEmailValid) { setEmailError("Please enter a valid email address"); isValid = false; }
      if (mode !== "forgot_password" && !isPasswordValid) { setPasswordError("Password must be at least 6 characters"); isValid = false; }
      if (mode === "signup" && !isConfirmValid) { setConfirmPasswordError("Passwords do not match"); isValid = false; }
    } else if (mode === "forgot_password" && step === 3) {
      if (!isNewPasswordValid) { setPasswordError("Password must be at least 6 characters"); isValid = false; }
      if (!isNewConfirmValid) { setConfirmPasswordError("Passwords do not match"); isValid = false; }
    }
    return isValid;
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "bg-transparent", width: "0%" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    const finalScore = Math.min(5, score);
    if (finalScore < 3) return { score: finalScore, label: "Weak", color: "bg-red-500", width: "33%" };
    if (finalScore < 5) return { score: finalScore, label: "Medium", color: "bg-yellow-500", width: "66%" };
    return { score: finalScore, label: "Strong", color: "bg-green-500", width: "100%" };
  };

  const currentStrength = getPasswordStrength(mode === "forgot_password" ? newPassword : password);

  const handleMainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setStatusMessage(null);
    try {
      if (mode === "signup") {
        setAuthProgress(true);
        const { session, user: signedUpUser } = await signUpWithEmail({ email, password, displayName });
        if (signedUpUser?.identities && signedUpUser.identities.length === 0) {
          throw new Error("User already registered");
        }
        // Always sign out since the user is not fully verified yet
        if (session) {
          await supabase.auth.signOut();
        }
        // Supabase built-in signUp already sends the Confirmation Email OTP. 
        // We do NOT need to call sendEmailOtp() here, as that triggers the 60s security cooldown!

        setStep(2);
        startResendCooldown();
        setStatusMessage({ text: "Verification code sent to your email!", type: "success" });
      } else if (mode === "login") {
        setAuthProgress(true);
        await signInWithPassword({ email, password });
        await supabase.auth.signOut();
        try {
          await sendEmailOtp(email, undefined);
        } catch (otpErr: any) {
          if (otpErr.status === 429 || /rate limit/i.test(otpErr.message) || /seconds/i.test(otpErr.message)) {
            console.log("OTP rate limit hit, proceeding to step 2 since code was likely sent recently.");
          } else {
            throw otpErr;
          }
        }
        setStep(2);
        startResendCooldown();
        setStatusMessage({ text: "Login code sent to your email!", type: "success" });
      } else if (mode === "forgot_password") {
        setAuthProgress(true);
        // First verify the email actually exists by trying a dummy sign-in
        try {
          await signInWithPassword({ email, password: "__check_exists__" });
        } catch (checkErr: any) {
          // "Invalid login credentials" means the email exists but the password was wrong — that's fine
          if (!/invalid login credentials/i.test(checkErr?.message || "")) {
            // Any other error (like user not found) means the account doesn't exist
            setStatusMessage({ text: "No account found with this email address.", type: "error" });
            setLoading(false);
            return;
          }
        }
        await resetPasswordForEmail(email);
        setStep(2);
        startResendCooldown();
        setStatusMessage({ text: "Verification code sent to your email!", type: "success" });
      }
    } catch (err: any) {
      if (mode === "signup" && /already registered|already exists/i.test(err?.message || "")) {
        setMode("login");
        setStatusMessage({ text: "Looks like you already have an account. Try signing in.", type: "info" });
      } else if (/email not confirmed/i.test(err?.message || "")) {
        try {
          await sendEmailOtp(email, undefined);
          setStep(2);
          startResendCooldown();
          setStatusMessage({ text: "Please verify your email first. New code sent!", type: "success" });
        } catch (otpErr: any) {
          setStatusMessage({ text: otpErr?.message || "Could not send verification code.", type: "error" });
        }
      } else if (/invalid login credentials/i.test(err?.message || "")) {
        setStatusMessage({ text: "Wrong email or password. Please try again.", type: "error" });
      } else if (/Error sending confirmation email/i.test(err?.message || "") || /rate limit/i.test(err?.message || "")) {
        setStatusMessage({ text: "Supabase email limit reached. Please configure SMTP or disable 'Confirm Email' in Supabase Auth settings.", type: "error" });
      } else {
        setStatusMessage({ text: err.message || "Something went wrong. Please try again.", type: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpTouched(true);

    if (otpCode.length !== 6) {
      setOtpError("Code must be 6 characters");
      return;
    }

    setLoading(true);
    try {
      if (mode === "forgot_password") {
        setAuthProgress(true);
        await verifyEmailOtp(email, otpCode, undefined, 'recovery');
        // Keep the session alive — we need it for updateUserPassword
        // setAuthProgress prevents PublicRoute from redirecting
        setStep(3);
        setStatusMessage({ text: "Code verified! Set your new password below.", type: "success" });
      } else {
        setAuthProgress(true);
        await verifyEmailOtp(email, otpCode, mode === "signup" ? displayName : undefined, mode === "signup" ? 'signup' : 'email');
        setAuthMode(mode);
        setIsSuccess(true);
        setTimeout(() => {
          setShowPostAuthModal(true);
        }, 800);
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Invalid code. Please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await updateUserPassword(newPassword);
      setAuthMode("login");
      setIsSuccess(true);
      setStatusMessage({ text: "Password updated successfully!", type: "success" });
      setTimeout(() => {
        setShowPostAuthModal(true);
      }, 800);
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Could not update password.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handlePostAuthContinue = () => {
    setAuthProgress(false);
    setShowPostAuthModal(false);
    navigate(decodeURIComponent(returnTo), { replace: true });
  };

  const handlePaymentSuccess = () => {
    setAuthProgress(false);
    setShowPaymentModal(false);
    setShowPostAuthModal(false);
    navigate(decodeURIComponent(returnTo), { replace: true });
  };

  const toggleMode = (newMode: "login" | "signup" | "forgot_password") => {
    setMode(newMode);
    setStatusMessage(null);
    setEmailError("");
    setPasswordError("");
    setNameError("");
    setConfirmPasswordError("");
    setOtpError("");
    if (newMode !== mode) {
      setPassword("");
      setStep(1);
      setOtpCode("");
      setNameTouched(false);
      setEmailTouched(false);
      setPasswordTouched(false);
      setConfirmTouched(false);
      setOtpTouched(false);
    }
  };

  const renderPasswordStrength = () => {
    if (!currentStrength.score || (mode === "login") || (mode === "forgot_password" && step !== 3)) return null;
    return (
      <div className="flex flex-col gap-1.5 mt-1 px-1">
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-white/50">Password strength</span>
          <span className={`text-[12px] font-medium ${currentStrength.color.replace('bg-', 'text-')}`}>
            {currentStrength.label}
          </span>
        </div>
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: currentStrength.width }}
            className={`h-full ${currentStrength.color} transition-all duration-300`}
          />
        </div>
      </div>
    );
  };

  return (
    <PhoneFrame>
      <div className="flex flex-col h-full bg-black relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden"></div>

        <div className="relative z-10 px-5 pt-14 pb-2">
          <button
            onClick={() => {
              if (step > 1) {
                setStep(1);
                setOtpCode("");
              } else if (mode === "forgot_password") {
                toggleMode("login");
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
          className="relative z-10 flex-1 flex flex-col px-7 pt-4 overflow-y-auto hide-scrollbar"
        >
          <h1 className="text-[28px] font-bold tracking-tight text-white leading-tight">
            {step === 2 ? "Check your email" : step === 3 ? "Create new password" : mode === "signup" ? "Create account" : mode === "forgot_password" ? "Reset password" : "Welcome back"}
          </h1>
          <p className="text-[14px] text-white/40 mt-2 mb-4 font-normal">
            {step === 2 ? `We sent a code to ${email}` : step === 3 ? "Enter a strong new password" : mode === "signup" ? "Get started with DesignMatch" : mode === "forgot_password" ? "Enter your email to receive a reset code" : "Sign in to continue"}
          </p>

          <AnimatePresence>
            {statusMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.25 }}
                className={`rounded-xl px-4 py-3 text-[13px] font-medium border ${statusMessage.type === "success" ? "bg-green-500/10 border-green-500/20 text-green-400"
                  : statusMessage.type === "error" ? "bg-red-500/10 border-red-500/20 text-red-400"
                    : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                  }`}
              >
                {statusMessage.text}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleMainSubmit}
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
                      <div className={`flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.05] border ${nameError ? 'border-red-500/50' : (displayName.length > 0 && isNameValid) ? 'border-blue-500/50' : 'border-white/[0.08]'} rounded-2xl px-4 py-4 transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 backdrop-blur-md`}>
                        <User size={18} className={nameError ? "text-red-400" : (displayName.length > 0 && isNameValid) ? "text-blue-400" : "text-white/25 shrink-0"} />
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
                  <div className={`flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.05] border ${emailError ? 'border-red-500/50' : (email.length > 0 && isEmailValid) ? 'border-blue-500/50' : 'border-white/[0.08]'} rounded-2xl px-4 py-4 transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 backdrop-blur-md`}>
                    <Mail size={18} className={emailError ? "text-red-400" : (email.length > 0 && isEmailValid) ? "text-blue-400" : "text-white/25 shrink-0"} />
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

                <AnimatePresence>
                  {mode !== "forgot_password" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-1.5"
                    >
                      <div className={`flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.05] border ${passwordError ? 'border-red-500/50' : (password.length > 0 && isPasswordValid) ? 'border-blue-500/50' : 'border-white/[0.08]'} rounded-2xl px-4 py-4 transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 backdrop-blur-md relative`}>
                        <Lock size={18} className={passwordError ? "text-red-400" : (password.length > 0 && isPasswordValid) ? "text-blue-400" : "text-white/25 shrink-0"} />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (passwordError && e.target.value.length >= 6) setPasswordError("");
                          }}
                          onBlur={() => setPasswordTouched(true)}
                          required={mode !== "forgot_password"}
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
                    </motion.div>
                  )}
                </AnimatePresence>

                {renderPasswordStrength()}

                <AnimatePresence>
                  {mode === "signup" && password.length >= 6 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: "auto", opacity: 1, marginTop: 4 }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-1.5"
                    >
                      <div className={`flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.05] border ${confirmPasswordError ? 'border-red-500/50' : (confirmPassword.length > 0 && isConfirmValid) ? 'border-blue-500/50' : 'border-white/[0.08]'} rounded-2xl px-4 py-4 transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 backdrop-blur-md relative`}>
                        <ShieldCheck size={18} className={confirmPasswordError ? "text-red-400" : (confirmPassword.length > 0 && isConfirmValid) ? "text-blue-400" : "text-white/25 shrink-0"} />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Confirm Password"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (confirmPasswordError && e.target.value === password) setConfirmPasswordError("");
                          }}
                          onBlur={() => setConfirmTouched(true)}
                          required={mode === "signup"}
                          minLength={6}
                          className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/25 outline-none pr-8"
                        />
                      </div>
                      {confirmPasswordError && <span className="text-red-400 text-[12px] pl-2">{confirmPasswordError}</span>}
                    </motion.div>
                  )}
                </AnimatePresence>

                {mode === "login" && (
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

                    <button type="button" onClick={() => toggleMode("forgot_password")} className="text-[12px] text-white/40 hover:text-white/80 transition-colors">
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 mt-2 rounded-2xl bg-white text-black text-[15px] font-bold shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.25)] active:scale-[0.98] transition-all disabled:opacity-40 disabled:shadow-none"
                >
                  {loading ? "Please wait..." : mode === "signup" ? "Sign up" : mode === "forgot_password" ? "Send Reset Code" : "Sign in"}
                </button>
              </motion.form>
            ) : step === 2 ? (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyCode}
                className="flex flex-col gap-6 pt-2"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="relative flex justify-center gap-1.5 w-full max-w-sm mx-auto px-1">
                    <input
                      id="otp-input"
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6);
                        setOtpCode(val);
                        if (otpError && val.length === 6) setOtpError("");
                      }}
                      onBlur={() => setOtpTouched(true)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10"
                      autoFocus
                    />
                    {[...Array(6)].map((_, i) => {
                      const char = otpCode[i] || "";
                      const isActive = otpCode.length === i && !isSuccess;
                      const isFilled = otpCode.length > i;
                      return (
                        <motion.div
                          key={i}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: isFilled ? 1.05 : 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          className={`
                            w-[34px] h-[48px] sm:w-[38px] sm:h-[54px] flex items-center justify-center text-lg sm:text-xl font-bold rounded-xl transition-all duration-300
                            ${isSuccess ? "bg-green-500 border-green-400 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] scale-[1.05] z-20"
                              : otpError ? "bg-red-500/10 border-red-500/50 text-red-500"
                                : isActive ? "bg-blue-500/15 border-blue-400 text-blue-300 scale-[1.08] shadow-[0_0_20px_rgba(59,130,246,0.3)] z-20"
                                  : isFilled ? "bg-white/[0.08] border-white/30 text-white shadow-sm"
                                    : "bg-white/[0.03] border-white/[0.08] text-white/30"}
                            border relative overflow-hidden backdrop-blur-md
                          `}
                        >
                          {isActive && (
                            <motion.div
                              animate={{ opacity: [1, 0, 1] }}
                              transition={{ repeat: Infinity, duration: 1 }}
                              className="w-[1.5px] h-5 bg-blue-400 absolute rounded-full"
                            />
                          )}
                          <motion.span
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: char ? 1 : 0.5, opacity: char ? 1 : 0 }}
                            className="relative z-10 font-mono"
                          >
                            {char}
                          </motion.span>
                        </motion.div>
                      );
                    })}
                  </div>
                  <AnimatePresence>
                    {otpError && (
                      <motion.span
                        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                        className="text-red-400 text-[13px] mt-2 font-medium"
                      >
                        {otpError}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || otpCode.length !== 6 || isSuccess}
                    className="w-full py-4 mt-2 rounded-2xl bg-white text-black text-[15px] font-bold shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.25)] active:scale-[0.98] transition-all disabled:opacity-40 disabled:shadow-none"
                  >
                    {loading ? "Verifying..." : "Verify Code"}
                  </button>
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      disabled={resendCooldown > 0}
                      onClick={async () => {
                        if (resendCooldown > 0) return;
                        startResendCooldown();
                        try {
                          if (mode === "forgot_password") {
                            await resetPasswordForEmail(email);
                          } else if (mode === "signup") {
                            await resendSignupOtp(email);
                          } else {
                            await sendEmailOtp(email, undefined);
                          }
                          setStatusMessage({ text: "Code resent to your email!", type: "success" });
                        } catch (err: any) {
                          setStatusMessage({ text: "Could not resend code. " + err.message, type: "error" });
                        }
                      }}
                      className={`text-[13px] transition-colors ${resendCooldown > 0 ? 'text-white/20 cursor-not-allowed' : 'text-white/40 hover:text-white/80'}`}
                    >
                      {resendCooldown > 0
                        ? `Resend code in ${resendCooldown}s`
                        : <>Didn't receive the code? <span className="text-blue-400">Resend</span></>}
                    </button>
                  </div>
                </div>
              </motion.form>
            ) : (
              <motion.form
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleUpdatePassword}
                className="flex flex-col gap-3.5 pt-2"
              >
                <div className="flex flex-col gap-1.5">
                  <div className={`flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.05] border ${passwordError ? 'border-red-500/50' : (newPassword.length > 0 && isNewPasswordValid) ? 'border-blue-500/50' : 'border-white/[0.08]'} rounded-2xl px-4 py-4 transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 backdrop-blur-md relative`}>
                    <Lock size={18} className={passwordError ? "text-red-400" : (newPassword.length > 0 && isNewPasswordValid) ? "text-blue-400" : "text-white/25 shrink-0"} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (passwordError && e.target.value.length >= 6) setPasswordError("");
                      }}
                      onBlur={() => setPasswordTouched(true)}
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

                {renderPasswordStrength()}

                <AnimatePresence>
                  {newPassword.length >= 6 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: "auto", opacity: 1, marginTop: 4 }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-1.5"
                    >
                      <div className={`flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.05] border ${confirmPasswordError ? 'border-red-500/50' : (newConfirmPassword.length > 0 && isNewConfirmValid) ? 'border-blue-500/50' : 'border-white/[0.08]'} rounded-2xl px-4 py-4 transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 backdrop-blur-md relative`}>
                        <ShieldCheck size={18} className={confirmPasswordError ? "text-red-400" : (newConfirmPassword.length > 0 && isNewConfirmValid) ? "text-blue-400" : "text-white/25 shrink-0"} />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Confirm New Password"
                          value={newConfirmPassword}
                          onChange={(e) => {
                            setNewConfirmPassword(e.target.value);
                            if (confirmPasswordError && e.target.value === newPassword) setConfirmPasswordError("");
                          }}
                          onBlur={() => setConfirmTouched(true)}
                          required
                          minLength={6}
                          className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/25 outline-none pr-8"
                        />
                      </div>
                      {confirmPasswordError && <span className="text-red-400 text-[12px] pl-2">{confirmPasswordError}</span>}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 mt-4 rounded-2xl bg-white text-black text-[15px] font-bold shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.25)] active:scale-[0.98] transition-all disabled:opacity-40 disabled:shadow-none"
                >
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-auto pt-8 pb-10 flex justify-center">
            {step === 1 && (
              <button
                onClick={() => toggleMode(mode === "signup" ? "login" : "signup")}
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
                          {getCurrentPlan() === "yearly" ? "Yearly" : "Monthly"}
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
