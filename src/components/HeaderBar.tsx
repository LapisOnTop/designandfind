import { Search, ChevronLeft, Save, Undo2, Redo2 } from "lucide-react";

interface HeaderBarProps {
  onLookup: () => void;
  isSearching: boolean;
  onExit?: () => void;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

const HeaderBar = ({ onLookup, isSearching, onExit, onSave, onUndo, onRedo, canUndo, canRedo }: HeaderBarProps) => {
  return (
    <div className="flex items-center justify-between px-3 h-[48px] bg-[#111] border-b border-[#222] relative z-50 shrink-0">
      {/* Left: Back Arrow */}
      {onExit ? (
        <button onClick={onExit} className="p-2 text-[#888] hover:text-white transition-colors active:scale-95">
          <ChevronLeft size={20} />
        </button>
      ) : <div className="w-9" />}

      {/* Center: Title */}
      <h1 className="text-sm font-semibold tracking-tight text-white absolute left-1/2 -translate-x-1/2">
        Studio
      </h1>

      {/* Right Side Tools */}
      <div className="flex items-center gap-1">
        {onUndo && (
          <button onClick={onUndo} disabled={!canUndo} className={`p-2 transition-colors ${canUndo ? 'text-white hover:bg-[#222]' : 'text-[#444]'} rounded-lg`}>
            <Undo2 size={16} />
          </button>
        )}
        {onRedo && (
          <button onClick={onRedo} disabled={!canRedo} className={`p-2 transition-colors ${canRedo ? 'text-white hover:bg-[#222]' : 'text-[#444]'} rounded-lg`}>
            <Redo2 size={16} />
          </button>
        )}
        {onSave && (
          <button onClick={onSave} title="Save" className="p-2 text-white hover:bg-[#222] transition-colors rounded-lg">
            <Save size={16} />
          </button>
        )}
        <button onClick={onLookup} disabled={isSearching}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground ml-1 transition-all active:scale-95 disabled:opacity-50 lookup-pulse">
          <Search size={15} />
        </button>
      </div>
    </div>
  );
};

export default HeaderBar;
