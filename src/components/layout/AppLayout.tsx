import { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { AppFooter } from "./AppFooter";

interface AppLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  headerProps?: {
    showBack?: boolean;
    backLabel?: string;
    backTo?: string;
    title?: string;
    subtitle?: string;
  };
}

export function AppLayout({
  children,
  showHeader = true,
  showFooter = false,
  headerProps
}: AppLayoutProps) {
  return (
    <div className="h-screen bg-atlas-bg-primary text-atlas-text-primary flex flex-col overflow-hidden">
      {showHeader && <AppHeader {...headerProps} />}
      <main className="flex-1 flex flex-col overflow-y-auto min-h-0">
        {children}
      </main>
      {showFooter && <AppFooter />}
    </div>
  );
}
