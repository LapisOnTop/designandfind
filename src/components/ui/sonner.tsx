import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Custom Toaster that renders inside the .phone-screen-content container
 * instead of using sonner's default document.body portal
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Find the phone-screen-content element to use as the portal target
    const el = document.querySelector(".phone-screen-content") as HTMLElement;
    if (el) {
      // Ensure the container is positioned for absolute children
      el.style.position = "relative";
      setContainer(el);
    }
  }, []);

  const toaster = (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={{
        position: "absolute",
        bottom: "16px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        zIndex: 9999,
      }}
      containerAriaLabel="Notifications"
      toastOptions={{
        classNames: {
          toast:
            "group toast !bg-[#1a1a2e] !text-white !border-white/10 !shadow-lg !rounded-xl !text-[13px]",
          description: "!text-white/60",
          actionButton: "!bg-blue-500 !text-white",
          cancelButton: "!bg-white/10 !text-white/60",
        },
      }}
      {...props}
    />
  );

  // If we found the phone container, portal into it; otherwise render normally
  if (container) {
    return createPortal(toaster, container);
  }

  return toaster;
};

export { Toaster, toast };
