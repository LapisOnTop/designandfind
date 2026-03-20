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
  const [showSubscription, setShowSubscription] = useState(false);

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

  return (
    <PhoneFrame>
      <div className="flex flex-col h-full bg-[#0a0a0a] relative overflow-hidden font-sans text-white">

        {/* Main Content Area */}
        <div className="relative z-10 flex-1 flex flex-col hide-scrollbar">
          <div className="flex-1 flex flex-col px-6 py-12">

            {/* Top Section - Logo & Title */}
            <div className="flex flex-col items-center mt-12">
              <div className="w-16 h-16 rounded-[1.2rem] bg-primary flex items-center justify-center mb-4">
                <Search size={28} className="text-white" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                DesignMatch
              </h1>
            </div>

            {/* Bottom Section - Action Buttons */}
            <div className="w-full flex flex-col gap-3 mt-auto pb-4">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
              <input type="file" accept="image/*" className="hidden" ref={templateInputRef} onChange={handleTemplateUpload} />

              <button onClick={handleUploadClick}
                className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                <Upload size={18} /> Upload Design
              </button>

              <button onClick={() => setShowTemplatePrompt(true)}
                className="w-full py-3.5 rounded-xl bg-[#141414] border border-[#222] text-white font-semibold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:bg-[#1a1a1a]">
                <PencilRuler size={18} className="text-[#888]" /> Make Design
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Navigation Bar */}
        <div className="relative z-20 flex items-center justify-around py-3 pb-6 border-t border-[#222] bg-[#0a0a0a]">
          <button onClick={() => { setActiveTab("home"); setShowResults(false); }}
            className={`flex flex-col items-center gap-1 transition-colors text-primary`}>
            <Home size={20} />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button onClick={() => navigate("/account")}
            className={`flex flex-col items-center gap-1 transition-colors text-[#888] hover:text-white`}>
            <User size={20} />
            <span className="text-[10px] font-medium">Account</span>
          </button>
        </div>

        {/* Template Prompt Modal */}
        <AnimatePresence>
          {showTemplatePrompt && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-black/80 flex items-center justify-center px-6">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="w-full bg-[#141414] rounded-2xl border border-[#222] p-6 relative">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-lg font-semibold text-white">Choose a template</h2>
                  <button onClick={() => setShowTemplatePrompt(false)} className="p-1.5 rounded-full bg-[#222] text-[#888] hover:text-white transition-colors">
                    <X size={16} />
                  </button>
                </div>
                <p className="text-sm text-[#888] mb-6">
                  Use our default template or upload your own, Disclaimer: Our template only offers an empty tshirt outline therefore if u want to use a different shirt or template of other product with a different color. Then visit <a href="https://www.freepik.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Freepik</a>!
                </p>
                <div className="flex flex-col gap-2.5">
                  <button onClick={() => { setShowTemplatePrompt(false); navigate("/studio?template=tshirt"); }}
                    className="w-full py-3 rounded-xl bg-[#222] text-white font-semibold active:scale-[0.98] transition-transform">
                    Use Default Template
                  </button>
                  <button onClick={() => { setShowTemplatePrompt(false); templateInputRef.current?.click(); }}
                    className="w-full py-3 rounded-xl bg-transparent border border-[#333] text-white font-semibold active:scale-[0.98] transition-transform">
                    Upload My Template
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SERP Direct Lookup Overlay */}
        <AnimatePresence>
          {isSearching && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-[90] bg-[#0a0a0a]/95 flex flex-col items-center justify-center gap-4">
              <div className="w-8 h-8 border-2 border-[#333] border-t-primary rounded-full animate-spin" />
              <p className="text-[#888] text-sm font-medium">Searching global suppliers...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Drawer for direct upload lookup */}
        <ResultsDrawer open={showResults} onClose={() => setShowResults(false)} results={results} />

        {/* Subscription Gate */}
        <SubscriptionGate open={showSubscription} onClose={() => setShowSubscription(false)} />
      </div>
    </PhoneFrame>
  );
};

export default Landing;
