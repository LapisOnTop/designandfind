import { ReactNode } from "react";

interface PhoneFrameProps {
  children: ReactNode;
}

const PhoneFrame = ({ children }: PhoneFrameProps) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a] relative overflow-hidden p-8">
      {/* Dynamic Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

      {/* Realistic Phone Container */}
      <div className="phone-frame">
        {/* Notch Area */}
        <div className="phone-notch">
          <div className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a]" />
        </div>

        {/* Hardware buttons are added via CSS pseudo-elements in index.css */}
        <div className="phone-button-power" />

        {/* Main Content Screen */}
        <div className="flex-1 w-full h-full relative overflow-hidden bg-[#0a0a0a]">
          {children}
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/20 rounded-full z-50" />
      </div>
    </div>
  );
};

export default PhoneFrame;
