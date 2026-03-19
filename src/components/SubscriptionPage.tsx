import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Check, CreditCard } from "lucide-react";
import { useState } from "react";

interface SubscriptionPageProps {
  open: boolean;
  onClose: () => void;
}

const SubscriptionPage = ({ open, onClose }: SubscriptionPageProps) => {
  const [activated, setActivated] = useState(() => localStorage.getItem("pro_sub") === "true");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");

  const handleActivate = () => {
    localStorage.setItem("pro_sub", "true");
    setActivated(true);
  };

  const features = [
    "Unlimited product lookups",
    "Export designs in HD (PNG/SVG)",
    "Advanced Font, Stroke & Shadow tools",
    "Remove watermarks",
    "Access to specialized global suppliers",
    "Priority support",
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="absolute inset-0 z-[100] bg-background flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-10 pb-3 border-b border-border">
            <h1 className="text-base font-semibold text-foreground">Go Pro</h1>
            <button onClick={onClose} className="p-1.5 rounded-lg bg-secondary text-muted-foreground">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-6">
            {/* Plan card */}
            <div className="bg-secondary rounded-2xl p-5 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Crown size={20} className="text-primary" />
                <span className="text-sm font-semibold text-foreground">Pro Plan</span>
              </div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-foreground">$9</span>
                <span className="text-sm text-muted-foreground">/ month</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {features.map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <Check size={14} className="text-primary" />
                    <span className="text-xs text-foreground">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {activated ? (
              <div className="bg-primary/10 rounded-xl p-4 text-center">
                <Crown size={24} className="text-primary mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground">You're a Pro member!</p>
                <p className="text-xs text-muted-foreground mt-1">All features are unlocked</p>
              </div>
            ) : (
              <>
                {/* Checkout form */}
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-medium text-muted-foreground">Card Number</label>
                  <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2.5 border border-border">
                    <CreditCard size={16} className="text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                      maxLength={19}
                    />
                  </div>

                  <label className="text-xs font-medium text-muted-foreground">Cardholder Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="bg-secondary rounded-lg px-3 py-2.5 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  />
                </div>

                <button
                  onClick={handleActivate}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold active:scale-[0.98] transition-transform"
                >
                  Activate Subscription
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SubscriptionPage;
