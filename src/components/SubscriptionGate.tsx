import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Check, CreditCard, Sparkles, Zap, ShieldCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface SubscriptionGateProps {
  open: boolean;
  onClose: () => void;
}

const SubscriptionGate = ({ open, onClose }: SubscriptionGateProps) => {
  const [showClose, setShowClose] = useState(false);
  const [activated, setActivated] = useState(() => localStorage.getItem("pro_sub") === "true");

  const [view, setView] = useState<"PAYWALL" | "CHECKOUT">("PAYWALL");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal" | "cashapp" | "gcash">("card");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (open) {
      setShowClose(false);
      setView("PAYWALL");
      localStorage.setItem("designMatch_subSeen", "true");
      const timer = setTimeout(() => setShowClose(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleProcessPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      localStorage.setItem("pro_sub", "true");
      setActivated(true);
      setIsProcessing(false);
      toast.success("Welcome to Pro!");
      setTimeout(onClose, 1500);
    }, 2000);
  };

  const features = [
    { icon: <Zap size={18} className="text-yellow-400" />, title: "Unlimited AI Lookups & HD Exports" },
    { icon: <Sparkles size={18} className="text-blue-400" />, title: "Pro Tools: Shadow, Stroke & Fonts" },
    { icon: <Crown size={18} className="text-purple-400" />, title: "Unlock Background Removal & No Watermark" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[100] flex flex-col bg-[#0a0a0a] text-white overflow-hidden font-sans"
        >
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/30 via-[#0a0a0a] to-[#0a0a0a] opacity-60 pointer-events-none" />

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between px-5 pt-12 pb-3">
            <div />
            <AnimatePresence>
              {showClose && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors"
                >
                  <X size={18} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-24 flex flex-col hide-scrollbar">
            {activated ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6"
                >
                  <Crown size={40} className="text-primary" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">You're a Pro!</h2>
                <p className="text-white/60">All premium features are now unlocked.</p>
              </div>
            ) : view === "PAYWALL" ? (
              <div className="flex flex-col flex-1 pb-10">
                <div className="flex-1 flex flex-col justify-center gap-8">
                  <div className="text-center space-y-2 relative">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/20 blur-3xl rounded-full"
                    />
                    <h1 className="text-4xl font-extrabold tracking-tight relative">
                      DesignMatch <span className="text-primary">PRO</span>
                    </h1>
                    <p className="text-white/60 text-sm">Turbocharge your product sourcing.</p>
                  </div>

                  <div className="space-y-6 bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
                    {features.map((f, i) => (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.15 }}
                        key={f.title}
                        className="flex items-center gap-4"
                      >
                        <div className="p-2 rounded-xl bg-white/10 shadow-inner">
                          {f.icon}
                        </div>
                        <span className="font-medium text-white/90">{f.title}</span>
                      </motion.div>
                    ))}
                  </div>

                  <div className="text-center pt-4">
                    <div className="flex items-baseline justify-center gap-1 mb-1">
                      <span className="text-4xl font-black">$9.99</span>
                      <span className="text-white/50 font-medium">/mo</span>
                    </div>
                    <p className="text-xs text-white/40">Cancel anytime. No lock-in.</p>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setView("CHECKOUT")}
                  className="w-full py-4 mt-8 rounded-2xl bg-primary text-primary-foreground text-lg font-bold shadow-[0_0_40px_rgba(var(--primary),0.4)] flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight size={20} />
                </motion.button>
              </div>
            ) : (
              <div className="flex flex-col flex-1">
                <button onClick={() => setView("PAYWALL")} className="text-white/50 text-sm mb-6 flex items-center gap-1 w-fit">
                  <ArrowRight size={14} className="rotate-180" /> Back
                </button>

                <h2 className="text-2xl font-bold mb-6">Select Payment</h2>

                <div className="space-y-3 mb-8">
                  {[
                    { id: "card", title: "Credit / Debit Card", icon: <CreditCard size={20} /> },
                    { id: "paypal", title: "PayPal", icon: <span className="font-bold text-[#00457C]">P</span> },
                    { id: "cashapp", title: "Cash App Pay", icon: <span className="font-bold text-[#00D632]">$</span> },
                    { id: "gcash", title: "GCash", icon: <span className="font-bold text-[#007DFE]">G</span> },
                  ].map((method) => (
                    <div
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${paymentMethod === method.id ? "border-primary bg-primary/10" : "border-white/10 bg-white/5"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white ${paymentMethod === method.id ? "text-primary" : "text-black"}`}>
                          {method.icon}
                        </div>
                        <span className="font-medium">{method.title}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === method.id ? "border-primary" : "border-white/30"}`}>
                        {paymentMethod === method.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                    </div>
                  ))}
                </div>

                {paymentMethod === "card" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4 mb-8">
                    <input type="text" placeholder="Card Number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-primary transition-colors" />
                    <div className="flex gap-4">
                      <input type="text" placeholder="MM/YY" className="w-1/2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-primary transition-colors" />
                      <input type="text" placeholder="CVC" className="w-1/2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-primary transition-colors" />
                    </div>
                  </motion.div>
                )}

                <div className="mt-auto">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-white/40 mb-4">
                    <ShieldCheck size={14} /> Secured by Stripe
                  </div>
                  <button
                    onClick={handleProcessPayment}
                    disabled={isProcessing}
                    className="w-full py-4 rounded-2xl bg-white text-black text-lg font-bold active:scale-[0.98] transition-transform flex items-center justify-center"
                  >
                    {isProcessing ? (
                      <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                      `Pay $9.99`
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SubscriptionGate;
