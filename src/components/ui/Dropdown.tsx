import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropdownOption {
    value: string;
    label: string;
}

interface DropdownProps {
    value: string;
    options: DropdownOption[];
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function Dropdown({
    value,
    options,
    onChange,
    placeholder = "Select...",
    className,
}: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [isOpen]);

    const selectedOption = options.find((o) => o.value === value);

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                    "bg-atlas-bg-tertiary border border-atlas-border",
                    "hover:border-atlas-gold/50 focus:outline-none focus:border-atlas-gold/50",
                    isOpen && "border-atlas-gold/50",
                    "text-atlas-text-primary"
                )}
            >
                <span className={cn(!selectedOption && "text-atlas-text-muted")}>
                    {selectedOption?.label || placeholder}
                </span>
                <ChevronDown
                    className={cn(
                        "w-4 h-4 text-atlas-text-muted transition-transform duration-200",
                        isOpen && "rotate-180"
                    )}
                />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-atlas-bg-secondary border border-atlas-border rounded-xl shadow-2xl shadow-black/40 py-1 animate-in fade-in slide-in-from-top-1 duration-150 overflow-hidden">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={cn(
                                "w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors duration-100",
                                value === option.value
                                    ? "bg-atlas-gold/10 text-atlas-gold font-medium"
                                    : "text-atlas-text-secondary hover:text-atlas-text-primary hover:bg-atlas-bg-tertiary"
                            )}
                        >
                            <span className="flex-1 text-left">{option.label}</span>
                            {value === option.value && (
                                <Check className="w-3.5 h-3.5 text-atlas-gold" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
