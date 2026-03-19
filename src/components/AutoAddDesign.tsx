import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Sparkles, Shirt, ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface AutoAddDesignProps {
    open: boolean;
    onClose: () => void;
}

const CLOTHING_TYPES = [
    { id: "tshirt", label: "T-Shirt", icon: Shirt },
    { id: "jersey", label: "Jersey", icon: Shirt },
    { id: "hoodie", label: "Hoodie", icon: Shirt },
    { id: "jacket", label: "Jacket", icon: Shirt },
    { id: "cap", label: "Cap", icon: Shirt },
    { id: "pants", label: "Pants", icon: Shirt },
];

const AutoAddDesign = ({ open, onClose }: AutoAddDesignProps) => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState(1);
    const [designImage, setDesignImage] = useState<string | null>(null);
    const [description, setDescription] = useState("");
    const [clothingType, setClothingType] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setDesignImage(reader.result as string);
                setStep(2);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = () => {
        if (!description || !clothingType) {
            toast.error("Please fill in all fields");
            return;
        }

        setIsGenerating(true);

        // Simulate AI generation process
        setTimeout(() => {
            localStorage.setItem("designMatchUpload", designImage!);
            localStorage.setItem("designMatchAutoTemplate", clothingType.toLowerCase());
            localStorage.setItem("designMatchAutoDescription", description);

            setIsGenerating(false);
            onClose();
            navigate(`/studio?autoAdd=true&template=${clothingType.toLowerCase()}`);
            toast.success("Design placed successfully!");
        }, 2500);
    };

    const reset = () => {
        setStep(1);
        setDesignImage(null);
        setDescription("");
        setClothingType("");
        setIsGenerating(false);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center px-6"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="w-full max-w-sm bg-[#111] rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
                    >
                        <div className="p-6 relative">
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>

                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                    <Sparkles size={16} className="text-primary" />
                                </div>
                                <h2 className="text-lg font-bold text-white tracking-tight">Auto-Add Design</h2>
                            </div>

                            {isGenerating ? (
                                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                    <div>
                                        <h3 className="text-white font-bold">AI Processing...</h3>
                                        <p className="text-white/40 text-xs mt-1">Finding template & placing design</p>
                                    </div>
                                </div>
                            ) : step === 1 ? (
                                <div className="space-y-6">
                                    <p className="text-sm text-white/50 leading-relaxed">
                                        Upload your graphic and we'll automatically place it on a professional template for you.
                                    </p>

                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="aspect-square rounded-2xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white/10 transition-colors group"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Upload size={24} className="text-primary" />
                                        </div>
                                        <span className="text-sm font-medium text-white/60">Upload PNG/JPG</span>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider ml-1">What is this design for?</label>
                                            <input
                                                type="text"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="e.g. A Basketball Jersey, Retro Band Tee"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider ml-1">Select Clothing Type</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {CLOTHING_TYPES.map((t) => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => setClothingType(t.label)}
                                                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-left ${clothingType === t.label
                                                                ? "bg-primary/20 border-primary text-primary"
                                                                : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
                                                            }`}
                                                    >
                                                        <t.icon size={14} />
                                                        <span className="text-xs font-medium">{t.label}</span>
                                                        {clothingType === t.label && <Check size={12} className="ml-auto" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        disabled={!description || !clothingType}
                                        onClick={handleGenerate}
                                        className="w-full py-4 mt-2 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
                                    >
                                        Generate Mockup
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AutoAddDesign;
