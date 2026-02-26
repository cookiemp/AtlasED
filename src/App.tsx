import { useState, useEffect, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CommandPalette } from "@/components/CommandPalette";
import Dashboard from "./pages/Dashboard";
import ExpeditionView from "./pages/ExpeditionView";
import VideoPlayer from "./pages/VideoPlayer";
import Settings from "./pages/Settings";
import MemoryCheckpoints from "./pages/MemoryCheckpoints";
import KnowledgeGraph from "./pages/KnowledgeGraph";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setIsSearchOpen(prev => !prev);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/expedition/:id" element={<ExpeditionView />} />
              <Route path="/player/:id" element={<VideoPlayer />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/memory" element={<MemoryCheckpoints />} />
              <Route path="/atlas" element={<KnowledgeGraph />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
