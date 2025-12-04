import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Lock, Unlock } from "lucide-react";
import { useDevMode } from "@/context/DevModeContext";
import { useState } from "react";

const DEV_PAGES = [
  { path: "/register", label: "Register" },
  { path: "/kyc", label: "KYC" },
  { path: "/safe-deployment", label: "Safe Deploy" },
  { path: "/", label: "Home" },
  { path: "/cards", label: "Cards" },
  { path: "/account", label: "Account" },
  { path: "/withdraw", label: "Withdraw" },
];

export const DevNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bypassNavigation, setBypassNavigation } = useDevMode();
  const [showBypassToggle, setShowBypassToggle] = useState(false);

  const currentIndex = DEV_PAGES.findIndex((p) => p.path === location.pathname);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < DEV_PAGES.length - 1;

  const goToPrev = () => {
    if (canGoPrev) {
      setBypassNavigation(true);
      navigate(DEV_PAGES[currentIndex - 1].path);
    }
  };

  const goToNext = () => {
    if (canGoNext) {
      setBypassNavigation(true);
      navigate(DEV_PAGES[currentIndex + 1].path);
    }
  };

  const handlePageClick = (path: string) => {
    setBypassNavigation(true);
    navigate(path);
  };

  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-sm bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 z-40">
      <div className="flex items-center justify-between gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={goToPrev}
          disabled={!canGoPrev}
          className="h-8 w-8 p-0"
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-purple-800 dark:text-purple-200 text-center truncate">
            {DEV_PAGES[currentIndex]?.label || "Unknown"}
          </p>
          <p className="text-xs text-purple-700 dark:text-purple-300 text-center truncate">
            {location.pathname}
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400 text-center">
            {currentIndex + 1} / {DEV_PAGES.length}
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={goToNext}
          disabled={!canGoNext}
          className="h-8 w-8 p-0"
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 flex flex-wrap gap-1">
          {DEV_PAGES.map((page) => (
            <button
              key={page.path}
              onClick={() => handlePageClick(page.path)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                location.pathname === page.path
                  ? "bg-purple-600 text-white"
                  : "bg-purple-100 dark:bg-purple-800 text-purple-900 dark:text-purple-100 hover:bg-purple-200 dark:hover:bg-purple-700"
              }`}
            >
              {page.label}
            </button>
          ))}
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowBypassToggle(!showBypassToggle)}
          className="h-8 w-8 p-0 flex-shrink-0"
          title={bypassNavigation ? "Auto-nav disabled" : "Auto-nav enabled"}
        >
          {bypassNavigation ? (
            <Unlock className="w-3 h-3" />
          ) : (
            <Lock className="w-3 h-3" />
          )}
        </Button>
      </div>

      {showBypassToggle && (
        <div className="mt-2 pt-2 border-t border-purple-200 dark:border-purple-800 flex items-center justify-between">
          <span className="text-xs text-purple-700 dark:text-purple-300">
            Auto-navigation:
          </span>
          <button
            onClick={() => {
              setBypassNavigation(!bypassNavigation);
            }}
            className={`text-xs px-3 py-1 rounded transition-colors ${
              bypassNavigation
                ? "bg-purple-600 text-white"
                : "bg-purple-200 dark:bg-purple-700 text-purple-900 dark:text-purple-100"
            }`}
          >
            {bypassNavigation ? "Disabled" : "Enabled"}
          </button>
        </div>
      )}
    </div>
  );
};
