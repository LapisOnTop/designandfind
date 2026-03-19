import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Upload, PencilRuler, X, Home, User, Sparkles, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PhoneFrame from "@/components/PhoneFrame";
import { useAuth } from "@/contexts/AuthContext";
import { isProUser } from "@/services/proService";
import ResultsDrawer, { ProductResult } from "@/components/ResultsDrawer";
import ScanOverlay from "@/components/ScanOverlay";
import SubscriptionGate from "@/components/SubscriptionGate";
import AutoAddDesign from "@/components/AutoAddDesign";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type CategoryKey = "Visual Matches (Real)" | "Global General Marketplaces" | "Regional Powerhouses" | "Specialized & Niche Stores" | "Social & Local Commerce";
type CategorizedResults = Record<CategoryKey, ProductResult[]>;

const generateMarketplaceLinks = (query: string, sourceImg: string): CategorizedResults => {
  const q = encodeURIComponent(query);
  const t = sourceImg;
  return {
    "Visual Matches (Real)": [],
    "Global General Marketplaces": [
      { title: `${query} on Amazon`, price: "View Price", source: "Amazon", thumbnail: t, link: `https://www.amazon.com/s?k=${q}` },
      { title: `${query} on eBay`, price: "View Price", source: "eBay", thumbnail: t, link: `https://www.ebay.com/sch/i.html?_nkw=${q}` },
      { title: `${query} on AliExpress`, price: "View Price", source: "AliExpress", thumbnail: t, link: `https://www.aliexpress.com/w/wholesale-${q.replace(/%20/g, '-')}.html` },
      { title: `${query} on Temu`, price: "View Price", source: "Temu", thumbnail: t, link: `https://www.temu.com/search_result.html?search_key=${q}` },
      { title: `${query} on Walmart`, price: "View Price", source: "Walmart", thumbnail: t, link: `https://www.walmart.com/search?q=${q}` },
    ],
    "Regional Powerhouses": [
      { title: `${query} on Shopee`, price: "View Price", source: "Shopee", thumbnail: t, link: `https://shopee.sg/search?keyword=${q}` },
      { title: `${query} on Lazada`, price: "View Price", source: "Lazada", thumbnail: t, link: `https://www.lazada.com.ph/catalog/?q=${q}` },
      { title: `${query} on Taobao`, price: "View Price", source: "Taobao", thumbnail: t, link: `https://s.taobao.com/search?q=${q}` },
      { title: `${query} on Flipkart`, price: "View Price", source: "Flipkart", thumbnail: t, link: `https://www.flipkart.com/search?q=${q}` },
      { title: `${query} on Zalando`, price: "View Price", source: "Zalando", thumbnail: t, link: `https://www.zalando.co.uk/search/?q=${q}` },
    ],
    "Specialized & Niche Stores": [
      { title: `${query} on Etsy`, price: "View Price", source: "Etsy", thumbnail: t, link: `https://www.etsy.com/search?q=${q}` },
      { title: `${query} on Shein`, price: "View Price", source: "Shein", thumbnail: t, link: `https://us.shein.com/pdsearch/${q}` },
      { title: `${query} on ASOS`, price: "View Price", source: "ASOS", thumbnail: t, link: `https://www.asos.com/search/?q=${q}` },
    ],
    "Social & Local Commerce": [
      { title: `${query} on TikTok Shop`, price: "View Price", source: "TikTok Shop", thumbnail: t, link: `https://shop.tiktok.com/` },
      { title: `${query} on Facebook Marketplace`, price: "View Price", source: "Facebook", thumbnail: t, link: `https://www.facebook.com/marketplace/search/?query=${q}` },
      { title: `${query} on Depop`, price: "View Price", source: "Depop", thumbnail: t, link: `https://www.depop.com/search/?q=${q}` },
    ],
  };
};

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);
  const [showTemplatePrompt, setShowTemplatePrompt] = useState(false);
  const [showAutoAdd, setShowAutoAdd] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "account">("home");

  // SERP direct lookup state
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<CategorizedResults | null>(null);

  const handleUploadClick = () => {
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
      try {
        const { data, error } = await supabase.functions.invoke("visual-search", {
          body: { image: dataUrl },
        });
        if (error) throw new Error(error.message);

        let realMatches: ProductResult[] = data?.results || [];
        const pricedMatches = realMatches.filter(r => r.price && r.price.trim() !== "" && r.price.toLowerCase() !== "dynamic" && r.price !== "0");
        const productName = pricedMatches[0]?.title || realMatches[0]?.title || "Custom Design Product";
        const thumb = pricedMatches[0]?.thumbnail || realMatches[0]?.thumbnail || dataUrl;

        const dynamicCategories = generateMarketplaceLinks(productName, thumb);
        dynamicCategories["Visual Matches (Real)"] = pricedMatches;
        setResults(dynamicCategories);
        setShowResults(true);
      } catch (err) {
        console.error("Lookup Failed:", err);
        toast.error("Visual search failed. Please try again.");
      } finally {
        setIsSearching(false);
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

  const handleAutoAddClick = () => {
    if (!isProUser()) {
      setShowSubscription(true);
      return;
    }
    setShowTemplatePrompt(false);
    setShowAutoAdd(true);
  };

  return (
    <PhoneFrame>
      <div className="flex flex-col h-full bg-[#0a0a0a] relative overflow-hidden font-sans text-white">

        {/* Animated Background */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <motion.div animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[10%] -left-[20%] w-[70%] h-[50%] rounded-full bg-primary/20 blur-[80px]" />
          <motion.div animate={{ x: [0, 30, 0], scale: [1, 1.1, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-[40%] -right-[20%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[80px]" />
        </div>

        {/* Main Content Area */}
        <div className="relative z-10 flex-1 flex flex-col overflow-y-auto hide-scrollbar">
          {activeTab === "home" ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              {/* Logo */}
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="flex items-center gap-2.5 mb-16">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center shadow-[0_0_25px_rgba(var(--primary),0.3)]">
                  <Search size={22} className="text-white" />
                </div>
                <span className="text-[26px] font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">DesignMatch</span>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
                className="w-full max-w-[300px] flex flex-col gap-3">
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <input type="file" accept="image/*" className="hidden" ref={templateInputRef} onChange={handleTemplateUpload} />

                <button onClick={handleUploadClick}
                  className="relative overflow-hidden w-full group py-4 rounded-2xl font-bold text-[15px] text-white shadow-[0_0_30px_rgba(var(--primary),0.3)] active:scale-[0.98] transition-all">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-blue-500 to-primary background-animate" />
                  <div className="absolute inset-[1px] bg-[#0a0a0a]/40 backdrop-blur-md rounded-2xl group-hover:bg-[#0a0a0a]/20 transition-colors" />
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    <Upload size={18} /> Upload Design
                  </div>
                </button>

                <button onClick={() => setShowTemplatePrompt(true)}
                  className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-white/10">
                  <PencilRuler size={18} className="text-white/60" /> Make Design
                </button>
              </motion.div>
            </div>
          ) : (
            /* Account Tab */
            <div className="flex-1 flex flex-col px-6 pt-14">
              <h1 className="text-2xl font-bold mb-8">Account</h1>
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-xs text-white/40 mb-1">Email</p>
                  <p className="text-sm font-medium">{user?.email || "Not signed in"}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-xs text-white/40 mb-1">Current Plan</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${isProUser() ? "text-primary" : "text-white/70"}`}>
                      {isProUser() ? "Pro" : "Free"}
                    </span>
                    {isProUser() && <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold">Active</span>}
                  </div>
                </div>
                <button onClick={() => { supabase.auth.signOut(); navigate("/"); }}
                  className="w-full py-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm active:scale-[0.98] transition-all hover:bg-red-500/20">
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Bar */}
        <div className="relative z-20 flex items-center justify-around py-3 pb-6 border-t border-white/10 bg-[#0a0a0a]/90 backdrop-blur-xl">
          <button onClick={() => { setActiveTab("home"); setShowResults(false); }}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "home" ? "text-primary" : "text-white/40"}`}>
            <Home size={20} />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button onClick={() => setActiveTab("account")}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "account" ? "text-primary" : "text-white/40"}`}>
            <User size={20} />
            <span className="text-[10px] font-medium">Account</span>
          </button>
        </div>

        {/* Template Prompt Modal */}
        <AnimatePresence>
          {showTemplatePrompt && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center px-6">
              <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full bg-[#111] backdrop-blur-3xl rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-white/10 p-6 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-24 bg-primary/20 blur-[40px] pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold text-white">Choose a template</h2>
                    <button onClick={() => setShowTemplatePrompt(false)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                  <p className="text-sm text-white/50 mb-6 leading-relaxed">
                    Use our default template or upload your own. Find templates at{" "}
                    <a href="https://www.freepik.com/app" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">Freepik</a>.
                  </p>
                  <div className="flex flex-col gap-3">
                    <button onClick={handleAutoAddClick}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary to-blue-600 text-white font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                      <Sparkles size={16} /> Auto-Add Design
                      {!isProUser() && <Crown size={12} className="text-yellow-400" />}
                    </button>
                    <button onClick={() => { setShowTemplatePrompt(false); navigate("/studio?template=tshirt"); }}
                      className="w-full py-3.5 rounded-2xl bg-white text-black font-bold active:scale-[0.98] transition-all">
                      Use Default Template
                    </button>
                    <button onClick={() => { setShowTemplatePrompt(false); templateInputRef.current?.click(); }}
                      className="w-full py-3.5 rounded-2xl bg-white/10 border border-white/5 text-white font-bold active:scale-[0.98] transition-all">
                      Upload My Template
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SERP Direct Lookup Overlay */}
        <AnimatePresence>
          {isSearching && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-[90] bg-[#0a0a0a]/95 backdrop-blur-xl flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-white/60 text-sm font-medium">Searching global suppliers...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Drawer for direct upload lookup */}
        <ResultsDrawer open={showResults} onClose={() => setShowResults(false)} results={results} />

        {/* Auto-Add Design Modal */}
        <AutoAddDesign open={showAutoAdd} onClose={() => setShowAutoAdd(false)} />

        {/* Subscription Gate */}
        <SubscriptionGate open={showSubscription} onClose={() => setShowSubscription(false)} />
      </div>
    </PhoneFrame>
  );
};

export default Landing;

export default Landing;
