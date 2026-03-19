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
import LayersPanel from "@/components/LayersPanel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import tshirtMockup from "@/assets/tshirt-mockup.png";

type CategoryKey = "Visual Matches (Real)" | "Global General Marketplaces" | "Regional Powerhouses" | "Specialized & Niche Stores" | "Social & Local Commerce";

const TEMPLATE_IMAGES: Record<string, string> = { tshirt: tshirtMockup };

export type CategorizedResults = Record<CategoryKey, ProductResult[]>;

function getClosestColorName(hex: string): string {
  const c = hex.toLowerCase();
  const map: Record<string, string> = {
    "#ffffff": "white", "#000000": "black", "#ef4444": "red", "#3b82f6": "blue",
    "#10b981": "green", "#eab308": "yellow", "#8b5cf6": "purple", "#ec4899": "pink", "#f97316": "orange",
  };
  return map[c] || "custom color";
}

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
    ],
    "Specialized & Niche Stores": [
      { title: `${query} on Etsy`, price: "View Price", source: "Etsy", thumbnail: t, link: `https://www.etsy.com/search?q=${q}` },
      { title: `${query} on Shein`, price: "View Price", source: "Shein", thumbnail: t, link: `https://us.shein.com/pdsearch/${q}` },
    ],
    "Social & Local Commerce": [
      { title: `${query} on TikTok Shop`, price: "View Price", source: "TikTok Shop", thumbnail: t, link: `https://shop.tiktok.com/` },
      { title: `${query} on Facebook`, price: "View Price", source: "Facebook", thumbnail: t, link: `https://www.facebook.com/marketplace/search/?query=${q}` },
    ],
  };
};

const Studio = () => {
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [results, setResults] = useState<CategorizedResults | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [templateColor, setTemplateColor] = useState<string>("#ef4444");
  const [showBg, setShowBg] = useState(true);
  const [zoom, setZoom] = useState(1);

  // Undo/Redo state
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const savingRef = useRef(false);

  const [layoutMode, setLayoutMode] = useState(true);
  const [showPrintArea, setShowPrintArea] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [activeView, setActiveView] = useState<"front" | "back">("front");

  const autoLookup = searchParams.get("autoLookup") === "true";
  const templateId = searchParams.get("template");
  const customTemplate = searchParams.get("customTemplate") === "true";

  const uploadDataUrl = localStorage.getItem("designMatchUpload");
  const customTemplateUrl = customTemplate ? localStorage.getItem("designMatchTemplate") : null;
  const backgroundUrl = customTemplateUrl || (templateId && TEMPLATE_IMAGES[templateId]) || TEMPLATE_IMAGES["tshirt"];
  const logoUrl = uploadDataUrl || undefined;
  const savedState = (!uploadDataUrl && templateId) ? (localStorage.getItem(`designMatch_saved_${templateId}_${activeView}`) || undefined) : undefined;

  // Modal open detection for toolbar hiding
  const modalOpen = showResults || showSubscription || isSearching;

  // Save undo snapshot
  const saveUndoSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || savingRef.current) return;
    savingRef.current = true;
    const json = JSON.stringify(canvas.toJSON(["name", "opacity", "selectable", "evented"]));
    setUndoStack(prev => [...prev.slice(-30), json]);
    setRedoStack([]);
    savingRef.current = false;
  }, []);

  // Register canvas modification listener for undo snapshots
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = () => saveUndoSnapshot();
    canvas.on("object:added", handler);
    canvas.on("object:removed", handler);
    canvas.on("object:modified", handler);
    return () => {
      canvas.off("object:added", handler);
      canvas.off("object:removed", handler);
      canvas.off("object:modified", handler);
    };
  }, [saveUndoSnapshot]);

  const handleUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || undoStack.length === 0) return;
    const currentJson = JSON.stringify(canvas.toJSON(["name", "opacity", "selectable", "evented"]));
    setRedoStack(prev => [...prev, currentJson]);
    const prevState = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    savingRef.current = true;
    canvas.loadFromJSON(prevState, () => { canvas.renderAll(); savingRef.current = false; });
  }, [undoStack]);

  const handleRedo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || redoStack.length === 0) return;
    const currentJson = JSON.stringify(canvas.toJSON(["name", "opacity", "selectable", "evented"]));
    setUndoStack(prev => [...prev, currentJson]);
    const nextState = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    savingRef.current = true;
    canvas.loadFromJSON(nextState, () => { canvas.renderAll(); savingRef.current = false; });
  }, [redoStack]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); handleUndo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); handleRedo(); }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const canvas = canvasRef.current;
        const obj = canvas?.getActiveObject();
        if (canvas && obj && obj.name !== "productMockup" && obj.name !== "printArea") {
          canvas.remove(obj); canvas.discardActiveObject(); canvas.renderAll();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleUndo, handleRedo]);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.1, 2));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.1, 0.5));

  const handleClearAll = () => {
    if (!confirm("Remove all design elements from canvas?")) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const systemNames = ["productMockup", "colorTint", "productColor", "printArea"];
    const toRemove = canvas.getObjects().filter(o => !systemNames.includes(o.name || "") && !o.name?.startsWith("gridLine"));
    toRemove.forEach(o => canvas.remove(o));
    canvas.discardActiveObject();
    canvas.renderAll();
    toast.success("Canvas cleared");
  };

  const handleSave = useCallback(() => {
    if (!canvasRef.current || !templateId) { toast.error("Please select a product first"); return; }
    try {
      const json = canvasRef.current.toJSON(["name", "opacity", "selectable", "evented"]);
      localStorage.setItem(`designMatch_saved_${templateId}_${activeView}`, JSON.stringify(json));
      toast.success(`Design (${activeView}) saved!`);
    } catch (err) { console.error(err); toast.error("Failed to save"); }
  }, [templateId, activeView]);

  const handleLookup = useCallback(async () => {
    if (!canvasRef.current || isSearching) return;
    setIsSearching(true);
    setShowResults(false);
    try {
      const dataUrl = canvasRef.current.toDataURL({ format: "png", quality: 1 });
      const { data, error } = await supabase.functions.invoke("visual-search", { body: { image: dataUrl } });
      if (error) throw new Error(error.message);

      let realMatches: ProductResult[] = data?.results || [];
      const pricedMatches = realMatches.filter(r => r.price && r.price.trim() !== "" && r.price.toLowerCase() !== "dynamic" && r.price !== "0");
      const colorPrefix = templateColor !== "#ffffff" ? `${getClosestColorName(templateColor)} ` : "";
      const productName = colorPrefix + (pricedMatches[0]?.title || realMatches[0]?.title || "t-shirt design buy");
      const thumb = pricedMatches[0]?.thumbnail || realMatches[0]?.thumbnail || backgroundUrl || dataUrl;

      const dynamicCategories = generateMarketplaceLinks(productName, thumb);
      dynamicCategories["Visual Matches (Real)"] = pricedMatches;
      setResults(dynamicCategories);
      setShowResults(true);
    } catch (err) { console.error("Lookup Failed:", err); toast.error("Visual search failed."); }
    finally { setIsSearching(false); }
  }, [isSearching, backgroundUrl, templateColor]);

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

  const handleAddText = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const text = new fabric.IText("Your Text", {
      left: 179, top: 200, originX: "center", originY: "center",
      fontSize: 24, fontFamily: "Inter, sans-serif", fill: "#000000", fontWeight: "bold",
      cornerColor: "#000", cornerStrokeColor: "#fff", borderColor: "#000", cornerSize: 10, transparentCorners: false, name: "userText",
    });
    canvas.add(text); canvas.setActiveObject(text); canvas.renderAll();
    toast.success("Text added! Double-click to edit.");
  };

  const handleUploadImage = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvasRef.current) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      fabric.Image.fromURL(dataUrl, (img) => {
        if (!img || !canvasRef.current) return;
        const scale = Math.min(120 / (img.width || 120), 120 / (img.height || 120));
        img.scale(scale);
        img.set({ left: 179, top: 200, originX: "center", originY: "center", cornerColor: "#000", cornerStrokeColor: "#fff", borderColor: "#000", cornerSize: 10, transparentCorners: false, name: "uploadedImage" });
        canvasRef.current!.add(img); canvasRef.current!.setActiveObject(img); canvasRef.current!.renderAll();
        toast.success("Image added!");
      }, { crossOrigin: "anonymous" });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAddShape = (shape: "rect" | "circle" | "triangle") => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const common = { left: 179, top: 200, originX: "center" as const, originY: "center" as const, fill: templateColor || "#3b82f6", stroke: "#000", strokeWidth: 2, cornerColor: "#000", cornerStrokeColor: "#fff", borderColor: "#000", cornerSize: 10, transparentCorners: false, name: "userShape" };
    let obj: fabric.Object;
    if (shape === "rect") obj = new fabric.Rect({ ...common, width: 60, height: 60 });
    else if (shape === "circle") obj = new fabric.Circle({ ...common, radius: 30 });
    else obj = new fabric.Triangle({ ...common, width: 60, height: 60 });
    canvas.add(obj); canvas.setActiveObject(obj); canvas.renderAll();
    toast.success(`${shape.charAt(0).toUpperCase() + shape.slice(1)} added!`);
  };

  const toolbarControls = { layoutMode, setLayoutMode, showPrintArea, setShowPrintArea, showGrid, setShowGrid, snapToGrid, setSnapToGrid, activeView, setActiveView };

  return (
    <PhoneFrame>
      <HeaderBar onLookup={handleLookup} isSearching={isSearching} onExit={() => navigate("/")} onSave={handleSave} />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      <div className="relative flex-1 flex flex-col overflow-hidden">
        <CanvasEditor canvasRef={canvasRef} backgroundUrl={backgroundUrl} logoUrl={activeView === "front" ? logoUrl : undefined}
          templateColor={templateColor} showBg={showBg} savedState={savedState} layoutMode={layoutMode}
          showPrintArea={showPrintArea} showGrid={showGrid} snapToGrid={snapToGrid} activeView={activeView}
          zoom={zoom} onReady={handleCanvasReady} />

        {/* Color Swatches */}
        <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center items-center gap-3">
          {[{ c: "#ffffff", bg: "bg-white" }, { c: "#000000", bg: "bg-black" }].map(s => (
            <button key={s.c} onClick={() => setTemplateColor(s.c)}
              className={`w-7 h-7 rounded-full border-2 shadow transition-all ${s.bg} ${templateColor === s.c ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110" : "border-white/30 hover:scale-105"}`} />
          ))}
          <label className="relative cursor-pointer">
            <div className={`w-7 h-7 rounded-full border-2 shadow transition-all overflow-hidden ${templateColor !== "#ffffff" && templateColor !== "#000000" ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110" : "border-white/30 hover:scale-105"}`}
              style={{ background: templateColor !== "#ffffff" && templateColor !== "#000000" ? templateColor : "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)" }} />
            <input type="color" value={templateColor} onChange={e => setTemplateColor(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </label>
        </div>

        <AnimatePresence>{isSearching && <ScanOverlay />}</AnimatePresence>
        <ResultsDrawer open={showResults} onClose={() => setShowResults(false)} results={results} />
        <SubscriptionGate open={showSubscription} onClose={() => setShowSubscription(false)} />
        <LayersPanel open={showLayers} onClose={() => setShowLayers(false)} canvasRef={canvasRef} />
      </div>

      <BottomToolbar canvasRef={canvasRef} controls={toolbarControls}
        showBg={showBg} onToggleBg={() => setShowBg(!showBg)}
        onAddText={handleAddText} onUploadImage={handleUploadImage} onAddShape={handleAddShape}
        onSubscribe={() => setShowSubscription(true)} onRequirePro={() => setShowSubscription(true)}
        onUndo={handleUndo} onRedo={handleRedo} canUndo={undoStack.length > 0} canRedo={redoStack.length > 0}
        zoom={zoom} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut}
        onClearAll={handleClearAll} onToggleLayers={() => setShowLayers(!showLayers)}
        modalOpen={modalOpen} />
    </PhoneFrame>
  );
};

export default Studio;
