import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingBag, Upload, PencilRuler, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PhoneFrame from "@/components/PhoneFrame";

const Landing = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);
  const [showTemplatePrompt, setShowTemplatePrompt] = useState(false);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        localStorage.setItem("designMatchUpload", dataUrl);
        navigate("/studio?autoLookup=true");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        localStorage.setItem("designMatchTemplate", dataUrl);
        navigate("/studio?customTemplate=true");
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <PhoneFrame>
      <div className="flex flex-col h-full bg-background relative">
        <div className="h-12" />

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg"
          >
            <Search size={28} className="text-primary-foreground" />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="text-3xl font-extrabold text-foreground mb-3 tracking-tight">DesignMatch</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Design your product, find it anywhere.
              <br />
              Instantly search global marketplaces.
            </p>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-col gap-3 w-full"
          >
            {[
              { icon: Search, label: "Visual Lookup Engine" },
              { icon: ShoppingBag, label: "Real Global Products" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/50 backdrop-blur-sm border border-border shadow-sm"
              >
                <Icon size={18} className="text-primary" />
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="px-6 pb-12 flex flex-col gap-4"
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button
            onClick={handleUploadClick}
            className="relative w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-primary-foreground text-base font-bold shadow-[0_8px_16px_rgba(0,0,0,0.15)] active:scale-[0.98] active:shadow-sm transition-all overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-colors" />
            <Upload size={20} />
            <span>Upload Design</span>
          </button>

          <button
            onClick={() => setShowProductSelect(true)}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-background text-foreground text-base font-bold active:scale-[0.98] transition-all border-2 border-primary shadow-sm"
          >
            <PencilRuler size={20} className="text-primary" />
            <span>Make Design</span>
          </button>
        </motion.div>

        {/* Product Selection Modal */}
        <AnimatePresence>
          {showProductSelect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-end"
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-full bg-background/60 backdrop-blur-3xl rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.3)] border-t border-white/20 dark:border-white/10 p-6 pb-10"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-foreground mx-auto">What are you designing?</h2>
                  <button
                    onClick={() => setShowProductSelect(false)}
                    className="absolute right-6 p-2 rounded-full bg-white/20 dark:bg-black/40 text-foreground transition-colors backdrop-blur-md"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {PRODUCTS.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleProductSelect(product.id)}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-white/30 dark:hover:bg-white/10 active:scale-[0.95] transition-all"
                    >
                      <div className="w-14 h-14 rounded-full bg-white/40 dark:bg-black/40 backdrop-blur-md flex items-center justify-center text-2xl shadow-sm border border-white/30 dark:border-white/10">
                        {product.icon}
                      </div>
                      <span className="text-xs font-semibold text-foreground text-center">
                        {product.name}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PhoneFrame>
  );
};

export default Landing;
