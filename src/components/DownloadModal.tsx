import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ShieldCheck, Crown } from "lucide-react";
import { fabric } from "fabric";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import PaymentModal from "./PaymentModal";
import { isProUser } from "@/services/proService";

interface DownloadModalProps {
    open: boolean;
    onClose: () => void;
    design: any | null;
}

const DownloadModal = ({ open, onClose, design }: DownloadModalProps) => {
    const { user } = useAuth();
    const [format, setFormat] = useState<"png" | "jpeg">("png");
    const [sizeType, setSizeType] = useState<"1080" | "2048" | "custom">("1080");
    const [customW, setCustomW] = useState("1080");
    const [customH, setCustomH] = useState("1080");
    const [isExporting, setIsExporting] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);

    const isPro = isProUser();

    const handleExport = async () => {
        if (!isPro) {
            setShowPaywall(true);
            return;
        }
        if (!design || !user?.id) return;

        setIsExporting(true);
        try {
            const jsonStr = localStorage.getItem(`designMatch_saved_${design.id}_${user.id}`);
            if (!jsonStr) throw new Error("Design data not found. It may have been deleted.");

            let width = 1080;
            let height = 1080;
            if (sizeType === "2048") { width = 2048; height = 2048; }
            else if (sizeType === "custom") {
                width = parseInt(customW);
                height = parseInt(customH);
            }

            if (isNaN(width) || isNaN(height) || width < 100 || height < 100 || width > 8000 || height > 8000) {
                throw new Error("Invalid custom dimensions. Must be between 100 and 8000 pixels.");
            }

            // Use a hidden canvas element for fabric
            const canvasEl = document.createElement("canvas");
            canvasEl.width = width;
            canvasEl.height = height;

            const fCanvas = new fabric.StaticCanvas(canvasEl, { width, height });

            await new Promise<void>((resolve, reject) => {
                try {
                    fCanvas.loadFromJSON(jsonStr, () => {
                        // Ensure white background for JPEGs
                        if (format === "jpeg" && !fCanvas.backgroundColor) {
                            fCanvas.setBackgroundColor('white', fCanvas.renderAll.bind(fCanvas));
                        } else {
                            fCanvas.renderAll();
                        }
                        resolve();
                    });
                } catch (e) { reject(e); }
            });

            // Calculate multiplier to scale up from mobile viewport width (usually ~350-400px)
            const originalWidth = fCanvas.getWidth() || 350;
            const multiplier = width / originalWidth;

            const dataUrl = fCanvas.toDataURL({
                format,
                quality: 1,
                multiplier
            });

            // Trigger browser download
            const a = document.createElement("a");
            a.href = dataUrl;
            a.download = `${design.name || "design"}.${format}`;
            a.click();

            toast.success("High-res design exported successfully!");
            onClose();
        } catch (e: any) {
            console.error("Export error:", e);
            toast.error("Failed to export: " + (e.message || "Unknown error"));
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[300] flex flex-col items-center justify-center p-4 bg-black/70 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 20, opacity: 0 }}
                            className="w-full max-w-[340px] bg-white/[0.05] backdrop-blur-xl border border-white/[0.15] rounded-3xl overflow-hidden shadow-2xl relative"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                                <div className="flex items-center gap-2 text-white">
                                    <Download size={18} className="text-blue-400" />
                                    <h2 className="text-base font-bold tracking-tight">Export Design</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 rounded-full bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-5 space-y-6">

                                {/* Format Selection */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-white/50 tracking-widest uppercase pl-1">Format</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setFormat("png")}
                                            className={`relative px-4 py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${format === "png"
                                                    ? "bg-blue-500/20 border-blue-500 text-white"
                                                    : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                                                }`}
                                        >
                                            <span className="text-[13px] font-bold">PNG</span>
                                            <span className="text-[9px] font-bold opacity-70 uppercase tracking-widest">Recommended</span>
                                        </button>
                                        <button
                                            onClick={() => setFormat("jpeg")}
                                            className={`relative px-4 py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${format === "jpeg"
                                                    ? "bg-blue-500/20 border-blue-500 text-white"
                                                    : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                                                }`}
                                        >
                                            <span className="text-[13px] font-bold">JPG</span>
                                            <span className="text-[9px] font-bold opacity-70 uppercase tracking-widest">Smaller File</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Size Selection */}
                                <div className="space-y-3 flex flex-col">
                                    <label className="text-xs font-bold text-white/50 tracking-widest uppercase pl-1 flex items-center justify-between">
                                        <span>Resolution</span>
                                        {!isPro && <Crown size={12} className="text-yellow-500" />}
                                    </label>
                                    <div className="bg-[#111]/50 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                                        <button
                                            onClick={() => setSizeType("1080")}
                                            className={`w-full flex items-center justify-between px-4 py-3.5 border-b border-white/5 transition-colors ${sizeType === '1080' ? 'bg-blue-500/10' : 'hover:bg-white/5'}`}
                                        >
                                            <span className={`text-[13px] font-semibold tracking-wide ${sizeType === '1080' ? 'text-white' : 'text-white/60'}`}>1080 x 1080 (Square)</span>
                                            <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all ${sizeType === '1080' ? 'border-blue-500' : 'border-white/20'}`}>
                                                {sizeType === '1080' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setSizeType("2048")}
                                            className={`w-full flex items-center justify-between px-4 py-3.5 border-b border-white/5 transition-colors ${sizeType === '2048' ? 'bg-blue-500/10' : 'hover:bg-white/5'}`}
                                        >
                                            <span className={`text-[13px] font-semibold tracking-wide flex items-center gap-1.5 ${sizeType === '2048' ? 'text-white' : 'text-white/60'}`}>
                                                2048 x 2048 <span className="text-[9px] font-bold uppercase tracking-wider text-blue-400 bg-blue-400/10 px-1.5 rounded">High Res</span>
                                            </span>
                                            <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all ${sizeType === '2048' ? 'border-blue-500' : 'border-white/20'}`}>
                                                {sizeType === '2048' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setSizeType("custom")}
                                            className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors ${sizeType === 'custom' ? 'bg-blue-500/10' : 'hover:bg-white/5'}`}
                                        >
                                            <span className={`text-[13px] font-semibold tracking-wide ${sizeType === 'custom' ? 'text-white' : 'text-white/60'}`}>Custom Size</span>
                                            <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all ${sizeType === 'custom' ? 'border-blue-500' : 'border-white/20'}`}>
                                                {sizeType === 'custom' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                                            </div>
                                        </button>
                                    </div>

                                    <AnimatePresence>
                                        {sizeType === "custom" && (
                                            <motion.div
                                                className="flex items-center gap-2 mt-2 overflow-hidden"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                            >
                                                <div className="flex-1 bg-[#111]/80 rounded-xl border border-white/10 px-3 py-2.5 flex items-center justify-between shadow-inner">
                                                    <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Width</span>
                                                    <input
                                                        type="number"
                                                        value={customW}
                                                        onChange={e => setCustomW(e.target.value)}
                                                        className="bg-transparent text-right text-white font-bold text-sm w-16 outline-none focus:text-blue-400 transition-colors"
                                                    />
                                                </div>
                                                <X size={12} className="text-white/30 shrink-0" />
                                                <div className="flex-1 bg-[#111]/80 rounded-xl border border-white/10 px-3 py-2.5 flex items-center justify-between shadow-inner">
                                                    <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Height</span>
                                                    <input
                                                        type="number"
                                                        value={customH}
                                                        onChange={e => setCustomH(e.target.value)}
                                                        className="bg-transparent text-right text-white font-bold text-sm w-16 outline-none focus:text-blue-400 transition-colors"
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="pt-3">
                                    <button
                                        onClick={handleExport}
                                        disabled={isExporting}
                                        className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${!isPro
                                                ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-black hover:brightness-110 shadow-[0_0_20px_rgba(234,179,8,0.3)]"
                                                : "bg-white text-black hover:bg-[#e0e0e0] shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                            }`}
                                    >
                                        {!isPro ? (
                                            <>
                                                <Crown size={18} /> Upgrade to Pro to Export
                                            </>
                                        ) : isExporting ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                                Rendering...
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheck size={18} /> Export Quality Design
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <PaymentModal open={showPaywall} onClose={() => setShowPaywall(false)} onSuccess={() => setShowPaywall(false)} />
        </>
    );
};

export default DownloadModal;
