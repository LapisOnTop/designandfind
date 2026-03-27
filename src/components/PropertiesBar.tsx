import React, { useState } from "react";
import { FlipHorizontal, FlipVertical, Palette, Droplet } from "lucide-react";
import { isProUser } from "../services/proService";

interface PropertiesBarProps {
    opacity: number;
    setOpacity: (val: number) => void;
    onFlipH: () => void;
    onFlipV: () => void;
    onRequirePro: () => void;
    hasSelection: boolean;
}

const PropertiesBar = ({
    opacity,
    setOpacity,
    onFlipH,
    onFlipV,
    onRequirePro,
    hasSelection
}: PropertiesBarProps) => {

    if (!hasSelection) return null;

    const handleProAction = (callback: () => void) => {
        callback();
    };

    return (
        <div className="h-[48px] bg-[#111] border-t border-[#222] flex items-center justify-between px-4 shrink-0 z-30 relative show-scrollbar-x">

            {/* Opacity free */}
            <div className="flex items-center gap-2 shrink-0 pr-4">
                <span className="text-[10px] text-[#888] font-bold uppercase tracking-wider relative flex items-center pr-3">
                    Op
                </span>
                <input
                    type="range"
                    min="0" max="1" step="0.05"
                    value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    className="w-20 h-1 bg-[#333] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                />
            </div>

            {/* Tools Divider */}
            <div className="w-[1px] h-6 bg-[#222] mx-2 shrink-0" />

            {/* Tools (Stroke/Shadow visual placeholders + Flips) */}
            <div className="flex items-center gap-3 shrink-0">
                <button onClick={() => handleProAction(onFlipH)} className="text-white hover:text-primary transition-colors flex items-center gap-1 active:scale-95 relative pt-1">
                    <FlipHorizontal size={18} />
                </button>
                <button onClick={() => handleProAction(onFlipV)} className="text-white hover:text-primary transition-colors flex items-center gap-1 active:scale-95 relative pt-1">
                    <FlipVertical size={18} />
                </button>
            </div>

        </div>
    );
};

export default PropertiesBar;
