import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Palette, Type as TypeIcon, Layers, Download, Image, Zap } from "lucide-react";
import { isProUser } from "../services/proService";

interface SubscriptionGateProps {
  open: boolean;
  onClose: () => void;
}

const SubscriptionGate = ({ open, onClose }: SubscriptionGateProps) => {
  const [showClose, setShowClose] = useState(false);
  const [activated, setActivated] = useState(() => isProUser());
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (open) {
      setShowClose(false);
      const timer = setTimeout(() => setShowClose(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleProcessPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      // This is legacy — PaymentModal handles real activation
      setActivated(true);
      setIsProcessing(false);
      setTimeout(onClose, 1500);
    }, 1500);
  };

  const features = [
    { icon: <Palette size={16} className="text-primary" />, title: "Premium Font Collection" },
    { icon: <TypeIcon size={16} className="text-primary" />, title: "Premium Fonts" },
    { icon: <Layers size={16} className="text-primary" />, title: "Layer Ordering" },
    { icon: <Download size={16} className="text-primary" />, title: "High-Res Export without Watermarks" },
    { icon: <Zap size={16} className="text-primary" />, title: "Unlimited Lookups" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
          className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/80">

          <div className="w-full bg-black border border-[#222] rounded-2xl relative overflow-hidden flex flex-col max-h-full">
            {/* Header */}
            <div className="flex items-center justify-end p-4 pb-0 shrink-0 h-14">
              <AnimatePresence>
                {showClose && (
                  <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onClose} className="p-1.5 rounded-lg bg-[#222] text-[#888] hover:text-white transition-colors cursor-pointer z-10">
                    <X size={16} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6 hide-scrollbar flex flex-col">
              {activated ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                    <Crown size={32} className="text-primary" />
                  </div>
                  <h2 className="text-xl font-bold mb-2 text-white">You're a Pro!</h2>
                  <p className="text-[#888] text-sm">All premium features are now unlocked.</p>
                </div>
              ) : (
                <div className="flex flex-col flex-1 pb-2">
                  <div className="flex-1 flex flex-col gap-6">
                    {/* Title */}
                    <div className="text-center space-y-1">
                      <h1 className="text-2xl font-bold text-white">
                        DesignMatch <span className="text-primary">PRO</span>
                      </h1>
                      <p className="text-[#888] text-sm">Unlock all pro design tools.</p>
                    </div>

                    {/* Features */}
                    <div className="space-y-0 relative border border-[#222] rounded-xl overflow-hidden bg-black">
                      {features.map((f, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 border-b border-[#222] last:border-b-0">
                          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shrink-0">
                            {f.icon}
                          </div>
                          <span className="text-sm font-medium text-white">{f.title}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col gap-3">
                      {/* Yearly Plan */}
                      <button className="flex items-center justify-between p-3 rounded-xl border-2 border-primary bg-primary/5 text-left relative overflow-hidden group active:scale-95 transition-all">
                        <div className="absolute top-0 right-0 bg-primary text-[10px] font-bold px-2 py-0.5 text-white rounded-bl-lg">
                          🔥 Best Value · Save ₱3,400
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">Yearly</p>
                          <p className="text-xs text-[#888]">₱2,600 / year</p>
                        </div>
                        <div className="w-5 h-5 rounded-full border-4 border-primary bg-[#111]" />
                      </button>

                      {/* Monthly Plan */}
                      <button className="flex items-center justify-between p-3 rounded-xl border border-[#333] bg-black text-left hover:border-[#444] transition-colors active:scale-95">
                        <div>
                          <p className="font-bold text-white text-sm">Monthly</p>
                          <p className="text-xs text-[#888]">₱500 / month</p>
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 border-[#444] bg-[#111]" />
                      </button>
                    </div>

                    <p className="text-[10px] text-center text-[#555] px-4 font-medium uppercase tracking-widest mt-2">
                      Cancel anytime. Checkmarks below:
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer fixed */}
            {!activated && (
              <div className="p-6 pt-4 bg-black border-t border-[#222] shrink-0">
                <button
                  disabled={isProcessing}
                  onClick={handleProcessPayment}
                  className="w-full py-3.5 bg-primary text-white font-bold rounded-xl disabled:opacity-50 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                >
                  {isProcessing ? "Processing..." : "Upgrade to Pro"}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SubscriptionGate;
