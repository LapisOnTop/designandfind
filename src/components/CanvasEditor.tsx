import { useEffect, useRef, useCallback } from "react";
import { fabric } from "fabric";

interface CanvasEditorProps {
  canvasRef: React.MutableRefObject<fabric.Canvas | null>;
  backgroundUrl?: string;
  logoUrl?: string;
  templateColor?: string;
  showBg?: boolean;
  savedState?: string;
  layoutMode?: boolean;
  showPrintArea?: boolean;
  showGrid?: boolean;
  snapToGrid?: boolean;
  activeView?: "front" | "back";
  onReady?: () => void;
}

const trimCanvas = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const l = pixels.data.length;
  let bound = { top: null as number | null, left: null as number | null, right: null as number | null, bottom: null as number | null };

  for (let i = 0; i < l; i += 4) {
    if (pixels.data[i + 3] !== 0) {
      const x = (i / 4) % canvas.width;
      const y = ~~((i / 4) / canvas.width);

      if (bound.top === null) bound.top = y;
      if (bound.left === null || x < bound.left) bound.left = x;
      if (bound.right === null || x > bound.right) bound.right = x;
      if (bound.bottom === null || y > bound.bottom) bound.bottom = y;
    }
  }

  if (bound.top === null || bound.left === null || bound.right === null || bound.bottom === null) {
    return canvas;
  }

  const trimHeight = bound.bottom - bound.top + 1;
  const trimWidth = bound.right - bound.left + 1;
  const trimmed = document.createElement('canvas');
  trimmed.width = trimWidth;
  trimmed.height = trimHeight;
  trimmed.getContext('2d')?.putImageData(
    ctx.getImageData(bound.left, bound.top, trimWidth, trimHeight),
    0, 0
  );
  return trimmed;
};

const CanvasEditor = ({
  canvasRef, backgroundUrl, logoUrl, templateColor = "#ffffff",
  showBg = true, savedState, layoutMode = true, showPrintArea = true,
  showGrid = false, snapToGrid = false,
  activeView = "front", onReady
}: CanvasEditorProps) => {
  const canvasElRef = useRef<HTMLCanvasElement>(null);

  // Store these current props in a ref so fabric events can access the latest
  const modesRef = useRef({ layoutMode, snapToGrid });
  useEffect(() => {
    modesRef.current = { layoutMode, snapToGrid };
  }, [layoutMode, snapToGrid]);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.backgroundColor = showBg ? "#ffffff" : "transparent";
      canvasRef.current.renderAll();
    }
  }, [showBg]);

  const initCanvas = useCallback(() => {
    if (!canvasElRef.current) return;

    const canvas = new fabric.Canvas(canvasElRef.current, {
      width: 358,
      height: 440,
      backgroundColor: showBg ? "#ffffff" : "transparent",
      preserveObjectStacking: true,
    });

    if (savedState) {
      canvas.loadFromJSON(savedState, () => {
        canvas.renderAll();
        if (onReady) onReady();
      });
      canvasRef.current = canvas;
      return () => canvas.dispose();
    }

    const printAreaRect = { w: 140, h: 180, x: 358 / 2, y: 440 / 2 - 20 };

    const setupPrintArea = () => {
      // Remove old printArea if any
      const existing = canvas.getObjects().find(o => o.name === "printArea");
      if (existing) canvas.remove(existing);

      const printArea = new fabric.Rect({
        width: printAreaRect.w,
        height: printAreaRect.h,
        fill: "transparent",
        stroke: showPrintArea ? "rgba(255,255,255,0.3)" : "transparent",
        strokeWidth: 2,
        strokeDashArray: [6, 6],
        selectable: false,
        evented: false,
        originX: "center",
        originY: "center",
        left: printAreaRect.x,
        top: printAreaRect.y,
        name: "printArea",
      });
      canvas.add(printArea);
    };

    const setupGrid = () => {
      const existing = canvas.getObjects().filter(o => o.name && o.name.startsWith("gridLine"));
      existing.forEach(line => canvas.remove(line));

      if (!showGrid) return;

      const grid = 20;
      for (let i = 0; i < (358 / grid); i++) {
        canvas.add(new fabric.Line([i * grid, 0, i * grid, 440], {
          stroke: '#ccc', selectable: false, evented: false, name: `gridLineV${i}`
        }));
      }
      for (let i = 0; i < (440 / grid); i++) {
        canvas.add(new fabric.Line([0, i * grid, 358, i * grid], {
          stroke: '#ccc', selectable: false, evented: false, name: `gridLineH${i}`
        }));
      }
      // Send grid behind printArea
      const allGrid = canvas.getObjects().filter(o => o.name && o.name.startsWith("gridLine"));
      allGrid.forEach(line => canvas.sendToBack(line));
    };

    const loadBackgroundImage = (url: string, callback: () => void) => {
      const imgEl = new Image();
      imgEl.crossOrigin = "anonymous";
      imgEl.onload = () => {
        // Crop: left half = front, right half = back
        const halfW = imgEl.width / 2;
        const cropX = activeView === "back" ? halfW : 0;

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = halfW;
        tempCanvas.height = imgEl.height;
        const ctx = tempCanvas.getContext("2d")!;
        ctx.drawImage(imgEl, cropX, 0, halfW, imgEl.height, 0, 0, halfW, imgEl.height);

        // Trim exactly so the actual shirt pixels center exactly
        const trimmedCanvas = trimCanvas(tempCanvas);

        fabric.Image.fromURL(trimmedCanvas.toDataURL(), (img) => {
          if (!img) return;
          const scale = Math.min(358 / (img.width || 358), 440 / (img.height || 440));
          img.scale(scale);
          img.set({
            originX: "center",
            originY: "center",
            left: 358 / 2,
            top: 440 / 2,
            selectable: false,
            evented: false,
            name: "productMockup",
            visible: true, // Mockup always visible. Background is now canvas colored
          });

          // Add mockup as a regular object at the BOTTOM of the stack
          canvas.add(img);
          canvas.sendToBack(img);

          // Add a color tint overlay on top of the mockup with multiply blend
          // This covers the entire canvas so the shirt gets "dyed"
          const colorTint = new fabric.Rect({
            width: 358,
            height: 440,
            left: 0,
            top: 0,
            fill: templateColor,
            selectable: false,
            evented: false,
            name: "colorTint",
            globalCompositeOperation: "multiply",
            visible: templateColor !== "#ffffff",
          });
          canvas.add(colorTint);
          // Place the tint right above the mockup (index 1)
          canvas.moveTo(colorTint, 1);

          callback();
        });
      };
      imgEl.src = url;
    };

    const clampToPrintArea = (obj: fabric.Object) => {
      if (!modesRef.current.layoutMode) return;
      if (obj.name === "printArea" || (obj.name && obj.name.startsWith("gridLine"))) return;
      if (obj.name === "productMockup" || obj.name === "colorTint" || obj.name === "productColor") return;

      obj.setCoords();
      let boundingRect = obj.getBoundingRect();

      const paLeft = printAreaRect.x - printAreaRect.w / 2;
      const paRight = printAreaRect.x + printAreaRect.w / 2;
      const paTop = printAreaRect.y - printAreaRect.h / 2;
      const paBottom = printAreaRect.y + printAreaRect.h / 2;

      let newLeft = obj.left || 0;
      let newTop = obj.top || 0;

      // Adjust limits based on object origin
      const originXOffset = obj.originX === 'center' ? boundingRect.width / 2 : 0;
      const originYOffset = obj.originY === 'center' ? boundingRect.height / 2 : 0;

      // Clamp Left/Right
      if (boundingRect.left < paLeft) {
        newLeft = paLeft + originXOffset;
      } else if (boundingRect.left + boundingRect.width > paRight) {
        newLeft = paRight - boundingRect.width + originXOffset;
      }

      // Clamp Top/Bottom
      if (boundingRect.top < paTop) {
        newTop = paTop + originYOffset;
      } else if (boundingRect.top + boundingRect.height > paBottom) {
        newTop = paBottom - boundingRect.height + originYOffset;
      }

      // Prevent scaling outside
      if (boundingRect.width > printAreaRect.w || boundingRect.height > printAreaRect.h) {
        const scaleX = printAreaRect.w / (obj.width || 1);
        const scaleY = printAreaRect.h / (obj.height || 1);
        const minScale = Math.min(scaleX, scaleY);
        obj.set({ scaleX: minScale, scaleY: minScale });
      } else {
        obj.set({ left: newLeft, top: newTop });
      }
    };

    const loadLogo = (url: string) => {
      fabric.Image.fromURL(url, (img) => {
        if (!img) return;
        const maxLogoWidth = 100;
        const maxLogoHeight = 100;
        const scale = Math.min(maxLogoWidth / (img.width || maxLogoWidth), maxLogoHeight / (img.height || maxLogoHeight));

        img.scale(scale);
        img.set({
          left: printAreaRect.x,
          top: printAreaRect.y,
          originX: "center",
          originY: "center",
          cornerColor: "#000",
          cornerStrokeColor: "#fff",
          borderColor: "#000",
          cornerSize: 10,
          transparentCorners: false,
          name: "designLogo",
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      }, { crossOrigin: "anonymous" });
    };

    canvas.on('object:moving', (e) => {
      const obj = e.target;
      if (!obj) return;

      const grid = 20;
      if (modesRef.current.snapToGrid) {
        obj.set({
          left: Math.round((obj.left || 0) / grid) * grid,
          top: Math.round((obj.top || 0) / grid) * grid
        });
      }

      // Center snap logic
      if (!modesRef.current.snapToGrid && !modesRef.current.layoutMode) {
        const centerX = 358 / 2;
        const centerY = 440 / 2 - 20;
        if (Math.abs((obj.left || 0) - centerX) < 15) obj.set({ left: centerX });
        if (Math.abs((obj.top || 0) - centerY) < 15) obj.set({ top: centerY });
      }

      clampToPrintArea(obj);
    });

    canvas.on('object:scaling', (e) => {
      const obj = e.target;
      if (obj) clampToPrintArea(obj);
    });

    if (backgroundUrl) {
      loadBackgroundImage(backgroundUrl, () => {
        setupGrid();
        setupPrintArea();
        if (logoUrl) loadLogo(logoUrl);
        if (onReady) onReady();
      });
    }

    canvasRef.current = canvas;
    return () => canvas.dispose();
  }, [canvasRef, backgroundUrl, logoUrl, templateColor, showBg, savedState, showPrintArea, showGrid, activeView]);

  useEffect(() => {
    const cleanup = initCanvas();
    return cleanup;
  }, [initCanvas]);

  return (
    <div className={`flex-1 flex items-center justify-center overflow-hidden transition-all ${showBg ? "bg-white" : "bg-transparent"}`}>
      <canvas ref={canvasElRef} className="rounded-2xl transition-all" />
    </div>
  );
};

export default CanvasEditor;
