import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search, X, Map, Play, StickyNote, Bookmark,
    ArrowRight, Command, CornerDownLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchResults } from "@/types/electron";

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResults | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Focus input when opening
    useEffect(() => {
        if (isOpen) {
            setQuery("");
            setResults(null);
            setSelectedIndex(0);
            // Small delay to let animation start
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Debounced search
    const performSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim() || !window.atlased) {
            setResults(null);
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        try {
            const data = await window.atlased.search.query(searchQuery.trim());
            setResults(data);
            setSelectedIndex(0);
        } catch (e) {
            console.error("Search failed:", e);
        } finally {
            setIsSearching(false);
        }
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!query.trim()) {
            setResults(null);
            return;
        }
        debounceRef.current = setTimeout(() => performSearch(query), 200);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, performSearch]);

    // Flatten results for keyboard navigation
    const flatResults = results
        ? [
            ...results.expeditions.map(r => ({ ...r, _nav: `/expedition/${r.id}` })),
            ...results.waypoints.map(r => ({ ...r, _nav: `/player/${r.id}` })),
            ...results.notes.map(r => ({ ...r, _nav: `/player/${r.waypoint_id}` })),
            ...results.bookmarks.map(r => ({ ...r, _nav: `/player/${r.waypoint_id}` })),
        ]
        : [];

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            onClose();
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, flatResults.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === "Enter" && flatResults[selectedIndex]) {
            e.preventDefault();
            navigateTo(flatResults[selectedIndex]._nav);
        }
    };

    // Scroll selected item into view
    useEffect(() => {
        if (listRef.current) {
            const selected = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
            selected?.scrollIntoView({ block: "nearest" });
        }
    }, [selectedIndex]);

    const navigateTo = (path: string) => {
        navigate(path);
        onClose();
    };

    const formatTimestamp = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${String(s).padStart(2, '0')}`;
    };

    // Highlight matching text
    const highlight = (text: string, q: string) => {
        if (!q.trim()) return text;
        const idx = text.toLowerCase().indexOf(q.toLowerCase());
        if (idx === -1) return text;
        return (
            <>
                {text.slice(0, idx)}
                <mark className="bg-atlas-gold/25 text-atlas-text-primary rounded-sm px-0.5">{text.slice(idx, idx + q.length)}</mark>
                {text.slice(idx + q.length)}
            </>
        );
    };

    // Get a snippet from note content around the match
    const getSnippet = (content: string, q: string, maxLen = 80) => {
        const lower = content.toLowerCase();
        const idx = lower.indexOf(q.toLowerCase());
        if (idx === -1) return content.slice(0, maxLen);
        const start = Math.max(0, idx - 30);
        const end = Math.min(content.length, idx + q.length + 50);
        let snippet = content.slice(start, end).replace(/\n/g, ' ');
        if (start > 0) snippet = '…' + snippet;
        if (end < content.length) snippet = snippet + '…';
        return snippet;
    };

    if (!isOpen) return null;

    const hasResults = results && (
        results.expeditions.length > 0 ||
        results.waypoints.length > 0 ||
        results.notes.length > 0 ||
        results.bookmarks.length > 0
    );
    const hasQuery = query.trim().length > 0;

    let flatIdx = 0;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in duration-150"
                onClick={onClose}
            />

            {/* Palette */}
            <div className="fixed inset-x-0 top-[15%] z-[101] flex justify-center px-4 animate-in fade-in slide-in-from-top-4 duration-200">
                <div className="w-full max-w-[560px] bg-atlas-bg-secondary border border-atlas-border rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">

                    {/* Search Input */}
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-atlas-border">
                        <Search className={cn(
                            "w-5 h-5 flex-shrink-0 transition-colors duration-200",
                            isSearching ? "text-atlas-gold animate-pulse" : "text-atlas-text-muted"
                        )} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Search expeditions, waypoints, notes…"
                            className="flex-1 bg-transparent text-base text-atlas-text-primary placeholder:text-atlas-text-muted/50 outline-none font-body"
                            autoComplete="off"
                            spellCheck={false}
                        />
                        {query && (
                            <button
                                onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                                className="text-atlas-text-muted hover:text-atlas-text-primary transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Results */}
                    <div ref={listRef} className="max-h-[400px] overflow-auto">
                        {!hasQuery && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-12 h-12 rounded-xl bg-atlas-bg-tertiary border border-atlas-border flex items-center justify-center mb-4">
                                    <Search className="w-5 h-5 text-atlas-text-muted" />
                                </div>
                                <p className="text-sm text-atlas-text-secondary font-medium mb-1">Quick Search</p>
                                <p className="text-xs text-atlas-text-muted max-w-[260px]">
                                    Find any expedition, waypoint, note, or bookmark across your entire library
                                </p>
                            </div>
                        )}

                        {hasQuery && !hasResults && !isSearching && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <p className="text-sm text-atlas-text-secondary mb-1">No results found</p>
                                <p className="text-xs text-atlas-text-muted">
                                    Try a different search term
                                </p>
                            </div>
                        )}

                        {hasResults && (
                            <div className="py-2">
                                {/* Expeditions */}
                                {results.expeditions.length > 0 && (
                                    <div className="mb-1">
                                        <p className="px-5 py-2 text-[10px] uppercase tracking-wider text-atlas-text-muted font-semibold">
                                            Expeditions
                                        </p>
                                        {results.expeditions.map((exp) => {
                                            const idx = flatIdx++;
                                            return (
                                                <button
                                                    key={exp.id}
                                                    data-index={idx}
                                                    onClick={() => navigateTo(`/expedition/${exp.id}`)}
                                                    className={cn(
                                                        "w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors duration-100",
                                                        idx === selectedIndex
                                                            ? "bg-atlas-gold/10"
                                                            : "hover:bg-atlas-bg-tertiary/50"
                                                    )}
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-atlas-bg-tertiary border border-atlas-border flex items-center justify-center flex-shrink-0">
                                                        <Map className="w-4 h-4 text-atlas-gold" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-atlas-text-primary truncate">
                                                            {highlight(exp.title, query)}
                                                        </p>
                                                    </div>
                                                    <ArrowRight className={cn(
                                                        "w-3.5 h-3.5 text-atlas-text-muted transition-all duration-200",
                                                        idx === selectedIndex ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"
                                                    )} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Waypoints */}
                                {results.waypoints.length > 0 && (
                                    <div className="mb-1">
                                        <p className="px-5 py-2 text-[10px] uppercase tracking-wider text-atlas-text-muted font-semibold">
                                            Waypoints
                                        </p>
                                        {results.waypoints.map((wp) => {
                                            const idx = flatIdx++;
                                            return (
                                                <button
                                                    key={wp.id}
                                                    data-index={idx}
                                                    onClick={() => navigateTo(`/player/${wp.id}`)}
                                                    className={cn(
                                                        "w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors duration-100",
                                                        idx === selectedIndex
                                                            ? "bg-atlas-gold/10"
                                                            : "hover:bg-atlas-bg-tertiary/50"
                                                    )}
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-atlas-bg-tertiary border border-atlas-border flex items-center justify-center flex-shrink-0">
                                                        <Play className="w-4 h-4 text-emerald-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-atlas-text-primary truncate">
                                                            {highlight(wp.title, query)}
                                                        </p>
                                                        <p className="text-[11px] text-atlas-text-muted truncate">{wp.expedition_title}</p>
                                                    </div>
                                                    {wp.is_charted === 1 && (
                                                        <span className="text-[10px] text-atlas-success font-medium bg-atlas-success/10 px-1.5 py-0.5 rounded">✓</span>
                                                    )}
                                                    <ArrowRight className={cn(
                                                        "w-3.5 h-3.5 text-atlas-text-muted transition-all duration-200",
                                                        idx === selectedIndex ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"
                                                    )} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Notes */}
                                {results.notes.length > 0 && (
                                    <div className="mb-1">
                                        <p className="px-5 py-2 text-[10px] uppercase tracking-wider text-atlas-text-muted font-semibold">
                                            Notes
                                        </p>
                                        {results.notes.map((note) => {
                                            const idx = flatIdx++;
                                            return (
                                                <button
                                                    key={note.id}
                                                    data-index={idx}
                                                    onClick={() => navigateTo(`/player/${note.waypoint_id}`)}
                                                    className={cn(
                                                        "w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors duration-100",
                                                        idx === selectedIndex
                                                            ? "bg-atlas-gold/10"
                                                            : "hover:bg-atlas-bg-tertiary/50"
                                                    )}
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-atlas-bg-tertiary border border-atlas-border flex items-center justify-center flex-shrink-0">
                                                        <StickyNote className="w-4 h-4 text-blue-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[11px] text-atlas-text-muted truncate mb-0.5">{note.waypoint_title}</p>
                                                        <p className="text-xs text-atlas-text-secondary truncate">
                                                            {highlight(getSnippet(note.content, query), query)}
                                                        </p>
                                                    </div>
                                                    <ArrowRight className={cn(
                                                        "w-3.5 h-3.5 text-atlas-text-muted transition-all duration-200",
                                                        idx === selectedIndex ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"
                                                    )} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Bookmarks */}
                                {results.bookmarks.length > 0 && (
                                    <div className="mb-1">
                                        <p className="px-5 py-2 text-[10px] uppercase tracking-wider text-atlas-text-muted font-semibold">
                                            Bookmarks
                                        </p>
                                        {results.bookmarks.map((bm) => {
                                            const idx = flatIdx++;
                                            return (
                                                <button
                                                    key={bm.id}
                                                    data-index={idx}
                                                    onClick={() => navigateTo(`/player/${bm.waypoint_id}`)}
                                                    className={cn(
                                                        "w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors duration-100",
                                                        idx === selectedIndex
                                                            ? "bg-atlas-gold/10"
                                                            : "hover:bg-atlas-bg-tertiary/50"
                                                    )}
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-atlas-bg-tertiary border border-atlas-border flex items-center justify-center flex-shrink-0">
                                                        <Bookmark className="w-4 h-4 text-purple-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-atlas-text-primary truncate">
                                                            {highlight(bm.label, query)}
                                                        </p>
                                                        <p className="text-[11px] text-atlas-text-muted truncate">
                                                            {bm.waypoint_title} · {formatTimestamp(bm.timestamp_seconds)}
                                                        </p>
                                                    </div>
                                                    <ArrowRight className={cn(
                                                        "w-3.5 h-3.5 text-atlas-text-muted transition-all duration-200",
                                                        idx === selectedIndex ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"
                                                    )} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer hints */}
                    <div className="flex items-center justify-between px-5 py-2.5 border-t border-atlas-border bg-atlas-bg-tertiary/30">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-[10px] text-atlas-text-muted">
                                <kbd className="px-1.5 py-0.5 rounded bg-atlas-bg-tertiary border border-atlas-border font-mono text-[10px]">↑↓</kbd>
                                <span>Navigate</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-atlas-text-muted">
                                <CornerDownLeft className="w-3 h-3" />
                                <span>Open</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-atlas-text-muted">
                            <kbd className="px-1.5 py-0.5 rounded bg-atlas-bg-tertiary border border-atlas-border font-mono text-[10px]">Esc</kbd>
                            <span>Close</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
