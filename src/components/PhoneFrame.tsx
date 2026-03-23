import { ReactNode } from "react";

interface PhoneFrameProps {
  children: ReactNode;
}

const PhoneFrame = ({ children }: PhoneFrameProps) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black p-6 md:p-12">
      <div className="phone-frame">
        <div className="phone-notch">
          <div className="phone-notch-speaker" />
          <div className="phone-notch-camera" />
        </div>
        <div className="phone-screen-content">
          {children}
        </div>
        <div className="phone-home-indicator" />
      </div>
    </div>
  );
};

export default PhoneFrame;

