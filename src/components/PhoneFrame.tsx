import { ReactNode } from "react";

interface PhoneFrameProps {
  children: ReactNode;
}

const PhoneFrame = ({ children }: PhoneFrameProps) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#050505] relative overflow-hidden p-6 md:p-12">
      {/* Background Blobs for Liquid Glass aesthetic */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-primary/20 blur-[130px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-blue-600/10 blur-[130px] animate-pulse pointer-events-none" style={{ animationDelay: '3s' }} />

      <div className="phone-frame">
        {/* Notch Container */}
        <div className="phone-notch">
          <div className="phone-notch-speaker" />
          <div className="phone-notch-camera" />
        </div>

        {/* Screen Content */}
        <div className="phone-screen-content">
          {children}
        </div>

        {/* Home Indicator */}
        <div className="phone-home-indicator" />
      </div>
    </div>
  );
};

export default PhoneFrame;
