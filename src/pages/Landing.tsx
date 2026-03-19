import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingBag, Upload, PencilRuler, X, Sparkles, Layers } from "lucide-react";
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
      <div className="flex flex-col h-full bg-[#0a0a0a] relative overflow-hidden font-sans text-white">

        {/* Animated Liquid Background */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ y: [0, -20, 0], scale: [1, 1.05, 1], rotate: [0, 5, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[10%] -left-[20%] w-[70%] h-[50%] rounded-full bg-primary/20 blur-[80px]"
          />
          <motion.div
            animate={{ x: [0, 30, 0], scale: [1, 1.1, 1], rotate: [0, -5, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-[40%] -right-[20%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[80px]"
          />
          <motion.div
            animate={{ y: [0, 40, 0], x: [0, -30, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 5 }}
            className="absolute -bottom-[20%] left-[10%] w-[80%] h-[40%] rounded-full bg-purple-500/15 blur-[80px]"
          />
        </div>

        <div className="relative z-10 flex-1 flex flex-col px-6 pt-16 hide-scrollbar overflow-y-auto pb-6">
          {/* Header Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-2 mb-10"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.4)]">
              <Search size={22} className="text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">DesignMatch</span>
          </motion.div>

          {/* Hero Copy */}
          <div className="text-center mb-10">
            <motion.h1
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.7 }}
              className="text-4xl leading-[1.1] font-extrabold tracking-tight mb-4"
            >
              Design your product,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary via-blue-400 to-purple-400">
                find it anywhere.
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}
              className="text-white/60 text-sm max-w-[280px] mx-auto"
            >
              Instantly search global marketplaces and create stunning mockups in seconds.
            </motion.p>
          </div>

          {/* Features Cards */}
          <div className="flex flex-col gap-3 mb-12">
            {[
              { icon: Search, color: "text-blue-400", bg: "bg-blue-400/10", title: "Visual Lookup Engine" },
              { icon: ShoppingBag, color: "text-primary", bg: "bg-primary/10", title: "Real Global Products" },
              { icon: Layers, color: "text-purple-400", bg: "bg-purple-400/10", title: "Studio Editor" },
            ].map((ft, i) => (
              <motion.div
                key={ft.title}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + (i * 0.1), type: "spring", stiffness: 200, damping: 20 }}
                className="flex items-center gap-4 bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl p-4 rounded-2xl shadow-sm"
              >
                <div className={`p-2.5 rounded-xl ${ft.bg}`}>
                  <ft.icon size={20} className={ft.color} />
                </div>
                <span className="font-semibold text-white/90 text-sm">{ft.title}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Floating CTA Dock */}
        <motion.div
          initial={{ y: 100 }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 25, delay: 0.7 }}
          className="relative z-20 px-5 pb-8 pt-4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent"
        >
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
          <input type="file" accept="image/*" className="hidden" ref={templateInputRef} onChange={handleTemplateUpload} />

          <div className="flex flex-col gap-3">
            <button
              onClick={handleUploadClick}
              className="relative overflow-hidden w-full group py-4 rounded-2xl font-bold text-[15px] text-white shadow-[0_0_30px_rgba(var(--primary),0.3)] active:scale-[0.98] transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-blue-500 to-primary background-animate" />
              <div className="absolute inset-[1px] bg-[#0a0a0a]/40 backdrop-blur-md rounded-2xl group-hover:bg-[#0a0a0a]/20 transition-colors" />
              <div className="relative z-10 flex items-center justify-center gap-2">
                <Upload size={18} /> Upload Design
              </div>
            </button>

            <button
              onClick={() => setShowTemplatePrompt(true)}
              className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-white/10"
            >
              <PencilRuler size={18} className="text-white/60" /> Make Design
            </button>
          </div>
        </motion.div>

        {/* Template Prompt Modal */}
        <AnimatePresence>
          {showTemplatePrompt && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center px-6"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full bg-[#111] backdrop-blur-3xl rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-white/10 p-6 relative overflow-hidden"
              >
                {/* Glow behind modal */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-24 bg-primary/20 blur-[40px] pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold text-white">Got a template?</h2>
                    <button onClick={() => setShowTemplatePrompt(false)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors">
                      <X size={16} />
                    </button>
                  </div>

                  <p className="text-sm text-white/50 mb-8 leading-relaxed">
                    Have a template to use? If not, use ours or go find one at{" "}
                    <a href="https://www.freepik.com/app" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">Freepik</a>!
                  </p>

                  <div className="flex flex-col gap-3">
                    <button onClick={() => { setShowTemplatePrompt(false); navigate("/studio?template=tshirt"); }} className="w-full py-3.5 rounded-2xl bg-white text-black font-bold active:scale-[0.98] transition-all">
                      Use Default Template
                    </button>
                    <button onClick={() => { setShowTemplatePrompt(false); templateInputRef.current?.click(); }} className="w-full py-3.5 rounded-2xl bg-white/10 border border-white/5 text-white font-bold active:scale-[0.98] transition-all">
                      Upload My Template
                    </button>
                  </div>
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
