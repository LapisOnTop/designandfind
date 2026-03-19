import {
  Trash2, Crown, Copy, SquareArrowUp, SquareArrowDown,
  AlignCenter, Droplet, Eraser, FlipHorizontal, FlipVertical,
  RotateCw, Maximize, LayoutTemplate, Grid, Grid3X3, Shirt, Frame,
  Type, ImagePlus, Square, Circle, Triangle, Eye, EyeOff, Lock, Unlock,
  PaintBucket, Type as FontIcon, BoxSelect, ChevronDown, ChevronUp
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
}

const FONTS = ["Inter", "Arial", "Courier New", "Georgia", "Impact", "Comic Sans MS", "Trebuchet MS", "Verdana"];

const BottomToolbar = ({ canvasRef, controls, showBg, onToggleBg, onAddText, onUploadImage, onAddShape, onSubscribe, onRequirePro }: BottomToolbarProps) => {
  const [hasSelection, setHasSelection] = useState(false);
  const [isText, setIsText] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Object properties state
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
      const hasValidSelection = !!activeObj && activeObj.name !== "printArea" && !activeObj.name?.startsWith("gridLine") && activeObj.name !== "productMockup" && activeObj.name !== "colorTint" && activeObj.name !== "productColor";

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

  const alignCenter = activeOp((obj, canvas) => {
    obj.set({ left: 358 / 2, top: 440 / 2 - 20 });
    obj.setCoords();
    canvas.renderAll();
  });

  const duplicate = activeOp((obj, canvas) => {
    obj.clone((cloned: fabric.Object) => {
      cloned.set({ left: (obj.left || 0) + 20, top: (obj.top || 0) + 20, name: "designLogo" });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
    });
  });

  const bringForward = activeOp((obj, canvas) => { canvas.bringForward(obj); canvas.renderAll(); });
  const sendBackwards = activeOp((obj, canvas) => { canvas.sendBackwards(obj); canvas.renderAll(); });
  const deleteObj = activeOp((obj, canvas) => { canvas.remove(obj); canvas.discardActiveObject(); canvas.renderAll(); });

  const flipH = activeOp((obj, canvas) => { obj.set('flipX', !obj.flipX); canvas.renderAll(); });
  const flipV = activeOp((obj, canvas) => { obj.set('flipY', !obj.flipY); canvas.renderAll(); });

  const toggleLock = activeOp((obj, canvas) => {
    const lockState = !obj.lockMovementX;
    obj.set({
      lockMovementX: lockState,
      lockMovementY: lockState,
      lockRotation: lockState,
      lockScalingX: lockState,
      lockScalingY: lockState,
      hasControls: !lockState,
      borderColor: lockState ? 'red' : '#000',
    });
    setIsLocked(lockState);
    canvas.renderAll();
    toast.success(lockState ? "Layer Locked" : "Layer Unlocked");
  });

  const handleOpacityChange = (value: number[]) => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    const next = value[0];
    obj.set({ opacity: next });
    setOpacity(next);
    canvas.renderAll();
  };

  const handleRotateChange = (value: number[]) => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    const next = value[0];
    obj.rotate(next);
    setAngle(next);
    canvas.renderAll();
  };

  const handleStrokeWidthChange = (value: number[]) => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    const next = value[0];
    obj.set({ strokeWidth: next, stroke: strokeColor });
    setStrokeWidth(next);
    canvas.renderAll();
  };

  const handleStrokeColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    const color = e.target.value;
    obj.set({ stroke: color, strokeWidth: strokeWidth > 0 ? strokeWidth : 2 });
    if (strokeWidth === 0) setStrokeWidth(2);
    setStrokeColor(color);
    canvas.renderAll();
  };

  const toggleShadow = activeOp((obj, canvas) => {
    const newShadowState = !hasShadow;
    if (newShadowState) {
      obj.set("shadow", new fabric.Shadow({
        color: "rgba(0,0,0,0.5)",
        blur: 10,
        offsetX: 5,
        offsetY: 5,
      }));
    } else {
      obj.set("shadow", null);
    }
    setHasShadow(newShadowState);
    canvas.renderAll();
  });

  const cycleFont = activeOp((obj, canvas) => {
    if (obj.type !== "i-text" && obj.type !== "text") return;
    const nextIndex = (fontIndex + 1) % FONTS.length;
    (obj as fabric.IText).set("fontFamily", FONTS[nextIndex]);
    setFontIndex(nextIndex);
    canvas.renderAll();
  });

  return (
    <div className="flex flex-col bg-background/50 backdrop-blur-3xl border-t border-foreground/10 shadow-[0_-4px_30px_rgba(0,0,0,0.1)] relative z-50 liquid-panel transition-all duration-300">

      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-6 flex items-center justify-center bg-background/50 backdrop-blur-3xl border-t border-x border-foreground/10 rounded-t-xl text-muted-foreground hover:text-foreground"
      >
        {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex flex-col overflow-hidden"
          >
            {/* CREATIVE TOOLS ROW */}
            <div className="flex items-center gap-4 px-4 py-2 overflow-x-auto border-b border-foreground/5 hide-scrollbar scroll-smooth bg-foreground/5 backdrop-blur-md">
              <button onClick={onAddText} className="flex flex-col items-center gap-1 shrink-0 text-muted-foreground hover:text-foreground liquid-button rounded-xl p-1 px-2">
                <Type size={16} />
                <span className="text-[10px]">Text</span>
              </button>
              <button onClick={onUploadImage} className="flex flex-col items-center gap-1 shrink-0 text-muted-foreground hover:text-foreground liquid-button rounded-xl p-1 px-2">
                <ImagePlus size={16} />
                <span className="text-[10px]">Image</span>
              </button>
              <div className="w-px h-6 bg-border mx-1 shrink-0" />
              <button onClick={() => onAddShape("rect")} className="flex flex-col items-center gap-1 shrink-0 text-muted-foreground hover:text-foreground liquid-button rounded-xl p-1 px-2">
                <Square size={16} />
                <span className="text-[10px]">Rect</span>
              </button>
              <button onClick={() => onAddShape("circle")} className="flex flex-col items-center gap-1 shrink-0 text-muted-foreground hover:text-foreground liquid-button rounded-xl p-1 px-2">
                <Circle size={16} />
                <span className="text-[10px]">Circle</span>
              </button>
              <button onClick={() => onAddShape("triangle")} className="flex flex-col items-center gap-1 shrink-0 text-muted-foreground hover:text-foreground liquid-button rounded-xl p-1 px-2">
                <Triangle size={16} />
                <span className="text-[10px]">Triangle</span>
              </button>
              <div className="w-px h-6 bg-border mx-1 shrink-0" />
              <button onClick={onToggleBg} className={`flex flex-col items-center gap-1 shrink-0 liquid-button rounded-xl p-1 px-2 ${showBg ? "text-primary" : "text-muted-foreground"}`}>
                {showBg ? <Eye size={16} /> : <EyeOff size={16} />}
                <span className="text-[10px]">{showBg ? "BG On" : "BG Off"}</span>
              </button>
            </div>

            {hasSelection ? (
              <>
                {/* PROPERTIES ROW: Sliders & Color Pickers */}
                <div className="flex items-center gap-6 px-4 py-3 overflow-x-auto border-b border-foreground/5 hide-scrollbar scroll-smooth">

                  {/* Opacity */}
                  <div className="flex flex-col gap-1 w-[80px] shrink-0">
                    <span className="text-[10px] text-muted-foreground font-medium flex justify-between">Opacity <span>{Math.round(opacity * 100)}%</span></span>
                    <StyledSlider value={[opacity]} min={0} max={1} step={0.05} onValueChange={handleOpacityChange} />
                  </div>

                  {/* Rotate */}
                  <div className="flex flex-col gap-1 w-[80px] shrink-0">
                    <span className="text-[10px] text-muted-foreground font-medium flex justify-between">Rotate <span>{Math.round(angle)}°</span></span>
                    <StyledSlider value={[angle]} min={-180} max={180} step={1} onValueChange={handleRotateChange} />
                  </div>

                  {/* Stroke Width & Color */}
                  <div className="relative group shrink-0">
                    {!isProUser() && <div className="absolute inset-0 z-20 cursor-pointer" onClick={onRequirePro} />}
                    <div className={`flex items-center gap-2 border border-foreground/10 rounded-lg p-1 ${!isProUser() ? 'opacity-50 pointer-events-none' : ''}`}>
                      <div className="absolute -top-2 -right-2 bg-background rounded-full p-0.5 shadow-sm border border-border z-30">
                        <Crown size={10} className="text-yellow-500" />
                      </div>
                      <div className="flex flex-col gap-1 w-[60px]">
                        <span className="text-[10px] text-muted-foreground font-medium flex justify-between">Stroke <span>{strokeWidth}px</span></span>
                        <StyledSlider value={[strokeWidth]} min={0} max={20} step={1} onValueChange={handleStrokeWidthChange} />
                      </div>
                      <label className="relative cursor-pointer w-6 h-6 rounded-full border border-foreground/20 overflow-hidden shrink-0 ml-1" style={{ backgroundColor: strokeColor }}>
                        <input type="color" value={strokeColor} onChange={handleStrokeColorChange} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                      </label>
                    </div>
                  </div>

                  {/* Font Picker */}
                  {isText && (
                    <div className="relative group shrink-0">
                      {!isProUser() && <div className="absolute inset-0 z-20 cursor-pointer" onClick={onRequirePro} />}
                      <button onClick={isProUser() ? cycleFont : undefined} className={`flex items-center gap-1.5 bg-secondary/30 hover:bg-secondary/60 rounded-lg px-3 py-1.5 transition-colors border border-foreground/10 ${!isProUser() ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="absolute -top-2 -right-2 bg-background rounded-full p-0.5 shadow-sm border border-border z-30">
                          <Crown size={10} className="text-yellow-500" />
                        </div>
                        <FontIcon size={14} className="text-primary" />
                        <span className="text-xs font-medium truncate max-w-[80px]">{FONTS[fontIndex]}</span>
                      </button>
                    </div>
                  )}

                  {/* Shadow Toggle */}
                  <div className="relative group shrink-0">
                    {!isProUser() && <div className="absolute inset-0 z-20 cursor-pointer" onClick={onRequirePro} />}
                    <button onClick={isProUser() ? toggleShadow : undefined} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors border ${hasShadow ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-secondary/30 hover:bg-secondary/60 border-foreground/10 text-muted-foreground'} ${!isProUser() ? 'opacity-50 pointer-events-none' : ''}`}>
                      <div className="absolute -top-2 -right-2 bg-background rounded-full p-0.5 shadow-sm border border-border z-30">
                        <Crown size={10} className="text-yellow-500" />
                      </div>
                      <BoxSelect size={14} />
                      <span className="text-xs font-medium">Shadow</span>
                    </button>
                  </div>

                </div>

                {/* ACTION BUTTONS ROW */}
                <div className="flex items-center gap-4 px-4 py-2 overflow-x-auto border-b border-foreground/5 hide-scrollbar scroll-smooth">
                  <button onClick={toggleLock} className={`flex flex-col items-center gap-1 shrink-0 ${isLocked ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}`}>
                    {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                    <span className="text-[10px]">{isLocked ? 'Unlock' : 'Lock'}</span>
                  </button>
                  <div className="w-px h-6 bg-border mx-1 shrink-0" />
                  <button onClick={deleteObj} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-destructive shrink-0">
                    <Trash2 size={16} />
                    <span className="text-[10px]">Delete</span>
                  </button>
                  <button onClick={duplicate} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground shrink-0">
                    <Copy size={16} />
                    <span className="text-[10px]">Duplicate</span>
                  </button>
                  <button onClick={alignCenter} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground shrink-0">
                    <AlignCenter size={16} />
                    <span className="text-[10px]">Center</span>
                  </button>
                  <button onClick={flipH} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground shrink-0">
                    <FlipHorizontal size={16} />
                    <span className="text-[10px]">Flip H</span>
                  </button>
                  <button onClick={flipV} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground shrink-0">
                    <FlipVertical size={16} />
                    <span className="text-[10px]">Flip V</span>
                  </button>
                  <button onClick={bringForward} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground shrink-0">
                    <SquareArrowUp size={16} />
                    <span className="text-[10px]">Forward</span>
                  </button>
                  <button onClick={sendBackwards} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground shrink-0">
                    <SquareArrowDown size={16} />
                    <span className="text-[10px]">Backward</span>
                  </button>
                </div>
              </>
            ) : (
              /* GLOBAL SETTINGS ROW (When nothing is selected) */
              <div className="flex items-center gap-4 px-4 py-2 overflow-x-auto border-b border-foreground/5 hide-scrollbar scroll-smooth">
                <button onClick={() => controls.setActiveView(v => v === "front" ? "back" : "front")} className="flex flex-col items-center gap-1 shrink-0 text-muted-foreground hover:text-foreground">
                  <Shirt size={16} className={controls.activeView === "back" ? "text-primary" : ""} />
                  <span className="text-[10px]">{controls.activeView === "front" ? "Front View" : "Back View"}</span>
                </button>
                <div className="w-px h-6 bg-border mx-1 shrink-0" />
                <button onClick={() => controls.setLayoutMode(!controls.layoutMode)} className={`flex flex-col items-center gap-1 shrink-0 ${controls.layoutMode ? "text-primary" : "text-muted-foreground"}`}>
                  <LayoutTemplate size={16} />
                  <span className="text-[10px]">Clamp</span>
                </button>
                <button onClick={() => controls.setShowPrintArea(!controls.showPrintArea)} className={`flex flex-col items-center gap-1 shrink-0 ${controls.showPrintArea ? "text-primary" : "text-muted-foreground"}`}>
                  <Frame size={16} />
                  <span className="text-[10px]">Print Box</span>
                </button>
                <button onClick={() => controls.setShowGrid(!controls.showGrid)} className={`flex flex-col items-center gap-1 shrink-0 ${controls.showGrid ? "text-primary" : "text-muted-foreground"}`}>
                  <Grid size={16} />
                  <span className="text-[10px]">Grid</span>
                </button>
                <button onClick={() => controls.setSnapToGrid(!controls.snapToGrid)} className={`flex flex-col items-center gap-1 shrink-0 ${controls.snapToGrid ? "text-primary" : "text-muted-foreground"}`}>
                  <Grid3X3 size={16} />
                  <span className="text-[10px]">Snap</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permanently pinned upgrade button outside AnimatePresence */}
      <div className="flex items-center justify-end px-4 py-2 border-t border-foreground/5 bg-background/5">
        <button
          onClick={onSubscribe}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary px-3 py-1.5 rounded-full bg-primary/5 border border-primary/40 active:scale-95 transition-transform liquid-button"
        >
          <Crown size={14} />
          <span>Upgrade to Pro</span>
        </button>
      </div>

    </div>
  );
};

export default BottomToolbar;
