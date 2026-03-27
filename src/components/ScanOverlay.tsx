import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ScanSearch } from "lucide-react";

const SCAN_STEPS = [
  "Analyzing image vectors...",
  "Extracting primary subjects...",
  "Querying global vendor databases...",
  "Calculating price matches...",
  "Finalizing results..."
];

const ScanOverlay = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => Math.min(prev + 1, SCAN_STEPS.length - 1));
    }, 800); // Faster iteration for a more high-tech feel
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden font-sans"
    >
      {/* Smoked liquid glass backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[40px]" />

      {/* Cyberpunk grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(white 1px, transparent 0)', backgroundSize: '24px 24px' }}
      />

      {/* Scanning Laser Line bouncing up and down - White Glass Look */}
      <motion.div
        className="absolute left-0 right-0 h-[2px] bg-white shadow-[0_0_20px_4px_rgba(255,255,255,0.6)] z-10"
        animate={{ top: ["15%", "85%", "15%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-20 flex flex-col items-center justify-center gap-10">
        {/* Animated Icon Box */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Corner brackets - White */}
          <div className="absolute top-0 left-0 w-5 h-5 border-t-[3px] border-l-[3px] border-white/70 rounded-tl-sm shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
          <div className="absolute top-0 right-0 w-5 h-5 border-t-[3px] border-r-[3px] border-white/70 rounded-tr-sm shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
          <div className="absolute bottom-0 left-0 w-5 h-5 border-b-[3px] border-l-[3px] border-white/70 rounded-bl-sm shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
          <div className="absolute bottom-0 right-0 w-5 h-5 border-b-[3px] border-r-[3px] border-white/70 rounded-br-sm shadow-[0_0_8px_rgba(255,255,255,0.4)]" />

          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="bg-white/[0.04] backdrop-blur-md p-5 rounded-full border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
          >
            <ScanSearch size={48} className="text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]" />
          </motion.div>
        </div>

        {/* Text Steps */}
        <div className="h-6 flex flex-col items-center overflow-hidden w-72">
          <AnimatePresence mode="wait">
            <motion.p
              key={step}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="text-[11px] font-mono text-white tracking-widest text-center font-bold drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]"
            >
              {SCAN_STEPS[step]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default ScanOverlay;
