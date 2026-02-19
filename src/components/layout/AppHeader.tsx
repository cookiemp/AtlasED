import { Compass, ArrowLeft, Settings, Network, Brain } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  showBack?: boolean;
  backLabel?: string;
  backTo?: string;
  title?: string;
  subtitle?: string;
}

export function AppHeader({ showBack = true, backLabel = "Back", backTo, title, subtitle }: AppHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isSettingsPage = location.pathname === "/settings";
  const isAtlasPage = location.pathname === "/atlas";
  const isMemoryPage = location.pathname === "/memory";
  const isHome = location.pathname === "/";

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="h-14 bg-atlas-bg-secondary border-b border-atlas-border flex items-center justify-between px-6 select-none">
      {/* Left: Logo and Navigation */}
      <div className="flex items-center gap-6">
        {/* Logo */}
        <button
          type="button"
          className="flex items-center gap-2.5 cursor-pointer bg-transparent border-none p-0"
          onClick={() => navigate("/")}
        >
          <div className="w-8 h-8 rounded-lg bg-atlas-gold flex items-center justify-center">
            <Compass className="w-[18px] h-[18px] text-atlas-bg-primary" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-atlas-text-primary">
            AtlasED
          </span>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-atlas-border" />

        {/* Back Button or Title */}
        {title ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-atlas-text-muted">{subtitle}</span>
            {subtitle && <span className="text-atlas-text-muted">•</span>}
            <span className="text-sm font-medium text-atlas-text-secondary">{title}</span>
          </div>
        ) : showBack && !isHome ? (
          <button
            onClick={handleBack}
            className={cn(
              "flex items-center gap-2 text-atlas-text-secondary hover:text-atlas-text-primary transition-colors duration-200 group",
              isHome && "opacity-30 cursor-not-allowed pointer-events-none"
            )}
            disabled={isHome}
          >
            <ArrowLeft className="w-[18px] h-[18px] group-hover:-translate-x-0.5 transition-transform duration-200" />
            <span className="text-sm font-medium">{backLabel}</span>
          </button>
        ) : null}
      </div>

      {/* Right: Atlas + Settings */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate("/atlas")}
          className={cn(
            "flex items-center gap-2 text-atlas-text-secondary hover:text-atlas-text-primary transition-colors duration-200 group px-3 py-1.5 rounded-lg hover:bg-atlas-bg-tertiary",
            isAtlasPage && "bg-atlas-gold/10 text-atlas-gold"
          )}
        >
          <Network className={cn(
            "w-[18px] h-[18px] transition-transform duration-300",
          )} />
          <span className="text-sm font-medium">The Atlas</span>
        </button>
        <button
          onClick={() => navigate("/memory")}
          className={cn(
            "flex items-center gap-2 text-atlas-text-secondary hover:text-atlas-text-primary transition-colors duration-200 group px-3 py-1.5 rounded-lg hover:bg-atlas-bg-tertiary",
            isMemoryPage && "bg-atlas-gold/10 text-atlas-gold"
          )}
        >
          <Brain className={cn(
            "w-[18px] h-[18px] transition-transform duration-300",
          )} />
          <span className="text-sm font-medium">Memory</span>
        </button>
        <button
          onClick={() => navigate("/settings")}
          className={cn(
            "flex items-center gap-2 text-atlas-text-secondary hover:text-atlas-text-primary transition-colors duration-200 group px-3 py-1.5 rounded-lg hover:bg-atlas-bg-tertiary",
            isSettingsPage && "bg-atlas-gold/10 text-atlas-gold"
          )}
        >
          <Settings className={cn(
            "w-[18px] h-[18px] transition-transform duration-300",
            !isSettingsPage && "group-hover:rotate-90"
          )} />
          <span className="text-sm font-medium">Settings</span>
        </button>
      </div>
    </header>
  );
}
