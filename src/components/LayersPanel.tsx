import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, EyeOff, Type, Image, Square, Circle, Triangle, MousePointer } from "lucide-react";
import { fabric } from "fabric";

interface LayersPanelProps {
    open: boolean;
    onClose: () => void;
    canvasRef: React.MutableRefObject<fabric.Canvas | null>;
}

const SYSTEM_NAMES = ["productMockup", "colorTint", "productColor", "printArea"];

const getLayerIcon = (obj: fabric.Object) => {
    if (obj.type === "i-text" || obj.type === "text") return Type;
    if (obj.type === "image") return Image;
    if (obj.type === "rect") return Square;
    if (obj.type === "circle") return Circle;
    if (obj.type === "triangle") return Triangle;
    return MousePointer;
};

const getLayerLabel = (obj: fabric.Object) => {
    if (obj.name === "designLogo") return "Design Logo";
    if (obj.name === "uploadedImage") return "Uploaded Image";
    if (obj.name === "userText") return "Text";
    if (obj.name === "userShape") return obj.type ? obj.type.charAt(0).toUpperCase() + obj.type.slice(1) : "Shape";
    if (obj.type === "i-text" || obj.type === "text") return `Text: "${(obj as fabric.IText).text?.substring(0, 12) || ""}"`;
    return obj.type ? obj.type.charAt(0).toUpperCase() + obj.type.slice(1) : "Object";
};

const LayersPanel = ({ open, onClose, canvasRef }: LayersPanelProps) => {
    const [layers, setLayers] = useState<fabric.Object[]>([]);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        if (!open) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const refresh = () => {
            const objs = canvas.getObjects().filter(o => !SYSTEM_NAMES.includes(o.name || "") && !o.name?.startsWith("gridLine"));
            setLayers([...objs].reverse());
        };

        refresh();
        canvas.on("object:added", refresh);
        canvas.on("object:removed", refresh);
        canvas.on("object:modified", refresh);

        return () => {
            canvas.off("object:added", refresh);
            canvas.off("object:removed", refresh);
            canvas.off("object:modified", refresh);
        };
    }, [open, canvasRef, tick]);

    const selectLayer = (obj: fabric.Object) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.setActiveObject(obj);
        canvas.renderAll();
    };

    const toggleVisibility = (obj: fabric.Object) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        obj.set("visible", !obj.visible);
        canvas.renderAll();
        setTick(t => t + 1);
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="absolute top-0 left-0 bottom-0 w-48 z-50 bg-card/95 backdrop-blur-xl border-r border-border shadow-lg flex flex-col">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                        <h3 className="text-xs font-bold text-foreground">Layers</h3>
                        <button onClick={onClose} className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                            <X size={14} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {layers.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground text-center py-8">No elements yet</p>
                        ) : (
                            layers.map((obj, i) => {
                                const Icon = getLayerIcon(obj);
                                const isActive = canvasRef.current?.getActiveObject() === obj;
                                return (
                                    <div key={i} onClick={() => selectLayer(obj)}
                                        className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors border-b border-border/50 ${isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-foreground/5"}`}>
                                        <Icon size={14} className="shrink-0" />
                                        <span className="text-[11px] font-medium truncate flex-1">{getLayerLabel(obj)}</span>
                                        <button onClick={(e) => { e.stopPropagation(); toggleVisibility(obj); }}
                                            className="p-0.5 text-muted-foreground hover:text-foreground cursor-pointer">
                                            {obj.visible !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LayersPanel;
