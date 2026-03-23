import React from "react";
import { ImagePlus, Type, Shapes, Palette, Lock } from "lucide-react";
import { isProUser } from "@/services/proService";

export type BottomSheetType = "text" | "graphics" | "color" | null;

interface BottomToolbarProps {
  activeSheet: BottomSheetType;
  onOpenSheet: (sheet: BottomSheetType) => void;
  onUploadImage: () => void;
  onRequirePro: () => void;
}

const BottomToolbar = ({
  activeSheet,
  onOpenSheet,
  onUploadImage,
  onRequirePro
}: BottomToolbarProps) => {
  const isPro = isProUser();

  const TabBtn = ({ icon: Icon, label, isActive, onClick, isLocked }: any) => {
    const locked = isLocked && !isPro;
    return (
      <button
        onClick={locked ? onRequirePro : onClick}
        className={`flex flex-col items-center justify-center flex-1 min-w-[48px] h-full gap-1 transition-colors active:scale-95 ${isActive ? "text-white" : "text-[#888] hover:text-white"
          }`}
      >
        <div className="relative">
          <Icon size={20} />
          {locked && (
            <div className="absolute -top-1 -right-2 bg-[#111] rounded-full p-[1px] border border-[#222]">
              <Lock size={8} className="text-yellow-500" />
            </div>
          )}
        </div>
        <span className="text-[10px] font-medium">{label}</span>
      </button>
    );
  };

  return (
    <div className="h-[64px] bg-[#111] border-t border-[#222] flex items-center px-2 shrink-0 z-40 relative w-full show-scrollbar-x">
      <div className="flex items-center gap-1 min-w-max mx-auto">
        <TabBtn icon={ImagePlus} label="Upload" onClick={onUploadImage} />
        <div className="w-[1px] h-8 bg-[#222] shrink-0 mx-1" />
        <TabBtn icon={Type} label="Text" isActive={activeSheet === "text"} onClick={() => onOpenSheet("text")} isLocked={true} />
        <TabBtn icon={Shapes} label="Graphics" isActive={activeSheet === "graphics"} onClick={() => onOpenSheet("graphics")} isLocked={true} />
        <TabBtn icon={Palette} label="Color" isActive={activeSheet === "color"} onClick={() => onOpenSheet("color")} />
      </div>
    </div>
  );
};

export default BottomToolbar;
