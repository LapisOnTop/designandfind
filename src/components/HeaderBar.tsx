import { Search, ChevronLeft, Save, Sun, Moon, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface HeaderBarProps {
  onLookup: () => void;
  isSearching: boolean;
  onExit?: () => void;
  onSave?: () => void;
}

type ThemeMode = "light" | "dark" | "liquid";

const HeaderBar = ({ onLookup, isSearching, onExit, onSave }: HeaderBarProps) => {
  const [theme, setTheme] = useState<ThemeMode>("liquid");

  useEffect(() => {
    // Check initial theme. Default to liquid if none.
    const storedTheme = localStorage.getItem("theme") as ThemeMode | null;
    let initialTheme: ThemeMode = "liquid";

    if (storedTheme && ["light", "dark", "liquid"].includes(storedTheme)) {
      initialTheme = storedTheme;
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      // If no stored theme but OS is dark, you could default to dark. 
      // But user requested Liquid Glass as default/main theme.
      initialTheme = "liquid";
    }

    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;
    root.classList.remove("dark", "theme-liquid");

    if (mode === "dark") {
      root.classList.add("dark");
    } else if (mode === "liquid") {
      root.classList.add("dark", "theme-liquid");
    }
  };

  const cycleTheme = () => {
    const sequence: ThemeMode[] = ["liquid", "dark", "light"];
    const currentIndex = sequence.indexOf(theme);
    const nextTheme = sequence[(currentIndex + 1) % sequence.length];

    setTheme(nextTheme);
    applyTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
  };

  const handleExitClick = () => {
    if (onExit) {
      onExit();
    }
  };

  return (
    <div className="flex items-center justify-between px-5 pt-10 pb-3 bg-background/50 backdrop-blur-3xl border-b border-foreground/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] relative z-50 liquid-panel transition-all duration-300">
      <div className="flex items-center gap-2">
        <button
          onClick={cycleTheme}
          className="p-1.5 rounded-lg bg-secondary/30 text-muted-foreground active:bg-border transition-colors hover:text-foreground hover:bg-secondary/50 mr-1 liquid-button"
          title={`Switch Theme (Current: ${theme})`}
        >
          {theme === "light" && <Sun size={16} />}
          {theme === "dark" && <Moon size={16} />}
          {theme === "liquid" && <Sparkles size={16} className="text-primary animate-pulse" />}
        </button>
        {onExit && (
          <button
            onClick={handleExitClick}
            className="p-1.5 rounded-lg bg-secondary/30 text-muted-foreground active:bg-border transition-colors hover:text-foreground hover:bg-secondary/50 liquid-button"
          >
            <ChevronLeft size={16} />
          </button>
        )}
        <h1 className={`text-base font-semibold tracking-tight ml-1 drop-shadow-sm ${theme === "liquid" ? "shimmer-text" : "text-foreground"}`}>Studio</h1>
      </div>
      <div className="flex items-center gap-2">
        {onSave && (
          <button
            onClick={onSave}
            title="Save Design"
            className="p-2 rounded-lg bg-secondary text-primary transition-colors active:scale-95 hover:bg-primary/10 liquid-button"
          >
            <Save size={16} />
          </button>
        )}
        <button
          onClick={onLookup}
          disabled={isSearching}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-all active:scale-95 disabled:opacity-50"
          style={theme === 'liquid' ? { boxShadow: '0 0 15px var(--primary)', border: '1px solid rgba(255,255,255,0.4)' } : {}}
        >
          <Search size={15} />
          Lookup
        </button>
      </div>
    </div>
  );
};

export default HeaderBar;
