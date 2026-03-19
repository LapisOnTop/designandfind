import { useRef, useState, useCallback, useEffect } from "react";
import { fabric } from "fabric";
import { AnimatePresence } from "framer-motion";
import { useSearchParams, useNavigate } from "react-router-dom";
import PhoneFrame from "@/components/PhoneFrame";
import HeaderBar from "@/components/HeaderBar";
import CanvasEditor from "@/components/CanvasEditor";
import BottomToolbar from "@/components/BottomToolbar";
import ScanOverlay from "@/components/ScanOverlay";
import ResultsDrawer, { ProductResult } from "@/components/ResultsDrawer";
import SubscriptionGate from "@/components/SubscriptionGate";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import tshirtMockup from "@/assets/tshirt-mockup.png";

type CategoryKey = "Visual Matches (Real)" | "Global General Marketplaces" | "Regional Powerhouses" | "Specialized & Niche Stores" | "Social & Local Commerce";

const TEMPLATE_IMAGES: Record<string, string> = {
  tshirt: tshirtMockup,
};

export type CategorizedResults = Record<CategoryKey, ProductResult[]>;

// Helper function to build dynamic search links based on the real product title
const generateMarketplaceLinks = (query: string, sourceImg: string): CategorizedResults => {
  const q = encodeURIComponent(query);
  const t = sourceImg;

  return {
    "Visual Matches (Real)": [], // This will be populated with the *actual* edge function results
    "Global General Marketplaces": [
      { title: `Search ${query} on Amazon`, price: "Dynamic", source: "Amazon", thumbnail: t, link: `https://www.amazon.com/s?k=${q}` },
      { title: `Search ${query} on eBay`, price: "Dynamic", source: "eBay", thumbnail: t, link: `https://www.ebay.com/sch/i.html?_nkw=${q}` },
      { title: `Search ${query} on AliExpress`, price: "Dynamic", source: "AliExpress", thumbnail: t, link: `https://www.aliexpress.com/w/wholesale-${q.replace(/%20/g, '-')}.html` },
      { title: `Search ${query} on Temu`, price: "Dynamic", source: "Temu", thumbnail: t, link: `https://www.temu.com/search_result.html?search_key=${q}` },
      { title: `Search ${query} on Walmart`, price: "Dynamic", source: "Walmart", thumbnail: t, link: `https://www.walmart.com/search?q=${q}` },
    ],
    "Regional Powerhouses": [
      { title: `Search ${query} on Shopee (SEA)`, price: "Dynamic", source: "Shopee", thumbnail: t, link: `https://shopee.sg/search?keyword=${q}` },
      { title: `Search ${query} on Taobao`, price: "Dynamic", source: "Taobao", thumbnail: t, link: `https://s.taobao.com/search?q=${q}` },
      { title: `Search ${query} on Mercado Libre`, price: "Dynamic", source: "Mercado Libre", thumbnail: t, link: `https://listado.mercadolibre.com.mx/${q.replace(/%20/g, '-')}` },
      { title: `Search ${query} on Flipkart (India)`, price: "Dynamic", source: "Flipkart", thumbnail: t, link: `https://www.flipkart.com/search?q=${q}` },
      { title: `Search ${query} on Zalando (EU)`, price: "Dynamic", source: "Zalando", thumbnail: t, link: `https://www.zalando.co.uk/search/?q=${q}` },
    ],
    "Specialized & Niche Stores": [
      { title: `Search ${query} on Etsy (Handmade)`, price: "Dynamic", source: "Etsy", thumbnail: t, link: `https://www.etsy.com/search?q=${q}` },
      { title: `Search ${query} on Shein (Fashion)`, price: "Dynamic", source: "Shein", thumbnail: t, link: `https://us.shein.com/pdsearch/${q.replace(/%20/g, '%20')}` },
      { title: `Search ${query} on ASOS (Apparel)`, price: "Dynamic", source: "ASOS", thumbnail: t, link: `https://www.asos.com/search/?q=${q}` },
    ],
    "Social & Local Commerce": [
      { title: `Search ${query} on TikTok Shop`, price: "Dynamic", source: "TikTok Shop", thumbnail: t, link: `https://shop.tiktok.com/` }, // generic since direct query search urls rotate
      { title: `Search ${query} on Facebook Marketplace`, price: "Dynamic", source: "Facebook Marketplace", thumbnail: t, link: `https://www.facebook.com/marketplace/search/?query=${q}` },
      { title: `Search ${query} on Depop`, price: "Dynamic", source: "Depop", thumbnail: t, link: `https://www.depop.com/search/?q=${q}` },
    ],
  };
};

const Studio = () => {
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [results, setResults] = useState<CategorizedResults | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [templateColor, setTemplateColor] = useState<string>("#ef4444");
  const COLORS = ["#ffffff", "#1e293b", "#ef4444", "#3b82f6", "#22c55e"];

  // New Design Controls
  const [layoutMode, setLayoutMode] = useState(true);
  const [showPrintArea, setShowPrintArea] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [activeView, setActiveView] = useState<"front" | "back">("front");

  const autoLookup = searchParams.get("autoLookup") === "true";
  const templateId = searchParams.get("template");
  const customTemplate = searchParams.get("customTemplate") === "true";

  // Determine background and logo
  const uploadDataUrl = localStorage.getItem("designMatchUpload");
  const customTemplateUrl = customTemplate ? localStorage.getItem("designMatchTemplate") : null;
  const backgroundUrl = customTemplateUrl || (templateId && TEMPLATE_IMAGES[templateId]) || TEMPLATE_IMAGES["tshirt"];
  const logoUrl = uploadDataUrl || undefined;

  // Load saved state per view
  const savedState = (!uploadDataUrl && templateId) ? (localStorage.getItem(`designMatch_saved_${templateId}_${activeView}`) || undefined) : undefined;

  const handleSave = useCallback(() => {
    if (!canvasRef.current || !templateId) {
      toast.error("Please select a product first");
      return;
    }
    try {
      const json = canvasRef.current.toJSON(["name", "opacity", "selectable", "evented"]);
      localStorage.setItem(`designMatch_saved_${templateId}_${activeView}`, JSON.stringify(json));
      toast.success(`Design (${activeView}) saved successfully!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save design");
    }
  }, [templateId, activeView]);

  const handleLookup = useCallback(async () => {
    if (!canvasRef.current || isSearching) return;
    setIsSearching(true);
    setShowResults(false);

    try {
      const dataUrl = canvasRef.current.toDataURL({ format: "png", quality: 1 });

      const { data, error } = await supabase.functions.invoke("visual-search", {
        body: { image: dataUrl },
      });

      if (error) throw new Error(error.message);

      if (!data?.results?.length) {
        toast.info("No exact visual matches found. Try generating dynamic links or a different design.");
        setIsSearching(false);
        return;
      }

      const realMatches: ProductResult[] = data.results;
      const detectedProductName = realMatches[0]?.title || "Custom Design Product";
      const detectedThumbnail = realMatches[0]?.thumbnail || backgroundUrl || dataUrl;

      const dynamicCategories = generateMarketplaceLinks(detectedProductName, detectedThumbnail);
      dynamicCategories["Visual Matches (Real)"] = realMatches;

      setResults(dynamicCategories);
      setShowResults(true);

    } catch (err) {
      console.error("Lookup Failed:", err);
      toast.error("Visual search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }, [isSearching, backgroundUrl]);

  const handleCanvasReady = useCallback(() => {
    if (autoLookup && uploadDataUrl && !isSearching) {
      handleLookup();
      localStorage.removeItem("designMatchUpload");
    }
  }, [autoLookup, uploadDataUrl, isSearching, handleLookup]);

  useEffect(() => {
    if (localStorage.getItem("designMatch_showProAfterLogin") === "true") {
      setShowSubscription(true);
      localStorage.removeItem("designMatch_showProAfterLogin");
    }
  }, []);

  const handleExit = () => {
    navigate("/");
  };

  const toolbarControls = {
    layoutMode, setLayoutMode,
    showPrintArea, setShowPrintArea,
    showGrid, setShowGrid,
    snapToGrid, setSnapToGrid,
    activeView, setActiveView
  };

  return (
    <PhoneFrame>
      <HeaderBar onLookup={handleLookup} isSearching={isSearching} onExit={handleExit} onSave={handleSave} />

      <div className="relative flex-1 flex flex-col overflow-hidden">
        <CanvasEditor
          canvasRef={canvasRef}
          backgroundUrl={backgroundUrl}
          logoUrl={activeView === "front" ? logoUrl : undefined}
          templateColor={templateColor}
          savedState={savedState}
          layoutMode={layoutMode}
          showPrintArea={showPrintArea}
          showGrid={showGrid}
          snapToGrid={snapToGrid}
          activeView={activeView}
          onReady={handleCanvasReady}
        />

        <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center gap-4">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setTemplateColor(color)}
              className={`w-8 h-8 rounded-full border border-border shadow-md transition-all ${templateColor === color ? "ring-2 ring-primary ring-offset-2 scale-110" : "hover:scale-105"
                }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <AnimatePresence>
          {isSearching && <ScanOverlay />}
        </AnimatePresence>

        <ResultsDrawer
          open={showResults}
          onClose={() => setShowResults(false)}
          results={results}
        />

        <SubscriptionGate
          open={showSubscription}
          onClose={() => setShowSubscription(false)}
        />
      </div>

      <BottomToolbar
        canvasRef={canvasRef}
        controls={toolbarControls}
        onSubscribe={() => setShowSubscription(true)}
        onRequirePro={() => setShowSubscription(true)}
      />
    </PhoneFrame>
  );
};

export default Studio;
