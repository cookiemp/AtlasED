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
  showFooter = true,
  headerProps 
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-atlas-bg-primary text-atlas-text-primary flex flex-col">
      {showHeader && <AppHeader {...headerProps} />}
      <main className="flex-1 flex flex-col overflow-auto">
        {children}
      </main>
      {showFooter && <AppFooter />}
    </div>
  );
}
