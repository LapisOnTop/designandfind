import { X, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface ProductResult {
  title: string;
  price: string;
  source: string;
  thumbnail: string;
  link: string;
}

type CategoryKey = "Global General Marketplaces" | "Regional Powerhouses" | "Specialized & Niche Stores" | "Social & Local Commerce";
type CategorizedResults = Record<CategoryKey, ProductResult[]>;

interface ResultsDrawerProps {
  open: boolean;
  onClose: () => void;
  results: CategorizedResults | null;
}

const ResultsDrawer = ({ open, onClose, results }: ResultsDrawerProps) => {
  const categories = results ? (Object.keys(results) as CategoryKey[]) : [];
  const totalResults = results ? categories.reduce((sum, cat) => sum + results[cat].length, 0) : 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 z-50 backdrop-blur-[20px] bg-black/40 rounded-t-3xl border-t border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.3)]"
          style={{ maxHeight: "85%" }}
        >
          {/* Handle */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 backdrop-blur-md sticky top-0 z-10 rounded-t-3xl">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight drop-shadow-sm">Sourcing Matches</h2>
              <p className="text-xs text-white/60 font-medium">{totalResults} results found globally</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-white/10 backdrop-blur-sm text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200">
              <X size={18} />
            </button>
          </div>

          {/* Results grouped by category */}
          <div className="overflow-y-auto p-5 space-y-8" style={{ maxHeight: "calc(85vh - 70px)" }}>
            {categories.map((category) => (
              <div key={category} className="space-y-4">
                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] px-1 drop-shadow-sm">
                  {category}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {results![category].map((product, i) => (
                    <div key={i} className="backdrop-blur-lg bg-white/5 rounded-2xl overflow-hidden flex flex-col border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group shadow-lg">
                      <div className="aspect-square bg-black/30 flex items-center justify-center overflow-hidden relative">
                        <img
                          src={product.thumbnail}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder.svg";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <div className="p-4 flex flex-col gap-2 flex-1 backdrop-blur-sm">
                        <p className="text-[11px] font-bold text-white/95 line-clamp-2 leading-tight min-h-[2.2em] drop-shadow-sm">{product.title}</p>
                        <p className="text-[9px] font-black text-white/50 bg-white/10 backdrop-blur-sm rounded-md px-2 py-1 w-max uppercase tracking-wider">{product.source}</p>
                        <p className="text-sm font-black text-primary pt-1 drop-shadow-sm">{product.price}</p>
                        <a
                          href={product.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/90 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest active:scale-[0.95] transition-all duration-200 shadow-xl shadow-primary/30 hover:bg-primary hover:shadow-primary/40"
                        >
                          Source <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ResultsDrawer;
