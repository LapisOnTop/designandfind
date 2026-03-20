import { useEffect, useRef, useCallback } from "react";
import { fabric } from "fabric";
import { ZoomIn, ZoomOut } from "lucide-react";
import { isProUser } from "../services/proService";

interface CanvasEditorProps {
  canvasRef: React.MutableRefObject<fabric.Canvas | null>;
  backgroundUrl?: string;
  logoUrl?: string;
  templateColor?: string;
  showBg?: boolean;
  savedState?: string;
  layoutMode?: boolean;
  showPrintArea?: boolean;
  activeView?: "front" | "back";
  zoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onReady?: () => void;
}

const CANVAS_W = 358;
const CANVAS_H = 440;
const CENTER_X = CANVAS_W / 2;
const CENTER_Y = CANVAS_H / 2;

const CanvasEditor = ({
  canvasRef, backgroundUrl, logoUrl, templateColor = "#ffffff",
  showBg = true, savedState, layoutMode = true, showPrintArea = true,
  activeView = "front", zoom = 1, onZoomIn, onZoomOut, onReady
}: CanvasEditorProps) => {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const zoomRef = useRef(zoom);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const initCanvas = useCallback(() => {
    if (!canvasElRef.current) return;

    const canvas = new fabric.Canvas(canvasElRef.current, {
      width: CANVAS_W,
      height: CANVAS_H,
      backgroundColor: "transparent",
      preserveObjectStacking: true,
    });

    // Disable scroll wheel zoom - it was resizing the template
    // Users can use the +/- buttons instead
    canvas.on("mouse:wheel", (opt) => {
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Pan with mouse drag when zoomed in
    canvas.on("mouse:down", (opt) => {
      const evt = opt.e;
      // Middle mouse button or Alt+click for panning
      if (evt.altKey === true || evt.button === 1) {
        canvas.isDragging = true;
        canvas.selection = false;
        canvas.lastPosX = evt.clientX;
        canvas.lastPosY = evt.clientY;
      }
    });

    canvas.on("mouse:move", (opt) => {
      if (canvas.isDragging) {
        const e = opt.e;
        const vpt = canvas.viewportTransform;
        if (vpt) {
          vpt[4] += e.clientX - canvas.lastPosX;
          vpt[5] += e.clientY - canvas.lastPosY;
          canvas.requestRenderAll();
          canvas.lastPosX = e.clientX;
          canvas.lastPosY = e.clientY;
        }
      }
    });

    canvas.on("mouse:up", () => {
      canvas.setViewportTransform(canvas.viewportTransform!);
      canvas.isDragging = false;
      canvas.selection = true;
    });

    if (savedState) {
      canvas.loadFromJSON(savedState, () => {
        canvas.renderAll();
        if (onReady) onReady();
      });
      canvasRef.current = canvas;
      return () => canvas.dispose();
    }

    const setupGrid = () => {
      const existing = canvas.getObjects().filter(o => o.name && o.name.startsWith("gridLine"));
      existing.forEach(line => canvas.remove(line));
      // Grid disabled - removed showGrid check
      return;
    };

    const loadBackgroundImage = (url: string, callback: () => void) => {
      const imgEl = new Image();
      imgEl.crossOrigin = "anonymous";
      imgEl.onload = () => {
        const halfW = imgEl.width / 2;
        const cropX = activeView === "back" ? halfW : 0;

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = halfW;
        tempCanvas.height = imgEl.height;
        const ctx = tempCanvas.getContext("2d")!;
        ctx.drawImage(imgEl, cropX, 0, halfW, imgEl.height, 0, 0, halfW, imgEl.height);

        fabric.Image.fromURL(tempCanvas.toDataURL(), (img) => {
          if (!img) return;
          const fitScale = Math.min(CANVAS_W / (img.width || CANVAS_W), CANVAS_H / (img.height || CANVAS_H));
          img.scale(fitScale * 0.95);
          img.set({
            originX: "center", originY: "center",
            left: CENTER_X, top: CENTER_Y,
            selectable: false, evented: false,
            name: "productMockup", visible: true,
            shadow: new fabric.Shadow({ color: "rgba(0,0,0,0.2)", blur: 30, offsetX: 0, offsetY: 8 })
          });
          canvas.add(img);
          canvas.sendToBack(img);
          callback();
        });
      };
      imgEl.src = url;
    };

    const loadLogo = (url: string) => {
      fabric.Image.fromURL(url, (img) => {
        if (!img) return;
        const scale = Math.min(100 / (img.width || 100), 100 / (img.height || 100));
        img.scale(scale);
        img.set({
          left: CENTER_X, top: CENTER_Y,
          originX: "center", originY: "center",
          cornerColor: "#000", cornerStrokeColor: "#fff",
          borderColor: "#000", cornerSize: 10,
          transparentCorners: false, name: "designLogo",
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      }, { crossOrigin: "anonymous" });
    };

    canvas.on('object:moving', (e) => {
      const obj = e.target;
      if (!obj) return;
      // Snap to center guides only (removed snapToGrid)
      if (Math.abs((obj.left || 0) - CENTER_X) < 15) obj.set({ left: CENTER_X });
      if (Math.abs((obj.top || 0) - CENTER_Y) < 15) obj.set({ top: CENTER_Y });
    });

    if (backgroundUrl) {
      loadBackgroundImage(backgroundUrl, () => {
        if (logoUrl) loadLogo(logoUrl);
        if (onReady) onReady();
      });
    }

    canvasRef.current = canvas;
    return () => canvas.dispose();
  }, [backgroundUrl, logoUrl, savedState, showPrintArea, activeView]);

  // Dynamic updates for templateColor and showBg
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // BG On/Off only affects canvas background color
    canvas.backgroundColor = showBg ? "#f3f4f6" : "transparent";

    const mockup = canvas.getObjects().find(o => o.name === "productMockup") as fabric.Image | undefined;
    if (mockup) {
      mockup.filters = [];
      if (templateColor !== "#ffffff") {
        // Prevent pure black from destroying multiply blend highlights (shadows need contrast)
        let safeColor = templateColor;
        if (safeColor.toLowerCase() === "#000000" || safeColor.toLowerCase() === "black") {
          safeColor = "#222222";
        }
        mockup.filters.push(new fabric.Image.filters.BlendColor({ color: safeColor, mode: "multiply", alpha: 1 }));
      }
      mockup.applyFilters();

      // Enhanced shadow for white shirts
      const isWhite = templateColor === "#ffffff";
      mockup.set("shadow", new fabric.Shadow({
        color: isWhite ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.4)",
        blur: isWhite ? 40 : 30,
        offsetX: 0,
        offsetY: isWhite ? 4 : 8
      }));
    }

    // Remove legacy colorTint rect
    const oldTint = canvas.getObjects().find(o => o.name === "colorTint");
    if (oldTint) canvas.remove(oldTint);

    canvas.renderAll();
  }, [showBg, templateColor]);

  // Zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setZoom(zoom);
    canvas.setWidth(CANVAS_W * zoom);
    canvas.setHeight(CANVAS_H * zoom);
    canvas.renderAll();
  }, [zoom]);

  useEffect(() => {
    const cleanup = initCanvas();
    return cleanup;
  }, [initCanvas]);

  const isWhiteShirt = templateColor === "#ffffff";

  return (
    <div
      className="flex-1 min-h-0 flex items-center justify-center overflow-hidden transition-all relative border-t border-[#222]"
      style={{ backgroundColor: showBg ? (isWhiteShirt ? "#f0f0f0" : "#0f0f0f") : "transparent" }}
    >
      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center bg-[#111] border border-[#222] rounded-full shadow-lg overflow-hidden">
        <button onClick={onZoomOut} className="p-2 text-[#888] hover:text-white hover:bg-[#222] transition-colors active:scale-95">
          <ZoomOut size={16} />
        </button>
        <div className="w-[1px] h-4 bg-[#333]" />
        <span className="text-[10px] font-bold text-white px-3 tracking-widest">{Math.round(zoom * 100)}%</span>
        <div className="w-[1px] h-4 bg-[#333]" />
        <button onClick={onZoomIn} className="p-2 text-[#888] hover:text-white hover:bg-[#222] transition-colors active:scale-95">
          <ZoomIn size={16} />
        </button>
      </div>

      {/* Subtle dot grid pattern removed */}
      <canvas ref={canvasElRef} className="rounded-lg transition-all shadow-2xl relative z-10" />

      {/* Free Tier Watermark */}
      {!isProUser() && (
        <div className="absolute bottom-4 left-4 z-20 pointer-events-none opacity-40 select-none">
          <p className={`text-sm font-black tracking-widest uppercase ${isWhiteShirt && showBg ? "text-black" : "text-white"}`}>designmatch</p>
        </div>
      )}
    </div>
  );
};

export default CanvasEditor;
