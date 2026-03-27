import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Check, Lock, Zap } from "lucide-react";
import { toast } from "sonner";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentModal = ({ open, onClose, onSuccess }: PaymentModalProps) => {
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  const [method, setMethod] = useState<"gcash" | "paypal" | "card" | null>(null);
  const [processing, setProcessing] = useState(false);
  const [form, setForm] = useState({ phone: "", email: "", card: "", exp: "", cvc: "", name: "" });

  const pricing = {
    monthly: { amount: "₱500", sub: "/mo", alt: "$8.80 USD" },
    yearly: { amount: "₱1,500", sub: "/yr", alt: "$26.50 USD", badge: "Save 75%" }
  };

  const handleCheckout = () => {
    if (!method) return toast.error("Pick a payment method");
    setProcessing(true);
    setTimeout(() => {
      const exp = new Date();
      exp.setMonth(exp.getMonth() + (plan === "monthly" ? 1 : 12));
      localStorage.setItem("pro_sub", "true");
      localStorage.setItem("pro_sub_expiry", exp.toISOString());
      localStorage.setItem("designMatch_plan", plan);
      setProcessing(false);
      toast.success("You're Pro now! Refreshing...");
      // Refresh the page after a brief delay so the toast is visible
      setTimeout(() => {
        window.location.reload();
      }, 800);
    }, 1800);
  };

  const u = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-[999] flex items-end justify-center">
          {/* Dimmed backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="relative z-10 w-full max-h-[92%] bg-black rounded-t-[2rem] overflow-hidden flex flex-col"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-[3px] rounded-full bg-white/15" />
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 pb-8 hide-scrollbar">

              {/* Close + Title */}
              <div className="flex items-center justify-between py-3">
                <h2 className="text-[17px] font-bold text-white tracking-tight">Go Pro</h2>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-white/50 hover:text-white transition-colors">
                  <X size={15} />
                </button>
              </div>

              {/* Plan selector */}
              <div className="flex gap-2 mt-2">
                {(["monthly", "yearly"] as const).map(p => {
                  const d = pricing[p];
                  const active = plan === p;
                  return (
                    <button
                      key={p}
                      onClick={() => setPlan(p)}
                      className={`flex-1 relative rounded-2xl p-4 border transition-all duration-200 ${active
                        ? "border-blue-500/40 bg-blue-500/[0.06]"
                        : "border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04]"
                        }`}
                    >
                      {d.badge && (
                        <span className="absolute -top-2.5 right-3 text-[9px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">{d.badge}</span>
                      )}
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center transition-all ${active ? "border-blue-400 bg-blue-400" : "border-white/20"
                          }`}>
                          {active && <Check size={10} className="text-black" />}
                        </div>
                        <span className="text-[11px] font-medium text-white/40 capitalize">{p}</span>
                      </div>
                      <div className="flex items-baseline gap-0.5 mt-1">
                        <span className="text-xl font-bold text-white">{d.amount}</span>
                        <span className="text-[11px] text-white/30">{d.sub}</span>
                      </div>
                      <p className="text-[10px] text-white/25 mt-1">{d.alt}</p>
                    </button>
                  );
                })}
              </div>

              {/* Features */}
              <div className="mt-5 mb-6">
                {["Unlimited design lookups per week", "Search across 24 global marketplaces", "Export studio designs in high-res", "Advanced text, stroke & shadow tools", "Direct supplier contact links"].map(f => (
                  <div key={f} className="flex items-center gap-2.5 py-[6px]">
                    <Check size={13} className="text-blue-400 shrink-0" />
                    <span className="text-[12px] text-white/50">{f}</span>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="h-px bg-white/[0.04] mb-5" />

              {/* Payment methods */}
              <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-3">Pay with</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {([
                  { id: "gcash", label: "GCash", color: "#0052E0" },
                  { id: "paypal", label: "PayPal", color: "#003087" },
                  { id: "card", label: "Card", color: "#1C1C1E" },
                ] as const).map(m => {
                  const active = method === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`rounded-xl py-3 border text-center transition-all duration-200 ${active
                        ? "border-blue-500/40 bg-blue-500/[0.06]"
                        : "border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04]"
                        }`}
                    >
                      <div
                        className="w-8 h-5 rounded mx-auto mb-1.5 flex items-center justify-center"
                        style={{ backgroundColor: m.color }}
                      >
                        {m.id === "card" ? (
                          <>
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 -mr-1 relative z-[1]" />
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                          </>
                        ) : (
                          <span className="text-white text-[7px] font-black">{m.label}</span>
                        )}
                      </div>
                      <span className={`text-[11px] font-semibold ${active ? "text-white" : "text-white/40"}`}>{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Payment form */}
              <AnimatePresence mode="wait">
                {method && (
                  <motion.div
                    key={method}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mb-4"
                  >
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 space-y-3">
                      {method === "gcash" && (
                        <>
                          <div>
                            <label className="text-[10px] font-medium text-white/25 uppercase tracking-wider block mb-1.5">GCash Number</label>
                            <input type="tel" placeholder="09XXXXXXXXX" value={form.phone} onChange={e => u("phone", e.target.value)}
                              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-[14px] text-white placeholder:text-white/20 outline-none focus:border-blue-500/30 transition-colors" />
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-white/25 uppercase tracking-wider block mb-1.5">Email for receipt</label>
                            <input type="email" placeholder="you@email.com" value={form.email} onChange={e => u("email", e.target.value)}
                              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-[14px] text-white placeholder:text-white/20 outline-none focus:border-blue-500/30 transition-colors" />
                          </div>
                        </>
                      )}
                      {method === "paypal" && (
                        <>
                          <div className="flex items-center gap-2 text-[11px] text-blue-400/80 font-medium">
                            <Zap size={12} /> Redirects to PayPal checkout
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-white/25 uppercase tracking-wider block mb-1.5">PayPal Email</label>
                            <input type="email" placeholder="you@paypal.com" value={form.email} onChange={e => u("email", e.target.value)}
                              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-[14px] text-white placeholder:text-white/20 outline-none focus:border-blue-500/30 transition-colors" />
                          </div>
                        </>
                      )}
                      {method === "card" && (
                        <>
                          <div>
                            <label className="text-[10px] font-medium text-white/25 uppercase tracking-wider block mb-1.5">Card number</label>
                            <input type="text" placeholder="1234 5678 9012 3456" value={form.card} onChange={e => u("card", e.target.value)} maxLength={19}
                              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-[14px] text-white tracking-wider placeholder:text-white/20 outline-none focus:border-blue-500/30 transition-colors font-mono" />
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="text-[10px] font-medium text-white/25 uppercase tracking-wider block mb-1.5">Expiry</label>
                              <input type="text" placeholder="MM/YY" value={form.exp} onChange={e => u("exp", e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-[14px] text-white placeholder:text-white/20 outline-none focus:border-blue-500/30 transition-colors" />
                            </div>
                            <div className="flex-1">
                              <label className="text-[10px] font-medium text-white/25 uppercase tracking-wider block mb-1.5">CVC</label>
                              <input type="text" placeholder="123" value={form.cvc} onChange={e => u("cvc", e.target.value)} maxLength={4}
                                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-[14px] text-white placeholder:text-white/20 outline-none focus:border-blue-500/30 transition-colors" />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-white/25 uppercase tracking-wider block mb-1.5">Name on card</label>
                            <input type="text" placeholder="John Doe" value={form.name} onChange={e => u("name", e.target.value)}
                              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-[14px] text-white placeholder:text-white/20 outline-none focus:border-blue-500/30 transition-colors" />
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Checkout button */}
              <button
                onClick={handleCheckout}
                disabled={!method || processing}
                className="w-full py-3.5 rounded-2xl bg-white text-black text-[14px] font-semibold active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <span className="text-black/60">Processing...</span>
                ) : (
                  <>
                    <Lock size={13} />
                    Pay {pricing[plan].amount}
                  </>
                )}
              </button>

              <p className="text-center text-[10px] text-white/20 mt-3 leading-relaxed">
                Secure checkout · Cancel anytime
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;
