import { Minus, Square, X, Copy } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

/**
 * Native-style window controls for Electron frameless window.
 * Renders minimize, maximize/restore, and close buttons.
 * 
 * Uses `window.atlased.window` IPC bridge (already wired in preload.cjs).
 */
export function WindowControls() {
    const [isMaximized, setIsMaximized] = useState(false);

    // Check initial maximized state — no Electron event listener needed,
    // we just toggle on click and track locally
    const handleMinimize = useCallback(() => {
        if (window.atlased?.window) {
            window.atlased.window.minimize();
        }
    }, []);

    const handleMaximize = useCallback(() => {
        if (window.atlased?.window) {
            window.atlased.window.maximize();
            setIsMaximized(prev => !prev);
        }
    }, []);

    const handleClose = useCallback(() => {
        if (window.atlased?.window) {
            window.atlased.window.close();
        }
    }, []);

    // Double-click on title bar area should also maximize
    useEffect(() => {
        const handleDblClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Only trigger on drag regions (the header bar itself, not buttons)
            if (target.closest('[data-window-drag]') && !target.closest('button') && !target.closest('a') && !target.closest('input')) {
                handleMaximize();
            }
        };
        document.addEventListener('dblclick', handleDblClick);
        return () => document.removeEventListener('dblclick', handleDblClick);
    }, [handleMaximize]);

    return (
        <div className="flex items-center gap-0" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            {/* Minimize */}
            <button
                onClick={handleMinimize}
                className="w-[46px] h-[34px] flex items-center justify-center text-atlas-text-muted hover:bg-white/[0.06] hover:text-atlas-text-secondary transition-colors duration-150"
                aria-label="Minimize"
            >
                <Minus className="w-4 h-4" strokeWidth={1.5} />
            </button>

            {/* Maximize / Restore */}
            <button
                onClick={handleMaximize}
                className="w-[46px] h-[34px] flex items-center justify-center text-atlas-text-muted hover:bg-white/[0.06] hover:text-atlas-text-secondary transition-colors duration-150"
                aria-label={isMaximized ? "Restore" : "Maximize"}
            >
                {isMaximized ? (
                    <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                ) : (
                    <Square className="w-3.5 h-3.5" strokeWidth={1.5} />
                )}
            </button>

            {/* Close */}
            <button
                onClick={handleClose}
                className="w-[46px] h-[34px] flex items-center justify-center text-atlas-text-muted hover:bg-[#e81123] hover:text-white transition-colors duration-150 rounded-tr-none"
                aria-label="Close"
            >
                <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
        </div>
    );
}
