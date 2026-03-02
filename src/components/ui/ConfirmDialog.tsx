import { useEffect, useRef, useCallback } from "react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "default";
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "default",
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

    // Close on Escape
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") onCancel();
        },
        [onCancel]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
            return () => document.removeEventListener("keydown", handleKeyDown);
        }
    }, [isOpen, handleKeyDown]);

    // Close on backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onCancel();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={handleBackdropClick}
        >
            <div
                ref={dialogRef}
                className="bg-atlas-bg-secondary border border-atlas-border rounded-2xl shadow-2xl shadow-black/40 w-full max-w-md mx-4 animate-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="flex items-start gap-4 p-6 pb-0">
                    <div
                        className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                            variant === "danger"
                                ? "bg-red-500/10 border border-red-500/20"
                                : "bg-atlas-gold/10 border border-atlas-gold/20"
                        )}
                    >
                        <AlertTriangle
                            className={cn(
                                "w-5 h-5",
                                variant === "danger" ? "text-red-400" : "text-atlas-gold"
                            )}
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-display font-bold text-lg text-atlas-text-primary">
                            {title}
                        </h3>
                        <p className="text-sm text-atlas-text-secondary mt-1.5 leading-relaxed">
                            {message}
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-atlas-text-muted hover:text-atlas-text-primary transition-colors p-1 -m-1"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 p-6">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2.5 rounded-xl bg-atlas-bg-tertiary border border-atlas-border text-sm font-medium text-atlas-text-secondary hover:text-atlas-text-primary hover:border-atlas-text-muted transition-all duration-200"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={cn(
                            "px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
                            variant === "danger"
                                ? "bg-red-500 hover:bg-red-400 text-white"
                                : "bg-atlas-gold hover:bg-atlas-gold-hover text-atlas-bg-primary"
                        )}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
