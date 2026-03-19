import {
  Trash2, Crown, Copy, SquareArrowUp, SquareArrowDown,
  AlignCenter, FlipHorizontal, FlipVertical,
  LayoutTemplate, Grid, Grid3X3, Shirt, Frame,
  Type, ImagePlus, Square, Circle, Triangle, Eye, EyeOff, Lock, Unlock,
  Type as FontIcon, BoxSelect, ChevronDown, ChevronUp, Layers,
  Undo2, Redo2, ZoomIn, ZoomOut, Trash, X
} from "lucide-react";
import { useState, useEffect } from "react";
import { fabric } from "fabric";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { StyledSlider } from "@/components/ui/StyledSlider";
import { isProUser } from "@/services/proService";

interface BottomToolbarProps {
  canvasRef: React.MutableRefObject<fabric.Canvas | null>;
  controls: {
    layoutMode: boolean;
    setLayoutMode: React.Dispatch<React.SetStateAction<boolean>>;
    showPrintArea: boolean;
    setShowPrintArea: React.Dispatch<React.SetStateAction<boolean>>;
    showGrid: boolean;
    setShowGrid: React.Dispatch<React.SetStateAction<boolean>>;
    snapToGrid: boolean;
    setSnapToGrid: React.Dispatch<React.SetStateAction<boolean>>;
    activeView: "front" | "back";
    setActiveView: React.Dispatch<React.SetStateAction<"front" | "back">>;
  };
  showBg: boolean;
  onToggleBg: () => void;
  onAddText: () => void;
  onUploadImage: () => void;
  onAddShape: (shape: "rect" | "circle" | "triangle") => void;
  onSubscribe: () => void;
  onRequirePro: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onClearAll: () => void;
  onToggleLayers: () => void;
  modalOpen?: boolean;
}

const FONTS = ["Inter", "Arial", "Courier New", "Georgia", "Impact", "Comic Sans MS", "Trebuchet MS", "Verdana"];

const BottomToolbar = ({
  canvasRef, controls, showBg, onToggleBg, onAddText, onUploadImage, onAddShape,
  onSubscribe, onRequirePro, onUndo, onRedo, canUndo, canRedo,
  zoom, onZoomIn, onZoomOut, onClearAll, onToggleLayers, modalOpen
}: BottomToolbarProps) => {
  const [hasSelection, setHasSelection] = useState(false);
  const [isText, setIsText] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const [opacity, setOpacity] = useState<number>(1);
  const [angle, setAngle] = useState<number>(0);
  const [isLocked, setIsLocked] = useState(false);
  const [fontIndex, setFontIndex] = useState(0);
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [hasShadow, setHasShadow] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSelection = () => {
      const activeObj = canvas.getActiveObject();
      const systemNames = ["printArea", "productMockup", "colorTint", "productColor"];
      const hasValidSelection = !!activeObj && !systemNames.includes(activeObj.name || "") && !activeObj.name?.startsWith("gridLine");

      setHasSelection(hasValidSelection);
      if (hasValidSelection && activeObj) {
        setIsText(activeObj.type === "i-text" || activeObj.type === "text");
        setOpacity(activeObj.opacity ?? 1);
        setAngle(activeObj.angle ?? 0);
        setIsLocked(activeObj.lockMovementX === true);
        setStrokeWidth(activeObj.strokeWidth || 0);
        setStrokeColor(activeObj.stroke as string || "#000000");
        setHasShadow(!!activeObj.shadow);
        if (activeObj.type === "i-text" || activeObj.type === "text") {
          const textObj = activeObj as fabric.IText;
          const fIndex = FONTS.findIndex(f => f.toLowerCase() === (textObj.fontFamily || "").toLowerCase());
          setFontIndex(fIndex >= 0 ? fIndex : 0);
        }
      }
    };

    canvas.on("selection:created", updateSelection);
    canvas.on("selection:updated", updateSelection);
    canvas.on("selection:cleared", updateSelection);
    canvas.on("object:modified", updateSelection);
    return () => {
      canvas.off("selection:created", updateSelection);
      canvas.off("selection:updated", updateSelection);
      canvas.off("selection:cleared", updateSelection);
      canvas.off("object:modified", updateSelection);
    };
  }, [canvasRef]);

  const activeOp = (fn: (obj: fabric.Object, canvas: fabric.Canvas) => void) => () => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (canvas && obj) fn(obj, canvas);
  };

  const alignCenter = activeOp((obj, canvas) => { obj.set({ left: 179, top: 220 }); obj.setCoords(); canvas.renderAll(); });
  const duplicate = activeOp((obj, canvas) => {
    obj.clone((cloned: fabric.Object) => {
      cloned.set({ left: (obj.left || 0) + 20, top: (obj.top || 0) + 20, name: "designLogo" });
      canvas.add(cloned); canvas.setActiveObject(cloned); canvas.renderAll();
    });
  });
  const bringForward = activeOp((obj, canvas) => { canvas.bringForward(obj); canvas.renderAll(); });
  const sendBackwards = activeOp((obj, canvas) => { canvas.sendBackwards(obj); canvas.renderAll(); });
  const deleteObj = activeOp((obj, canvas) => { canvas.remove(obj); canvas.discardActiveObject(); canvas.renderAll(); });
  const flipH = activeOp((obj, canvas) => { obj.set('flipX', !obj.flipX); canvas.renderAll(); });
  const flipV = activeOp((obj, canvas) => { obj.set('flipY', !obj.flipY); canvas.renderAll(); });

  const toggleLock = activeOp((obj, canvas) => {
    const lockState = !obj.lockMovementX;
    obj.set({ lockMovementX: lockState, lockMovementY: lockState, lockRotation: lockState, lockScalingX: lockState, lockScalingY: lockState, hasControls: !lockState, borderColor: lockState ? 'red' : '#000' });
    setIsLocked(lockState); canvas.renderAll();
    toast.success(lockState ? "Layer Locked" : "Layer Unlocked");
  });

  const handleOpacityChange = (value: number[]) => {
    const canvas = canvasRef.current; const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    obj.set({ opacity: value[0] }); setOpacity(value[0]); canvas.renderAll();
  };
  const handleRotateChange = (value: number[]) => {
    const canvas = canvasRef.current; const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    obj.rotate(value[0]); setAngle(value[0]); canvas.renderAll();
  };
  const handleStrokeWidthChange = (value: number[]) => {
    const canvas = canvasRef.current; const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    obj.set({ strokeWidth: value[0], stroke: strokeColor }); setStrokeWidth(value[0]); canvas.renderAll();
  };
  const handleStrokeColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const canvas = canvasRef.current; const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    obj.set({ stroke: e.target.value, strokeWidth: strokeWidth > 0 ? strokeWidth : 2 });
    if (strokeWidth === 0) setStrokeWidth(2);
    setStrokeColor(e.target.value); canvas.renderAll();
  };
  const toggleShadow = activeOp((obj, canvas) => {
    const ns = !hasShadow;
    obj.set("shadow", ns ? new fabric.Shadow({ color: "rgba(0,0,0,0.5)", blur: 10, offsetX: 5, offsetY: 5 }) : null);
    setHasShadow(ns); canvas.renderAll();
  });
  const cycleFont = activeOp((obj, canvas) => {
    if (obj.type !== "i-text" && obj.type !== "text") return;
    const ni = (fontIndex + 1) % FONTS.length;
    (obj as fabric.IText).set("fontFamily", FONTS[ni]);
    setFontIndex(ni); canvas.renderAll();
  });

  // Pro gate wrapper
  const proGate = (action: () => void) => () => {
    if (!isProUser()) { onRequirePro(); return; }
    action();
  };

  if (modalOpen) return null; // Hide toolbar when modals are open

  const ToolBtn = ({ onClick, icon: Icon, label, active, className }: { onClick: () => void; icon: any; label: string; active?: boolean; className?: string }) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-0.5 shrink-0 px-2 py-1 rounded-xl transition-colors cursor-pointer ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"} ${className || ""}`}>
      <Icon size={16} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  const ProToolBtn = ({ onClick, icon: Icon, label, active }: { onClick: () => void; icon: any; label: string; active?: boolean }) => (
    <div className="relative shrink-0">
      <button onClick={proGate(onClick)} className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors cursor-pointer ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
        <Icon size={16} />
        <span className="text-[10px] font-medium">{label}</span>
      </button>
      {!isProUser() && <Crown size={8} className="absolute -top-1 -right-0.5 text-yellow-500" />}
    </div>
  );

  return (
    <div className="flex flex-col bg-background/80 backdrop-blur-xl border-t border-foreground/10 shadow-sm relative z-50 transition-all duration-200">

      {/* Chevron Toggle */}
      <button onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-5 flex items-center justify-center bg-background/80 backdrop-blur-xl border-t border-x border-foreground/10 rounded-t-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
        {isExpanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex flex-col overflow-hidden">

            {/* Row 1: Creative Tools + Utility */}
            <div className="flex items-center gap-1 px-3 py-1.5 border-b border-foreground/5 bg-foreground/[0.03] flex-wrap">
              <ToolBtn onClick={onAddText} icon={Type} label="Text" />
              <ToolBtn onClick={onUploadImage} icon={ImagePlus} label="Image" />
              <ToolBtn onClick={() => onAddShape("rect")} icon={Square} label="Rect" />
              <ToolBtn onClick={() => onAddShape("circle")} icon={Circle} label="Circle" />
              <ToolBtn onClick={() => onAddShape("triangle")} icon={Triangle} label="Triangle" />
              <div className="w-px h-5 bg-border mx-0.5 shrink-0" />
              <ToolBtn onClick={onToggleBg} icon={showBg ? Eye : EyeOff} label={showBg ? "BG On" : "BG Off"} active={showBg} />
              <ToolBtn onClick={onToggleLayers} icon={Layers} label="Layers" />
              <ToolBtn onClick={onClearAll} icon={Trash} label="Clear" />
            </div>

            {hasSelection ? (
              <>
                {/* Row 2: Properties */}
                <div className="flex items-center gap-4 px-3 py-2 overflow-x-auto border-b border-foreground/5 hide-scrollbar">
                  {/* Free: Opacity */}
                  <div className="flex flex-col gap-0.5 w-[72px] shrink-0">
                    <span className="text-[9px] text-muted-foreground font-medium flex justify-between">Opacity <span>{Math.round(opacity * 100)}%</span></span>
                    <StyledSlider value={[opacity]} min={0} max={1} step={0.05} onValueChange={handleOpacityChange} />
                  </div>
                  {/* Free: Rotate */}
                  <div className="flex flex-col gap-0.5 w-[72px] shrink-0">
                    <span className="text-[9px] text-muted-foreground font-medium flex justify-between">Rotate <span>{Math.round(angle)}°</span></span>
                    <StyledSlider value={[angle]} min={-180} max={180} step={1} onValueChange={handleRotateChange} />
                  </div>
                  {/* Pro: Stroke */}
                  <div className="relative shrink-0">
                    {!isProUser() && <div className="absolute inset-0 z-10 cursor-pointer" onClick={onRequirePro} />}
                    <div className="flex items-center gap-1.5 border border-foreground/10 rounded-lg p-1">
                      {!isProUser() && <Crown size={8} className="absolute -top-1.5 -right-1.5 text-yellow-500 z-20" />}
                      <div className="flex flex-col gap-0.5 w-[52px]">
                        <span className="text-[9px] text-muted-foreground font-medium">Stroke</span>
                        <StyledSlider value={[strokeWidth]} min={0} max={20} step={1} onValueChange={handleStrokeWidthChange} />
                      </div>
                      <label className="relative cursor-pointer w-5 h-5 rounded-full border border-foreground/20 overflow-hidden shrink-0" style={{ backgroundColor: strokeColor }}>
                        <input type="color" value={strokeColor} onChange={handleStrokeColorChange} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                      </label>
                    </div>
                  </div>
                  {/* Pro: Font */}
                  {isText && (
                    <div className="relative shrink-0">
                      {!isProUser() && <div className="absolute inset-0 z-10 cursor-pointer" onClick={onRequirePro} />}
                      <button onClick={isProUser() ? cycleFont : undefined} className="flex items-center gap-1 bg-secondary/30 hover:bg-secondary/60 rounded-lg px-2 py-1 transition-colors border border-foreground/10 text-xs">
                        {!isProUser() && <Crown size={8} className="absolute -top-1.5 -right-1.5 text-yellow-500 z-20" />}
                        <FontIcon size={12} className="text-primary" />
                        <span className="font-medium truncate max-w-[70px]">{FONTS[fontIndex]}</span>
                      </button>
                    </div>
                  )}
                  {/* Pro: Shadow */}
                  <div className="relative shrink-0">
                    {!isProUser() && <div className="absolute inset-0 z-10 cursor-pointer" onClick={onRequirePro} />}
                    <button onClick={isProUser() ? toggleShadow : undefined} className={`flex items-center gap-1 rounded-lg px-2 py-1 transition-colors border text-xs ${hasShadow ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-secondary/30 border-foreground/10 text-muted-foreground'}`}>
                      {!isProUser() && <Crown size={8} className="absolute -top-1.5 -right-1.5 text-yellow-500 z-20" />}
                      <BoxSelect size={12} />
                      <span className="font-medium">Shadow</span>
                    </button>
                  </div>
                </div>

                {/* Row 3: Actions */}
                <div className="flex items-center gap-1 px-3 py-1.5 border-b border-foreground/5 flex-wrap">
                  <ToolBtn onClick={deleteObj} icon={Trash2} label="Delete" className="text-muted-foreground hover:text-destructive" />
                  <ToolBtn onClick={duplicate} icon={Copy} label="Copy" />
                  <ToolBtn onClick={alignCenter} icon={AlignCenter} label="Center" />
                  <ProToolBtn onClick={flipH} icon={FlipHorizontal} label="Flip H" />
                  <ProToolBtn onClick={flipV} icon={FlipVertical} label="Flip V" />
                  <ToolBtn onClick={toggleLock} icon={isLocked ? Lock : Unlock} label={isLocked ? "Unlock" : "Lock"} active={isLocked} />
                  <ProToolBtn onClick={bringForward} icon={SquareArrowUp} label="Up" />
                  <ProToolBtn onClick={sendBackwards} icon={SquareArrowDown} label="Down" />
                </div>
              </>
            ) : (
              /* Global Settings */
              <div className="flex items-center gap-1 px-3 py-1.5 border-b border-foreground/5 flex-wrap">
                <ToolBtn onClick={() => controls.setActiveView(v => v === "front" ? "back" : "front")} icon={Shirt} label={controls.activeView === "front" ? "Front" : "Back"} active={controls.activeView === "back"} />
                <ToolBtn onClick={() => controls.setLayoutMode(!controls.layoutMode)} icon={LayoutTemplate} label="Clamp" active={controls.layoutMode} />
                <ToolBtn onClick={() => controls.setShowPrintArea(!controls.showPrintArea)} icon={Frame} label="Print" active={controls.showPrintArea} />
                <ToolBtn onClick={() => controls.setShowGrid(!controls.showGrid)} icon={Grid} label="Grid" active={controls.showGrid} />
                <ToolBtn onClick={() => controls.setSnapToGrid(!controls.snapToGrid)} icon={Grid3X3} label="Snap" active={controls.snapToGrid} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pinned bottom: Undo/Redo + Zoom + Pro */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-foreground/5 bg-background/50">
        <div className="flex items-center gap-1">
          <button onClick={onUndo} disabled={!canUndo} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer"><Undo2 size={14} /></button>
          <button onClick={onRedo} disabled={!canRedo} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer"><Redo2 size={14} /></button>
          <div className="w-px h-4 bg-border mx-1" />
          <button onClick={onZoomOut} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"><ZoomOut size={14} /></button>
          <span className="text-[10px] text-muted-foreground font-mono w-8 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={onZoomIn} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"><ZoomIn size={14} /></button>
        </div>
        <button onClick={onSubscribe}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary px-2.5 py-1 rounded-full bg-primary/5 border border-primary/40 active:scale-95 transition-transform cursor-pointer">
          <Crown size={12} />
          <span>Upgrade to Pro</span>
        </button>
      </div>
    </div>
  );
};

export default BottomToolbar;
