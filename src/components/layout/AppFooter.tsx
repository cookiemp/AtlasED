import { Database } from "lucide-react";

export function AppFooter() {
  return (
    <footer className="h-10 bg-atlas-bg-secondary border-t border-atlas-border flex items-center justify-between px-6 text-xs text-atlas-text-muted">
      <div className="flex items-center gap-4">
        <span>AtlasED v0.1.0</span>
        <span className="w-1 h-1 rounded-full bg-atlas-border" />
        <span className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5" />
          Local Storage
        </span>
      </div>
      <div className="flex items-center gap-4">
        <button className="hover:text-atlas-gold transition-colors duration-200">Help</button>
        <button className="hover:text-atlas-gold transition-colors duration-200">Feedback</button>
      </div>
    </footer>
  );
}
