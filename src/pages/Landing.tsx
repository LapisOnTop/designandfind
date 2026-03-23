import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Upload, PencilRuler, X, Home, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PhoneFrame from "@/components/PhoneFrame";
import { useAuth } from "@/contexts/AuthContext";
import { isProUser } from "@/services/proService";
import { supabase } from "@/integrations/supabase/client";
import ResultsDrawer, { ProductResult } from "@/components/ResultsDrawer";
import ScanOverlay from "@/components/ScanOverlay";
import PaymentModal from "@/components/PaymentModal";

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);
  const [showTemplatePrompt, setShowTemplatePrompt] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);

  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<ProductResult[] | null>(null);

  const handleUploadClick = () => {
    const isPro = isProUser();
    if (!isPro) {
      const weekCount = parseInt(localStorage.getItem("designMatch_lookup_count_week") || "0");
      const lastReset = parseInt(localStorage.getItem("designMatch_lookup_lastReset") || "0");
      const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      if (now - lastReset >= ONE_WEEK) {
        localStorage.setItem("designMatch_lookup_count_week", "0");
        localStorage.setItem("designMatch_lookup_lastReset", String(now));
      } else if (weekCount >= 1) {
        const daysLeft = Math.ceil((lastReset + ONE_WEEK - now) / (1000 * 60 * 60 * 24));
        toast.error(`Free limit reached. Resets in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}. Upgrade for unlimited.`);
        setShowSubscription(true);
        return;
      }
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      setIsSearching(true);
      setShowResults(false);

      const minScanTime = new Promise(resolve => setTimeout(resolve, 2500));
      let finalResults: ProductResult[] = [];

      try {
        const [apiResponse] = await Promise.all([
          supabase.functions.invoke("visual-search", { body: { image: dataUrl } }),
          minScanTime
        ]);
        const { data, error } = apiResponse;
        if (error) throw new Error(error.message);
        finalResults = (data?.results || []) as ProductResult[];
        if (finalResults.length === 0) {
          toast.info("No matching products found. Try a different design.");
        }
      } catch (err) {
        console.error("Lookup API failed:", err);
        await minScanTime;
        toast.error("Search failed. Check your connection and try again.");
      }

      setResults(finalResults);
      setShowResults(true);
      setIsSearching(false);

      const prev = parseInt(localStorage.getItem("designMatch_lookup_count_week") || "0");
      localStorage.setItem("designMatch_lookup_count_week", String(prev + 1));
      const total = parseInt(localStorage.getItem("designMatch_lookupCount") || "0");
      localStorage.setItem("designMatch_lookupCount", String(total + 1));
      if (!localStorage.getItem("designMatch_lookup_lastReset")) {
        localStorage.setItem("designMatch_lookup_lastReset", String(Date.now()));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        localStorage.setItem("designMatchTemplate", dataUrl);
        navigate("/studio?customTemplate=true");
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <PhoneFrame>
      <div className="flex flex-col h-full bg-[#050510] relative overflow-hidden font-sans text-white">

        {/* Ambient background removed */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
        </div>

        {/* Hidden file inputs */}
        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
        <input type="file" accept="image/*" className="hidden" ref={templateInputRef} onChange={handleTemplateUpload} />

        {/* Main content */}
        <div className="relative z-10 flex-1 flex flex-col">

          {/* Center branding */}
          <div className="flex-1 flex flex-col items-center justify-center px-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/[0.06] flex items-center justify-center mb-5">
                <Search size={22} className="text-white/70" />
              </div>
              <h1 className="text-[22px] font-bold tracking-tight text-white">
                DesignMatch
              </h1>
              <p className="text-[13px] text-white/30 mt-1.5 text-center leading-relaxed">
                Find products from your designs
              </p>
            </motion.div>
          </div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="px-5 pb-4 flex flex-col gap-2.5"
          >
            <button
              onClick={handleUploadClick}
              className="w-full py-3.5 rounded-2xl bg-white text-black text-[14px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Upload size={16} /> Upload Design
            </button>

            <button
              onClick={() => setShowTemplatePrompt(true)}
              className="w-full py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-white/60 text-[14px] font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-white/[0.06] hover:text-white/80"
            >
              <PencilRuler size={16} /> Make Design
            </button>
          </motion.div>
        </div>

        {/* Bottom nav */}
        <div className="relative z-20 flex items-center justify-around py-3 pb-6 border-t border-white/[0.04] bg-[#050510]">
          <button onClick={() => setShowResults(false)}
            className="flex flex-col items-center gap-1 text-white/80">
            <Home size={18} />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button onClick={() => navigate("/account")}
            className="flex flex-col items-center gap-1 text-white/25 hover:text-white/50 transition-colors">
            <User size={18} />
            <span className="text-[10px] font-medium">Account</span>
          </button>
        </div>

        {/* Template bottom sheet */}
        <AnimatePresence>
          {showTemplatePrompt && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-black/60 flex items-end justify-center">
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 32, stiffness: 320 }}
                className="w-full bg-[#0c0c10] rounded-t-[2rem] p-5 pb-8 relative"
              >
                <div className="flex justify-center mb-3">
                  <div className="w-9 h-[3px] rounded-full bg-white/15" />
                </div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[16px] font-bold text-white">Choose template</h2>
                  <button onClick={() => setShowTemplatePrompt(false)} className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white transition-colors">
                    <X size={14} />
                  </button>
                </div>
                <p className="text-[12px] text-white/30 mb-5 leading-relaxed">
                  Use our blank t-shirt or upload your own. For other products, visit <a href="https://www.freepik.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Freepik</a>.
                </p>
                <div className="flex flex-col gap-2">
                  <button onClick={() => { setShowTemplatePrompt(false); navigate("/studio?template=tshirt"); }}
                    className="w-full py-3 rounded-2xl bg-white text-black text-[14px] font-semibold active:scale-[0.98] transition-transform">
                    Default Template
                  </button>
                  <button onClick={() => { setShowTemplatePrompt(false); templateInputRef.current?.click(); }}
                    className="w-full py-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-white/50 text-[14px] font-medium active:scale-[0.98] transition-all">
                    Upload Custom
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isSearching && <ScanOverlay />}
        </AnimatePresence>

        <ResultsDrawer open={showResults} onClose={() => setShowResults(false)} results={results} />
        <PaymentModal open={showSubscription} onClose={() => setShowSubscription(false)} onSuccess={() => setShowSubscription(false)} />
      </div>
    </PhoneFrame>
  );
};

export default Landing;
