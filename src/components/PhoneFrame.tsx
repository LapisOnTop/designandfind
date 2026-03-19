import { ReactNode } from "react";

interface PhoneFrameProps {
  children: ReactNode;
}

const PhoneFrame = ({ children }: PhoneFrameProps) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background relative overflow-hidden p-4">
      {/* Ambient background blur blobs for Liquid Glass effect */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[120px] mix-blend-screen pointer-events-none" />

      <div className="phone-frame bg-background/40 backdrop-blur-[40px] flex flex-col border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
        <div className="phone-notch bg-background/60 backdrop-blur-xl border-b border-x border-white/5 shadow-sm" />
        {children}
      </div>
    </div>
  );
};

export default PhoneFrame;
