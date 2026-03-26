import { useState } from "react";
import { X, ExternalLink, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface ProductResult {
  title: string;
  price: string;
  priceUSD?: string;
  pricePHP?: string;
  source: string;
  thumbnail: string;
  link: string;
}

interface ResultsDrawerProps {
  open: boolean;
  onClose: () => void;
  results: ProductResult[] | null;
}

const ResultsDrawer = ({ open, onClose, results }: ResultsDrawerProps) => {
  const totalResults = results ? results.length : 0;
  const [currency, setCurrency] = useState<"USD" | "PHP">("PHP");

  const getPrice = (product: ProductResult) => {
    const PHP_RATE = 56.5;
    if (currency === "PHP") {
      if (product.pricePHP && product.pricePHP !== "Price N/A") return product.pricePHP;
      // Auto-convert from any dollar amount
      const raw = product.priceUSD || product.price || "";
      const match = raw.match(/[\d,.]+/);
      if (match) {
        const val = parseFloat(match[0].replace(/,/g, ""));
        if (!isNaN(val)) return `₱${(val * PHP_RATE).toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      return product.price && product.price !== "Price N/A" ? product.price : "Price N/A";
    }
    if (product.priceUSD && product.priceUSD !== "Price N/A") return product.priceUSD;
    return product.price || "Price N/A";
  };
  const withPrice = (results || []).filter(product => getPrice(product) !== "Price N/A");
  const withoutPrice = (results || []).filter(product => getPrice(product) === "Price N/A");

  const renderCard = (product: ProductResult, i: number) => (
    <motion.div
      key={`${product.link}-${i}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.03, duration: 0.25 }}
      className="bg-white/[0.04] rounded-2xl overflow-hidden flex flex-col border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12] transition-all group"
    >
      <div className="aspect-square bg-black/30 flex items-center justify-center overflow-hidden relative">
        <img
          src={product.thumbnail}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.svg";
          }}
        />
      </div>
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <p className="text-[11px] font-semibold text-white/90 line-clamp-2 leading-tight">{product.title}</p>
        <p className="text-[9px] font-bold text-white/40 bg-white/[0.06] rounded px-1.5 py-0.5 w-max uppercase tracking-wider">{product.source}</p>
        {getPrice(product) !== "Price N/A" && (
          <p className="text-sm font-bold text-white pt-0.5">{getPrice(product)}</p>
        )}
        <a
          href={product.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white text-black text-[10px] font-bold uppercase tracking-widest active:scale-[0.96] transition-all hover:bg-[#e0e0e0] shadow-[0_4px_14px_rgba(255,255,255,0.1)]"
        >
          Source <ExternalLink size={12} strokeWidth={2.5} />
        </a>
      </div>
    </motion.div>
  );

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
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 sticky top-0 z-10 rounded-t-3xl bg-black/60 backdrop-blur-xl">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Sourcing Matches</h2>
              <p className="text-xs text-white/50 font-medium">{totalResults} results found globally</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Currency Toggle */}
              <div className="flex bg-[#111] rounded-lg p-1 border border-white/10">
                <button
                  onClick={() => setCurrency("USD")}
                  className={`px-3 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold transition-all ${currency === "USD"
                    ? "bg-white text-black shadow-sm"
                    : "text-[#888] hover:text-white"
                    }`}
                >
                  USD $
                </button>
                <button
                  onClick={() => setCurrency("PHP")}
                  className={`px-3 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold transition-all ${currency === "PHP"
                    ? "bg-white text-black shadow-sm"
                    : "text-[#888] hover:text-white"
                    }`}
                >
                  PHP ₱
                </button>
              </div>
              <button onClick={onClose} className="p-2 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-all">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Results Grid */}
          <div className="overflow-y-auto p-4 pb-24" style={{ maxHeight: "calc(85vh - 70px)" }}>
            {withPrice.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-bold text-white/70 tracking-widest uppercase mb-4 px-1 flex items-center gap-2">
                  <Search size={14} className="text-white/50" /> Look A like products
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {withPrice.map((product, i) => renderCard(product, i))}
                </div>
              </div>
            )}

            {withoutPrice.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-white/70 tracking-widest uppercase mb-4 px-1 flex items-center gap-2">
                  <Search size={14} className="text-white/30" /> Visual matches
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {withoutPrice.map((product, i) => renderCard(product, i))}
                </div>
              </div>
            )}

            {(!results || results.length === 0) && (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <p className="text-sm text-white/50">No matches found.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ResultsDrawer;
