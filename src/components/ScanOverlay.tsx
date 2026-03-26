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
      {/* Heavy blur backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />

      {/* Cyberpunk grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(white 1px, transparent 0)', backgroundSize: '24px 24px' }}
      />

      {/* Scanning Laser Line bouncing up and down */}
      <motion.div
        className="absolute left-0 right-0 h-[2px] bg-blue-500 shadow-[0_0_20px_4px_rgba(59,130,246,0.6)] z-10"
        animate={{ top: ["15%", "85%", "15%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Laser Gradient wash */}
      <motion.div
        className="absolute left-0 right-0 h-32 bg-gradient-to-b from-blue-500/10 to-transparent z-0"
        animate={{ top: ["15%", "85%", "15%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-20 flex flex-col items-center justify-center gap-10">
        {/* Animated Icon Box */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-5 h-5 border-t-[3px] border-l-[3px] border-blue-500 rounded-tl-sm" />
          <div className="absolute top-0 right-0 w-5 h-5 border-t-[3px] border-r-[3px] border-blue-500 rounded-tr-sm" />
          <div className="absolute bottom-0 left-0 w-5 h-5 border-b-[3px] border-l-[3px] border-blue-500 rounded-bl-sm" />
          <div className="absolute bottom-0 right-0 w-5 h-5 border-b-[3px] border-r-[3px] border-blue-500 rounded-br-sm" />

          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="bg-blue-500/10 p-5 rounded-full"
          >
            <ScanSearch size={48} className="text-blue-400" />
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
              className="text-[11px] font-mono text-blue-400 uppercase tracking-widest text-center font-bold shadow-blue-500/50 [text-shadow:0_0_10px_rgba(59,130,246,0.5)]"
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
