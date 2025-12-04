import { createContext, useContext, useState, useEffect } from "react";

interface DevModeContextType {
  bypassNavigation: boolean;
  setBypassNavigation: (bypass: boolean) => void;
}

const DevModeContext = createContext<DevModeContextType | undefined>(undefined);

export const DevModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [bypassNavigation, setBypassNavigation] = useState(false);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    // Load from localStorage on mount
    const stored = localStorage.getItem("gp-ui.dev-bypass-navigation");
    if (stored === "true") {
      setBypassNavigation(true);
    }
  }, []);

  const handleSetBypass = (bypass: boolean) => {
    setBypassNavigation(bypass);
    if (import.meta.env.DEV) {
      localStorage.setItem("gp-ui.dev-bypass-navigation", bypass ? "true" : "false");
    }
  };

  return (
    <DevModeContext.Provider value={{ bypassNavigation, setBypassNavigation: handleSetBypass }}>
      {children}
    </DevModeContext.Provider>
  );
};

export const useDevMode = () => {
  const context = useContext(DevModeContext);
  if (!context) {
    throw new Error("useDevMode must be used within DevModeProvider");
  }
  return context;
};
