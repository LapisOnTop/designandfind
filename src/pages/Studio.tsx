import { useRef, useState, useCallback, useEffect } from "react";
import { fabric } from "fabric";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import PhoneFrame from "@/components/PhoneFrame";
import HeaderBar from "@/components/HeaderBar";
import CanvasEditor from "@/components/CanvasEditor";
import BottomToolbar, { BottomSheetType } from "@/components/BottomToolbar";
import ViewTabs from "@/components/ViewTabs";
import StudioBottomSheet from "@/components/StudioBottomSheet";
import FloatingContextBar from "@/components/FloatingContextBar";
import PropertiesBar from "@/components/PropertiesBar";
import ScanOverlay from "@/components/ScanOverlay";
import ResultsDrawer, { ProductResult } from "@/components/ResultsDrawer";
import PaymentModal from "@/components/PaymentModal";
import { supabase } from "@/integrations/supabase/client";
import { isProUser } from "@/services/proService";
import { toast } from "sonner";
import { getLookupStats, incrementLookup } from "@/services/lookupService";
import tshirtMockup from "@/assets/tshirt-mockup.png";

const TEMPLATE_IMAGES: Record<string, string> = {
  tshirt: tshirtMockup,
  jersey: tshirtMockup, // Placeholder for demo
  hoodie: tshirtMockup, // Placeholder for demo
  jacket: tshirtMockup, // Placeholder for demo
  cap: tshirtMockup,    // Placeholder for demo
  pants: tshirtMockup,   // Placeholder for demo
};

function getClosestColorName(hex: string): string {
  const c = hex.toLowerCase();
  const map: Record<string, string> = {
    "#ffffff": "white", "#000000": "black", "#ef4444": "red", "#3b82f6": "blue",
    "#10b981": "green", "#eab308": "yellow", "#8b5cf6": "purple", "#ec4899": "pink", "#f97316": "orange",
  };
  return map[c] || "custom color";
}

const Studio = () => {
  const { user } = useAuth();
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [results, setResults] = useState<ProductResult[] | null>(null);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [currentSaveName, setCurrentSaveName] = useState("");

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [templateColor, setTemplateColor] = useState<string>("#ffffff");
  const [showBg, setShowBg] = useState(true);
  const [zoom, setZoom] = useState(1);

  // Undo/Redo state
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const savingRef = useRef(false);

  const [activeBottomSheet, setActiveBottomSheet] = useState<BottomSheetType>(null);

  // Selection tracking
  const [hasSelection, setHasSelection] = useState(false);
  const [contextBarPos, setContextBarPos] = useState<{ top: number, left: number } | null>(null);
  const [opacity, setOpacity] = useState(1);
  const [strokeWeight, setStrokeWeight] = useState(0);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [shadowBlur, setShadowBlur] = useState(0);
  const [canvasElements, setCanvasElements] = useState<any[]>([]);

  const [layoutMode, setLayoutMode] = useState(true);
  const [showPrintArea, setShowPrintArea] = useState(true);
  const [activeView, setActiveView] = useState<"front" | "back">("front");

  const autoLookup = searchParams.get("autoLookup") === "true";
  const templateId = searchParams.get("template");
  const customTemplate = searchParams.get("customTemplate") === "true";

  const uploadDataUrl = localStorage.getItem("designMatchUpload");
  const customTemplateUrl = customTemplate ? localStorage.getItem("designMatchTemplate") : null;
  const backgroundUrl = customTemplateUrl || (templateId && TEMPLATE_IMAGES[templateId]) || TEMPLATE_IMAGES["tshirt"];
  const logoUrl = uploadDataUrl || undefined;
  const loadId = searchParams.get("loadId");
  const savedState = loadId && user?.id
    ? (localStorage.getItem(`designMatch_saved_${loadId}_${user.id}`) || undefined)
    : undefined;

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

  // Update selection
  const updateSelectionState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();

    if (active) {
      setHasSelection(true);
      setOpacity(active.opacity ?? 1);
      setStrokeWeight(active.strokeWidth ?? 0);
      setStrokeColor((active.stroke as string) || "#000000");

      const shadow = active.shadow as fabric.Shadow;
      setShadowBlur(shadow?.blur ?? 0);

      // Calculate floating bar position (above element)
      const bound = active.getBoundingRect();
      // bound is relative to the canvas. We want to position our absolute div relative to the container.
      // We will place it exactly at the top of the bounding box.
      setContextBarPos({
        top: bound.top,
        left: bound.left + bound.width / 2
      });
    } else {
      setHasSelection(false);
      setContextBarPos(null);
    }
  }, []);

  const updateLayersList = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const systemNames = ["productMockup", "colorTint", "printArea"];
    const elements = canvas.getObjects().filter(o =>
      !systemNames.includes(o.name || "") && !o.name?.startsWith("gridLine")
    ).map(o => ({
      id: (o as any).id || (Math.random().toString(36).substring(7)),
      type: o.type,
      name: o.name,
      visible: o.visible !== false,
      obj: o
    })).reverse();

    elements.forEach(e => { if (!(e.obj as any).id) (e.obj as any).id = e.id; });
    setCanvasElements(elements);
  }, []);

  // Register canvas modification listener
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onSelection = () => updateSelectionState();
    const onObjectChange = () => {
      saveUndoSnapshot();
      updateSelectionState();
      updateLayersList();
    };

    canvas.on("selection:created", onSelection);
    canvas.on("selection:updated", onSelection);
    canvas.on("selection:cleared", onSelection);
    canvas.on("object:moving", onSelection);
    canvas.on("object:scaling", onSelection);
    canvas.on("object:rotating", onSelection);

    canvas.on("object:added", onObjectChange);
    canvas.on("object:removed", onObjectChange);
    canvas.on("object:modified", onObjectChange);

    // Initial layers sync
    updateLayersList();

    return () => {
      canvas.off("selection:created", onSelection);
      canvas.off("selection:updated", onSelection);
      canvas.off("selection:cleared", onSelection);
      canvas.off("object:moving", onSelection);
      canvas.off("object:scaling", onSelection);
      canvas.off("object:rotating", onSelection);
      canvas.off("object:added", onObjectChange);
      canvas.off("object:removed", onObjectChange);
      canvas.off("object:modified", onObjectChange);
    };
  }, [saveUndoSnapshot, updateSelectionState, updateLayersList]);

  const handleAddShape = (shape: string) => {
    if (!checkProLimit()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let newShape: fabric.Object | null = null;
    const commonProps = {
      left: 179, top: 200, originX: "center", originY: "center",
      fill: "#000000",
      cornerColor: "#000", cornerStrokeColor: "#fff", borderColor: "#000", cornerSize: 10, transparentCorners: false,
      name: "userShape",
    };

    switch (shape) {
      case "rectangle":
        newShape = new fabric.Rect({ ...commonProps, width: 50, height: 50 });
        break;
      case "circle":
        newShape = new fabric.Circle({ ...commonProps, radius: 25 });
        break;
      case "triangle":
        newShape = new fabric.Triangle({ ...commonProps, width: 50, height: 50 });
        break;
      case "star":
        newShape = new fabric.Polygon([
          { x: 0, y: -25 }, { x: 7, y: -10 }, { x: 24, y: -8 },
          { x: 12, y: 5 }, { x: 15, y: 22 }, { x: 0, y: 15 },
          { x: -15, y: 22 }, { x: -12, y: 5 }, { x: -24, y: -8 },
          { x: -7, y: -10 }
        ], { ...commonProps });
        break;
      case "heart":
        const heartPath = "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";
        newShape = new fabric.Path(heartPath, { ...commonProps, scaleX: 1.5, scaleY: 1.5, fill: "#000000" });
        break;
      case "line":
        newShape = new fabric.Line([-30, 0, 30, 0], { ...commonProps, stroke: "#000000", strokeWidth: 4, fill: null as any });
        break;
      default:
        return;
    }

    canvas.add(newShape);
    canvas.setActiveObject(newShape);
    canvas.renderAll();
  };

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

  const handleDelete = () => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (canvas && obj && obj.name !== "productMockup" && obj.name !== "printArea") {
      canvas.remove(obj);
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  };

  const handleDuplicate = () => {
    if (!checkProLimit()) return;
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (canvas && obj) {
      obj.clone((cloned: any) => {
        cloned.set({
          left: (obj.left || 0) + 20,
          top: (obj.top || 0) + 20,
          id: Math.random().toString(36).substring(7)
        });
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.renderAll();
      });
    }
  };

  const handleBringForward = () => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (canvas && obj) {
      canvas.bringForward(obj);
      canvas.renderAll();
      updateLayersList();
    }
  };

  const handleSendBackward = () => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (canvas && obj) {
      // Don't send behind the template/print area
      const idx = canvas.getObjects().indexOf(obj);
      // usually system objects are at index 0..3
      canvas.sendBackwards(obj);
      canvas.renderAll();
      updateLayersList();
    }
  };

  const handleSetOpacity = (val: number) => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (canvas && obj) {
      obj.set("opacity", val);
      setOpacity(val);
      canvas.renderAll();
    }
  };

  const handleFlipH = () => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (canvas && obj) {
      obj.set("flipX", !obj.flipX);
      canvas.renderAll();
    }
  };

  const handleFlipV = () => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (canvas && obj) {
      obj.set("flipY", !obj.flipY);
      canvas.renderAll();
    }
  };

  const handleSetStrokeWeight = (val: number) => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (canvas && obj) {
      obj.set("strokeWidth", val);
      setStrokeWeight(val);
      canvas.renderAll();
    }
  };

  const handleSetStrokeColor = (color: string) => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (canvas && obj) {
      obj.set("stroke", color);
      setStrokeColor(color);
      canvas.renderAll();
    }
  };

  const handleSetShadowBlur = (val: number) => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (canvas && obj) {
      if (val === 0) {
        obj.set("shadow", null);
      } else {
        obj.set("shadow", new fabric.Shadow({
          color: "rgba(0,0,0,0.5)",
          blur: val,
          offsetX: 4,
          offsetY: 4
        }));
      }
      setShadowBlur(val);
      canvas.renderAll();
    }
  };

  const handleToggleLayer = (id: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const el = canvasElements.find(e => e.id === id);
    if (el && el.obj) {
      el.obj.set("visible", !el.visible);
      canvas.renderAll();
      updateLayersList();
    }
  };

  const handleReorderLayer = (id: string, direction: "up" | "down") => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const el = canvasElements.find(e => e.id === id);
    if (el && el.obj) {
      if (direction === "up") canvas.bringForward(el.obj);
      else canvas.sendBackwards(el.obj);
      canvas.renderAll();
      updateLayersList();
    }
  };

  const handleSaveClick = useCallback(() => {
    if (!canvasRef.current) return;
    const historyStr = localStorage.getItem(`designMatch_history_${user?.id}`) || "[]";
    const historyItems = JSON.parse(historyStr) as any[];

    const loadId = searchParams.get("loadId");
    const existingDesign = loadId ? historyItems.find(d => d.id === loadId) : null;

    if (!existingDesign && historyItems.length >= (isProUser() ? 20 : 3)) {
      setShowSubscription(true);
      return;
    }

    const defaultName = existingDesign ? existingDesign.name : `Design ${Date.now().toString().slice(-4)}`;
    setCurrentSaveName(defaultName);
    setShowSaveModal(true);
  }, [searchParams, user?.id]);

  const confirmSave = useCallback((finalName: string) => {
    if (!canvasRef.current) return;
    setShowSaveModal(false);

    try {
      const historyStr = localStorage.getItem(`designMatch_history_${user?.id}`) || "[]";
      let historyItems = JSON.parse(historyStr) as any[];

      const loadId = searchParams.get("loadId");
      const existingDesign = loadId ? historyItems.find(d => d.id === loadId) : null;

      const designName = finalName.trim() || (existingDesign ? existingDesign.name : `Design ${Date.now().toString().slice(-4)}`);
      const finalSaveId = loadId || Date.now().toString();

      const gridLines = canvasRef.current.getObjects().filter(o => o.name && o.name.startsWith("gridLine"));
      gridLines.forEach(l => l.set("visible", false));

      const thumbnail = canvasRef.current.toDataURL({ format: "jpeg", quality: 0.8, multiplier: 1 });

      gridLines.forEach(l => l.set("visible", true));

      const activeTemplateId = templateId || (existingDesign ? existingDesign.templateId : "custom");

      const meta = {
        id: finalSaveId,
        name: designName,
        date: new Date().toLocaleDateString(),
        thumbnail,
        templateId: activeTemplateId,
        activeView
      };

      if (existingDesign) {
        historyItems = historyItems.map(d => d.id === finalSaveId ? meta : d);
      } else {
        historyItems.unshift(meta);
      }

      localStorage.setItem(`designMatch_history_${user?.id}`, JSON.stringify(historyItems));

      const json = canvasRef.current.toJSON(["name", "opacity", "selectable", "evented"]);
      localStorage.setItem(`designMatch_saved_${finalSaveId}_${user?.id}`, JSON.stringify(json));

      if (!loadId) {
        const newParams = new URLSearchParams(searchParams);
        newParams.set("loadId", finalSaveId);
        setSearchParams(newParams, { replace: true });
      }

      toast.success("Design saved successfully! View it in your Account.", {
        description: "Your design has been added to History.",
      });
    } catch (err) { console.error(err); }
  }, [templateId, activeView, searchParams, setSearchParams, user?.id]);

  const handleExport = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isPro = isProUser();
    const exportMult = isPro ? 6 : 2; // 2400px vs 800px approx

    const gridLines = canvas.getObjects().filter(o => o.name && o.name.startsWith("gridLine"));
    gridLines.forEach(l => l.set("visible", false));

    let watermark: fabric.Text | null = null;
    if (!isPro) {
      watermark = new fabric.Text("DesignMatch Free", {
        left: 179, top: 400, originX: "center", fontSize: 24, fill: "rgba(255,255,255,0.4)",
        fontWeight: "bold", evented: false, selectable: false, name: "watermark"
      });
      canvas.add(watermark);
    }

    canvas.renderAll();
    const dataUrl = canvas.toDataURL({ format: "png", multiplier: exportMult });

    if (watermark) canvas.remove(watermark);
    gridLines.forEach(l => l.set("visible", true));
    canvas.renderAll();

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `designmatch-${Date.now()}.png`;
    a.click();
  }, []);

  const handleLookup = useCallback(async () => {
    if (!canvasRef.current || isSearching) return;

    // Check lookup limit for free users
    // Check lookup limit for free users using central service
    if (!isProUser() && user?.id) {
      const stats = getLookupStats(user.id);
      if (stats.limitReached) {
        setShowSubscription(true);
        toast.error("Lookup limit reached. Upgrade to Pro for unlimited searches!", {
          description: "Free limits refresh every 3 days."
        });
        return;
      }
    }

    setIsSearching(true);
    setShowResults(false);
    try {
      const minScanTime = new Promise(resolve => setTimeout(resolve, 2500));
      // Export at reduced size/quality to keep payload small for the edge function
      const dataUrl = canvasRef.current.toDataURL({ format: "jpeg", quality: 0.6, multiplier: 0.5 });

      let realMatches: ProductResult[] = [];

      try {
        const [apiResponse] = await Promise.all([
          supabase.functions.invoke("visual-search", { body: { image: dataUrl } }),
          minScanTime
        ]);
        const { data, error } = apiResponse;
        if (error) {
          console.error("Supabase edge function error:", error);
          toast.error("Visual Search Error: " + error.message);
        } else if (data?.error) {
          console.error("API Search Error:", data.error);
          toast.error("API Error: " + data.error);
        } else {
          realMatches = data?.results || [];
        }
      } catch (apiErr: any) {
        console.error("API call failed:", apiErr);
        await minScanTime;
        toast.error("Network Error: Failed to contact the visual search server.");
      }

      if (realMatches.length === 0) {
        setIsSearching(false);
        toast.error("Visual search returned no matches. Try a different design.");
        return;
      }

      setResults(realMatches.slice(0, 24));
      setShowResults(true);

      // Increment lookup counters using central service
      if (user?.id) {
        incrementLookup(user.id);
      }
    } catch (err) {
      console.error("Lookup Failed:", err);
      toast.error("Lookup failed. Please try again.");
    }
    finally { setIsSearching(false); }
  }, [isSearching, backgroundUrl, templateColor, user?.id]);

  const handleCanvasReady = useCallback(() => {
    // Check for autoLookup (Upload Design flow)
    if (autoLookup && uploadDataUrl && !isSearching) {
      handleLookup();
      localStorage.removeItem("designMatchUpload");
    }
  }, [autoLookup, uploadDataUrl, isSearching, handleLookup]);

  useEffect(() => {
    if (localStorage.getItem(`designMatch_showProAfterLogin_${user?.id}`) === "true") {
      setShowSubscription(true);
      localStorage.removeItem(`designMatch_showProAfterLogin_${user?.id}`);
    }
  }, [user?.id]);

  const checkProLimit = () => {
    // Always allow all features for demo
    return true;
  };

  const handleAddText = () => {
    if (!checkProLimit()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const text = new fabric.IText("Your Text", {
      left: 179, top: 200, originX: "center", originY: "center",
      fontSize: 24, fontFamily: "Inter, sans-serif", fill: "#000000", fontWeight: "bold",
      cornerColor: "#000", cornerStrokeColor: "#fff", borderColor: "#000", cornerSize: 10, transparentCorners: false, name: "userText",
    });
    canvas.add(text); canvas.setActiveObject(text); canvas.renderAll();
  };

  const handleUploadImage = () => {
    if (!checkProLimit()) return;
    fileInputRef.current?.click();
  };

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
      }, { crossOrigin: "anonymous" });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };



  const toolbarControls = { layoutMode, setLayoutMode, showPrintArea, setShowPrintArea, activeView, setActiveView };

  return (
    <PhoneFrame>
      <HeaderBar
        onLookup={handleLookup} isSearching={isSearching} onExit={() => navigate("/")}
        onSave={handleSaveClick}
        onUndo={handleUndo} onRedo={handleRedo}
        canUndo={undoStack.length > 0} canRedo={redoStack.length > 0}
      />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden bg-black">

        {/* Floating Context Toolbar */}
        <FloatingContextBar
          position={contextBarPos}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onBringForward={handleBringForward}
          onSendBackward={handleSendBackward}
        />

        <CanvasEditor canvasRef={canvasRef} backgroundUrl={backgroundUrl} logoUrl={activeView === "front" ? logoUrl : undefined}
          templateColor={templateColor} showBg={showBg} savedState={savedState} layoutMode={layoutMode}
          showPrintArea={showPrintArea} activeView={activeView} isCustomTemplate={customTemplate}
          zoom={zoom} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onReady={handleCanvasReady} />

        <ViewTabs activeView={activeView} onViewChange={setActiveView} />
      </div>

      <PropertiesBar
        hasSelection={hasSelection} opacity={opacity} setOpacity={handleSetOpacity}
        onFlipH={handleFlipH} onFlipV={handleFlipV} onRequirePro={() => setShowSubscription(true)}
      />

      <BottomToolbar
        activeSheet={activeBottomSheet} onOpenSheet={setActiveBottomSheet}
        onUploadImage={handleUploadImage}
        onRequirePro={() => setShowSubscription(true)}
      />

      <StudioBottomSheet
        activeSheet={activeBottomSheet} onClose={() => setActiveBottomSheet(null)}
        onAddText={(font) => {
          if (!checkProLimit()) return;
          const canvas = canvasRef.current;
          const text = new fabric.IText("Your Text", {
            left: 179, top: 200, originX: "center", originY: "center",
            fontSize: 32, fontFamily: font, fill: "#000000", fontWeight: "bold",
            cornerColor: "#000", cornerStrokeColor: "#fff", borderColor: "#000", cornerSize: 10, transparentCorners: false, name: "userText",
          });
          canvas?.add(text); canvas?.setActiveObject(text); canvas?.renderAll();
        }}
        onAddShape={handleAddShape}
        templateColor={templateColor} setTemplateColor={setTemplateColor}
        canvasElements={canvasElements} onToggleLayerVisibility={handleToggleLayer}
        onReorderLayer={handleReorderLayer} onRequirePro={() => setShowSubscription(true)}
        strokeWeight={strokeWeight} setStrokeWeight={handleSetStrokeWeight}
        strokeColor={strokeColor} setStrokeColor={handleSetStrokeColor}
        shadowBlur={shadowBlur} setShadowBlur={handleSetShadowBlur}
      />

      {/* Overlays and Modals */}
      <AnimatePresence>{isSearching && <ScanOverlay />}</AnimatePresence>
      <ResultsDrawer open={showResults} onClose={() => setShowResults(false)} results={results} />
      <PaymentModal open={showSubscription} onClose={() => setShowSubscription(false)} onSuccess={() => setShowSubscription(false)} />

      {/* Custom Save Form Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-black border border-[#222] p-6 rounded-2xl w-full max-w-[320px] shadow-2xl flex flex-col gap-4"
            >
              <h2 className="text-white text-lg font-bold">Save Design</h2>
              <p className="text-white/50 text-sm">Enter a new name for your design? (Optional)</p>
              <input
                type="text"
                value={currentSaveName}
                onChange={(e) => setCurrentSaveName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && confirmSave(currentSaveName)}
                placeholder="Design Name"
                autoFocus
                className="bg-[#111] border border-[#333] text-white px-4 py-3 rounded-xl outline-none focus:border-white/50 transition-colors"
                maxLength={30}
              />
              <div className="flex items-center gap-3 mt-2">
                <button onClick={() => setShowSaveModal(false)} className="flex-1 py-3 rounded-xl bg-transparent border border-[#333] text-white/70 font-semibold hover:bg-[#111] hover:text-white transition-colors">
                  Cancel
                </button>
                <button onClick={() => confirmSave(currentSaveName)} className="flex-1 py-3 rounded-xl bg-white text-black font-bold active:scale-95 transition-transform hover:bg-[#EEE]">
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PhoneFrame>
  );
};

export default Studio;
