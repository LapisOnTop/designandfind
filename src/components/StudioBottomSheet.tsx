import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Star, Heart, Triangle, Circle, Square, Minus, Eye, EyeOff, GripVertical, Type, Shapes, ChevronUp, ChevronDown } from "lucide-react";
import { isProUser } from "../services/proService";

export type BottomSheetType = "text" | "graphics" | "color" | "layers" | "styles" | null;

interface StudioBottomSheetProps {
    activeSheet: BottomSheetType;
    onClose: () => void;
    onAddText: (fontFamily: string) => void;
    onAddShape: (shapeType: string) => void;
    templateColor: string;
    setTemplateColor: (color: string) => void;
    canvasElements: any[]; // We'll pass reduced element data for layers
    onToggleLayerVisibility: (id: string) => void;
    onReorderLayer: (id: string, direction: "up" | "down") => void;
    onRequirePro: () => void;
    // New Style handlers
    strokeWeight: number;
    setStrokeWeight: (val: number) => void;
    strokeColor: string;
    setStrokeColor: (color: string) => void;
    shadowBlur: number;
    setShadowBlur: (val: number) => void;
}

const FONTS = [
    { name: "Inter", type: "Sans-serif", pro: false },
    { name: "Roboto", type: "Sans-serif", pro: false },
    { name: "Playfair Display", type: "Display", pro: true },
    { name: "Pacifico", type: "Display", pro: true },
    { name: "Caveat", type: "Handwriting", pro: false },
    { name: "Dancing Script", type: "Handwriting", pro: true },
    { name: "Space Mono", type: "Monospace", pro: false },
];

const PRESET_COLORS = [
    "#ffffff", "#000000", "#ef4444", "#1e3a8a", "#14532d", "#eab308", "#ec4899", "#8b5cf6"
];

const SHAPES = [
    { id: "star", icon: Star, label: "Star" },
    { id: "heart", icon: Heart, label: "Heart" },
    { id: "triangle", icon: Triangle, label: "Triangle" },
    { id: "circle", icon: Circle, label: "Circle" },
    { id: "rectangle", icon: Square, label: "Rectangle" },
    { id: "line", icon: Minus, label: "Line" },
];

const StudioBottomSheet = ({
    activeSheet,
    onClose,
    onAddText,
    onAddShape,
    templateColor,
    setTemplateColor,
    canvasElements,
    onToggleLayerVisibility,
    onReorderLayer,
    onRequirePro,
    strokeWeight,
    setStrokeWeight,
    strokeColor,
    setStrokeColor,
    shadowBlur,
    setShadowBlur
}: StudioBottomSheetProps) => {
    const [fontFilter, setFontFilter] = useState("All");
    const [fontSearch, setFontSearch] = useState("");
    const filteredFonts = FONTS.filter(f => {
        const matchesCategory = fontFilter === "All" || f.type === fontFilter;
        const matchesSearch = fontSearch === "" || f.name.toLowerCase().includes(fontSearch.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleFontClick = (font: any) => {
        if (font.pro && !isProUser()) {
            onRequirePro();
            return;
        }
        onAddText(font.name);
        onClose();
    };

    const renderContent = () => {
        switch (activeSheet) {
            case "text":
                return (
                    <div className="flex flex-col h-full">
                        <div className="px-4 pb-2">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
                                <input 
                                    type="text" 
                                    placeholder="Search fonts..." 
                                    value={fontSearch}
                                    onChange={(e) => setFontSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        // Allow arrow keys to work normally in the input
                                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                            e.stopPropagation();
                                        }
                                    }}
                                    className="w-full h-10 bg-[#1a1a1a] rounded-xl pl-9 pr-4 text-sm text-white placeholder:text-[#555] outline-none border border-[#222] focus:border-primary" 
                                />
                            </div>
                        </div>
                        <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto hide-scrollbar whitespace-nowrap">
                            {["All", "Sans-serif", "Display", "Handwriting", "Monospace"].map(cat => (
                                <button key={cat} onClick={() => setFontFilter(cat)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${fontFilter === cat ? "bg-white text-black" : "bg-[#1a1a1a] text-[#888] border border-[#222]"}`}>
                                    {cat}
                                </button>
                            ))}
                        </div>
                        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
                            {filteredFonts.map(font => (
                                <button key={font.name} onClick={() => handleFontClick(font)}
                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#1a1a1a] transition-colors border border-transparent hover:border-[#222] text-left">
                                    <span className="text-lg text-white" style={{ fontFamily: font.name }}>{font.name}</span>
                                    {font.pro && <span className="text-xs bg-[#222] px-2 py-0.5 rounded text-amber-400">PRO 👑</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case "graphics":
                return (
                    <div className="px-4 py-2 pb-8 grid grid-cols-3 gap-3">
                        {SHAPES.map(s => (
                            <button key={s.id} onClick={() => { onAddShape(s.id); onClose(); }}
                                className="flex flex-col items-center justify-center gap-2 aspect-square rounded-2xl bg-[#1a1a1a] border border-[#222] hover:border-[#444] transition-colors active:scale-95 text-white">
                                <s.icon size={28} className="text-white" />
                                <span className="text-[10px] text-[#888] uppercase tracking-wider font-semibold">{s.label}</span>
                            </button>
                        ))}
                    </div>
                );

            case "color":
                return (
                    <div className="px-4 py-2 pb-8 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-white">Shirt Color</h3>
                            <button onClick={() => setTemplateColor("#ffffff")} className="text-xs text-primary font-medium px-3 py-1 bg-primary/10 rounded-full">
                                Reset to White
                            </button>
                        </div>
                        <div className="flex bg-[#1a1a1a] p-3 rounded-2xl border border-[#222]">
                            <input type="color" value={templateColor} onChange={(e) => setTemplateColor(e.target.value)}
                                className="w-full h-12 rounded cursor-pointer bg-transparent border-0" />
                        </div>
                        <div>
                            <p className="text-xs text-[#888] mb-3 uppercase tracking-wider font-bold">Presets</p>
                            <div className="flex flex-wrap gap-3">
                                {PRESET_COLORS.map(c => (
                                    <button key={c} onClick={() => setTemplateColor(c)}
                                        className="w-10 h-10 rounded-full border-2 transition-transform active:scale-90 shadow-sm"
                                        style={{ backgroundColor: c, borderColor: templateColor === c ? '#fff' : '#222' }} />
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case "styles":
                if (!isProUser()) {
                    return (
                        <div className="px-6 py-12 flex flex-col items-center justify-center text-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-[#111] border border-[#222] flex items-center justify-center text-2xl">👑</div>
                            <h3 className="text-lg font-bold text-white">Styles are a Pro feature</h3>
                            <p className="text-sm text-[#888] max-w-[250px]">Upgrade to add strokes, shadows, and advanced effects to your designs.</p>
                            <button onClick={onRequirePro} className="mt-2 px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl">View Pro Plans</button>
                        </div>
                    );
                }
                return (
                    <div className="px-4 py-2 pb-8 flex flex-col gap-8">
                        {/* Stroke Controls */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-[#888] uppercase tracking-widest">Outline (Stroke)</h3>
                                <span className="text-xs text-white font-mono">{strokeWeight}px</span>
                            </div>
                            <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-[#222] space-y-4">
                                <input type="range" min="0" max="20" step="1" value={strokeWeight} onChange={(e) => setStrokeWeight(parseInt(e.target.value))}
                                    className="w-full h-1 bg-[#333] rounded-full appearance-none cursor-pointer" />
                                <div className="flex items-center gap-3">
                                    <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)}
                                        className="w-10 h-10 rounded-lg bg-transparent border-0 cursor-pointer" />
                                    <div className="flex-1 flex gap-2 overflow-x-auto hide-scrollbar">
                                        {["#ffffff", "#000000", "#ef4444", "#3b82f6", "#10b981"].map(c => (
                                            <button key={c} onClick={() => setStrokeColor(c)} className="w-8 h-8 rounded-full border border-[#333] shrink-0" style={{ backgroundColor: c }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shadow Controls */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-[#888] uppercase tracking-widest">Glow (Shadow)</h3>
                                <span className="text-xs text-white font-mono">{shadowBlur}px</span>
                            </div>
                            <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-[#222]">
                                <input type="range" min="0" max="50" step="1" value={shadowBlur} onChange={(e) => setShadowBlur(parseInt(e.target.value))}
                                    className="w-full h-1 bg-[#333] rounded-full appearance-none cursor-pointer" />
                            </div>
                        </div>
                    </div>
                );

            case "layers":
                if (!isProUser()) {
                    return (
                        <div className="px-6 py-12 flex flex-col items-center justify-center text-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-[#111] border border-[#222] flex items-center justify-center text-2xl">👑</div>
                            <h3 className="text-lg font-bold text-white">Layers are a Pro feature</h3>
                            <p className="text-sm text-[#888] max-w-[250px]">Upgrade to view, reorder, and manage individual layers on your canvas.</p>
                            <button onClick={onRequirePro} className="mt-2 px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl">View Pro Plans</button>
                        </div>
                    );
                }
                return (
                    <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2">
                        {canvasElements.length === 0 ? (
                            <p className="text-sm text-[#555] text-center py-8">No elements on canvas.</p>
                        ) : (
                            canvasElements.map((el, i) => (
                                <div key={el.id} className="flex items-center gap-2 p-3 bg-[#1a1a1a] border border-[#222] rounded-xl">
                                    <div className="flex flex-col">
                                        <button 
                                            onClick={() => onReorderLayer(el.id, 'up')} 
                                            disabled={i === 0}
                                            className="text-[#555] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed p-0.5"
                                        >
                                            <ChevronUp size={14} />
                                        </button>
                                        <button 
                                            onClick={() => onReorderLayer(el.id, 'down')} 
                                            disabled={i === canvasElements.length - 1}
                                            className="text-[#555] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed p-0.5"
                                        >
                                            <ChevronDown size={14} />
                                        </button>
                                    </div>
                                    <div className="w-8 h-8 rounded bg-[#111] border border-[#333] flex items-center justify-center text-white shrink-0 shadow-inner">
                                        {el.type === 'i-text' ? <Type size={14} /> : <Shapes size={14} />}
                                    </div>
                                    <span className="flex-1 text-sm text-white truncate font-medium">{el.name || el.type}</span>
                                    <button onClick={() => onToggleLayerVisibility(el.id)} className="text-[#888] hover:text-white p-1">
                                        {el.visible !== false ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <AnimatePresence>
            {activeSheet && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-black/60 z-[60]"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="absolute bottom-0 left-0 right-0 max-h-[70vh] min-h-[40vh] bg-[#111] rounded-t-3xl border-t border-[#222] z-[70] flex flex-col shadow-2xl"
                    >
                        <div className="flex items-center justify-between p-4 shrink-0">
                            <span className="text-sm font-bold text-white capitalize">{activeSheet}</span>
                            <button onClick={onClose} className="p-1 text-[#888] bg-[#1a1a1a] rounded-full hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        {renderContent()}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default StudioBottomSheet;
