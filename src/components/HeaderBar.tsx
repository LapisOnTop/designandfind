import { Search, LogOut, Save, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

interface HeaderBarProps {
  onLookup: () => void;
  isSearching: boolean;
  onSignOut?: () => void;
  onSave?: () => void;
}

const HeaderBar = ({ onLookup, isSearching, onSignOut, onSave }: HeaderBarProps) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme
    const theme = localStorage.getItem("theme");
    if (theme === "dark" || (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleSignOutClick = () => {
    if (!onSignOut) return;
    if (window.confirm("Sign out of your account?")) {
      onSignOut();
    }
  };

  return (
    <div className="flex items-center justify-between px-5 pt-10 pb-3 bg-background border-b border-border">
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg bg-secondary text-muted-foreground active:bg-border transition-colors hover:text-foreground hover:bg-secondary/80 mr-1"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        {onSignOut && (
          <button
            onClick={handleSignOutClick}
            className="p-1.5 rounded-lg bg-secondary text-muted-foreground active:bg-border transition-colors hover:text-foreground hover:bg-secondary/80"
          >
            <LogOut size={16} />
          </button>
        )}
        <h1 className="text-base font-semibold text-foreground tracking-tight ml-1">Studio</h1>
      </div>
      <div className="flex items-center gap-2">
        {onSave && (
          <button
            onClick={onSave}
            title="Save Design"
            className="p-2 rounded-lg bg-secondary text-primary transition-colors active:scale-95 hover:bg-primary/10"
          >
            <Save size={16} />
          </button>
        )}
        <button
          onClick={onLookup}
          disabled={isSearching}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-all active:scale-95 disabled:opacity-50"
        >
          <Search size={15} />
          Lookup
        </button>
      </div>
    </div>
  );
};

export default HeaderBar;
