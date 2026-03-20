import React from "react";
import { ImagePlus, Type, Shapes, Palette } from "lucide-react";

export type BottomSheetType = "text" | "graphics" | "color" | null;

interface BottomToolbarProps {
  activeSheet: BottomSheetType;
  onOpenSheet: (sheet: BottomSheetType) => void;
  onUploadImage: () => void;
}

const BottomToolbar = ({
  activeSheet,
  onOpenSheet,
  onUploadImage,
}: BottomToolbarProps) => {

  const TabBtn = ({ icon: Icon, label, isActive, onClick }: any) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center flex-1 min-w-[48px] h-full gap-1 transition-colors active:scale-95 ${isActive ? "text-primary" : "text-[#888] hover:text-white"
        }`}
    >
      <Icon size={20} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  return (
    <div className="h-[64px] bg-[#111] border-t border-[#222] flex items-center px-2 shrink-0 z-40 relative w-full show-scrollbar-x">
      <div className="flex items-center gap-1 min-w-max mx-auto">
        <TabBtn icon={ImagePlus} label="Upload" onClick={onUploadImage} />
        <div className="w-[1px] h-8 bg-[#222] shrink-0 mx-1" />
        <TabBtn icon={Type} label="Text" isActive={activeSheet === "text"} onClick={() => onOpenSheet("text")} />
        <TabBtn icon={Shapes} label="Graphics" isActive={activeSheet === "graphics"} onClick={() => onOpenSheet("graphics")} />
        <TabBtn icon={Palette} label="Color" isActive={activeSheet === "color"} onClick={() => onOpenSheet("color")} />
      </div>
    </div>
  );
};

export default BottomToolbar;
