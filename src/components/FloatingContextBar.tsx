import React from "react";
import { Trash2, Copy, MoveUp, MoveDown } from "lucide-react";

interface FloatingContextBarProps {
    onDelete: () => void;
    onDuplicate: () => void;
    onBringForward: () => void;
    onSendBackward: () => void;
    position: { top: number; left: number } | null;
}

const FloatingContextBar = ({
    onDelete,
    onDuplicate,
    onBringForward,
    onSendBackward,
    position
}: FloatingContextBarProps) => {
    if (!position) return null;

    return (
        <div
            className="absolute bg-[#111] border border-[#333] rounded-full shadow-2xl flex items-center px-1.5 py-1.5 gap-1 z-50 transform -translate-x-1/2 -translate-y-full mb-3"
            style={{
                left: position.left,
                top: position.top,
            }}
        >
            <button onClick={onDuplicate} title="Duplicate" className="p-2 text-white hover:bg-[#222] rounded-full transition-colors active:scale-95">
                <Copy size={16} />
            </button>
            <div className="w-[1px] h-4 bg-[#333] mx-0.5" />
            <button onClick={onBringForward} title="Bring Forward" className="p-2 text-white hover:bg-[#222] rounded-full transition-colors active:scale-95">
                <MoveUp size={16} />
            </button>
            <button onClick={onSendBackward} title="Send Backward" className="p-2 text-white hover:bg-[#222] rounded-full transition-colors active:scale-95">
                <MoveDown size={16} />
            </button>
            <div className="w-[1px] h-4 bg-[#333] mx-0.5" />
            <button onClick={onDelete} title="Delete" className="p-2 text-red-400 hover:bg-red-500/20 rounded-full transition-colors active:scale-95">
                <Trash2 size={16} />
            </button>
        </div>
    );
};

export default FloatingContextBar;
