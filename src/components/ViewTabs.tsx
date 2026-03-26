import React from "react";

interface ViewTabsProps {
    activeView: "front" | "back";
    onViewChange: (view: "front" | "back") => void;
}

const ViewTabs = ({ activeView, onViewChange }: ViewTabsProps) => {
    return (
        <div className="flex items-center gap-2 px-4 py-3 bg-black overflow-x-auto hide-scrollbar shrink-0">
            <button
                onClick={() => onViewChange("front")}
                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors shrink-0 ${activeView === "front"
                    ? "bg-[#222] text-white"
                    : "bg-transparent border border-[#333] text-[#888] hover:text-white"
                    }`}
            >
                Front side
            </button>
            <button
                onClick={() => onViewChange("back")}
                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors shrink-0 ${activeView === "back"
                    ? "bg-[#222] text-white"
                    : "bg-transparent border border-[#333] text-[#888] hover:text-white"
                    }`}
            >
                Back side
            </button>
        </div>
    );
};

export default ViewTabs;
