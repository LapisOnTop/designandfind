import { Search, ChevronLeft, Save, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

interface HeaderBarProps {
  onLookup: () => void;
  isSearching: boolean;
  onExit?: () => void;
  onSave?: () => void;
}

type ThemeMode = "light" | "dark";

const HeaderBar = ({ onLookup, isSearching, onExit, onSave }: HeaderBarProps) => {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as ThemeMode | null;
    const initial: ThemeMode = storedTheme === "light" ? "light" : "dark";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;
    root.classList.remove("dark", "theme-liquid");
    if (mode === "dark") {
      root.classList.add("dark");
    }
  };

  const toggleTheme = () => {
    const next: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    localStorage.setItem("theme", next);
  };

  return (
    <div className="flex items-center justify-between px-5 pt-10 pb-3 bg-background/80 backdrop-blur-xl border-b border-foreground/10 shadow-sm relative z-50 transition-all duration-300">
      <div className="flex items-center gap-2">
        <button onClick={toggleTheme}
          className="p-1.5 rounded-lg bg-secondary/30 text-muted-foreground active:bg-border transition-colors hover:text-foreground hover:bg-secondary/50 mr-1"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}>
          {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        {onExit && (
          <button onClick={onExit}
            className="p-1.5 rounded-lg bg-secondary/30 text-muted-foreground active:bg-border transition-colors hover:text-foreground hover:bg-secondary/50">
            <ChevronLeft size={16} />
          </button>
        )}
        <h1 className="text-base font-semibold tracking-tight ml-1 text-foreground drop-shadow-sm">Studio</h1>
      </div>
      <div className="flex items-center gap-2">
        {onSave && (
          <button onClick={onSave} title="Save Design"
            className="p-2 rounded-lg bg-secondary text-primary transition-colors active:scale-95 hover:bg-primary/10">
            <Save size={16} />
          </button>
        )}
        <button onClick={onLookup} disabled={isSearching}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-all active:scale-95 disabled:opacity-50 lookup-pulse">
          <Search size={15} />
          Lookup
        </button>
      </div>
    </div>
  );
};

export default HeaderBar;
